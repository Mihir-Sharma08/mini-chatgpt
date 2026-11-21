import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MarkdownRenderer from "./MarkdownRenderer";

const sample = [
  "# Title",
  "",
  "Some **bold** text and `inline` code.",
  "",
  "```js",
  "const a = 1;",
  "```",
  "",
  "| A | B |",
  "| - | - |",
  "| 1 | 2 |",
].join("\n");

describe("MarkdownRenderer", () => {
  it("renders headings, bold text and tables", () => {
    render(<MarkdownRenderer content={sample} />);

    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders fenced code in a block with a language label", () => {
    const { container } = render(<MarkdownRenderer content={sample} />);

    expect(screen.getByText("js")).toBeInTheDocument();
    expect(container.querySelector("pre code")).toHaveTextContent("const a = 1;");
  });

  it("copies the exact code text from a code block", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<MarkdownRenderer content={sample} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("const a = 1;"));
  });

  it("does not execute or render raw HTML from the model", () => {
    const { container } = render(
      <MarkdownRenderer content={'<img src=x onerror="alert(1)"> and <script>alert(1)</script>'} />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });

  it("opens links in a new tab safely", () => {
    render(<MarkdownRenderer content="[docs](https://example.com)" />);

    const link = screen.getByRole("link", { name: "docs" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });
});