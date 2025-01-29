import * as d3 from "d3"
import { useEffect, useState, useRef } from "react"
import { Box } from "@mantine/core"
import React from "react"
import _ from "lodash";

const isObjectInList = (obj, list) => {
  return list.some(item =>
    Object.keys(obj).every(key => obj[key] === item[key])
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function punch({ parameters, setAnswer }) {
  const ref = useRef(null)
  const { image, holes, question, x_grids, y_grids } = parameters
  const [clicked, setClicked] = useState([])
  const [rectangles, setRectangles] = useState([])

  useEffect(() => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      const rect = []
      for (let i = 0; i < x_grids.length; i++) {
        for (let j = 0; j < y_grids.length; j++) {
          let width, height;
          if (i + 1 === x_grids.length) width = img.width - x_grids[i]
          else width = x_grids[i + 1] - x_grids[i]
          if (j + 1 === y_grids.length) height = img.height - y_grids[j]
          else height = y_grids[j + 1] - y_grids[j]

          rect.push({
            x: x_grids[i], // Top-left x-coordinate
            y: y_grids[j], // Top-left y-coordinate
            width: width, // Width of the rectangle
            height: height // Height of the rectangle
          })

        }
      }
      setRectangles(rect)
    };
  }, [image]);


  // Making the moving dot
  useEffect(() => {
    console.log("useEffect")
    const svg = d3.select(ref.current)
    svg
      .selectAll("rect")
      .data(rectangles)
      .join("rect")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("width", d => d.width)
      .attr("height", d => d.height)
      .attr("fill", "black")
      .attr("opacity", d => {
        const rect = { x: d.x, y: d.y }
        const full = [...holes, ...clicked]
        if (isObjectInList(rect, full)) return 0
        else return 1
      })
      .on("click", (event, d) => {
        const rect = { x: d.x, y: d.y }
        if (isObjectInList(rect, holes)) return
        let newClicked
        if (isObjectInList(rect, clicked)) newClicked = clicked.filter(item => !_.isEqual(item, rect));
        else newClicked = [...clicked, { x: d.x, y: d.y }]
        setClicked(newClicked)

        const returnable = newClicked.map(item => `[${item.x},${item.y}]`).join("\n")
        setAnswer({
          status: true,
          answers: {
            patches: returnable,
          }
        })
      })
      .on("mouseover", (event, d) => {
        const rect = { x: d.x, y: d.y }
        if (isObjectInList(rect, holes)) return
        d3.select(event.target).attr("stroke", "blue").attr("stroke-width", 2)
      })
      .on("mouseout", (event, d) => {
        const rect = { x: d.x, y: d.y }
        if (isObjectInList(rect, holes)) return
        d3.select(event.target).attr("stroke", "none")
      })
  }, [rectangles, clicked, setAnswer])

  return (
    <div>
      <h2>Please click on the patches that are essential to answer the following question.</h2>
      <h4>Q: {question}</h4>
      <Box className="ImageWrapper" style={{ width: "100%" }}>
        <svg id="clickAccuracySvg" ref={ref} width={800} height={800}>
          <image href={image} />
        </svg>
      </Box>
    </div>
  )
}

export default punch
