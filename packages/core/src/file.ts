import { File } from "@web-std/file";

type Field = {
  name: string;
  type: "single" | "multiple";
};

export class HonoStorageFile extends File {
  field: Field;

  constructor(file: Blob | File, field: Field) {
    super([file], file.name);
    this.field = field;
  }

  get originalname(): string {
    const name = this.name;
    const lastDot = name.lastIndexOf(".");
    if (lastDot === -1) {
      return name;
    }
    return name.substring(0, lastDot);
  }

  get extension(): string {
    const name = this.name;
    const lastDot = name.lastIndexOf(".");
    if (lastDot === -1) {
      return "";
    }
    return name.substring(lastDot + 1);
  }
}
