import {
  S3Client,
  PutObjectCommand,
  PutObjectRequest,
} from "@aws-sdk/client-s3";
import { HonoStorage, HonoStorageFile } from "@hono-storage/core";
import { Context } from "hono";

type HSSFunction<T> = (c: Context, file: HonoStorageFile) => T;
type UploadCustomParams = Omit<
  PutObjectRequest,
  "Bucket" | "Key" | "Body" | "ContentType" | "ContentLength"
>;

export type HonoS3StorageOptions = {
  key?: HSSFunction<string>;
  bucket: string | HSSFunction<string>;
  client: S3Client | HSSFunction<S3Client>;
  params?: UploadCustomParams;
};

export class HonoS3Storage extends HonoStorage {
  key: HSSFunction<string>;
  bucket: string | HSSFunction<string>;
  client: S3Client | HSSFunction<S3Client>;
  params?: UploadCustomParams;

  constructor(options: HonoS3StorageOptions) {
    super({
      storage: async (c, files) => {
        await Promise.all(
          files.map(async (file) => {
            await this.upload(c, file);
          }),
        );
      },
    });

    this.key = options.key ?? ((_, file) => file.name);
    this.bucket = options.bucket;
    this.client = options.client;
    this.params = options.params;
  }

  async upload(c: Context, file: HonoStorageFile) {
    const key = this.key(c, file);
    const bucket =
      typeof this.bucket === "function" ? this.bucket(c, file) : this.bucket;

    // for nodejs
    const isBufferExists = typeof Buffer !== "undefined";

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: isBufferExists ? Buffer.from(await file.arrayBuffer()) : file,
      ContentType: file.type,
      ContentLength: file.size,
      ...this.params,
    });

    if (typeof this.client === "function") {
      await this.client(c, file).send(command);
    } else {
      await this.client.send(command);
    }
  }
}
