# @hono-storage/node-disk

## 0.0.3

### Patch Changes

- Updated dependencies [[`ea1eb7a`](https://github.com/sor4chi/hono-storage/commit/ea1eb7a533b8ba3d08acc80f92b8153a9048bfc9)]:
  - @hono-storage/core@0.0.2

## 0.0.2

### Patch Changes

- [#3](https://github.com/sor4chi/hono-storage/pull/3) [`da24913`](https://github.com/sor4chi/hono-storage/commit/da249130275d6a2c2827f17cdd1778bfb2fe34f9) Thanks [@sor4chi](https://github.com/sor4chi)! - Support more dynamic dest path.
  You can decide the dest path by the context and file.

  ## Before

  ```ts
  const storage = new NodeDiskStorage({
    dest: "/path/to/dest",
  });
  ```

  ## After

  Also support function.

  ```ts
  const storage = new NodeDiskStorage({
    dest: (c, file) => {
      return "/path/to/dest";
    },
  });
  ```

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
