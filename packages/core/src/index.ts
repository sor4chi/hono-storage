import type { MiddlewareHandler, Context } from "hono";
import type { BodyData } from "hono/utils/body";
// import { File } from "@web-std/file";

export type HonoStorageOptions = {
  storage?: (c: Context, files: File[]) => Promise<void> | void;
};

export type FieldSchema = {
  name: string;
  maxCount?: number;
};

const isFile = (value: unknown): value is File => {
  if (typeof value !== "object" || value === null) return false;
  // HELP ME: instanceof File is not working because node <= 20 doesn't have File :(
  return value instanceof Blob && value.constructor.name === "File";
};

export const FILES_KEY = "files";

export class HonoStorage {
  options: HonoStorageOptions;

  constructor(options?: HonoStorageOptions) {
    this.options = options ?? {};
  }

  private handleSingleStorage = async (
    c: Context,
    file: File,
  ): Promise<void> => {
    if (this.options.storage) {
      await this.options.storage(c, [file]);
    }
  };

  private handleArrayStorage = async (
    c: Context,
    files: File[],
    maxCount?: number,
  ): Promise<void> => {
    if (maxCount && files.length > maxCount) {
      throw new Error("Too many files");
    }

    if (this.options.storage) {
      await this.options.storage(c, files);
    }
  };

  single = (
    name: string,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: BodyData;
    };
  }> => {
    return async (c, next) => {
      const formData = await c.req.parseBody({ all: true });
      const file = formData[name];

      if (isFile(file)) {
        await this.handleSingleStorage(c, file);

        c.set(FILES_KEY, {
          ...c.get(FILES_KEY),
          [name]: file,
        });
      }

      await next();
    };
  };

  array = (
    name: string,
    maxCount?: number,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: BodyData;
    };
  }> => {
    return async (c, next) => {
      const formData = await c.req.parseBody({ all: true });
      const files = formData[name];

      if (Array.isArray(files) && files.some(isFile)) {
        const filteredFiles = files.filter(isFile) as unknown as File[];
        await this.handleArrayStorage(c, filteredFiles, maxCount);

        c.set(FILES_KEY, {
          ...c.get(FILES_KEY),
          [name]: files,
        });
      }

      await next();
    };
  };

  fields = (
    schema: FieldSchema[],
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: BodyData;
    };
  }> => {
    return async (c, next) => {
      for (const { name, maxCount } of schema) {
        const formData = await c.req.parseBody({ all: true });
        const fileOrFiles = formData[name];
        let isValidFile = false;

        if (Array.isArray(fileOrFiles) && fileOrFiles.some(isFile)) {
          const filteredFiles = fileOrFiles.filter(isFile) as unknown as File[];
          await this.handleArrayStorage(c, filteredFiles, maxCount);
          isValidFile = true;
        } else if (isFile(fileOrFiles)) {
          await this.handleSingleStorage(c, fileOrFiles);
          isValidFile = true;
        }

        if (isValidFile) {
          c.set(FILES_KEY, {
            ...c.get(FILES_KEY),
            [name]: fileOrFiles,
          });
        }
      }

      await next();
    };
  };
}
