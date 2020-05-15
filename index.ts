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
    if (this._logLevels.length === 0) { // 🤔🤔 the default _logLevel should be [["error", "*"]] right?
      this._logLevels.unshift([level, namespacePattern]);
    } else {
      if (namespacePattern === '*') {
        // overwrite the rest of namespaces from tuple and map
        this._logLevels.splice(0, this._logLevels.length, [level, namespacePattern]);
        // must be a better way to delete all the keys in map and update interface
        Object.keys(this._filteredLogs).forEach((logLevel) => {
          delete this._filteredLogs[logLevel]
        });
        this._filteredLogs[namespacePattern] = level
      } else {
        const partialMatches = []
        let matchIndex = -1
        this._logLevels.forEach((logLevel, index) => {
          const matchStatus = this.isMatch(namespacePattern, logLevel[1]);
          if (matchStatus === 1) {
            matchIndex = index;
          } else if (matchStatus === 0) {
            partialMatches.push(index);
          }
        })
        
        if (matchIndex !== -1) { // exact match
          this._logLevels.splice(matchIndex, 1, [level, namespacePattern]);
        } else if (partialMatches.length > 0) { // remove partial match and add wildcard namespace
          // loop from the back of partial matches array so that it doesn't mess up the index when deleting item in _logLevels
          for (let i = partialMatches.length -1; i >= 0; i--) {
            this._logLevels.splice(partialMatches[i],1);
          }
          this._logLevels.unshift([level, namespacePattern]);
        } else { // no match, simply add namespace to queue
          this._logLevels.unshift([level, namespacePattern]);
        }
      }
        
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
    const wildcardPresence = namespacePattern.slice(namespacePattern.length -1) === "*";
    if (!wildcardPresence) {
      return namespacePattern === namespace ? 1 : -1;
    } else {
      const [namespacePrefix] = namespace.split(":")
      const [namespacePatternPrefix] = namespacePattern.split(":")
      return namespacePrefix === namespacePatternPrefix ? 0 : -1
      // TODO: use some sort of regex or something to compare???
     /*
     given (contentfully:*, contentfully:ContentfullyClient)

     compare everything before colon to find partial match
     if match return result as partial match

     else return unmatch
     */
    }
  
  }

  private static _log(level: LogLevel, namespace: string, message: LogParameter, ...args: ReadonlyArray<LogParameter>) {
    const enabledLevel = NLogger._filteredLogs[namespace];

    if (enabledLevel !== "silent" && level >= LogLevel[enabledLevel]) {
      NLogger._logFn(level, namespace, message, ...args);
    }
  }

  private static getEnabledLogLevel(namespace: string): LogLevelOption {
    // in case setLogLevel was called first
    return this._filteredLogs[namespace] || "info";
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
NLogger.setLogLevel("info", "contentfully:ContenfullyClient");
NLogger.setLogLevel("info", "*");

covid:19
covid:20
covid:*

const log = NLogger.getLog("contenfully");

NLogger.addPlugin(prefixPlugin);

*/
