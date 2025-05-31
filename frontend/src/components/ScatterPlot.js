"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function ScatterPlot({
  data,
  onSelectionChange,
  colorAttribute = "cluster", // Add this prop with default fallback
}) {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isLassoMode, setIsLassoMode] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.max(600, container.clientHeight),
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.x))
      .range([0, width])
      .nice();

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.y))
      .range([height, 0])
      .nice();

    // Fix: Use the colorAttribute prop instead of hardcoded 'cluster'
    const getColorValue = (d) => {
      if (!colorAttribute) return "default"; // Default color when no attribute selected
      return d[colorAttribute] || "unknown";
    };

    const colorScale = d3
      .scaleOrdinal()
      .domain([...new Set(data.map(getColorValue))])
      .range(colorAttribute ? d3.schemeCategory10 : ["#64748b"]); // Use gray when no attribute selected

    const g = svg
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        g.attr(
          "transform",
          `translate(${margin.left + event.transform.x},${
            margin.top + event.transform.y
          }) scale(${event.transform.k})`
        );
      });

    svg.call(zoom);

    // Add points
    const circles = g
      .selectAll(".point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 4)
      .style("fill", (d) => colorScale(getColorValue(d))) // Use the dynamic color function
      .style("opacity", 0.7)
      .style("stroke", "#fff")
      .style("stroke-width", 0.5)
      .style("cursor", "pointer");

    // Add hover effects
    circles
      .on("mouseover", (event, d) => {
        const svgRect = svgRef.current.getBoundingClientRect();
        setHoveredPoint({
          ...d,
          x: event.clientX - svgRect.left,
          y: event.clientY - svgRect.top,
        });
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr("r", 6)
          .style("opacity", 1);
      })
      .on("mousemove", (event, d) => {
        const svgRect = svgRef.current.getBoundingClientRect();
        setHoveredPoint((prev) =>
          prev
            ? {
                ...prev,
                x: event.clientX - svgRect.left,
                y: event.clientY - svgRect.top,
              }
            : null
        );
      })
      .on("mouseout", (event) => {
        setHoveredPoint(null);
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr("r", 4)
          .style("opacity", 0.7);
      });

    // Lasso selection
    let lassoPath = [];
    let isDrawing = false;

    const lasso = svg
      .append("path")
      .attr("class", "lasso")
      .style("fill", "rgba(59, 130, 246, 0.1)")
      .style("stroke", "#3b82f6")
      .style("stroke-width", 2)
      .style("stroke-dasharray", "5,5")
      .style("opacity", 0)
      .style("pointer-events", "none");

    // Create invisible overlay for lasso events
    const lassoOverlay = svg
      .append("rect")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .style("fill", "none")
      .style("pointer-events", isLassoMode ? "all" : "none")
      .style("cursor", isLassoMode ? "crosshair" : "default");

    // Update overlay when lasso mode changes
    lassoOverlay.style("pointer-events", isLassoMode ? "all" : "none");

    lassoOverlay.on("mousedown", (event) => {
      if (!isLassoMode) return;

      event.preventDefault();
      event.stopPropagation();

      isDrawing = true;
      lassoPath = [];
      const [x, y] = d3.pointer(event, svg.node());
      lassoPath.push([x - margin.left, y - margin.top]);

      lasso.style("opacity", 1);
    });

    lassoOverlay.on("mousemove", (event) => {
      if (!isDrawing || !isLassoMode) return;

      event.preventDefault();
      const [x, y] = d3.pointer(event, svg.node());
      lassoPath.push([x - margin.left, y - margin.top]);

      if (lassoPath.length > 1) {
        const pathString = `M${lassoPath.map((p) => p.join(",")).join("L")}Z`;
        lasso.attr("d", pathString);
      }
    });

    lassoOverlay.on("mouseup", (event) => {
      if (!isDrawing || !isLassoMode) return;

      event.preventDefault();
      isDrawing = false;

      // Hide lasso path
      lasso.style("opacity", 0);

      if (lassoPath.length > 2) {
        // Check which points are inside the lasso
        const selectedPoints = data.filter((d) => {
          const point = [xScale(d.x), yScale(d.y)];
          return isPointInPolygon(point, lassoPath);
        });

        onSelectionChange(selectedPoints);

        // Highlight selected points
        circles
          .style("stroke", (d) => {
            const isSelected = selectedPoints.some(
              (selected) => selected.id === d.id
            );
            return isSelected ? "#fbbf24" : "#fff";
          })
          .style("stroke-width", (d) => {
            const isSelected = selectedPoints.some(
              (selected) => selected.id === d.id
            );
            return isSelected ? 3 : 0.5;
          })
          .style("opacity", (d) => {
            const isSelected = selectedPoints.some(
              (selected) => selected.id === d.id
            );
            return isSelected ? 1 : 0.7;
          });
      }

      lassoPath = [];
    });

    // Disable zoom when in lasso mode
    if (isLassoMode) {
      svg.on(".zoom", null);
    } else {
      svg.call(zoom);
    }
  }, [data, dimensions, isLassoMode, colorAttribute]); // Add colorAttribute to dependencies

  // Point in polygon test
  const isPointInPolygon = (point, polygon) => {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }

    return inside;
  };

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setIsLassoMode(!isLassoMode)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            isLassoMode
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          {isLassoMode ? "Exit Lasso" : "Lasso Select"}
        </button>

        {onSelectionChange && (
          <button
            onClick={() => {
              onSelectionChange([]);
              // Reset circle highlighting
              if (svgRef.current) {
                d3.select(svgRef.current)
                  .selectAll(".point")
                  .style("stroke", "#fff")
                  .style("stroke-width", 0.5)
                  .style("opacity", 0.7);
              }
            }}
            className="px-3 py-1 rounded text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Clear Selection
          </button>
        )}
      </div>

      <svg ref={svgRef} className="w-full" />

      {hoveredPoint && (
        <div
          className="absolute pointer-events-none bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-600 max-w-sm z-20"
          style={{
            left: Math.min(hoveredPoint.x + 15, dimensions.width - 300),
            top: Math.max(hoveredPoint.y - 15, 10),
          }}
        >
          <div className="font-medium text-sm mb-2 leading-tight">
            {hoveredPoint.text?.substring(0, 150)}
            {hoveredPoint.text?.length > 150 ? "..." : ""}
          </div>
          <div className="text-xs text-slate-400 flex justify-between">
            <span>Cluster: {hoveredPoint.cluster}</span>
            <span>ID: {hoveredPoint.id}</span>
          </div>
          {hoveredPoint.language && (
            <div className="text-xs text-blue-400 mt-1">
              Topic:{" "}
              {hoveredPoint.language +
                " " +
                hoveredPoint.sentiment +
                " " +
                hoveredPoint.cats}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
