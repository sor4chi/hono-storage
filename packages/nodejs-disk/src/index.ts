import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { join } from "path";

import { HonoStorage as BaseHonoStorage } from "hono-storage";

interface HonoStorageOption {
  dest?: string;
  storage?: "parallel" | "series";
}

export class HonoStorage extends BaseHonoStorage {
  private dest: string;

  constructor(option: HonoStorageOption) {
    const { dest = "/tmp", storage = "parallel" } = option;

    super({
      storage: async (c, files) => {
        await mkdir(this.dest, { recursive: true });
        switch (storage) {
          case "parallel":
            this.parallelStorage(files);
            break;
          case "series":
            this.seriesStorage(files);
            break;
          default:
            throw new Error(storage satisfies never);
        }
      },
    });

    this.dest = dest;
  }

  private parallelStorage = async (files: File[]) => {
    await Promise.all(
      files.map(async (file) => {
        await this.handleDestStorage(file);
      }),
    );
  };

  private seriesStorage = async (files: File[]) => {
    for (const file of files) {
      await this.handleDestStorage(file);
    }
  };

  private handleDestStorage = async (file: File) => {
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
