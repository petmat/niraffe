export interface ILogger {
  LogDebug(message: string): void;
  LogError(err: Error, message: string): void;
  IsEnabled(level: LogLevel): boolean;
}

export enum LogLevel {
  Trace,
  Debug,
  Information,
  Warning,
  Error,
  Critical,
  None,
}

export interface ILoggerFactory {
  CreateLogger(): ILogger;
}

export class Logger implements ILogger {
  private level: LogLevel;

  constructor() {
    this.level = LogLevel.Debug;
  }

  IsEnabled(level: LogLevel) {
    return this.level <= level;
  }

  LogDebug(message: string) {
    console.debug(message);
  }
  LogError(err: Error, message: string) {
    console.log(`Error: ${err.name}: \n${message}\n${err}`);
  }
}

export class LoggerFactory implements ILoggerFactory {
  CreateLogger() {
    return new Logger();
  }
}
