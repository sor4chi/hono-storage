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
    it("can be used as a middleware", async () => {
      const storage = new HonoStorage({
        storage: () => {},
      });
      const app = new Hono();
      app.post("/", storage.single("file"), (c) => c.text("Hello World"));
    });

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
        storage: () => {
          storageHandler();
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

  describe("multiple", () => {
    it("can be used as a middleware", async () => {
      const storage = new HonoStorage({
        storage: () => {},
      });
      const app = new Hono();
      app.post("/", storage.multiple("file"), (c) => c.text("Hello World"));
    });

    it("can be used as some text file upload middleware", async () => {
      const storageHandler = vi.fn();
      const storage = new HonoStorage({
        storage: (_, files) => {
          files.forEach(() => {
            storageHandler();
          });
        },
      });
      const app = new Hono();
      app.post("/upload", storage.multiple("file"), (c) =>
        c.text("Hello World"),
      );

      const formData = new FormData();

      formData.append(
        "file",
        new Blob(["Hello Hono Storage 1"], {
          type: "text/plain",
        }),
        "sample1.txt",
      );

      formData.append(
        "file",
        new Blob(["Hello Hono Storage 2"], {
          type: "text/plain",
        }),
        "sample2.txt",
      );

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).toBeCalledTimes(2);
      expect(await res.text()).toBe("Hello World");
    });

    // it("can be filtered if the files is not a blob", async () => {
    //   const storage = new HonoStorage({
    //     storage: () => {},
    //   });
    //   const app = new Hono();
    //   app.post("/upload", storage.multiple("file"), (c) =>
    //     c.text("Hello World"),
    //   );

    //   const formData = new FormData();

    //   formData.append("file", "Hello Hono Storage 1");
    //   formData.append(
    //     "file",
    //     new Blob(["Hello Hono Storage 2"], { type: "text/plain" }),
    //   );

    //   const res = await app.request("http://localhost/upload", {
    //     method: "POST",
    //     body: formData,
    //   });

    //   expect(res.status).toBe(200);
    //   expect(await res.text()).toBe("Hello World");
    // });
  });
});
