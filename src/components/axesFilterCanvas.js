/*
This file is not currently being used. It was created for pootential usage in the filter in 
trying to eliminate the canvas blurring on the axis labels, but currently incomplete and still 
in progress
*/

import React, {Component} from 'react';
import "../styles/filter.css";
import { getFreq } from "../util/conversions";

class AxesFilterCanvas extends Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.ctx = this.canvas.getContext('2d');
    window.addEventListener("resize", this.handleResize);
    this.renderAxesLabels();
  }

  // Renders axes for this.state.ticks number of ticks, spacing them out Based
  // on props.resolutionMax/Min and the height of the container
  renderAxesLabels = () => {
    console.log("rendering axis for filter");
    // Render the vertical frequency axis.
    const ticks = 5;
    const units = 'Hz';
    const yLabelOffset = 5;
    for (var i = 0; i <= ticks; i++) {
        // Get the y coordinate from the current label.
        var percent = i / (ticks);
        var y = (1 - percent) * this.canvas.height;
        if (i === 0) {
            y -= 10;
        }
        if (i === ticks) {
            y += 10;
        }
        // Renders the position of the label 60 pixels from the right
        var x = this.canvas.width - 60;

        // Eliminate blur due to floating point coordinates in pixels
        x = (0.5 + x) | 0;
        y = (0.5 + y) | 0;

        // if (this.log) {
        // Handle a logarithmic scale.
        // var logIndex = this.logScale(index, maxSample)+minSample;
        // Never show 0 Hz.
        let resolutionMax = 20000;
        let resolutionMin = 20;
        let freq = Math.max(1, getFreq(percent, resolutionMin, resolutionMax));
        this.ctx.font = '12px Inconsolata';

        // Draw the value.
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = "white";
        this.ctx.fillText(freq, x, y);
        // Draw the units.
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = "white";
        this.ctx.fillText(units, x + 10, y);
        // Draw a tick mark.
        this.ctx.fillRect(x + 40, y, 30, 2);
    }
  }


  render() {
    return (
      <canvas
      className="axesFilter-canvas"
      ref={(c) => {this.canvas = c;}}
      />);
  }
}
export default AxesFilterCanvas;
