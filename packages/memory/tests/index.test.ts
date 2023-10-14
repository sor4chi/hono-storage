import { Hono } from "hono";

import { HonoMemoryStorage } from "../src";

describe("HonoMemoryStorage", () => {
  it("should be able to create a new instance", () => {
    const storage = new HonoMemoryStorage();
    expect(storage).toBeInstanceOf(HonoMemoryStorage);
  });

  it("should work with default option", async () => {
    const storage = new HonoMemoryStorage();
    const app = new Hono();
    app.post(
      "/upload",
      storage.fields([
        { name: "file", maxCount: 1 },
        { name: "file2", maxCount: 2 },
      ]),
      (c) => c.text("Hello World"),
    );

    const formData = new FormData();

    const file1 = new Blob(["Hello World 1"], { type: "text/plain" });
    const file2 = new Blob(["Hello World 2"], { type: "text/plain" });
    const file3 = new Blob(["Hello World 3"], { type: "text/plain" });
    formData.append("file", file1, "sample1.txt");
    formData.append("file2", file2, "sample2.txt");
    formData.append("file2", file3, "sample1.txt");

    const res = await app.request("http://localhost/upload", {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Hello World");
    expect(storage.buffer).toHaveLength(2);
    expect(storage.buffer.get("sample1.txt")).not.toBeUndefined();
    expect(storage.buffer.get("sample2.txt")).not.toBeUndefined();
    expect(await storage.buffer.get("sample1.txt")?.text()).toBe(
      "Hello World 3",
    );
    expect(await storage.buffer.get("sample2.txt")?.text()).toBe(
      "Hello World 2",
    );
  });

  it("should work with custom key option", async () => {
    const storage = new HonoMemoryStorage({
      key: (c, file) => `${c.req.query("store")}/${file.name}`,
    });
    const app = new Hono();
    app.post(
      "/upload",
      storage.fields([
        { name: "file", maxCount: 1 },
        { name: "file2", maxCount: 2 },
      ]),
      (c) => c.text("Hello World"),
    );

    const formData = new FormData();

    const file1 = new Blob(["Hello World 1"], { type: "text/plain" });
    const file2 = new Blob(["Hello World 2"], { type: "text/plain" });
    const file3 = new Blob(["Hello World 3"], { type: "text/plain" });
    formData.append("file", file1, "sample1.txt");
    formData.append("file2", file2, "sample2.txt");
    formData.append("file2", file3, "sample1.txt");

    const res = await app.request("http://localhost/upload?store=1", {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Hello World");
    expect(storage.buffer).toHaveLength(2);
    expect(storage.buffer.get("1/sample1.txt")).not.toBeUndefined();
    expect(storage.buffer.get("1/sample2.txt")).not.toBeUndefined();
    expect(await storage.buffer.get("1/sample1.txt")?.text()).toBe(
      "Hello World 3",
    );
    expect(await storage.buffer.get("1/sample2.txt")?.text()).toBe(
      "Hello World 2",
    );
  });
});
