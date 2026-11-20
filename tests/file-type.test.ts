import { describe, expect, it } from "vitest";
import { realType, withKnownType } from "@/lib/file-type";

describe("realType (phone browsers that omit or garble the file type)", () => {
  it("keeps a proper type from the browser", () => {
    expect(realType({ name: "x.bin", type: "application/pdf" })).toBe("application/pdf");
  });
  it("fixes non-standard aliases", () => {
    expect(realType({ name: "a.jpg", type: "image/jpg" })).toBe("image/jpeg");
    expect(realType({ name: "a.m4a", type: "audio/x-m4a" })).toBe("audio/mp4");
  });
  it("works it out from the file name when the type is empty or generic", () => {
    expect(realType({ name: "Diploma.PDF", type: "" })).toBe("application/pdf");
    expect(realType({ name: "IMG_0001.JPEG", type: "application/octet-stream" })).toBe(
      "image/jpeg",
    );
    expect(realType({ name: "photo.heic", type: "" })).toBe("image/heic");
    expect(realType({ name: "voice.m4a", type: "" })).toBe("audio/mp4");
  });
  it("leaves unknown files unknown", () => {
    expect(realType({ name: "noext", type: "" })).toBe("");
  });
  it("returns a File carrying the corrected type", async () => {
    const f = await withKnownType(new File(["%PDF"], "report.pdf", { type: "" }));
    expect(f.type).toBe("application/pdf");
    expect(f.name).toBe("report.pdf");
  });
});
