# Hono Storage

Hono Storage is a storage helper for [Hono](https://github.com/honojs/hono), this module is like [multer](https://github.com/expressjs/multer) in expressjs.

> [!WARNING]
> This is a work in progress. The code is not yet ready for production use.

## Installation

```bash
npm install @hono-storage/core
```

### Helper

you can use helper to install storage for Hono.

```bash
npm install @hono-storage/node-disk # for nodejs disk storage
npm install @hono-storage/memory # for in-memory storage
npm install @hono-storage/s3 # for s3 storage (or r2 storage)
```

## Usage

```ts
import { Hono } from "hono";

const app = new Hono();

const storage = // your storage, see below

app.post("/upload/single", storage.single("image"), (c) => c.text("OK"));
app.post("/upload/multiple", storage.multiple("pictures"), (c) => c.text("OK"));
app.post(
  "/upload/field",
  storage.fields({
    image: { type: "single" },
    pictures: { type: "multiple", maxCount: 2 },
  }),
  (c) => c.text("OK"),
);

// and you can get parsed formData easily
app.post("/upload/vars", storage.single("image"), (c) => {
  const { image } = c.var.files;
  // do something with file
  return c.text("OK");
});

// serve app
```

### Storage

<details>
  <summary>Normal Storage</summary>

  ```ts
  import { HonoStorage } from "@hono-storage/core";

  const storage = new HonoStorage({
    storage: (c, files) => {
      // do something with the files, eg, upload to s3, or save to local, etc.
    },
  });
  ```
</details>

<details>
  <summary>Node.js Disk Storage</summary>

  ```ts
  import { HonoDiskStorage } from "@hono-storage/node-disk";

  const storage = new HonoDiskStorage({
    dest: "./uploads",
    filename: (c, file) => `${file.originalname}-${new Date().getTime()}.${file.extension}`,
  });
```

</details>

<details>
  <summary>In-Memory Storage</summary>

  ```ts
  import { HonoMemoryStorage } from "@hono-storage/memory";

  const storage = new HonoMemoryStorage({
    key: (c, file) => `${file.originalname}-${new Date().getTime()}`,
  });
  ```

</details>

<details>
  <summary>S3 Storage (Also R2)</summary>

  ```ts
  import { S3Client } from "@aws-sdk/client-s3";
  import { HonoS3Storage } from "@hono-storage/s3";

  /** if you use S3 */
  const client = new S3Client({
    region: "[your-bucket-region]",
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  /** if you use R2 */
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });

  const storage = new HonoS3Storage({
    key: (_, file) => `${file.originalname}-${new Date().getTime()}.${file.extension}`,
    bucket: "[your-bucket-name]",
    client,
  });
  ```

</details>


You want to find more? Check out the [examples](./examples)!

## License

[MIT](./LICENSE)

## Contributing

This project is open for contributions. Feel free to open an issue or a pull request!
