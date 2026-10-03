import { describe, expect, it } from "vitest";
import { isPhoneLoginEmail, passwordProblem, phoneLoginEmail, readLogin, staffPhone } from "../src/staff-door";

/**
 * The door reads the same person however they type themselves: an email in
 * capitals, a mobile with +974, with 00974, or bare the way a Doha office
 * writes it. A login that reads wrong is a person locked out of their panel.
 */
describe("staffPhone", () => {
  it("reads a Qatar mobile however it is written", () => {
    for (const typed of ["+974 5512 3456", "00974 55123456", "97455123456", "5512 3456", "55123456", " 5512-3456 "]) {
      expect(staffPhone(typed)).toBe("97455123456");
    }
  });

  it("keeps another country's number as it was dialled", () => {
    expect(staffPhone("+40 721 234 567")).toBe("40721234567");
    expect(staffPhone("0033 6 12 34 56 78")).toBe("33612345678");
  });

  it("refuses what is not a number", () => {
    expect(staffPhone("")).toBeNull();
    expect(staffPhone("1234")).toBeNull();
    expect(staffPhone("1234567890123456")).toBeNull();
  });
});

describe("readLogin", () => {
  it("reads an email, in small letters", () => {
    expect(readLogin("  Sara@Example.com ")).toEqual({ kind: "email", email: "sara@example.com" });
  });

  it("reads a mobile", () => {
    expect(readLogin("+974 3312 3456")).toEqual({ kind: "phone", phone: "97433123456" });
  });

  it("refuses half an email and words", () => {
    expect(readLogin("sara@")).toBeNull();
    expect(readLogin("sara")).toBeNull();
    expect(readLogin("call 55123456")).toBeNull();
    expect(readLogin("")).toBeNull();
  });
});

describe("the address behind a mobile-only login", () => {
  it("is the number at the panel's own staff domain, and is known as one", () => {
    const email = phoneLoginEmail("97455123456", "staff.example.com");
    expect(email).toBe("97455123456@staff.example.com");
    expect(isPhoneLoginEmail(email, "staff.example.com")).toBe(true);
    expect(isPhoneLoginEmail("sara@example.com", "staff.example.com")).toBe(false);
  });
});

describe("passwordProblem", () => {
  it("takes a strong password typed twice", () => {
    expect(passwordProblem("Lusail-Tower7", "Lusail-Tower7")).toBeNull();
  });

  it("says what a weak one lacks", () => {
    for (const weak of ["Short1A", "alllowercase12", "ALLUPPERCASE12", "NoNumbersHere"]) {
      expect(passwordProblem(weak, weak)).toMatch(/at least 10 characters/);
    }
  });

  it("says when the two don't match", () => {
    expect(passwordProblem("Lusail-Tower7", "Lusail-Tower8")).toMatch(/don't match/);
  });

  it("refuses the password a person was given", () => {
    expect(passwordProblem("Handed-Out-2026", "Handed-Out-2026", ["Handed-Out-2026"])).toMatch(/of your own/);
  });

  it("refuses one longer than the sign-in server reads", () => {
    const long = `Aa1${"x".repeat(80)}`;
    expect(passwordProblem(long, long)).toMatch(/72/);
  });
});
