/**
* name: generateScale
* params: startFreq: currentFreq to snap, type: which scale
*/
export default function generateScale(startFreq, type, justIntonation) {
  var scaleNames = [];
  var scale = [];
  var scalePattern = [];
  var tuning = 440;
  var tuning_ = tuning / 32;
  var notes = ['A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab'];
  // Formate Key so that 'C' is first key instead of 'A'
  startFreq = (startFreq + 3)%12;
  switch (type) {
    case 0:
      // Major
      scalePattern = [0, 2, 4, 5, 7, 9, 11];
      break;
    case 1:
      // Minor
      scalePattern = [0, 2, 3, 5, 7, 8, 10];
      break;
    case 2:
      // Chromatic
      scalePattern = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      break;
    case 3:
      //Blues
      scalePattern = [0, 3, 5, 6, 7, 10];
      break;
    case 4:
      // Flemenco/Harmonic Major
      scalePattern = [0, 1, 4, 5, 7, 8, 10];
      break;
    case 5:
      // Hungarian Minor
      scalePattern = [0, 2, 3, 6, 7, 8, 11];
      break;
    case 6:
      // Major Pentatonic
      scalePattern = [0, 2, 4, 7, 9];
      break;
    // case 7:
    //   // Heptatonic 1
    //   scalePattern = [0, 1, 4, 5, 7, 8, 11];
    //   break;
    // case 8:
    //   // Heptatonic 2
    //   scalePattern = [0, 2, 4, 5, 7, 8, 10];
    //   break;
    // case 9:
    //   // Heptatonic 3
    //   scalePattern = [0, 2, 3, 5, 7, 9, 10];
    //   break;
    // case 10:
    //   // Heptatonic 4
    //   scalePattern = [0, 2, 3, 6, 7, 9, 10];
    //   break;
    // case 11:
    //   // Heptatonic 5
    //   scalePattern = [0, 1, 3, 5, 7, 8, 10];
    //   break;
    // case 12:
    //   // Heptatonic 6
    //   scalePattern = [0, 2, 4, 5, 7, 9, 10];
    //   break;
    // case 13:
    //   // Hexatonic 1
    //   scalePattern = [0, 2, 3, 5, 7, 8];
    //   break;
    // case 14:
    //   // Hexatonic 2
    //   scalePattern = [0, 1, 3, 5, 7, 8];
    //   break;
    // case 15:
    //   // Hexatonic 3
    //   scalePattern = [0, 2, 3, 6, 7, 8];
    //   break;
    // case 16:
    //   // Hexatonic 4
    //   scalePattern = [0, 2, 3, 5, 7, 9];
    //   break;
    // case 17:
    //   // Hexatonic 5
    //   scalePattern = [0, 1, 4, 5, 7, 8];
    //   break;
    // case 18:
    //   // Hexatonic 6
    //   scalePattern = [0, 2, 4, 6, 7, 10];
    //   break;
    case 7:
      // Minor Pentatonic
      scalePattern = [0, 2, 3, 7, 10];
      break;
    case 8:
      // Pentatonic 2
      scalePattern = [0, 4, 5, 7, 11];
      break;
    case 9:
      // Pentatonic 3
      scalePattern = [0, 5, 7, 8, 10];
      break;
    case 10:
      // Pentatonic 4
      scalePattern = [0, 1, 5, 7, 10];
      break;
    case 11:
      //mondongo
      scalePattern = [0, 4, 5, 6, 8, 10];
      break;
    case 12:
      // Arp
      scalePattern = [0, 4, 7];
      break;
    default:
      //scalePattern = [0, 2, 4, 5, 7, 9, 11];
      // Custom
      scalePattern = type;

  }

  for (var i = 0; i < scalePattern.length; i++) {
    var currentF = Number(startFreq) + scalePattern[i];
    scale.push(tuning_ * Math.pow(Math.pow(2, 1 / 12), currentF));
    scaleNames.push(notes[currentF % 12]);
  }

  let s = {
    scale: scale, // arr of freqs of the lowest octave
    scaleNames: scaleNames,// arr of names, ex [C. D, ...]
    scalePattern: scalePattern// ex. [0, 2, 4]
  }
  return s;
}
