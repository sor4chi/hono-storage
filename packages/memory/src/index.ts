import { HonoStorage, HonoStorageFile } from "@hono-storage/core";
import { Context } from "hono";

type HMSFunction = (c: Context, file: HonoStorageFile) => string;

export type HonoMemoryStorageOptions = {
  key?: HMSFunction;
};

export class HonoMemoryStorage extends HonoStorage {
  buffer: Map<string, Blob>;
  key: HMSFunction;

  constructor(options: HonoMemoryStorageOptions = {}) {
    super({
      storage: async (c, files) => {
        files.forEach((file) => {
          this.buffer.set(this.key(c, file), file);
        });
      },
    });

    this.key = options.key ?? ((_, file) => file.name);
    this.buffer = new Map();
  }
}
