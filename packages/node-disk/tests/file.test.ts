import { File } from "@web-std/file";

import { HDSFile } from "../src/file";

describe("HDSFile", () => {
  it("should be able to create a new instance", () => {
    const file = new HDSFile(new File([], "sample1.txt"));
    expect(file).toBeInstanceOf(HDSFile);
  });

  describe("originalname", () => {
    it("should work with file without extension", () => {
      const file = new HDSFile(new File([], "sample1"));
      expect(file.originalname).toBe("sample1");
    });

    it("should work with file with extension", () => {
      const file = new HDSFile(new File([], "sample1.txt"));
      expect(file.originalname).toBe("sample1");
    });

    it("should work with file with multiple dots", () => {
      const file = new HDSFile(new File([], "sample1.txt.zip"));
      expect(file.originalname).toBe("sample1.txt");
    });
  });

  describe("extension", () => {
    it("should work with file without extension", () => {
      const file = new HDSFile(new File([], "sample1"));
      expect(file.extension).toBe("");
    });

    it("should work with file with extension", () => {
      const file = new HDSFile(new File([], "sample1.txt"));
      expect(file.extension).toBe("txt");
    });

    it("should work with file with multiple dots", () => {
      const file = new HDSFile(new File([], "sample1.txt.zip"));
      expect(file.extension).toBe("zip");
    });
  });
});
