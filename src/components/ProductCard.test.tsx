// Regression tests for React, Next.js Link, Framer Motion, and Lucide upgrades.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductCard } from "./ProductCard";

const product = {
  id: "racket-ball",
  name: "Bola Pingpong",
  category: "Peralatan",
  price: 12000,
  unit: "pak",
  stock: 3,
  stockUnit: "pcs",
  lowStockThreshold: 5,
  variants: [],
};

describe("ProductCard", () => {
  it("renders product details, navigation, and low-stock status", () => {
    const markup = renderToStaticMarkup(
      <ProductCard product={product} index={0} />,
    );

    expect(markup).toContain('href="/produk/racket-ball"');
    expect(markup).toContain("Bola Pingpong");
    expect(markup).toContain("Rp");
    expect(markup).toContain("12.000");
    expect(markup).toContain("Stok: 3 pcs");
    expect(markup).toContain("Rendah");
  });

  it("shows available status when stock is above the threshold", () => {
    const markup = renderToStaticMarkup(
      <ProductCard
        product={{ ...product, stock: 6 }}
        index={0}
      />,
    );

    expect(markup).toContain("Tersedia");
    expect(markup).toContain("Stok: 6 pcs");
  });
});
