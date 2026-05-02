type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data !== undefined ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  debug(message: string, data?: unknown): void {
    console.log(this.formatMessage('debug', message, data));
  }

  info(message: string, data?: unknown): void {
    console.log(this.formatMessage('info', message, data));
  }

  warn(message: string, data?: unknown): void {
    console.warn(this.formatMessage('warn', message, data));
  }

  error(message: string, data?: unknown): void {
    console.error(this.formatMessage('error', message, data));
  }
}

export const logger = new Logger();
