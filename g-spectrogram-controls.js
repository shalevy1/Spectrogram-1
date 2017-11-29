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
  fadeInTime: 10,
  fadeOutTime: 40,
  show1: false,
  show2: false,
  label: "Sound Off",
  sound: 0,
  timbre: 0,
  outputVolume: 50,
  currentScale: 0,
  currentMode: 0,
  headphoneMode: false,

  created: function() {
    console.log('Created spectrogram controls');
  },

  clickAction1: function(e) {
    var t = e.target;
    if(t.classList.contains('arrow')){
      if (this.show1) {
        t.classList.remove("up");
        t.classList.add("down");
        this.show1 = false;
      } else {
        t.classList.remove("down");
        t.classList.add("up");
        this.show1 = true;
      }
    } else if (this.show1) {
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
    if(t.classList.contains('arrow')){
      if (this.show2) {
        t.classList.remove("up");
        t.classList.add("down");
        this.show2 = false;
      } else {
        t.classList.remove("down");
        t.classList.add("up");
        this.show2 = true;
      }
    } else if (this.show2) {
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

  },

  timbreSelect: function(e) {
    var t = e.target;
    // t.classList.toggle('selected')
    // console.log(t.parentNode)
    var picsContainer = t.parentNode.parentNode;
    var picsChildren = picsContainer.children;
    for(var i=1; i<5; i++){
      var child = picsChildren[i];
      if(child!=t.parentNode){
        if(child){
          child.children[0].classList.remove('selected');
        }
      } else {
        child.children[0].classList.add('selected');
        this.timbre = i-1;
      }

    }
  },

  reset: function(e){
    this.log= true;
    this.pause= false;
    this.gain= 6;
    this.resolutionMax= 20000;
    this.resolutionMin= 20;
    this.square= false;
    this.scale= false;
    this.fadeInTime= 10;
    this.fadeOutTime= 40;
    this.timbre= 0;
    this.outputVolume= 50;
    this.currentScale= 0;
    this.currentMode= 0;
  }

});
