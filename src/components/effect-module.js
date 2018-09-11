import React, {Component} from 'react';

import {Checkbox} from 'semantic-ui-react';
import "../styles/effect-module.css";
import Slider from 'react-rangeslider';
// To include the default styles
import 'react-rangeslider/lib/index.css';

// Class that renderes the effects. Each module has a toggle and controls
class EffectModule extends Component {

  render(){
    return(
          <div className="effect-module">
            <div className="effect-on">
            On:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <Checkbox
            toggle
            checked={this.props.toggle}
            onChange={this.props.toggleChange}
            disabled={this.props.disable}
            />
            </div>
            <div className="effect-controls">
            {this.props.controlNames.map((name, index) =>(
              <div className="effect-control" key={index}>
                {name}:&nbsp;
                <Slider
                min={0}
                max={1}
                step={0.05}
                value={this.props.controls[index]}
                onChange={this.props.controlChanges[index]}
                tooltip={!this.props.disable}
                className="slider"/>
              </div>
            ))}
            </div>

          </div>
    )
  }
}
export default EffectModule;
