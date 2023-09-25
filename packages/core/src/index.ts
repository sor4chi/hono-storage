import { MiddlewareHandler } from "hono";

type HonoStorageOptions = {
  storage: (files: File[]) => Promise<void> | void;
};

const isFile = (value: unknown): value is File => {
  return value instanceof File;
};

export class HonoStorage {
  options: HonoStorageOptions;

  constructor(options: HonoStorageOptions) {
    this.options = options;
  }

  single = (key: string): MiddlewareHandler => {
    return async (c, next) => {
      const formData = await c.req.parseBody();
      const file = formData[key];
      if (isFile(file)) {
        await this.options.storage([file]);
      }

      await next();
    };
  };

  multiple = (key: string): MiddlewareHandler => {
    return async (c, next) => {
      const formData = await c.req.parseBody();
      const files = formData[key];
      if (Array.isArray(files) && files.every(isFile)) {
        await this.options.storage(files as unknown as File[]);
      }

      await next();
    };
  };
}
