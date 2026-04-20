import { describe, it, expect } from "vitest";
import { escapeXml } from "@/lib/oxatis-api";

describe("escapeXml", () => {
  it("escapes ampersand", () => {
    expect(escapeXml("a & b")).toBe("a &amp; b");
  });

  it("escapes less-than", () => {
    expect(escapeXml("a < b")).toBe("a &lt; b");
  });

  it("escapes greater-than", () => {
    expect(escapeXml("a > b")).toBe("a &gt; b");
  });

  it("escapes double quote", () => {
    expect(escapeXml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quote", () => {
    expect(escapeXml("it's")).toBe("it&apos;s");
  });

  it("handles empty string", () => {
    expect(escapeXml("")).toBe("");
  });

  it("handles string with no special chars", () => {
    expect(escapeXml("hello world")).toBe("hello world");
  });

  it("escapes multiple special chars in one string", () => {
    expect(escapeXml('<tag attr="val">it\'s & more</tag>')).toBe(
      "&lt;tag attr=&quot;val&quot;&gt;it&apos;s &amp; more&lt;/tag&gt;"
    );
  });
});
