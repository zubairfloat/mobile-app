import { money, orderClient, statusLabel } from "./orders";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

jest.mock("./supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("order test", () => {
  test("money with currency format USD", () => {
    expect(money(40)).toBe("$40.00");
  });
  test("replace underscores with spaces", () => {
    expect(statusLabel("out_of_stock")).toBe("out of stock");
  });
  test("replace underscores with spaces for another status", () => {
    expect(statusLabel("in_stock")).toBe("in stock");
  });
  test("replace underscores with spaces for yet another status", () => {
    expect(statusLabel("pre_order")).toBe("pre order");
  });
  test("negative value for money", () => {
    expect(money(-40)).toBe("-$40.00");
  });
});

describe("OrderClient", () => {
  const user = { id: "user-1" };
  const supabase = { auth: { getUser: jest.fn() } };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(createClient).mockResolvedValue(
      supabase as unknown as Awaited<ReturnType<typeof createClient>>,
    );
    supabase.auth.getUser.mockResolvedValue({ data: { user } });
  });
  test("returns the client and user when signed in", async () => {
    await expect(orderClient()).resolves.toEqual({ supabase, user });
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
    expect(redirect).not.toHaveBeenCalled();
  });

  test("redirects to login when user is undefined", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: undefined } });
    const redirectError = new Error("NEXT_REDIRECT");
    jest.mocked(redirect).mockImplementationOnce(() => {
      throw redirectError;
    });

    await expect(orderClient()).rejects.toBe(redirectError);
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/login?next=/orders");
  });
});
