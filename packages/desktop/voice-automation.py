#!/usr/bin/env python3
"""
Eburon Codebox — Voice Automation Creator
Uses Gemini Live API to create automations via voice conversation.
Runs alongside the Electron app. Communicates via HTTP to create automations.

Usage:
  python3 voice-automation.py
  python3 voice-automation.py --mode screen  # share screen too
"""

import os
import sys
import json
import asyncio
import base64
import io
import traceback
import argparse
import urllib.request

import cv2
import pyaudio
import PIL.Image

from google import genai
from google.genai import types

FORMAT = pyaudio.paInt16
CHANNELS = 1
SEND_SAMPLE_RATE = 16000
RECEIVE_SAMPLE_RATE = 24000
CHUNK_SIZE = 1024

MODEL = "models/gemini-3.1-flash-live-preview"
DEFAULT_MODE = "camera"

client = genai.Client(
    http_options={"api_version": "v1beta"},
    api_key=os.environ.get("GEMINI_API_KEY"),
)

SYSTEM_INSTRUCTION = """You are a voice assistant for Eburon Codebox, an AI coding agent desktop app.
Your ONLY job is to help the user create automations via voice conversation.

An automation has:
- name: short descriptive title
- prompt: what the agent should do on each run
- schedule: cron expression (e.g. "0 9 * * *" for daily at 9am)

When the user describes what they want automated:
1. Extract the name, prompt, and schedule from the conversation
2. Confirm with the user before creating
3. When confirmed, output EXACTLY this JSON on its own line:
   {"action":"create_automation","name":"...","prompt":"...","schedule":"..."}

Do NOT create automations without confirmation.
Keep responses brief and conversational since this is voice.
"""

TOOLS = [
    types.Tool(
        function_declarations=[
            {
                "name": "create_automation",
                "description": "Create a new scheduled automation in Eburon Codebox",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Automation name"},
                        "prompt": {"type": "string", "description": "What the agent should do"},
                        "schedule": {"type": "string", "description": "Cron expression"},
                    },
                    "required": ["name", "prompt", "schedule"],
                },
            }
        ]
    ),
]

CONFIG = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    media_resolution="MEDIA_RESOLUTION_MEDIUM",
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Aoede")
        )
    ),
    system_instruction=types.Content(
        parts=[types.Part.from_text(SYSTEM_INSTRUCTION)]
    ),
    tools=TOOLS,
)

pya = pyaudio.PyAudio()


class VoiceAutomationCreator:
    def __init__(self, video_mode=DEFAULT_MODE, api_url="http://localhost:5173"):
        self.video_mode = video_mode
        self.api_url = api_url
        self.audio_in_queue = None
        self.out_queue = None
        self.session = None
        self.audio_stream = None

    def _call_api(self, endpoint, data):
        """Call the Electron app's API to create an automation."""
        try:
            req = urllib.request.Request(
                f"{self.api_url}/api/{endpoint}",
                data=json.dumps(data).encode(),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                return json.loads(resp.read())
        except Exception as e:
            print(f"[api] Error calling {endpoint}: {e}")
            return None

    async def send_text(self):
        while True:
            text = await asyncio.to_thread(input, "message > ")
            if text.lower() == "q":
                break
            if self.session is not None:
                await self.session.send(input=text or ".", end_of_turn=True)

    def _get_frame(self, cap):
        ret, frame = cap.read()
        if not ret:
            return None
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = PIL.Image.fromarray(frame_rgb)
        img.thumbnail([1024, 1024])
        image_io = io.BytesIO()
        img.save(image_io, format="jpeg")
        image_io.seek(0)
        mime_type = "image/jpeg"
        image_bytes = image_io.read()
        return {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode()}

    async def get_frames(self):
        cap = await asyncio.to_thread(cv2.VideoCapture, 0)
        while True:
            frame = await asyncio.to_thread(self._get_frame, cap)
            if frame is None:
                break
            await asyncio.sleep(1.0)
            if self.out_queue is not None:
                await self.out_queue.put(frame)
        cap.release()

    def _get_screen(self):
        try:
            import mss
        except ImportError:
            raise ImportError("Please install mss: pip install mss")
        sct = mss.mss()
        monitor = sct.monitors[0]
        i = sct.grab(monitor)
        mime_type = "image/jpeg"
        image_bytes = mss.tools.to_png(i.rgb, i.size)
        img = PIL.Image.open(io.BytesIO(image_bytes))
        image_io = io.BytesIO()
        img.save(image_io, format="jpeg")
        image_io.seek(0)
        image_bytes = image_io.read()
        return {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode()}

    async def get_screen(self):
        while True:
            frame = await asyncio.to_thread(self._get_screen)
            if frame is None:
                break
            await asyncio.sleep(1.0)
            if self.out_queue is not None:
                await self.out_queue.put(frame)

    async def send_realtime(self):
        while True:
            if self.out_queue is not None:
                msg = await self.out_queue.get()
                if self.session is not None:
                    await self.session.send(input=msg)

    async def listen_audio(self):
        mic_info = pya.get_default_input_device_info()
        self.audio_stream = await asyncio.to_thread(
            pya.open,
            format=FORMAT,
            channels=CHANNELS,
            rate=SEND_SAMPLE_RATE,
            input=True,
            input_device_index=mic_info["index"],
            frames_per_buffer=CHUNK_SIZE,
        )
        kwargs = {"exception_on_overflow": False} if __debug__ else {}
        while True:
            data = await asyncio.to_thread(self.audio_stream.read, CHUNK_SIZE, **kwargs)
            if self.out_queue is not None:
                await self.out_queue.put({"data": data, "mime_type": "audio/pcm"})

    async def receive_audio(self):
        while True:
            if self.session is not None:
                turn = self.session.receive()
                async for response in turn:
                    if data := response.data:
                        self.audio_in_queue.put_nowait(data)
                        continue
                    if text := response.text:
                        print(text, end="")
                        # Check for function call
                        if response.function_call:
                            fc = response.function_call
                            if fc.name == "create_automation":
                                args = fc.args
                                print(f"\n[automation] Creating: {args.get('name')}")
                                result = self._call_api("automations", args)
                                if result:
                                    print(f"[automation] Created: {result.get('id')}")
                                await self.session.send(
                                    input=types.LiveClientToolResponse(
                                        function_responses=[
                                            types.FunctionResponse(
                                                name="create_automation",
                                                response={
                                                    "success": result is not None,
                                                    "id": result.get("id") if result else None,
                                                },
                                            )
                                        ]
                                    )
                                )

                while not self.audio_in_queue.empty():
                    self.audio_in_queue.get_nowait()

    async def play_audio(self):
        stream = await asyncio.to_thread(
            pya.open,
            format=FORMAT,
            channels=CHANNELS,
            rate=RECEIVE_SAMPLE_RATE,
            output=True,
        )
        while True:
            if self.audio_in_queue is not None:
                bytestream = await self.audio_in_queue.get()
                await asyncio.to_thread(stream.write, bytestream)

    async def run(self):
        try:
            async with (
                client.aio.live.connect(model=MODEL, config=CONFIG) as session,
                asyncio.TaskGroup() as tg,
            ):
                self.session = session
                self.audio_in_queue = asyncio.Queue()
                self.out_queue = asyncio.Queue(maxsize=5)

                tg.create_task(self.send_text())
                tg.create_task(self.send_realtime())
                tg.create_task(self.listen_audio())
                if self.video_mode == "camera":
                    tg.create_task(self.get_frames())
                elif self.video_mode == "screen":
                    tg.create_task(self.get_screen())

                tg.create_task(self.receive_audio())
                tg.create_task(self.play_audio())

                await asyncio.Future()

        except asyncio.CancelledError:
            pass
        except ExceptionGroup as EG:
            if self.audio_stream is not None:
                self.audio_stream.close()
                traceback.print_exception(EG)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Eburon Codebox Voice Automation Creator")
    parser.add_argument("--mode", type=str, default=DEFAULT_MODE, choices=["camera", "screen", "none"])
    parser.add_argument("--api-url", type=str, default="http://localhost:5173", help="Electron app URL")
    args = parser.parse_args()
    main = VoiceAutomationCreator(video_mode=args.mode, api_url=args.api_url)
    asyncio.run(main.run())
