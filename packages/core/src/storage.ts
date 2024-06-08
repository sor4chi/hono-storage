import { Errors } from "./error";
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

export type FieldValue = string | File;

const isFile = (value: unknown): value is File => {
  return value instanceof File;
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
    fieldName: string,
  ): Promise<void> => {
    if (this.options.storage) {
      await this.options.storage(c, [
        new HonoStorageFile(file, {
          name: fieldName,
          type: "single",
        }),
      ]);
    }
  };

  private handleMultipleStorage = async (
    c: Context,
    files: File[],
    fieldName: string,
  ): Promise<void> => {
    if (this.options.storage) {
      await this.options.storage(
        c,
        files.map(
          (file) =>
            new HonoStorageFile(file, {
              name: fieldName,
              type: "multiple",
            }),
        ),
      );
    }
  };

  single = <T extends string>(
    name: T,
    _options?: Omit<SingleFieldSchema, "type">,
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
        await this.handleSingleStorage(c, value, name);
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
    options?: Omit<MultipleFieldSchema, "type">,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: {
        [key in T]: FieldValue[];
      };
    };
  }> => {
    return async (c, next) => {
      const formData = await c.req.parseBody({ all: true });
      const value = formData[name];
      const filedFiles: File[] = [];

      if (Array.isArray(value)) {
        filedFiles.push(...value.filter(isFile));
      } else if (isFile(value)) {
        filedFiles.push(value);
      }

      if (options?.maxCount && filedFiles.length > options.maxCount) {
        throw new Error("Too many files");
      }

      await this.handleMultipleStorage(c, filedFiles, name);

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
          ? FieldValue | undefined
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
            throw Errors.TooManyFiles;
          }
          uploader.push(this.handleMultipleStorage(c, filedFiles, name));
          files[name] = [value].flat();
          continue;
        }

        if (field.type === "single") {
          if (isFile(value)) {
            uploader.push(this.handleSingleStorage(c, value, name));
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
