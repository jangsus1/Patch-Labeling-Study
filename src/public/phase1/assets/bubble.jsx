import * as d3 from "d3"
import { useEffect, useState, useRef, useCallback } from "react"
import { Box, Slider, Button } from "@mantine/core"
import React from "react"
import _ from "lodash";


// timer for 5 seconds

function bubble({ parameters, setAnswer }) {
  const ref = useRef(null)
  const { image, radius, example, blur_std, correlation } = parameters
  const [clicked, setClicked] = useState([])
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [view, setView] = useState("scatter") // scatter, slider, feedback
  const [newRadius, setNewRadius] = useState(radius)
  const containerRef = useRef(null);
  const [slider, setSlider] = useState(0)


  // timer for 5 seconds to change view
  useEffect(() => {
    const timer = setTimeout(() => {
      setView("slider")
    }, 15000)
    return () => clearTimeout(timer)
  }, [])


  const answerCallback = useCallback(() => {
    setAnswer({
      answers: {
        status: true,
        answer: JSON.stringify({
          clicked: clicked,
          corr_est: slider,
          corr_act: correlation
        })
      }
    })
  }, [slider, setAnswer, clicked])


  const jobDone = () => {
    answerCallback()
    setView("feedback")
  }


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
      const multiplier = scaledWidth / img.width
      setSize({ width: scaledWidth, height: scaledHeight, multiplier: multiplier });
      setNewRadius(radius * multiplier)
    };
  }, [image]);


  const clickCallback = useCallback((e) => {
    const svg = d3.select(ref.current)
    const point = d3.pointer(e, svg.node())
    const clickedCircle = { x: parseInt(point[0]), y: parseInt(point[1]) }
    const clickedCircles = [...clicked, clickedCircle]
    setClicked(clickedCircles)
  }, [clicked])

  return (
    <div>
      {example && (
        <div>
          <h1 style={{ color: "red" }}>Example Question</h1>
          <h2>Click on the scatterplot below to reveal areas!</h2>
        </div>
      )}
      {view === "scatter" && (
        <Box ref={containerRef} className="ImageWrapper" style={{ width: "100%" }}>
          <svg id="clickAccuracySvg" ref={ref} width={size.width} height={size.height} onClick={clickCallback}>

            <defs>
              <filter id="imageBlurFilter">
                <feGaussianBlur in="SourceGraphic" stdDeviation={blur_std} />
              </filter>

              <mask id="unblurMask">
                <rect width="100%" height="100%" fill="white" />
                {clicked.length > 0 && (
                  <circle
                    key={0}
                    cx={clicked[clicked.length - 1].x}
                    cy={clicked[clicked.length - 1].y}
                    r={newRadius}
                    fill="black"
                  />
                )}

              </mask>
            </defs>
            <image
              href={image}
              width={size.width}
              height={size.height}
            />
            <image
              href={image}
              width={size.width}
              height={size.height}
              filter="url(#imageBlurFilter)"
              mask="url(#unblurMask)"
            />
            {clicked.length > 0 && (
              <circle
                key={0}
                cx={clicked[clicked.length - 1].x}
                cy={clicked[clicked.length - 1].y}
                r={radius}
                step={0.001}
                fill="transparent"
                stroke="red"
              />
            )}
            <rect x="0" y="0" width={size.width} height={size.height} fill="transparent" stroke="black" strokeWidth="1" />
          </svg>
        </Box>
      )}

      {view === "slider" && (
        <div style={{ width: '80%', margin: '50px auto' }}>
          <h2>Estimate the Correlation!</h2>
          <Slider
            value={slider}
            onChange={setSlider}
            min={-1}
            max={1}
            size="xl" // Makes it larger
            color="blue"
            step="0.01"
            marks={[
              { value: -1.0, label: '-1.0' },
              { value: -0.8, label: '-0.8' },
              { value: -0.6, label: '-0.6' },
              { value: -0.4, label: '-0.4' },
              { value: -0.2, label: '-0.2' },
              { value: 0, label: '0' },
              { value: 0.2, label: '0.2' },
              { value: 0.4, label: '0.4' },
              { value: 0.6, label: '0.6' },
              { value: 0.8, label: '0.8' },
              { value: 1.0, label: '1.0' }
            ]}
          />
          <Button float="right" onClick={jobDone}>Done</Button>
        </div>
      )}

      {view === "feedback" && (
        <div>
          <h2>Your estimation: {slider}</h2>
          <h2>Actual correlation: {correlation.toFixed(2)}</h2>
        </div>
      )}


    </div>
  )
}

export default bubble
