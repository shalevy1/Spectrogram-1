import React, {Component} from 'react';
import {Menu, Icon, Button, Dropdown} from 'semantic-ui-react';
import "../styles/menu.css";
import GraphControls from './graph-controls';
import SoundControls from './sound-controls';
import TuningControls from './tuning-controls';
import EditScales from "./edit-scales";
import Slider from 'react-rangeslider';

// To include the default styles
import 'react-rangeslider/lib/index.css';

function AppBar(props){
  return (
    <div className="app-bar-overlay" id="overlay" onClick={e=>props.toggleAppBar(e)}>
      <div className="app-bar-container">
        <div className="app-bar-title-container">
          <div className="app-bar-title">LISTENING TO WAVES</div>
            <a href = "https://github.com/ListeningToWaves/Spectrogram"
              target = "_blank"
              rel = "noopener noreferrer" 
              className="app-bar-about"> 
              about 
            </a>             
        </div>
        <hr className="app-bar-hr"></hr>
        <div className="app-bar-buttons-container">
        <button size="huge" className="app-bar-button">Signal Generator</button>
        <button size = "huge" className = "app-bar-button" style = {{"borderRight": "5px solid #ABE2FB"}}> Spectrogram </button>
        <button size="huge" className="app-bar-button">Oscilloscope</button>
        {/* <Icon name="chevron right" className="app-bar-chevron" size="large"/> */}
        </div>
      </div>
    </div>
  )
}

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

  // Function that handles the push of the reset button
  // (resets all params except isStarted)
  // handleReset = () => {
  //   this.setState({value: 50, soundOn: false, tuningMode: false});
  //   this.props.reset();
  // }

// Function that toggles the frequency controls
  showFreqControls = () =>{
    if(this.state.activeItem !== 'graph'){
      this.setState({
        pane: <GraphControls closeMenu={this.closeMenu} handleFreqControlsToggle={this.props.handleFreqControlsToggle} reset={this.props.reset}/>,
        activeItem: 'graph',
        editScales: false
      });
      this.props.handleFreqControlsOn();
    } else{
      this.setState({pane: null, activeItem: null, editScales: false});
      this.props.handleFreqControlsOff();
    }
  }

  toggleAppBar = e =>{
    if(this.state.activeItem !== 'submenu'){
      this.setState({
        pane: <AppBar toggleAppBar={this.toggleAppBar}/>,
        activeItem: 'submenu',
        ediScales: false
      });
    } else {
      if(e.target.id === "overlay"){
        this.setState({
          pane: null,
          activeItem: null,
          editScales: false
        });
      }
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
        <Menu color="#ABE2FB" tabular pointing className="menu-menu" attached="bottom">
          {/* <Menu.Item className="function-switch-button-container"> */}
            {/* <button className="function-switch-button" onClick={this.switchToSignalGenerator}>Signal Generator</button> */}
          {/* </Menu.Item> */}
          <Menu.Item className="app-bar-dropdown-container"> 
            <Dropdown text="Spectrogram" className="app-bar-dropdown" selection>
              {/* <div className="dropdown-menu-container"> */}
                <Dropdown.Menu className="app-bar-dropdown-menu">
                
                  <Dropdown.Item text = 'Signal Generator' />
                  <Dropdown.Item text = "Oscilloscope" />
                </Dropdown.Menu>
              {/* </div> */}
              {/* <Icon fitted name = "bars" size="large" onClick={this.toggleAppBar} style={{"cursor":"pointer"}} id="bars"/> */}
            </Dropdown>
          </Menu.Item>
          <Menu.Item name='tuning' active={activeItem === 'tuning'} onClick={this.handleItemClick} className="tab-item" style={tuningStyle}/>
          <Menu.Item name='sound-making' active={activeItem === 'sound-making'} onClick={this.handleItemClick} className="tab-item" style={soundStyle}/>
          {/*<Menu.Item name='advanced' active={activeItem === 'advanced'} onClick={this.handleItemClick} className="tab-item"/>*/}
          <Menu.Item>
            <div className="output-volume-label"> Output Volume</div>
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

          {/* Microphone Gain */}
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
          {/* Scale Controls */}
          <Menu.Item position="right" className="no-margin">
            <button onClick={this.showFreqControls} className="freq-button">Frequency Range</button>
          </Menu.Item>

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
