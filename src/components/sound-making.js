import React, {Component} from 'react';
import Tone from 'tone';
import "../styles/sound-making.css";
import {SpectrogramContext} from './spectrogram-provider';

import generateScale from '../util/generateScale';
import { getFreq, getGain, getTempo, freqToIndex, getMousePos, convertToLog, midiToFreq, gainToLinear } from "../util/conversions";
// import WebMidi from 'webmidi';
const NUM_VOICES = 6;
const RAMPVALUE = 0.2;
const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
let harmonicWeights = new Array(99);
for(let i=0; i<99; i++){
  harmonicWeights[i] = 1;
}
// Main sound-making class. Can handle click and touch inputs
class SoundMaking extends Component {
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
      feedback: false,
      amOn: false,
      fmOn: false,
      pitchButtonPressed:false
    }

  }

  // Setup Tone and all of its needed dependencies.
  // To view signal flow, check out signal_flow.png
  componentDidMount() {
    Tone.context = this.props.audioContext;
    // Array to hold synthesizer objects. Implemented in a circular way
    // so that each new voice (touch input) is allocated, it is appended to the
    // array until the array is full and it then appends the next voice to array[0]
    this.synths = new Array(NUM_VOICES);
    this.amSignals = new Array(NUM_VOICES);
    this.fmSignals = new Array(NUM_VOICES);
    this.heldFreqs = new Array(NUM_VOICES);
    this.heldIds = new Array(NUM_VOICES);
    this.bendStartPercents = new Array(NUM_VOICES);
    this.bendStartFreqs = new Array(NUM_VOICES);
    this.bendStartVolumes = new Array(NUM_VOICES);
    this.midiNotes = new Array(NUM_VOICES);

    // Start master volume at -20 dB
    this.masterVolume = new Tone.Volume(0);
    this.ctx = this.canvas.getContext('2d');
    let options = {
      oscillator: {
        type: "custom",
        partials: [1],
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
      this.synths[i].connect(this.masterVolume);
      this.synths[i].sync();
      this.amSignals[i] = new Tone.Synth(options2);
      this.amSignals[i].connect(this.synths[i].volume);
      this.fmSignals[i] = new Tone.Synth(options2);
      this.fmSignals[i].connect(this.synths[i].frequency);
      this.bendStartPercents[i] = 0;
      this.bendStartFreqs[i] = 0;
      this.bendStartVolumes[i] = 0;
    }
    this.drawPitchBendButton(false);
    // Limiter at -5db
    this.limiter = new Tone.Limiter(-5);
    this.limiter.connect(Tone.Master);
    this.masterVolume.connect(this.limiter); // Master volume receives all of the synthesizer inputs and sends them to the speakers
    
    if(iOS){
      this.reverbVolume = new Tone.Volume(-10);
      this.reverb = new Tone.JCReverb(this.context.state.reverbDecay*0.9);
      let m = new Tone.Mono();
      this.reverb.connect(m);
      m.connect(this.reverbVolume);
      // this.reverb.connect(this.reverbVolume);
    } else{
      this.reverbVolume = new Tone.Volume(0);
      this.reverb = new Tone.Reverb(this.context.state.reverbDecay*20+0.1); // Reverb unit. Runs in parallel to masterVolume
      this.reverb.generate().then(()=>{
        this.reverb.connect(this.reverbVolume);
      });
    }
    this.reverbVolume.mute = true;
    this.reverbVolume.connect(this.limiter);
    this.masterVolume.connect(this.reverb);
    this.delay = new Tone.FeedbackDelay(this.context.state.delayTime+0.01, this.context.state.delayFeedback); // delay unit. Runs in parallel to masterVolume
    this.masterVolume.connect(this.delay);

    // this.amSignal.volume.value = -Infinity;

    this.delayVolume = new Tone.Volume(0);
    this.delayVolume.mute = true;

    this.delay.connect(this.delayVolume);

    this.delayVolume.connect(this.limiter);
    // Sound Off by default
    this.masterVolume.mute = !this.context.state.soundOn;
    // Object to hold all of the note-line frequencies (for checking the gold lines)
    this.frequencies = {};
    if(this.context.state.noteLinesOn){
      this.renderNoteLines();
    }
    window.addEventListener("resize", this.handleResize);
    Tone.Transport.bpm.value = 200;
    Tone.Transport.start();
  }

// Sets up what will happen on controls changes
  setAudioVariables(){
      this.masterVolume.connect(this.limiter); // Master volume receives all of the synthesizer inputs and sends them to the speakers
    if (this.context.state.soundOn === false) {
      this.masterVolume.mute = true;
    } else {
      this.masterVolume.mute = false;
    }
    if (this.masterVolume.mute === false && this.context.state.outputVolume && this.context.state.outputVolume !== this.masterVolume.volume.value ) {
      this.masterVolume.volume.value = getGain(1 - (this.context.state.outputVolume) / 100);
    }
    // if (this.context.state.timbre !== this.synths[0].oscillator.type) {
    //   let newTimbre = this.context.state.timbre.toLowerCase();
    //   for (let i = 0; i < NUM_VOICES; i++) {
    //     this.synths[i].oscillator.type = newTimbre;
    //   }
    // }

    if(this.context.state.numHarmonics + 1 !== this.synths[0].oscillator.partials.length){
      for (let i = 0; i < NUM_VOICES; i++) {
        this.synths[i].oscillator.type = "custom";
        this.synths[i].oscillator.partials = harmonicWeights.slice(0, this.context.state.numHarmonics + 1);
      }
    }
    if (this.context.state.attack !== this.synths[0].envelope.attack) {
      for (let i = 0; i < NUM_VOICES; i++) {
        this.synths[i].envelope.attack = this.context.state.attack;
      }
    }
    if (this.context.state.release !== this.synths[0].envelope.release) {
      for (let i = 0; i < NUM_VOICES; i++) {
        this.synths[i].envelope.release = this.context.state.release;
      }
    }
    if(this.context.state.headphoneMode){
      // If Headphone Mode, connect the masterVolume to the graph
      if(!this.state.feedback){
        this.limiter.connect(this.props.analyser)
        this.setState({feedback: true});
      }
    } else {
      if(this.state.feedback){
        this.limiter.disconnect(this.props.analyser)
        this.setState({feedback: false});
      }
    }
    if(this.context.state.delayOn){
      if(this.delayVolume.mute){
        this.delayVolume.mute = false;
      }
      this.masterVolume.disconnect(this.delay);
      this.delay = null;
      this.delay = new Tone.FeedbackDelay(this.context.state.delayTime + 0.01, this.context.state.delayFeedback * 0.95);
      this.delay.connect(this.delayVolume);
      this.masterVolume.connect(this.delay);
    } else if(!this.context.state.delayOn && !this.delayVolume.mute) {
      this.delayVolume.mute = true;
    }
    if(this.context.state.reverbOn){
      if(this.reverbVolume.mute){
        this.reverbVolume.mute = false;
      }
      this.masterVolume.disconnect(this.reverb);
      this.reverb = null;
      if(iOS){
        this.reverb = new Tone.JCReverb(this.context.state.reverbDecay*0.9);
        let m = new Tone.Mono();
        this.reverb.connect(m);
        m.connect(this.reverbVolume);
        // console.log(this.reverb.numberOfInputs, this.reverb.numberOfOutputs)
        // this.reverb.connect(this.reverbVolume);
        
      } else{
        this.reverb = new Tone.Reverb(this.context.state.reverbDecay*20+0.1); // Reverb unit. Runs in parallel to masterVolume
        this.reverb.generate().then(()=>{
          this.reverb.connect(this.reverbVolume);
            // this.reverb.decay = this.context.state.reverbDecay*15;
        });
      }
      this.masterVolume.connect(this.reverb)
    } else if(!this.context.state.reverbOn && !this.reverbVolume.mute) {
      this.reverbVolume.mute = true;
    }
    if(iOS){
      this.limiter.connect(this.props.analyser)
      this.masterVolume.connect(this.reverb);
      this.masterVolume.connect(this.delay)
      this.masterVolume.connect(this.limiter); 
    }    
  }

  checkHeldFreq(voice){
    // let int = window.setInterval(()=>{
    //   if(this.synths[voice].oscillator.state === "stopped"){
    //     window.clearInterval(int);
    //   } else {
    //     this.synths[voice].triggerRelease();
    //   }
    // }, 1000);
  }

  componentWillUnmount() {
    this.masterVolume.mute = true;
    window.removeEventListener("resize", this.handleResize);
  }

  /**
  This Section controls how the SoundMaking(s) react to user input
  */
  onMouseDown(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    if(!this.context.state.midi && this.context.state.soundOn){
      this.setAudioVariables();
      let pos = getMousePos(this.canvas, e);
      // Calculates x and y value in respect to width and height of screen
      // The value goes from 0 to 1. (0, 0) = Bottom Left corner
      let yPercent = 1 - pos.y / this.context.state.height;
      let xPercent = 1 - pos.x / this.context.state.width;
      let freq = this.getFreq(yPercent);
      let gain = getGain(xPercent);
      // newVoice = implementation of circular array discussed above.
      // let newVoice = (this.state.currentVoice + 1) % NUM_VOICES; // Mouse always changes to new "voice"
      let newVoice = 0;
      if(this.context.state.quantize){
        Tone.Transport.scheduleRepeat(time => {
          this.synths[newVoice].triggerAttackRelease(this.heldFreqs[newVoice], "@8n."); // Starts the synth at frequency = freq
        }, "4n");
        this.heldFreqs[newVoice] = freq;
        // console.log(getTempo(xPercent), Tone.Transport.position, Tone.Transport.bpm)
        // Tone.Transport.bpm.value = getTempo(xPercent);
        this.synths[newVoice].volume.value = gain; // Starts the synth at volume = gain
      } else {
        this.synths[newVoice].triggerAttack(freq); // Starts the synth at frequency = freq            
        this.synths[newVoice].volume.value = gain; // Starts the synth at volume = gain        
        this.synths[newVoice].oscillator.partials = harmonicWeights
        .slice(0, this.context.state.numHarmonics + 1)
        .map((weight, index) => {
            // console.log(freq*(index+1), this.getFilterCoeficients(freq * (index + 1)) * weight)
            return this.getFilterCoeficients(freq*(index+1))*weight;
        });
      }
      // console.log(this.synths[newVoice].oscillator.partials)

      // Am
      if(this.context.state.amOn){
        let newVol = convertToLog(this.context.state.amLevel, 0, 1, 0.01, 15); // AM amplitud;e set between 0.01 and 15 (arbitray choices)
        let newFreq = convertToLog(this.context.state.amRate, 0, 1, 0.5, 50); // AM frequency set between 0.5 and 50 hz (arbitray choices)
        this.amSignals[newVoice].volume.exponentialRampToValueAtTime(newVol, this.props.audioContext.currentTime+1); // Ramps to AM amplitude in 1 sec
        this.amSignals[newVoice].triggerAttack(newFreq);
      }
      // FM
      if(this.context.state.fmOn){
        let modIndex = (1-freqToIndex(freq, 20000, 20, 1))*1.2; // FM index ranges from 0 - 2
        let newVol = convertToLog(this.context.state.fmLevel, 0, 1, 40, 100); // FM amplitude set between 30 and 60 (arbitrary choices)
        let newFreq = convertToLog(this.context.state.fmRate, 0, 1, 0.5, 50); // FM Frequency set between 0.5 and 50 (arbitray choices)
        // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // FM Frequency set between 0.5 and 20 (arbitray choices)
        this.fmSignals[newVoice].volume.exponentialRampToValueAtTime(newVol*modIndex, this.props.audioContext.currentTime+RAMPVALUE); // Ramps to FM amplitude*modIndex in RAMPVALUE sec
        this.fmSignals[newVoice].triggerAttack(newFreq);
      }

      this.ctx.clearRect(0, 0, this.context.state.width, this.context.state.height); // Clears canvas for redraw of label
      this.setState({mouseDown: true, currentVoice: newVoice});
      if(this.context.state.noteLinesOn){
        this.renderNoteLines();
      }
      //this.label(freq, pos.x, pos.y); // Labels the point
      this.drawHarmonics(newVoice, freq, pos.x);
      this.drawPitchBendButton(false);
    }

  }

  onMouseMove(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    if (this.state.mouseDown && !this.context.state.sustain) { // Only want to change when mouse is pressed
      // The next few lines are similar to onMouseDown
      let index = 0;
      let {height, width} = this.context.state
      let pos = getMousePos(this.canvas, e);
      let yPercent = 1 - pos.y / height;
      let xPercent = 1 - pos.x / width;
      let gain = getGain(xPercent);
      let freq = this.getFreq(yPercent);
      // Remove previous gold indices and update them to new positions
      if(this.context.state.scaleOn){
        // Jumps to new Frequency and Volume
        if(this.context.state.quantize){
            this.heldFreqs[index] = freq;
            // let tempo = getTempo(xPercent);
            // let outputTempo = 0.5*(tempo + Tone.Transport.bpm.value);
            // console.log(outputTempo)
            // if(Math.abs(outputTempo - Tone.Transport.bpm.value) > 0.05*Tone.Transport.bpm.value){
              // Tone.Transport.bpm.value = +outputTempo;
            //   console.log("Changed")
            // }
        } else {
          this.synths[index].frequency.value = freq;
          this.synths[index].volume.value = gain;
        }

      } else {
        if(this.context.state.quantize){
            // let tempo = getTempo(xPercent);
            this.heldFreqs[index] = freq;
            // console.log(tempo)
        } else {
        // Ramps to new Frequency and Volume
        this.synths[index].frequency.exponentialRampToValueAtTime(freq, this.props.audioContext.currentTime+RAMPVALUE);
        // // Ramp to new Volume
        this.synths[index].volume.exponentialRampToValueAtTime(gain,
          this.props.audioContext.currentTime+RAMPVALUE);
        }
      }

      // FM
      if(this.context.state.fmOn){
        let modIndex = (1-freqToIndex(freq, 20000, 20, 1))*1.2
        let newVol = convertToLog(this.context.state.fmLevel, 0, 1, 40, 100); // FM amplitude set between 30 and 60 (arbitrary choices)
        let newFreq = convertToLog(this.context.state.fmRate, 0, 1, 0.5, 50); // FM Frequency set between 0.5 and 50 (arbitray choices)
        // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // FM Frequency set between 0.5 and 20 (arbitray choices)
        this.fmSignals[index].volume.exponentialRampToValueAtTime(newVol*modIndex, this.props.audioContext.currentTime+RAMPVALUE); // Ramps to FM amplitude*modIndex in RAMPVALUE sec
        this.fmSignals[index].triggerAttack(newFreq);
      }

      // Clears the label
      this.ctx.clearRect(0, 0, this.context.state.width, this.context.state.height);
      if(this.context.state.noteLinesOn){
        this.renderNoteLines();
      }
      this.drawPitchBendButton(false);
      // this.label(freq, pos.x, pos.y);
      this.synths[index].oscillator.partials = harmonicWeights
        .slice(0, this.context.state.numHarmonics + 1)
        .map((weight, index) => {
          return this.getFilterCoeficients(freq * (index + 1)) * weight;
        });
      this.drawHarmonics(index, freq, pos.x);
    }
  }

  onMouseUp(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    // Only need to trigger release if synth exists (a.k.a mouse is down)
    if (this.state.mouseDown && !this.context.state.sustain) {
      let index = 0;
      Tone.Transport.cancel();
      this.synths[index].triggerRelease(); // Relase frequency, volume goes to -Infinity
      this.amSignals[index].triggerRelease();
      this.fmSignals[index].triggerRelease();
      this.checkHeldFreq(index);
      this.setState({mouseDown: false});
      // Clears the label
      this.ctx.clearRect(0, 0, this.context.state.width, this.context.state.height);
      if(this.context.state.noteLinesOn){
        this.renderNoteLines();
      }
      this.drawPitchBendButton(false);
    } 
  }

  /* This is a similar method to onMouseUp. Occurs when mouse exists canvas */
  onMouseOut(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    if (this.state.mouseDown && !this.context.state.sustain) {
      Tone.Transport.cancel();
      let index = 0;
      this.synths[index].triggerRelease();
      this.amSignals[index].triggerRelease();
      this.fmSignals[index].triggerRelease();
      this.checkHeldFreq(index);
      this.setState({mouseDown: false});
      // Clears the label
      this.ctx.clearRect(0, 0, this.context.state.width, this.context.state.height);
      if(this.context.state.noteLinesOn){
        this.renderNoteLines();
      }
      this.drawPitchBendButton(false);
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
    if(!this.context.state.midi && this.context.state.soundOn){
      this.setAudioVariables();

      if(e.touches.length > NUM_VOICES ){
        return;
      }
      this.ctx.clearRect(0, 0, this.context.state.width, this.context.state.height);

      if(this.context.state.noteLinesOn){
        this.renderNoteLines();
      }
      // For each finger, do the same as above in onMouseDown
      for (let i = 0; i < e.changedTouches.length; i++) {
        let pos = getMousePos(this.canvas, e.changedTouches[i]);
        if (!this.isPitchButton(pos.x, pos.y)){
          let yPercent = 1 - pos.y / this.context.state.height;
          let xPercent = 1 - pos.x / this.context.state.width;
          let gain = getGain(xPercent);
          let freq = this.getFreq(yPercent);
          let newVoice = e.changedTouches[i].identifier % NUM_VOICES;
          if(newVoice < 0) newVoice = NUM_VOICES + newVoice;
          this.setState({
            touch: true,
          });
          if(this.context.state.quantize){
            let id = Tone.Transport.scheduleRepeat(time => {
              this.synths[newVoice].triggerAttackRelease(this.heldFreqs[newVoice], "@8n."); // Starts the synth at frequency = freq
            }, "4n");
            this.heldFreqs[newVoice] = freq;
            this.heldIds[newVoice] = id;
          } else {
            this.synths[newVoice].triggerAttack(freq);
          }
          this.synths[newVoice].volume.value = gain;
          // Am
          if(this.context.state.amOn){
            let newVol = convertToLog(this.context.state.amLevel, 0, 1, 0.01, 15); // AM amplitud;e set between 0.01 and 15 (arbitray choices)
            let newFreq = convertToLog(this.context.state.amRate, 0, 1, 0.5, 50); // AM frequency set between 0.5 and 50 hz (arbitray choices)
            this.amSignals[newVoice].volume.exponentialRampToValueAtTime(newVol, this.props.audioContext.currentTime+1); // Ramps to AM amplitude in 1 sec
            this.amSignals[newVoice].triggerAttack(newFreq);
          }
          // FM
          if(this.context.state.fmOn){
            let modIndex = (1-freqToIndex(freq, 20000, 20, 1)) *1.2 // FM index ranges from 0 - 2
            let newVol = convertToLog(this.context.state.fmLevel, 0, 1, 40, 100); // FM amplitude set between 30 and 60 (arbitrary choices)
            let newFreq = convertToLog(this.context.state.fmRate, 0, 1, 0.5, 50); // FM Frequency set between 0.5 and 50 (arbitray choices)
            // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // FM Frequency set between 0.5 and 20 (arbitray choices)
            this.fmSignals[newVoice].volume.exponentialRampToValueAtTime(newVol*modIndex, this.props.audioContext.currentTime+RAMPVALUE); // Ramps to FM amplitude*modIndex in RAMPVALUE sec
            this.fmSignals[newVoice].triggerAttack(newFreq);
          }

          this.drawPitchBendButton(this.state.pitchButtonPressed);
          if(this.state.pitchButtonPressed){
            this.bendStartPercents[newVoice] = yPercent;
            this.bendStartFreqs[newVoice] = freq;
            this.bendStartVolumes[newVoice] = gain;
          }
          this.synths[newVoice].oscillator.partials = harmonicWeights
            .slice(0, this.context.state.numHarmonics + 1)
            .map((weight, index) => {
              return this.getFilterCoeficients(freq * (index + 1)) * weight;
            });

        } else {
          for (let i = 0; i < e.touches.length; i++) {
            let pos = getMousePos(this.canvas, e.touches[i]);
            let index = e.touches[i].identifier % NUM_VOICES;
            if (index < 0) index = NUM_VOICES + index;
            let yPercent = 1 - pos.y / this.context.state.height;
            let xPercent = 1 - pos.x / this.context.state.width;
            let gain = getGain(xPercent);
            let freq = this.getFreq(yPercent);
            if (!this.isPitchButton(pos.x, pos.y)){
              this.bendStartPercents[index] = yPercent;
              this.bendStartFreqs[index] = freq;
              this.bendStartVolumes[index] = gain;

            }
          }
          this.drawPitchBendButton(true);
          this.setState({pitchButtonPressed: true});
          }

      }
      for (let i = 0; i < e.touches.length; i++) {
        let pos = getMousePos(this.canvas, e.touches[i]);
        let yPercent = 1 - pos.y / this.context.state.height;
        // let xPercent = 1 - pos.x / this.context.state.width;
        let freq = this.getFreq(yPercent);
        if (!this.isPitchButton(pos.x, pos.y)){
          // this.label(freq, pos.x, pos.y);
          let index = e.touches[i].identifier % NUM_VOICES;
          if (index < 0) index = NUM_VOICES + index;
          this.drawHarmonics(index, freq, pos.x);
        }
      }
    }
  }

  onTouchMove(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    // Check if more fingers were moved than allowed
    if (this.state.touch && !this.context.state.sustain) {
      if(e.changedTouches.length > NUM_VOICES ){
        return;
      }
      let {width, height} = this.context.state;
      // If touch is pressed (Similar to mouseDown = true, although there should never be a case where this is false)
      this.ctx.clearRect(0, 0, width, height);
      if(this.context.state.noteLinesOn){
        this.renderNoteLines();
      }
      // Determines the current "starting" index to change
      // For each changed touch, do the same as onMouseMove
      for (let i = 0; i < e.changedTouches.length; i++) {
        let pos = getMousePos(this.canvas, e.changedTouches[i]);
        let yPercent = 1 - pos.y / this.context.state.height;
        let xPercent = 1 - pos.x / this.context.state.width;
        let gain = getGain(xPercent);

        let freq = this.getFreq(yPercent);
        // Determines index of the synth needing to change volume/frequency
        let index = e.changedTouches[i].identifier % NUM_VOICES;
        if(index < 0) index = NUM_VOICES + index;
          // Deals with rounding issues with the note lines
          let oldFreq = this.synths[index].frequency.value;
          for (let note in this.frequencies){
            if (Math.abs(this.frequencies[note] - oldFreq) < 0.1*oldFreq){
              oldFreq = this.frequencies[note]
            }
          }
          // These are the same as onMouseMove
          if(this.context.state.scaleOn && !this.state.pitchButtonPressed){
            // Jumps to new Frequency and Volume
            if(this.context.state.quantize){
              this.heldFreqs[index] = freq;
            } else {
              this.synths[index].frequency.value = freq;
            }
            this.synths[index].volume.value = gain;
          } else {
            if(this.state.pitchButtonPressed){
              let dist = yPercent - this.bendStartPercents[index];
              freq = this.bendStartFreqs[index];
              freq = freq + freq*dist;
            }
            if(this.context.state.quantize){
            this.heldFreqs[index] = freq;
          } else {
            // Ramps to new Frequency and Volume
            this.synths[index].frequency.exponentialRampToValueAtTime(freq, this.props.audioContext.currentTime+RAMPVALUE);
          }
            // Ramp to new Volume
            this.synths[index].volume.exponentialRampToValueAtTime(gain,
              this.props.audioContext.currentTime+RAMPVALUE);
          }
          // FM
          if(this.context.state.fmOn){
            let modIndex = (1-freqToIndex(freq, 20000, 20, 1)) *1.2;// FM index ranges from 0 - 2
            let newVol = convertToLog(this.context.state.fmLevel, 0, 1, 40, 100); // FM amplitude set between 30 and 60 (arbitrary choices)
            let newFreq = convertToLog(this.context.state.fmRate, 0, 1, 0.5, 50); // FM Frequency set between 0.5 and 50 (arbitray choices)
            // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // FM Frequency set between 0.5 and 20 (arbitray choices)
            this.fmSignals[index].volume.exponentialRampToValueAtTime(newVol*modIndex, this.props.audioContext.currentTime+RAMPVALUE); // Ramps to FM amplitude*modIndex in RAMPVALUE sec
            this.fmSignals[index].triggerAttack(newFreq);
          }
          this.synths[index].oscillator.partials = harmonicWeights
            .slice(0, this.context.state.numHarmonics + 1)
            .map((weight, index) => {
              return this.getFilterCoeficients(freq * (index + 1)) * weight;
            });
      }

      //Redraw Labels
      this.drawPitchBendButton(this.state.pitchButtonPressed);
      for (let i = 0; i < e.touches.length; i++) {
        let pos = getMousePos(this.canvas, e.touches[i]);
        let yPercent = 1 - pos.y / this.context.state.height;
        let freq = this.getFreq(yPercent);
        if (!this.isPitchButton(pos.x, pos.y)){
          // this.label(freq, pos.x, pos.y);
          let index = e.touches[i].identifier % NUM_VOICES;
          if (index < 0) index = NUM_VOICES + index;
          this.drawHarmonics(index, freq, pos.x);
        }
      }
    }
  }

  onTouchEnd(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    if(this.state.touch && !this.context.state.sustain){
      let {width, height} = this.context.state;
      this.ctx.clearRect(0, 0, width, height);
      if(this.context.state.noteLinesOn){
        this.renderNoteLines();
      }
      // Check if there are more touches changed than on the screen and release everything (mostly as an fail switch)
      if(true){
      // if (e.changedTouches.length === e.touches.length + 1) {
      //   Tone.Transport.cancel();
      //   for (let i = 0; i < NUM_VOICES; i++) {
      //     this.synths[i].triggerRelease();
      //     this.amSignals[i].triggerRelease();
      //     this.fmSignals[i].triggerRelease();
      //     this.checkHeldFreq(i);
      //   }
      //   this.drawPitchBendButton(false);
      //   this.setState({touch: false, notAllRelease: false, currentVoice: -1, pitchButtonPressed: false});
      // } else {
          let checkButton = false;
          // Does the same as onTouchMove, except instead of changing the voice, it deletes it.
          for (let i = 0; i < e.changedTouches.length; i++) {
            let pos = getMousePos(this.canvas, e.changedTouches[i]);
            let index = e.changedTouches[i].identifier % NUM_VOICES;
            if(index < 0) index = NUM_VOICES + index;

            if(!this.isPitchButton(pos.x, pos.y)){
              if(this.state.pitchButtonPressed){
                // Ramps to new Frequency and Volume
                this.synths[index].frequency.exponentialRampToValueAtTime(this.bendStartFreqs[index], this.props.audioContext.currentTime+0.2);
                // Ramp to new Volume
                this.synths[index].volume.exponentialRampToValueAtTime(this.bendStartVolumes[index], this.props.audioContext.currentTime+0.05);
                this.bendStartPercents[index] = 0;
                this.bendStartFreqs[index] = 0;
                this.bendStartVolumes[index] = 0;
              }
              else {
                this.synths[index].triggerRelease();
                this.amSignals[index].triggerRelease();
                this.fmSignals[index].triggerRelease();
                this.checkHeldFreq(index);
                if(this.context.state.quantize){
                  Tone.Transport.clear(this.heldIds[index]);
                }
              }
              this.drawPitchBendButton(this.state.pitchButtonPressed);
            } else {
              if(e.touches.length === 0){
                  for (let i = 0; i < NUM_VOICES; i++) {
                    if (this.synths[i].oscillator.state === "started") {
                      this.synths[i].triggerRelease();
                      this.fmSignals[i].triggerRelease();
                      this.amSignals[i].triggerRelease();
                      this.checkHeldFreq(i);
                    }
                  }
              }
              this.setState({pitchButtonPressed: false});
              this.drawPitchBendButton(false);
              checkButton = true;
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

      //Redraw Labels
      for (let i = 0; i < e.touches.length; i++) {
        let pos = getMousePos(this.canvas, e.touches[i]);
        let yPercent = 1 - pos.y / this.context.state.height;
        let freq = this.getFreq(yPercent);
        if(!this.isPitchButton(pos.x,pos.y)){
          let index = e.touches[i].identifier % NUM_VOICES;
          if (index < 0) index = NUM_VOICES + index;
          this.drawHarmonics(index, freq, pos.x);
          // this.label(freq, pos.x, pos.y);
        }
      }
    }
  }

  MIDINoteOn=(e)=>{
    // console.log("On", e);
    this.setAudioVariables();
    let {resolutionMax, resolutionMin, height, width} = this.context.state;
    this.ctx.clearRect(0, 0, width, height);
    if (this.context.state.noteLinesOn) {
      this.renderNoteLines();
    }
    // For each note, do the same as above in onMouseDown
    let xPercent = 1 - e.velocity;
    let gain = getGain(xPercent);
    let freq = midiToFreq(e.note.number);
    let yPos = freqToIndex(freq, resolutionMax, resolutionMin, height);
    let yPercent = 1 - yPos / height;
    let newVoice = (this.state.currentVoice + 1) % NUM_VOICES;
    if (this.context.state.quantize) {
      let id = Tone.Transport.scheduleRepeat(time => {
        this.synths[newVoice].triggerAttackRelease(this.heldFreqs[newVoice], "@8n."); // Starts the synth at frequency = freq
      }, "4n");
      this.heldFreqs[newVoice] = freq;
      this.heldIds[newVoice] = id;
    } else {
      this.synths[newVoice].triggerAttack(freq);
    }
    this.synths[newVoice].volume.value = gain;
    // Am
    if (this.context.state.amOn) {
      let newVol = convertToLog(this.context.state.amLevel, 0, 1, 0.01, 15); // AM amplitud;e set between 0.01 and 15 (arbitray choices)
      let newFreq = convertToLog(this.context.state.amRate, 0, 1, 0.5, 50); // AM frequency set between 0.5 and 50 hz (arbitray choices)
      this.amSignals[newVoice].volume.exponentialRampToValueAtTime(newVol, this.props.audioContext.currentTime + 1); // Ramps to AM amplitude in 1 sec
      this.amSignals[newVoice].triggerAttack(newFreq);
    }
    // FM
    if (this.context.state.fmOn) {
      let modIndex = (1 - freqToIndex(freq, 20000, 20, 1)) * 1.2 // FM index ranges from 0 - 2
      let newVol = convertToLog(this.context.state.fmLevel, 0, 1, 40, 100); // FM amplitude set between 30 and 60 (arbitrary choices)
      let newFreq = convertToLog(this.context.state.fmRate, 0, 1, 0.5, 50); // FM Frequency set between 0.5 and 50 (arbitray choices)
      // let newFreq = convertToLog(yPercent, 0, 1, 0.5, 20); // FM Frequency set between 0.5 and 20 (arbitray choices)
      this.fmSignals[newVoice].volume.exponentialRampToValueAtTime(newVol * modIndex, this.props.audioContext.currentTime + RAMPVALUE); // Ramps to FM amplitude*modIndex in RAMPVALUE sec
      this.fmSignals[newVoice].triggerAttack(newFreq);
    }

    this.drawPitchBendButton(this.state.pitchButtonPressed);
    if (this.state.pitchButtonPressed) {
      this.bendStartPercents[newVoice] = yPercent;
      this.bendStartFreqs[newVoice] = freq;
      this.bendStartVolumes[newVoice] = gain;
    }
    this.midiNotes[newVoice] = {
      xPercent: xPercent, 
      yPercent: yPercent, 
      label: e.note.name + (parseInt(e.note.octave, 10) - 1),
      id: newVoice
    };
    this.setState({currentVoice: newVoice});
    this.synths[newVoice].oscillator.partials = harmonicWeights
      .slice(0, this.context.state.numHarmonics + 1)
      .map((weight, index) => {
        return this.getFilterCoeficients(freq * (index + 1)) * weight;
    });
    this.midiNotes.forEach((item)=>{
      if(item){
        let pos = {
          x: (1 - item.xPercent) * width,
          y: (1 - item.yPercent) * height
        }
        this.drawHarmonics(newVoice, Math.round(freq), pos.x);        
        // this.label(item.label, pos.x, pos.y);
      }
    });

  }

  MIDINoteOff=(e)=>{
    // console.log("Off", e)
    let {resolutionMax, resolutionMin, height, width} = this.context.state;
    this.ctx.clearRect(0, 0, width, height);
    if (this.context.state.noteLinesOn) {
      this.renderNoteLines();
    }
    let freq = midiToFreq(e.note.number);
    let yPos = freqToIndex(freq, resolutionMax, resolutionMin, height);
    let yPercent = 1 - yPos / height;
    this.midiNotes.forEach((item, index, arr)=>{
      if (item && !isNaN(item.xPercent)) {
        if (item.yPercent === yPercent) {
          this.synths[item.id].triggerRelease();
          this.checkHeldFreq(item.id);
          arr[index] = {};
          } else {
            let pos = {
              x: (1 - item.xPercent) * width,
              y: (1 - item.yPercent) * height
            }
             let freq = getFreq(item.yPercent, resolutionMin, resolutionMax);
          this.drawHarmonics(index, Math.round(freq), pos.x);  
        this.label(item.label, pos.x, pos.y);
        }
       }
      });      
    this.drawPitchBendButton(this.state.pitchButtonPressed);
  }

  sustainChangeTimbre(){
    let {soundOn, height, width, numHarmonics, noteLinesOn} = this.context.state;
    if(soundOn){
      this.ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < NUM_VOICES; i++) {
        let freq = this.synths[i].frequency.value;
        this.synths[i].oscillator.type = "custom";
        this.synths[i].oscillator.partials = harmonicWeights
          .slice(0, this.context.state.numHarmonics + 1)
          .map((weight, index) => {
            return this.getFilterCoeficients(freq * (index + 1)) * weight;
        });
        if(this.synths[i].oscillator.state === "started"){
          let xPos = (1 - gainToLinear(this.synths[i].volume.value)) * width;
          this.drawHarmonics(i, freq, xPos);
        }
      }  
      if (noteLinesOn) {
        this.renderNoteLines();
      }
      this.drawPitchBendButton(this.state.pitchButtonPressed);
    }
  }


  getFilterCoeficients(freq){
    let {height, width, resolutionMax, resolutionMin} = this.context.state;
    let f = x => Math.pow(Math.E,(-0.0002*x));
    let y = this.context.queryFilter(freqToIndex(freq, resolutionMax, resolutionMin, height)/height);
    // console.log(y)
    return y;
    // return f(freq);
  }

  releaseAll(){
    for (let i = 0; i < NUM_VOICES; i++) {
      if(this.synths[i].oscillator.state === "started"){
        this.synths[i].triggerRelease();
        this.checkHeldFreq(i);
      }
    }
    this.setState({mouseDown: false, touch: false});
    let {height, width} = this.context.state;
    this.ctx.clearRect(0, 0, width, height);
    if (this.context.state.noteLinesOn) {
      this.renderNoteLines();
    }
    this.drawPitchBendButton(this.state.pitchButtonPressed);
  }

  drawHarmonics(index, fundamental, xPos){
    let {height, width, resolutionMax, resolutionMin} = this.context.state;
    for(let i = 0; i < this.context.state.numHarmonics + 1; i++){
      let freq = fundamental * (i+1);
      let pos = {
        x: this.synths[index].oscillator.partials[i] * xPos,
        y: freqToIndex(freq, resolutionMax, resolutionMin, height)
      }
      if(i == 0){
      this.label(freq, xPos, pos.y);
      } else {
      this.label("", pos.x, pos.y);
      }
    }
  }

  // Helper function that determines the frequency to play based on the mouse/finger position
  // Also deals with snapping it to a scale if scale mode is on
  getFreq(index) {
    let {resolutionMax, resolutionMin, height} = this.context.state;
    let freq = getFreq(index, resolutionMin, resolutionMax);
    // let notes = [];

    if (this.context.state.scaleOn) {
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
        newIndexedKey = (this.context.state.accidental.value === 1)
          ? newIndexedKey + 1
          : (this.context.state.accidental.value === 2)
            ? newIndexedKey - 1
            : newIndexedKey;
      }
      // Uses generateScale helper method to generate base frequency values
      let s = generateScale(newIndexedKey, this.context.state.scale.value);
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

        // notes = s.scale.map(note=>{
        //   return note * finalJ;
        // });
    }
    return Math.round(freq);
  }

  handleResize = () => {
    // this.props.handleResize();
    this.props.handleResize();
    this.ctx.clearRect(0, 0, this.context.state.width, this.context.state.height);
    if(this.context.state.noteLinesOn){
      this.renderNoteLines();
    }
    this.drawPitchBendButton(false);
  }

  // Helper method that generates a label for the frequency or the scale note
  label(freq, x, y) {
    const offset = 25;
    const scaleOffset = 10;
    this.ctx.font = '20px Inconsolata';
    this.ctx.fillStyle = 'white';
    if(this.context.state.soundOn){
      if(this.context.state.midi || freq === ""){
        this.ctx.fillText(freq, x + offset, y - offset);
      }
      else if (!this.context.state.scaleOn){ //|| this.context.state.numHarmonics > 1) {
        this.ctx.fillText(freq + ' Hz', x + offset, y - offset);
      } else {
        this.ctx.fillText(this.scaleLabel, x + offset, y - offset);
        let index = freqToIndex(freq, this.context.state.resolutionMax, this.context.state.resolutionMin, this.context.state.height);
        // Scale Mode Label at side
        let width = ((freq+ ' Hz').length < 7) ? 70 : 80;
        this.ctx.fillStyle = "rgba(218, 218, 218, 0.8)";
        this.ctx.fillRect(scaleOffset - 2, index - 2*scaleOffset, width, 3.5*scaleOffset);
        this.ctx.fillStyle = "white";
        this.ctx.fillText(freq + ' Hz', scaleOffset + width/2, index+scaleOffset/2);
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

  drawPitchBendButton(buttonClicked){
    if(buttonClicked){
      this.ctx.fillStyle = "#1c9fdb";
    } else {
      this.ctx.fillStyle = "#56caff";
    }
    const x = 10;
    const y = this.context.state.height - this.context.state.height * 0.12;
    const width = this.context.state.width * 0.05;
    const height = width;
    const arcsize = 25;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
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
    this.ctx.fillStyle = "white";
    this.ctx.font = '20px Inconsolata';
    this.ctx.textAlign = "center";
    this.ctx.fillText("Bend", x+width/2, y+height/2+5);

  }

  isPitchButton(x, y){
    let {height, width} = this.context.state;
    let condition1 = x >= 0 && x <=  width * 0.05 + 30;
    let condition2 = y >= height - height * 0.12 && y <= width * 0.05 +
      height - height * 0.12;
    if(condition1 && condition2){
      return true;
    }
    return false;
  }

  renderNoteLines(){
    let {height, width, resolutionMax, resolutionMin} = this.context.state;
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
      newIndexedKey = (this.context.state.accidental.value === 1)
        ? newIndexedKey + 1
        : (this.context.state.accidental.value === 2)
          ? newIndexedKey - 1
          : newIndexedKey;
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
          let name = s.scaleNames[i]+''+j;
          let index = freqToIndex(freq, resolutionMax, resolutionMin, height);
          this.frequencies[name] = freq;

          // if(this.goldIndices.includes(index) && this.context.state.soundOn){
          //   this.ctx.fillStyle = 'gold';
          // } else if(s.scaleNames[i] === s.scaleNames[0]){
          //   this.ctx.fillStyle = '#ABE2FB';
          // }
          // else {
            this.ctx.fillStyle = 'white';
          // }
          this.ctx.fillRect(0, index, width, 1);
          freq = freq * 2;
        }
      }
    }
  }

  removeNoteLines(){
      this.ctx.clearRect(0, 0, this.context.state.width, this.context.state.height);
  }

  render() {
    return (
      <SpectrogramContext.Consumer>
      {(context) => (
        <canvas
        className="osc-canvas"
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
        onMouseOut={this.onMouseOut}
        onTouchStart={this.onTouchStart}
        onTouchEnd={this.onTouchEnd}
        onTouchMove={this.onTouchMove}
        width={context.state.width}
        height={context.state.height}
        ref={(c) => {this.canvas = c;}}/>
      )}
    </SpectrogramContext.Consumer>
    )
  }
}

SoundMaking.contextType = SpectrogramContext;
export default SoundMaking;
