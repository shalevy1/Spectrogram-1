Polymer('g-spectrogram-controls', {
  log: false,
  labels: true,
  ticks: 5,
  pause: false,
  gain: 3,
  resolutionMax: 20000,
  resolutionMin: 100,

  created: function() {
    console.log('Created spectrogram controls');
  }
});
