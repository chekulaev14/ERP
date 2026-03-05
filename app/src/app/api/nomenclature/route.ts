import { NextResponse } from "next/server";
import { allItems, bom, getChildren, getParents, categories, getItemsByType, getItemsByCategory, type ItemType } from "@/data/nomenclature";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as ItemType | null;
  const category = searchParams.get("category");
  const itemId = searchParams.get("itemId");
  const search = searchParams.get("search");

  // Получить BOM конкретной позиции
  if (itemId) {
    const children = getChildren(itemId);
    const parents = getParents(itemId);
    return NextResponse.json({ children, parents });
  }

  let items = allItems;

  if (type) {
    items = getItemsByType(type);
  }

  if (category) {
    items = items.filter((i) => i.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({ items, categories });
}
