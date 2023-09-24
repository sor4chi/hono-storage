import { Context } from "hono";

type HonoStorageOptionsRequired =
  | {
      dest: string;
    }
  | {
      storage: (c: Context) => Promise<void> | void;
    };

type HonoStorageOptions = HonoStorageOptionsRequired;

export class HonoStorage {
  private options: HonoStorageOptions;

  constructor(options: HonoStorageOptions) {
    this.options = options;
  }
}
