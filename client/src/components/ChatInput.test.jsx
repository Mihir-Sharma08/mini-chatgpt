import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatInput from "./ChatInput";

function setup(props = {}) {
  const onSend = vi.fn();
  const onStop = vi.fn();

  render(
    <ChatInput onSend={onSend} onStop={onStop} isGenerating={false} disabled={false} {...props} />,
  );

  return {
    onSend,
    onStop,
    user: userEvent.setup(),
    box: screen.getByPlaceholderText("Message Mini ChatGPT..."),
  };
}

describe("ChatInput", () => {
  it("sends the trimmed text on Enter and clears the box", async () => {
    const { user, box, onSend } = setup();

    await user.type(box, "  hello  {Enter}");

    expect(onSend).toHaveBeenCalledWith("hello");
    expect(box).toHaveValue("");
  });

  it("adds a new line on Shift+Enter instead of sending", async () => {
    const { user, box, onSend } = setup();

    await user.type(box, "line1{Shift>}{Enter}{/Shift}line2");

    expect(onSend).not.toHaveBeenCalled();
    expect(box).toHaveValue("line1\nline2");
  });

  it("disables the send button until there is text", async () => {
    const { user, box } = setup();
    const button = screen.getByRole("button", { name: "Send message" });

    expect(button).toBeDisabled();
    await user.type(box, "hi");
    expect(button).toBeEnabled();
  });

  it("does not send while disabled", async () => {
    const { user, box, onSend } = setup({ disabled: true });

    await user.type(box, "hello{Enter}");

    expect(onSend).not.toHaveBeenCalled();
  });

  it("shows a Stop button while generating", async () => {
    const { user, onStop } = setup({ isGenerating: true, disabled: true });

    expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Stop generating" }));

    expect(onStop).toHaveBeenCalledTimes(1);
  });
});