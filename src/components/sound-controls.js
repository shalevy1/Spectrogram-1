import React, {Component} from 'react';
import {SpectrogramContext} from './spectrogram-provider';

import EffectModule from './effect-module';

import {Segment, Menu, Dropdown, Checkbox, Button, Icon, Transition} from 'semantic-ui-react';

import "../styles/sound-controls.css";
// Using an ES6 transpiler like Babel
import Slider from 'react-rangeslider';
// To include the default styles
// import 'react-rangeslider/lib/index.css';
import {timbreOptions, scaleOptions, keyOptions,/* accidentalOptions,*/ effectOptions} from '../util/dropdownOptions';
// Settings icon
import {FaSlidersH} from "react-icons/fa";
// import {MdSettings} from "react-icons/md";

function EffectRender(props){
  let name, text, toggle, toggleChange, controlNames, controls, controlChanges, disable;
  switch (props.context.state.effectValue) {
    case "Reverb":
      name = "Reverb"
      text=props.context.state.reverbText
      // toggle=props.context.state.reverbOn
      // toggleChange=props.context.handleReverbToggle
      controlNames=["Decay Time"]
      controls=[props.context.state.reverbDecay]
      controlChanges=[props.context.handleReverbDecayChange]
      // disable=!props.context.state.isStarted
      break;
    case "Delay":
      name="Delay"
      text=props.context.state.delayText
      // toggle=props.context.state.delayOn
      // toggleChange=props.context.handleDelayToggle
      controlNames=["Delay Time", "Feedback"]
      controls=[props.context.state.delayTime, props.context.state.delayFeedback]
      controlChanges=[props.context.handleDelayTimeChange, props.context.handleDelayFeedbackChange]
      // disable=!props.context.state.isStarted
      break;
    case "Amplitude Modulation":
      name="Amplitude Modulation"
      text=props.context.state.amText
      // toggle=props.context.state.amOn
      // toggleChange=props.context.handleAmToggle
      controlNames=["Frequency", "Amplitude"]
      controls=[props.context.state.amRate, props.context.state.amLevel]
      controlChanges=[props.context.handleAmRateChange, props.context.handleAmLevelChange]
      // disable=!props.context.state.isStarted
      break;
    case "Frequency Modulation":
      name="Frequency Modulation"
      text=props.context.state.fmText
      // toggle=props.context.state.fmOn
      // toggleChange=props.context.handleFmToggle
      controlNames=["Frequency", "Amplitude"]
      controls=[props.context.state.fmRate, props.context.state.fmLevel]
      controlChanges=[props.context.handleFmRateChange, props.context.handleFmLevelChange]
      // disable=!props.context.state.isStarted
      break;
    default:
      name = "notset"
      // text = props.context.state.reverbText
      // toggle=props.context.state.reverbOn
      // toggleChange=props.context.handleReverbToggle
      // controlNames=["Decay Time"]
      // controls=[props.context.state.reverbDecay]
      // controlChanges=[props.context.handleReverbDecayChange]
      // disable=!props.context.state.isStarted
      break;

  }
    // if (name == "notset") {
    //   return <div></div>
    // }
    if(typeof(name) !== "undefined"){
      return (
        <EffectModule
        name={name}
        text={text}
        toggle={toggle}
        toggleChange={toggleChange}
        controlNames={controlNames}
        controls={controls}
        controlChanges={controlChanges}
        disable={disable}
        />
      )
    } else {
      return <div></div>
    }

}

// Sound Controls Class that renders all of the sound controls and uses the
// React Context API to hook up their functionality to the main state in app.js
// Which passes the controls down to Spectrogram
class SoundControls extends Component {
  render() {
    return (
      <SpectrogramContext.Consumer>
        {(context) => (
          <React.Fragment>
            <Segment compact className="menu-pane-container sound-pane-container">
              <Menu className="menu-pane">
                {/** Sound Toggle **/}
                <Menu.Item className="vert">
                  {/* <div className="menu-header">Sound</div> */}
                  <br></br>
                  <div className="sound-toggle-container">
                    <Button
                    toggle
                    active={context.state.soundOn}
                    onClick={context.handleSoundToggle}
                    disabled={!context.state.isStarted}
                    id="toggleButton"
                    >Sound</Button>

                  </div>
                {/*</Menu.Item>*/}

              {/*Microphone Gain*/}
              {/*<Menu.Item className="vert">
                <div className="menu-header">Microphone Gain</div>
                <br></br>
                  <Slider
                  min={1}
                  max={100}
                  value={context.state.microphoneGain}
                  onChange={context.handleGainChange}
                  tooltip={false}
                  className="gain-slider"/>
                  <div>
                  {context.state.microphoneGain}
                </div>
                </Menu.Item>*/}
                <br></br>
                {/** Output Volume **/}
                  {/* <div className="menu-header">Output Volume</div>
                  <Slider
                  min={1}
                  max={100}
                  value={context.state.outputVolume}
                  onChange={context.handleOutputVolumeChange}
                  tooltip={context.state.isStarted}
                  className="slider"/>
                  <div>
                    {context.state.outputVolume}
                  </div> */}
                {/* </Menu.Item> */}

                {/** Timbre **/}
                {/* <Menu.Item className="vert"> */}
                  <div className="menu-header">Harmonics</div>
                      <Slider
                      min={0}
                      max={99}
                      value={context.state.numHarmonics}
                      onChange={context.handleHarmonicsChange}
                      className="harmonics-slider"/>
                      {/* {context.state.numHarmonics} */}
                    <div>
                      <Button
                        onClick={context.handleSustainToggle}
                        className="sustain-button" 
                        toggle
                        active={context.state.sustain}
                      >Sustain</Button> 
                      <Button 
                        onClick={context.handleToggleDrawFilter}
                        className="drawFilter-button"
                        toggle
                        active={context.state.drawFilter}
                      >Draw Filter</Button>
                    </div>
                    
                      {/* <Dropdown
                      text={context.state.timbre}
                      fluid
                      options={timbreOptions}
                      onChange={context.handleTimbreChange}
                      disabled={!context.state.isStarted}
                      className="timbre-dropdown"/> */}
                      {/*<div className="timbre-text">
                        {context.state.timbre}
                      </div>*/}
                      {/*<div className="menu-header quantize-margin">Quantize</div>
                      <div className="sound-toggle-container">
                      <Checkbox
                      toggle
                      checked={context.state.quantize}
                      onChange={context.handleQuantizeChange}
                      disabled={!context.state.isStarted}
                      />

                      </div>*/}

                </Menu.Item>

                {/** ADSR **/}
                {/*<Menu.Item className="vert">
                  <div className="menu-header">ADSR</div>
                  <div className="horiz">
                    <div className="adsr-slider">
                      Attack Time (s)
                      <Slider
                      min={0}
                      max={5}
                      step={0.1}
                      value={context.state.attack}
                      onChange={context.handleAttackChange}
                      tooltip={context.state.isStarted}
                      className="slider"/>
                      {context.state.attack}
                    </div>
                    <div>
                      Release Time (s)
                      <Slider
                      min={0}
                      max={5}
                      step={0.1}
                      value={context.state.release}
                      onChange={context.handleReleaseChange}
                      tooltip={context.state.isStarted}
                      className="slider"/>
                      {context.state.release}
                    </div>
                  </div>
                </Menu.Item>*/}

                {/** Scale Menu **/}
                <Menu.Item className="vert no-line no-padding">
                  {/* <div className="menu-header">Scales</div> */}
                    <br></br>
                    <div>
                      <Button
                      toggle
                      active={context.state.scaleOn}
                      onClick={context.handleScaleToggle}
                      disabled={!context.state.isStarted || context.state.tuningMode}
                      id="toggleButton"
                      >Scales</Button>
                    </div>
                    <br></br>
                    <div>
                      <Button
                      toggle
                      // className="scales-checkbox"
                      active={context.state.noteLinesOn}
                      onClick={context.handleNoteLinesToggle}
                      disabled={!context.state.isStarted || !context.state.scaleOn}
                      id="scaleButton"
                      >Note Lines</Button>
                    </div>
                </Menu.Item>
                <Menu.Item className="vert">
                  <br></br>
                  <div className={context.state.scaleOptionsShow ? '' : 'hidden'}>
                    <Menu.Menu className="vert scale-adjust">
                      <Menu.Item className="horiz no-line no-padding">
                        <Menu.Item className="scale-choice">
                          <Dropdown
                          // text='Key'
                          // placeholder='Key'
                          defaultValue={0}
                          options={keyOptions}
                          onChange={context.handleKeyChange}
                          disabled={!context.state.isStarted}
                          // scrolling={false}
                          compact
                          floating
                          closeOnChange={false}
                          // open={context.state.scaleDropdown}
                          // onMouseEnter={context.handleScaleDropdownOpen}
                          // onMouseLeave={context.handleScaleDropdownClose}
                          >
                          </Dropdown>
                        </Menu.Item>
                        <div className="scale-choice">
                          <Dropdown
                          // text='Scale'
                          // placeholder='Scale'
                          defaultValue={0}
                          options={scaleOptions}
                          onChange={context.handleScaleChange}
                          disabled={!context.state.isStarted}
                          // scrolling={false}
                          compact
                          floating
                          closeOnChange={false}
                          // open={context.state.scaleTypeDropdown}
                          // onMouseEnter={context.handleScaleTypeDropdownOpen}
                          // onMouseLeave={context.handleScaleTypeDropdownClose}
                          />
                        </div>
                      </Menu.Item>
                      {/* <Menu.Item className="vert no-line no-padding"> */}
                        {/* <div className="scales-bottom"> */}
                        {/* <div className="scale-choice"> */}
                        {/* Render Scale Name to screen. Don't render 'chromatic' scale name or accidental */}
                        {/* {(context.state.scale.name === "Chromatic")? "" : context.state.musicKey.name}{(context.state.scale.name === "Chromatic")? "" : context.state.accidental.name}{context.state.scale.name} */}
                        {/* </div> */}
                        <Button
                          id="edit-scales-button"
                          onClick={context.handleEditScalesChange}
                          disabled={!context.state.isStarted}
                          toggle
                          active={context.state.editScales}
                        >Edit</Button>
                        {/* </div> */}
                      {/* </Menu.Item> */}
                    </Menu.Menu>
                  </div>
                </Menu.Item>

                
                  {/* Effects */}
                <Menu.Item className="vert">
                <div className="menu-header">Effects</div>
                  {/* Reverb */}
                  <span>
                  <Button
                  id='effectSwitch'
                  toggle
                  active={context.state.reverbOn}
                  onClick={context.handleReverbToggle}
                  disabled={!context.state.isStarted}
                  >Reverb</Button>
                  <Button
                  id='effectSettings'
                  toggle
                  active={context.state.reverbSwitch}
                  onClick={()=>context.handleEffectChoiceChange("Reverb")}
                  disabled={!context.state.isStarted}
                  ><FaSlidersH/></Button>
                  </span>

                  {/* Delay */}
                  <span>
                  <Button
                  id='effectSwitch'
                  toggle
                  active={context.state.delayOn}
                  onClick={context.handleDelayToggle}
                  disabled={!context.state.isStarted}
                  >Delay</Button>
                  <Button
                  id='effectSettings'
                  toggle
                  active={context.state.delaySwitch}
                  onClick={()=>context.handleEffectChoiceChange("Delay")}
                  disabled={!context.state.isStarted}
                  ><FaSlidersH/></Button>
                  </span>

                  {/* AM */}
                  <span>
                  <Button
                  id='effectSwitch'
                  toggle
                  active={context.state.amOn}
                  onClick={context.handleAmToggle}
                  disabled={!context.state.isStarted}
                  >Amplitude Modulation</Button>
                  <Button
                  id='effectSettingsWithHeight'
                  toggle
                  active={context.state.amSwitch}
                  onClick={()=>context.handleEffectChoiceChange("Amplitude Modulation")}
                  disabled={!context.state.isStarted}
                  ><FaSlidersH/></Button>
                  </span>

                  {/* FM */}
                  <span>
                  <Button
                  id='effectSwitch'
                  toggle
                  active={context.state.fmOn}
                  onClick={context.handleFmToggle}
                  disabled={!context.state.isStarted}
                  >Frequency Modulation</Button>
                  <Button
                  id='effectSettingsWithHeight'
                  toggle
                  active={context.state.fmSwitch}
                  onClick={()=>context.handleEffectChoiceChange("Frequency Modulation")}
                  disabled={!context.state.isStarted}
                  ><FaSlidersH/></Button>
                  </span>


                {/* <Dropdown
                className="effects-dropdown"
                placeholder= "Select Effect"
                selection
                fluid
                options={effectOptions}
                value={context.state.effectValue}
                onChange={(e, data)=>context.handleEffectChoiceChange(data.value)}
                /> */}
                {/* <EffectRender context={context} /> */}
                {/* <EffectModule
                  name = {"Reverb"}
                  text={context.state.reverbText}
                  toggle={context.state.reverbOn}
                  toggleChange={context.handleReverbToggle}
                  controlNames={["Decay Time"]}
                  controls={[context.state.reverbDecay]}
                  controlChanges={[context.handleReverbDecayChange]}
                  disable={!context.state.isStarted}
                 />
                <EffectModule
                  name={"Delay"}
                  text={context.state.delayText}
                  toggle={context.state.delayOn}
                  toggleChange={context.handleDelayToggle}
                  controlNames={["Delay Time", "Feedback"]}
                  controls={[context.state.delayTime, context.state.delayFeedback]}
                  controlChanges={[context.handleDelayTimeChange, context.handleDelayFeedbackChange]}
                  disable={!context.state.isStarted}
                />
                <EffectModule
                  name={"Amplitude Modulation"}
                  text={context.state.amText}
                  toggle={context.state.amOn}
                  toggleChange={context.handleAmToggle}
                  controlNames={["Frequency", "Amplitude"]}
                  controls={[context.state.amRate, context.state.amLevel]}
                  controlChanges={[context.handleAmRateChange, context.handleAmLevelChange]}
                  disable={!context.state.isStarted}
                />
                <EffectModule
                  name={"Frequency Modulation"}
                  text={context.state.fmText}
                  toggle={context.state.fmOn}
                  toggleChange={context.handleFmToggle}
                  controlNames={["Frequency", "Amplitude"]}
                  controls={[context.state.fmRate, context.state.fmLevel]}
                  controlChanges={[context.handleFmRateChange, context.handleFmLevelChange]}
                  disable={!context.state.isStarted}
                /> */}
                </Menu.Item>
                <Menu.Item className="vert no-line no-padding">
                  <Transition visible={context.state.effectVisibility} animation='fade right' duration={400}>
                    <div>
                      <EffectRender context={context} />
                    </div>
                  </Transition>
                    
                </Menu.Item>

              </Menu>
              <div className="sound-close-menu">
                <Button icon onClick={this.props.closeMenu} className="close-menu">
                <Icon fitted name="angle double up" size="large"/>
                </Button>
              </div>

            </Segment>
          </React.Fragment>
        )}
      </SpectrogramContext.Consumer>
    );
  }
}

export default SoundControls;
