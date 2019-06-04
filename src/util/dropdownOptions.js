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
    text: "Chromatic",
    value: 2
  },
  {
    text: "Blues",
    value: 3
  },
  {
    text: "Flemenco/Harmonic Major",
    value: 4
  },
  {
    text: "Hungarian Minor",
    value: 5
  },
  {
    text: "Major Pentatonic",
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
    text: "Pentatonic 4",
    value: 10
  },
  // {
  //   text: "Major Arp",
  //   value: 11
  // }

];
const keyOptions = [
  {
    text: "C",
    value: 0,
    index: 0,
  },
  {
    text: "C#/Db",
    value: 1,
    index: 1,
  },
  {
    text: "D",
    value: 2,
    index: 2,
  },
  {
    text: "D#/Eb",
    value: 3,
    index: 3,
  },
  {
    text: "E",
    value: 4,
    index: 4,
  },
  {
    text: "F",
    value: 5,
    index: 5,
  },
  {
    text: "F#/Gb",
    value: 6,
    index: 6,
  },
  {
    text: "G",
    value: 7,
    index: 7,
  },
  {
    text: "G#/Ab",
    value: 8,
    index: 8,
  },
  {
    text: "A",
    value: 9,
    index: 9,
  },
  {
    text: "A#/Bb",
    value: 10,
    index: 10,
  },
  {
    text: "B",
    value: 11,
    index: 11,
  },
]
// const accidentalOptions = [
//   {
//     text: " ",
//     value: 0
//   },
//   {
//     text: "# ",
//     value: 1
//   },
//   {
//     text: "b ",
//     value: 2
//   },
// ]

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

export {timbreOptions, scaleOptions, keyOptions, /*accidentalOptions,*/ effectOptions};
