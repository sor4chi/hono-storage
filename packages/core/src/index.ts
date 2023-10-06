import type { MiddlewareHandler, Context } from "hono";

export type HonoStorageOptions = {
  storage: (c: Context, files: Blob[]) => Promise<void> | void;
};

export type FieldSchema = {
  name: string;
  maxCount?: number;
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

  fields = (schema: FieldSchema[]): MiddlewareHandler => {
    return async (c, next) => {
      for (const { name, maxCount } of schema) {
        const formData = await c.req.parseBody({ all: true });
        const fileOrFiles = formData[name];

        if (Array.isArray(fileOrFiles) && fileOrFiles.some(isBlob)) {
          const filteredFiles = fileOrFiles.filter(isBlob);
          if (maxCount && filteredFiles.length > maxCount) {
            throw new Error("Too many files");
          }
          await this.options.storage(c, filteredFiles as unknown as Blob[]);
        } else if (isBlob(fileOrFiles)) {
          await this.options.storage(c, [fileOrFiles]);
        }
      }

      await next();
    };
  };
}
