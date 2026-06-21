"use client";

import { useMemo } from "react";
import { FEMALE_SVG, MALE_SVG } from "@/lib/figures";

interface Props {
  /** SVG region class → tint opacity (0–1). */
  regionOpacity: Record<string, number>;
  figure: "female" | "male";
}

const HEAT = "#ea580c"; // orange-600

export function BodyMap({ regionOpacity, figure }: Props) {
  const raw = figure === "male" ? MALE_SVG : FEMALE_SVG;
  // The figures reference the musculature photo as a relative "img/..." path;
  // make it absolute so it resolves from /img regardless of route.
  const svg = useMemo(
    () => raw.replace(/(xlink:href|href)="img\//g, '$1="/img/'),
    [raw],
  );

  const rules = Object.entries(regionOpacity)
    .map(([region, op]) => `.body-map .${region}{fill-opacity:${op.toFixed(2)}}`)
    .join("");

  return (
    <div className="body-map">
      <style>{
        `.body-map svg{width:100%;height:auto;display:block}` +
        `.body-map image{width:700px;height:800px}` +
        // regions are transparent orange overlays; opacity carries the frequency
        `.body-map path{fill:${HEAT};fill-opacity:0;stroke:none;transition:fill-opacity .25s ease}` +
        rules
      }</style>
      {/* Static figure markup (reused from the original Split Visualiser). */}
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
