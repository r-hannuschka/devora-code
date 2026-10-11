import { BaseException } from "@/core/exception";

export class StorageNotFoundException extends BaseException {
  protected errorCode = 1;

  constructor(message = "Speicher nicht geladen") {
    super(message);
  }
}
