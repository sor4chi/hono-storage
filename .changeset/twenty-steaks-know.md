---
"@hono-storage/core": patch
---

This is Hono Storage, a simple and easy to use file storage library.

```bash
npm install @hono-storage/core
```

```ts
import { HonoStorage } from '@hono-storage/core';
import { Hono } from 'hono';

const app = new Hono();
const storage = new HonoStorage({
  storage: (c, files) => {
    // do something with the files, eg, upload to s3, or save to local, etc.
  },
});

app.post("/upload/single", storage.single("image"), (c) => c.text("OK"));
app.post("/upload/array", storage.array("pictures"), (c) => c.text("OK"));
app.post("/upload/field", storage.fields([
  { name: "image", maxCount: 1 },
  { name: "pictures", maxCount: 2 },
]), (c) => c.text("OK"));

// and you can get parsed formData easily
app.post("/upload/vars", storage.single("image"), (c) => {
  const { image } = c.get("files")
  // do something with file
  return c.text("OK");
});
```
