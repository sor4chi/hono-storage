# @hono-storage/s3

## 0.0.2

### Patch Changes

- [`f03e4a4`](https://github.com/sor4chi/hono-storage/commit/f03e4a41d705fa8883cef1dce85784825ea05eae) Thanks [@sor4chi](https://github.com/sor4chi)! - Update hono version to 3.8.1

- Updated dependencies [[`f03e4a4`](https://github.com/sor4chi/hono-storage/commit/f03e4a41d705fa8883cef1dce85784825ea05eae)]:
  - @hono-storage/core@0.0.3

## 0.0.1

### Patch Changes

- [#12](https://github.com/sor4chi/hono-storage/pull/12) [`ec74110`](https://github.com/sor4chi/hono-storage/commit/ec741102219a960c5a0e8317b0eda3ce4e3f4a14) Thanks [@sor4chi](https://github.com/sor4chi)! - A S3 helper for Hono Storage. Use `@aws-sdk/client-s3` as client.

  ```ts
  import { S3Client } from "@aws-sdk/client-s3";
  import { HonoS3Storage } from "@hono-storage/s3";
  import { Hono } from "hono";

  const app = new Hono();

  /** For Dynamic Client */
  const client = (accessKeyId: string, secretAccessKey: string) =>
    new S3Client({
      region: "[your-bucket-region-name]",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

  const storage = new HonoS3Storage({
    key: (_, file) => `${file.originalname}-${new Date().getTime()}`,
    bucket: "[your-bucket-name]",
    client: (c) => client(c.env.AWS_ACCESS_KEY_ID, c.env.AWS_SECRET_ACCESS_KEY),
  });

  /** For Static Client */
  const storage = new HonoS3Storage({
    key: (_, file) => `${file.originalname}-${new Date().getTime()}`,
    bucket: "[your-bucket-name]",
    client: new S3Client({
      region: "[your-bucket-region-name]",
      credentials: {
        accessKeyId: "[your-access-key-id]",
        secretAccessKey: "[your-secret-access-key]",
      },
    }),
  });

  app.post("/", storage.single("file"), (c) => c.text("OK"));

  export default app;
  ```
