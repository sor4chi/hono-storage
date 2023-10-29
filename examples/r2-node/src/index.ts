import { S3Client } from "@aws-sdk/client-s3";
import { serve } from "@hono/node-server";
import { HonoS3Storage } from "@hono-storage/s3";
import { config } from "dotenv";
import { Hono } from "hono";

config();

const app = new Hono();

if (
  !process.env.ACCESS_KEY_ID ||
  !process.env.SECRET_ACCESS_KEY ||
  !process.env.ACCOUNT_ID
) {
  throw new Error("credentials not found");
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const storage = new HonoS3Storage({
  key: (_, file) =>
    `${file.originalname}-${new Date().getTime()}.${file.extension}`,
  bucket: "hono-storage",
  client,
});

app.post("/", storage.single("file"), (c) => c.text("OK"));

serve(app);
