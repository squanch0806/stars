let handPose;
let video;
let hands = [];

const THUMB_TIP = 4;
const INDEX_FINGER_TIP = 8;

// Matter.js 
const {Engine, Body, Bodies, Composite, Composites, Constraint, Vector} = Matter;
let engine;
let bridge; let num = 8; let radius = 10; let length = 25;
let stars = [];

let maxStars = 50; 

let isTossing = false;
let frameSkip = 0;

function preload() {
  // Load the handPose model
  handPose = ml5.handPose({maxHands: 1, flipped: true});
}


function setup() {
  createCanvas(800, 600);
  video = createCapture(VIDEO, {flipped: true});
  video.size(800, 600);
  video.hide();
  handPose.detectStart(video, gotHands);
  
  engine = Engine.create();
  engine.gravity.scale = 0.001; // 减小重力影响
  bridge = new Bridge(num, radius, length);
}

function draw() {
  frameSkip++;
  if (frameSkip % 2 !== 0) return;
  
  background(220);
  Engine.update(engine);
  strokeWeight(2);
  stroke(0);
  
  image(video, 0, 0, width, height);
  
  if (random() < 0.07 && stars.length < maxStars) { 
    stars.push(new Star());
  }
  
  // 处理手势和绳子
  if (hands.length > 0) {
    let thumb = hands[0].keypoints[THUMB_TIP];
    let index = hands[0].keypoints[INDEX_FINGER_TIP];
    
    bridge.updateEndPoints(thumb, index);
    
    fill(67, 56, 202); 
    noStroke();
    circle(thumb.x, thumb.y, 12);
    circle(index.x, index.y, 12);
    
    fill(255, 215, 0); // 金色
    circle(thumb.x, thumb.y, 6);
    circle(index.x, index.y, 6);
  }
  
  bridge.display();
  
  for (let i=stars.length-1; i>=0; i--) {
    stars[i].checkDone();
    stars[i].display();
    
    if (stars[i].done) {
      stars[i].removeCircle();
      stars.splice(i, 1);
    }
  }
  

}

// Callback function for when handPose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}


function keyPressed() {

  if (key === ' ' && !isTossing) {
    isTossing = true;
    
    // 添加闪光效果
    background(255, 240, 180, 150);
    
    // 将所有星星向上抛
    stars.forEach(star => {
      star.toss();
    });
    
    // 延时重置状态
    setTimeout(() => {
      isTossing = false;
    }, 2000);
  }
}
