type LoggerPlugin = (logFn: LogFn) => LogFn;
type LogParameter = string | number | boolean | ReadonlyArray<any> | Readonly<any> | undefined;
type LogLevel = "trace" | "debug" | "info" | "warn" | "error";
type LogLevelOption = "trace" | "debug" | "info" | "warn" | "error" | "silent";

type LogFn = (level: LogLevel, namespace: string, message: LogParameter, ...args: ReadonlyArray<LogParameter>) => void;

export interface ILog {
  trace(message: LogParameter, ...args: ReadonlyArray<LogParameter>): void;
  debug(message: LogParameter, ...args: ReadonlyArray<LogParameter>): void;
  info(message: Readonly<any>, ...args: ReadonlyArray<Readonly<any>>): void;
  warn(message: Readonly<any>, ...args: ReadonlyArray<Readonly<any>>): void;
  error(message:any, ...args: ReadonlyArray<Readonly<any>>): void;
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
    this._logFn("trace", this._namespace, message, ...args);
  }
  debug(message: LogParameter, ...args: ReadonlyArray<LogParameter>) {
    this._logFn("debug", this._namespace, message, ...args);
  }
  info(message: Readonly<any>, ...args: ReadonlyArray<Readonly<any>>) {}
  warn(message: Readonly<any>, ...args: ReadonlyArray<Readonly<any>>) {}
  error(message:any, ...args: ReadonlyArray<Readonly<any>>) {}
}

const BASE_LOG_FN = (level: LogLevel, message: LogParameter, ...args: ReadonlyArray<LogParameter>) => {
  switch (level) {
    case "debug": {
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
  private static readonly _logLevels = Array<[LogLevel, string]>();
  private static readonly _filteredLogs: Record<string, LogLevelOption> = {};
  private static _logFn: LogFn = BASE_LOG_FN;


  public static getLog(namespace: string): ILog {

    let log = this._logs[namespace];
    if (!log) {
      this._logs[namespace] = log = new NLog(NLogger._log);
      this._filteredLogs[namespace] = NLogger.getEnabledLogLevel(namespace);
    }

    return log;
  }

  public static setLogLevel(level: LogLevelOption, namespacePattern: string) {

    // TODO: remove namspace first

    this._logLevels.unshift([level, namespacePattern]);

    /** Don't screw this up... it's not simple */
    // TODO: rebuild the filtered logs mapping
  }

  public static addPlugin(plugin: LoggerPlugin) {
      NLogger._logFn = plugin(NLogger._logFn);
  }

  /** Don't screw this up... it's not simple */
  private static isMatch(nanmespacePattern: string, namsepace: string) {
    // TODO: use some sort of regex or something to compare???
    return nanmespacePattern === namsepace;
  }

  private static _log(level: LogLevel, namespace: string, message: LogParameter, ...args: ReadonlyArray<LogParameter>) {

    const enabledLevel = NLogger._filteredLogs[namespace];
    if (level >= enabledLevel) {
      NLogger._logFn(level, namespace, message, ...args);        
    }
  }
}


// USAGE

// Decorator Pattern
// register plugin for prefixing
function prefixPlugin(logFn: LogFn) {
  return (level: LogLevel, namespace: string, message: LogParameter, ...args: ReadonlyArray<LogParameter>) => {
    logFn(level, namespace, `[PREFIX]: ${message}`, ...args);
  };
}

const log = NLogger.getLog("contenfully");
log.debug("message", 2);

// DEFAULT
NLogger.setLogLevel("error", "*");
NLogger.setLogLevel("debug", "contentfully:*");
NLogger.setLogLevel("info", "*");

NLogger.addPlugin(prefixPlugin);

