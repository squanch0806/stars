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

// 修改为只允许一个emo图像在屏幕上
let maxStars = 1; 
// 标记是否需要生成新的emo图像
let shouldCreateNewEmo = true;

let isTossing = false;
let frameSkip = 0;

// 添加图片数组
let starImages = [];

function preload() {
  // Load the handPose model
  handPose = ml5.handPose({maxHands: 1, flipped: true});
  
  // 预加载PNG图片 - emo1.png
  try {
    starImages[0] = loadImage('images/emo1.png', 
      // 成功加载时的回调
      () => console.log('成功加载emo1.png'), 
      // 加载失败时的回调
      () => {
        console.error('无法加载emo1.png，使用默认星星');
        starImages[0] = createDefaultStar(100, 100);
      }
    );
    
    // 如果有emo2.png，也加载它
    starImages[1] = loadImage('images/emo2.png',
      () => console.log('成功加载emo2.png'),
      () => {
        console.error('无法加载emo2.png，使用默认星星');
        starImages[1] = createDefaultStar(80, 80);
      }
    );
  } catch (e) {
    console.error('加载图片时出错:', e);
    // 创建默认星星图像
    starImages[0] = createDefaultStar(100, 100);
    starImages[1] = createDefaultStar(80, 80);
  }
}

// 创建默认星星图像的函数
function createDefaultStar(w, h) {
  let pg = createGraphics(w, h);
  pg.clear();
  pg.fill("#FFD700");
  pg.stroke('#FFC300');
  pg.strokeWeight(1);
  
  // 绘制五角星
  pg.translate(w/2, h/2);
  let radius = w/2 - 5;
  let innerRadius = radius * 0.6;
  
  pg.beginShape();
  for (let i = 0; i < 10; i++) {
    let r = (i % 2 === 0) ? radius : innerRadius;
    let angle = TWO_PI / 10 * i - PI/2;
    let x = cos(angle) * r;
    let y = sin(angle) * r;
    pg.vertex(x, y);
  }
  pg.endShape(CLOSE);
  
  return pg;
}

function setup() {
  createCanvas(800, 600);
  video = createCapture(VIDEO, {flipped: true});
  video.size(800, 600);
  video.hide();
  handPose.detectStart(video, gotHands);
  
  engine = Engine.create();
  engine.gravity.scale = 0.0008; // 稍微减小重力影响，使emo图像飘动更自然
  bridge = new Bridge(num, radius, length);
  
  // 确保在开始时就有一个emo图像
  setTimeout(() => {
    if (stars.length === 0 && shouldCreateNewEmo) {
      stars.push(new Star());
      shouldCreateNewEmo = false;
    }
  }, 1000); // 延迟1秒，确保图片已加载
}

function draw() {
  frameSkip++;
  if (frameSkip % 2 !== 0) return;
  
  background(220);
  Engine.update(engine);
  strokeWeight(2);
  stroke(0);
  
  image(video, 0, 0, width, height);
  
  // 检查是否需要创建新的emo图像
  if (shouldCreateNewEmo && stars.length < maxStars) { 
    stars.push(new Star());
    shouldCreateNewEmo = false; // 创建后设置为false，等待当前emo被弹出屏幕
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
      // 当emo被弹出屏幕后，允许创建新的emo
      shouldCreateNewEmo = true;
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
    
    // 添加更明亮的闪光效果
    background(255, 240, 180, 180);
    
    // 将所有emo图像向上抛
    stars.forEach(star => {
      star.toss();
    });
    
    // 延时重置状态
    setTimeout(() => {
      isTossing = false;
    }, 2000);
  }
}
