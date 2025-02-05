import * as d3 from "d3"
import { useEffect, useState, useRef } from "react"
import { Box } from "@mantine/core"
import React from "react"
import _ from "lodash";

function Vlat({ parameters, setAnswer }) {
    const ref = useRef(null)
    const { image, question } = parameters
    const [size, setSize] = useState({ width: 0, height: 0 })
    const containerRef = useRef(null);
    const [time, setTime] = useState(40)

    // timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setTime(time - 1)
        }, 1000);
        if (time === 0) {
            alert("Time's up!")
        }
        return () => clearTimeout(timer);
    }, [time]);

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


    return (
        <div>
            <h3>{time} seconds left for this question</h3>
            <h2></h2>
            <Box ref={containerRef} className="ImageWrapper" style={{ width: "100%", display: "block" }}>
                <svg id="clickAccuracySvg" ref={ref} width={size.width} height={size.height} >
                    <image
                        href={image}
                        width={size.width}
                        height={size.height}
                    />
                </svg>
            </Box>
        </div>
    )
}

export default Vlat
