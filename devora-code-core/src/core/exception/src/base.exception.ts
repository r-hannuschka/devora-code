export class BaseException extends Error {
  protected readonly errorCode: number = 1;

  constructor(message: string, private readonly e?: Error) {
    super(message);
  }

  get code(): number {
    return this.errorCode;
  }

  get error(): Error | undefined {
    return this.e;
  }
}
