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

  array = (key: string, maxCount?: number): MiddlewareHandler => {
    return async (c, next) => {
      const formData = await c.req.parseBody({ all: true });
      const files = formData[key];

      if (Array.isArray(files) && files.some(isBlob)) {
        const filteredFiles = files.filter(isBlob);
        if (maxCount && filteredFiles.length > maxCount) {
          throw new Error("Too many files");
        }
        await this.options.storage(c, filteredFiles as unknown as Blob[]);
      }

      await next();
    };
  };
}
