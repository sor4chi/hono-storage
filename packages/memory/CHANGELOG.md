# @hono-storage/memory

## 0.0.8

### Patch Changes

- [`628e0dc`](https://github.com/sor4chi/hono-storage/commit/628e0dcd6b48953db1d212e317c1d470499780e3) Thanks [@sor4chi](https://github.com/sor4chi)! - fix package.json

- Updated dependencies [[`628e0dc`](https://github.com/sor4chi/hono-storage/commit/628e0dcd6b48953db1d212e317c1d470499780e3)]:
  - @hono-storage/core@0.0.9

## 0.0.7

### Patch Changes

- Updated dependencies [[`0fffc7f`](https://github.com/sor4chi/hono-storage/commit/0fffc7f76152df882b15398014ca8aa331a6ff12)]:
  - @hono-storage/core@0.0.8

## 0.0.6

### Patch Changes

- Updated dependencies [[`17d6090`](https://github.com/sor4chi/hono-storage/commit/17d609093ade861c93eaac5418ca0a7debb7bebb), [`0d257d4`](https://github.com/sor4chi/hono-storage/commit/0d257d42f158bc4485e907d601a6541d0f25a923)]:
  - @hono-storage/core@0.0.7

## 0.0.5

### Patch Changes

- Updated dependencies [[`acf1f0d`](https://github.com/sor4chi/hono-storage/commit/acf1f0de6d1c88224182ead9aff3578c5c8842d4), [`6da696f`](https://github.com/sor4chi/hono-storage/commit/6da696f952a6bfeac95725bd077deebba9da8591)]:
  - @hono-storage/core@0.0.6

## 0.0.4

### Patch Changes

- Updated dependencies [[`51fa375`](https://github.com/sor4chi/hono-storage/commit/51fa3752a49ddb7403edb57b0f1a1feaf154978b)]:
  - @hono-storage/core@0.0.5

## 0.0.3

### Patch Changes

- Updated dependencies [[`07d2d99`](https://github.com/sor4chi/hono-storage/commit/07d2d99cdf20a1694cc03c965da773754ad6fa61)]:
  - @hono-storage/core@0.0.4

## 0.0.2

### Patch Changes

- [`f03e4a4`](https://github.com/sor4chi/hono-storage/commit/f03e4a41d705fa8883cef1dce85784825ea05eae) Thanks [@sor4chi](https://github.com/sor4chi)! - Update hono version to 3.8.1

- Updated dependencies [[`f03e4a4`](https://github.com/sor4chi/hono-storage/commit/f03e4a41d705fa8883cef1dce85784825ea05eae)]:
  - @hono-storage/core@0.0.3

## 0.0.1

### Patch Changes

- [#9](https://github.com/sor4chi/hono-storage/pull/9) [`845d497`](https://github.com/sor4chi/hono-storage/commit/845d497f8f0c604dd81839150cdc7c8de5104c66) Thanks [@sor4chi](https://github.com/sor4chi)! - Introduced a new storage called `MemoryStorage`!

  This storage is useful for testing and prototyping, but should not be used in production.

  ```ts
  import { serve } from "@hono/node-server";
  import { HonoMemoryStorage } from "@hono-storage/memory";
  import { Hono } from "hono";

  const app = new Hono();
  const storage = new HonoMemoryStorage({
    key: (c, file) => `${file.originalname}-${new Date()}`,
  });

  app.post("/", storage.single("file"), (c) => c.text("OK"));
  app.get("/list", (c) => c.json(storage.buffer.forEach((file) => file.name)));

  serve(app);
  ```
