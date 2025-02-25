import * as d3 from "d3"
import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { Box, Button, Slider } from "@mantine/core"
import React from "react"
import _ from "lodash";
import DivergingSlider from "./Slider"
// Import ttrack modules
import { Registry, initializeTrrack } from "@trrack/core";

function Bubble({ parameters, setAnswer }) {
  const ref = useRef(null)
  const { image, radius, example, seconds, correlation, label, X, Y } = parameters
  const [clicked, setClicked] = useState([])
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [view, setView] = useState("belief") // belief, corrbefore, scatter, corrafter
  const [newRadius, setNewRadius] = useState(radius)
  const containerRef = useRef(null);
  const [belief, setBelief] = useState(4)
  const [corrBefore, setCorrBefore] = useState(0)
  const [corrAfter, setCorrAfter] = useState(0)

  // Initialize ttrack with a registry and click action
  const { actions, trrack } = useMemo(() => {
    const reg = Registry.create();
    const clickAction = reg.register('click', (state, clickRecord) => {
      state.clickRecord = clickRecord;
      return state;
    });
    const trrackInst = initializeTrrack({
      registry: reg,
      initialState: { clickRecord: { timestamp: new Date().getTime() } },
    });
    return { actions: { clickAction }, trrack: trrackInst };
  }, []);

  // Timer to change view after a delay when in scatter view
  useEffect(() => {
    if (view !== "scatter") return;
    const timer = setTimeout(() => {
      setView("corrafter")
    }, seconds*1000)
    return () => clearTimeout(timer)
  }, [view])

  // Answer callback for the slider in the "corrafter" view
  const answerCallback = useCallback((newCorrAfter) => {
    setAnswer({
      answers: {
        status: true,
        answer: JSON.stringify({
          clicked: clicked,
          corrBefore: corrBefore,
          corrActual: correlation,
          corrAfter: newCorrAfter,
          belief: (belief - 1) / 6
        })
      },
      provenanceGraph: trrack.graph.backend,
    })
    setCorrAfter(newCorrAfter)
  }, [clicked, corrBefore, correlation, trrack, setAnswer])

  // Adjust image size when in scatter view
  useEffect(() => {
    if (view !== "scatter") return;
    const img = new Image();
    img.src = image;
    img.onload = () => {
      const parent = containerRef.current;
      const availableHeight = window.innerHeight - parent.getBoundingClientRect().top;
      const availableWidth = window.innerWidth - parent.getBoundingClientRect().left;
      const aspectRatio = img.width / img.height;
      let scaledWidth, scaledHeight;
      if (availableHeight * aspectRatio <= availableWidth) {
        scaledHeight = availableHeight;
        scaledWidth = availableHeight * aspectRatio;
      } else {
        scaledWidth = availableWidth;
        scaledHeight = availableWidth / aspectRatio;
      }
      const multiplier = scaledWidth / img.width
      setSize({ width: scaledWidth, height: scaledHeight, multiplier: multiplier });
      setNewRadius(radius * multiplier)
    };
  }, [image, view]);

  // Click callback that records click events and tracks them with ttrack
  const clickCallback = useCallback((e) => {
    const svg = d3.select(ref.current)
    const point = d3.pointer(e, svg.node())
    const clickedCircle = { x: parseInt(point[0]), y: parseInt(point[1]) }
    const newClicked = [...clicked, clickedCircle]
    setClicked(newClicked)
    // Create a click record with current radius and image scale multiplier
    const clickRecord = { x: clickedCircle.x, y: clickedCircle.y, radius: newRadius, multiplier: size.multiplier }
    trrack.apply('click', actions.clickAction(clickRecord));
  }, [clicked, newRadius, size, trrack, actions]);

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
                  <feGaussianBlur in="SourceGraphic" stdDeviation={17} />
                </filter>
                <mask id="unblurMask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect x="0" y="0" width="13.1%" height="100%" fill="black" />
                  <rect x="0" y="89%" width="100%" height="12.8%" fill="black" />

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
          <h3>Predict the correlation of the two variables below:</h3>
          <h3>X: {X}</h3>
          <h3>Y: {Y}</h3>
          <DivergingSlider
            value={corrBefore}
            setValue={setCorrBefore}
            min={-1}
            max={1}
            step={0.01}
            tickInterval={0.2}
          />
          <Button float="right" onClick={() => setView("scatter")}>Done</Button>
        </div>
      )}

      {view === "corrafter" && (
        <div style={{ width: '50%', margin: '50px auto' }}>
          <h3>Estimate the correlation of the scatterplot.</h3>
          <DivergingSlider
            value={corrAfter}
            setValue={answerCallback}
            min={-1}
            max={1}
            step={0.01}
            tickInterval={0.2}
          />
        </div>
      )}

      {view === "belief" && (
        <div style={{ width: '50%', margin: '50px auto' }}>
          <h3>How much do you believe about this statement?</h3>
          <h3>{label}</h3>
          <div style={{ marginBottom: 30 }}>
            <Slider
              value={belief}
              onChange={setBelief}
              min={1}
              max={7}
              defaultValue={4}
              size="xl"
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
          </div>
          <Button onClick={() => setView("corrbefore")}>Done</Button>
        </div>
      )}
    </div>
  )
}

export default Bubble