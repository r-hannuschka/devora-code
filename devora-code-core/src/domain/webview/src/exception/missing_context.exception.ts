import { BaseException } from "@/core/exception";
import { WEBVIEW_ERROR_CODE } from "./error.code";

export class WebviewMissingContextException extends BaseException {
  protected errorCode = WEBVIEW_ERROR_CODE.MISSING_PAYLOAD;

  constructor() {
    super("Payload ist erforderlich");
  }
}
