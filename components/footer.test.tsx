/** @jest-environment jsdom */

import { Footer } from "./footer";
import { render, screen, within } from "@testing-library/react";

describe("Footer component", () => {
  beforeEach(() => {
    render(<Footer />);
  });

  it("renders a single footer landmark", () => {
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
  });

  it("renders the brand name with its punctuation", () => {
    const footer = within(screen.getByRole("contentinfo"));
    expect(footer.getByText("PULSE").textContent).toBe("PULSE.");
  });

  it("renders the brand tagline", () => {
    const footer = within(screen.getByRole("contentinfo"));
    expect(
      footer.getByText("Smarter accessories for a life in motion."),
    ).toBeTruthy();
  });

  it.each([
    { section: "Shop", links: ["Products", "Cases", "Audio", "Power"] },
    { section: "Help", links: ["Delivery", "Returns", "Warranty", "Contact"] },
    {
      section: "Account",
      links: ["Sign in", "Create account", "Orders", "Settings"],
    },
  ])("renders the expected links in the $section section", ({ section, links }) => {
    const footer = within(screen.getByRole("contentinfo"));
    const group = within(footer.getByText(section).parentElement!);

    expect(group.getAllByRole("link")).toHaveLength(links.length);
    for (const name of links) {
      expect(group.getByRole("link", { name })).toBeTruthy();
    }
  });

  it("links Products to the product catalog", () => {
    const footer = within(screen.getByRole("contentinfo"));
    expect(
      footer.getByRole("link", { name: "Products" }).getAttribute("href"),
    ).toBe("/products");
  });

  it("renders the copyright notice", () => {
    const footer = within(screen.getByRole("contentinfo"));
    expect(
      footer.getByText("\u00a9 2026 Pulse. Designed for everyday power."),
    ).toBeTruthy();
  });
});