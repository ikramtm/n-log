import "jest";
import {NLogger} from '../index';
import {mocked} from 'ts-jest/utils';

(global as any).console = {
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}

describe("NLogger", () => {
  it("should set correct log level", () => {
    const logger = NLogger.getLog("root");

    logger.debug("test");

    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveBeenCalledWith("test");
  });
});