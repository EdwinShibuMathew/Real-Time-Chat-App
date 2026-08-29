import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MessageInput from "./MessageInput.jsx";

const sendMessage = vi.fn();

vi.mock("../store/useChatStore.js", () => ({
  useChatStore: () => ({ sendMessage, isSendingMessage: false }),
}));

vi.mock("react-hot-toast", () => ({ default: { error: vi.fn() } }));

describe("MessageInput", () => {
  beforeEach(() => sendMessage.mockReset());

  it("keeps the draft when sending fails", async () => {
    sendMessage.mockRejectedValueOnce(new Error("offline"));
    render(<MessageInput />);
    const input = screen.getByRole("textbox", { name: "Message" });
    await userEvent.type(input, "keep this draft");
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(sendMessage).toHaveBeenCalled());
    expect(input).toHaveValue("keep this draft");
  });

  it("clears the draft only after a successful send", async () => {
    sendMessage.mockResolvedValueOnce(true);
    render(<MessageInput />);
    const input = screen.getByRole("textbox", { name: "Message" });
    await userEvent.type(input, "sent message");
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(input).toHaveValue(""));
  });
});
