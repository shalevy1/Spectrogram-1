import React, {Component} from 'react';
import {Menu} from 'semantic-ui-react';
import "../styles/menu.css";
import GraphControls from './graph-controls';
import SoundControls from './sound-controls';
import TuningControls from './tuning-controls';
import Slider from 'react-rangeslider';

// To include the default styles
import 'react-rangeslider/lib/index.css';

// Main Menu Class that renders children as individual tab panes
class MyMenu extends Component {
  state = {
    activeItem: null,
    pane: null,
    value: 50,
    soundOn: false,
  }
  // Function that switches between Menu Panes (children components)
  handleItemClick = (e, {name}) => {
    let pane = null;
    switch (name) {
      case "tuning":
        if (name !== this.state.activeItem) {
          pane = <TuningControls closeMenu={this.closeMenu}/>
          this.props.handleTuningModeOn();
        } else {
          name = null;
        }
        break;
      case "sound-making":
        if (name !== this.state.activeItem) {
          pane = <SoundControls closeMenu={this.closeMenu}/>
          if(this.props.tuningMode){
            this.props.handleTuningModeOff();
          }
        } else {
          name = null;
        }

        break;

      default:
        pane = null;
    }
    this.setState({activeItem: name, pane: pane});
    this.props.handleFreqControlsOff();

  }

  closeMenu = () => this.setState({pane: null, activeItem: null});

  // Function that switches to the signal generator on click
  switchToSignalGenerator = () => {
    console.log("SWITCH");
    window.location = "https://listeningtowaves.github.io/OscilloscopeTesting/"
  }
  // Function that handles the change of the Microphone gain
  handleGainChange = gain => {
    if (this.props.isStarted) {
      this.setState({value: gain});
      this.props.handleGainChange(gain);
    }
  }
// Function that toggles the sound button between the on and off states
  handleSoundToggle = () =>{
    this.setState({soundOn: !this.state.soundOn});
    this.props.handleSoundToggle();
  }

  // Function that handles the push of the reset button
  // (resets all params except isStarted)
  // handleReset = () => {
  //   this.setState({value: 50, soundOn: false, tuningMode: false});
  //   this.props.reset();
  // }

  showFreqControls = () =>{
    if(this.state.activeItem !== 'graph'){
      this.setState({
        pane: <GraphControls closeMenu={this.closeMenu} handleFreqControlsToggle={this.props.handleFreqControlsToggle} reset={this.props.reset}/>,
        activeItem: 'graph'
      });
      this.props.handleFreqControlsOn();
    } else{
      this.setState({pane: null, activeItem: null});
      this.props.handleFreqControlsOff();
    }
  }

  // Function that handle switch between modes
  // handleTuningModeToggle = () =>{
  //   this.setState({tuningMode: !this.state.tuningMode});
  //   this.props.handleTuningModeToggle();
  // }

  // Renders the top Menu Bar with tabs, microphone gain, and the two menu buttons
  // as well as the graph scale and which tab to render
  render() {
    const {activeItem} = this.state;
    const activeStyle = {'borderBottom': '4px solid #A291FB'}
    const defaultStyle= {'borderBottom': '0'}
    // let style={'backgroundColor': '' }
    let tuningStyle=defaultStyle;
    let soundStyle=defaultStyle;

  if(this.props.isStarted){
    if(this.props.tuningMode){
      // style = {'backgroundColor': '#ff8177'}
      tuningStyle=activeStyle;
      soundStyle=defaultStyle
    } else{
      tuningStyle=defaultStyle;
      soundStyle=activeStyle;
    }
  }
    return (
      <div className="menu-container">
        <Menu color="violet" tabular pointing className="menu-menu" attached="bottom">
          <Menu.Item className="function-switch-button-container">
            <button className="function-switch-button" onClick={this.switchToSignalGenerator}>Signal Generator</button>
          </Menu.Item>
          <Menu.Item name='tuning' active={activeItem === 'tuning'} onClick={this.handleItemClick} className="tab-item" style={tuningStyle}/>
          <Menu.Item name='sound-making' active={activeItem === 'sound-making'} onClick={this.handleItemClick} className="tab-item" style={soundStyle}/>
          {/*<Menu.Item name='advanced' active={activeItem === 'advanced'} onClick={this.handleItemClick} className="tab-item"/>*/}

          <Menu.Item className="microphone-positioning">
            Microphone Gain&nbsp;&nbsp;
            <div className="gain-container">
              <Slider
              min={1}
              max={100}
              value={this.state.value}
              onChange={this.handleGainChange}
              tooltip={false}
              className="gain-slider"/>
            </div>
          </Menu.Item>

              <Menu.Item position="right" className="no-margin">
                <button onClick={this.showFreqControls} className="freq-button">Scale Controls</button>
                </Menu.Item>
          <Menu.Header className="menu-title" active="false">Spectrogram</Menu.Header>
        </Menu>
        {this.state.pane}

      </div>

    );
  }
}

export default MyMenu;
