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

  info(message: LogParameter, ...args: ReadonlyArray<LogParameter>): void;

  warn(message: LogParameter, ...args: ReadonlyArray<LogParameter>): void;

  error(message: LogParameter, ...args: ReadonlyArray<LogParameter>): void;
}

class NLog implements ILog {

  private readonly _logFn: LogFn;
  private readonly _namespace: string;

  /** what's the default namespace for the root logger (probablty should't be here) */
  public constructor(logFn: LogFn, namespace: string = "*") {
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
      break;
    }
    case LogLevel.warn: {
      console.warn(message, ...args);
      break;
    }
    case LogLevel.error: {
      console.error(message, ...args);
      break;
    }
    default: {
      console.log(message, ...args);
    }
  }
};

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
    // find existing log level by namespace pattern
    const existing = this._logLevels.find(logLevel => {
      return logLevel[1] === namespacePattern;
    });

    // if not already existing
    if (existing === undefined) {
      // add to front of log levels
      this._logLevels.unshift([level, namespacePattern]);
      this._filteredLogs[namespacePattern] = level;
    }

    this._logLevels.forEach((logLevel) => {
      const namespace = logLevel[1];
      if (this.matchesNamespace(namespacePattern, namespace)) {
        logLevel[0] = level;
        this._filteredLogs[namespacePattern] = level;
      }
    });
  }

  public static addPlugin(plugin: LoggerPlugin) {
    NLogger._logFn = plugin(NLogger._logFn);
  }

  /** Don't screw this up... it's not simple */
  private static matchesNamespace(updated: string, current: string): boolean {
    // if pattern is wildcard or matches exactly
    if (updated === "*" || updated === current) {
      // matches
      return true;
    }

    // create array of split namespaces by separator
    const updatedNamespacesSplit = this.splitNamespaceBySeparator(updated);
    const currentNamespacesSplit = this.splitNamespaceBySeparator(current);

    // iterate through namespaces
    for (let i = 0; i < updatedNamespacesSplit.length; i++) {
      // if namespace is wildcard
      if (updatedNamespacesSplit[i] === "*") {
        // match
        return true;
      }
      // if namespace matches current namespace
      if (updatedNamespacesSplit[i] === currentNamespacesSplit[i]) {
        // if namespace is at last index
        if (i === updatedNamespacesSplit.length - 1) {
          // match
          return i === currentNamespacesSplit.length - 1;
        }
        // continue iterating
        continue;
      }
      // does not match
      return false;
    }

    // fallback, should not reach here
    return false;
  }

  private static _log(level: LogLevel, namespace: string, message: LogParameter, ...args: ReadonlyArray<LogParameter>) {
    const enabledLevel = NLogger._filteredLogs[namespace];

    if (enabledLevel !== "silent" && level >= LogLevel[enabledLevel]) {
      NLogger._logFn(level, namespace, message, ...args);
    }
  }

  private static getEnabledLogLevel(namespace: string): LogLevelOption {
    const level = this._filteredLogs[namespace];

    // if namespace is set exactly
    if (level) {
      // return level
      return level;
    }

    /*
      NLogger.setLogLevel('error', '*')
    * NLogger.setLogLevel('error', 'contentful:*')
    *
    * NLogger.getLog("react")
    * Nlogger.getLog("contentful:service")
    * Nlogger.getLog("contentful:service:client:file")
    * */

    // split namespace by separator
    // const splitNamespace = this.splitNamespaceBySeparator(namespace);
    // let index = splitNamespace.length - 1;
    //
    // while (index >= 0) {
    //   const wildcardNamespace = namespace.replace(splitNamespace[index], "*");
    //
    //   const wildcard = this._filteredLogs[wildcardNamespace];
    //
    //   // if wildcard namespace is set
    //   if (wildcard) {
    //     // return level
    //     return wildcard;
    //   }
    // }


    // return default level
    return "info";
  }

  private static splitNamespaceBySeparator(namespace) {
    return namespace.split(":");
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
