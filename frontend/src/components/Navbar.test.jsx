import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";

const logout = vi.fn();

vi.mock("../store/useAuthStore", () => ({
  useAuthStore: () => ({
    authUser: { _id: "user-1", fullName: "Test User" },
    logout,
  }),
}));

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

describe("Navbar logout confirmation", () => {
  beforeEach(() => logout.mockReset());

  it("logs out only after confirmation", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(logout).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog", { name: "Log out?" });
    await user.click(within(dialog).getByRole("button", { name: "Log out" }));

    expect(logout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
  });

  it("supports button, Escape, and backdrop cancellation", async () => {
    const user = userEvent.setup();
    renderNavbar();
    const trigger = screen.getByRole("button", { name: "Log out" });

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    fireEvent(screen.getByRole("dialog", { name: "Log out?" }), new Event("cancel", { cancelable: true }));
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    fireEvent.click(screen.getByRole("dialog", { name: "Log out?" }));
    await waitFor(() => expect(trigger).toHaveFocus());

    expect(logout).not.toHaveBeenCalled();
  });
});
