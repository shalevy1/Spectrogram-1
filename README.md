# Web Spectrogram
An insanely interactive live-input spectrogram with sound creation built in. 

Click [here](https://spectrogram.sciencemusic.org/) to view the live demo. 


![Spectrogram default view](https://lh3.googleusercontent.com/57iLjVbwBOKjZpW-XJ6qe4S9uNAXCqPGH4P8_qnpqsxXODqqTL17dEFAGjssYW6NVuOLzB6p81dv "Spectrogram" )

This project uses your microphone data to plot frequency over time in a moving window graph (The colors indicate the weight of that frequency at that time). You can use the scale controls button to change the y-axis (frequency) of the graph. Besides the graph, the menu allow you to turn the sound on as well as a bevy of new controls (more coming soon...) . Here are the sound making controls: 

![enter image description here](https://lh3.googleusercontent.com/pZTXQ_Yxt6rbPL0v7XeAPRdynsxNMO67jQsu4tPM0qBxW5hwBswF3Em0ezsSvPRo1ccCmZz3fy3M "Spectrogram_Menu")

Once the sound is "On", you can draw on the spectrogram graph using your mouse or touch input to create a sine wave at the frequency specified. You can change volume/amplitude of the sine wave by sweeping left and right. Other controls include timbre choices, a scale mode to snap your notes to a scale, and various effects. There's also a tuning mode packed in to make it easier to tune instruments. 

Square:\
![
](https://lh3.googleusercontent.com/xGo5dNOvAAhOwFu2eUjYHOAEn8GE1l_y1p80ENIRG4HIcsbtPgl7iAqd7JcUZDS33gaW_Kfgropl "Square_Wave")

Sawtooth:\
![
](https://lh3.googleusercontent.com/8qVazrwbPwQ_C44UbO-nO0r5ITF6nEVKcosLHP0PCwr8tX2ZIBWrIfP2dTwhVWCbTGyIqUQbFzgL "Sawtooth Wave")

Triangle:\
![
](https://lh3.googleusercontent.com/DnLepvlCREk4FXiKaHhPb1flFiOer36DWRejN650HAETR-3y5HX-UweyaFPw7E1lXxw2XwJFNfLZ "Triangle_Wave")

Tuning Mode Example (also showing changing the graph limits):\
![
](https://lh3.googleusercontent.com/wkzPuWJbNyl4CV2gcuorc-nF_n4-St8B66KsldDXmR8QBS2Yaz8Ym_bVAGsiwPA_2NMbTdRtv0h7 "Tuning_Mode")

## Installation
To install, simply clone and install using `npm install`. You'll need [Node.js](https://nodejs.org/en/download/). Once installed, to test out the development version, use `npm run start`. 

## Built With

* [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
* [React](https://github.com/facebook/react) 
* [Create-React-App](https://github.com/facebook/create-react-app)
* [Tone.js](https://tonejs.github.io) 
* [SemanticUI](https://react.semantic-ui.com/) 

## Changelog
The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2018-08-15
First Release!
## Added
 - Everything! Spectrogram, Menu, Controls, etc...
## Removed
 - None

## Contributing
We welcome contributors.

## Authors

* **Matthew Rice** - *Web Developer* 
*  **Victor Minces** - *Postdoctoral Researcher at UC San Diego*


## Acknowledgments
This project is inspired from a [Spectrogram](https://borismus.github.io/spectrogram/) by [Boris Smus](https://github.com/borismus)
You can read more about his spectrogram [here](http://smus.com/spectrogram-and-oscillator/)

MIDI Icon by Jonathan Higley from the Noun Project
