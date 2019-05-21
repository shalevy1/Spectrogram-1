import React, {Component} from 'react';

// import {Checkbox} from 'semantic-ui-react';
// import { Button } from 'semantic-ui-react';
import "../styles/effect-module.css";
import Slider from 'react-rangeslider';
// To include the default styles
import 'react-rangeslider/lib/index.css';

// Class that renderes the effects. Each module has a toggle and controls
class EffectModule extends Component {

  render(){
    return(
          <div className="effect-module">
            <div className="effect-controls">
              {/* <div className="effect-on">
              <Button
              toggle
              active={this.props.toggle}
              onClick={this.props.toggleChange}
              disabled={this.props.disable}
              >{this.props.name}</Button>
              </div> */}
            <div>&nbsp;</div>
            <div style={{textAlign: "center", marginBottom: "8px" }}><u>{this.props.name}</u></div>
            {this.props.controlNames.map((name, index) =>(
              <div className="effect-control" key={index}>
                <p id="text">&nbsp;&nbsp;&nbsp;{name}:</p>
                <Slider
                min={0}
                max={1}
                step={0.05}
                value={this.props.controls[index]}
                onChange={this.props.controlChanges[index]}
                tooltip={!this.props.disable}
                className="slider"
                >
                </Slider>
              </div>
            ))}
            </div>

          </div>
    )
  }
}
export default EffectModule;
