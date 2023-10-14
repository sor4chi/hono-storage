---
"@hono-storage/memory": patch
---

Introduced a new storage called `MemoryStorage`!

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
