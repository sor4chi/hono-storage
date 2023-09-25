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
      const storage = new HonoStorage({
        storage: (c) => {
          c.res.headers.set("Check-Whether-Storage-Is-Working", "true");
        },
      });
      const app = new Hono();
      app.post("/upload", storage.single("file"), (c) => c.text("Hello World"));

      const formData = new FormData();
      const file = new File(["Hello Hono Storage 1\n"], "sample1.txt");
      formData.append("file", file);

      const res = await app.request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("Check-Whether-Storage-Is-Working")).toBe("true");
      expect(await res.text()).toBe("Hello World");
    });
  });
});
