import React, {Component} from 'react';
import '../styles/spectrogram.css';

import Axes from './axes';
import ScaleControls from './scale-controls'
import Tuning from './tuning';
import SoundMaking from './sound-making';

import { convertToLog, getFreq } from '../util/conversions';
import { Button, Icon } from 'semantic-ui-react';
import KeyHandler, { KEYUP } from 'react-key-handler';
import MyProvider, {MyContext} from './my-provider';


import Logo from '../headphoneSlash.svg';

import WebMidi from 'webmidi';

const ReactAnimationFrame = require('react-animation-frame');

let audioContext = null;
let analyser = null;
let gainNode = null;
let audioTrack = null;
const fftSize = 8192;
// Spectrogram Graph that renders itself and 3 children canvases
// (SoundMaking/TuningMode, Axes and ScaleControls)

class Spectrogram extends Component {
  constructor(props) {
    super(props);
    this.updateNoteLines = React.createRef();
    this.updateAxes = React.createRef();
    this.updateScaleControls = React.createRef();
    this.updateOscNoteLines = React.createRef();

    this.state = {
      resolutionMax: 20000,
      resolutionMin: 20,
      musicKey: {name: 'C', value: 0 },
      accidental: {name: ' ', value: 0},
      scale: {name: 'Major', value: 0},
      microphone: true,
      frequencyLabel: '',
      noteLinesRendered: false
    }
  }
  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
    this.ctx = this.canvas.getContext('2d');
    this.tempCanvas = document.createElement('canvas');

  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  // Starts the Spectrogram and Children Components when the user taps the screen
  // Also creates the audioContext to be used throughout the application
  startSpectrogram = () => {
    if (!this.context.state.isStarted) {
      audioContext = new(window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      gainNode = audioContext.createGain();
      analyser.minDecibels = -100;
      analyser.maxDecibels = -20;
      analyser.smoothingTimeConstant = 0;
      analyser.fftSize = fftSize;
      if (navigator.mozGetUserMedia) {
        navigator.mozGetUserMedia({
          audio: true
        }, this.onStream.bind(this), this.onStreamError.bind(this));
      } else if (navigator.webkitGetUserMedia) {
        navigator.webkitGetUserMedia({
          audio: true
        }, this.onStream.bind(this), this.onStreamError.bind(this));
      }
      // Calls the start function which lets the controls know it has started
      this.context.start();
      this.renderFreqDomain();
    } //else {
    //   this.context.menuClose();
    // }

  }

// Sets up the microphone stream after the Spectrogram is started
// It connects the graph by connecting the microphone to gain and gain to
// the analyser. The gain is used as microphoneGain
  onStream(stream) {
    audioTrack = stream.getTracks()[0];
    let input = audioContext.createMediaStreamSource(stream);
    input.connect(gainNode);
    gainNode.connect(analyser);
    gainNode.gain.setTargetAtTime(1, audioContext.currentTime, 0.01);
  }

  onStreamError(e) {
    console.error(e);
  }

  // Continuous render of the graph (if started) using ReactAnimationFrame plugin
  onAnimationFrame = (time) => {
    if (this.context.state.isStarted) {
      this.renderFreqDomain();
      if(this.updateOscNoteLines.current){
        if(this.context.state.noteLinesOn && !this.state.noteLinesRendered){
            this.updateOscNoteLines.current.renderNoteLines();
            this.setState({noteLinesRendered: true});
          } else if(!this.context.state.noteLinesOn && this.state.noteLinesRendered){
            this.updateOscNoteLines.current.removeNoteLines();
          }

          if(!this.context.state.noteLinesOn){
            this.setState({noteLinesRendered: false})
          }
        }

      if(this.context.state.resolutionMax !== this.state.resolutionMax || this.context.state.resolutionMin !== this.state.resolutionMin){

        // Rerender if components exist
        if(this.updateAxes.current) {
          this.updateAxes.current.renderAxesLabels();
        }
        if(this.updateNoteLines.current){
          this.updateNoteLines.current.renderNoteLines();
        }
        if(this.updateOscNoteLines.current && this.context.state.noteLinesOn){
          this.updateOscNoteLines.current.removeNoteLines();
          this.updateOscNoteLines.current.renderNoteLines();
        }

        this.setState({resolutionMax: this.context.state.resolutionMax, resolutionMin: this.context.state.resolutionMin});
      }
      if(this.context.state.scale !== this.state.scale || this.context.state.musicKey !== this.state.musicKey || this.context.state.accidental !== this.state.accidental){
        if(this.updateNoteLines.current){
          this.updateNoteLines.current.renderNoteLines();
        }
        if(this.updateScaleControls.current && !this.context.state.noteLines){
          // this.updateScaleControls.current.renderNoteLines();
        }
        if(this.updateOscNoteLines.current && this.context.state.noteLinesOn){
          this.updateOscNoteLines.current.removeNoteLines();
          this.updateOscNoteLines.current.renderNoteLines();
        }
        this.setState({scale: this.context.state.scale, musicKey: this.context.state.musicKey, accidental: this.context.state.accidental});
      }

        let gain = convertToLog(this.context.state.microphoneGain, 1, 100, 0.01, 500);
        if (gain !== gainNode.gain.value) {
          gainNode.gain.setTargetAtTime(gain, audioContext.currentTime, 0.01);
        }
      // Turn on/off the microphone by calling audioTrack.stop() and then restarting the stream
      // This checks the readyState of the audioTrack for status of the microphone
      if(!this.context.state.microphone && audioTrack.readyState === "live"){
        audioTrack.stop();
        this.setState({microphone: !this.state.microphone});
      } else if(audioTrack && this.context.state.microphone && audioTrack.readyState === "ended" && !this.state.microphone) {
        if (navigator.mozGetUserMedia) {
          navigator.mozGetUserMedia({
            audio: true
          }, this.onStream.bind(this), this.onStreamError.bind(this));
        } else if (navigator.webkitGetUserMedia) {
          navigator.webkitGetUserMedia({
            audio: true
          }, this.onStream.bind(this), this.onStreamError.bind(this));
        }

        this.setState({microphone: !this.state.microphone});
      }
    }
  }

  // Main Graph function. Renders the frequencies, then copies them to a temporary
  // canvas and shifts that canvas by 1
  renderFreqDomain = () => {
      let { width, height, log, resolutionMax, resolutionMin, speed } = this.context.state;
      let freq = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freq);
      this.tempCtx = this.tempCanvas.getContext('2d');
      this.tempCanvas.width = width;
      this.tempCanvas.height = height;
      this.tempCtx.drawImage(this.canvas, 0, 0, width, height);

      // Iterate over the frequencies.
      for (var i = 0; i < height; i++) {
        var value;
        // Draw each pixel with the specific color.

        // Gets the height and creates a log scale of the index
        if (log) {
          let myPercent = (i / height);
          var logPercent = getFreq(myPercent, resolutionMin, resolutionMax);
          let logIndex = Math.round(logPercent * freq.length / (audioContext.sampleRate / 2));
          value = freq[logIndex];

        } else {
          let myPercent = (i / height);
          let newPercent = Math.floor(myPercent * (resolutionMax - resolutionMin) + resolutionMin) + 1;
          let logIndex = Math.round(newPercent * freq.length / (audioContext.sampleRate / 2));
          value = freq[logIndex];
        }

        this.ctx.fillStyle = this.getColor(value);
        var percent = i / height;
        var y = Math.round(percent * height);
        this.ctx.fillRect(width - speed, height - y, speed, speed);

      }
      // Shifts to left by speed
      this.ctx.translate(-speed, 0);
      this.ctx.drawImage(this.tempCanvas, 0, 0, width, height, 0, 0, width, height);
      // Resets transformation
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Helper function that converts frequency value to color
  getColor(value) {
    // Test Max
    if (value === 255) {
      console.log("MAX!");
    }
    let percent = (value) / 255 * 50;
    // return 'rgb(V, V, V)'.replace(/V/g, 255 - value);
    return 'hsl(H, 100%, P%)'.replace(/H/g, 255 - value).replace(/P/g, percent);
  }

  handleHeadphoneModeToggle=()=>this.context.handleHeadphoneModeToggle();

  handleMicrophoneToggle=()=>this.context.handleMicrophoneToggle();

  spacePressed = (e) =>{
    e.preventDefault();
    e.stopPropagation();
    this.context.handlePause();
  }

  handleResize = () => {
    this.context.handleResize();
    if(this.updateOscNoteLines.current && this.context.state.noteLinesOn === true){
        this.updateOscNoteLines.current.renderNoteLines();
    }
  }

  render() {
    let headphoneStyle={'backgroundColor': ''}
    let microphoneStyle={'backgroundColor': ''}
    if(this.context.state.headphoneMode){
      headphoneStyle = {'backgroundColor': '#2769d8'}
    }
    if(this.context.state.microphone){
      microphoneStyle = {'backgroundColor': '#2769d8'}
    }

    return (
      <MyContext.Consumer>
      {(context) => (
        <div onClick={this.startSpectrogram} >
          <canvas width={context.state.width} height={context.state.height} onKeyPress = {this.onKeyPress} ref={(c) => {
            this.canvas = c;
          }}/>
          {context.state.isStarted &&
            <React.Fragment>
            {context.state.freqControls &&
            <ScaleControls
            resolutionMax={context.state.resolutionMax}
            resolutionMin={context.state.resolutionMin}
            width={context.state.width}
            height={context.state.height}
            handleZoom={context.handleZoom}
            handleResize={this.handleResize}
            noteLinesOn={context.state.noteLinesOn}
            ref={this.updateScaleControls}
            />}
            <Button icon onClick={context.handlePause} className="pause-button">
            {!context.state.speed  ?  <Icon fitted name="circle outline" color="red"/> :
              <Icon fitted name="circle" color="red"/>}
            </Button>
            <Button icon onClick={this.handleHeadphoneModeToggle} className="headphone-mode-button" style={headphoneStyle}>
              {context.state.headphoneMode ? <Icon fitted name="headphones" color="red"/>:
              <img src={Logo} height={12.5} width={13.25} className="headphone-slash-logo"/>}
            </Button>
            <Button icon onClick={this.handleMicrophoneToggle} className="microphone-mode-button" style={microphoneStyle}>
              {context.state.microphone ? <Icon name="microphone" color="red"/> :
              <Icon name="microphone slash" color="red"/>}
            </Button>
            <div className="color-map-container">
              <div className="color-map-text">Graph Scale</div>
              <div className="color-map"></div>
              <div className="color-map-labels">
                Soft<span>Loud</span>
              </div>
            </div>
            <KeyHandler
            keyEventName={KEYUP}
            keyValue=" "
            onKeyHandle={this.spacePressed}
            />
            {/* Renders sound or tuning mode based on variable above */}
            {context.state.tuningMode ? (
               <Tuning
               context={audioContext}
               analyser={analyser}
               ref={this.updateNoteLines}
               handleResize={this.handleResize}/>
             ): (
               <SoundMaking
               audioContext={audioContext}
               analyser={analyser}
               handleResize={this.handleResize}
               ref={this.updateOscNoteLines}
               />
           )}
            <Axes
            resolutionMax={context.state.resolutionMax}
            resolutionMin={context.state.resolutionMin}
            width={context.state.width}
            height={context.state.height}
            handleResize={this.handleResize}
            ref={this.updateAxes}/>
          </React.Fragment>
          }
          {/* Intro Instructions */}
          <div className="instructions">
            {!context.state.isStarted
              ? <p className="flashing">Click or tap anywhere on the canvas to start the spectrogram</p>
              : <p>Great! Be sure to allow use of your microphone.
              You can draw on the canvas to make sound!</p>
            }

            </div>
        </div>
        )}
        </MyContext.Consumer>
    );

  }

}

Spectrogram.contextType = MyContext;

export default ReactAnimationFrame(Spectrogram);
