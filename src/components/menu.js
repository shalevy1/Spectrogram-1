import React, {Component} from 'react';
import {Menu, Dropdown} from 'semantic-ui-react';
import "../styles/menu.css";
import GraphControls from './graph-controls';
import SoundControls from './sound-controls';
import TuningControls from './tuning-controls';
import EditScales from "./edit-scales";
import Slider from 'react-rangeslider';

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
    soundOn: false,
  }



  // Function that switches between Menu Panes (children components)
  handleItemClick = (e, {name}) => {
    let pane = null;
    let editScales = false;
    switch (name) {
      case "tuning":
        if (name !== this.state.activeItem) {
          pane = <TuningControls closeMenu={this.closeMenu}/>
          this.props.handleTuningModeOn();
          editScales = true;
        } else {
          name = null;
          editScales = false;
        }
        break;
      case "sound-making":
        if (name !== this.state.activeItem) {
          pane = <SoundControls closeMenu={this.closeMenu}/>
          if(this.props.tuningMode){
            this.props.handleTuningModeOff();
          }
          editScales = true;
        } else {
          name = null;
          editScales = false;
        }
        break;
      case 'frequency range': 
        if (name !== this.state.activeItem) {
          pane = <GraphControls closeMenu={this.closeMenu} handleFreqControlsToggle={this.props.handleFreqControlsToggle} reset={this.props.reset}/>;
          this.props.handleFreqControlsOn();
        } else {
          name = null;
        }
        editScales = false
        break;
      default:
        pane = null;
    }
    this.setState({activeItem: name, pane: pane, editScales: editScales});
    this.props.handleFreqControlsOff();

  }

  // Function that handles the close of the menu
  closeMenu = () => this.setState({pane: null, activeItem: null, editScales: false});

  // Function that switches to the signal generator on click
  switchToSignalGenerator = () => {
    console.log("SWITCH");
    window.location = "https://listeningtowaves.github.io/Oscilloscope-v2/"
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
          <Menu.Item name='sound-making' active={activeItem === 'sound-making'} onClick={this.handleItemClick} className="tab-item" style={soundStyle}/>
          {/*<Menu.Item name='advanced' active={activeItem === 'advanced'} onClick={this.handleItemClick} className="tab-item"/>*/}

          {/* Microphone Gain */}
          <Menu.Item className="microphone-positioning">
          <div className = "slider-label"> Mic Gain </div>
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
            <div className="slider-label"> Output Volume</div>
            <Slider
            min={1}
            max={100}
            value={this.props.outputVolume}
            onChange={this.props.handleOutputVolumeChange}
            tooltip={this.props.isStarted}
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
      </div>

    )
  }
}

export default MyMenu;
