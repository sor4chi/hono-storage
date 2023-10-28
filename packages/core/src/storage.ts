import { HonoStorageFile } from "./file";

import type { MiddlewareHandler, Context } from "hono";
import type { BodyData } from "hono/utils/body";

export type HonoStorageOptions = {
  storage?: (c: Context, files: HonoStorageFile[]) => Promise<void> | void;
};

interface BaseFieldSchema {
  type: string;
}

interface SingleFieldSchema extends BaseFieldSchema {
  type: "single";
}

interface MultipleFieldSchema extends BaseFieldSchema {
  type: "multiple";
  maxCount?: number;
}

export type FieldSchema = SingleFieldSchema | MultipleFieldSchema;

export type FieldSchemas = Record<string, FieldSchema>;

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
      await this.options.storage(c, [new HonoStorageFile(file)]);
    }
  };

  private handleArrayStorage = async (
    c: Context,
    files: File[],
  ): Promise<void> => {
    if (this.options.storage) {
      await this.options.storage(
        c,
        files.map((file) => new HonoStorageFile(file)),
      );
    }
  };

  single = <T extends string>(
    name: T,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: {
        [K in T]: File | string;
      };
    };
  }> => {
    return async (c, next) => {
      const formData = await c.req.parseBody({ all: true });
      const fileOrFiles = formData[name];
      const files: BodyData = {};

      if (isFile(fileOrFiles)) {
        await this.handleSingleStorage(c, fileOrFiles);

        files[name] = fileOrFiles;
      }

      c.set(FILES_KEY, {
        ...c.get(FILES_KEY),
        ...files,
      });

      await next();
    };
  };

  array = <T extends string>(
    name: T,
    maxCount?: number,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: {
        [K in T]: (File | string)[];
      };
    };
  }> => {
    return async (c, next) => {
      const formData = await c.req.parseBody({ all: true });
      const fileOrFiles = formData[name];
      const files: BodyData = {};

      if (Array.isArray(fileOrFiles) && fileOrFiles.some(isFile)) {
        const filteredFiles = fileOrFiles.filter(isFile) as unknown as File[];
        if (maxCount && filteredFiles.length > maxCount) {
          throw new Error("Too many files");
        }
        await this.handleArrayStorage(c, filteredFiles);

        files[name] = fileOrFiles;
      }

      c.set(FILES_KEY, {
        ...c.get(FILES_KEY),
        ...files,
      });

      await next();
    };
  };

  fields = <T extends FieldSchemas>(
    schema: T,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: {
        [K in keyof T]: T[K] extends { type: "single" }
          ? File | string
          : (File | string)[];
      };
    };
  }> => {
    return async (c, next) => {
      const formData = await c.req.parseBody({ all: true });
      const uploader: Promise<void>[] = [];
      const files: BodyData = {};

      for (const name in schema) {
        const value = formData[name];
        const field = schema[name];

        if (field.type === "multiple") {
          const filedFiles: File[] = [];
          if (Array.isArray(value)) {
            for (const file of value) {
              if (isFile(file)) {
                filedFiles.push(file);
              }
            }
          } else if (isFile(value)) {
            filedFiles.push(value);
          }

          if (field.maxCount && filedFiles.length > field.maxCount) {
            throw new Error("Too many files");
          }
          uploader.push(this.handleArrayStorage(c, filedFiles));
          files[name] = [value].flat();
          continue;
        }

        if (field.type === "single") {
          if (isFile(value)) {
            uploader.push(this.handleSingleStorage(c, value));
          }
          files[name] = value;
          continue;
        }
      }

      await Promise.all(uploader);

      c.set(FILES_KEY, {
        ...c.get(FILES_KEY),
        ...files,
      });

      await next();
    };
  };
}
