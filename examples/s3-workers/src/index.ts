import { S3Client } from "@aws-sdk/client-s3";
import { HonoS3Storage } from "@hono-storage/s3";
import { Hono } from "hono";

const app = new Hono();
const client = (accessKeyId: string, secretAccessKey: string) =>
  new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

const storage = new HonoS3Storage({
  key: (_, file) => `${file.originalname}-${new Date().getTime()}`,
  bucket: "hono-storage",
  client: (c) => client(c.env.AWS_ACCESS_KEY_ID, c.env.AWS_SECRET_ACCESS_KEY),
});

app.post("/", storage.single("file"), (c) => c.text("OK"));

export default app;
