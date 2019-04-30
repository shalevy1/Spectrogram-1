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

      </MyContext.Consumer>


      {/* <p id="about">
        <a href="https://github.com/ListeningToWaves/Spectrogram" target="_blank" rel="noopener noreferrer" >about</a>
      </p> */}

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
