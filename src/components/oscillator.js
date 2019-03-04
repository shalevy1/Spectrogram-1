import React, {Component} from 'react';
import Tone from 'tone';
import "../styles/oscillator.css"
import generateScale from '../util/generateScale';

import { getFreq, getGain, freqToIndex, getMousePos, convertToLog, convertToLinear } from "../util/conversions";

const NUM_VOICES = 6;
const RAMPVALUE = 0.2;
const NOTE_JUMP = 1.0594630943593;

// Main sound-making class. Can handle click and touch inputs
class Oscillator extends Component {
  // TODO: Sometimes strange sounds
  constructor(props) {
    super();
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.state = {
      mouseDown: false,
      touch: false,
      currentVoice: 0,
      voices: 0, //voices started with on event
      feedback: false,
      amOn: false,
      fmOn: false,
    }

  }

  // Setup Tone and all of its needed dependencies.
  // To view signal flow, check out signal_flow.png
  componentDidMount() {
    Tone.context = this.props.context;
    // Array to hold synthesizer objects. Implemented in a circular way
    // so that each new voice (touch input) is allocated, it is appended to the
    // array until the array is full and it then appends the next voice to array[0]
    this.synths = new Array(NUM_VOICES);
    this.amSignals = new Array(NUM_VOICES);
    this.fmSignals = new Array(NUM_VOICES);
    // Start master volume at -20 dB
    this.masterVolume = new Tone.Volume(0);
    this.ctx = this.canvas.getContext('2d');
    let options = {
      oscillator: {
        type: this.props.timbre.toLowerCase()
      }
    };
    let options2 = {
      oscillator: {
        type: 'sine'
      }
    }


    // For each voice, create a synth and connect it to the master volume
    for (let i = 0; i < NUM_VOICES; i++) {
      this.synths[i] = new Tone.Synth(options);
      this.synths[i].connect(this.masterVolume);
      // this.synths[i].sync();
      this.amSignals[i] = new Tone.Synth(options2);
      this.amSignals[i].connect(this.synths[i].volume)
      // this.amSignals[i].type ="sine";
      this.fmSignals[i] = new Tone.Synth(options2);
      this.fmSignals[i].connect(this.synths[i].frequency)
      // this.fmSignals[i].type ="square";
      // this.amSignal.frequency.value = 1;
      // this.amSignal.volume.value = 10;

    }

    this.goldIndices = []; // Array to hold indices on the screen of gold note lines (touched/clicked lines)
    this.masterVolume.connect(Tone.Master); // Master volume receives all of the synthesizer inputs and sends them to the speakers

    this.reverb = new Tone.Reverb(this.props.reverbDecay*10+0.1); // Reverb unit. Runs in parallel to masterVolume
    this.reverbVolume = new Tone.Volume(0);
    this.reverbVolume.connect(Tone.Master);
    this.masterVolume.connect(this.reverb);
    this.reverb.generate().then(()=>{
      this.reverb.connect(this.reverbVolume);
    });
    this.delay = new Tone.FeedbackDelay(this.props.delayTime+0.01, this.props.delayFeedback); // delay unit. Runs in parallel to masterVolume
    this.masterVolume.connect(this.delay);

    // this.amSignal.volume.value = -Infinity;

    this.delayVolume = new Tone.Volume(0);
    this.delay.connect(this.delayVolume);

    this.delayVolume.connect(Tone.Master);
    // Sound Off by default
    this.masterVolume.mute = !this.props.soundOn;
    // Object to hold all of the note-line frequencies (for checking the gold lines)
    this.frequencies = {};

    window.addEventListener("resize", this.handleResize);
  }

  // Sets up what will happen on controls changes
  componentWillReceiveProps(nextProps, prevState) {
    if (nextProps.soundOn === false) {
      this.masterVolume.mute = true;
    } else {
      this.masterVolume.mute = false;
    }
    if (this.masterVolume.mute === false && nextProps.outputVolume && nextProps.outputVolume !== this.masterVolume.volume.value ) {
      this.masterVolume.volume.value = getGain(1 - (nextProps.outputVolume) / 100);
    }
    if (nextProps.timbre !== this.synths[0].oscillator.type) {
      let newTimbre = nextProps.timbre.toLowerCase();
      for (let i = 0; i < NUM_VOICES; i++) {
        this.synths[i].oscillator.type = newTimbre;
      }
    }
    if (nextProps.attack !== this.synths[0].envelope.attack) {
      for (let i = 0; i < NUM_VOICES; i++) {
        this.synths[i].envelope.attack = nextProps.attack;
      }
    }
    if (nextProps.release !== this.synths[0].envelope.release) {
      for (let i = 0; i < NUM_VOICES; i++) {
        this.synths[i].envelope.release = nextProps.release;
      }
    }
    if(nextProps.headphoneMode){
      // If Headphone Mode, connect the masterVolume to the graph
      if(!this.state.feedback){
        this.masterVolume.connect(this.props.analyser);
        this.reverbVolume.connect(this.props.analyser);
        this.delayVolume.connect(this.props.analyser)
        this.setState({feedback: true});
      }
    } else {
      if(this.state.feedback){
        this.masterVolume.disconnect(this.props.analyser);
        this.reverbVolume.disconnect(this.props.analyser);
        this.delayVolume.disconnect(this.props.analyser)
        this.setState({feedback: false});
      }
    }
    if(nextProps.noteLinesOn){
      this.ctx.clearRect(0, 0, this.props.width, this.props.height);
      this.renderNoteLines();
    } else {
      this.ctx.clearRect(0, 0, this.props.width, this.props.height);
    }
    if(nextProps.reverbOn){
      this.reverbVolume.mute = false;
      this.masterVolume.disconnect(this.reverb);
      this.reverb = null;
      this.reverb = new Tone.Reverb(this.props.reverbDecay*10+0.1); // Reverb unit. Runs in parallel to masterVolume
      this.masterVolume.connect(this.reverb);
      this.reverb.generate().then(()=>{
        this.reverb.connect(this.reverbVolume);
        // this.reverb.decay = this.props.reverbDecay*15;
      });
    } else {
      this.reverbVolume.mute = true;
    }
    if(nextProps.delayOn){
      this.delayVolume.mute = false;
      this.masterVolume.disconnect(this.delay);
      this.delay = null;
      this.delay = new Tone.FeedbackDelay(nextProps.delayTime+0.01, nextProps.delayFeedback);
      this.masterVolume.connect(this.delay);
      this.delay.connect(this.delayVolume);
    } else {
      this.delayVolume.mute = true;
    }
    Tone.Transport.start();

  }

  componentWillUnmount() {
    this.masterVolume.mute = true;
    window.removeEventListener("resize", this.handleResize);
  }

  /**
  This Section controls how the Oscillator(s) react to user input
  */
  onMouseDown(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    let pos = getMousePos(this.canvas, e);
    // Calculates x and y value in respect to width and height of screen
    // The value goes from 0 to 1. (0, 0) = Bottom Left corner
    let yPercent = 1 - pos.y / this.props.height;
    let xPercent = 1 - pos.x / this.props.width;
    let freq = this.getFreq(yPercent);
    let gain = getGain(xPercent);
    // newVoice = implementation of circular array discussed above.
    let newVoice = (this.state.currentVoice + 1) % NUM_VOICES; // Mouse always changes to new "voice"
    // Tone.Transport.scheduleRepeat(time => {
    //   this.synths[newVoice].triggerAttackRelease(freq, "4n"); // Starts the synth at frequency = freq
    // }, "4n");
    this.synths[newVoice].triggerAttack(freq); // Starts the synth at frequency = freq
    // let x = [freqData.notes[0], freqData.notes[2], freqData.notes[4], freqData.notes[0]*2];
    // this.pattern = new Tone.Pattern((time, note)=>{
      // this.synths[newVoice].triggerAttackRelease(note, "8n");
    // }, x);
    // this.pattern.interval = "16n";
    // this.pattern.pattern = "random";
    // this.pattern.start(0);


    // Am
    if(this.props.amOn){
      let newVol = convertToLog(this.props.amLevel, 0, 1, 0.01, 15); // AM amplitud;e set between 0.01 and 15 (arbitray choices)
      let newFreq = convertToLog(this.props.amRate, 0, 1, 0.5, 50); // AM frequency set between 0.5 and 50 hz (arbitray choices)
      this.amSignals[newVoice].volume.exponentialRampToValueAtTime(newVol, this.props.context.currentTime+1); // Ramps to AM amplitude in 1 sec
      this.amSignals[newVoice].triggerAttack(newFreq);
    }
    // FM
    if(this.props.fmOn){
      let modIndex = (1-freqToIndex(freq, 20000, 20, 1)) *2; // FM index ranges from 0 - 2
      console.log(modIndex);
      let newVol = convertToLog(this.props.fmLevel, 0, 1, 25, 50); // FM amplitude set between 30 and 60 (arbitrary choices)
      let newFreq = convertToLog(this.props.fmRate, 0, 1, 0.5, 50); // FM Frequency set between 0.5 and 50 (arbitray choices)
      // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // FM Frequency set between 0.5 and 20 (arbitray choices)
      this.fmSignals[newVoice].volume.exponentialRampToValueAtTime(newVol*modIndex, this.props.context.currentTime+RAMPVALUE); // Ramps to FM amplitude*modIndex in RAMPVALUE sec
      this.fmSignals[newVoice].triggerAttack(newFreq);
    }

    this.synths[newVoice].volume.value = gain; // Starts the synth at volume = gain
    this.ctx.clearRect(0, 0, this.props.width, this.props.height); // Clears canvas for redraw of label
    this.setState({
      mouseDown: true,
      currentVoice: newVoice,
      voices: this.state.voices + 1,
    });
    if(this.props.noteLinesOn){
      this.renderNoteLines();
    }
    this.label(freq, pos.x, pos.y); // Labels the point

  }
  onMouseMove(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    if (this.state.mouseDown) { // Only want to change when mouse is pressed
      // The next few lines are similar to onMouseDown
      // Tone.Transport.cancel();
      let {height, width} = this.props
      let pos = getMousePos(this.canvas, e);
      let yPercent = 1 - pos.y / height;
      let xPercent = 1 - pos.x / width;
      let gain = getGain(xPercent);
      let freq = this.getFreq(yPercent);
      // Remove previous gold indices and update them to new positions
      this.goldIndices.splice(this.state.currentVoice - 1, 1);
      if(this.props.scaleOn){
        // Jumps to new Frequency and Volume
          if(freq != this.synths[this.state.currentVoice].frequency.value){
          // Tone.Transport.scheduleOnce(time => {
            this.synths[this.state.currentVoice].frequency.value = freq;
            this.synths[this.state.currentVoice].volume.value = gain;
          // }, "@4n");
        }
      } else {
        // Ramps to new Frequency and Volume
        this.synths[this.state.currentVoice].frequency.exponentialRampToValueAtTime(freq, this.props.context.currentTime+RAMPVALUE);
        // Ramp to new Volume
        this.synths[this.state.currentVoice].volume.exponentialRampToValueAtTime(gain,
          this.props.context.currentTime+RAMPVALUE);
      }
      // FM
      if(this.props.fmOn){
        let modIndex = (1-freqToIndex(freq, 20000, 20, 1)) *2
        console.log(modIndex);
        let newVol = convertToLog(this.props.fmLevel, 0, 1, 25, 50); // FM amplitude set between 30 and 60 (arbitrary choices)
        let newFreq = convertToLog(this.props.fmRate, 0, 1, 0.5, 50); // FM Frequency set between 0.5 and 50 (arbitray choices)
        // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // FM Frequency set between 0.5 and 20 (arbitray choices)
        this.fmSignals[this.state.currentVoice].volume.exponentialRampToValueAtTime(newVol*modIndex, this.props.context.currentTime+RAMPVALUE); // Ramps to FM amplitude*modIndex in RAMPVALUE sec
        this.fmSignals[this.state.currentVoice].triggerAttack(newFreq);
      }


      // Clears the label
      this.ctx.clearRect(0, 0, this.props.width, this.props.height);
      if(this.props.noteLinesOn){
        this.renderNoteLines();
      }
      this.label(freq, pos.x, pos.y);
    }

  }
  onMouseUp(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    // Only need to trigger release if synth exists (a.k.a mouse is down)
    if (this.state.mouseDown) {
      // Tone.Transport.cancel();
      // Tone.Transport.scheduleRepeat(time => {
      //   this.synths[2].triggerAttackRelease(800, "8n", "@4n");
      //   this.synths[2].volume.value = -30;
      // }, "4n");
      this.synths[this.state.currentVoice].triggerRelease(); // Relase frequency, volume goes to -Infinity
      this.amSignals[this.state.currentVoice].triggerRelease();
      this.fmSignals[this.state.currentVoice].triggerRelease();
      this.setState({mouseDown: false, voices: 0});
      this.goldIndices = [];

      // Clears the label
      this.ctx.clearRect(0, 0, this.props.width, this.props.height);
      if(this.props.noteLinesOn){
        this.renderNoteLines();
      }
    }

  }
  /* This is a similar method to onMouseUp. Occurs when mouse exists canvas */
  onMouseOut(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    if (this.state.mouseDown) {
      // Tone.Transport.cancel();
      this.synths[this.state.currentVoice].triggerRelease();
      this.amSignals[this.state.currentVoice].triggerRelease();
      this.fmSignals[this.state.currentVoice].triggerRelease();
      this.setState({mouseDown: false, voices: 0});
      this.goldIndices = [];

      // Clears the label
      this.ctx.clearRect(0, 0, this.props.width, this.props.height);
      if(this.props.noteLinesOn){
        this.renderNoteLines();
        // this.amSignals[this.state.currentVoice].stop();
      }
    }
  }

  /*The touch section is the same as the mouse section with the added feature of
  multitouch and vibrato. For each finger down, this function places a frequency
  and volume value into the next available position in the synth array
  (implmented as a circular array).
  */
  onTouchStart(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    e.stopPropagation();
    if(e.touches.length > NUM_VOICES ){
      return;
    }
    this.ctx.clearRect(0, 0, this.props.width, this.props.height);

    if(this.props.noteLinesOn){
      this.renderNoteLines();
    }
    // For each finger, do the same as above in onMouseDown
    for (let i = 0; i < e.changedTouches.length; i++) {
      let pos = getMousePos(this.canvas, e.touches[i]);
      let yPercent = 1 - pos.y / this.props.height;
      let xPercent = 1 - pos.x / this.props.width;
      let gain = getGain(xPercent);
      let freq = this.getFreq(yPercent);
      let newVoice = e.changedTouches[i].identifier % NUM_VOICES;
      this.setState({
        touch: true,
      });
      this.synths[newVoice].triggerAttack(freq);
      this.synths[newVoice].volume.value = gain;
      // Am
      if(this.props.amOn){
        let newVol = convertToLog(this.props.amLevel, 0, 1, 0.01, 15); // AM amplitud;e set between 0.01 and 15 (arbitray choices)
        let newFreq = convertToLog(this.props.amRate, 0, 1, 0.5, 50); // AM frequency set between 0.5 and 50 hz (arbitray choices)
        this.amSignals[newVoice].volume.exponentialRampToValueAtTime(newVol, this.props.context.currentTime+1); // Ramps to AM amplitude in 1 sec
        this.amSignals[newVoice].triggerAttack(newFreq);
      }
      // FM
      if(this.props.fmOn){
        let modIndex = (1-freqToIndex(freq, 20000, 20, 1)) *2 // FM index ranges from 0 - 2
        let newVol = convertToLog(this.props.fmLevel, 0, 1, 25, 50); // FM amplitude set between 30 and 60 (arbitrary choices)
        let newFreq = convertToLog(this.props.fmRate, 0, 1, 0.5, 50); // FM Frequency set between 0.5 and 50 (arbitray choices)
        // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // FM Frequency set between 0.5 and 20 (arbitray choices)
        this.fmSignals[newVoice].volume.exponentialRampToValueAtTime(newVol*modIndex, this.props.context.currentTime+RAMPVALUE); // Ramps to FM amplitude*modIndex in RAMPVALUE sec
        this.fmSignals[newVoice].triggerAttack(newFreq);
      }

      this.label(freq, pos.x, pos.y);
    }

  }
  onTouchMove(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    // Check if more fingers were moved than allowed
    if(e.changedTouches.length > NUM_VOICES ){
      return;
    }
    let {width, height} = this.props;
    // If touch is pressed (Similar to mouseDown = true, although there should never be a case where this is false)
    this.ctx.clearRect(0, 0, width, height);
    if(this.props.noteLinesOn){
      this.renderNoteLines();
    }
    if (this.state.touch) {
      // Determines the current "starting" index to change
      // For each changed touch, do the same as onMouseMove
      for (let i = 0; i < e.changedTouches.length; i++) {
        let pos = getMousePos(this.canvas, e.changedTouches[i]);
        let yPercent = 1 - pos.y / this.props.height;
        let xPercent = 1 - pos.x / this.props.width;
        let gain = getGain(xPercent);

        let freq = this.getFreq(yPercent);
        // Determines index of the synth needing to change volume/frequency
        let index = e.changedTouches[i].identifier % NUM_VOICES;
          // Deals with rounding issues with the note lines
          let oldFreq = this.synths[index].frequency.value;
          for (let note in this.frequencies){
            if (Math.abs(this.frequencies[note] - oldFreq) < 0.1*oldFreq){
              oldFreq = this.frequencies[note]
            }
          }
          // These are the same as onMouseMove
          this.goldIndices.splice(index - 1, 1);
          if(this.props.scaleOn){
            // Jumps to new Frequency and Volume
            this.synths[index].frequency.value = freq;
            this.synths[index].volume.value = gain;
          } else {
            // Ramps to new Frequency and Volume
            this.synths[index].frequency.exponentialRampToValueAtTime(freq, this.props.context.currentTime+RAMPVALUE);
            // Ramp to new Volume
            this.synths[index].volume.exponentialRampToValueAtTime(gain,
              this.props.context.currentTime+RAMPVALUE);
          }
          // FM
          if(this.props.fmOn){
          let modIndex = (1-freqToIndex(freq, 20000, 20, 1)) *2;// FM index ranges from 0 - 2
            let newVol = convertToLog(this.props.fmLevel, 0, 1, 25, 50); // FM amplitude set between 30 and 60 (arbitrary choices)
            let newFreq = convertToLog(this.props.fmRate, 0, 1, 0.5, 50); // FM Frequency set between 0.5 and 50 (arbitray choices)
            // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // FM Frequency set between 0.5 and 20 (arbitray choices)
            this.fmSignals[index].volume.exponentialRampToValueAtTime(newVol*modIndex, this.props.context.currentTime+RAMPVALUE); // Ramps to FM amplitude*modIndex in RAMPVALUE sec
            this.fmSignals[index].triggerAttack(newFreq);
          }

      }
      //Redraw Labels
      for (let i = 0; i < e.touches.length; i++) {
        let pos = getMousePos(this.canvas, e.touches[i]);
        let yPercent = 1 - pos.y / this.props.height;
        let freq = this.getFreq(yPercent);
        this.label(freq, pos.x, pos.y);
      }

    }
  }
  onTouchEnd(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    let {width, height} = this.props;
    // Check if there are more touches changed than on the screen and release everything (mostly as an fail switch)
    if (e.changedTouches.length === e.touches.length + 1) {
      for (var i = 0; i < NUM_VOICES; i++) {
        this.synths[i].triggerRelease();
        this.amSignals[i].triggerRelease();
        this.fmSignals[i].triggerRelease();
      }
      this.goldIndices = []

      this.setState({voices: 0, touch: false, notAllRelease: false, currentVoice: -1});
    } else {
      // Does the same as onTouchMove, except instead of changing the voice, it deletes it.
      for (let i = 0; i < e.changedTouches.length; i++) {
        let index = e.changedTouches[i].identifier % NUM_VOICES;

        this.goldIndices.splice(index, 1);
        this.synths[index].triggerRelease();
        this.amSignals[index].triggerRelease();
        this.fmSignals[index].triggerRelease();

        // this.amSignals[index].stop();

      }


    }
    // Clears the label
    this.ctx.clearRect(0, 0, width, height);
    if(this.props.noteLinesOn){
      this.renderNoteLines();
    }

  }

  // Helper function that determines the frequency to play based on the mouse/finger position
  // Also deals with snapping it to a scale if scale mode is on
  getFreq(index) {
    let {resolutionMax, resolutionMin, height} = this.props;
    let freq = getFreq(index, resolutionMin, resolutionMax);
    let notes = [];

    if (this.props.scaleOn) {
      //  Maps to one of the 12 keys of the piano based on note and accidental
      let newIndexedKey = this.props.musicKey.value;
      // Edge cases
      if (newIndexedKey === 0 && this.props.accidental.value === 2) {
        // Cb->B
        newIndexedKey = 11;
      } else if (newIndexedKey === 11 && this.props.accidental.value === 1) {
        // B#->C
        newIndexedKey = 0;
      } else {
        newIndexedKey = (this.props.accidental.value === 1)
          ? newIndexedKey + 1
          : (this.props.accidental.value === 2)
            ? newIndexedKey - 1
            : newIndexedKey;
      }
      // Uses generateScale helper method to generate base frequency values
      let s = generateScale(newIndexedKey, this.props.scale.value);
      let name = s.scale[0];
      let note = 0;
      let dist = 20000;
      let harmonic = 0;
      let finalJ = 0;
      let finalK = 0;
      //Sweeps through scale object and plays correct frequency
      for (var j = 1; j < 1500; j = j * 2) {

        for (var k = 0; k < s.scale.length; k++) {

          var check = j * s.scale[k];
          var checkDist = Math.abs(freq - check);
          if (checkDist < dist) {
            dist = checkDist;
            note = check;
            name = s.scaleNames[k];
            harmonic = Math.round(Math.log2(j) - 1);
            finalJ = j;
            finalK = k;
          } else {
            break;
          }
        }
      }
      freq = note;
      let textLabel = name + '' + harmonic;
      this.scaleLabel = textLabel;
      let index = freqToIndex(freq, resolutionMax, resolutionMin, height);

        this.goldIndices[this.state.currentVoice] = index;
        notes = s.scale.map(note=>{
          return note * finalJ;
        });
    }
    return Math.round(freq);
  }

  handleResize = () => {
    this.props.handleResize();
    this.ctx.clearRect(0, 0, this.props.width, this.props.height);
    if(this.props.noteLinesOn){
      this.renderNoteLines();
    }
  }

  // Helper method that generates a label for the frequency or the scale note
  label(freq, x, y) {
    const offset = 25;
    const scaleOffset = 10;
    this.ctx.font = '20px Inconsolata';
    this.ctx.fillStyle = 'white';
    if(this.props.soundOn){
      if (!this.props.scaleOn) {
        this.ctx.fillText(freq + ' Hz', x + offset, y - offset);
      } else {
        this.ctx.fillText(this.scaleLabel, x + offset, y - offset);
        let index = freqToIndex(freq, this.props.resolutionMax, this.props.resolutionMin, this.props.height);
        let width = ((freq+ ' Hz').length < 7) ? 70 : 80;
        this.ctx.fillStyle = "rgba(218, 218, 218, 0.8)";
        this.ctx.fillRect(scaleOffset - 2, index - 2*scaleOffset, width, 3.5*scaleOffset);
        this.ctx.fillStyle = "white";
        this.ctx.fillText(freq + ' Hz', scaleOffset, index+scaleOffset/2);


      }
      // Draw Circle for point
    const startingAngle = 0;
    const endingAngle = 2 * Math.PI;
    const radius = 10;
    const color = 'rgb(255, 255, 0)';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, startingAngle, endingAngle);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.stroke();
    }

  }

  renderNoteLines(){
    let {height, width, resolutionMax, resolutionMin} = this.props;
    // this.ctx.clearRect(0, 0, width, height);
    // this.ctx.fillStyle = 'white';

    //  Maps to one of the 12 keys of the piano based on note and accidental
    let newIndexedKey = this.props.musicKey.value;
    // Edge cases
    if (newIndexedKey === 0 && this.props.accidental.value === 2) {
      // Cb->B
      newIndexedKey = 11;
    } else if (newIndexedKey === 11 && this.props.accidental.value === 1) {
      // B#->C
      newIndexedKey = 0;
    } else {
      newIndexedKey = (this.props.accidental.value === 1)
        ? newIndexedKey + 1
        : (this.props.accidental.value === 2)
          ? newIndexedKey - 1
          : newIndexedKey;
    }

    this.frequencies = {};
    // Uses generateScale helper method to generate base frequency values
    let s = generateScale(newIndexedKey, this.props.scale.value);
    //Sweeps through scale object and draws frequency
    for (let i = 0; i < s.scale.length; i++) {
      let freq = s.scale[i];

      for (let j = 0; j < 15; j++) {
        if (freq > resolutionMax) {
          break;
        } else {
          let name = s.scaleNames[i]+''+j;
          let index = freqToIndex(freq, resolutionMax, resolutionMin, height);
          this.frequencies[name] = freq;

          if(this.goldIndices.includes(index) && this.props.soundOn){
            this.ctx.fillStyle = 'gold';
          } else if(s.scaleNames[i] === s.scaleNames[0]){
            this.ctx.fillStyle = '#a291fb';
          }
          else {
            this.ctx.fillStyle = 'white';
          }
          this.ctx.fillRect(0, index, width, 1);
          freq = freq * 2;
        }
      }
    }

  }

  render() {
    return (
      <React.Fragment>
      <canvas
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={this.onMouseDown}
      onMouseUp={this.onMouseUp}
      onMouseMove={this.onMouseMove}
      onMouseOut={this.onMouseOut}
      onTouchStart={this.onTouchStart}
      onTouchEnd={this.onTouchEnd}
      onTouchMove={this.onTouchMove}
      width={this.props.width}
      height={this.props.height}
      ref={(c) => {
      this.canvas = c;
    }} className="osc-canvas"/>
    {/*<div className="frequency-label">
      <div className="frequency-title">
      Frequency:
      </div>
      <div>220Hz</div>
      <div>220Hz</div>
      <div>220Hz</div>
      <div>220Hz</div>
      <div>220Hz</div>
      <div>220Hz</div>

    </div>*/}
    </React.Fragment>
  );
  }
}

export default Oscillator;
