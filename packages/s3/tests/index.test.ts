import { S3Client } from "@aws-sdk/client-s3";

import { HonoS3Storage } from "../src";

describe("HonoS3Storage", () => {
  it("should be able to create a new instance", () => {
    const client = new S3Client();
    const storage = new HonoS3Storage({
      bucket: "hono-storage",
      client,
    });

    expect(storage).toBeInstanceOf(HonoS3Storage);
  });
});
