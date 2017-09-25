// Assumes context is an AudioContext defined outside of this class.

Polymer('g-spectrogram', {
  // Show the controls UI.
  controls: false,
  // Log mode.
  log: false,
  // Show axis labels, and how many ticks.
  labels: false,
  ticks: 5,
  speed: 2,
  // FFT bin size,
  fftsize: 2048,
  oscillator: false,
  color: false,
  pause: false,
  resolution: 20000,

  attachedCallback: function() {
    this.tempCanvas = document.createElement('canvas'),
    console.log('Created spectrogram');
    // Get input from the microphone.
    if (navigator.mozGetUserMedia) {
      navigator.mozGetUserMedia({audio: true},
                                this.onStream.bind(this),
                                this.onStreamError.bind(this));
    } else if (navigator.webkitGetUserMedia) {
      navigator.webkitGetUserMedia({audio: true},
                                this.onStream.bind(this),
                                this.onStreamError.bind(this));
    }
    this.ctx = this.$.canvas.getContext('2d');
  },

  render: function() {
    //console.log('Render');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    var didResize = false;
    // Ensure dimensions are accurate.
    if (this.$.canvas.width != this.width) {
      this.$.canvas.width = this.width;
      this.$.labels.width = this.width;
      didResize = true;
    }
    if (this.$.canvas.height != this.height) {
      this.$.canvas.height = this.height;
      this.$.labels.height = this.height;
      didResize = true;
    }

    //this.renderTimeDomain();
    this.renderFreqDomain();

    if (this.labels && didResize) {
      this.renderAxesLabels();
    }

    requestAnimationFrame(this.render.bind(this));

    var now = new Date();
    if (this.lastRenderTime_) {
      this.instantaneousFPS = now - this.lastRenderTime_;
    }
    this.lastRenderTime_ = now;
  },

  renderTimeDomain: function() {
    var times = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(times);

    for (var i = 0; i < times.length; i++) {
      var value = times[i];
      var percent = value / 256;
      var barHeight = this.height * percent;
      var offset = this.height - barHeight - 1;
      var barWidth = this.width/times.length;
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(i * barWidth, offset, 1, 1);
    }
  },

  renderFreqDomain: function() {
    var freq = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(freq);

    var ctx = this.ctx;
    // Copy the current canvas onto the temp canvas.
    this.tempCanvas.width = this.width;
    this.tempCanvas.height = this.height;
    //console.log(this.$.canvas.height, this.tempCanvas.height);
    var tempCtx = this.tempCanvas.getContext('2d');
    tempCtx.drawImage(this.$.canvas, 0, 0, this.width, this.height);

    // Iterate over the frequencies.
    for (var i = 0; i < freq.length; i++) {
      var value;
      // Draw each pixel with the specific color.
      if (this.log) {
        logIndex = this.logScale(i, freq.length);
        value = freq[logIndex];

      } else {
        value = freq[i];
      }

      ctx.fillStyle = (this.color ? this.getFullColor(value) : this.getGrayColor(value));

      var percent = i / freq.length;
      var y = Math.round(percent * this.height);


      // draw the line at the right side of the canvas
      ctx.fillRect(this.width - this.speed, this.height - y,
                   this.speed, this.speed);
    }

    // Translate the canvas.
    ctx.translate(-this.speed, 0);
    // Draw the copied image.
    ctx.drawImage(this.tempCanvas, 0, 0, this.width, this.height,
                  0, 0, this.width, this.height);

    // Reset the transformation matrix.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  },

  /**
   * Given an index and the total number of entries, return the
   * log-scaled value.
   */
  logScale: function(index, total, opt_base) {
    var base = opt_base || 2;
    var logmax = this.logBase(total + 1, base);
    var exp = logmax * index / total;
    return Math.round(Math.pow(base, exp) - 1);
  },

  logBase: function(val, base) {
    return Math.log(val) / Math.log(base);
  },

  renderAxesLabels: function() {
    var canvas = this.$.labels;
    canvas.width = this.width;
    canvas.height = this.height;
    var ctx = canvas.getContext('2d');
    var startFreq = 440;
    var nyquist = context.sampleRate/2;
    // nyquist = this.resolution;
    var endFreq = nyquist - startFreq;
    // endFreq = 22000;
    startFreq = 10;

    var step = (endFreq - startFreq) / this.ticks;
    // step=3000;
    var yLabelOffset = 5;
    // Render the vertical frequency axis.
    for (var i = 0; i <= this.ticks; i++) {
      var freq = startFreq + (step * i);
      // Get the y coordinate from the current label.
      var index = this.freqToIndex(freq);

      var percent = index / this.getFFTBinCount();
      // var y = (1-percent) * this.height;
      var y = (1-percent) * 591;

      var x = this.width - 60;
      // Get the value for the current y coordinate.
      var label;
      if (this.log) {
        // Handle a logarithmic scale.
        var logIndex = this.logScale(index, this.getFFTBinCount());
        // Never show 0 Hz.
        freq = Math.max(1, this.indexToFreq(logIndex));

      }
      var label = this.formatFreq(freq);
      var units = this.formatUnits(freq);
      ctx.font = '16px Inconsolata';
      // Draw the value.
      ctx.textAlign = 'right';
      ctx.fillText(label, x, y + yLabelOffset);
      // Draw the units.
      ctx.textAlign = 'left';
      ctx.fillText(units, x + 10, y + yLabelOffset);
      // Draw a tick mark.
      ctx.fillRect(x + 40, y, 30, 2);
    }
  },

  clearAxesLabels: function() {
    var canvas = this.$.labels;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);
  },

  formatFreq: function(freq) {
    return (freq >= 1000 ? (freq/1000).toFixed(1) : Math.round(freq));
  },

  formatUnits: function(freq) {
    return (freq >= 1000 ? 'KHz' : 'Hz');
  },

  indexToFreq: function(index) {
    var nyquist = context.sampleRate/2;
    nyquist = this.resolution;
    return nyquist/this.getFFTBinCount() * index;
  },

  freqToIndex: function(frequency) {
    var nyquist = context.sampleRate/2;
    return Math.round(frequency/nyquist * this.getFFTBinCount());
  },

  getFFTBinCount: function() {
    return this.fftsize / 2;
  },

  onStream: function(stream) {
    var input = context.createMediaStreamSource(stream);
    var analyser = context.createAnalyser();

    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0;
    // analyser.fftSize = this.fftsize;
    var fftSize = 8192;
    analyser.fftSize = fftSize;

    // Connect graph.
    input.connect(analyser);

    this.analyser = analyser;
    // Setup a timer to visualize some stuff.
    this.render();
  },

  onStreamError: function(e) {
    console.error(e);
  },

  getGrayColor: function(value) {
    var fromH = 235;
    var toH = 1;
    var percent = value / 255;
    var delta = percent * (toH - fromH);
    var hue = fromH + delta;



    // if(hue<50) {
      // hue = 1;
    // }
    // var hue = value/100;
    // console.log(value);
    // var x = value / 100;
    // x = x * 235;


    // if(hue < 100 && hue > 500) {
      // console.log("HUE: "+hue);
    // }
    // console.log("VALUE: "+value);
    // return 'rgb(255, 255, 0)';
    // var x = this.logScale_(hue, 235);
    // return 'rgb(V, V, V)'.replace(/V/g, 255 - value);
    //

    // Test Max
    if(value ==255) {
      console.log("MAX!");
    }

    // if(value > 265) {
    //   return 'hs1(310, 100%, 50%)';
    // } else {
    return 'hsl(H, 100%, 50%)'.replace(/H/g, 275-value);
    // }

  },

  getFullColor: function(value) {
    var fromH = 62;
    var toH = 0;
    var percent = value / 255;
    var delta = percent * (toH - fromH);
    var hue = fromH + delta;
    return 'hsl(H, 100%, 50%)'.replace(/H/g, hue);
  },

  logScale_: function(index, total, opt_base) {
    var base = opt_base || 2;
    var logmax = this.logBase(total + 1, base);
    // console.log("LOGMAX: "+logmax);
    var exp = logmax * index / total;
    return Math.pow(base, exp) - 1;
  },

  logChanged: function() {
    if (this.labels) {
      this.renderAxesLabels();
    }
  },

  resolutionChanged: function() {
    if(this.labels){
      this.renderAxesLabels();
    }
  },

  pauseChanged: function() {
    var saveSpeed = 2;
    if(this.speed!=0) {
      saveSpeed = this.speed;
      this.speed = 0;

    } else {
      this.speed = saveSpeed;
    }

  },

  ticksChanged: function() {
    if (this.labels) {
      this.renderAxesLabels();
    }
  },

  labelsChanged: function() {
    if (this.labels) {
      this.renderAxesLabels();
    } else {
      this.clearAxesLabels();
    }
  }
});
