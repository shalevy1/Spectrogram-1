import React, {Component} from 'react';
import Tone from 'tone';
import "../styles/sound-making.css";
import {SpectrogramContext} from './spectrogram-provider';

import generateScale from '../util/generateScale';
import { getFreq, getGain, getTempo, freqToIndex, getMousePos, convertToLog, midiToFreq, gainToLinear, getHarmonicWeightInExpScale } from "../util/conversions";
// import WebMidi from 'webmidi';
const NUM_VOICES = 6;
const RAMPVALUE = 0.2;
const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Creates Default Harmonic Weighting of 1. Change for different default weighting.
let harmonicWeights = new Array(99);
for(let i=0; i<99; i++){
  harmonicWeights[i] = 1;
}

const soundMakingfftSize = 8192;

  // Main sound-making class. Can handle click and touch inputs
class SoundMaking extends Component {
  constructor(props) {
    super(props);
    this.props.analyser.fftSize = soundMakingfftSize;
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
    Tone.context.lookAhead = 0; // Removes Default Tone.js Delay

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

    this.masterVolume = new Tone.Volume(0);
    // Oscillator Defaults
    let synthOptions = {
      oscillator: {
        type: "custom",
        partials: [1],
      },
      envelope: 
      {
        attack: 0.1
      }
    };

    let modulationOptions = {
      oscillator: {
        type: 'sine'
      }
    }

    // For each voice, create a synth and connect it to the master volume
    for (let i = 0; i < NUM_VOICES; i++) {
      this.synths[i] = new Tone.Synth(synthOptions);
      this.synths[i].connect(this.masterVolume);

      this.amSignals[i] = new Tone.Synth(modulationOptions);
      this.amSignals[i].connect(this.synths[i].volume);
      this.fmSignals[i] = new Tone.Synth(modulationOptions);
      this.fmSignals[i].connect(this.synths[i].frequency);
      this.bendStartPercents[i] = 0;
      this.bendStartFreqs[i] = 0;
      this.bendStartVolumes[i] = 0;
    }
    // Limiter at -5db
    this.limiter = new Tone.Limiter(-5);
    this.limiter.connect(Tone.Master);
    this.masterVolume.connect(this.limiter); // Master volume receives all of the synthesizer inputs and sends them to the speakers
    
    if(iOS){
      this.reverbVolume = new Tone.Volume(-10);
      this.reverb = new Tone.JCReverb(this.context.state.reverbDecay*0.9);
      let m = new Tone.Mono(); // JCReverb is a stereo algorithmic reverb. This makes is mono again.
      this.reverb.connect(m);
      m.connect(this.reverbVolume);
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
    this.delayVolume = new Tone.Volume(0);
    this.delayVolume.mute = true;
    this.delay.connect(this.delayVolume);    
    this.delayVolume.connect(this.limiter);
    // Sound Off by default
    this.masterVolume.mute = !this.context.state.soundOn;
    // Tone.Transport.start();
    
    this.ctx = this.canvas.getContext('2d');
    if(this.context.state.noteLinesOn){
      this.renderNoteLines();
    }
    this.drawPitchBendButton(false);
    window.addEventListener("resize", this.handleResize);
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

    if(this.context.state.numHarmonics + 1 !== this.synths[0].oscillator.partials.length){
      for (let i = 0; i < NUM_VOICES; i++) {
        this.synths[i].oscillator.type = "custom";
        this.synths[i].oscillator.partials = harmonicWeights.slice(0, this.context.state.numHarmonics + 1);
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
        
      } else{ 
        this.reverb = new Tone.Reverb(this.context.state.reverbDecay*20+0.1); // Reverb unit. Runs in parallel to masterVolume
        this.reverb.generate().then(()=>{
          this.reverb.connect(this.reverbVolume);
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

  calculateAudio(e, options={touch: false, midi: false}){
    let {resolutionMax, resolutionMin, height, width, numHarmonics, amOn, amLevel, amRate, fmOn, fmLevel, fmRate} = this.context.state;
    let denormalizedGain = 0;
    let freq = 0;
    let index = 0;
    let isPitchButton = false;

    let pos = getMousePos(this.canvas, e);
    if (this.isPitchButton(pos.x, pos.y)) {
      isPitchButton = true;
    } 
    // Calculates x and y value in respect to width and height of screen
    // The value goes from 0 to 1. (0, 0) = Bottom Left corner
    let yPercent = 1 - pos.y / height;
    let xPercent = 1 - pos.x / width;
    freq = this.getFreq(yPercent);
    if(options.midi){
      xPercent = 1 - e.velocity;
      freq = Math.round(midiToFreq(e.note.number));
      let yPos = freqToIndex(freq, resolutionMax, resolutionMin, height);
      pos.x = - 1 * (xPercent - 1) * width;
      yPercent = 1 - yPos / height;
      index = (this.state.currentVoice + 1) % NUM_VOICES;
    }
    let gain = getGain(xPercent);
    // index = implementation of circular array discussed above.
    if(options.touch){
      index = e.identifier % NUM_VOICES;
      if(index < 0) index = NUM_VOICES + index;          
    }

    // Creates harmonics and calculates denomalized gain (by default, web audio normalizes harmonics)
    let max = -Infinity;
    this.synths[index].oscillator.partials = harmonicWeights
      .slice(0, numHarmonics + 1)
      .map((weight, index) => {
        let weightFromFilter = this.getFilterCoeficients(freq * (index + 1));
        if (weightFromFilter > max) {
          max = weightFromFilter;
        }
        return weightFromFilter * weight;
      })
    denormalizedGain = gain + 20 * Math.log10(max);

    // Am
    if (amOn) {
      let newVol = convertToLog(amLevel, 0, 1, 0.01, 15); // AM amplitud;e set between 0.01 and 15 (arbitray choices)
      let newFreq = convertToLog(amRate, 0, 1, 0.5, 50); // AM frequency set between 0.5 and 50 hz (arbitray choices)
      this.amSignals[index].volume.exponentialRampToValueAtTime(newVol, this.props.audioContext.currentTime + 1); // Ramps to AM amplitude in 1 sec
      this.amSignals[index].triggerAttack(newFreq);
    }
    // FM
    if (fmOn) {
      let modIndex = (1 - freqToIndex(freq, 20000, 20, 1)) * 1.2; // FM index ranges from 0 - 2
      let newVol = convertToLog(fmLevel, 0, 1, 40, 100); // FM amplitude set between 30 and 60 (arbitrary choices)
      let newFreq = convertToLog(fmRate, 0, 1, 0.5, 50); // FM Frequency set between 0.5 and 50 (arbitray choices)
      this.fmSignals[index].volume.exponentialRampToValueAtTime(newVol * modIndex, this.props.audioContext.currentTime + RAMPVALUE); // Ramps to FM amplitude*modIndex in RAMPVALUE sec
      this.fmSignals[index].triggerAttack(newFreq);
    }
    this.setState({ mouseDown: true, currentVoice: index });
    return {freq: freq, gain: denormalizedGain, index: index, isPitchButton: isPitchButton, xPercent: xPercent, yPercent: yPercent}
  }

  // For Touch, Redraw all current touches
  redrawLabels(e){
    for (let i = 0; i < e.touches.length; i++) {
      let pos = getMousePos(this.canvas, e.touches[i]);
      let yPercent = 1 - pos.y / this.context.state.height;
      let freq = this.getFreq(yPercent);
      if (!this.isPitchButton(pos.x, pos.y)) {
        let index = e.touches[i].identifier % NUM_VOICES;
        if (index < 0) index = NUM_VOICES + index;
        this.drawHarmonics(index, freq, pos.x);
      }
    }
  }

  /**
  This Section controls how the SoundMaking(s) reacts to user input
  */

  onMouseDown = (e)=> {
    e.preventDefault(); // Always need to prevent default browser choices
    if(!this.context.state.midi && this.context.state.soundOn){
      this.setAudioVariables();
      this.ctx.clearRect(0, 0, this.context.state.width, this.context.state.height); // Clears canvas for redraw of label
      if (this.context.state.noteLinesOn) {
        this.renderNoteLines();
      }
      let {freq, gain, index, xPercent} = this.calculateAudio(e);
      this.synths[index].triggerAttack(freq); // Starts the synth at frequency = freq            
      this.synths[index].volume.value = gain; // Starts the synth at volume = gain
      this.drawPitchBendButton(false);
      let xPos = -1 * (xPercent - 1) * this.context.state.width;
      this.drawHarmonics(index, freq, xPos);
    }

  }
  
  onMouseMove = (e) => {
    e.preventDefault(); // Always need to prevent default browser choices
    if (this.state.mouseDown && !this.context.state.midi && !this.context.state.sustain) { // Only want to change when mouse is pressed
      this.setAudioVariables();
      this.ctx.clearRect(0, 0, this.context.state.width, this.context.state.height); // Clears canvas for redraw of label
      if (this.context.state.noteLinesOn) {
        this.renderNoteLines();
      }
      let {freq, gain, index, xPercent} = this.calculateAudio(e);
      if (this.context.state.scaleOn) {
        // Jumps to new Frequency and Volume
        this.synths[index].frequency.value = freq;
        this.synths[index].volume.value = gain;
      } else {
        // Ramps to new Frequency and Volume
        this.synths[index].frequency.exponentialRampToValueAtTime(freq, this.props.audioContext.currentTime + RAMPVALUE);
        this.synths[index].volume.exponentialRampToValueAtTime(gain,
          this.props.audioContext.currentTime + RAMPVALUE);
      }
      let xPos = -1 * (xPercent - 1) * this.context.state.width;
      this.drawHarmonics(index, freq, xPos);
      this.drawPitchBendButton(false);
    }
  }

  onMouseUp = (e) => {
    e.preventDefault(); // Always need to prevent default browser choices
    // Only need to trigger release if synth exists (a.k.a mouse is down)
    if (this.state.mouseDown && !this.context.state.midi && !this.context.state.sustain) {
      // Tone.Transport.cancel();
      // Clears the label
      this.ctx.clearRect(0, 0, this.context.state.width, this.context.state.height);
      if(this.context.state.noteLinesOn){
        this.renderNoteLines();
      }
      this.synths[0].triggerRelease(); // Relase frequency, volume goes to -Infinity
      this.amSignals[0].triggerRelease();
      this.fmSignals[0].triggerRelease();
      this.checkHeldFreq(0);
      this.setState({mouseDown: false});
      this.drawPitchBendButton(false);
    } 
  }

  /* This is a similar method to onMouseUp. Occurs when mouse exists canvas */
  onMouseOut = (e) => {
    this.onMouseUp(e);
  }

  /*The touch section is the same as the mouse section with the added feature of
  multitouch and vibrato. For each finger down, this function places a frequency
  and volume value into the next available position in the synth array
  (implmented as a circular array).
  */
  onTouchStart = (e) => {
    e.preventDefault(); // Always need to prevent default browser choices
    e.stopPropagation();
    if(!this.context.state.midi && this.context.state.soundOn){
      if(e.touches.length > NUM_VOICES ){
        return;
      }
      this.setAudioVariables();
      this.ctx.clearRect(0, 0, this.context.state.width, this.context.state.height);

      if(this.context.state.noteLinesOn){
        this.renderNoteLines();
      }
      this.drawPitchBendButton(false);
      // For each finger, do the same as above in onMouseDown
      for (let i = 0; i < e.changedTouches.length; i++) {
        let {freq, gain, index, isPitchButton, yPercent} = this.calculateAudio(e.changedTouches[i], {touch: true});
        if(!isPitchButton){
          this.synths[index].triggerAttack(freq); // Starts the synth at frequency = freq            
          this.synths[index].volume.value = gain; // Starts the synth at volume = gain
          if (this.state.pitchButtonPressed) {
            this.bendStartPercents[index] = yPercent;
            this.bendStartFreqs[index] = freq;
            this.bendStartVolumes[index] = gain;
          }
        } else {
          // If Touching Pitch Button, calculate the starting values of the pitchbend
          for (let i = 0; i < e.touches.length; i++) {
            let pos = getMousePos(this.canvas, e.touches[i]);
            let index = e.touches[i].identifier % NUM_VOICES;
            if (index < 0) index = NUM_VOICES + index;
            let yPercent = 1 - pos.y / this.context.state.height;
            let xPercent = 1 - pos.x / this.context.state.width;
            let gain = getGain(xPercent);
            let freq = this.getFreq(yPercent);
            if (!this.isPitchButton(pos.x, pos.y)) {
              this.bendStartPercents[index] = yPercent;
              this.bendStartFreqs[index] = freq;
              this.bendStartVolumes[index] = gain;
            }
          }
          this.setState({pitchButtonPressed: true});
          this.drawPitchBendButton(true);
        }
      }      
      this.redrawLabels(e);
    }
  }

  onTouchMove = (e) => {
    e.preventDefault(); // Always need to prevent default browser choices
    // Check if more fingers were moved than allowed
    if (this.state.mouseDown && !this.context.state.midi && !this.context.state.sustain) {
      if(e.changedTouches.length > NUM_VOICES ){
        return;
      }
      let {width, height} = this.context.state;
      this.ctx.clearRect(0, 0, width, height);
      if(this.context.state.noteLinesOn){
        this.renderNoteLines();
      }
      // Determines the current "starting" index to change
      // For each changed touch, do the same as onMouseMove
      for (let i = 0; i < e.changedTouches.length; i++) {
        let {freq, gain, index, yPercent} = this.calculateAudio(e.changedTouches[i], {touch:true});
          if (this.context.state.scaleOn && !this.state.pitchButtonPressed) {
            // Jumps to new Frequency and Volume
            if (this.context.state.quantize) {
              this.heldFreqs[index] = freq;
            } else {
              this.synths[index].frequency.value = freq;
            }
            this.synths[index].volume.value = gain;
          } else {
            if (this.state.pitchButtonPressed) {
              // Calculate "bent" pitch
              let dist = yPercent - this.bendStartPercents[index];
              freq = this.bendStartFreqs[index];
              freq = freq + freq * dist;
            }
              // Ramps to new Frequency and Volume
              this.synths[index].frequency.exponentialRampToValueAtTime(freq, this.props.audioContext.currentTime + RAMPVALUE);            
              // Ramp to new Volume
              this.synths[index].volume.exponentialRampToValueAtTime(gain,
                this.props.audioContext.currentTime + RAMPVALUE);
          }
        }
      this.drawPitchBendButton(this.state.pitchButtonPressed);
      //Redraw Labels
      this.redrawLabels(e);
    }

  }

  onTouchEnd = (e) => {
    e.preventDefault(); // Always need to prevent default browser choices
    if(this.state.mouseDown && !this.context.state.midi && !this.context.state.sustain){
      let {width, height} = this.context.state;
      this.ctx.clearRect(0, 0, width, height);
      if(this.context.state.noteLinesOn){
        this.renderNoteLines();
      }
          let checkButton = false;
          // Does the same as onTouchMove, except instead of changing the voice, it deletes it.
          for (let i = 0; i < e.changedTouches.length; i++) {
            let pos = getMousePos(this.canvas, e.changedTouches[i]);
            let index = e.changedTouches[i].identifier % NUM_VOICES;
            if(index < 0) index = NUM_VOICES + index;

            if(!this.isPitchButton(pos.x, pos.y)){
              // Resets back to original freq and volume
              if(this.state.pitchButtonPressed){
                // Ramps to new Frequency and Volume
                this.synths[index].frequency.exponentialRampToValueAtTime(this.bendStartFreqs[index], this.props.audioContext.currentTime+0.2);
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
              // If pitch bend button let go, release all if no current touching fingers and
              // set checkButton to true
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
          // Only reset the index if not pushing pitch bend button
          if(!checkButton){
            let newVoice = this.state.currentVoice - e.changedTouches.length;
            newVoice = (newVoice < 0)
              ? (NUM_VOICES + newVoice)
              : newVoice;
            this.setState({currentVoice: newVoice});
          }
          // Prevent mouse moving with touch
        if(e.touches.length === 0){
          this.setState({mouseDown: false});
        }
      //Redraw Labels
      this.redrawLabels(e);
    }
  }

  MIDINoteOn = (e) =>{
    this.setAudioVariables();
    let {height, width} = this.context.state;
    this.ctx.clearRect(0, 0, width, height);
    if (this.context.state.noteLinesOn) {
      this.renderNoteLines();
    }
    let {freq, gain, index, xPercent, yPercent} = this.calculateAudio(e, {midi: true});
    // Create Midi Notes object to be used like touch objects for drawing and releasing
    this.midiNotes[index] = {
      xPercent: xPercent, 
      yPercent: yPercent, 
      number: e.note.number,
      label: e.note.name + (parseInt(e.note.octave, 10) - 1),
      id: index
    };
    this.synths[index].triggerAttack(freq);
    this.synths[index].volume.value = gain;
    if (this.state.pitchButtonPressed) {
      this.bendStartPercents[index] = yPercent;
      this.bendStartFreqs[index] = freq;
      this.bendStartVolumes[index] = gain;
    }
    // Draw each note
    this.midiNotes.forEach((item)=>{
      if(item){
        let pos = {
          x: (1 - item.xPercent) * width,
          y: (1 - item.yPercent) * height
        }
        let yPercent = 1 - pos.y / height;
        let freq = this.getFreq(yPercent);
        this.drawHarmonics(index, Math.round(freq), pos.x);        
      }

    });
    this.drawPitchBendButton(this.state.pitchButtonPressed);

  }

  MIDINoteOff = (e) => {
    let {resolutionMax, resolutionMin, height, width} = this.context.state;
    this.ctx.clearRect(0, 0, width, height);
    if (this.context.state.noteLinesOn) {
      this.renderNoteLines();
    }
    // Release note at particular index, otherwise redraw other notes
    this.midiNotes.forEach((item, index, arr)=>{
      if (item && !isNaN(item.xPercent)) {
        if (item.number === e.note.number) {
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
        let max = -Infinity;
        this.synths[i].oscillator.partials = harmonicWeights
          .slice(0, numHarmonics + 1)
          .map((weight, index) => {
            let weightFromFilter = this.getFilterCoeficients(freq * (index + 1));
            if (weightFromFilter > max) {
              max = weightFromFilter;
            }
            return weightFromFilter * weight;
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
    let {height, resolutionMax, resolutionMin} = this.context.state;
    // Test Function f
    // let f = x => Math.pow(Math.E,(-0.0002*x));
    let y = this.context.queryFilter(freqToIndex(freq, resolutionMax, resolutionMin, height)/height);
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
        // Not needed anymore, since opacity essentially uses this with slight adjustments
        // x: this.synths[index].oscillator.partials[i] * xPos,
        y: freqToIndex(freq, resolutionMax, resolutionMin, height)
      }
      let opacity = this.synths[index].oscillator.partials[i]*((xPos+100) / width);
      if(i == 0){
        this.label(freq, xPos, pos.y, opacity);
      } else {
        this.label("", xPos, pos.y, opacity);
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
  label(freq, x, y, opacity) {
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
    const color = 'rgba(255, 255, 0, '+opacity+')';
    const outline = 'rgba(0, 0, 0, '+opacity+')';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, radius, radius/2, 0, startingAngle, endingAngle);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = outline;
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
