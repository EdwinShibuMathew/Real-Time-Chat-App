import { expect, test } from "@playwright/test";

async function signUp(page, name, email) {
  await page.goto("/signup");
  await page.getByLabel("Full Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL("/");
}

test("two authenticated users exchange a real-time message", async ({ browser }) => {
  const receiverContext = await browser.newContext();
  const senderContext = await browser.newContext();
  const receiver = await receiverContext.newPage();
  const sender = await senderContext.newPage();

  await signUp(receiver, "Receiver User", "receiver-e2e@example.com");
  await signUp(sender, "Sender User", "sender-e2e@example.com");

  await expect(receiver.getByRole("button", { name: /Sender User/ })).toBeVisible();
  await expect(receiver.getByText("Online", { exact: true })).toBeVisible();

  await receiver.getByRole("button", { name: /Sender User/ }).click();
  await sender.getByRole("button", { name: /Receiver User/ }).click();
  await sender.getByRole("textbox", { name: "Message" }).fill("Hello in real time");
  await sender.getByRole("button", { name: "Send message" }).click();

  await expect(receiver.getByText("Hello in real time")).toBeVisible();
  await expect(receiver.getByText("Online", { exact: true }).last()).toBeVisible();

  await senderContext.close();
  await expect(receiver.getByText("Offline", { exact: true }).last()).toBeVisible({ timeout: 2_000 });

  await receiverContext.close();
});
