declare module 'cron-parser' {
  interface CronFields {
    second: number[]
    minute: number[]
    hour: number[]
    dayOfMonth: number[]
    month: number[]
    dayOfWeek: number[]
  }

  interface ParserOptions {
    currentDate?: Date | string | number
    startDate?: Date | string | number
    endDate?: Date | string | number
    iterator?: boolean
    utc?: boolean
    tz?: string
  }

  interface CronExpression {
    next(): { value?: Date; done?: boolean }
    prev(): { value?: Date; done?: boolean }
    hasNext(): boolean
    hasPrev(): boolean
    take(n: number): Date[]
    reset(): void
    stringify(): string
    fields: CronFields
  }

  interface CronExpressionParser {
    parse(expression: string, options?: ParserOptions): CronExpression
  }

  const parser: CronExpressionParser
  export = parser
}
