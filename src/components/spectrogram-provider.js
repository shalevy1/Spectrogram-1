import React, { Component } from 'react';
import {convertToLog, convertToLinear, getColorIndicesForCoord, convertHarmonicScaleToLog, scaleFilter} from "../util/conversions";
import generateScale from '../util/generateScale';
import {scaleOptions} from '../util/dropdownOptions';
// React new Context API
// Create Context
export const SpectrogramContext = React.createContext();
const noteNameScale = ['A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab'];

// Then create provider component
class SpectrogramProvider extends Component {
  //All Controls
  state = {
    soundOn: true,
    microphoneGain: 50,
    timbre: 'Sine',
    numHarmonics: 0,   
    // harmonicWeights: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    harmonicsSliderValue: 0,
    drawFilter: false,
    filterHeights: null,
    filterCanvasWidth: 0,
    filterCanvasHeight: 0,
    filterSustainChanged: false,
    scaleOn: false,
    noteLinesOn: false,
    musicKey: {name: 'C', value: 0 },
    accidental: {name: ' ', value: 0}, // 2 for b, 1 for #
    scale: {name: 'Major', value: 0},
    customScale: [false,false,false,false,false,false,false,false,false,false,false,false],
    scaleNotes: ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'],
    scaleOptionsList: scaleOptions,
    outputVolume: 50,
    attack: 0.005,
    release: 1,
    width: window.innerWidth,
    height: window.innerHeight,
    speed: 2,
    log: true,
    resolutionMax: 20000,//Real Max
    resolutionMin: 20, // Real Min
    limitMax: 100, // Range slider max
    limitMin: 31, // Range slider Min
    min: 20, // Temp Min for Input
    max: 20000, // Temp Max for Input
    tuningMode: false,// Mode Switcher
    freqControls: false, // Graph Limit controls toggle
    graphPreset: 'default',
    headphoneMode: true,
    microphone: false,
    startMicrophone: false,
    modal: false,
    instr: true,
    micPermission: false,
    effectValue: "notset",
    reverbOn: false,
    reverbDecay: 0.5,
    delayOn: false,
    delayTime: 0.25,
    delayFeedback: 0.25,
    amOn: false, // Amplitude Modulation
    amRate: 0.15,
    amLevel: 1,
    fmRate: 0.5,
    fmLevel: 0.3,
    editScales: false,
    quantize: false,
    midiEnabled: false,
    midi: false,
    //hidePanes: false,
    isStarted: false,
    // soundButtonText: 'OFF',
    reverbText: 'OFF',
    delayText: 'OFF',
    amText: 'OFF',
    fmText: 'OFF',
    reverbSwitch: false,
    delaySwitch: false,
    amSwitch: false,
    fmSwitch: false,
    effectVisibility: false,
    scaleOptionsShow: false,
    scaleDropdown: false,
    scaleTypeDropdown: false,
    justIntonation: false,
  }

  //Functions that setState based on Controls
  render() {
    return (
      <SpectrogramContext.Provider value={{
        state: this.state,
        handleModalToggle: () => {
          this.setState({modal: !this.state.modal});
          console.log("Modal closing: " + this.state.modal);
        },
        handleInstructionsClose: () => {
          this.setState({instr: false});
        },
        handleMicPermissionToggle: (val) => this.setState({micPermission: val}),
        handleGainChange: value => {
          if(this.state.isStarted){
            this.setState({microphoneGain: value});
          }
        },
        handleSoundToggle: () => {
          this.setState({soundOn: !this.state.soundOn});
          if (this.state.soundOn) {
            this.setState({ soundButtonText: 'OFF'})
          }
          else
            this.setState({ soundButtonText: 'ON'})
        },
        handleScaleToggle: () => {
          if(this.state.scaleOn){
              this.setState({scaleOn: false, noteLinesOn: false, editScales: false});
              this.setState({scaleOptionsShow: false});
          } else {
              this.setState({scaleOn: true, noteLinesOn: true});
              this.setState({scaleOptionsShow: true});
          }
          
        },
        handleNoteLinesToggle: () => this.setState({noteLinesOn: !this.state.noteLinesOn}),
        handleOutputVolumeChange: value => {
          if(this.state.isStarted){
            this.setState({outputVolume:value});
          }
        },
        handleTimbreChange: (e, data) => {
          let newTimbre = data.options[data.value].text;
          this.setState({timbre: newTimbre});
        },
        handleHarmonicsChange: (e, data)=>{
          let value, sliderval;
          if(!isNaN(e)){
            sliderval = Number(e);
            value = Math.round(convertHarmonicScaleToLog(Number(e), 1000));
          } else {
            value = convertHarmonicScaleToLog(Number(data.value), 1000);
          }
          if(!isNaN(value) && value > -1 && value <= 100){
            this.setState({harmonicsSliderValue: sliderval});
            this.setState({numHarmonics: value});
          }            
        },
        handleToggleDrawFilter: () => {
          if (this.state.editScales && !this.state.drawFilter) {
            this.setState({editScales: false});
          }
          this.setState({drawFilter: !this.state.drawFilter});
        },
        setFilter: (heights, filterWidth, filterHeight) =>{
          this.setState({filterHeights: heights, filterCanvasWidth: filterWidth, filterCanvasHeight: filterHeight});
          if(this.state.sustain){
            this.setState({filterSustainChanged: !this.state.filterSustainChanged});
          }
        },
        queryFilter: yPercent => {
          if (!this.state.filterHeights) {
            return 1;
          }
          let yPos = yPercent * this.state.filterCanvasHeight;
          let max = 0;
          let range = 6;
          let start = Math.round(yPos) - Math.round(range/2);
          let end = Math.round(yPos) + Math.round(range/2);
          for (let i = start; i < end; i++){
            let val = this.state.filterHeights[i] / this.state.filterCanvasWidth;
            if(val > max){
              max = val;
            }
          }
          // return convertToLog(max, 0, 1, 0.001, 1));
          return scaleFilter(max, 5);
          // return max;
        },
        handleSustainToggle: ()=> this.setState({sustain: !this.state.sustain}),
        handleQuantizeChange: () =>this.setState({quantize: !this.state.quantize}),
        handleAttackChange: value => {
          if(this.state.isStarted && !this.state.tuningMode){
            this.setState({attack: Math.round(value*10)/10});
          }
        },
        handleReleaseChange: value => {
          if(this.state.isStarted && !this.state.tuningMode){
            this.setState({release: Math.round(value*10)/10});
          }
        },
        handleKeyChange: (e, data) => {
          let newKeyName = data.options[data.value].text;
          let newKeyValue = data.options[data.value].index;
          this.setState({musicKey: {name: newKeyName, value: newKeyValue}});

          // Adjust text labels for edit scales menu
          let scaleNotes = [0,0,0,0,0,0,0,0,0,0,0,0];
          const NUM_NOTES = 12;
          var idx = noteNameScale.indexOf(newKeyName);
          console.log(idx, noteNameScale[idx]);
          for (let j = 0; j < NUM_NOTES; j++) {
            // console.log(j, idx, noteNameScale[idx]);
            scaleNotes[j] = noteNameScale[idx%12];
            idx++;
          }
          this.setState({scaleNotes: scaleNotes});

          // Adjust dropdown options text for scale type 6 up to 11
          let normalScale = this.state.scaleOptionsList.slice(0,6);
          const PENT_START_IDX = 6;
          const PENT_END_IDX = 12;
          for (let value = PENT_START_IDX; value < PENT_END_IDX; value++) {
            let s = generateScale(newKeyValue, value);
            let text = s.scaleNames.join(', ');
            if (value === 6) {
              text = "Major Pentatonic: " + text;
            }
            else if (value === 7) {
              text = "Minor Pentatonic: " + text;
            }
            normalScale.push({text,value});
          }
          // console.log(normalScale);
          this.setState({scaleOptionsList: normalScale});
        },
        // handleAccidentalChange: (e, data) => {
        //   let newAccidentalName = data.options[data.value].text;
        //   let newAccidentalValue = data.value;
        //   this.setState({accidental: {name: newAccidentalName, value: newAccidentalValue}});
        // },
        handleScaleChange: (e, data) => {
          let newScaleName = data.options[data.value].text;
          let newScaleValue = data.value;
          this.setState({scale: {name: newScaleName, value: newScaleValue}});
          console.log(this.state.scale);
        },
        handleScaleDropdownOpen: () => this.setState({scaleDropdown: true}),
        handleScaleDropdownClose: () => this.setState({scaleDropdown: false}),
        handleScaleTypeDropdownOpen: () => this.setState({scaleTypeDropdown: true}),
        handleScaleTypeDropdownClose: () => this.setState({scaleTypeDropdown: false}),

        handleCustomScaleEdit: data => this.setState({}),
        handleScaleEdit: data => this.setState({scale: {name: data.name, value: data.value}}),
        handleScaleNotesEdit: data => this.setState({scaleNotes: data.noteList}),
        handleTuningModeOn: () => this.setState({tuningMode: true, noteLinesOn: true, reverbOn: false, delayOn: false}),
        handleTuningModeOff: () => {
          this.setState({tuningMode: false});
          if(!this.state.scaleOn){
            this.setState({noteLinesOn: false});
          }
        },
        handleFreqControls: controls => this.setState({freqControls: controls}),
        handleRangeChange: value => {
          if(value.length){
            let newMin = Math.round(convertToLog(value[0], 1,100, 1, 20000));
            let newMax = Math.round(convertToLog(value[1], 1,100, 1, 20000));
            console.log(newMin, newMax, value[0], value[1])
            this.setState({
              min: newMin,
              max: newMax,
              limitMin: value[0],
              limitMax: value[1],
              resolutionMin: newMin,
              resolutionMax: newMax
            });
          }
        },

        handleMinChange: (e, data) => this.setState({min: data.value}),
        handleMaxChange: (e, data) => this.setState({max: data.value}),
        handleInputChange: (e) => {
          // This Handle graph scaling through the input boxes and validation of data.
          if(e.key === "Enter"){
            let lowerValue = Number(this.state.min);
            let upperValue = Number(this.state.max);
            if(isNaN(lowerValue) || lowerValue > this.state.resolutionMax || lowerValue > 20000) {
              lowerValue = this.state.resolutionMin;
            }
            if(isNaN(upperValue) || upperValue < this.state.resolutionMin || upperValue < 0) {
              upperValue = this.state.resolutionMax;
            }
            if(lowerValue < 1) lowerValue = 1;
            if(upperValue > 20000) upperValue = 20000;
            let newMin = Math.round(convertToLinear(lowerValue, 1, 100, 1, 20000));
            // console.log(newMin);
            let newMax = Math.round(convertToLinear(upperValue, 1,100, 1, 20000));
            lowerValue = Math.round(lowerValue);
            upperValue = Math.round(upperValue);
            this.setState({min: lowerValue, max: upperValue, resolutionMin: lowerValue, resolutionMax: upperValue, limitMin: newMin, limitMax: newMax });

          }
        },
        handleGraphPresetChange: (e, data) => {
            let lowerValue = 20;
            let upperValue = 20000;
          switch (data.value) {
            case 'bass':
              lowerValue = 80;
              upperValue = 800;
              break;
            case 'tenor':
              lowerValue = 120;
              upperValue = 1200;
              break;
            case 'alto':
              lowerValue = 175;
              upperValue = 1500;
              break;
            case 'soprano':
              lowerValue = 300;
              upperValue = 3000;
              break;
            case 'orchestra':
              lowerValue = 80;
              upperValue = 4000;
              break;
            case 'pipes':
              lowerValue = 900;
              upperValue = 2500;
              break;
            default:
                lowerValue = 20;
                upperValue = 20000;
          }


          let newMin = Math.round(convertToLinear(lowerValue, 1, 100, 1, 20000));
          let newMax = Math.round(convertToLinear(upperValue, 1,100, 1, 20000));
          this.setState({resolutionMin: lowerValue, resolutionMax: upperValue, min: lowerValue, max: upperValue, limitMin: newMin, limitMax: newMax, graphPreset: data.value});
        },
        //menuClose: () => this.setState({hidePanes: true}),
        handleHidePanesCompletion: ()=> this.setState({hidePanes: false, editScales: false}),
        handleResize: () => this.setState({width: window.innerWidth, height: window.innerHeight}),
        handleZoom: (upper, lower) => {
          let upperValue = Number(upper);
          let lowerValue = Number(lower);
          if(isNaN(lowerValue) || lowerValue > this.state.resolutionMax || lowerValue > 20000) {
            lowerValue = this.state.resolutionMin;
          }
          if(isNaN(upperValue) || upperValue < this.state.resolutionMin || upperValue < 1) {
            upperValue = this.state.resolutionMax;
          }
          let newMax = Math.round(convertToLinear(upperValue, 1,100, 1, 20000));
          let newMin = Math.round(convertToLinear(lowerValue, 1, 100, 1, 20000));
          lowerValue = Math.round(lowerValue);
          upperValue = Math.round(upperValue);
          this.setState({min: lowerValue, max: upperValue, resolutionMin: lowerValue, resolutionMax: upperValue, limitMin: newMin, limitMax: newMax });
        },
        handlePause: () => {
          if(this.state.speed !== 0){
            this.setState({prevSpeed: this.state.speed, speed: 0});
          } else {
            this.setState({speed: this.state.prevSpeed});
          }
        },
        handleHeadphoneModeToggle: () => this.setState({headphoneMode: !this.state.headphoneMode}),
        handleMicrophoneToggle: () => {
          // First time microphone activated
          if (!this.state.startMicrophone && !this.state.microphone) {
            this.setState({startMicrophone: true});
          }
          // Toggle modal with instructions to manually allow microphone permissions if initially rejected
          if (this.state.startMicrophone && !this.state.micPermission && !this.state.microphone) {
            this.setState({modal: !this.state.modal});
            console.log("Modal opening: " + this.state.modal);
          }
          this.setState({microphone: !this.state.microphone})
        },
        handleEffectChoiceChange: (choice) => {
          this.setState({reverbSwitch: false});
          this.setState({delaySwitch: false});
          this.setState({amSwitch: false});
          this.setState({fmSwitch: false});
          if (this.state.effectVisibility === true && this.state.effectValue === choice) {
            // this.setState({effectValue: "notset"});
            this.setState({effectVisibility: false});
          }
          else {
            this.setState({effectVisibility: true});
            this.setState({effectValue: choice});   
            switch (choice) {
              case "Reverb":
                this.setState({reverbSwitch: true});
                break;
              case "Delay":
                this.setState({delaySwitch: true});
                break;
              case "Amplitude Modulation":
                this.setState({amSwitch: true});
                break;
              case "Frequency Modulation":
                this.setState({fmSwitch: true});
                break;
              default:
                this.setState({reverbSwitch: false});
                this.setState({delaySwitch: false});
                this.setState({amSwitch: false});
                this.setState({fmSwitch: false});
                break;
            }
          }
        },
        handleReverbToggle: () => {
          this.setState({reverbOn: !this.state.reverbOn});
          if (this.state.reverbOn) {
            this.setState({ reverbText: "OFF"});
          }
          else
            this.setState({ reverbText: "ON"});
        },
        handleReverbDecayChange: value => {
          if(this.state.reverbOn){
            this.setState({reverbDecay: Math.round(value*100)/100});
          }
        },
        handleDelayToggle: () => {
          this.setState({delayOn: !this.state.delayOn});
          if (this.state.delayOn) {
            this.setState({ delayText: "OFF"});
          }
          else
            this.setState({ delayText: "ON"});
        },
        handleDelayTimeChange: value => {
          if(this.state.delayOn){
            this.setState({delayTime: Math.round(value*100)/100});
          }
        },
        handleDelayFeedbackChange: value => {
          if(this.state.delayOn){
            this.setState({delayFeedback: Math.round(value*100)/100});
          }
        },
        handleAmToggle: () => {
          this.setState({amOn: !this.state.amOn});
          if (this.state.amOn) {
            this.setState({ amText: "OFF"});
          }
          else
            this.setState({ amText: "ON"});
        },
        handleAmRateChange: value => {
          if(this.state.amOn){
            this.setState({amRate: Math.round(value*100)/100});
          }
        },
        handleAmLevelChange: value => {
          if(this.state.amOn){
            this.setState({amLevel: Math.round(value*100)/100});
          }
        },
        handleFmToggle: () => {
          this.setState({fmOn: !this.state.fmOn});
          if (this.state.fmOn) {
            this.setState({ fmText: "OFF"});
          }
          else
            this.setState({ fmText: "ON"});
        },
        handleFmRateChange: value => {
          if(this.state.fmOn){
            this.setState({fmRate: Math.round(value*100)/100});
          }
        },
        handleFmLevelChange: value => {
          if(this.state.fmOn){
            this.setState({fmLevel: Math.round(value*100)/100});
          }
        },
        handleEditScalesChange: () => {
          if (this.state.drawFilter && !this.state.editScales) {
            this.setState({drawFilter: false});
          }
          this.setState({editScales: !this.state.editScales});
        },
        handleJustIntonationChange: () => {
          // Maybe need to test filter with just intonation
          // if (this.state.drawFilter && !this.state.editScales) {
          //   this.setState({drawFilter: false});
          // }
          this.setState({justIntonation: !this.state.justIntonation});
          console.log("justIntonation is ON?:" + this.state.justIntonation);
        },
        handleMIDIEnabled: () => this.setState({midiEnabled: true}),
        handleMIDIChange: () => this.setState({midi: !this.state.midi}),
        start: ()=> this.setState({isStarted: true}),
        reset: ()=> this.setState({
          resolutionMax: 20000,//Real Max
          resolutionMin: 20, // Real Min
          limitMax: 100, // Range slider max
          limitMin: 29, // Range slider Min
          min: 20, // Temp Min for Input
          max: 20000, // Temp Max for Input
          graphPreset: 'default'
        })
      }}>
        {this.props.children}
      </SpectrogramContext.Provider>
    );
  };


}
export default SpectrogramProvider;
