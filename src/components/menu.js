import React, {Component} from 'react';
import {Menu, Dropdown, Icon} from 'semantic-ui-react';
import "../styles/menu.css";
import GraphControls from './graph-controls';
import SoundControls from './sound-controls';
import TuningControls from './tuning-controls';
import EditScales from "./edit-scales";
import Filter from "./filter"
import Slider from 'react-rangeslider';
import {withRouter} from "react-router-dom";
// To include the default styles
import 'react-rangeslider/lib/index.css';
let options = [
  {key: 'Signal Generator', text: 'Signal Generator', value: 'Signal Generator'},
  {key: 'Oscilloscope', text: 'Oscilloscope', value: 'Oscilloscope'},  
]

// Main Menu Class that renders children as individual tab panes
class MyMenu extends Component {
  state = {
    activeItem: null,
    pane: null,
    value: 50,
    editScales: false,
    drawFilter: false,
    soundOn: false,
  }



  // Function that switches between Menu Panes (children components)
  handleItemClick = (e, {name}) => {
    let pane = null;
    let editScales = false;
    let drawFilter = false;
    let freqControls;
    switch (name) {
      case "tuning":
        if (name !== this.state.activeItem) {
          pane = <TuningControls closeMenu={this.closeMenu}/>
          this.props.handleTuningModeOn();
          // turn on microphone
          if (!this.props.microphone) {
            this.props.handleMicrophoneToggle();
          }
          editScales = true;
        } else {
          name = null;
          editScales = false;
        }
          freqControls = false;
          drawFilter = false;
        break;
      case "sound-making":
        if (name !== this.state.activeItem) {
          pane = <SoundControls closeMenu={this.closeMenu}/>
          if(this.props.tuningMode){
            this.props.handleTuningModeOff();
          }
          editScales = true;
          drawFilter = true;
        } else {
          name = null;
          editScales = false;
          drawFilter = false;
        }
        freqControls = false;
        break;
        case 'frequency range': 
        if (name !== this.state.activeItem) {
          pane = <GraphControls closeMenu={this.closeMenu} handleFreqControlsToggle={this.props.handleFreqControlsToggle} reset={this.props.reset}/>;
          freqControls = true;
        } else {
          name = null;
          freqControls = false;
        }
        editScales = false;
        drawFilter = false;
        break;
      default:
        pane = null;
        freqControls = false;
    }
    this.setState({activeItem: name, pane: pane, editScales: editScales, drawFilter: drawFilter});
    this.props.handleFreqControls(freqControls);

  }

  // Function that handles the close of the menu
  closeMenu = () => this.setState({pane: null, activeItem: null, editScales: false, drawFilter: false});

  // Function that switches to the signal generator on click
  switchToSignalGenerator = (e,data) => {
    if(data.value === "Signal Generator"){
      window.location.href = "https://signalgenerator.sciencemusic.org/"
    }
    if (data.value === "Oscilloscope") {
      window.location.href = "https://oscilloscope.sciencemusic.org/"
    }
    // console.log("SWITCH");
    // window.location = "https://listeningtowaves.github.io/Oscilloscope-v2/"
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

  // Renders the top Menu Bar with tabs, microphone gain, and the two menu buttons
  // as well as the graph scale and which tab to render
  render() {
    const {activeItem} = this.state;
    const activeStyle = {'borderBottom': '0px solid #ABE2FB'}
    const defaultStyle= {'borderBottom': '0'}
    // let style={'backgroundColor': '' }
    let tuningStyle=defaultStyle;
    let soundStyle=defaultStyle;

  if(this.props.isStarted){
    if(this.props.tuningMode){
      // style = {'backgroundColor': '#ff8177'}
      tuningStyle=activeStyle;
      soundStyle=defaultStyle;
    } else{
      tuningStyle=defaultStyle;
      soundStyle=activeStyle;
    }
  }
    return (
      <div className="menu-container">
        <Menu color="#ABE2FB" tabular className="menu-menu" attached="bottom">
          {/* <Menu.Item className="function-switch-button-container"> */}
            {/* <button className="function-switch-button" onClick={this.switchToSignalGenerator}>Signal Generator</button> */}
          {/* </Menu.Item> */}
          <Menu.Item className="app-bar-dropdown-container"> 
            <Dropdown text="Spectrogram" className="app-bar-dropdown" selection options={options} onChange={this.switchToSignalGenerator}>              
              {/* <Icon fitted name = "bars" size="large" onClick={this.toggleAppBar} style={{"cursor":"pointer"}} id="bars"/> */}
            </Dropdown>
          </Menu.Item>
          <Menu.Item name='tuning' active={activeItem === 'tuning'} onClick={this.handleItemClick} className="tab-item" style={tuningStyle}/>
          <Menu.Item name='sound-makingEXPERIMENTAL' active={activeItem === 'sound-making'} onClick={this.handleItemClick} className="tab-item" style={soundStyle}/>
          {/*<Menu.Item name='advanced' active={activeItem === 'advanced'} onClick={this.handleItemClick} className="tab-item"/>*/}

          {/* Microphone Gain */}
          <Menu.Item className="microphone-positioning">
            <Icon name="microphone"/>
          {/* <div className = "slider-label"> Microphone Gain </div> */}
              <Slider
              min={1}
              max={100}
              value={this.state.value}
              onChange={this.handleGainChange}
              tooltip={false}
              className="slider"/>
          </Menu.Item>
          
          {/* Output Volume */}
          <Menu.Item>
            <Icon name="volume up"/>
            {/* <div className="slider-label"> Output Volume</div> */}
            <Slider
            min={1}
            max={100}
            value={this.props.outputVolume}
            onChange={this.props.handleOutputVolumeChange}
            tooltip={false}
            className="slider"/> 
            {/* <div>
              {this.props.outputVolume}
            </div> */}
          </Menu.Item>

          {/* Scale Controls */}
          <Menu.Item name='frequency range' position="right" active={activeItem === 'frequency range'} onClick={this.handleItemClick} className="tab-item"/>

          {/* <Menu.Header className="menu-title" active="false">Spectrogram</Menu.Header> */}
        </Menu>
        {/* Renders the current pane beneath the menu */}
        {this.state.pane}

        {this.props.editScales && this.state.editScales && <EditScales/> }
        {this.props.drawFilter && this.state.drawFilter && <Filter handleResize={this.props.handleResize}/>}
      </div>

    )
  }
}

export default withRouter(MyMenu);
