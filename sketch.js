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
// 当前使用的图像索引
let currentImageIndex = 0;
// 已经生成的图像数量
let generatedCount = 0;
// 一组的图像数量
let groupSize = 8;
// 是否完成了一组
let groupCompleted = false;

let isTossing = false;
let frameSkip = 0;

// 添加图片数组
let starImages = [];

// 重来按钮
let restartButton;

function preload() {
  // Load the handPose model
  handPose = ml5.handPose({maxHands: 1, flipped: true});
  
  // 预加载8个PNG图片
  try {
    for (let i = 1; i <= 8; i++) {
      starImages[i-1] = loadImage(`images/${i}.png`, 
        // 成功加载时的回调
        () => console.log(`成功加载图片${i}.png`), 
        // 加载失败时的回调
        () => {
          console.error(`无法加载图片${i}.png，使用默认图像`);
          starImages[i-1] = createDefaultStar(100, 100);
        }
      );
    }
  } catch (e) {
    console.error('加载图片时出错:', e);
    // 创建默认星星图像
    for (let i = 0; i < 8; i++) {
      starImages[i] = createDefaultStar(100, 100);
    }
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
  
  // 创建重来按钮
  restartButton = createButton('重来');
  restartButton.position(width - 80, 20);
  restartButton.size(60, 30);
  restartButton.style('background-color', '#4CAF50');
  restartButton.style('color', 'white');
  restartButton.style('border', 'none');
  restartButton.style('border-radius', '5px');
  restartButton.style('font-size', '16px');
  restartButton.style('cursor', 'pointer');
  restartButton.mousePressed(restartGame);
  
  // 确保在开始时就有一个图像
  setTimeout(() => {
    if (stars.length === 0 && shouldCreateNewEmo) {
      createNewStar();
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
  
  // 检查是否需要创建新的图像
  if (shouldCreateNewEmo && stars.length < maxStars && !groupCompleted) { 
    createNewStar();
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
      // 当图像被弹出屏幕后，允许创建新的图像
      shouldCreateNewEmo = true;
    }
  }
  
  // 显示进度信息
  displayProgress();
}

// 创建新的星星
function createNewStar() {
  stars.push(new Star(currentImageIndex));
  shouldCreateNewEmo = false; // 创建后设置为false，等待当前图像被弹出屏幕
  
  // 更新计数和索引
  generatedCount++;
  currentImageIndex = (currentImageIndex + 1) % starImages.length;
  
  // 检查是否完成了一组
  if (generatedCount >= groupSize) {
    groupCompleted = true;
    console.log("一组图像已全部生成");
  }
}

// 显示进度信息
function displayProgress() {
  fill(0);
  noStroke();
  textSize(16);
  textAlign(LEFT, TOP);
  text(`当前: ${generatedCount}/${groupSize}`, 20, 20);
  
  if (groupCompleted) {
    textAlign(CENTER, CENTER);
    textSize(24);
    text("一组图像已全部完成，点击"重来"按钮重新开始", width/2, 50);
  }
}

// 重启游戏
function restartGame() {
  // 移除所有现有的星星
  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].removeCircle();
    stars.splice(i, 1);
  }
  
  // 重置计数器和状态
  currentImageIndex = 0;
  generatedCount = 0;
  shouldCreateNewEmo = true;
  groupCompleted = false;
  
  console.log("游戏已重启");
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
    
    // 将所有图像向上抛
    stars.forEach(star => {
      star.toss();
    });
    
    // 延时重置状态
    setTimeout(() => {
      isTossing = false;
    }, 2000);
  }
}
