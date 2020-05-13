type LoggerPlugin = (logFn: LogFn) => LogFn;
type LogParameter = string | number | boolean | ReadonlyArray<any> | Readonly<any> | undefined;
// type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

enum LogLevel {
  trace,
  debug,
  info,
  warn,
  error
}

type LogLevelOption = "trace" | "debug" | "info" | "warn" | "error" | "silent";

type LogFn = (level: LogLevel, namespace: string, message: LogParameter, ...args: ReadonlyArray<LogParameter>) => void;

export interface ILog {
  trace(message: LogParameter, ...args: ReadonlyArray<LogParameter>): void;
  debug(message: LogParameter, ...args: ReadonlyArray<LogParameter>): void;
  info(message: Readonly<any>, ...args: ReadonlyArray<Readonly<any>>): void;
  warn(message: Readonly<any>, ...args: ReadonlyArray<Readonly<any>>): void;
  error(message: any, ...args: ReadonlyArray<Readonly<any>>): void;
}

class NLog implements ILog {

  private readonly _logFn: LogFn;
  private readonly _namespace: string;

  /** what's the default namespace for the root logger (probablty should't be here) */
  public constructor(logFn: LogFn, namespace: string = '*') {
    this._logFn = logFn;
    this._namespace = namespace;
  }

  trace(message: LogParameter, ...args: ReadonlyArray<LogParameter>) {
    this._logFn(LogLevel.trace, this._namespace, message, ...args);
  }

  debug(message: LogParameter, ...args: ReadonlyArray<LogParameter>) {
    this._logFn(LogLevel.debug, this._namespace, message, ...args);
  }

  info(message: Readonly<any>, ...args: ReadonlyArray<Readonly<any>>) {
    this._logFn(LogLevel.info, this._namespace, message, ...args);
  }

  warn(message: Readonly<any>, ...args: ReadonlyArray<Readonly<any>>) {
    this._logFn(LogLevel.warn, this._namespace, message, ...args);
  }

  error(message: any, ...args: ReadonlyArray<Readonly<any>>) {
    this._logFn(LogLevel.error, this._namespace, message, ...args);
  }
}

const BASE_LOG_FN = (level: LogLevel, message: LogParameter, ...args: ReadonlyArray<LogParameter>) => {
  switch (level) {
    case LogLevel.debug: {
      console.debug(message, ...args);
    }
    default: {
      console.log(message, ...args);
    }
  }
}


/**
 * Where's the validation and edge cases
 */
export class NLogger {

  public static readonly log: ILog = new NLog(NLogger._log);
  private static readonly _logs: Record<string, NLog> = {};
  private static readonly _logLevels = Array<[LogLevelOption, string]>();
  private static readonly _filteredLogs: Record<string, LogLevelOption> = {};
  private static _logFn: LogFn = BASE_LOG_FN;


  public static getLog(namespace: string): ILog {

    let log = this._logs[namespace];
    if (!log) {
      this._logs[namespace] = log = new NLog(NLogger._log, namespace);
      this._filteredLogs[namespace] = NLogger.getEnabledLogLevel(namespace);
    }

    return log;
  }

  public static setLogLevel(level: LogLevelOption, namespacePattern: string) {
    /*
      'contentfully:*, 'debug''


      [
        ['error', 'contentfully:service']
        ['trace', 'contentfully:service']
      ],
     */

    // TODO: remove namspace first
    let matchedIndex = -1;
    this._logLevels.forEach((logLevel, index) => {
      // TODO: how to account for namespace pattern? ie: [contentfully:*] vs [contentfully:Contentfully] 
      if (logLevel[1] === namespacePattern) {
        matchedIndex = index;
      }
    })

    if (matchedIndex > -1) {
      // does this need to be first in queue or simply replace?
      this._logLevels.splice(matchedIndex, 1, [level, namespacePattern]);
    } else {
      this._logLevels.unshift([level, namespacePattern]);
    }
    this._logLevels.forEach((logLevel) => {
      this._filteredLogs[logLevel[1]] = logLevel[0] 
    })
    return this._logLevels
    /** Don't screw this up... it's not simple */
    // TODO: rebuild the filtered logs mapping
  }

  public static addPlugin(plugin: LoggerPlugin) {
    NLogger._logFn = plugin(NLogger._logFn);
  }

  /** Don't screw this up... it's not simple */
  private static isMatch(namespacePattern: string, namespace: string) {
    // TODO: use some sort of regex or something to compare???
    return namespacePattern === namespace;
  }

  private static _log(level: LogLevel, namespace: string, message: LogParameter, ...args: ReadonlyArray<LogParameter>) {
    const enabledLevel = NLogger._filteredLogs[namespace];

    if (enabledLevel !== "silent" && level >= LogLevel[enabledLevel]) {
      NLogger._logFn(level, namespace, message, ...args);
    }
  }

  private static getEnabledLogLevel(namespace: string): LogLevelOption {
    return "debug";
  }
}

/*
// USAGE

// Decorator Pattern
// register plugin for prefixing
function prefixPlugin(logFn: LogFn) {
  return (level: LogLevel, namespace: string, message: LogParameter, ...args: ReadonlyArray<LogParameter>) => {
    logFn(level, namespace, `[PREFIX]: ${message}`, ...args);
  };
}
log.debug("message", 2);

// DEFAULT
NLogger.setLogLevel("error", "*");
NLogger.setLogLevel("debug", "contentfully:*");
NLogger.setLogLevel("info", "*");

const log = NLogger.getLog("contenfully");

NLogger.addPlugin(prefixPlugin);

*/
