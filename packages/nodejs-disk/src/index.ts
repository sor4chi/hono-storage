import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { join } from "path";

import { HonoStorage as BaseHonoStorage } from "hono-storage";

interface HonoStorageOption {
  dest?: string;
}

export class HonoStorage extends BaseHonoStorage {
  private dest: string;

  constructor(option: HonoStorageOption = {}) {
    const { dest = "/tmp" } = option;

    super({
      storage: async (c, files) => {
        await mkdir(this.dest, { recursive: true });

        await Promise.all(
          files.map(async (file) => {
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
