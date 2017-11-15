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
  show1: false,
  show2: false,
  label: "Sound Off",
  sound: 0,

  created: function() {
    console.log('Created spectrogram controls');
  },

  clickAction1: function(e) {
    var t = e.target;
    if (this.show1) {
      t.children[0].classList.remove("up");
      t.children[0].classList.add("down");
      this.show1 = false;
    } else {
      t.children[0].classList.remove("down");
      t.children[0].classList.add("up");
      this.show1 = true;
    }

  },

  clickAction2: function(e) {
    var t = e.target;
    if (this.show2) {
      t.children[0].classList.remove("up");
      t.children[0].classList.add("down");
      this.show2 = false;
    } else {
      t.children[0].classList.remove("down");
      t.children[0].classList.add("up");
      this.show2 = true;
    }

  },

  soundToggle: function(e) {
    var t = e.target;
    t.classList.toggle("green");
    if (this.label === "Sound Off") {
      this.label = "Sound On!";
      this.sound = 1;
    } else {
      this.label = "Sound Off";
      this.sound = 0;
    }

  }

});
