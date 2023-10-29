import {
  S3Client,
  PutObjectCommand,
  PutObjectRequest,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { HonoStorage, HonoStorageFile } from "@hono-storage/core";
import { Context } from "hono";

type HSSFunction<T> = (c: Context, file: HonoStorageFile) => T;
type UploadCustomParams = Omit<
  PutObjectRequest,
  "Bucket" | "Key" | "Body" | "ContentType" | "ContentLength"
>;
type RequestPresigningArguments = Parameters<typeof getSignedUrl>[2];

export type HonoS3StorageOptions = {
  key?: HSSFunction<string>;
  bucket: string | HSSFunction<string>;
  client: S3Client | HSSFunction<S3Client>;
  params?: UploadCustomParams;
};

const SIGN_CONFIG_KEY = "hono-storage-s3:sign-config";
export const SIGNED_URL_KEY = "signedUrls";

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

  async upload(
    c: Context<{
      Variables: {
        [SIGN_CONFIG_KEY]?: Record<string, RequestPresigningArguments>;
        [SIGNED_URL_KEY]?: Record<string, string>;
      };
    }>,
    file: HonoStorageFile,
  ) {
    const key = this.key(c, file);
    const bucket =
      typeof this.bucket === "function" ? this.bucket(c, file) : this.bucket;

    // for nodejs
    const isBufferExists = typeof Buffer !== "undefined";

    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: isBufferExists ? Buffer.from(await file.arrayBuffer()) : file,
      ContentType: file.type,
      ContentLength: file.size,
      ...this.params,
    });

    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const client =
      typeof this.client === "function" ? this.client(c, file) : this.client;

    const signConfig = c.get(SIGN_CONFIG_KEY) ?? {};
    const sign = signConfig[file.field.name];

    await client.send(putCommand);

    if (sign) {
      const signedUrl = await getSignedUrl(client, getCommand, sign);
      c.set(SIGNED_URL_KEY, {
        ...(c.get(SIGNED_URL_KEY) ?? {}),
        [key]: signedUrl,
      });
    }
  }
}
