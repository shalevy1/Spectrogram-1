import React, {Component} from 'react';
import {MyContext} from './my-provider';

import EffectModule from './effect-module';

import {Segment, Menu, Dropdown, Checkbox, Button, Icon} from 'semantic-ui-react';

import "../styles/sound-controls.css";
// Using an ES6 transpiler like Babel
import Slider from 'react-rangeslider';
// To include the default styles
import 'react-rangeslider/lib/index.css';
import {timbreOptions, scaleOptions, keyOptions, accidentalOptions, effectOptions} from '../util/dropdownOptions';

function EffectRender(props){
  let name, toggle, toggleChange, controlNames, controls, controlChanges, disable;
  switch (props.context.state.effectValue) {
    case "Reverb":
      name = "Reverb";
      toggle=props.context.state.reverbOn
      toggleChange=props.context.handleReverbToggle
      controlNames=["Decay Time"]
      controls=[props.context.state.reverbDecay]
      controlChanges=[props.context.handleReverbDecayChange]
      disable=!props.context.state.isStarted
      break;
    case "Delay":
      name="Delay"
      toggle=props.context.state.delayOn
      toggleChange=props.context.handleDelayToggle
      controlNames=["Delay Time", "Feedback"]
      controls=[props.context.state.delayTime, props.context.state.delayFeedback]
      controlChanges=[props.context.handleDelayTimeChange, props.context.handleDelayFeedbackChange]
      disable=!props.context.state.isStarted
      break;
    case "Amplitude Modulation":
      name="Amplitude Modulation"
      toggle=props.context.state.amOn
      toggleChange=props.context.handleAmToggle
      controlNames=["Frequency", "Amplitude"]
      controls=[props.context.state.amRate, props.context.state.amLevel]
      controlChanges=[props.context.handleAmRateChange, props.context.handleAmLevelChange]
      disable=!props.context.state.isStarted
      break;
    case "Frequency Modulation":
      name="Frequency Modulation"
      toggle=props.context.state.fmOn
      toggleChange=props.context.handleFmToggle
      controlNames=["Frequency", "Amplitude"]
      controls=[props.context.state.fmRate, props.context.state.fmLevel]
      controlChanges=[props.context.handleFmRateChange, props.context.handleFmLevelChange]
      disable=!props.context.state.isStarted
      break;
    default:
      name = "Reverb";
      toggle=props.context.state.reverbOn
      toggleChange=props.context.handleReverbToggle
      controlNames=["Decay Time"]
      controls=[props.context.state.reverbDecay]
      controlChanges=[props.context.handleReverbDecayChange]
      disable=!props.context.state.isStarted
      break;

  }
    if(typeof(name) !== "undefined"){
      return (
        <EffectModule
        name={name}
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
      <MyContext.Consumer>
        {(context) => (
          <React.Fragment>
            <Segment compact className="menu-pane-container sound-pane-container">
              <Menu className="menu-pane">
                {/** Sound Toggle **/}
                <Menu.Item className="vert">
                  <div className="menu-header">Sound</div>
                  <div className="sound-toggle-container">
                  <Checkbox
                  toggle
                  checked={context.state.soundOn}
                  onChange={context.handleSoundToggle}
                  disabled={!context.state.isStarted}
                  />

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
                  <div className="menu-header">Timbre</div>
                      <Dropdown
                      text={context.state.timbre}
                      fluid
                      options={timbreOptions}
                      onChange={context.handleTimbreChange}
                      disabled={!context.state.isStarted}
                      className="timbre-dropdown"/>
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
                <Menu.Item className="vert">
                  <div className="menu-header">Scales</div>
                  <Menu.Menu className="horiz">
                    <Menu.Item className="vert no-line no-padding">
                      <div>Scale Mode</div>
                      <Checkbox
                      toggle
                      className="scales-checkbox"
                      checked={context.state.scaleOn}
                      onChange={context.handleScaleToggle}
                      disabled={!context.state.isStarted || context.state.tuningMode}/>
                    </Menu.Item>
                    <Menu.Item className="scale-choice">
                      <Dropdown
                      compact
                      text='Key'
                      options={keyOptions}
                      onChange={context.handleKeyChange}
                      disabled={!context.state.isStarted}
                      >
                      </Dropdown>
                    </Menu.Item>
                    <Menu.Item className="scale-choice">
                      <Dropdown
                      text='#/b'
                      compact
                      options={accidentalOptions}
                      onChange={context.handleAccidentalChange}
                      disabled={!context.state.isStarted}/>
                    </Menu.Item>
                    <Menu.Item className="scale-choice">
                      <Dropdown
                      text='Scale'
                      compact
                      options={scaleOptions}
                      onChange={context.handleScaleChange}
                      disabled={!context.state.isStarted}
                      scrolling
                      />
                    </Menu.Item>

                  </Menu.Menu>
                  <div className="scales-bottom">
                  <div className="note-lines">
                    <div>Note Lines</div>
                    <Checkbox
                    toggle
                    className="scales-checkbox"
                    checked={context.state.noteLinesOn}
                    onChange={context.handleNoteLinesToggle}
                    disabled={!context.state.isStarted || !context.state.scaleOn}/>
                  </div>
                  <div>
                  {/* Render Scale Name to screen. Don't render 'chromatic' scale name or accidental */}
                  {(context.state.scale.name === "Chromatic")? "" : context.state.musicKey.name}{(context.state.scale.name === "Chromatic")? "" : context.state.accidental.name}{context.state.scale.name}
                  </div>
                  <Button className="edit-scales-button" onClick={context.handleEditScalesChange}>Edit </Button>
                  </div>
                </Menu.Item>
                  {/* Effects */}
                <Menu.Item className="vert effects-stretch">
                <div className="menu-header">Effects</div>
                <Dropdown
                className="effects-dropdown"
                placeholder= "Select Effect"
                selection
                fluid
                options={effectOptions}
                value={context.state.effectValue}
                onChange={(e, data)=>context.handleEffectChoiceChange(data.value)}
                />
                <EffectRender context={context} />

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
      </MyContext.Consumer>
    );
  }
}

export default SoundControls;
