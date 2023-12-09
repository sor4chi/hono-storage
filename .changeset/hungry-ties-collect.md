---
"@hono-storage/s3": patch
---

feat: support `signedUrl` for s3 storage.

```ts
import { S3Client } from "@aws-sdk/client-s3";
import { HonoS3Storage } from "@hono-storage/s3";
import { Hono } from "hono";

const client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "...",
    secretAccessKey: "...",
  },
});

const storage = new HonoS3Storage({
  bucket: "hono-storage",
  client,
});

const app = new Hono();

app.post(
  "/",
  storage.single("image", {
    sign: {
      expiresIn: 60,
    },
  }),
  (c) => {
    return c.json({ signedURL: c.var.signedURLs.image });
  },
);
```
