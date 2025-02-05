import * as d3 from "d3"
import { useEffect, useState, useRef, useCallback } from "react"
import { Box, Slider, Button } from "@mantine/core"
import React from "react"
import _ from "lodash";


// timer for 5 seconds

function Bias({ parameters, setAnswer }) {
  const ref = useRef(null)
  const { image, radius, example, blur_std, correlation, label, X, Y } = parameters
  const [clicked, setClicked] = useState([])
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [view, setView] = useState("belief") // belief, corrbefore, scatter, corrafter
  const [newRadius, setNewRadius] = useState(radius)
  const containerRef = useRef(null);
  const [belief, setBelief] = useState(0)
  const [corrBefore, setCorrBefore] = useState(0)
  const [corrAfter, setCorrAfter] = useState(0)

  // timer for 5 seconds to change view
  useEffect(() => {
    if (view !== "scatter") return;

    const timer = setTimeout(() => {
      setView("corrafter")
    }, 15000)

    return () => clearTimeout(timer)
  }, [view])


  const answerCallback = useCallback(() => {
    setAnswer({
      answers: {
        status: true,
        answer: JSON.stringify({
          clicked: clicked,
          corr_before: corrBefore,
          corr_act: correlation,
          belief: (belief-1)/6
        })
      }
    })
  }, [setAnswer, clicked, corrBefore, corrAfter, belief])



  useEffect(() => {
    if (view !== "scatter") return;
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
  }, [image, view]);


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
        <h1 style={{ color: "red" }}>Example Question</h1>
      )}
      {view === "scatter" && (
        <div>
          <h3>Explore the scatterplot of the two variables</h3>
          <h3>X: {X}</h3>
          <h3>Y: {Y}</h3>
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
                  r={newRadius}
                  step={0.001}
                  fill="transparent"
                  stroke="red"
                />
              )}
              <rect x="0" y="0" width={size.width} height={size.height} fill="transparent" stroke="black" strokeWidth="1" />
            </svg>
          </Box>
        </div>
      )}

      {view === "corrbefore" && (
        <div style={{ width: '50%', margin: '50px auto' }}>

          <h3>Estimate the correlation of the two variables below:</h3>
          <h3>X: {X}</h3>
          <h3>Y: {Y}</h3>
          <Slider
            value={corrBefore}
            onChange={setCorrBefore}
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
          <Button float="right" onClick={() => setView("scatter")}>Done</Button>
        </div>
      )}

      {view === "corrafter" && (
        <div style={{ width: '50%', margin: '50px auto' }}>
          <h3>Estimate the correlation of the scatterplot.</h3>
          <Slider
            value={corrAfter}
            onChange={setCorrAfter}
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
          <Button float="right" onClick={answerCallback}>Done</Button>
        </div>
      )}

      {view === "belief" && (
        <div style={{ width: '50%', margin: '50px auto' }}>
          <h3>How much do you believe about this statement?</h3>
          <h3>{label}</h3>
          <Slider
            value={belief}
            onChange={setBelief}
            min={1}
            max={7}
            size="xl" // Makes it larger
            color="blue"
            step="0.01"
            marks={[
              { value: 1, label: '1' },
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 4, label: '4' },
              { value: 5, label: '5' },
              { value: 6, label: '6' },
              { value: 7, label: '7' },
            ]}
          />
          <Button float="right" onClick={() => setView("corrbefore")}>Done</Button>
        </div>
      )}



    </div>
  )
}

export default Bias
