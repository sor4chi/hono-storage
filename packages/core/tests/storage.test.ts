import { File } from "@web-std/file";
import { Hono } from "hono";

import { HonoStorage, FILES_KEY } from "../src/storage";

describe("HonoStorage", () => {
  it("should be able to create a new instance", () => {
    const storage = new HonoStorage();
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

      const file = new File(["Hello Hono Storage 1"], "sample1.txt");
      formData.append("file", file);

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).toBeCalledTimes(1);
      expect(await res.text()).toBe("Hello World");
    });

    it("should work with single chain", async () => {
      const storageHandler = vi.fn();
      const storage = new HonoStorage({
        storage: (_, files) => {
          files.forEach(() => {
            storageHandler();
          });
        },
      });
      const app = new Hono();
      app.post(
        "/upload",
        storage.single("file1"),
        storage.single("file2"),
        (c) => {
          const files = c.var[FILES_KEY];
          return c.text(
            files.file1 && files.file2
              ? "All files exist"
              : "File does not exist",
          );
        },
      );

      const formData = new FormData();

      const file1 = new File(["Hello Hono Storage 1"], "sample1.txt");
      const file2 = new File(["Hello Hono Storage 2"], "sample2.txt");
      formData.append("file1", file1);
      formData.append("file2", file2);

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).toBeCalledTimes(2);
      expect(await res.text()).toBe("All files exist");
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

    it("can get the multipart/form-data from the context", async () => {
      const storage = new HonoStorage();
      const app = new Hono();
      app.post("/upload", storage.single("file"), (c) => {
        const files = c.var[FILES_KEY];
        return c.text(files.file ? "File exists" : "File does not exist");
      });

      const formData = new FormData();

      const file = new File(["Hello Hono Storage 1"], "sample1.txt");
      formData.append("file", file);

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(await res.text()).toBe("File exists");
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
          new File([`Hello Hono Storage ${i}`], `sample${i}.txt`),
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
          new File([`Hello Hono Storage ${i}`], `sample${i}.txt`),
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
        return c.text(err.message, c.res.status);
      });

      const formData = new FormData();
      for (let i = 0; i < 10; i++) {
        formData.append(
          "file",
          new File([`Hello Hono Storage ${i}`], `sample${i}.txt`),
        );
      }

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(404);
      expect(storageHandler).toBeCalledTimes(0);
      expect(onErr).toBeCalledTimes(1);
      expect(await res.text()).toBe("Too many files");
    });

    it("can get the multipart/form-data from the context", async () => {
      const storage = new HonoStorage();
      const app = new Hono();
      app.post("/upload", storage.array("file"), (c) => {
        const files = c.var[FILES_KEY];
        return c.text(`${files.file.length} files`);
      });

      const formData = new FormData();
      for (let i = 0; i < 10; i++) {
        formData.append(
          "file",
          new File([`Hello Hono Storage ${i}`], `sample${i}.txt`),
        );
      }

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("10 files");
    });
  });

  describe("fields", () => {
    it("should work with a single field", async () => {
      const storageHandler = vi.fn();
      const storage = new HonoStorage({
        storage: (_, files) => {
          files.forEach(() => {
            storageHandler();
          });
        },
      });
      const app = new Hono();
      app.post("/upload", storage.fields([{ name: "file" }]), (c) =>
        c.text("Hello World"),
      );

      const formData = new FormData();
      formData.append(
        "file",
        new File([`Hello Hono Storage 1`], "sample1.txt"),
      );

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).toBeCalledTimes(1);
      expect(await res.text()).toBe("Hello World");
    });

    it("should work with a single field with maxCount", async () => {
      const storageHandler = vi.fn();
      const storage = new HonoStorage({
        storage: (_, files) => {
          files.forEach(() => {
            storageHandler();
          });
        },
      });
      const app = new Hono();
      app.post(
        "/upload",
        storage.fields([{ name: "file", maxCount: 3 }]),
        (c) => c.text("Hello World"),
      );

      const formData = new FormData();
      for (let i = 0; i < 2; i++) {
        formData.append(
          "file",
          new File([`Hello Hono Storage ${i}`], "sample1.txt"),
        );
      }

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).toBeCalledTimes(2);
      expect(await res.text()).toBe("Hello World");
    });

    it("should work with multiple fields", async () => {
      const storageHandler = vi.fn();
      const storage = new HonoStorage({
        storage: (_, files) => {
          files.forEach(() => {
            storageHandler();
          });
        },
      });
      const app = new Hono();
      app.post(
        "/upload",
        storage.fields([
          { name: "file1" },
          { name: "file2" },
          { name: "file3" },
        ]),
        (c) => c.text("Hello World"),
      );

      const formData = new FormData();
      for (let i = 0; i < 3; i++) {
        formData.append(
          `file${i + 1}`,
          new File([`Hello Hono Storage ${i}`], `sample${i}.txt`),
        );
      }

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).toBeCalledTimes(3);
      expect(await res.text()).toBe("Hello World");
    });

    it("can get the multipart/form-data from the context", async () => {
      const storageHandler = vi.fn();
      const storage = new HonoStorage({
        storage: (_, files) => {
          files.forEach(() => {
            storageHandler();
          });
        },
      });
      const app = new Hono();
      app.post(
        "/upload",
        storage.fields([
          { name: "file1" },
          { name: "file2" },
          { name: "file3" },
        ]),
        (c) => {
          const files = c.var[FILES_KEY];
          return c.text(files.file1 ? "File exists" : "File does not exist");
        },
      );

      const formData = new FormData();
      for (let i = 0; i < 3; i++) {
        formData.append(
          `file${i + 1}`,
          new File([`Hello Hono Storage ${i}`], `sample${i}.txt`),
        );
      }

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).toBeCalledTimes(3);
      expect(await res.text()).toBe("File exists");
    });
  });
});
