import { serve } from "@hono/node-server";
import { HonoMemoryStorage } from "@hono-storage/memory";
import { Hono } from "hono";

const app = new Hono();
const storage = new HonoMemoryStorage({
  key: (c, file) => `${file.originalname}-${new Date()}`,
});

app.post("/", storage.single("file"), (c) => c.text("OK"));
app.get("/show/:key", async (c) => {
  const key = c.req.param("key");
  const file = storage.buffer.get(key);
  if (!file) {
    return c.text("File not found");
  }
  return c.json({
    key,
    size: file.size,
    type: file.type,
    name: file.name,
    content: await file.text(),
  });
});
app.get("/list", (c) => {
  return c.json(storage.buffer.forEach((file) => file.name));
});

serve(app);
