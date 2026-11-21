import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import AuthForm from "./AuthForm";

const fields = [
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
];

function setup({ onSubmit, notice } = {}) {
  render(
    <MemoryRouter>
      <AuthForm
        title="Log in"
        subtitle="Welcome back"
        fields={fields}
        submitLabel="Log in"
        onSubmit={onSubmit}
        notice={notice}
        footerText="New here?"
        footerLinkText="Register"
        footerLinkTo="/register"
      />
    </MemoryRouter>,
  );

  return userEvent.setup();
}

async function fillAndSubmit(user) {
  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "secret-123");
  await user.click(screen.getByRole("button", { name: "Log in" }));
}

describe("AuthForm", () => {
  it("submits the entered values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = setup({ onSubmit });

    await fillAndSubmit(user);

    expect(onSubmit).toHaveBeenCalledWith({ email: "a@b.com", password: "secret-123" });
  });

  it("shows the server's error message", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Invalid email or password"));
    const user = setup({ onSubmit });

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });

  it("disables the button while submitting", async () => {
    let finish;
    const onSubmit = vi.fn(() => new Promise((resolve) => (finish = resolve)));
    const user = setup({ onSubmit });

    await fillAndSubmit(user);
    expect(screen.getByRole("button", { name: "Log in" })).toBeDisabled();

    finish();
    await waitFor(() => expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled());
  });

  it("shows the session-expired notice when provided", () => {
    setup({ onSubmit: vi.fn(), notice: "Your session has expired. Please log in again." });

    expect(screen.getByText("Your session has expired. Please log in again.")).toBeInTheDocument();
  });
});