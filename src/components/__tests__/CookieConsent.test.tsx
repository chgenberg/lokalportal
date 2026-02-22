import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CookieConsent from "../CookieConsent";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("CookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the banner when no consent is stored", () => {
    render(<CookieConsent />);
    expect(screen.getByText(/Vi använder cookies/)).toBeInTheDocument();
    expect(screen.getByText("Acceptera alla")).toBeInTheDocument();
    expect(screen.getByText("Endast nödvändiga")).toBeInTheDocument();
  });

  it("hides the banner when consent was already accepted", () => {
    localStorage.setItem("hittayta_cookie_consent", "accepted");
    render(<CookieConsent />);
    expect(screen.queryByText(/Vi använder cookies/)).not.toBeInTheDocument();
  });

  it("stores consent and hides when accepting", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText("Acceptera alla"));
    expect(localStorage.getItem("hittayta_cookie_consent")).toBe("accepted");
    expect(screen.queryByText(/Vi använder cookies/)).not.toBeInTheDocument();
  });

  it("stores declined and hides when declining", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText("Endast nödvändiga"));
    expect(localStorage.getItem("hittayta_cookie_consent")).toBe("declined");
    expect(screen.queryByText(/Vi använder cookies/)).not.toBeInTheDocument();
  });
});
