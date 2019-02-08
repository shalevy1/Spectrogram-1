const timbreOptions = [
  {
  text: "Sine",
  value: 0,
  image: {src: './images/sine.png'}
  },
  {
  text: "Square",
  value: 1,
  image: {src: './images/square.png'}
  },
  {
  text: "Sawtooth",
  value: 2,
  image: {src: './images/saw.png'}
  },
  {
  text: "Triangle",
  value: 3,
  image: {src: './images/triangle.png'}
  },
];

const scaleOptions = [
  {
    text: "Major",
    value: 0
  },
  {
    text: "Minor",
    value: 1
  },
  {
    text: "Major Pentatonic",
    value: 2
  },
  {
    text: "Chromatic",
    value: 3
  },
  {
    text: "Blues",
    value: 4
  },
  {
    text: "Flemenco/Harmonic Major",
    value: 5
  },
  {
    text: "Hungarian Minor",
    value: 6
  },
  {
    text: "Pentatonic 2",
    value: 7
  },
  {
    text: "Pentatonic 3",
    value: 8
  },
  {
    text: "Pentatonic 4",
    value: 9
  },
  {
    text: "Mondongo",
    value: 10
  }

];
const keyOptions = [
  {
    text: "C",
    value: 0,
    index: 0
  },
  {
    text: "D",
    value: 1,
    index: 2
  },
  {
    text: "E",
    value: 2,
    index: 4
  },
  {
    text: "F",
    value: 3,
    index: 5
  },
  {
    text: "G",
    value: 4,
    index: 7
  },
  {
    text: "A",
    value: 5,
    index: 9
  },
  {
    text: "B",
    value: 6,
    index: 11
  },
]
const accidentalOptions = [
  {
    text: " ",
    value: 0
  },
  {
    text: "# ",
    value: 1
  },
  {
    text: "b ",
    value: 2
  },
]

const effectOptions = [
  {
    text: "Reverb",
    value: "Reverb",
  },
  {
    text: "Delay",
    value: "Delay",
  },
  {
    text: "Amplitude Modulation",
    value: "Amplitude Modulation",
  },
  {
    text: "Frequency Modulation",
    value: "Frequency Modulation",
  }

]

export {timbreOptions, scaleOptions, keyOptions, accidentalOptions, effectOptions};
