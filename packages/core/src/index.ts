import type { MiddlewareHandler, Context } from "hono";

type HonoStorageOptions = {
  storage: (c: Context, files: Blob[]) => Promise<void> | void;
};

const isBlob = (value: unknown): value is Blob => {
  return value instanceof Blob;
};

export class HonoStorage {
  options: HonoStorageOptions;

  constructor(options: HonoStorageOptions) {
    this.options = options;
  }

  single = (key: string): MiddlewareHandler => {
    return async (c, next) => {
      const formData = await c.req.parseBody({ all: true });
      const file = formData[key];

      if (isBlob(file)) {
        await this.options.storage(c, [file]);
      }

      await next();
    };
  };
}
