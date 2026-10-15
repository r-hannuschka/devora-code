import { BaseException } from "@/core/exception";

export class StorageWriteException extends BaseException {
  protected errorCode = 3;

  constructor(message = "Konnte Daten nicht speichern", e?: Error) {
    super(message, e);
  }
}
