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
    const nameSpace = "contentfully:";
    const logLevels = NLogger.setLogLevel("info", nameSpace);

    expect(logLevels.length).toEqual(1);
    expect(logLevels[0][0]).toEqual('info');
    expect(logLevels[0][1]).toEqual(nameSpace);

    const additionalNameSpace = "nascent-web:";
    const updatedLogLevels = NLogger.setLogLevel("trace", additionalNameSpace);

    expect(updatedLogLevels.length).toEqual(2);
    expect(updatedLogLevels[0][0]).toEqual('trace');
    expect(updatedLogLevels[0][1]).toEqual(additionalNameSpace);

    const overwriteLogLevels = NLogger.setLogLevel("debug", nameSpace);

    expect(overwriteLogLevels.length).toEqual(2);
    expect(overwriteLogLevels[1][0]).toEqual('debug');
    expect(overwriteLogLevels[1][1]).toEqual(nameSpace);
  });
});
