import "jest";
import {NLogger} from '../index';
import {mocked} from 'ts-jest/utils';

(global as any).console = {
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn()
  };

describe("NLogger", () => {
  it("should log at the correct level", () => {
    const logger = NLogger.getLog("root");

    logger.debug("test");

    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveBeenCalledWith("test");
  });

  it("should set correct log level", () => {
    const nameSpace = "contentfully:ContentfulClient";
    const logLevels = NLogger.setLogLevel("info", nameSpace);

    expect(logLevels.length).toEqual(1);
    expect(logLevels[0][0]).toEqual('info');
    expect(logLevels[0][1]).toEqual(nameSpace);

    const additionalNameSpace = "contentfully:index";
    const updatedLogLevels = NLogger.setLogLevel("trace", additionalNameSpace);

    expect(updatedLogLevels.length).toEqual(2);
    expect(updatedLogLevels[0][0]).toEqual('trace');
    expect(updatedLogLevels[0][1]).toEqual(additionalNameSpace);
  });

  it("should correctly update the loglevel for an exisiting namespace", () => {
    const nameSpace = "contentfully:ContentfulClient";
    const overwriteLogLevels = NLogger.setLogLevel("debug", nameSpace);

    expect(overwriteLogLevels.length).toEqual(2);
    expect(overwriteLogLevels[1][0]).toEqual('debug');
    expect(overwriteLogLevels[1][1]).toEqual(nameSpace);
  });
  
  it("should return partial match if namespace with wildcard is passed", () => {
    const overwriteLogLevels = NLogger.setLogLevel("warn","contentfully:*")

    expect(overwriteLogLevels.length).toEqual(1);
    expect(overwriteLogLevels[0][1]).toEqual("contentfully:*");
    expect(overwriteLogLevels[0][0]).toEqual('warn');
  });

  it("should reset the filtered log and logLevels when wildcard is passed", () => {
    const overwriteLogLevels = NLogger.setLogLevel("debug", "*");

    expect(overwriteLogLevels[0][0]).toEqual("debug");
    expect(overwriteLogLevels[0][1]).toEqual("*");
    expect(overwriteLogLevels.length).toEqual(1);
  });

});
