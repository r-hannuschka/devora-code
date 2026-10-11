import { BaseException } from "@/core/exception";

export class EntryNotFoundException extends BaseException {
  protected errorCode = 2;

  constructor(message = "Eintrag nicht gefunden") {
    super(message);
  }
}
