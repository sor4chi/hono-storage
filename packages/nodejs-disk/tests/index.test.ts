import * as fs from "fs/promises";
import { join } from "path";

import { createAdaptorServer } from "@hono/node-server";
import { Hono } from "hono";
import request from "supertest";

import { HonoStorage } from "../src";

describe("HonoStorage", () => {
  it("should be able to create a new instance", () => {
    const storage = new HonoStorage({
      dest: "/tmp",
    });
    expect(storage).toBeInstanceOf(HonoStorage);
  });

  describe("single", () => {
    afterEach(async () => {
      try {
        await fs.access(join(__dirname, "tmp"));
        await fs.rm(join(__dirname, "tmp"), { recursive: true });
      } catch (e) {
        // ignore
      }
    });

    it("can be used as a single file upload middleware", async () => {
      const storage = new HonoStorage({
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

    it("can be used as a multiple file upload middleware", async () => {
      const storage = new HonoStorage({
        dest: join(__dirname, "tmp"),
      });
      const app = new Hono();
      app.post(
        "/upload",
        storage.single("file1"),
        storage.single("file2"),
        (c) => c.text("Hello World"),
      );
      const server = createAdaptorServer(app);
      const res = await request(server)
        .post("/upload")
        .attach("file1", join(__dirname, "fixture/sample2.txt"))
        .attach("file2", join(__dirname, "fixture/sample3.txt"));
      expect(res.status).toBe(200);
      expect(res.text).toBe("Hello World");

      const files = await fs.readdir(join(__dirname, "tmp"));
      expect(files).toEqual(["sample2.txt", "sample3.txt"]);

      const content1 = await fs.readFile(join(__dirname, "tmp/sample2.txt"), {
        encoding: "utf-8",
      });
      expect(content1).toBe("Hello Hono Storage 2\n");

      const content2 = await fs.readFile(join(__dirname, "tmp/sample3.txt"), {
        encoding: "utf-8",
      });
      expect(content2).toBe("Hello Hono Storage 3\n");
    });
  });
});
