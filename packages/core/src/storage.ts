import { HonoStorageFile } from "./file";

import type { MiddlewareHandler, Context } from "hono";

export type HonoStorageOptions = {
  storage?: (c: Context, files: HonoStorageFile[]) => Promise<void> | void;
};

export interface BaseFieldSchema {
  type: string;
}

export interface SingleFieldSchema extends BaseFieldSchema {
  type: "single";
}

export interface MultipleFieldSchema extends BaseFieldSchema {
  type: "multiple";
  maxCount?: number;
}

export type FieldSchema = SingleFieldSchema | MultipleFieldSchema;

type FieldValue = string | File;

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

  private handleMultipleStorage = async (
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
        [key in T]?: FieldValue;
      };
    };
  }> => {
    return async (c, next) => {
      const formData = await c.req.parseBody({ all: true });
      const value = formData[name];
      if (isFile(value)) {
        await this.handleSingleStorage(c, value);
      }

      c.set(FILES_KEY, {
        ...c.get(FILES_KEY),
        [name]: value,
      });

      await next();
    };
  };

  multiple = <T extends string>(
    name: T,
    maxCount?: number,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: {
        [key in T]: FieldValue[];
      };
    };
  }> => {
    return async (c, next) => {
      const formData = await c.req.parseBody({ all: true });
      const value = formData[name] ?? [];

      if (Array.isArray(value) && value.some(isFile)) {
        const filteredFiles = value.filter(isFile);
        if (maxCount && filteredFiles.length > maxCount) {
          throw new Error("Too many files");
        }
        await this.handleMultipleStorage(c, filteredFiles);
      }

      c.set(FILES_KEY, {
        ...c.get(FILES_KEY),
        [name]: value,
      });

      await next();
    };
  };

  fields = <T extends Record<string, FieldSchema>>(
    schema: T,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: {
        [key in keyof T]: T[key]["type"] extends "single"
          ? FieldValue
          : FieldValue[];
      };
    };
  }> => {
    return async (c, next) => {
      const formData = await c.req.parseBody({ all: true });
      const uploader: Promise<void>[] = [];
      const files: Record<string, FieldValue | FieldValue[]> = {};

      for (const name in schema) {
        const value = formData[name];
        const field = schema[name];

        if (field.type === "multiple") {
          const filedFiles: File[] = [];
          if (Array.isArray(value)) {
            filedFiles.push(...value.filter(isFile));
          } else if (isFile(value)) {
            filedFiles.push(value);
          }

          if (field.maxCount && filedFiles.length > field.maxCount) {
            throw new Error("Too many files");
          }
          uploader.push(this.handleMultipleStorage(c, filedFiles));
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
