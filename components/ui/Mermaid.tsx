"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Button } from "./button";

type MermaidProps = {
  chart: string;
};

export default function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState("");

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "default" });

    const renderChart = async () => {
      try {
        const { svg } = await mermaid.render("mermaid-chart", chart);
        setSvg(svg);
      } catch (e) {
        console.error("Mermaid render error:", e);
      }
    };

    renderChart();
  }, [chart]);

  const downloadAsSVG = () => {
    if (!svg) return;
    
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mermaid-chart.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAsPNG = () => {
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "mermaid-chart.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    };

    const svgBlob = new Blob([svg], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    img.src = svgUrl;
  };

  return (
    <div className="p-5">
      <div className="mb-4 flex gap-2">
        <Button
          onClick={downloadAsSVG}
          disabled={!svg}
          className="bg-black text-white hover:bg-neutral-700"
        >
          Download SVG
        </Button>
      </div>
      <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}