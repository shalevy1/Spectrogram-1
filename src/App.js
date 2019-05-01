import React, { Component } from 'react';
import './App.css';
import SpectrogramContainer from './components/spectrogram-container';
import { BrowserRouter as Router, Route } from "react-router-dom";
import { spring, AnimatedSwitch } from 'react-router-transition';

function SignalGenerator(props){
  return "Signal Generator";
}

const pageTransitions = {
  atEnter: {
    offset: 200,
    opacity: 0,
  },
  atLeave: {
    offset: glide(-100),
    opacity: glide(0),
  },
  atActive: {
    offset: glide(0),
    opacity: glide(1),
  },
};

function mapStyles(styles) {
  return {
    opacity: styles.opacity,
    transform: `translateX(${styles.offset}px)`,
    height: "100vh"
  };
}

function glide(val) {
  return spring(val, {
    stiffness: 174,
    damping: 19,
  });
}


class App extends Component {
  render() {
    return (
      <div className="App">
        <Router>
          <AnimatedSwitch
          {...pageTransitions}
          mapStyles={mapStyles}
          className="switch-wrapper">
            {/* <SpectrogramContainer />         */}
            <Route path="/" exact component={SpectrogramContainer} />
            <Route path="/SignalGenerator/" component={SignalGenerator} />
          </AnimatedSwitch>
        </Router>
      </div>
    )
  }
}
export default App;
