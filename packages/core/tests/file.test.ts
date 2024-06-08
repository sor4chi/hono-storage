import { HonoStorageFile } from "../src/file";

describe("HonoStorageFile", () => {
  it("should be able to create a new instance", () => {
    const file = new HonoStorageFile(new File([], "sample1.txt"), {
      name: "file",
      type: "single",
    });
    expect(file).toBeInstanceOf(HonoStorageFile);
  });

  describe("originalname", () => {
    it("should work with file without extension", () => {
      const file = new HonoStorageFile(new File([], "sample1"), {
        name: "file",
        type: "single",
      });
      expect(file.originalname).toBe("sample1");
    });

    it("should work with file with extension", () => {
      const file = new HonoStorageFile(new File([], "sample1.txt"), {
        name: "file",
        type: "single",
      });
      expect(file.originalname).toBe("sample1");
    });

    it("should work with file with multiple dots", () => {
      const file = new HonoStorageFile(new File([], "sample1.txt.zip"), {
        name: "file",
        type: "single",
      });
      expect(file.originalname).toBe("sample1.txt");
    });
  });

  describe("extension", () => {
    it("should work with file without extension", () => {
      const file = new HonoStorageFile(new File([], "sample1"), {
        name: "file",
        type: "single",
      });
      expect(file.extension).toBe("");
    });

    it("should work with file with extension", () => {
      const file = new HonoStorageFile(new File([], "sample1.txt"), {
        name: "file",
        type: "single",
      });
      expect(file.extension).toBe("txt");
    });

    it("should work with file with multiple dots", () => {
      const file = new HonoStorageFile(new File([], "sample1.txt.zip"), {
        name: "file",
        type: "single",
      });
      expect(file.extension).toBe("zip");
    });
  });
});
