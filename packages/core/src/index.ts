import type { MiddlewareHandler, Context } from "hono";
import type { BodyData } from "hono/utils/body";

export type HonoStorageOptions = {
  storage?: (c: Context, files: Blob[]) => Promise<void> | void;
};

export type FieldSchema = {
  name: string;
  maxCount?: number;
};

const isBlob = (value: unknown): value is Blob => {
  return value instanceof Blob;
};

export const FILES_KEY = "files";

export class HonoStorage {
  options: HonoStorageOptions;

  constructor(options?: HonoStorageOptions) {
    this.options = options ?? {};
  }

  private handleSingleStorage = async (
    c: Context,
    file: Blob,
  ): Promise<void> => {
    if (this.options.storage) {
      await this.options.storage(c, [file]);
    }
  };

  private handleArrayStorage = async (
    c: Context,
    files: Blob[],
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

      if (isBlob(file)) {
        await this.handleSingleStorage(c, file);
      }

      c.set(FILES_KEY, {
        ...c.get(FILES_KEY),
        [name]: file,
      });

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

      if (Array.isArray(files) && files.some(isBlob)) {
        const filteredFiles = files.filter(isBlob) as unknown as Blob[];
        await this.handleArrayStorage(c, filteredFiles, maxCount);
      }

      c.set(FILES_KEY, {
        ...c.get(FILES_KEY),
        [name]: files,
      });

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

        if (Array.isArray(fileOrFiles) && fileOrFiles.some(isBlob)) {
          const filteredFiles = fileOrFiles.filter(isBlob) as unknown as Blob[];
          await this.handleArrayStorage(c, filteredFiles, maxCount);
        } else if (isBlob(fileOrFiles)) {
          await this.handleSingleStorage(c, fileOrFiles);
        }

        c.set(FILES_KEY, {
          ...c.get(FILES_KEY),
          [name]: fileOrFiles,
        });
      }

      await next();
    };
  };
}
