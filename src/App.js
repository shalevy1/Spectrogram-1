import React, { Component } from 'react';
import './App.css';
import Spectrogram from './components/spectrogram';
import Menu from './components/menu';
import { Button, Icon } from 'semantic-ui-react';
import MyProvider, {MyContext} from './components/my-provider';


// Main Class that Renders Menu and Spectrogram Components
class App extends Component {
  constructor(){
  super();
  this.state = {
    fullScreen: false
  }
}
  // Maximizes screen
  toggleFullScreen = ()=> {
    if ((document.fullScreenElement && document.fullScreenElement !== null) ||
     (!document.mozFullScreen && !document.webkitIsFullScreen)) {
      if (document.documentElement.requestFullScreen) {
        document.documentElement.requestFullScreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullScreen) {
        document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
      }
      this.setState({fullScreen: true});

    } else {
      if (document.cancelFullScreen) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      }
      this.setState({fullScreen: false});

    }
  }
  render() {
    return (
      <div className="App">
      <MyProvider>
      <MyContext.Consumer>
      {(context) => (
      <React.Fragment>
      <Menu
      reset={context.reset}
      handleGainChange={context.handleGainChange}
      gain={context.state.gain}
      handleSoundToggle={context.handleSoundToggle}
      isStarted={context.state.isStarted}
      tuningMode={context.state.tuningMode}
      handleTuningModeOn={context.handleTuningModeOn}
      handleTuningModeOff={context.handleTuningModeOff}
      handleFreqControlsOn={context.handleFreqControlsOn}
      handleFreqControlsOff={context.handleFreqControlsOff}
      hidePanes={context.state.hidePanes}
      handleHidePanesCompletion={context.handleHidePanesCompletion}
      />
      <Spectrogram
      soundOn={context.state.soundOn}
      microphoneGain={context.state.microphoneGain}
      timbre={context.state.timbre}
      scaleOn={context.state.scaleOn}
      noteLinesOn={context.state.noteLinesOn}
      musicKey={context.state.musicKey}
      accidental={context.state.accidental}
      scale={context.state.scale}
      outputVolume={context.state.outputVolume}
      attack={context.state.attack}
      release={context.state.release}
      width={context.state.width}
      height={context.state.height}
      speed={context.state.speed}
      log={context.state.log}
      resolutionMax={context.state.resolutionMax}
      resolutionMin={context.state.resolutionMin}
      isStarted={context.state.isStarted}
      handleResize={context.handleResize}
      menuClose={context.menuClose}
      handleZoom={context.handleZoom}
      handlePause={context.handlePause}
      headphoneMode={context.state.headphoneMode}
      handleHeadphoneModeToggle={context.handleHeadphoneModeToggle}
      microphone={context.state.microphone}
      handleMicrophoneToggle={context.handleMicrophoneToggle}
      tuningMode={context.state.tuningMode}
      freqControls={context.state.freqControls}
      reverbOn={context.state.reverbOn}
      reverbDecay={context.state.reverbDecay}
      delayOn={context.state.delayOn}
      delayTime={context.state.delayTime}
      delayFeedback={context.state.delayFeedback}
      amOn={context.state.amOn}
      amRate={context.state.amRate}
      fmLevel={context.state.fmLevel}
      fmOn={context.state.fmOn}
      fmRate={context.state.fmRate}
      amLevel={context.state.amLevel}
      intervalOn={context.state.intervalOn}
      chordPolyChromatic={context.state.chordPolyChromatic}
      lowerIntervalValue={context.state.lowerIntervalValue}
      midIntervalValue={context.state.midIntervalValue}
      highIntervalValue={context.state.highIntervalValue}
      lowerIntervalLevel={context.state.lowerIntervalLevel}
      midIntervalLevel={context.state.midIntervalLevel}
      highIntervalLevel={context.state.highIntervalLevel}
      start={context.start}
      />
      </React.Fragment>
      )}

      </MyContext.Consumer>


      <p id="about">
        {/*<h4 id="about-text">Based on the Spectrogram by {' '}
          <a href="https://github.com/borismus" target="_blank" rel="noopener noreferrer" >Boris Smus</a>
          <br></br>
          while he was working at Google
        </h4>*/}
        <a href="https://github.com/ListeningToWaves/SpectrogramTesting" target="_blank" rel="noopener noreferrer" >about</a>
      </p>

      {/* Full Screen Button */}
      <Button icon onClick={this.toggleFullScreen} className="fullscreenbutton">
      {!this.state.fullScreen ?  <Icon fitted name="expand" color="orange" size="large"/> :
      <Icon fitted name="compress" color="orange" size="large"/> }
      </Button>

      </MyProvider>
      </div>
    );
  }
}

export default App;
