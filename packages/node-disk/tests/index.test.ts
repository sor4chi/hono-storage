import * as fs from "fs/promises";
import { join } from "path";

import { createAdaptorServer } from "@hono/node-server";
import { Hono } from "hono";
import request from "supertest";

import { HonoDiskStorage } from "../src";

describe("HonoDiskStorage", () => {
  it("should be able to create a new instance", () => {
    const storage = new HonoDiskStorage({
      dest: "/tmp",
    });
    expect(storage).toBeInstanceOf(HonoDiskStorage);
  });

  describe("dest option", () => {
    afterEach(async () => {
      try {
        await fs.access(join(__dirname, "tmp"));
        await fs.rm(join(__dirname, "tmp"), { recursive: true });
      } catch (e) {
        // ignore
      }
    });

    it("can be used as a file upload middleware", async () => {
      const storage = new HonoDiskStorage({
        dest: join(__dirname, "tmp"),
      });
      const app = new Hono();
      app.post("/upload", storage.single("file"), (c) => c.text("Hello World"));
      const server = createAdaptorServer(app);
      const res = await request(server)
        .post("/upload")
        .attach("file", join(__dirname, "fixture/sample1.txt"));
      expect(res.status).toBe(200);
      expect(res.text).toBe("Hello World");
      const files = await fs.readdir(join(__dirname, "tmp"));
      expect(files).toEqual(["sample1.txt"]);
      const content = await fs.readFile(join(__dirname, "tmp/sample1.txt"), {
        encoding: "utf-8",
      });
      expect(content).toBe("Hello Hono Storage 1\n");
    });
  });

  describe("filename option", () => {
    afterEach(async () => {
      try {
        await fs.access(join(__dirname, "tmp"));
        await fs.rm(join(__dirname, "tmp"), { recursive: true });
      } catch (e) {
        // ignore
      }
    });

    it("can be used as a file upload middleware", async () => {
      const PREFIX = "prefix-";
      const storage = new HonoDiskStorage({
        dest: join(__dirname, "tmp"),
        filename: (_, file) =>
          `${PREFIX}${file.originalname}.${file.extension}`,
      });
      const app = new Hono();
      app.post("/upload", storage.single("file"), (c) => c.text("Hello World"));
      const server = createAdaptorServer(app);
      const res = await request(server)
        .post("/upload")
        .attach("file", join(__dirname, "fixture/sample1.txt"));
      expect(res.status).toBe(200);
      expect(res.text).toBe("Hello World");
      const files = await fs.readdir(join(__dirname, "tmp"));
      expect(files).toEqual(["prefix-sample1.txt"]);
      const content = await fs.readFile(
        join(__dirname, "tmp/prefix-sample1.txt"),
        {
          encoding: "utf-8",
        },
      );
      expect(content).toBe("Hello Hono Storage 1\n");
    });
  });
});
