import { rm } from "fs";
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
    beforeEach(() => {
      rm(join(__dirname, "tmp"), { recursive: true }, () => {});
    });

    it("should work with string dest", async () => {
      const storage = new HonoDiskStorage({
        dest: join(__dirname, "tmp"),
      });
      const spyHandleDestStorage = vi.spyOn(storage, "handleDestStorage");
      const app = new Hono();
      app.post("/upload", storage.single("file"), (c) => c.text("Hello World"));
      const server = createAdaptorServer(app);
      const res = await request(server)
        .post("/upload")
        .attach("file", join(__dirname, "fixture/sample1.txt"));
      expect(res.status).toBe(200);
      expect(res.text).toBe("Hello World");
      expect(spyHandleDestStorage).toBeCalledWith(
        join(__dirname, "tmp"),
        expect.objectContaining({
          name: "sample1.txt",
        }),
      );
    });

    it("should work with custom function dest", async () => {
      const storage = new HonoDiskStorage({
        dest: (c) => {
          if (c.req.query("store")) {
            return join(__dirname, `tmp/store${c.req.query("store")}`);
          }
          return join(__dirname, "tmp");
        },
      });
      const spyHandleDestStorage = vi.spyOn(storage, "handleDestStorage");
      const app = new Hono();
      app.post("/upload", storage.single("file"), (c) => c.text("Hello World"));
      const server = createAdaptorServer(app);
      const res = await request(server)
        .post("/upload?store=1")
        .attach("file", join(__dirname, "fixture/sample1.txt"));
      expect(res.status).toBe(200);
      expect(res.text).toBe("Hello World");
      expect(spyHandleDestStorage).toBeCalledWith(
        join(__dirname, "tmp/store1"),
        expect.objectContaining({
          name: "sample1.txt",
        }),
      );
    });

    it("should work with async custom function dest", async () => {
      const storage = new HonoDiskStorage({
        dest: async (c) => {
          if (c.req.query("store")) {
            return join(__dirname, `tmp/store${c.req.query("store")}`);
          }
          return join(__dirname, "tmp");
        },
      });
      const spyHandleDestStorage = vi.spyOn(storage, "handleDestStorage");
      const app = new Hono();
      app.post("/upload", storage.single("file"), (c) => c.text("Hello World"));
      const server = createAdaptorServer(app);
      const res = await request(server)
        .post("/upload?store=1")
        .attach("file", join(__dirname, "fixture/sample1.txt"));
      expect(res.status).toBe(200);
      expect(res.text).toBe("Hello World");
      expect(spyHandleDestStorage).toBeCalledWith(
        join(__dirname, "tmp/store1"),
        expect.objectContaining({
          name: "sample1.txt",
        }),
      );
    });
  });

  describe("filename option", () => {
    it("can be used as a file upload middleware", async () => {
      const PREFIX = "prefix-";
      const storage = new HonoDiskStorage({
        dest: join(__dirname, "tmp"),
        filename: (_, file) =>
          `${PREFIX}${file.originalname}.${file.extension}`,
      });
      const spyHandleDestStorage = vi.spyOn(storage, "handleDestStorage");
      const app = new Hono();
      app.post("/upload", storage.single("file"), (c) => c.text("Hello World"));
      const server = createAdaptorServer(app);
      const res = await request(server)
        .post("/upload")
        .attach("file", join(__dirname, "fixture/sample1.txt"));
      expect(res.status).toBe(200);
      expect(res.text).toBe("Hello World");
      expect(spyHandleDestStorage).toBeCalledWith(
        join(__dirname, "tmp"),
        expect.objectContaining({
          name: `${PREFIX}sample1.txt`,
        }),
      );
    });

    it("returns the uploaded file's filename", async () => {
      const PREFIX = "prefix-";
      const storage = new HonoDiskStorage({
        dest: join(__dirname, "tmp"),
        filename: (_, file) =>
          `${PREFIX}${file.originalname}.${file.extension}`,
      });
      const app = new Hono();
      app.post("/upload", storage.single("file"), (c) =>
        c.text(c.var.fileNames.file),
      );
      const server = createAdaptorServer(app);
      const res = await request(server)
        .post("/upload")
        .attach("file", join(__dirname, "fixture/sample1.txt"));
      expect(res.status).toBe(200);
      expect(res.text).toBe(`${PREFIX}sample1.txt`);
    });
  });
});
