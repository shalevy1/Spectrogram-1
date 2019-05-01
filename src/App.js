import React, { Component } from 'react';
import './App.css';
import SpectrogramContainer from './components/spectrogram-container';
import { BrowserRouter as Router, Route } from "react-router-dom";

function SignalGenerator(props){
  return "Signal Generator";
}

class App extends Component {
  render() {
    return (
      <Router>
        <div className="App">
          {/* <SpectrogramContainer />         */}
        <Route path="/" exact component={SpectrogramContainer} />
        <Route path="/SignalGenerator/" component={SignalGenerator} />
        </div>
      </Router>
    )
  }
}
export default App;
