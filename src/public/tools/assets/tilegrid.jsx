import * as d3 from "d3"
import { useEffect, useState, useRef } from "react"
import { Box } from "@mantine/core"
import React from "react"
import _ from "lodash";

function tilegrid({ parameters, setAnswer }) {
  const ref = useRef(null)
  const { image, question, tiles, example, ourDefinition } = parameters
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [rectangles, setRectangles] = useState(tiles.map(t => ({ ...t, clicked: false })))
  const containerRef = useRef(null);


  useEffect(() => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      const parent = containerRef.current;
      const availableHeight = window.innerHeight - parent.getBoundingClientRect().top; // Height from parent top to bottom of viewport
      const availableWidth = window.innerWidth - parent.getBoundingClientRect().left; // Width from parent left to right of viewport
      const aspectRatio = img.width / img.height; // Image aspect ratio

      let scaledWidth, scaledHeight;
      if (availableHeight * aspectRatio <= availableWidth) {
        // Fit height first
        scaledHeight = availableHeight;
        scaledWidth = availableHeight * aspectRatio;
      } else {
        // Fit width first
        scaledWidth = availableWidth;
        scaledHeight = availableWidth / aspectRatio;
      }
      setSize({ width: scaledWidth, height: scaledHeight, multiplier: scaledWidth / img.width });
    };
  }, [image]);


  useEffect(() => {
    const svg = d3.select(ref.current)
    const m = size.multiplier;
    svg
      .select("g")
      .selectAll("rect")
      .data(rectangles)
      .join("rect")
      .attr("x", d => d.x * m)
      .attr("y", d => d.y * m)
      .attr("width", d => d.width * m)
      .attr("height", d => d.height * m)
      .attr("stroke", "gray")
      .attr("stroke-width", 0.5)
      .attr("cursor", "pointer")
      .attr("fill", d => d.clicked ? "transparent" : "#e6e6e6")
      .attr("opacity", 0.9)
      .on("click", (event, d) => {
        // change rectangles
        const newRectangles = _.cloneDeep(rectangles)
        const index = newRectangles.findIndex(item => item.x === d.x && item.y === d.y)
        newRectangles[index].clicked = !newRectangles[index].clicked
        setRectangles(newRectangles)

        setAnswer({
          status: true,
          answers: {
            patches: JSON.stringify({
              patches: newRectangles.filter(item => item.clicked),
              multiplier: size.multiplier,
              question: question
            })
          }
        })
      })
      .on("mouseover", (event, d) => {
        d3.select(event.target).attr("stroke", "blue").attr("stroke-width", 2)
      })
      .on("mouseout", (event, d) => {
        d3.select(event.target).attr("stroke", "gray").attr("stroke-width", 0.5)
      });

  }, [rectangles, setAnswer, size])

  return (
    <div>
      {example && (
        <h1 style={{
          color: "red",
          position: "fixed",
          top: "50px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "transparent",
          padding: "10px",
          zIndex: 1000
        }}>Example Question</h1>
      )}
      <h2>Grids - {ourDefinition ? "Minimum area" : "Importance"}</h2>

      {example ? (
        <div>
          <h3>{question}</h3>
        </div>
      ) : (
        <div>
          <h3>Click on <u>minimum patches</u> that <span style={{ color: "red" }} > must be revealed </span> for people to <span style={{ color: "red" }} >confidently</span> answer the question below:</h3>
          <h3>Q: {question}</h3>
        </div>
      )}

      <Box ref={containerRef} className="ImageWrapper" style={{ width: "100%", display: "block" }}>
        <svg id="clickAccuracySvg" ref={ref} width={size.width} height={size.height} >
          <image
            href={image}
            width={size.width}
            height={size.height}
          />
          <g id="rectangles"></g>
        </svg>
      </Box>
    </div>
  )
}

export default tilegrid
