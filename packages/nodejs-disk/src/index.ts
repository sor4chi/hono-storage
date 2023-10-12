import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { join } from "path";

import { HonoStorage } from "@hono-storage/core";
import { Context } from "hono";

interface HonoDiskStorageOption {
  dest?: string;
  filename?: (c: Context, file: Blob) => string;
}

export class HonoDiskStorage extends HonoStorage {
  private dest: string;

  constructor(option: HonoDiskStorageOption = {}) {
    const { dest = "/tmp" } = option;

    super({
      storage: async (c, files) => {
        await mkdir(this.dest, { recursive: true });

        await Promise.all(
          files.map(async (file) => {
            if (option.filename) {
              await this.handleDestStorage(
                new File([file], option.filename(c, file)),
              );
            }
            await this.handleDestStorage(file);
          }),
        );
      },
    });

    this.dest = dest;
  }

  private handleDestStorage = async (file: Blob) => {
    const writeStream = createWriteStream(join(this.dest, file.name));
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
