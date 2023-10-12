# @hono-storage/node-disk

## 0.0.1

### Patch Changes

- [`472a0a3`](https://github.com/sor4chi/hono-storage/commit/472a0a39cd750b3483d01c5b72bec816c7b8cac9) Thanks [@sor4chi](https://github.com/sor4chi)! - This is Hono Storage for Node.js, a simple and easy to use file storage library.

  ```bash
  npm install @hono-storage/node-disk
  ```

  ```ts
  import { serve } from "@hono/node-server";
  import { HonoStorage } from "@hono-storage/node-disk";
  import { Hono } from "hono";

  const app = new Hono();
  const storage = new HonoStorage({
    dest: "./uploads",
    filename: (c, file) =>
      `${file.originalname}-${Date.now()}.${file.extension}`,
  });

  app.post("/upload", storage.single("image"), (c) => c.text("OK"));

  serve(app);
  ```

- Updated dependencies [[`a7ade7f`](https://github.com/sor4chi/hono-storage/commit/a7ade7f3bb67cbf3b70efbdf91e9260043413f16)]:
  - @hono-storage/core@0.0.1