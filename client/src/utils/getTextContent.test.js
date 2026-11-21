import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { getTextContent } from "./getTextContent";

describe("getTextContent", () => {
  it("returns strings and numbers as text", () => {
    expect(getTextContent("hello")).toBe("hello");
    expect(getTextContent(42)).toBe("42");
  });

  it("ignores null, undefined and booleans", () => {
    expect(getTextContent([null, undefined, false, true, "a"])).toBe("a");
  });

  it("joins text from deeply nested elements", () => {
    const tree = createElement("code", null, createElement("span", null, "const"), " x = ", 1);
    expect(getTextContent(tree)).toBe("const x = 1");
  });
});