import { describe, expect, it } from "vitest";
import { normalizeUrl } from "@/lib/url";

describe("normalizeUrl", () => {
  it.each([
    ["https://www.goodbeginningsclub.com", "https://www.goodbeginningsclub.com"],
    ["https://www.goodbeginningsclub.com/", "https://www.goodbeginningsclub.com"],
    [
      "[www.goodbeginningsclub.com](https://www.goodbeginningsclub.com)",
      "https://www.goodbeginningsclub.com",
    ],
    ["www.goodbeginningsclub.com", "https://www.goodbeginningsclub.com"],
    ["<https://abc.supabase.co>", "https://abc.supabase.co"],
    ['"https://abc.supabase.co" ', "https://abc.supabase.co"],
    ["http://localhost:3000", "http://localhost:3000"],
  ])("%s -> %s", (input, out) => {
    expect(normalizeUrl(input)).toBe(out);
  });
  it.each([[""], [undefined], ["not a url"], ["https://"]])("rejects %s", (input) => {
    expect(normalizeUrl(input)).toBeNull();
  });
});
