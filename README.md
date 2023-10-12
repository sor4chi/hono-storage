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
npm install @hono-storage/node-disk
```

## Usage

```ts
import { Hono } from "hono";

const app = new Hono();

/** If you use normal HonoStorage */
import { HonoStorage } from "@hono-storage/core";
const storage = new HonoStorage({
  storage: (c, files) => {
    // do something with the files, eg, upload to s3, or save to local, etc.
  },
});

/** If you use HonoStorage for Node.js */
import { HonoDiskStorage } from "@hono-storage/node-disk";
const storage = new HonoDiskStorage({
  dest: "./uploads",
  filename: (c, file) => `${file.originalname}-${Date.now()}.${file.extension}`,
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

// serve app
```
