import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { FieldValue } from "@hono-storage/core";
import { RequestPresigningArguments } from "@smithy/types";
import { File } from "@web-std/file";
import { Hono } from "hono";

import { HonoS3Storage } from "../";
import { BaseHonoS3Storage, IS3Repository } from "../src/storage";

describe("HonoS3Storage", () => {
  const putToS3 = vi.fn();
  const getSignedURLFromS3 = vi.fn();
  let app = new Hono();

  class MockS3Repository implements IS3Repository {
    async put(command: PutObjectCommand) {
      putToS3(command);
    }
    async getSingedURL(
      command: GetObjectCommand,
      sign: RequestPresigningArguments,
    ) {
      getSignedURLFromS3(command, sign);
      return "https://example.com";
    }
  }

  beforeEach(() => {
    app = new Hono();
  });

  afterEach(() => {
    putToS3.mockClear();
    getSignedURLFromS3.mockClear();
  });

  it("should be able to create a new instance", () => {
    const client = new S3Client();
    const storage = new HonoS3Storage({
      bucket: "hono-storage",
      client,
    });

    expect(storage).toBeInstanceOf(HonoS3Storage);
  });

  describe("single", () => {
    it("should work", async () => {
      let actualFile: unknown;
      let actualSignedURL: unknown;
      const storage = new BaseHonoS3Storage(
        {
          bucket: "hono-storage",
          client: new S3Client(),
        },
        new MockS3Repository(),
      );

      app.post("/", storage.single("image"), (c) => {
        expectTypeOf(c.var.files.image).toMatchTypeOf<FieldValue | undefined>();
        actualFile = c.var.files.image;
        expectTypeOf(c.var.signedURLs.image).toMatchTypeOf<undefined>();
        actualSignedURL = c.var.signedURLs.image;
        return c.text("OK");
      });

      const form = new FormData();
      form.append("image", new File([], "sample1.png"));

      await app.request("http://localhost", {
        method: "POST",
        body: form,
      });

      expect(putToS3).toHaveBeenCalledTimes(1);
      expect(actualFile).toBeInstanceOf(Blob);
      expect(actualSignedURL).toBe(undefined);
    });

    it("should work with sign option", async () => {
      let actualFile: unknown;
      let actualSignedURL: unknown;
      const storage = new BaseHonoS3Storage(
        {
          bucket: "hono-storage",
          client: new S3Client(),
        },
        new MockS3Repository(),
      );

      app.post(
        "/",
        storage.single("image", { sign: { expiresIn: 60 } }),
        (c) => {
          expectTypeOf(c.var.files.image).toMatchTypeOf<
            FieldValue | undefined
          >();
          expectTypeOf(c.var.signedURLs.image).toMatchTypeOf<
            string | undefined
          >();
          actualFile = c.var.files.image;
          actualSignedURL = c.var.signedURLs.image;
          return c.text("OK");
        },
      );

      const form = new FormData();
      form.append("image", new File([], "sample1.png"));

      await app.request("http://localhost", {
        method: "POST",
        body: form,
      });

      expect(putToS3).toHaveBeenCalledTimes(1);
      expect(getSignedURLFromS3).toHaveBeenCalledTimes(1);
      expect(getSignedURLFromS3.mock.calls[0][1]).toMatchObject({
        expiresIn: 60,
      });
      expect(actualFile).toBeInstanceOf(Blob);
      expect(actualSignedURL).toBe("https://example.com");
    });
  });

  describe("multiple", () => {
    it("should work", async () => {
      let actualFiles: unknown;
      let actualSignedURL: unknown;
      const storage = new BaseHonoS3Storage(
        {
          bucket: "hono-storage",
          client: new S3Client(),
        },
        new MockS3Repository(),
      );

      app.post("/", storage.multiple("images"), (c) => {
        expectTypeOf(c.var.files.images).toMatchTypeOf<
          FieldValue | undefined
        >();
        actualFiles = c.var.files.images;
        expectTypeOf(c.var.signedURLs.images).toMatchTypeOf<undefined>();
        actualSignedURL = c.var.signedURLs.images;
        return c.text("OK");
      });

      const form = new FormData();
      form.append("images", new File([], "sample1.png"));
      form.append("images", new File([], "sample2.png"));

      await app.request("http://localhost", {
        method: "POST",
        body: form,
      });

      expect(putToS3).toHaveBeenCalledTimes(2);
      expect(getSignedURLFromS3).toHaveBeenCalledTimes(0);
      expect(actualFiles).toBeInstanceOf(Array);
      expect(actualFiles).toHaveLength(2);
      assert(
        Array.isArray(actualFiles) &&
          actualFiles.every((v) => v instanceof Blob),
      );
      expect(actualSignedURL).toBe(undefined);
    });

    it("should work with sign option", async () => {
      let actualFiles: unknown;
      let actualSignedURL: unknown;
      const storage = new BaseHonoS3Storage(
        {
          bucket: "hono-storage",
          client: new S3Client(),
        },
        new MockS3Repository(),
      );

      app.post(
        "/",
        storage.multiple("images", { sign: { expiresIn: 60 } }),
        (c) => {
          expectTypeOf(c.var.files.images).toMatchTypeOf<
            FieldValue | undefined
          >();
          expectTypeOf(c.var.signedURLs.images).toMatchTypeOf<string[]>();
          actualFiles = c.var.files.images;
          actualSignedURL = c.var.signedURLs.images;
          return c.text("OK");
        },
      );

      const form = new FormData();
      form.append("images", new File([], "sample1.png"));
      form.append("images", new File([], "sample2.png"));

      await app.request("http://localhost", {
        method: "POST",
        body: form,
      });

      expect(putToS3).toHaveBeenCalledTimes(2);
      expect(getSignedURLFromS3).toHaveBeenCalledTimes(2);
      expect(getSignedURLFromS3.mock.calls[0][1]).toMatchObject({
        expiresIn: 60,
      });
      expect(getSignedURLFromS3.mock.calls[1][1]).toMatchObject({
        expiresIn: 60,
      });
      expect(actualFiles).toBeInstanceOf(Array);
      expect(actualFiles).toHaveLength(2);
      assert(
        Array.isArray(actualFiles) &&
          actualFiles.every((v) => v instanceof Blob),
      );
      expect(actualSignedURL).toBeInstanceOf(Array);
      expect(actualSignedURL).toHaveLength(2);
      assert(
        Array.isArray(actualSignedURL) &&
          actualSignedURL.every((v) => v === "https://example.com"),
      );
    });
  });

  describe("fields", () => {
    it("should work", async () => {
      let actualImage: unknown;
      let actualImages: unknown;
      let actualSignedURL: unknown;
      const storage = new BaseHonoS3Storage(
        {
          bucket: "hono-storage",
          client: new S3Client(),
        },
        new MockS3Repository(),
      );

      app.post(
        "/",
        storage.fields({
          image: {
            type: "single",
          },
          images: {
            type: "multiple",
          },
        }),
        (c) => {
          expectTypeOf(c.var.files.image).toMatchTypeOf<
            FieldValue | undefined
          >();
          expectTypeOf(c.var.files.images).toMatchTypeOf<FieldValue[]>();
          actualImage = c.var.files.image;
          actualImages = c.var.files.images;
          expectTypeOf(c.var.signedURLs.image).toMatchTypeOf<undefined>();
          expectTypeOf(c.var.signedURLs.images).toMatchTypeOf<undefined>();
          actualSignedURL = c.var.signedURLs;
          return c.text("OK");
        },
      );

      const form = new FormData();
      form.append("image", new File([], "sample1.png"));
      form.append("images", new File([], "sample2.png"));
      form.append("images", new File([], "sample3.png"));

      await app.request("http://localhost", {
        method: "POST",
        body: form,
      });

      expect(putToS3).toHaveBeenCalledTimes(3);
      expect(getSignedURLFromS3).toHaveBeenCalledTimes(0);
      expect(actualImage).toBeInstanceOf(Blob);
      expect(actualImages).toBeInstanceOf(Array);
      expect(actualImages).toHaveLength(2);
      assert(
        Array.isArray(actualImages) &&
          actualImages.every((v) => v instanceof Blob),
      );
      expect(actualSignedURL).toBeInstanceOf(Object);
    });

    it("should work with sign option", async () => {
      let actualImage: unknown;
      let actualImages: unknown;
      let actualSignedURL: unknown;
      const storage = new BaseHonoS3Storage(
        {
          bucket: "hono-storage",
          client: new S3Client(),
        },
        new MockS3Repository(),
      );

      app.post(
        "/",
        storage.fields({
          image: {
            type: "single",
            sign: { expiresIn: 60 },
          },
          images: {
            type: "multiple",
            sign: { expiresIn: 60 },
          },
        }),
        (c) => {
          expectTypeOf(c.var.files.image).toMatchTypeOf<
            FieldValue | undefined
          >();
          expectTypeOf(c.var.files.images).toMatchTypeOf<FieldValue[]>();
          expectTypeOf(c.var.signedURLs.image).toMatchTypeOf<
            string | undefined
          >();
          expectTypeOf(c.var.signedURLs.images).toMatchTypeOf<string[]>();
          actualImage = c.var.files.image;
          actualImages = c.var.files.images;
          actualSignedURL = c.var.signedURLs;
          return c.text("OK");
        },
      );

      const form = new FormData();
      form.append("image", new File([], "sample1.png"));
      form.append("images", new File([], "sample2.png"));
      form.append("images", new File([], "sample3.png"));

      await app.request("http://localhost", {
        method: "POST",
        body: form,
      });

      expect(putToS3).toHaveBeenCalledTimes(3);
      expect(getSignedURLFromS3).toHaveBeenCalledTimes(3);
      expect(getSignedURLFromS3.mock.calls[0][1]).toMatchObject({
        expiresIn: 60,
      });
      expect(getSignedURLFromS3.mock.calls[1][1]).toMatchObject({
        expiresIn: 60,
      });
      expect(actualImage).toBeInstanceOf(Blob);
      expect(actualImages).toBeInstanceOf(Array);
      expect(actualImages).toHaveLength(2);
      assert(
        Array.isArray(actualImages) &&
          actualImages.every((v) => v instanceof Blob),
      );
      expect(actualSignedURL).toBeInstanceOf(Object);
      expect(actualSignedURL).toMatchObject({
        image: "https://example.com",
        images: ["https://example.com", "https://example.com"],
      });
    });
  });
});
