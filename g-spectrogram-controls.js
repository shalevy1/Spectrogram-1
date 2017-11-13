Polymer('g-spectrogram-controls', {
  log: false,
  labels: true,
  ticks: 5,
  pause: false,
  gain: 3,
  resolutionMax: 20000,
  resolutionMin: 20,
  square: false,
  scale: false,
  scaleChoice: 0,
  fadeInTime: 10,
  fadeOutTime: 10,
  reset: false,

    // console.log("RESET")
    // this.log= false;
    // this.labels= true;
    // this.ticks= 5;
    // this.pause= false;
    // this.gain= 3;
    // this.resolutionMax= 20000;
    // this.resolutionMin= 20;
    // this.square= false;
    // this.scale=false;
    // this.scaleChoice= 0;
    // this.fadeInTime= 10;
    // this.fadeOutTime= 10;
  // },

  created: function() {
    console.log('Created spectrogram controls');
  },

  resetChanged: function() {
    console.log("CHANGED");
  }

});
