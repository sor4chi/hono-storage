import { S3Client } from "@aws-sdk/client-s3";
import { serve } from "@hono/node-server";
import { HonoS3Storage } from "@hono-storage/s3";
import { config } from "dotenv";
import { Hono } from "hono";
import { html } from "hono/html";

config();

const app = new Hono();

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error("AWS credentials not found");
}

const client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = new HonoS3Storage({
  key: (_, file) =>
    `${file.originalname}-${new Date().getTime()}.${file.extension}`,
  bucket: "hono-storage",
  client,
});

let signedURL = "";

app.post(
  "/",
  storage.single("image", {
    sign: {
      expiresIn: 60,
    },
  }),
  (c) => {
    signedURL = c.var.signedURLs.image || "";
    return c.html(html`
      <a href="/">Back</a>
      <p>Image uploaded successfully</p>
      <code>${signedURL}</code>
    `);
  },
);

app.get("/", (c) =>
  c.html(html`
    <form action="/" method="POST" enctype="multipart/form-data">
      <input type="file" name="image" />
      <button type="submit">Submit</button>
    </form>
    <img src="${signedURL}" />
  `),
);

serve(app);
