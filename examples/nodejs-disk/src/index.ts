import { join } from "path";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HonoStorage } from "hono-storage-for-nodejs-disk";

const app = new Hono();
const storage = new HonoStorage({
  dest: join(__dirname, "tmp"),
});

app.post("/", storage.single("file"), (c) => c.text("OK"));

serve(app);
