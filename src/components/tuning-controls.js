import React, {Component} from 'react';
import {MyContext} from './my-provider';

import {Segment, Menu, Dropdown, Checkbox} from 'semantic-ui-react';
import "../styles/tuning.css";
// Using an ES6 transpiler like Babel
import Slider from 'react-rangeslider';
// To include the default styles
import 'react-rangeslider/lib/index.css';
import {scaleOptions, keyOptions, accidentalOptions} from '../util/dropdownOptions';
import { Button, Icon } from 'semantic-ui-react';

// Sound Controls Class that renders all of the sound controls and uses the
// React Context API to hook up their functionality to the main state in app.js
// Which passes the controls down to Spectrogram
class TuningControls extends Component {


  render() {
    return (
      <MyContext.Consumer>
        {(context) => (
          <React.Fragment>
            <Segment className="menu-pane-container tuning-container">
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


                <br></br>
                </Menu.Item>
                {/** Output Volume **/}
                <Menu.Item className="vert">
                  <div className="menu-header">Output Volume</div>
                  <Slider
                    min={1}
                    max={100}
                    value={context.state.outputVolume}
                    onChange={context.handleOutputVolumeChange}
                    tooltip={context.state.isStarted}
                    className="slider"/>
                    <div>
                      {context.state.outputVolume}
                    </div>
                </Menu.Item>

                {/** Scale Menu **/}
                <Menu.Item className="vert">
                  <div className="menu-header">Scales</div>
                  <Menu.Menu className="horiz">

                    <Menu.Item>
                      <Dropdown
                      fluid
                      text='Key'
                      options={keyOptions}
                      onChange={context.handleKeyChange}
                      disabled={!context.state.isStarted}
                      >
                      </Dropdown>
                    </Menu.Item>
                    <Menu.Item>
                      <Dropdown
                      text='#/b'
                      compact
                      options={accidentalOptions}
                      onChange={context.handleAccidentalChange}
                      disabled={!context.state.isStarted}/>
                    </Menu.Item>
                    <Menu.Item>
                      <Dropdown
                      text='Scale'
                      compact
                      options={scaleOptions}
                      onChange={context.handleScaleChange}
                      disabled={!context.state.isStarted}/>
                    </Menu.Item>

                  </Menu.Menu>

                  <div>
                  {context.state.musicKey.name}{context.state.accidental.name}{context.state.scale.name}
                  </div>
                </Menu.Item>


              </Menu>
              <div className="tuning-close-menu">
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

export default TuningControls;
