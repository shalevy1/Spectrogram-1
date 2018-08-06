import React, {Component} from 'react';
import {MyContext} from './my-provider';

import {Checkbox} from 'semantic-ui-react';
import "../styles/effect-module.css";
import Slider from 'react-rangeslider';
// To include the default styles
import 'react-rangeslider/lib/index.css';

class EffectModule extends Component {

  render(){
    return(
          <div className="effect-module">
            <h5>{this.props.name}</h5>
            <div className="effect-on">
            On:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <Checkbox
            toggle
            checked={this.props.toggle}
            onChange={this.props.toggleChange}
            disabled={!this.props.disable}
            />
            </div>
            <div className="effect-on">
              Level:&nbsp;
              <Slider
              min={0}
              max={1}
              step={0.05}
              value={this.props.level}
              onChange={this.props.levelChange}
              tooltip={this.props.disable}
              className="slider"/>
            </div>
          </div>
    )
  }
}
export default EffectModule;
