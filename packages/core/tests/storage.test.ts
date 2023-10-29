import { File } from "@web-std/file";
import { Hono } from "hono";

import { HonoStorage, FieldValue } from "../src/storage";

describe("HonoStorage", () => {
  it("should be able to create a new instance", () => {
    const storage = new HonoStorage();
    expect(storage).toBeInstanceOf(HonoStorage);
  });

  const storageHandler = vi.fn();
  const storage = new HonoStorage({
    storage: (_, files) => {
      files.forEach(() => {
        storageHandler();
      });
    },
  });

  let app = new Hono();

  beforeEach(() => {
    app = new Hono();
  });

  afterEach(() => {
    storageHandler.mockClear();
  });

  describe("single", () => {
    it("can be used as a text parser middleware", async () => {
      let actualFieldValue: FieldValue | undefined = undefined;
      app.post("/upload", storage.single("text"), (c) => {
        expectTypeOf(c.var.files.text).toEqualTypeOf<FieldValue | undefined>();
        actualFieldValue = c.var.files.text;
        return c.text("OK");
      });

      const formData = new FormData();

      formData.append("text", "File");

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).not.toBeCalled();
      expect(actualFieldValue).toBe("File");
    });

    it("can be used as a text file upload middleware", async () => {
      let actualFieldValue: FieldValue | undefined = undefined;
      app.post("/upload", storage.single("file"), (c) => {
        expectTypeOf(c.var.files.file).toEqualTypeOf<FieldValue | undefined>();
        actualFieldValue = c.var.files.file;
        return c.text("OK");
      });

      const formData = new FormData();

      const file = new File(["File 1"], "sample1.txt");
      formData.append("file", file);

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).toBeCalledTimes(1);
      expect(actualFieldValue).toBeInstanceOf(Blob);
    });

    it("should through if no form data is provided", async () => {
      let actualFieldValue: FieldValue | undefined = undefined;
      app.post("/upload", storage.single("text"), (c) => {
        actualFieldValue = c.var.files.text;
        return c.text("OK");
      });

      const formData = new FormData();

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).not.toBeCalled();
      expect(actualFieldValue).toBeUndefined();
    });

    it("should work with single chain", async () => {
      let actualFieldValue1: FieldValue | undefined = undefined;
      let actualFieldValue2: FieldValue | undefined = undefined;
      app.post(
        "/upload",
        storage.single("file1"),
        storage.single("file2"),
        (c) => {
          expectTypeOf(c.var.files.file1).toEqualTypeOf<
            FieldValue | undefined
          >();
          expectTypeOf(c.var.files.file2).toEqualTypeOf<
            FieldValue | undefined
          >();
          actualFieldValue1 = c.var.files.file1;
          actualFieldValue2 = c.var.files.file2;
          return c.text("OK");
        },
      );

      const formData = new FormData();

      const file1 = new File(["File 1"], "sample1.txt");
      const file2 = "File 2 (string)";
      formData.append("file1", file1);
      formData.append("file2", file2);

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).toBeCalledTimes(1); // 2 file, but 1 is string
      expect(actualFieldValue1).toBeInstanceOf(Blob);
      expect(actualFieldValue2).toBe(file2);
    });
  });

  describe("multiple", () => {
    it("should work if maxCount is not set", async () => {
      app.post("/upload", storage.multiple("file"), (c) => c.text("OK"));

      const formData = new FormData();
      for (let i = 0; i < 10; i++) {
        formData.append("file", new File([`File ${i}`], `sample${i}.txt`));
      }

      await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(storageHandler).toBeCalledTimes(10);
    });

    it("should work if maxCount is set and the number of files is less than maxCount", async () => {
      const onErr = vi.fn();

      app.post("/upload", storage.multiple("file", 3), (c) => c.text("OK"));
      app.onError((err, c) => {
        onErr(err);
        return c.text(err.message);
      });

      const formData = new FormData();
      for (let i = 0; i < 2; i++) {
        formData.append("file", new File([`File ${i}`], `sample${i}.txt`));
      }
      await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(storageHandler).toBeCalledTimes(2);
      expect(onErr).toBeCalledTimes(0);
    });

    it("should work if maxCount is set and the number of files is greater than maxCount", async () => {
      const onErr = vi.fn();

      app.post("/upload", storage.multiple("file", 3), (c) => c.text("OK"));
      app.onError((err, c) => {
        onErr(err);
        return c.text(err.message);
      });

      const formData = new FormData();
      for (let i = 0; i < 10; i++) {
        formData.append("file", new File([`File ${i}`], `sample${i}.txt`));
      }

      await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(storageHandler).toBeCalledTimes(0);
      expect(onErr).toBeCalledTimes(1);
      expect(onErr.mock.calls[0][0].message).toBe("Too many files");
    });

    it("can get the multipart/form-data from the context", async () => {
      app.post("/upload", storage.multiple("file"), (c) => {
        expectTypeOf(c.var.files.file).toEqualTypeOf<FieldValue[]>;
        expect(c.var.files.file).toHaveLength(10);
        return c.text("OK");
      });

      const formData = new FormData();
      for (let i = 0; i < 5; i++) {
        formData.append("file", new File([`File ${i}`], `sample${i}.txt`));
        formData.append("file", "File " + i + " (string)");
      }

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(storageHandler).toBeCalledTimes(5); // 10 files, but 5 are strings
    });
  });

  describe("fields", () => {
    it("should work with a single field", async () => {
      let actualFieldValue: FieldValue | undefined = undefined;
      app.post("/upload", storage.fields({ file: { type: "single" } }), (c) => {
        expectTypeOf(c.var.files.file).toEqualTypeOf<FieldValue | undefined>();
        actualFieldValue = c.var.files.file;
        return c.text("OK");
      });

      const formData = new FormData();
      formData.append("file", new File([`File 1`], "sample1.txt"));

      await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(storageHandler).toBeCalledTimes(1);
      expect(actualFieldValue).toBeInstanceOf(Blob);
    });

    it("should work with a multiple field", async () => {
      app.post("/upload", storage.fields({ file: { type: "multiple" } }), (c) =>
        c.text("OK"),
      );

      const formData = new FormData();
      formData.append("file", new File([`File 1`], "sample1.txt"));

      await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(storageHandler).toBeCalledTimes(1);
    });

    it("should work with a multiple field with maxCount", async () => {
      app.post(
        "/upload",
        storage.fields({ file: { type: "multiple", maxCount: 3 } }),
        (c) => c.text("OK"),
      );

      const formData = new FormData();
      for (let i = 0; i < 2; i++) {
        formData.append("file", new File([`File ${i}`], "sample1.txt"));
      }

      await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(storageHandler).toBeCalledTimes(2);
    });

    it("should work with a multiple field with maxCount and throw an error", async () => {
      const onErr = vi.fn();

      app.post(
        "/upload",
        storage.fields({ file: { type: "multiple", maxCount: 3 } }),
        (c) => c.text("OK"),
      );
      app.onError((err, c) => {
        onErr(err);
        return c.text("OK");
      });

      const formData = new FormData();
      for (let i = 0; i < 5; i++) {
        formData.append("file", new File([`File ${i}`], "sample1.txt"));
      }

      await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(storageHandler).toBeCalledTimes(0);
      expect(onErr).toBeCalledTimes(1);
      expect(onErr.mock.calls[0][0].message).toBe("Too many files");
    });

    it("can get the multipart/form-data from the context", async () => {
      let actualFieldValue1: FieldValue | undefined = undefined;
      let actualFieldValue2: FieldValue[] | undefined = undefined;
      app.post(
        "/upload",
        storage.fields({
          file1: { type: "single" },
          file2: { type: "multiple" },
        }),
        (c) => {
          expectTypeOf(c.var.files.file1).toEqualTypeOf<
            FieldValue | undefined
          >();
          expectTypeOf(c.var.files.file2).toEqualTypeOf<FieldValue[]>();
          actualFieldValue1 = c.var.files.file1;
          actualFieldValue2 = c.var.files.file2;
          return c.text("OK");
        },
      );

      const formData = new FormData();
      formData.append("file1", new File([`File 1`], "sample1.txt"));
      formData.append("file2", new File([`File 2`], "sample2.txt"));
      formData.append("file2", new File([`File 3`], "sample3.txt"));

      await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(storageHandler).toBeCalledTimes(3);
      expect(actualFieldValue1).toBeInstanceOf(Blob);
      expect(actualFieldValue2).toHaveLength(2);
      expect((actualFieldValue2 as unknown as FieldValue[])[0]).toBeInstanceOf(
        Blob,
      );
    });
  });
});
