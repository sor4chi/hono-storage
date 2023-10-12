---
"@hono-storage/node-disk": patch
---

This is Hono Storage for Node.js, a simple and easy to use file storage library.

```bash
npm install @hono-storage/node-disk
```

```ts
import { serve } from '@hono/node-server';
import { HonoStorage } from '@hono-storage/node-disk';
import { Hono } from 'hono';

const app = new Hono();
const storage = new HonoStorage({
    dest: "./uploads",
    filename: (c, file) => `${file.originalname}-${Date.now()}.${file.extension}`
});

app.post("/upload", storage.single("image"), (c) => c.text("OK"));

serve(app);
```
