import { Hono } from "hono";

import { HonoStorage } from "../src";

describe("HonoStorage", () => {
  it("should be able to create a new instance", () => {
    const storage = new HonoStorage({
      storage: () => {},
    });
    expect(storage).toBeInstanceOf(HonoStorage);
  });

  describe("single", () => {
    it("can be used as a text file upload middleware", async () => {
      const storageHandler = vi.fn();
      const storage = new HonoStorage({
        storage: (_, files) => {
          files.forEach(() => {
            storageHandler();
          });
        },
      });
      const app = new Hono();
      app.post("/upload", storage.single("file"), (c) => c.text("Hello World"));

      const formData = new FormData();

      const file = new Blob(["Hello Hono Storage 1"], { type: "text/plain" });
      formData.append("file", file);

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).toBeCalledTimes(1);
      expect(await res.text()).toBe("Hello World");
    });

    it("can be through if the file is not a blob", async () => {
      const storageHandler = vi.fn();
      const storage = new HonoStorage({
        storage: (_, files) => {
          files.forEach(() => {
            storageHandler();
          });
        },
      });
      const app = new Hono();
      app.post("/upload", storage.single("file"), (c) => c.text("Hello World"));

      const formData = new FormData();

      formData.append("file", "Hello Hono Storage 1");

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).not.toBeCalled();
      expect(await res.text()).toBe("Hello World");
    });
  });

  describe("array", () => {
    it("should work if maxCount is not set", async () => {
      const storageHandler = vi.fn();
      const storage = new HonoStorage({
        storage: (_, files) => {
          files.forEach(() => {
            storageHandler();
          });
        },
      });
      const app = new Hono();
      app.post("/upload", storage.array("file"), (c) => c.text("Hello World"));

      const formData = new FormData();
      for (let i = 0; i < 10; i++) {
        formData.append(
          "file",
          new Blob([`Hello Hono Storage ${i}`], {
            type: "text/plain",
          }),
        );
      }

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).toBeCalledTimes(10);
      expect(await res.text()).toBe("Hello World");
    });

    it("should work if maxCount is set and the number of files is less than maxCount", async () => {
      const storageHandler = vi.fn();
      const onErr = vi.fn();
      const storage = new HonoStorage({
        storage: (_, files) => {
          files.forEach(() => {
            storageHandler();
          });
        },
      });
      const app = new Hono();
      app.post("/upload", storage.array("file", 3), (c) =>
        c.text("Hello World"),
      );
      app.onError((err, c) => {
        onErr(err);
        return c.text(err.message);
      });

      const formData = new FormData();
      for (let i = 0; i < 2; i++) {
        formData.append(
          "file",
          new Blob([`Hello Hono Storage ${i}`], {
            type: "text/plain",
          }),
        );
      }

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(storageHandler).toBeCalledTimes(2);
      expect(onErr).toBeCalledTimes(0);
      expect(await res.text()).toBe("Hello World");
    });

    it("should work if maxCount is set and the number of files is greater than maxCount", async () => {
      const storageHandler = vi.fn();
      const storage = new HonoStorage({
        storage: (_, files) => {
          files.forEach(() => {
            storageHandler();
          });
        },
      });
      const app = new Hono();
      app.post("/upload", storage.array("file", 3), (c) =>
        c.text("Hello World"),
      );
      app.onError((err, c) => c.text(err.message, c.res.status));

      const formData = new FormData();
      for (let i = 0; i < 10; i++) {
        formData.append(
          "file",
          new Blob([`Hello Hono Storage ${i}`], {
            type: "text/plain",
          }),
        );
      }

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(404);
      expect(storageHandler).toBeCalledTimes(0);
      expect(await res.text()).toBe("Too many files");
    });
  });
});
