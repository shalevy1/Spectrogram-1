import React, {Component} from 'react';
import Tone from 'tone';
import "../styles/oscillator.css"
import generateScale from '../util/generateScale';

import { getFreq, getGain, freqToIndex, getMousePos, convertToLog } from "../util/conversions";

const NUM_VOICES = 6;
const RAMPVALUE = 0.2;
const CHROMATIC = 3;

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
      noteLinesOn: false,
      checkButton: false,
      bendStartPercent: 0
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
    this.lowChordSynths = new Array(NUM_VOICES);
    this.midChordSynths = new Array(NUM_VOICES);
    this.highChordSynths = new Array(NUM_VOICES);


    // Start master volume at -20 dB
    this.masterVolume = new Tone.Volume(0);
    this.ctx = this.canvas.getContext('2d');
    this.drawButton(false);
    let options = {
      oscillator: {
        type: this.props.timbre.toLowerCase()
      },
      envelope: {
        attack: 0.1
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
      this.amSignals[i] = new Tone.Synth(options2);
      this.fmSignals[i] = new Tone.Synth(options2);
      this.lowChordSynths[i] = new Tone.Synth(options);
      this.midChordSynths[i] = new Tone.Synth(options);
      this.highChordSynths[i] = new Tone.Synth(options);

      this.synths[i].connect(this.masterVolume);
      this.amSignals[i].connect(this.synths[i].volume);
      this.amSignals[i].connect(this.lowChordSynths[i].volume);
      this.amSignals[i].connect(this.midChordSynths[i].volume);
      this.amSignals[i].connect(this.highChordSynths[i].volume);
      this.fmSignals[i].connect(this.synths[i].frequency);
      this.fmSignals[i].connect(this.lowChordSynths[i].frequency);
      this.fmSignals[i].connect(this.midChordSynths[i].frequency);
      this.fmSignals[i].connect(this.highChordSynths[i].frequency);
      this.lowChordSynths[i].connect(this.masterVolume);
      this.midChordSynths[i].connect(this.masterVolume);
      this.highChordSynths[i].connect(this.masterVolume);

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
    // if (nextProps.attack !== this.synths[0].envelope.attack) {
    //   for (let i = 0; i < NUM_VOICES; i++) {
    //     this.synths[i].envelope.attack = nextProps.attack;
    //   }
    // }
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
      this.drawButton(false);
      this.setState({noteLinesOn: true});
    } else {
      if(this.state.noteLinesOn){
        this.ctx.clearRect(0, 0, this.props.width, this.props.height);
        this.drawButton(false);
        this.setState({noteLinesOn: false});
      }
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
    if (!this.checkButton(pos.x, pos.y)){
      let yPercent = 1 - pos.y / this.props.height;
      let xPercent = 1 - pos.x / this.props.width;
      let freqs = this.getFreq(yPercent);
      // let freq = this.getFreq(yPercent)[0];
      let gain = getGain(xPercent);
      // newVoice = implementation of circular array discussed above.
      let newVoice = (this.state.currentVoice + 1) % NUM_VOICES; // Mouse always changes to new "voice"
      this.synths[newVoice].volume.value = gain; // Starts the synth at volume = gain
      this.synths[newVoice].triggerAttack(freqs[0]); // Starts the synth at frequency = freq

      if(this.props.intervalOn){
        this.lowChordSynths[newVoice].triggerAttack(freqs[1]);
        this.midChordSynths[newVoice].triggerAttack(freqs[2]);
        this.highChordSynths[newVoice].triggerAttack(freqs[3]);
        this.lowChordSynths[newVoice].volume.value = getGain(1 - this.props.lowerIntervalLevel/100);
        this.midChordSynths[newVoice].volume.value = getGain(1 - this.props.midIntervalLevel/100);
        this.highChordSynths[newVoice].volume.value = getGain(1 - this.props.highIntervalLevel/100);
      }

      // Am
      if(this.props.amOn){
        let newVol = convertToLog(this.props.amLevel, 0, 1, 0.01, 15); // AM amplitud;e set between 0.01 and 15 (arbitray choices)
        let newFreq = convertToLog(this.props.amRate, 0, 1, 0.5, 50); // AM frequency set between 0.5 and 50 hz (arbitray choices)
        this.amSignals[newVoice].volume.exponentialRampToValueAtTime(newVol, this.props.context.currentTime+1); // Ramps to AM amplitude in 1 sec
        this.amSignals[newVoice].triggerAttack(newFreq);
      }
      // FM
      if(this.props.fmOn){
        let modIndex = yPercent * 2; // FM index ranges from 0 - 2
        let newVol = convertToLog(this.props.fmLevel, 0, 1, 30, 60); // FM amplitude set between 30 and 60 (arbitrary choices)
        let newFreq = convertToLog(this.props.fmRate, 0, 1, 0.5, 50); // FM Frequency set between 0.5 and 50 (arbitray choices)
        // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // FM Frequency set between 0.5 and 20 (arbitray choices)
        this.fmSignals[newVoice].volume.exponentialRampToValueAtTime(newVol*modIndex, this.props.context.currentTime+RAMPVALUE); // Ramps to FM amplitude*modIndex in RAMPVALUE sec
        this.fmSignals[newVoice].triggerAttack(newFreq);
      }

      this.ctx.clearRect(0, 0, this.props.width, this.props.height); // Clears canvas for redraw of label
      this.drawButton(false);
      this.label(freqs[0], pos.x, pos.y); // Labels the point
      this.setState({
        mouseDown: true,
        currentVoice: newVoice,
        voices: this.state.voices + 1
      });
      if(this.props.noteLinesOn){
        this.renderNoteLines();
      }
    } else {
      this.ctx.clearRect(0, 0, this.props.width, this.props.height); // Clears canvas for redraw of label
      this.drawButton(true);
      if(this.props.noteLinesOn){
        this.renderNoteLines();
      }
      this.setState({checkButton: true, mouseDown: true});
    }

  }
  onMouseMove(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    if (this.state.mouseDown) { // Only want to change when mouse is pressed
      // The next few lines are similar to onMouseDown
      let {height, width} = this.props
      let pos = getMousePos(this.canvas, e);
      let yPercent = 1 - pos.y / height;
      let xPercent = 1 - pos.x / width;
      let gain = getGain(xPercent);
      // let freq = this.getFreq(yPercent)[0];
      let freqs = this.getFreq(yPercent);

      // Remove previous gold indices and update them to new positions
      this.goldIndices.splice(this.state.currentVoice - 1, 1);
      if(this.props.scaleOn){
        // Jumps to new Frequency and Volume
        this.synths[this.state.currentVoice].frequency.value = freqs[0];
        this.synths[this.state.currentVoice].volume.value = gain;
      } else {
        // Ramps to new Frequency and Volume
        this.synths[this.state.currentVoice].frequency.exponentialRampToValueAtTime(freqs[0], this.props.context.currentTime+RAMPVALUE);
        // Ramp to new Volume
        this.synths[this.state.currentVoice].volume.exponentialRampToValueAtTime(gain,
          this.props.context.currentTime+RAMPVALUE);
      }
      // Change FM Amplitude based on frequency
      if(this.props.fmOn){
        let modIndex = yPercent * 2; // FM index ranges from 0 - 2
        let newVol = convertToLog(this.props.fmLevel, 0, 1, 30, 60); // FM amplitude set between 30 and 60 (arbitrary choices)
        // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // Find new Frequency

        this.fmSignals[this.state.currentVoice].volume.exponentialRampToValueAtTime(newVol*modIndex, this.props.context.currentTime+RAMPVALUE);
        // this.fmSignals[this.state.currentVoice].frequency.exponentialRampToValueAtTime(newFreq, this.props.context.currentTime+RAMPVALUE);
      }

      if(this.props.intervalOn){
        this.lowChordSynths[this.state.currentVoice].frequency.value = freqs[1];
        this.midChordSynths[this.state.currentVoice].frequency.value = freqs[2];
        this.highChordSynths[this.state.currentVoice].frequency.value = freqs[3];
      }


      // Clears the label
      this.ctx.clearRect(0, 0, this.props.width, this.props.height);
      this.drawButton(false);
      this.label(freqs[0], pos.x, pos.y);
      if(this.props.noteLinesOn){
        this.renderNoteLines();
      }
    }

  }
  onMouseUp(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    // Only need to trigger release if synth exists (a.k.a mouse is down)
    if (this.state.mouseDown) {
      this.synths[this.state.currentVoice].triggerRelease(); // Relase frequency, volume goes to -Infinity
      this.amSignals[this.state.currentVoice].triggerRelease();
      this.fmSignals[this.state.currentVoice].triggerRelease();
      if(this.props.intervalOn){
        this.lowChordSynths[this.state.currentVoice].triggerRelease(); // Relase frequency, volume goes to -Infinity
        this.midChordSynths[this.state.currentVoice].triggerRelease(); // Relase frequency, volume goes to -Infinity
        this.highChordSynths[this.state.currentVoice].triggerRelease(); // Relase frequency, volume goes to -Infinity

      }

      this.setState({mouseDown: false, voices: 0, checkButton: false});
      this.goldIndices = [];

      // Clears the label
      this.ctx.clearRect(0, 0, this.props.width, this.props.height);
      this.drawButton(false);
      if(this.props.noteLinesOn){
        this.renderNoteLines();
      }
    }

  }
  /* This is a similar method to onMouseUp. Occurs when mouse exists canvas */
  onMouseOut(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    if (this.state.mouseDown) {
      this.synths[this.state.currentVoice].triggerRelease();
      this.amSignals[this.state.currentVoice].triggerRelease();
      this.fmSignals[this.state.currentVoice].triggerRelease();
      if(this.props.intervalOn){
        this.lowChordSynths[this.state.currentVoice].triggerRelease(); // Relase frequency, volume goes to -Infinity
        this.midChordSynths[this.state.currentVoice].triggerRelease(); // Relase frequency, volume goes to -Infinity
        this.highChordSynths[this.state.currentVoice].triggerRelease(); // Relase frequency, volume goes to -Infinity

      }
      this.setState({mouseDown: false, voices: 0, checkButton: false});
      this.goldIndices = [];

      // Clears the label
      this.ctx.clearRect(0, 0, this.props.width, this.props.height);
      this.drawButton(false);
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
    // For each finger, do the same as above in onMouseDown
    for (let i = 0; i < e.changedTouches.length; i++) {
      let pos = getMousePos(this.canvas, e.changedTouches[i]);
      if (!this.checkButton(pos.x, pos.y)){
        let yPercent = 1 - pos.y / this.props.height;
        let xPercent = 1 - pos.x / this.props.width;
        let gain = getGain(xPercent);
        let freq = this.getFreq(yPercent)[0];
        let newVoice = (this.state.currentVoice + 1) % NUM_VOICES;
        this.setState({
          touch: true,
          currentVoice: newVoice,
          voices: this.state.voices + 1
        });
        this.synths[newVoice].volume.value = gain;
        this.synths[newVoice].triggerAttack(freq);

        // Am
        if(this.props.amOn){
          let newVol = convertToLog(this.props.amLevel, 0, 1, 0.01, 15); // AM amplitud;e set between 0.01 and 15 (arbitray choices)
          let newFreq = convertToLog(this.props.amRate, 0, 1, 0.5, 50); // AM frequency set between 0.5 and 50 hz (arbitray choices)
          this.amSignals[newVoice].volume.exponentialRampToValueAtTime(newVol, this.props.context.currentTime+1); // Ramps to AM amplitude in 1 sec
          this.amSignals[newVoice].triggerAttack(newFreq);
        }
        // FM
        if(this.props.fmOn){
          let modIndex = yPercent * 2; // FM index ranges from 0 - 2
          let newVol = convertToLog(this.props.fmLevel, 0, 1, 30, 60); // FM amplitude set between 30 and 60 (arbitrary choices)
          let newFreq = convertToLog(this.props.fmRate, 0, 1, 0.5, 50); // FM Frequency set between 0.5 and 50 (arbitray choices)
          // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // FM Frequency set between 0.5 and 20 (arbitray choices)
          this.fmSignals[newVoice].volume.exponentialRampToValueAtTime(newVol*modIndex, this.props.context.currentTime+RAMPVALUE); // Ramps to FM amplitude*modIndex in RAMPVALUE sec
          this.fmSignals[newVoice].triggerAttack(newFreq);
        }

        this.ctx.clearRect(0, 0, this.props.width, this.props.height);
        this.drawButton(this.state.checkButton);
        if(this.state.checkButton){
          this.setState({bendStartPercent: yPercent});
        }
      } else {
        let newVoice = (this.state.currentVoice + 1) % NUM_VOICES;
        this.ctx.clearRect(0, 0, this.props.width, this.props.height);
        this.drawButton(true);
        this.setState({touch: true, checkButton: true});
      }
    }
    for (let i = 0; i < e.touches.length; i++) {
      let pos = getMousePos(this.canvas, e.touches[i]);
      let yPercent = 1 - pos.y / this.props.height;
      let freq = this.getFreq(yPercent)[0];
      if (!this.checkButton(pos.x, pos.y)){
        this.label(freq, pos.x, pos.y);
      }
    }
    if(this.props.noteLinesOn){
      this.renderNoteLines();
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
    if (this.state.touch) {
      // Determines the current "starting" index to change
      let voiceToChange = this.state.currentVoice - (this.state.voices - 1);
      // For each changed touch, do the same as onMouseMove
      for (let i = 0; i < e.changedTouches.length; i++) {
        let pos = getMousePos(this.canvas, e.changedTouches[i]);
        let yPercent = 1 - pos.y / this.props.height;
        let xPercent = 1 - pos.x / this.props.width;
        let gain = getGain(xPercent);
        let freq;
        if(!this.state.checkButton){
          freq = this.getFreq(yPercent)[0];
        } else {
          freq = getFreq(yPercent, this.props.resolutionMin, this.props.resolutionMax);
          let dist = this.state.bendStartPercent - yPercent;
          console.log(dist);

        }
        // Determines index of the synth needing to change volume/frequency
        let index = (voiceToChange + e.changedTouches[i].identifier - 1) % NUM_VOICES;
        // Wraps the array
        index = (index < 0)
          ? (NUM_VOICES + index)
          : index;
          // Deals with rounding issues with the note lines
          let oldFreq = this.synths[index].frequency.value;
          for (let note in this.frequencies){
            if (Math.abs(this.frequencies[note] - oldFreq) < 0.1*oldFreq){
              oldFreq = this.frequencies[note]
            }
          }
          // These are the same as onMouseMove
          this.goldIndices.splice(index - 1, 1);
          if(this.props.scaleOn && !this.state.checkButton){
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
          // Change FM Amplitude based on frequency
          if(this.props.fmOn){
            let modIndex = yPercent * 2; // FM index ranges from 0 - 2
            let newVol = convertToLog(this.props.fmLevel, 0, 1, 30, 60); // FM amplitude set between 30 and 60 (arbitrary choices)
            // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // Find new Frequency

            this.fmSignals[index].volume.exponentialRampToValueAtTime(newVol*modIndex, this.props.context.currentTime+RAMPVALUE);
            // this.fmSignals[index].frequency.exponentialRampToValueAtTime(newFreq, this.props.context.currentTime+RAMPVALUE);
          }
      }
      //Redraw Labels
        this.ctx.clearRect(0, 0, width, height);
        this.drawButton(this.state.checkButton);
      for (let i = 0; i < e.touches.length; i++) {
        let pos = getMousePos(this.canvas, e.touches[i]);
        let yPercent = 1 - pos.y / this.props.height;
        let freq = this.getFreq(yPercent)[0];
        if (!this.checkButton(pos.x, pos.y)){
          this.label(freq, pos.x, pos.y);
        }
      }
      if(this.props.noteLinesOn){
        this.renderNoteLines();
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
      this.ctx.clearRect(0, 0, width, height);
      this.drawButton(false);
      this.setState({voices: 0, touch: false, notAllRelease: false, currentVoice: -1, checkButton: false});
    } else {
      // Does the same as onTouchMove, except instead of changing the voice, it deletes it.
      let checkButton = false;
      let voiceToRemoveFrom = this.state.currentVoice - (this.state.voices - 1);
      for (let i = 0; i < e.changedTouches.length; i++) {

        let pos = getMousePos(this.canvas, e.changedTouches[i]);
        if(!this.checkButton(pos.x, pos.y)){
          let index = (voiceToRemoveFrom + e.changedTouches[i].identifier) % NUM_VOICES;
          // Wraps the array
          index = (index < 0)
            ? (NUM_VOICES + index)
            : index;

          this.goldIndices.splice(index, 1);
          this.synths[index].triggerRelease();
          this.amSignals[index].triggerRelease();
          this.fmSignals[index].triggerRelease();

          // this.amSignals[index].stop();
          this.setState({
            voices: this.state.voices - 1
          });
          this.ctx.clearRect(0, 0, width, height);
          this.drawButton(true);
        } else {
          this.setState({checkButton: false});
          this.ctx.clearRect(0, 0, width, height);
          this.drawButton(false);
          checkButton = true;
          for (var i = 0; i < NUM_VOICES; i++) {
            this.synths[i].frequency.value = this.getFreq(this.state.bendStartPercent)[0];  
          }
        }
      }
      if(!checkButton){
        let newVoice = this.state.currentVoice - e.changedTouches.length;
        newVoice = (newVoice < 0)
          ? (NUM_VOICES + newVoice)
          : newVoice;
        this.setState({currentVoice: newVoice});
      }

    }
    // Clears the label

    if(this.props.noteLinesOn){
      this.renderNoteLines();
    }

  }

  // Helper function that determines the frequency to play based on the mouse/finger position
  // Also deals with snapping it to a scale if scale mode is on
  getFreq(index) {
    let {resolutionMax, resolutionMin, height} = this.props;
    let freq = getFreq(index, resolutionMin, resolutionMax);
    if (this.props.scaleOn && !this.state.checkButton) {
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
      //Sweeps through scale object and plays correct frequency

       let finalJ, finalK;
      for (let j = 1; j < 1500; j = j * 2) {

        for (let k = 0; k < s.scale.length; k++) {

          var check = j * s.scale[k];
          var checkDist = Math.abs(freq - check);
          if (checkDist < dist) {
            dist = checkDist;
            note = check;
            finalJ = j;
            finalK = k;


            name = s.scaleNames[k];
            harmonic = Math.round(Math.log2(j) - 1);
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
      if(this.props.intervalOn){
        let lowerFreq, midFreq, highFreq;
        if(this.props.chordPolyChromatic){
          let finalNote = s.scale[finalK];
          s = generateScale(newIndexedKey, CHROMATIC); //Reference Chromatic scale
          finalK = s.scale.indexOf(finalNote); // Diatonic to chromatic note
          if(finalK + this.props.lowerIntervalValue - 1 >= s.scale.length){
            let lowerIndex = (finalK + this.props.lowerIntervalValue - 1) % s.scale.length;
            lowerFreq = (finalJ*2)*s.scale[lowerIndex];
          } else{
            lowerFreq = finalJ*s.scale[finalK + this.props.lowerIntervalValue - 1];
          }
          if(finalK + this.props.midIntervalValue - 1 >= s.scale.length){
            let midIndex = (finalK + this.props.midIntervalValue - 1) % s.scale.length;
            midFreq = (finalJ*2)*s.scale[midIndex];
          } else{
            midFreq = finalJ*s.scale[finalK + this.props.midIntervalValue - 1];
          }
          if(finalK + this.props.highIntervalValue - 1 >= s.scale.length){
            let highIndex = (finalK + this.props.highIntervalValue - 1) % s.scale.length;
            highFreq = (finalJ*2)*s.scale[highIndex];
          } else{
            highFreq = finalJ*s.scale[finalK + this.props.highIntervalValue - 1];
          }
        }
        else {
          if(finalK + this.props.lowerIntervalValue - 1 >= s.scale.length){
            let lowerIndex = (finalK + this.props.lowerIntervalValue - 1) % s.scale.length;
            lowerFreq = (finalJ*2)*s.scale[lowerIndex];
          } else{
            lowerFreq = finalJ*s.scale[finalK + this.props.lowerIntervalValue - 1];
          }
          if(finalK + this.props.midIntervalValue - 1 >= s.scale.length){
            let midIndex = (finalK + this.props.midIntervalValue - 1) % s.scale.length;
            midFreq = (finalJ*2)*s.scale[midIndex];
          } else{
            midFreq = finalJ*s.scale[finalK + this.props.midIntervalValue - 1];
          }
          if(finalK + this.props.highIntervalValue - 1 >= s.scale.length){
            let highIndex = (finalK + this.props.highIntervalValue - 1) % s.scale.length;
            highFreq = (finalJ*2)*s.scale[highIndex];
          } else{
            highFreq = finalJ*s.scale[finalK + this.props.highIntervalValue - 1];
          }
        }
        return [Math.round(freq),Math.round(lowerFreq), Math.round(midFreq), Math.round(highFreq)];
      }
    }

    return [Math.round(freq)];
  }

  handleResize = () => {
    this.props.handleResize();
    this.ctx.clearRect(0, 0, this.props.width, this.props.height);
    this.drawButton(false);
    if(this.props.noteLinesOn){
      this.renderNoteLines();
    }
  }

  // Helper method that generates a label for the frequency or the scale note
  label(freq, x, y) {
    const offset = 10;
    this.ctx.font = '20px Inconsolata';
    this.ctx.fillStyle = 'white';
    if(this.props.soundOn){
      if (!this.props.scaleOn || this.state.checkButton) {
        this.ctx.fillText(freq + ' Hz', x + offset, y - offset);
      } else {
        this.ctx.fillText(this.scaleLabel, x + offset, y - offset);
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
          this.ctx.fillRect(0, index, width, 1.5);
          freq = freq * 2;
        }
      }
    }

  }

  drawButton(buttonClicked){
    if(buttonClicked){
      this.ctx.fillStyle = "#6435C9";
    } else {
      this.ctx.fillStyle = "#A291FB";
    }
    const x = 10;
    const y = this.props.height - this.props.height * 0.15;
    const width = this.props.width * 0.05;
    const height = width;
    const arcsize = 25;
    this.ctx.beginPath();
    this.ctx.moveTo(x+arcsize, y);
    this.ctx.lineTo(x+width-arcsize, y);
    this.ctx.arcTo(x+width, y, x+width, y+arcsize, arcsize);
    this.ctx.lineTo(x+width,y+height-arcsize);
    this.ctx.arcTo(x+width, y+height, x+width-arcsize, y+height, arcsize);
    this.ctx.lineTo(x+arcsize, y+height);
    this.ctx.arcTo(x, y+height, x, y-arcsize, arcsize);
    this.ctx.lineTo(x, y+arcsize);
    this.ctx.arcTo(x, y, x+arcsize, y, arcsize);
    this.ctx.lineTo(x+arcsize, y);
    this.ctx.stroke();
    this.ctx.fill();
  }

  checkButton(x, y){
    let condition1 = x >=10 && x <=  this.props.width * 0.05 + 10;
    let condition2 = y >= this.props.height - this.props.height * 0.15 && y <= this.props.width * 0.05 +
      this.props.height - this.props.height * 0.15;
    if(condition1 && condition2){
      return true;
    }
    return false;
  }

  render() {
    return (
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
    }} className="osc-canvas"/>);
  }
}

export default Oscillator;
