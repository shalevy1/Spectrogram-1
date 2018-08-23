import React, {Component} from 'react';
import "../styles/axes.css";
import { getFreq } from "../util/conversions";

class Axes extends Component {

  constructor(props) {
    super(props);
    this.state = {
      yLabelOffset: 5,
      ticks: 5,
    }
  }

  componentDidMount() {
    this.ctx = this.canvas.getContext('2d');
    window.addEventListener("resize", this.handleResize);
    this.renderAxesLabels();
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () => {
    this.props.handleResize();
    this.renderAxesLabels();
  }

  // Renders axes for this.state.ticks number of ticks, spacing them out Based
  // on props.resolutionMax/Min and the height of the container
  renderAxesLabels = () => {
    let {height, width, resolutionMax, resolutionMin} = this.props;
    this.ctx.clearRect(0, 0, width, height);
    // Render the vertical frequency axis.
    const units = 'Hz';
    // console.log("HI");

    for (var i = 0; i <= this.state.ticks; i++) {
      // Get the y coordinate from the current label.
      var percent = i / (this.state.ticks);
      var y = (1 - percent) * height;
      if (i === 0) {
        y -= 10;
      }
      if (i === this.state.ticks) {
        y += 10;
      }
      // Renders the position of the label 60 pixels from the right
      var x = width - 60;

      // if (this.log) {
      // Handle a logarithmic scale.
      // var logIndex = this.logScale(index, maxSample)+minSample;
      // Never show 0 Hz.
      let freq = Math.max(1, getFreq(percent, resolutionMin, resolutionMax));
      this.ctx.font = '18px Inconsolata';
      // Draw the value.
      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = 'white';
      this.ctx.fillText(freq, x, y + this.state.yLabelOffset);
      // Draw the units.
      this.ctx.textAlign = 'left';
      this.ctx.fillStyle = 'white';
      this.ctx.fillText(units, x + 10, y + this.state.yLabelOffset);
      // Draw a tick mark.
      this.ctx.fillRect(x + 40, y, 30, 2);
    }
  }


  render() {
    return (
      <canvas width={this.props.width} height={this.props.height} ref={(c) => {
      this.canvas = c;
    }}/>);
  }
}
export default Axes;
