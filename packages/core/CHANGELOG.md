# @hono-storage/core

## 0.0.2

### Patch Changes

- [#7](https://github.com/sor4chi/hono-storage/pull/7) [`ea1eb7a`](https://github.com/sor4chi/hono-storage/commit/ea1eb7a533b8ba3d08acc80f92b8153a9048bfc9) Thanks [@sor4chi](https://github.com/sor4chi)! - file helper for HonoStorage

  ```ts
  import { HonoStorageFile } from "@hono-storage/core";

  const file = new File([blob], "filename.ext.zip");
  const HSfile = new HonoStorageFile(file);
  HSfile.originalname; // => name part of file (filename.ext)
  HSfile.extensiton; // => extension part of file (.zip)
  ```

## 0.0.1

### Patch Changes

- [`a7ade7f`](https://github.com/sor4chi/hono-storage/commit/a7ade7f3bb67cbf3b70efbdf91e9260043413f16) Thanks [@sor4chi](https://github.com/sor4chi)! - This is Hono Storage, a simple and easy to use file storage library.

  ```bash
  npm install @hono-storage/core
  ```

  ```ts
  import { HonoStorage } from "@hono-storage/core";
  import { Hono } from "hono";

  const app = new Hono();
  const storage = new HonoStorage({
    storage: (c, files) => {
      // do something with the files, eg, upload to s3, or save to local, etc.
    },
  });

  app.post("/upload/single", storage.single("image"), (c) => c.text("OK"));
  app.post("/upload/array", storage.array("pictures"), (c) => c.text("OK"));
  app.post(
    "/upload/field",
    storage.fields([
      { name: "image", maxCount: 1 },
      { name: "pictures", maxCount: 2 },
    ]),
    (c) => c.text("OK"),
  );

  // and you can get parsed formData easily
  app.post("/upload/vars", storage.single("image"), (c) => {
    const { image } = c.get("files");
    // do something with file
    return c.text("OK");
  });
  ```
