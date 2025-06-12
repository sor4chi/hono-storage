import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { join } from "path";

import {
  FieldSchema,
  FieldValue,
  FILES_KEY,
  HonoStorage,
  HonoStorageFile,
  MultipleFieldSchema,
} from "@hono-storage/core";
import { File } from "@web-std/file";

import type { Context, MiddlewareHandler } from "hono";

const FILE_NAMES_KEY = "fileNames";

type HDSCustomFunction = (
  c: Context,
  file: HonoStorageFile,
) => Promise<string> | string;

interface HonoDiskStorageOption {
  dest?: string | HDSCustomFunction;
  filename?: HDSCustomFunction;
}

export class HonoDiskStorage {
  private storage: HonoStorage;

  constructor(option: HonoDiskStorageOption = {}) {
    const { dest = "/tmp" } = option;

    this.storage = new HonoStorage({
      storage: async (c, files) => {
        await Promise.all(
          files.map(async (file) => {
            const finalDest =
              typeof dest === "function" ? await dest(c, file) : dest;
            await mkdir(finalDest, { recursive: true });
            if (option.filename) {
              const savedFileName = await option.filename(c, file);
              await this.handleDestStorage(
                finalDest,
                new File([file], savedFileName),
              );

              const fileNames = c.get(FILE_NAMES_KEY) ?? {};
              c.set(FILE_NAMES_KEY, {
                ...fileNames,
                [file.field.name]: (() => {
                  const targetFilenameField = fileNames[file.field.name] ?? [];

                  if (file.field.type === "single") {
                    return savedFileName;
                  }

                  return [...targetFilenameField, savedFileName];
                })(),
              });
            } else {
              await this.handleDestStorage(
                finalDest,
                new File([file], file.name),
              );
            }
          }),
        );
      },
    });
  }

  handleDestStorage = async (dest: string, file: File) => {
    const writeStream = createWriteStream(join(dest, file.name));
    const reader = file.stream().getReader();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      writeStream.write(value);
    }
    writeStream.end();
  };

  single = <T extends string>(
    name: T,
    options?: Omit<MultipleFieldSchema, "type">,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: {
        [key in T]?: FieldValue;
      };
      [FILE_NAMES_KEY]: {
        [key in T]: string;
      };
    };
  }> => {
    return async (c, next) => {
      c.set(FILE_NAMES_KEY, {
        ...(c.get(FILE_NAMES_KEY) ?? {}),
      });

      await this.storage.single(name, options)(c as Context, next);
    };
  };

  multiple = <T extends string>(
    name: T,
    options?: Omit<MultipleFieldSchema, "type">,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: {
        [key in T]?: FieldValue;
      };
      [FILE_NAMES_KEY]: {
        [key in T]: string[];
      };
    };
  }> => {
    return async (c, next) => {
      c.set(FILE_NAMES_KEY, {
        ...(c.get(FILE_NAMES_KEY) ?? {}),
      });

      await this.storage.multiple(name, options)(c as Context, next);
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
      [FILE_NAMES_KEY]: {
        [key in keyof T]: T[key]["type"] extends "single" ? string : string[];
      };
    };
  }> => {
    return async (c, next) => {
      c.set(FILE_NAMES_KEY, {
        ...(c.get(FILE_NAMES_KEY) ?? {}),
      });

      await this.storage.fields(schema)(c as Context, next);
    };
  };
}
