import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { RequestPresigningArguments } from "@smithy/types";

import {
  BaseHonoS3Storage,
  HonoS3StorageOptions,
  IS3Repository,
} from "./storage";

class S3Repository implements IS3Repository {
  async put(client: S3Client, command: PutObjectCommand): Promise<void> {
    await client.send(command);
  }
  async getSingedURL(
    client: S3Client,
    command: GetObjectCommand,
    sign: RequestPresigningArguments,
  ): Promise<string> {
    return await getSignedUrl(client, command, sign);
  }
}

export class HonoS3Storage extends BaseHonoS3Storage {
  constructor(options: HonoS3StorageOptions) {
    super(options, new S3Repository());
  }
}
