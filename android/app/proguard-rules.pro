# Keep WebView classes
-keepclassmembers class * extends android.webkit.WebView {
    public void onPageFinished(android.webkit.WebView, java.lang.String);
    public boolean shouldOverrideUrlLoading(android.webkit.WebView, android.webkit.WebResourceRequest);
}
