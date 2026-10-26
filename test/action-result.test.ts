import { describe, expect, it } from "vitest";
import { afterDeleteHref } from "../src/action-result";

const form = (after?: string) => {
  const fd = new FormData();
  if (after !== undefined) fd.set("after", after);
  return fd;
};

describe("afterDeleteHref", () => {
  it("hands back a path inside the panel", () => {
    expect(afterDeleteHref(form("/customers"))).toBe("/customers");
    expect(afterDeleteHref(form("/pieces?status=hidden"))).toBe("/pieces?status=hidden");
  });

  it("refuses anything that could leave the panel", () => {
    for (const away of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "customers", "/a b"]) {
      expect(afterDeleteHref(form(away)), away).toBeNull();
    }
  });

  it("is null when the button sent no way out", () => {
    expect(afterDeleteHref(form())).toBeNull();
    expect(afterDeleteHref(form(""))).toBeNull();
  });
});
