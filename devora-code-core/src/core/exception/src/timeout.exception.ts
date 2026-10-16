import { BaseException } from "./base.exception";
import { ERROR_CODE } from "./error.code";

export class TimeoutException extends BaseException {
  protected errorCode = ERROR_CODE.TIMEOUT;
}