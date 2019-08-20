import React, {Component} from 'react';
import '../styles/spectrogram.css';

import Axes from './axes';
import FrequencyRange from './frequency-range'
import Tuning from './tuning';
import SoundMaking from './sound-making';

import { convertToLog, getFreq } from '../util/conversions';
import { Button, Icon } from 'semantic-ui-react';
import KeyHandler, { KEYUP } from 'react-key-handler';
import {SpectrogramContext} from './spectrogram-provider';


import Logo from '../headphoneSlash.svg';
import Logo2 from '../midi-red.svg';
import Logo3 from '../midi-grey.svg';
import MicPerm1 from '../Microphone Permissions 1.png';
import MicPerm2 from '../Microphone Permissions 2.png';
import MicPerm3 from '../Microphone Permissions 3.png';

import WebMidi from 'webmidi';


const ReactAnimationFrame = require('react-animation-frame');

let audioContext = null;
let analyser = null;
let gainNode = null;
let audioTrack = null;

const fftSize = 8192;
// Spectrogram Graph that renders itself and 3 children canvases
// (SoundMaking/TuningMode, Axes and FrequencyRange)

class Spectrogram extends Component {
  constructor(props) {
    super(props);
    this.tuningRef = React.createRef();
    this.axesRef = React.createRef();
    this.frequencyRangeRef = React.createRef();
    this.soundMakingRef = React.createRef();

    this.state = {
      resolutionMax: 20000,
      resolutionMin: 20,
      musicKey: {name: 'C', value: 0 },
      accidental: {name: ' ', value: 0},
      scale: {name: 'Major', value: 0},
      microphone: false,
      frequencyLabel: '',
      noteLinesRendered: false,
      midi: false,
      sustainOn: false,
      numHarmonics: 1,
      filterSustainChanged: false,
      instr: true,
      // deferredPrompt: null,
      // showAddToHomeScreen: false
    }
  }
  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("load", this.startSpectrogram);

    this.ctx = this.canvas.getContext('2d');
    this.tempCanvas = document.createElement('canvas');
    WebMidi.enable((err) => {
      if (err) {
        console.log("WebMidi could not be enabled.", err);
      }
      console.log("Success");
      this.context.handleMIDIEnabled();
    });
    // window.addEventListener('beforeinstallprompt', (e) => {
    //   // Prevent Chrome 67 and earlier from automatically showing the prompt
    //   e.preventDefault();
    //   console.log("hi")
    //   // Stash the event so it can be triggered later.
    //   this.setState({deferredPrompt: e, showAddToHomeScreen:true});
    // });

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
            
      // Prompt for microphone. Has been moved down to within onAnimationFrame
      // if (navigator.mediaDevices.getUserMedia) {
      //   navigator.mediaDevices.getUserMedia({
      //       audio: true
      //     })
      //     .then(this.onStream.bind(this))
      //     .catch(this.onStreamError.bind(this));
      // }
      // else if (navigator.mozGetUserMedia) {
      //   navigator.mozGetUserMedia({
      //     audio: true
      //   }, this.onStream.bind(this), this.onStreamError.bind(this));
      // } else if (navigator.webkitGetUserMedia) {
      //   navigator.webkitGetUserMedia({
      //     audio: true
      //   }, this.onStream.bind(this), this.onStreamError.bind(this));
      // }

      // Calls the start function which lets the controls know it has started
      this.context.start();
      this.renderFreqDomain();
      
      // Start timeout for instructions to close
      this.setState({instr: false});
      setTimeout(this.handleInstructionsClose, 5000);

    } //else {
    //   this.context.menuClose();
    // }
    
  }

  requestMicrophoneAccess = () => {
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
          audio: true
        })
        .then(this.onStream.bind(this))
        .catch(this.onStreamError.bind(this));
    }
    else if (navigator.mozGetUserMedia) {
      navigator.mozGetUserMedia({
        audio: true
      }, this.onStream.bind(this), this.onStreamError.bind(this));
    } else if (navigator.webkitGetUserMedia) {
      navigator.webkitGetUserMedia({
        audio: true
      }, this.onStream.bind(this), this.onStreamError.bind(this));
    }
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
    this.context.handleMicPermissionToggle(true);
  }

  onStreamError(e) {
    console.error(e);
    console.log("Microphone has not been enabled. Please enable the microphone.");
    this.context.handleMicPermissionToggle(false);
    this.handleModalToggle();
  }

  // Continuous render of the graph (if started) using ReactAnimationFrame plugin
  onAnimationFrame = (time) => {
    if (this.context.state.isStarted) {
      this.renderFreqDomain();
      // Resume audioContext if suspended for whatever reason
      if (audioContext.state != "running") {
        audioContext.resume().then(() => {
          console.log('Playback resumed successfully');
        });
      }
      if(this.soundMakingRef.current){
          if(this.context.state.noteLinesOn && !this.state.noteLinesRendered){
            this.soundMakingRef.current.renderNoteLines();
            this.soundMakingRef.current.drawPitchBendButton(false);
            this.setState({noteLinesRendered: true});
          } else if(!this.context.state.noteLinesOn && this.state.noteLinesRendered){
            this.soundMakingRef.current.removeNoteLines();
            this.soundMakingRef.current.drawPitchBendButton(false);            
          }

          if(!this.context.state.noteLinesOn){
            this.setState({noteLinesRendered: false});
          }
          if(this.context.state.soundOn && this.context.state.sustain && (this.context.state.numHarmonics !== this.state.numHarmonics) || (this.context.state.filterSustainChanged !== this.state.filterSustainChanged)){
            this.soundMakingRef.current.sustainChangeTimbre();
            this.setState({numHarmonics: this.context.state.numHarmonics, filterSustainChanged: this.context.state.filterSustainChanged});
          }
          if(this.context.state.soundOn &&this.context.state.sustain && !this.state.sustainOn){
          
            this.setState({sustainOn: true});
          }
          else if(!this.context.state.sustain && this.state.sustainOn){
            this.soundMakingRef.current.releaseAll();
            this.setState({sustainOn: false});
          }
          else if(this.context.state.sustain && !this.context.state.soundOn && this.state.sustainOn){
            this.soundMakingRef.current.releaseAll();
          }
        }

      if(this.context.state.resolutionMax !== this.state.resolutionMax || this.context.state.resolutionMin !== this.state.resolutionMin){

        // Rerender if components exist
        if(this.axesRef.current) {
          this.axesRef.current.renderAxesLabels();
        }
        if(this.tuningRef.current){
          this.tuningRef.current.renderNoteLines();
        }
        if(this.soundMakingRef.current && this.context.state.noteLinesOn){
          this.soundMakingRef.current.removeNoteLines();
          this.soundMakingRef.current.renderNoteLines();
          this.soundMakingRef.current.drawPitchBendButton(false);
        }

        this.setState({resolutionMax: this.context.state.resolutionMax, resolutionMin: this.context.state.resolutionMin});
      }
      if(this.context.state.scale !== this.state.scale || this.context.state.musicKey !== this.state.musicKey || this.context.state.accidental !== this.state.accidental){
        if(this.tuningRef.current){
          this.tuningRef.current.renderNoteLines();
        }
        if(this.frequencyRangeRef.current && !this.context.state.noteLines){
          // this.frequencyRangeRef.current.renderNoteLines();
        }
        if(this.soundMakingRef.current && this.context.state.noteLinesOn){
          this.soundMakingRef.current.removeNoteLines();
          this.soundMakingRef.current.renderNoteLines();
          this.soundMakingRef.current.drawPitchBendButton(false);
        }
        this.setState({scale: this.context.state.scale, musicKey: this.context.state.musicKey, accidental: this.context.state.accidental});
      }

      let gain = convertToLog(this.context.state.microphoneGain, 1, 100, 0.01, 500);
      if (gain !== gainNode.gain.value) {
        gainNode.gain.setTargetAtTime(gain, audioContext.currentTime, 0.01);
      }
      // Turn on/off the microphone by calling audioTrack.stop() and then restarting the stream
      // This checks the readyState of the audioTrack for status of the microphone

      // First section is for microphone has not been set up yet
      if (!audioTrack && this.context.state.startMicrophone && !this.state.microphone) {
        console.log("try setting up the mic...");

        // ask for permission and set up mic
        this.requestMicrophoneAccess();

        this.setState({microphone: true});
      }
      else if (audioTrack && this.context.state.startMicrophone) {
        if(!this.context.state.microphone && audioTrack.readyState === "live"){
          audioTrack.stop();
          this.setState({microphone: !this.state.microphone});
        } else if((audioTrack && this.context.state.microphone && audioTrack.readyState === "ended" && !this.state.microphone) ) {

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

      if(this.context.state.midi && !this.state.midi){
        try {
          let input = WebMidi.inputs[0];
          input.addListener('noteon', "all", this.soundMakingRef.current.MIDINoteOn);
          input.addListener('noteoff', "all", this.soundMakingRef.current.MIDINoteOff);
          this.setState({midi: true});
        } catch(e){
          console.error("No MIDI Device 1");
          this.context.handleMIDIChange();          

        }
        // finally {
        // }
      } else if(!this.context.state.midi && this.state.midi){
        try{
        let input = WebMidi.inputs[0];
        input.removeListener('noteon', "all", this.soundMakingRef.current.MIDINoteOn);
        input.removeListener('noteoff', "all", this.soundMakingRef.current.MIDINoteOff);
        // this.setState({midi: false});
        } catch(e){
          console.error("NO MIDI Device 2");
        }
        finally{
        this.setState({midi: false});

        }
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
    if(this.soundMakingRef.current && this.context.state.noteLinesOn === true){
        this.soundMakingRef.current.renderNoteLines();
    }
  }
    
  // Toggle modal window (instructions to allow microphone)
  handleModalToggle=()=>this.context.handleModalToggle();
  // Close instructions
  handleInstructionsClose=()=> {
    this.context.handleInstructionsClose();
  }

  // addToHomeScreen = () =>{
  //   this.state.deferredPrompt.prompt();
  //   // Wait for the user to respond to the prompt
  //   this.state.deferredPrompt.userChoice
  //     .then((choiceResult) => {
  //       if (choiceResult.outcome === 'accepted') {
  //         console.log('User accepted the A2HS prompt');
  //       } else {
  //         console.log('User dismissed the A2HS prompt');
  //       }
  //       this.setState({deferredPrompt: null});
  //     });
  // }

  render() {
    let headphoneStyle={'backgroundColor': ''};
    let microphoneStyle={'backgroundColor': ''};
    let midiStyle={'backgroundColor': ''};
    if(this.context.state.headphoneMode){
      headphoneStyle = {'backgroundColor': '#2769d8'};
    }
    if(this.context.state.microphone){
      microphoneStyle = {'backgroundColor': '#2769d8'};
    }
    if(this.context.state.midi){
      microphoneStyle = {'backgroundColor': '#2769d8'};
    }

    return (
      <SpectrogramContext.Consumer>
      {(context) => (
        <div>
          <canvas className="bg-black" width={context.state.width} height={context.state.height} onKeyPress = {this.onKeyPress} ref={(c) => {
            this.canvas = c;
          }}/>
          <link rel="preload" href="../midi-red.svg"/>
          <link rel="preload" href="../midi-grey.svg"/>
          <link rel="preload" href="../headphoneSlash.svg"/>

          <link rel="preload" href="../Microphone Permissions 1.png"/>
          <link rel="preload" href="../Microphone Permissions 2.png"/>
          <link rel="preload" href="../Microphone Permissions 3.png"/>

          {context.state.isStarted &&
            <React.Fragment>
            {/* {context.state.freqControls &&
            <FrequencyRange
            resolutionMax={context.state.resolutionMax}
            resolutionMin={context.state.resolutionMin}
            width={context.state.width}
            height={context.state.height}
            handleZoom={context.handleZoom}
            handleResize={this.handleResize}
            noteLinesOn={context.state.noteLinesOn}
            ref={this.frequencyRangeRef}
            />} */}
            <Button icon onClick={context.handlePause} className="pause-button">
            {!context.state.speed  ?  <Icon fitted name="play" color="red"/> :
              <Icon fitted name="pause" color="red"/>}
            </Button>
            <Button icon onClick={this.handleHeadphoneModeToggle} className="headphone-mode-button" style={headphoneStyle}>
              {context.state.headphoneMode ? <Icon fitted name="headphones" color="red"/>:
              <img src={Logo} height={12.5} width={13.25} className="headphone-slash-logo" alt="headphone slash"/>}
            </Button>
            <Button icon onClick={this.handleMicrophoneToggle} className="microphone-mode-button" style={microphoneStyle}>
              {context.state.microphone ? <Icon name="microphone" color="red"/> :
              <Icon name="microphone slash" color="red"/>}
            </Button>
            <Button 
            className="info-button" 
            href = "https://listeningtowaves.com/sound-exploration"
              target = "_blank"
              rel = "noopener noreferrer" >              
            <Icon name="info" color="red" className="info-button-icon"/>
            </Button>
            <Button icon onClick={this.context.handleMIDIChange} className="midi-button" style={midiStyle} disabled={!context.state.midiEnabled}>
              {context.state.midi ? <img src={Logo2} height={20} width={15} className="midi-logo" alt="midi on"/> :
              <img src={Logo3} height={14.5} width={13.25} className="midi-logo" alt="midi off"/>}
            </Button>
            <div className="color-map-container">
              <div className="color-map-text">Graph Scale</div>
              <div className="color-map"></div>
              <div className="color-map-labels"><div>Soft</div><div>Loud</div></div>
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
               ref={this.tuningRef}
               handleResize={this.handleResize}/>
             ): (
               <SoundMaking
               audioContext={audioContext}
               analyser={analyser}
               handleResize={this.handleResize}
               ref={this.soundMakingRef}
               />
           )}
            <Axes
            resolutionMax={context.state.resolutionMax}
            resolutionMin={context.state.resolutionMin}
            width={context.state.width}
            height={context.state.height}
            handleResize={this.handleResize}
            ref={this.axesRef}/>
          </React.Fragment>
          }
          {/* Intro Instructions */}
          {context.state.instr ? 
            <div>
              <div id="outside-instr" onClick={this.handleInstructionsClose}></div>
              <div id="instructions-bg" className={!this.state.instr ? "closing" : ""}>
                <div id="close-instr" onClick={this.handleInstructionsClose}>
                  <Icon fitted link color="red" name="close"/>
                </div>
                <div id="instructions">
                  {!context.state.isStarted
                    ? <p className="flashing">Loading... Please wait...</p>
                    : <p>Welcome to the Spectrogram! You can draw on the screen to make sound!
                      To allow microphone use, click or tap the microphone button 
                      on the top left corner.</p>
                    // ? <p className="flashing">Click or tap anywhere on the canvas to start the spectrogram</p>
                    // : <p>Great! Be sure to allow use of your microphone.
                    // You can draw on the canvas to make sound!</p>
                  }
                </div>
              </div>
            </div>
          : <div/>
          }
          
          {context.state.modal ? 
            <div className="modal">
              <div className="row">
                <div className="column">
                  <div className="header">
                    <div className="title">To Use the Live Spectrogram:
                      <br></br><br></br>
                      <Icon name="info circle" color="red"/>
                      <div className="subtitle">You will need to allow microphone access!</div>
                      <Icon size="big" name="long arrow alternate right" color="black"/>
                    </div>
                    <Button
                      className="modalBtn"
                      onClick={this.handleModalToggle}
                    >Close</Button>
                  </div>
                </div>
                {/* <div class="step"> */}
                  <div className="column">
                    <p><b>1)</b> Look for the lock or info icon on the top left of the page, directly to the left of your browser's address bar.</p>
                    <img className="img" src={MicPerm1}></img>
                  </div>
                {/* </div> */}
                <div className="step">
                  <div className="row">
                    <p><b>2)</b> Click on the icon, then locate the "Microphone" field in the menu.</p>
                    <img className="img" src={MicPerm2}></img>
                  </div>
                </div>
                {/* <div class="step"> */}
                  <div className="column">
                    <p><b>3)</b> Click on the field corresponding to Microphone, then select "Allow" in the dropdown options.</p>
                    <img className="img" src={MicPerm3}></img>
                  </div>
                {/* </div> */}
              </div>
            </div>
          : null }
            {/* {this.state.showAddToHomeScreen&& */}
              {/* <button onClick={this.addToHomeScreen}>Add to homescreen?</button> */}
            {/* } */}
        </div>
        )}
        </SpectrogramContext.Consumer>
    );

  }

}

Spectrogram.contextType = SpectrogramContext;

export default ReactAnimationFrame(Spectrogram);
