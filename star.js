class Star {
  constructor(imageIndex = 0) {
    let x = width/2;
    let y = 40;
    
    // 调整大小范围，使图像更明显
    let sizeCategory = random();
    if (sizeCategory < 0.70) {
      this.r = random(30, 35); // 增加最小尺寸
    } else if (sizeCategory < 0.98) {
      this.r = random(35, 40); // 调整中等尺寸
    } else {
      this.r = random(40, 45); // 增加最大尺寸
    }
    
    // 使用指定的图像索引
    this.img = starImages[imageIndex];
    
    this.done = false;
    
    // 创建物理引擎中的圆形物体，增加弹性
    this.body = Bodies.circle(x, y, this.r, {
      restitution: 0.9, // 增加弹性
      friction: 0.01,   // 减少摩擦
      density: 0.001    // 减小密度，使其更容易被弹走
    });
    let velocity = Vector.create(random(-0.3, 0.3), random(0.2, 0.5));
    Body.setVelocity(this.body, velocity);
    Composite.add(engine.world, this.body);
    
    this.lastCollisionTime = 0;
    this.collisionForce = 0;
    
    // 添加旋转效果
    this.rotationSpeed = random(-0.03, 0.03);
  }
  
  display() {
    push();
    translate(this.body.position.x, this.body.position.y);
    
    // 应用物理引擎的旋转
    rotate(this.body.angle);
    
    // 应用挤压效果
    let squash = this.getExtremeSquash();
    scale(squash.x, squash.y);
    
    // 移除发光效果
    // drawingContext.shadowBlur = this.r;
    // drawingContext.shadowColor = "#FFD700";
    
    // 绘制emo图片
    imageMode(CENTER);
    image(this.img, 0, 0, this.r * 2, this.r * 2);
    
    pop();
    
    // 添加一点旋转效果
    Body.setAngularVelocity(this.body, this.rotationSpeed);
  }
  
  getExtremeSquash() {
    let baseX = 1.0;
    let baseY = 1.0;
    
    let jellyEffect = this.getJellySquash();
    
    return {
      x: baseX * jellyEffect.x,
      y: baseY * jellyEffect.y
    };
  }
  
  getJellySquash() {
    if (this.collisionForce === 0) return {x: 1, y: 1};
    
    let timeSince = millis() - this.lastCollisionTime;
    let recovery = constrain(timeSince / 250, 0, 1);
    
    let jellyPhase;
    if (recovery < 0.3) {
      jellyPhase = recovery / 0.3;
      let squashX = lerp(1.0, 1.4, jellyPhase);
      let squashY = lerp(1.0, 0.6, jellyPhase);
      return {x: squashX, y: squashY};
      
    } else if (recovery < 0.7) {
      jellyPhase = (recovery - 0.3) / 0.4;
      let stretchX = lerp(1.4, 0.8, jellyPhase);
      let stretchY = lerp(0.6, 1.3, jellyPhase);
      return {x: stretchX, y: stretchY};
      
    } else {
      jellyPhase = (recovery - 0.7) / 0.3;
      let finalX = lerp(0.8, 1.0, jellyPhase);
      let finalY = lerp(1.3, 1.0, jellyPhase);
      
      if (recovery >= 1.0) this.collisionForce = 0;
      return {x: finalX, y: finalY};
    }
  }
  
  checkDone() {
    let speed = Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.y ** 2);
    if (speed > 3) {
      this.lastCollisionTime = millis();
      this.collisionForce = constrain(speed / 4, 0.5, 2.0);
    }
    
    let pos = this.body.position;
    // 一旦图像离开屏幕，就将其标记为done，并且不会再改变状态
    if (!this.done && (pos.y > height + this.r * 2 || pos.x < -this.r * 2 || pos.x > width + this.r * 2 || pos.y < -height)) {
      this.done = true;
      console.log("图像离开屏幕，准备生成下一个");
    }
  }
  
  toss() {
    // 增强抛投力度，使其更容易被弹走
    let force = Vector.create(random(-0.05, 0.05), random(-0.12, -0.06));
    Body.applyForce(this.body, this.body.position, force);
    
    // 增加旋转
    this.rotationSpeed = random(-0.06, 0.06);
  }
  
  removeCircle() {
    Composite.remove(engine.world, this.body);
  }
} 