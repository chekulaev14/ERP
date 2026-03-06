"use client";

import { Badge } from "@/components/ui/badge";
import { type ItemType, itemTypeLabels, unitLabels } from "@/data/nomenclature";
import type { ConstructorItem } from "./ConstructorWizard";

interface ProductData {
  name: string;
  unit: string;
  description: string;
}

const typeColors: Record<ItemType, string> = {
  material: "bg-amber-100 text-amber-800 border-amber-300",
  blank: "bg-orange-100 text-orange-800 border-orange-300",
  part: "bg-blue-100 text-blue-800 border-blue-300",
  subassembly: "bg-purple-100 text-purple-800 border-purple-300",
  product: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

interface TreeNode {
  tempId: string;
  name: string;
  type: ItemType;
  unit: string;
  quantity?: string;
  children: TreeNode[];
}

function buildTree(
  productTempId: string,
  product: ProductData,
  subassemblies: ConstructorItem[],
  parts: ConstructorItem[],
  blanks: ConstructorItem[],
  materials: ConstructorItem[]
): TreeNode {
  const allItems: { item: ConstructorItem; type: ItemType }[] = [
    ...subassemblies.map((i) => ({ item: i, type: "subassembly" as ItemType })),
    ...parts.map((i) => ({ item: i, type: "part" as ItemType })),
    ...blanks.map((i) => ({ item: i, type: "blank" as ItemType })),
    ...materials.map((i) => ({ item: i, type: "material" as ItemType })),
  ];

  function getChildren(parentTempId: string): TreeNode[] {
    return allItems
      .filter((entry) => entry.item.parentTempId === parentTempId && entry.item.name)
      .map((entry) => ({
        tempId: entry.item.tempId,
        name: entry.item.name,
        type: entry.type,
        unit: entry.item.unit,
        quantity: entry.item.quantity,
        children: getChildren(entry.item.tempId),
      }));
  }

  return {
    tempId: productTempId,
    name: product.name || "Новое изделие",
    type: "product",
    unit: product.unit,
    children: getChildren(productTempId),
  };
}

function TreeNodeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        {depth > 0 && (
          <span className="text-border text-xs">└</span>
        )}
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 shrink-0 ${typeColors[node.type]}`}
        >
          {itemTypeLabels[node.type].slice(0, 3)}
        </Badge>
        <span className="text-xs text-foreground truncate">{node.name}</span>
        {node.quantity && depth > 0 && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            ×{node.quantity} {unitLabels[node.unit as keyof typeof unitLabels] || node.unit}
          </span>
        )}
      </div>
      {node.children.map((child) => (
        <TreeNodeView key={child.tempId} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function TreePreview({
  product,
  productTempId,
  subassemblies,
  parts,
  blanks,
  materials,
}: {
  product: ProductData;
  productTempId: string;
  subassemblies: ConstructorItem[];
  parts: ConstructorItem[];
  blanks: ConstructorItem[];
  materials: ConstructorItem[];
}) {
  const tree = buildTree(productTempId, product, subassemblies, parts, blanks, materials);

  if (!product.name && subassemblies.length === 0 && parts.length === 0 && blanks.length === 0 && materials.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        Начните заполнять данные
      </p>
    );
  }

  return <TreeNodeView node={tree} />;
}
