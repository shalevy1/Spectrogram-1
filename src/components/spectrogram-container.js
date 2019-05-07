import React, { Component } from 'react';
import '../styles/spectrogram-container.css';
import Spectrogram from './spectrogram';
import Menu from './menu';
import { Button, Icon } from 'semantic-ui-react';
import SpectrogramProvider, {SpectrogramContext} from './spectrogram-provider';


// Main Class that Renders Menu and Spectrogram Components
class SpectrogramContainer extends Component {
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
      <div>
      <SpectrogramProvider>
      <SpectrogramContext.Consumer>
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
      handleFreqControls={context.handleFreqControls}
      outputVolume={context.state.outputVolume}
      handleOutputVolumeChange={context.handleOutputVolumeChange}
      hidePanes={context.state.hidePanes}
      handleHidePanesCompletion={context.handleHidePanesCompletion}
      editScales={context.state.editScales}
      />
      <Spectrogram
      handleResize={context.handleResize}
      />
      </React.Fragment>
      )}

      </SpectrogramContext.Consumer>


      {/* <p id="about">
        <a href="https://github.com/ListeningToWaves/Spectrogram" target="_blank" rel="noopener noreferrer" >about</a>
      </p> */}

      {/* Full Screen Button */}
      <Button icon onClick={this.toggleFullScreen} className="fullscreenbutton">
      {!this.state.fullScreen ?  <Icon fitted name="expand" color="orange" size="large"/> :
      <Icon fitted name="compress" color="orange" size="large"/> }
      </Button>

      </SpectrogramProvider>
      </div>
    );
  }
}
SpectrogramContainer.contextType = SpectrogramContext;
export default SpectrogramContainer;
