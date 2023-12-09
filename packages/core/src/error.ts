export class HonoStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HonoStorageError";
  }
}

export const Errors = {
  TooManyFiles: new HonoStorageError("Too many files"),
};
