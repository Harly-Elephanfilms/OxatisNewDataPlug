import { describe, it, expect } from "vitest";
import { extractXml, parseOxatisError, oxatisResponse, sleep } from "@/lib/api-helpers";

describe("extractXml", () => {
  it("extracts value from a simple tag", () => {
    expect(extractXml("<Name>foo</Name>", "Name")).toBe("foo");
  });

  it("extracts value from a tag with attributes", () => {
    expect(extractXml('<Name lang="fr">bar</Name>', "Name")).toBe("bar");
  });

  it("returns empty string when tag is absent", () => {
    expect(extractXml("<Other>x</Other>", "Name")).toBe("");
  });

  it("decodes HTML entities", () => {
    expect(extractXml("<Name>L&apos;été &amp; &lt;été&gt;</Name>", "Name")).toBe(
      "L'été & <été>"
    );
  });

  it("handles multiline content", () => {
    expect(extractXml("<Desc>line1\nline2</Desc>", "Desc")).toBe("line1\nline2");
  });
});

describe("parseOxatisError", () => {
  it("returns error message on empty string", () => {
    expect(parseOxatisError("")).toBeTruthy();
  });

  it("returns error message on HTML response", () => {
    expect(parseOxatisError("<!DOCTYPE html><html></html>")).toBeTruthy();
  });

  it("returns error on lowercase doctype", () => {
    expect(parseOxatisError("<!doctype html><html></html>")).toBeTruthy();
  });

  it("returns error on non-200 StatusCode", () => {
    const xml =
      "<Response><StatusCode>503</StatusCode><ErrorDetails>Service unavailable</ErrorDetails></Response>";
    expect(parseOxatisError(xml)).toBe("Service unavailable");
  });

  it("returns fallback error when StatusCode non-200 but no ErrorDetails", () => {
    const xml = "<Response><StatusCode>500</StatusCode></Response>";
    expect(parseOxatisError(xml)).toBeTruthy();
  });

  it("returns null on StatusCode 200", () => {
    expect(
      parseOxatisError("<Response><StatusCode>200</StatusCode></Response>")
    ).toBeNull();
  });
});

describe("oxatisResponse", () => {
  it("returns success:true on StatusCode 200", async () => {
    const res = oxatisResponse(
      "<Response><StatusCode>200</StatusCode></Response>"
    );
    const json = await res.json();
    expect(json).toEqual({ success: true });
  });

  it("returns error on non-200 StatusCode", async () => {
    const xml =
      "<Response><StatusCode>500</StatusCode><ErrorDetails>Oops</ErrorDetails></Response>";
    const res = oxatisResponse(xml);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Oops");
  });
});

describe("sleep", () => {
  it("resolves after the specified delay", async () => {
    const start = Date.now();
    await sleep(20);
    expect(Date.now() - start).toBeGreaterThanOrEqual(15);
  });
});
