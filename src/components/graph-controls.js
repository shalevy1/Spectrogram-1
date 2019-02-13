import React, {Component} from 'react';
import {Button, Icon, Form, Segment, Menu, Input, Radio} from 'semantic-ui-react';
import {MyContext} from './my-provider';

import "../styles/graph-controls.css";
import 'rc-slider/assets/index.css';

import Range from 'rc-slider/lib/Range';

// Class the renders the Scale Controls when the button is pushed
class GraphControls extends Component {
  render(){
    return (
      <MyContext.Consumer>
        {(context) => (
          <React.Fragment>
            <Segment className="menu-pane-container compact graph-container">
              <Menu compact>
                <Menu.Item className="vert graph-limit-container">
                  <div className="multi-slider-container">
                  <div className="menu-header">
                  Graph Limits
                  </div>
                  <Range
                  allowCross={false}
                  defaultValue={[31, 99]}
                  min={1}
                  max={100}
                  value={[context.state.limitMin, context.state.limitMax]}
                  className="multi-slider"
                  disabled={!context.state.isStarted}
                  onChange={context.handleRangeChange}/>
                  <br></br>
                  <div>
                  <Form onKeyPress={context.handleInputChange} className="resolution-container">
                  <Form.Field className="resolution-input">
                  <Input value={context.state.min} disabled={!context.state.isStarted} onChange={context.handleMinChange} maxLength="6"/>
                  </Form.Field>
                  -
                  <Form.Field className="resolution-input">
                  <Input value={context.state.max} disabled={!context.state.isStarted} onChange={context.handleMaxChange} maxLength="6"/>
                  </Form.Field>
                  </Form>
                  </div>
                  </div>
                </Menu.Item>
                {/** Graph Presets **/}
                <Menu.Item className="vert">
                <div className="menu-header">
                Graph Presets
                </div>
                <br></br>
                <div className="graph-preset-container">
                  <Radio
                    label='Full Scale'
                    name='radioGroup'
                    value='default'
                    checked={context.state.graphPreset === 'default'}
                    onChange={context.handleGraphPresetChange}
                  />
                  <Radio
                    label='Alto'
                    name='radioGroup'
                    value='alto'
                    checked={context.state.graphPreset === 'alto'}
                    onChange={context.handleGraphPresetChange}
                  />
                  <Radio
                    label='Bass'
                    name='radioGroup'
                    value='bass'
                    checked={context.state.graphPreset === 'bass'}
                    onChange={context.handleGraphPresetChange}
                  />
                  <Radio
                  label='Soprano'
                  name='radioGroup'
                  value='soprano'
                  checked={context.state.graphPreset === 'soprano'}
                  onChange={context.handleGraphPresetChange}
                  />
                  <Radio
                  label='Tenor'
                  name='radioGroup'
                  value='tenor'
                  checked={context.state.graphPreset === 'tenor'}
                  onChange={context.handleGraphPresetChange}
                  />
                  <Radio
                    label='Orchestra'
                    name='radioGroup'
                    value='orchestra'
                    checked={context.state.graphPreset === 'orchestra'}
                    onChange={context.handleGraphPresetChange}
                  />
                  <Radio
                    label='Pipes'
                    name='radioGroup'
                    value='pipes'
                    checked={context.state.graphPreset === 'pipes'}
                    onChange={context.handleGraphPresetChange}
                  />
                  </div>
                </Menu.Item>
              </Menu>

              {/* Reset Button */}
              <div className="graph-close-menu">
                <Button icon onClick={this.props.reset} className="icon-button">
                  <Icon fitted name="redo alternate"/>
                </Button>
                {/* Close Menu */}
                <Button icon onClick={this.props.closeMenu} className="icon-button close-menu">
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

export default GraphControls;
