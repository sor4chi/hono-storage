import { serve } from "@hono/node-server";
import { HonoDiskStorage } from "@hono-storage/nodejs-disk";
import { Hono } from "hono";

const app = new Hono();
const storage = new HonoDiskStorage({
  dest: "./uploads",
  filename: (_, file) => `${file.originalname}-${Date.now()}.${file.extension}`,
});

app.post("/", storage.single("file"), (c) => c.text("OK"));

serve(app);
