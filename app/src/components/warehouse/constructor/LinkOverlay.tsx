"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Link {
  fromId: string;
  toId: string;
}

interface LinkOverlayProps {
  links: Link[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onRemoveLink: (fromId: string, toId: string) => void;
  zoom: number;
}

interface LinkMidpoint {
  fromId: string;
  toId: string;
  x: number;
  y: number;
}

export function LinkOverlay({ links, containerRef, onRemoveLink, zoom }: LinkOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [midpoints, setMidpoints] = useState<LinkMidpoint[]>([]);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const drawLines = useCallback(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width / zoom;
    const h = rect.height / zoom;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.style.width = `${w}px`;
    svg.style.height = `${h}px`;

    // Очищаем SVG
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const newMidpoints: LinkMidpoint[] = [];

    for (const link of links) {
      const fromEl = container.querySelector<HTMLElement>(`[data-card-id="${link.fromId}"]`);
      const toEl = container.querySelector<HTMLElement>(`[data-card-id="${link.toId}"]`);
      if (!fromEl || !toEl) continue;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      const fromX = (fromRect.right - rect.left) / zoom;
      const fromY = (fromRect.top + fromRect.height / 2 - rect.top) / zoom;
      const toX = (toRect.left - rect.left) / zoom;
      const toY = (toRect.top + toRect.height / 2 - rect.top) / zoom;
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;

      const linkKey = `${link.fromId}:${link.toId}`;
      const isHovered = hoveredLink === linkKey;

      // Bezier path
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`);
      path.setAttribute("stroke", isHovered ? "#93c5fd" : "#d4d4d4");
      path.setAttribute("stroke-width", isHovered ? "2" : "1.5");
      path.setAttribute("fill", "none");
      svg.appendChild(path);

      // Dots at endpoints
      for (const [cx, cy] of [[fromX, fromY], [toX, toY]]) {
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", String(cx));
        dot.setAttribute("cy", String(cy));
        dot.setAttribute("r", "3");
        dot.setAttribute("fill", isHovered ? "#93c5fd" : "#d4d4d4");
        svg.appendChild(dot);
      }

      newMidpoints.push({ fromId: link.fromId, toId: link.toId, x: midX, y: midY });
    }

    setMidpoints(newMidpoints);
  }, [links, containerRef, hoveredLink, zoom]);

  useEffect(() => {
    const timer = setTimeout(drawLines, 30);
    return () => clearTimeout(timer);
  }, [drawLines, zoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => drawLines());
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef, drawLines]);

  return (
    <>
      <svg
        ref={svgRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Hover zones + remove buttons */}
      {midpoints.map((mp) => {
        const linkKey = `${mp.fromId}:${mp.toId}`;
        const isHovered = hoveredLink === linkKey;
        return (
          <div
            key={linkKey}
            className="absolute z-[15]"
            style={{ left: mp.x, top: mp.y, transform: "translate(-50%, -50%)" }}
            onMouseEnter={() => setHoveredLink(linkKey)}
            onMouseLeave={() => setHoveredLink(null)}
          >
            {/* Invisible hover zone */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">
              {isHovered && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemoveLink(mp.fromId, mp.toId); }}
                  className="w-4 h-4 rounded-full bg-white border-[1.5px] border-gray-200 text-gray-400 text-[11px] leading-[13px] text-center hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                >
                  x
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
