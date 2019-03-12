import React, { Component } from 'react';
import generateScale from '../util/generateScale';
import Tone from 'tone';
import '../styles/note-lines.css';
import { MyContext } from './my-provider';

import {
  getGain,
  getFreq,
  getMousePos,
  freqToIndex
} from "../util/conversions";

const NUM_VOICES = 6;

const release = 2;
let options = {
  oscillator: {
    type: "sine"
  },
  envelope: {
    attack: 0.1,
    release: release
  }
};
class NoteLines extends Component {

  constructor(props) {
    super(props);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.state = {
      mouseDown: false,
      touch: false,
      currentVoice: 0,
      voices: 0, //voices started with on event
      feedback: false
    }
  }

  componentDidMount() {
    this.ctx = this.canvas.getContext('2d');
    window.addEventListener("resize", this.handleResize);
    Tone.context = this.props.context;
    this.synths = new Array(NUM_VOICES);
    this.masterVolume = new Tone.Volume(0);
    for (let i = 0; i < NUM_VOICES; i++) {
      this.synths[i] = new Tone.Synth(options);
      this.synths[i].connect(this.masterVolume);
    }
    this.masterVolume.connect(Tone.Master);
    this.masterVolume.mute = !this.context.state.soundOn;
    this.frequencies = {};
    this.freq = 1;
    this.goldIndices = [];
    this.renderNoteLines();

  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
    this.masterVolume.mute = true;

  }
  setAudioVariables(){
    if (this.context.state.soundOn === false) {
      this.masterVolume.mute = true;
    } else {
      this.masterVolume.mute = false;
    }
    if (this.masterVolume.mute === false && this.context.state.outputVolume && this.context.state.outputVolume !== this.masterVolume.volume.value) {
      this.masterVolume.volume.value = getGain(1 - (this.context.state.outputVolume) / 100);
    }
    if (this.context.state.headphoneMode) {
      // If Headphone Mode, connect the masterVolume to the graph
      if (!this.state.feedback) {
        this.masterVolume.connect(this.props.analyser);
        this.setState({
          feedback: true
        });
      }
    } else {
      if (this.state.feedback) {
        this.masterVolume.disconnect(this.props.analyser);
        this.setState({
          feedback: false
        });
      }
    }
  }

  onMouseDown(e) {
    e.preventDefault();
    this.setAudioVariables();
    let {
      height,
      width,
      resolutionMax,
      resolutionMin
    } = this.context.state;
    let pos = getMousePos(this.canvas, e);
    let yPercent = 1 - pos.y / height;
    let xPercent = 1 - pos.x / width;
    let gain = getGain(xPercent);
    let freq = getFreq(yPercent, resolutionMin, resolutionMax);
    let newVoice = (this.state.currentVoice + 1) % NUM_VOICES; // Mouse always changes to new "voice"

    for (let j in this.frequencies) {
      if (Math.abs(this.frequencies[j] - freq) < 0.01 * freq) {
        if (this.frequencies[j] !== this.freq) {
          this.synths[newVoice] = new Tone.Synth(options);
          this.synths[newVoice].connect(this.masterVolume);
          this.synths[newVoice].triggerAttack(this.frequencies[j]);
          this.synths[newVoice].volume.value = gain;
          this.freq = this.frequencies[j];
          let index = freqToIndex(this.frequencies[j], this.context.state.resolutionMax, this.context.state.resolutionMin, this.context.state.height);
          // this.goldIndices.splice(this.state.currentVoice, 1);// Sets the Gold Line to the new Line
          if (!this.goldIndices.includes(index)) {
            this.goldIndices[this.state.currentVoice] = index;
          }
          this.renderNoteLines();
          // let endTime =  this.props.context.currentTime + release;
          this.label(j, pos.x, pos.y + 2);

        }

        break;
      }
    }
    this.setState({
      mouseDown: true,
      currentVoice: newVoice,
      voices: this.state.voices + 1
    });
  }

  onMouseMove(e) {
    e.preventDefault();
    if (this.state.mouseDown) {
      let { height, width, soundOn, resolutionMax, resolutionMin } = this.context.state;
      let pos = getMousePos(this.canvas, e);
      let yPercent = 1 - pos.y / height;
      let xPercent = 1 - pos.x / width;
      let gain = getGain(xPercent);
      let freq = getFreq(yPercent, resolutionMin, resolutionMax);
      if (soundOn) {
        for (let j in this.frequencies) {
          if (Math.abs(this.frequencies[j] - freq) < 0.01 * freq) {
            if (this.frequencies[j] !== this.freq) {
              let endTime = this.props.context.currentTime + release;
              this.synths[this.state.currentVoice].volume.cancelAndHoldAtTime(this.props.context.currentTime);
              this.synths[this.state.currentVoice].volume.exponentialRampToValueAtTime(-80, endTime);
              this.synths[this.state.currentVoice].oscillator.stop(this.props.context.currentTime + release);
              this.synths[this.state.currentVoice] = null;
              this.synths[this.state.currentVoice] = new Tone.Synth(options);
              this.synths[this.state.currentVoice].connect(this.masterVolume);
              this.synths[this.state.currentVoice].triggerAttack(this.frequencies[j])
              this.synths[this.state.currentVoice].volume.value = gain;

              let index = freqToIndex(this.frequencies[j], this.context.state.resolutionMax, this.context.state.resolutionMin, this.context.state.height);
              if (!this.goldIndices.includes(index)) {
                this.goldIndices[this.state.currentVoice] = index;
              }
              this.goldIndices.splice(this.state.currentVoice - 1, 1); // Sets the Gold Line to the new Line
              this.renderNoteLines();
              this.freq = this.frequencies[j];
              this.label(j, pos.x, pos.y + 2);

            }
            this.synths[this.state.currentVoice].volume.value = gain;
            break;
          }
        }
      }
    }
  }

  onMouseUp(e) {
    e.preventDefault();
    this.setState({
      mouseDown: false
    });
    this.synths[this.state.currentVoice].triggerRelease();
    this.synths[this.state.currentVoice] = null;
    this.synths[this.state.currentVoice] = new Tone.Synth(options);
    this.synths[this.state.currentVoice].volume.value = -Infinity;
    this.goldIndices = [];
    this.freq = -1;
    this.renderNoteLines();

  }
  onMouseOut(e) {
    e.preventDefault();
    this.setState({
      mouseDown: false
    });
    this.synths[this.state.currentVoice].triggerRelease();
    this.goldIndices = [];
    this.freq = -1;
    this.renderNoteLines();

  }

  onTouchStart(e) {
    e.preventDefault();
    this.setAudioVariables();    
    let { height, width, soundOn, resolutionMax, resolutionMin } = this.context.state;
    let pos = getMousePos(this.canvas, e.touches[0]);
    let yPercent = 1 - pos.y / height;
    let xPercent = 1 - pos.x / width;
    let gain = getGain(xPercent);
    let freq = getFreq(yPercent, resolutionMin, resolutionMax);

    if (soundOn) {
      for (let j in this.frequencies) {
        if (Math.abs(this.frequencies[j] - freq) < 0.01 * freq) {
          if (this.frequencies[j] !== this.freq) {
            this.synth = new Tone.Synth(options);
            this.synth.connect(this.masterVolume);
            this.synth.triggerAttack(this.frequencies[j]);
            this.synth.volume.value = gain;
            this.freq = this.frequencies[j];
            let index = freqToIndex(this.frequencies[j], this.context.state.resolutionMax, this.context.state.resolutionMin, this.context.state.height);
            this.goldIndices.splice(this.state.currentVoice, 1); // Sets the Gold Line to the new Line
            if (!this.goldIndices.includes(index)) {
              this.goldIndices[this.state.currentVoice] = index;
            }
            this.renderNoteLines();
            // let endTime =  this.props.context.currentTime + release;
            this.label(j, pos.x, pos.y + 2);

          }

          break;
        }
      }
      let newVoice = (this.state.currentVoice + 1) % NUM_VOICES; // Mouse always changes to new "voice"
      this.setState({
        mouseDown: true,
        currentVoice: newVoice,
        voices: this.state.voices + 1
      });
    }
  }
  onTouchMove(e) {
    e.preventDefault();
    // if(this.touch){
    let { height, width, soundOn, resolutionMax, resolutionMin } = this.context.state;

    let pos = getMousePos(this.canvas, e.changedTouches[0]);
    let yPercent = 1 - pos.y / height;
    let xPercent = 1 - pos.x / width;
    let gain = getGain(xPercent);
    let freq = getFreq(yPercent, resolutionMin, resolutionMax);
    if (soundOn) {
      for (let j in this.frequencies) {
        if (Math.abs(this.frequencies[j] - freq) < 0.01 * freq) {
          if (this.frequencies[j] !== this.freq) {
            let endTime = this.props.context.currentTime + release;
            this.synth.volume.cancelAndHoldAtTime(this.props.context.currentTime);
            this.synth.volume.exponentialRampToValueAtTime(-80, endTime);
            this.synth.oscillator.stop(this.props.context.currentTime + release);
            this.synth = null;
            this.synth = new Tone.Synth(options);
            this.synth.connect(this.masterVolume);
            this.synth.triggerAttack(this.frequencies[j])
            this.synth.volume.value = gain;

            let index = freqToIndex(this.frequencies[j], this.context.state.resolutionMax, this.context.state.resolutionMin, this.context.state.height);
            if (!this.goldIndices.includes(index)) {
              this.goldIndices[this.state.currentVoice] = index;
            }
            this.goldIndices.splice(this.state.currentVoice - 1, 1); // Sets the Gold Line to the new Line
            this.renderNoteLines();
            this.freq = this.frequencies[j];
            this.label(j, pos.x, pos.y + 2);

          }
          this.synth.volume.value = gain;
          break;
        }
      }
    }
    // }
  }

  onTouchEnd(e) {
    e.preventDefault();
    this.synth.triggerRelease();
    this.goldIndices = [];
    this.renderNoteLines();
    this.freq = -1;
    // this.touch = false;
  }


  handleResize = () => {
    this.context.handleResize();
    this.renderNoteLines();
  }

  // Helper method that generates a label for the frequency or the scale note
  label(name, x, y) {
    this.ctx.font = '20px Inconsolata';
    this.ctx.fillStyle = 'white';
    if (this.context.state.soundOn) {
      this.ctx.fillText(name, x, y);
    }
  }

  renderNoteLines = () => {
    let { height, width, resolutionMax, resolutionMin } = this.context.state;

    this.ctx.clearRect(0, 0, width, height);
    // this.ctx.fillStyle = 'white';

    //  Maps to one of the 12 keys of the piano based on note and accidental
    let newIndexedKey = this.context.state.musicKey.value;
    // Edge cases
    if (newIndexedKey === 0 && this.context.state.accidental.value === 2) {
      // Cb->B
      newIndexedKey = 11;
    } else if (newIndexedKey === 11 && this.context.state.accidental.value === 1) {
      // B#->C
      newIndexedKey = 0;
    } else {
      newIndexedKey = (this.context.state.accidental.value === 1) ?
        newIndexedKey + 1 :
        (this.context.state.accidental.value === 2) ?
        newIndexedKey - 1 :
        newIndexedKey;
    }

    this.frequencies = {};
    // Uses generateScale helper method to generate base frequency values
    let s = generateScale(newIndexedKey, this.context.state.scale.value);
    //Sweeps through scale object and draws frequency
    for (let i = 0; i < s.scale.length; i++) {
      let freq = s.scale[i];

      for (let j = 0; j < 15; j++) {
        if (freq > resolutionMax) {
          break;
        } else {
          let name = s.scaleNames[i] + '' + j;
          let index = freqToIndex(freq, resolutionMax, resolutionMin, height);
          this.frequencies[name] = freq;
          if (this.goldIndices.includes(index) && this.context.state.soundOn) {
            this.ctx.fillStyle = 'gold';
          } else if (s.scaleNames[i] === s.scaleNames[0]) {
            this.ctx.fillStyle = '#a291fb';
          } else {
            this.ctx.fillStyle = 'white';
          }
          this.ctx.fillRect(0, index, width, 1.5);
          freq = freq * 2;
        }
      }
    }

  }




  render() {
    return (
      <MyContext.Consumer>
      {(context) => (
          <React.Fragment>
            <canvas
            className = "note-lines-canvas"
            width = {context.state.width}
            height = {context.state.height}
            onMouseDown = {this.onMouseDown}
            onMouseMove = {this.onMouseMove}
            onMouseUp = {this.onMouseUp}
            onMouseOut = {this.onMouseOut}
            ref = {(c) => {this.canvas = c;}}
            />
          </React.Fragment>
        )}
      </MyContext.Consumer>
    );
  }
}
NoteLines.contextType = MyContext;
export default NoteLines;
