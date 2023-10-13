import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { join } from "path";

import { HonoStorage } from "@hono-storage/core";
import { File } from "@web-std/file";
import { Context } from "hono";

import { HDSFile } from "./file";

type HDSCustomFunction = (c: Context, file: HDSFile) => string;

interface HonoDiskStorageOption {
  dest?: string | HDSCustomFunction;
  filename?: HDSCustomFunction;
}

export class HonoDiskStorage extends HonoStorage {
  private dest: string | ((c: Context, file: HDSFile) => string);

  constructor(option: HonoDiskStorageOption = {}) {
    const { dest = "/tmp" } = option;

    super({
      storage: async (c, files) => {
        await Promise.all(
          files.map(async (file) => {
            const dest =
              typeof this.dest === "function"
                ? this.dest(c, new HDSFile(file))
                : this.dest;
            await mkdir(dest, { recursive: true });
            if (option.filename) {
              await this.handleDestStorage(
                dest,
                new File([file], option.filename(c, new HDSFile(file))),
              );
            } else {
              await this.handleDestStorage(dest, new File([file], file.name));
            }
          }),
        );
      },
    });

    this.dest = dest;
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
