import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { HonoStorageFile } from "@hono-storage/core";
import { RequestPresigningArguments } from "@smithy/types";
import { Context } from "hono";

import {
  BaseHonoS3Storage,
  HonoS3StorageOptions,
  IS3Repository,
} from "./storage";

class S3Repository implements IS3Repository {
  private client: S3Client;

  constructor(client: S3Client) {
    this.client = client;
  }

  async put(command: PutObjectCommand): Promise<void> {
    await this.client.send(command);
  }

  async getSingedURL(
    command: GetObjectCommand,
    sign: RequestPresigningArguments,
  ): Promise<string> {
    return await getSignedUrl(this.client, command, sign);
  }
}

export class HonoS3Storage extends BaseHonoS3Storage {
  constructor(options: HonoS3StorageOptions) {
    const client = options.client;

    if (typeof client !== "function") {
      super(options, new S3Repository(client));
      return;
    }

    super(
      options,
      (c: Context, file: HonoStorageFile) => new S3Repository(client(c, file)),
    );
  }
}
