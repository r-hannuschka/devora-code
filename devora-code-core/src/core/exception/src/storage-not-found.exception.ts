import { BaseException } from "@/infrastructure/exception";

export class StorageNotFoundException extends BaseException {
  protected errorCode = 1;

  constructor(message = "Speicher nicht geladen") {
    super(message);
  }
}
