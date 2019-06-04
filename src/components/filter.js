import React, {Component} from 'react';
import {SpectrogramContext} from './spectrogram-provider';
import { getMousePos, getFreq } from "../util/conversions";
import "../styles/filter.css";

const range = 10;

class Filter extends Component {
    constructor(){
        super();
        this.state = {mouseDown: false}
    }
    componentDidMount(){
        this.ctx = this.canvas.getContext('2d');
        this.heights = new Array(this.canvas.height);
        // Load From Previous
        if(this.context.state.filterHeights){
            for (let i = 0; i < this.heights.length; i++) {
                this.heights[i] = this.context.state.filterHeights[i];
                this.ctx.fillStyle = 'black';
                this.ctx.fillRect(0, i, this.context.state.filterHeights[i], 1);
            }
        } else{
            for(let i = 0; i < this.heights.length; i++){
                this.heights[i] = this.canvas.width;
                this.ctx.fillStyle = 'black';
                this.ctx.fillRect(0, i, this.canvas.width, 1);
            }
        }
        this.renderAxesLabels();
    }

    onMouseDown = e =>{
        let pos = getMousePos(this.canvas, e);
        // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clears canvas for redraw of label
        this.ctx.clearRect(0, pos.y, this.canvas.width, range); // Clears canvas for redraw of label
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, pos.y, pos.x, range);
        for (let i = 0; i < range; i++) {
            this.heights[Math.round(pos.y + i)] = pos.x;
        }
        this.renderAxesLabels();
        this.setState({mouseDown: true}); 
    }

    onMouseMove = e =>{
        if (this.state.mouseDown) {
            let pos = getMousePos(this.canvas, e);
            this.ctx.fillStyle = 'black';
            this.ctx.clearRect(0, pos.y, this.canvas.width, range); // Clears canvas for redraw of label
            this.ctx.fillRect(0, pos.y, pos.x, range);
            for(let i =0; i<range; i++){
                this.heights[Math.round(pos.y+i)] = pos.x;
            }
            this.renderAxesLabels();
        }
    }

    onMouseUp = e =>{
        this.setState({mouseDown: false});
        this.context.setFilter(this.heights, this.canvas.width, this.canvas.height);
    }

    onMouseOut = e =>{
        if (this.state.mouseDown) {
            this.setState({mouseDown: false});
            this.context.setFilter(this.heights, this.canvas.width, this.canvas.height);
        }
    }

     renderAxesLabels(){
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
             this.ctx.fillStyle = 'white';
             this.ctx.fillText(freq, x, y);
             // Draw the units.
             this.ctx.textAlign = 'left';
             this.ctx.fillStyle = 'white';
             this.ctx.fillText(units, x + 10, y);
             // Draw a tick mark.
             this.ctx.fillRect(x + 40, y, 30, 2);
         }
     }

    render(){
        return (
        <canvas
        className="filter-canvas"
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
        onMouseOut={this.onMouseOut}   
        ref={(c) => {this.canvas = c;}}/>        
        )
    }
}

Filter.contextType = SpectrogramContext;
export default Filter;