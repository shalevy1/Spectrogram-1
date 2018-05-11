import React, {Component} from 'react';
import generateScale from '../util/generateScale';

class NoteLines extends Component {

  constructor(props) {
    super(props);
    this.state = {
      yLabelOffset: 5,
      ticks: 5
    }
  }

  componentDidMount() {
    this.ctx = this.canvas.getContext('2d');
    window.addEventListener("resize", this.handleResize);
    this.renderNoteLines();

  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () => {
    this.props.handleResize();
    this.renderNoteLines();
  }

  renderNoteLines = () => {
    let {height, width} = this.props;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = 'white';

    //  Maps to one of the 12 keys of the piano based on note and accidental
    let newIndexedKey = this.props.musicKey.value;
    // Edge cases
    if (newIndexedKey === 0 && this.props.accidental.value === 2) {
      // Cb->B
      newIndexedKey = 11;
    } else if (newIndexedKey === 11 && this.props.accidental.value === 1) {
      // B#->C
      newIndexedKey = 0;
    } else {
      newIndexedKey = (this.props.accidental.value === 1)
        ? newIndexedKey + 1
        : (this.props.accidental.value === 2)
          ? newIndexedKey - 1
          : newIndexedKey;
    }

    // Uses generateScale helper method to generate base frequency values
    let s = generateScale(newIndexedKey, this.props.scale.value);
    //Sweeps through scale object and draws frequency
    for (let i = 0; i < s.scale.length; i++) {
      let freq = s.scale[i];

      for (let j = 0; j < 15; j++) {
        if (freq > this.props.resolutionMax) {

          break;
        } else {
          let index = this.freqToIndex(freq);
          this.ctx.fillRect(0, index, width, 2);
          freq = freq * 2;
        }
      }
    }

  }

  

  freqToIndex(freq) {
    let logResolution = Math.log(this.props.resolutionMax / this.props.resolutionMin);
    let x = Math.log(freq / this.props.resolutionMin) / logResolution;

    // console.log(x*100);
    if (!isNaN(x)) {
      return (1 - x) * this.props.height;
    }
    return 0;
  }
  render() {
    return (<canvas width={this.props.width} height={this.props.height} ref={(c) => {
      this.canvas = c;
    }}/>);
  }
}
export default NoteLines;
