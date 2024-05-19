import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { join } from "path";

import { HonoStorage, HonoStorageFile } from "@hono-storage/core";
import { File } from "@web-std/file";

import type { Context } from "hono";

type HDSCustomFunction = (
  c: Context,
  file: HonoStorageFile,
) => Promise<string> | string;

interface HonoDiskStorageOption {
  dest?: string | HDSCustomFunction;
  filename?: HDSCustomFunction;
}

export class HonoDiskStorage extends HonoStorage {
  constructor(option: HonoDiskStorageOption = {}) {
    const { dest = "/tmp" } = option;

    super({
      storage: async (c, files) => {
        await Promise.all(
          files.map(async (file) => {
            const finalDest =
              typeof dest === "function" ? await dest(c, file) : dest;
            await mkdir(finalDest, { recursive: true });
            if (option.filename) {
              await this.handleDestStorage(
                finalDest,
                new File([file], await option.filename(c, file)),
              );
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
}
