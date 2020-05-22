import "jest";
import {NLogger} from "../index";

(global as any).console = {
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn()
};

// FIXME: how do we re-initalize NLogger?

describe("NLogger", () => {
  it("should log at the correct level", () => {
    const logger = NLogger.getLog("root");

    logger.debug("test");

    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveBeenCalledWith("test");
  });

  it("should set correct log level", () => {
    const namespace = "contentfully:ContentfulClient";
    const message = "message";

    // set log level for namespace
    NLogger.setLogLevel("error", namespace);

    // get logger
    const logger = NLogger.getLog(namespace);

    // log info
    logger.info(message);

    // expectations
    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();

    // update log level
    NLogger.setLogLevel("warn", namespace);

    // log
    logger.info(message);
    logger.error(message);

    // expectations
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(namespace, message);

    expect(console.log).not.toHaveBeenCalled();
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  // it("should correctly update the loglevel for an existing namespace", () => {
  //   const nameSpace = "contentfully:ContentfulClient";
  //   const overwriteLogLevels = NLogger.setLogLevel("debug", nameSpace);
  //
  //   expect(overwriteLogLevels.length).toEqual(2);
  //   expect(overwriteLogLevels[1][0]).toEqual('debug');
  //   expect(overwriteLogLevels[1][1]).toEqual(nameSpace);
  // });
  //
  // it("should return partial match if namespace with wildcard is passed", () => {
  //   const overwriteLogLevels = NLogger.setLogLevel("warn","contentfully:*")
  //
  //   expect(overwriteLogLevels.length).toEqual(1);
  //   expect(overwriteLogLevels[0][1]).toEqual("contentfully:*");
  //   expect(overwriteLogLevels[0][0]).toEqual('warn');
  // });
  //
  // it("should reset the filtered log and logLevels when wildcard is passed", () => {
  //   const overwriteLogLevels = NLogger.setLogLevel("debug", "*");
  //
  //   expect(overwriteLogLevels[0][0]).toEqual("debug");
  //   expect(overwriteLogLevels[0][1]).toEqual("*");
  //   expect(overwriteLogLevels.length).toEqual(1);
  // });

});
