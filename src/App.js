import React, { Component } from 'react';
import './App.css';
import SpectrogramContainer from './components/spectrogram-container';
import { BrowserRouter as Router, Route } from "react-router-dom";
import { spring, AnimatedSwitch } from 'react-router-transition';

function SignalGenerator(props){
  return "Signal Generator";
}



class App extends Component {
  render() {
    return (
      <div className="App">
        <Router>
            {/* <SpectrogramContainer />         */}
            <Route path="/" exact component={SpectrogramContainer} />
            <Route path="/SignalGenerator/" component={SignalGenerator} />
        </Router>
      </div>
    )
  }
}
export default App;
