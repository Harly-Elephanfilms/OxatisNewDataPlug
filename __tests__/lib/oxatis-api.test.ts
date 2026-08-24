import { describe, it, expect, vi } from "vitest";
import { escapeXml, createProduct } from "@/lib/oxatis-api";
import type { ProductCreateData } from "@/lib/oxatis-api";

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

describe("createProduct — XML envoyé", () => {
  async function capturePayload(product: ProductCreateData): Promise<string> {
    let sent = "";
    const fetchMock = vi.fn(async (_url: string, init: { body: string }) => {
      sent = init.body;
      return { ok: true, text: async () => "<Product><OxID>1</OxID></Product>" } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    try {
      await createProduct("app", "tok", product);
    } finally {
      vi.unstubAllGlobals();
    }
    return decodeURIComponent(new URLSearchParams(sent).get("Data") ?? "");
  }

  it("envoie la description détaillée dans <LongDescription> et la courte dans <Description>", async () => {
    const xml = await capturePayload({
      itemSKU: "655560",
      name: "Agent très spécial 44",
      description: "Résumé court",
      descriptionLong: "<b>Titre</b> : Agent très spécial 44",
    });

    expect(xml).toContain("<Description>Résumé court</Description>");
    expect(xml).toContain(
      "<LongDescription>&lt;!--#WYSIWYG#--&gt;&lt;b&gt;Titre&lt;/b&gt; : Agent très spécial 44</LongDescription>"
    );
  });

  it("n'émet pas <LongDescription> quand la description détaillée est absente", async () => {
    const xml = await capturePayload({ itemSKU: "REF1", name: "Produit", description: "Court" });
    expect(xml).not.toContain("<LongDescription>");
  });

  it("respecte l'ordre de la séquence <Product> du schéma OWS", async () => {
    const xml = await capturePayload({
      itemSKU: "REF1",
      name: "Produit",
      description: "Court",
      priceHT: 9.99,
      tva: 20,
      descriptionLong: "<p>Long</p>",
      brand: "Marque",
      stock: 5,
      weight: 0.3,
      ean: "1234567890123",
    });
    const order = [
      "<ItemSKU>", "<ProductLanguage>", "<Name>", "<Description>", "<Price>",
      "<TaxRate>", "<LongDescription>", "<Brand>", "<QuantityInStock>", "<Weight>", "<EANCode>",
    ].map((tag) => xml.indexOf(tag));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((i) => i >= 0)).toBe(true);
  });
});
