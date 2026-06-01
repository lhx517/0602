// 遊戲狀態：'MENU' (初始介面)、'HOME' (首頁)、'UNIT1' (第一單元)、'UNIT2' (第二單元)、'QUIZ' (總測驗) 或 'CO2' (碳排放小遊戲)
let gameState = 'MENU';

// 下拉選單顯示狀態
let showCarDropdown = false;
let showCourseDropdown = false;

// 第一單元彈窗狀態
let showModal = false;
let modalText = "";
let sdgButtons = []; // 儲存按鈕座標資訊
let cardFlipped = [false, false, false, false]; // 記錄卡牌翻開狀態
let cardAnimationScales = [1, 1, 1, 1]; // 記錄卡牌縮放動畫數值
let cardRotationAngles = [0, 0, 0, 0]; // 記錄卡牌翻轉角度 (0 到 PI)

// 彈窗動畫變數
let pendingModalIndex = -1; // 正在等待翻轉完成的卡牌
let modalScale = 0;
let modalOriginX = 0, modalOriginY = 0;
let modalTimerStart = 0; // 記錄點擊開始計時的時間

// 第二單元吉祥物清單
let mascots = [];

// 碳排放小遊戲變數
let cows = [];
let isAlert = false;

// 第一單元捲動變數
let unit1ScrollY = 0;

// 靜態草原座標
let grassPositions = [];

// 圖片變數
let bgImage;
let bgImageHome;
let bgImageDefault;
let bgImageQuiz;
let waterImg;
let co2Img;
let sdgImg6;
let sdgImg7;
let sdgImg11;
let sdgImg12;
let cowImg;

// 轉場相關變數
let currentBgImg = null;
let lastBgImg = null;
let fadeAmount = 255; // 0-255，255 表示完全顯示目前的圖

function preload() {
  // 1. 載入背景圖片，並加入錯誤處理
  bgImage = loadImage('bg.png', 
    () => console.log("背景圖片載入成功"),
    (err) => {
      console.error("載入失敗：請確認檔案名稱為 bg.png 且放在正確資料夾中");
      console.error(err);
    }
  );

  // 2. 載入 HOME 頁面的背景圖片 bg2.png
  bgImageHome = loadImage('bg2.png',
    () => console.log("HOME 背景圖片載入成功"),
    (err) => {
      console.error("HOME 背景載入失敗：請確認 bg2.png 是否在資料夾中");
      console.error(err);
    }
  );

  // 3. 載入預設背景圖片 bg3.png
  bgImageDefault = loadImage('bg3.png',
    () => console.log("預設背景圖片載入成功"),
    (err) => {
      console.error("預設背景載入失敗：請確認 bg3.png 是否在資料夾中");
      console.error(err);
    }
  );

  // 4. 載入總測驗背景圖片 bg4.png
  bgImageQuiz = loadImage('bg4.png',
    () => console.log("總測驗背景圖片載入成功"),
    (err) => {
      console.error("總測驗背景載入失敗：請確認 bg4.png 是否在資料夾中");
      console.error(err);
    }
  );

  // 5. 載入卡牌圖片 (SDG 6, 7, 11, 12)
  sdgImg6 = loadImage('sdg6.png', 
    (img) => makeTransparent(img),
    () => console.error("找不到 sdg6.png")
  );
  sdgImg7 = loadImage('sdg7.png', 
    (img) => makeTransparent(img),
    () => console.error("找不到 sdg7.png")
  );
  sdgImg11 = loadImage('sdg11.png', 
    (img) => makeTransparent(img),
    () => console.error("找不到 sdg11.png")
  );
  sdgImg12 = loadImage('sdg12.png', 
    (img) => makeTransparent(img),
    () => console.error("找不到 sdg12.png")
  );

  // 5. 載入水資源圖片 water.jpg
  waterImg = loadImage('water.jpg',
    (img) => {
      console.log("水資源圖片載入成功");
      makeTransparent(img); // 動態去背
    },
    (err) => {
      console.error("水資源圖片載入失敗：請確認 water.jpg 是否在資料夾中");
    }
  );

  // 6. 載入碳排放圖片 co2.jpg
  co2Img = loadImage('co2.jpg',
    (img) => {
      console.log("碳排放圖片載入成功");
      makeTransparent(img); // 動態去背
    },
    (err) => {
      console.error("碳排放圖片載入失敗：請確認 co2.jpg 是否在資料夾中");
    }
  );

  // 7. 載入牛的圖片 cow.png
  cowImg = loadImage('cow.png',
    () => console.log("牛圖片載入成功"),
    (err) => {
      console.error("牛圖片載入失敗：請確認 cow.png 是否在資料夾中");
    }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 初始化第二單元吉祥物
  mascots = [
    new Mascot("水資源", width * 0.25, height * 0.5, "water"),
    new Mascot("碳排放", width * 0.5, height * 0.5, "cloud"),
    new Mascot("責任消費", width * 0.75, height * 0.5, "box")
  ];

  // 預先生成草叢位置，避免在 draw 裡面使用 randomSeed 導致隨機功能失效
  grassPositions = [];
  for (let i = 0; i < 25; i++) {
    grassPositions.push({ x: random(width), y: random(150, height) });
  }
}

function draw() {
  // 強制重設繪圖模式，避免上一幀的 imageMode(CENTER) 影響到背景圖片的繪製位置
  imageMode(CORNER);
  rectMode(CORNER);

  // 1. 決定目前的狀態應該顯示哪張圖
  let desiredImg = bgImageDefault;
  if (gameState === 'MENU') desiredImg = bgImage;
  else if (gameState === 'HOME') desiredImg = bgImageHome;
  else if (gameState === 'QUIZ') desiredImg = bgImageQuiz;

  // 2. 檢查背景是否需要切換
  if (desiredImg !== currentBgImg) {
    lastBgImg = currentBgImg;
    currentBgImg = desiredImg;
    fadeAmount = 0; // 重置透明度，開始淡入
  }

  // 3. 繪製背景邏輯
  background(208, 217, 220); // 墊底色

  if (fadeAmount < 255) {
    // 繪製上一張圖 (底層)
    if (lastBgImg && lastBgImg.width > 0) {
      drawCoverImage(lastBgImg, 255);
    }
    // 繪製目前這張圖 (上層淡入)
    if (currentBgImg && currentBgImg.width > 0) {
      drawCoverImage(currentBgImg, fadeAmount);
    }
    fadeAmount += 20; // 提高數值 (5 -> 20) 讓背景轉場更快速、更乾脆
  } else {
    // 已完成轉場，直接繪製目前圖案
    if (currentBgImg && currentBgImg.width > 0) {
      drawCoverImage(currentBgImg, 255);
    }
  }

  // 5. 更新彈窗縮放動畫
  if (showModal) {
    modalScale = lerp(modalScale, 1, 0.08); // 稍微加快一點速度，確保視窗能準確定位到中央
  } else {
    modalScale = 0;
  }

  // 4. 繪製遊戲內容
  if (gameState === 'MENU') {
    drawMainMenu();
  } else if (gameState === 'HOME') {
    drawHomePage();
  } else if (gameState === 'UNIT1') {
    drawUnit1Page();
  } else if (gameState === 'UNIT2') {
    drawUnit2Page();
  } else if (gameState === 'QUIZ') {
    drawQuizPage();
  } else if (gameState === 'CO2') {
    drawCO2Page();
  }
}

function mouseWheel(event) {
  if (gameState === 'UNIT1') {
    // 捲動靈敏度調整，並限制捲動範圍 (0 到 -800)
    unit1ScrollY = constrain(unit1ScrollY - event.delta, -800, 0);
  }
}

function drawMainMenu() {
  let scaleFactor = min(width / 800, height / 600);
  push();
  translate(width / 2, height / 2);
  scale(scaleFactor);
  translate(-400, -300); // 將座標系移回 800x600 邏輯區域的中心

  drawStartButton(400, 380);
  pop();
}

function drawHomePage() {
  // 1. 導覽列 (Navbar)
  fill(255);
  noStroke();
  rect(0, 0, width, 60);
  stroke(220);
  line(0, 60, width, 60);

  // 2. Logo (左側)
  fill(60, 100, 180);
  noStroke();
  rect(20, 10, 100, 40, 5);
  fill(255);
  textSize(18);
  textAlign(CENTER, CENTER);
  text("LOGO", 70, 30);

  // 3. 導覽按鈕 (右側)
  let navItems = ["課程單元", "總測驗", "個人成績", "環保車專區"];
  let startX = width - 450;
  textAlign(LEFT, CENTER);
  textSize(16);

  // 檢查滑鼠是否在選單出現後的矩形範圍內 (導覽列高 60 + 選單高約 110)
  let overCourseMenu = (mouseX > width - 450 && mouseX < width - 310 && mouseY >= 0 && mouseY < 170);
  let overCarMenu = (mouseX > width - 150 && mouseX < width - 30 && mouseY >= 0 && mouseY < 165);

  showCourseDropdown = overCourseMenu;
  showCarDropdown = overCarMenu;

  for (let i = 0; i < navItems.length; i++) {
    let itemX = startX + i * 100;
    let itemY = 30;

    // 偵測滑鼠是否懸停在導覽列文字按鈕上
    let overNavText = (mouseX > itemX && mouseX < itemX + 80 && mouseY > 0 && mouseY < 60);

    if (overNavText || (navItems[i] === "課程單元" && overCourseMenu) || (navItems[i] === "環保車專區" && overCarMenu)) {
      fill(100, 150, 255);
      if (navItems[i] === "課程單元") showCourseDropdown = true; 
      if (navItems[i] === "環保車專區") showCarDropdown = true;
    } else {
      fill(60);
    }
    text(navItems[i], itemX, itemY);
  }

  // 4. 下拉選單邏輯
  if (showCourseDropdown) {
    drawCourseDropdown(width - 450, 60);
  }
  if (showCarDropdown) {
    drawCarDropdown(width - 150, 60);
  }

  // 5. 主畫面內容排版
  // 計算影片寬度與居中位置
  let vWidth = width * 0.6; // 影片寬度佔螢幕 60%
  let vHeight = vWidth * 0.56; // 16:9 比例
  let vX = (width - vWidth) / 2; // 居中 X 座標
  let vY = 160; // 影片的 Y 座標

  // 第一單元標題 (原本標題被取代或不見了，這裡補回)
  fill(60);
  textAlign(CENTER, TOP);
  textSize(32);
  text("第一單元：平台簡介與導覽", width / 2, 100);

  // 居中的影片佔位框
  fill(240);
  stroke(200);
  rect(vX, vY, vWidth, vHeight, 10);
  fill(150);
  noStroke();
  textAlign(CENTER, CENTER);
  text("初始介紹影片播放器", width / 2, vY + vHeight / 2);

  // 平台簡介清單 (移至影片下方)
  let listY = vY + vHeight + 30;
  textAlign(LEFT, TOP);
  textSize(18);
  let listItems = ["✓ 豐富的互動課程內容", "✓ 即時測驗與成效追蹤", "✓ 專屬環保車學習專區"];
  for (let i = 0; i < listItems.length; i++) {
    fill(80);
    text(listItems[i], vX, listY + i * 35);
  }
}

// --- 碳排放小遊戲頁面 (CO2 Scene) ---
function drawCO2Page() {
  // 計算環境惡化程度 (0 到 1)，當牛隻達到 15 隻時最黃
  let degradation = constrain(cows.length / 15, 0, 1);

  // 1. 繪製背景黃化濾鏡 (營造土地乾枯、環境污染感)
  push();
  fill(160, 140, 0, map(degradation, 0, 1, 0, 100));
  noStroke();
  rect(0, 0, width, height);
  pop();

  // 2. 繪製預先生成的草原細節 (草的顏色也會隨之變黃)
  let grassCol = lerpColor(color(100, 160, 100), color(120, 100, 20), degradation);
  for (let p of grassPositions) {
    drawGrass(p.x, p.y, grassCol);
  }

  // 3. 繪製所有牛隻
  for (let cow of cows) {
    if (!isAlert) cow.move(); // 警報響起後牛隻停止走動
    cow.display();
  }

  // 3. 頂部計數器與提示
  fill(60);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(24);
  text("目前牛隻數量: " + cows.length, 20, 80);
  textSize(16);
  text("提示: 點擊草地來生成牛隻，觀察環境變化", 20, 115);

  // 4. 警報觸發邏輯
  if (isAlert) {
    // 紅色警報閃爍效果 (利用 sin(frameCount) 讓透明度動態變化)
    let alertAlpha = map(sin(frameCount * 0.2), -1, 1, 50, 200);
    fill(255, 0, 0, alertAlpha * 0.5); // 降低透明度以免完全遮擋背景
    rect(0, 0, width, height);

    // 彈出警報視窗
    drawAlertModal();
  }

  // 5. 返回按鈕 (左上角)
  fill(60, 100, 180);
  rect(20, 20, 50, 50, 5);
  fill(255);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("返回", 45, 45);
}

// 繪製草叢輔助函數
function drawGrass(x, y, col) {
  push();
  stroke(col || color(100, 160, 100));
  strokeWeight(2);
  line(x, y, x - 5, y - 10);
  line(x, y, x, y - 12);
  line(x, y, x + 5, y - 10);
  pop();
}

// 警報對話框
function drawAlertModal() {
  push();
  let mW = 550;
  let mH = 320;
  translate(width / 2, height / 2);
  
  fill(255);
  stroke(200, 0, 0);
  strokeWeight(5);
  rectMode(CENTER);
  rect(0, 0, mW, mH, 20);

  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  
  textSize(32);
  text("🚨 ⚠️ 逼逼逼！環境警報！", 0, -80);
  
  textSize(20);
  let warningText = "草地上太多牛隻了！\n畜牧業排放的大量甲烷，\n已導致全球碳排放量急遽上升，\n環境正在超載！";
  text(warningText, 0, 5);

  fill(100);
  textSize(16);
  text("(點擊畫面任何地方即可重置遊戲)", 0, 110);
  pop();
}

// 乳牛類別 (Cow Class)
class Cow {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-2.5, 2.5); // 速度範圍加大
    this.vy = random(-2.5, 2.5);
    this.size = random(3.5, 5.5); // 尺寸再次放大
    this.angle = random(TWO_PI); // 隨機初始旋轉角度 (0 ~ 360度)
  }

  move() {
    this.x += this.vx;
    this.y += this.vy;
    // 碰到畫布邊界反彈
    if (this.x < 50 || this.x > width - 50) this.vx *= -1;
    if (this.y < 150 || this.y > height - 50) this.vy *= -1;
  }

  display() {
    push();
    translate(this.x, this.y);
    
    // 呼吸起伏動畫：使用 sin 函數產生微小的縮放變化
    // frameCount * 0.1 控制呼吸的速度（數字愈大愈快）
    // 加入 this.angle 偏移量讓每隻牛的呼吸不同步，看起來更自然
    let breath = sin(frameCount * 0.1 + this.angle) * 0.15;
    scale(this.size + breath);

    rotate(this.angle); // 應用隨機旋轉
    
    // 驚訝時的小震動
    if (isAlert) {
      translate(random(-1, 1), random(-1, 1));
    }

    // 使用圖片取代原本的繪製邏輯
    if (cowImg && cowImg.width > 0) {
      imageMode(CENTER);
      image(cowImg, 0, 0, 160, 120); // 基礎大小放大一倍
    }
    pop();
  }
}

function drawUnit1Page() {
  // 1. 隨捲動移動的內容區
  push();
  translate(0, unit1ScrollY);

  // 標題
  fill(60);
  noStroke();
  textSize(36);
  textAlign(CENTER, TOP);
  text("第一單元：SDGs 永續發展目標", width / 2, 80);

  // 影片佔位框
  let vWidth = width * 0.45; // 縮小影片視窗
  let vHeight = vWidth * 0.56;
  let vX = (width - vWidth) / 2;
  let vY = 80;

  fill(255);
  stroke(150);
  strokeWeight(2);
  rect(vX, vY, vWidth, vHeight, 10);
  
  fill(60);
  noStroke();
  textSize(24);
  text("第一單元影片內容", width / 2, vY + vHeight / 2);

  // --- SDGs 按鈕群 (移至影片下方) ---
  let sdgNames = ['SDGs 6', 'SDGs 7', 'SDGs 11', 'SDGs 12'];
  let sdgChineseNames = ['淨水與衛生', '可負擔能源', '永續城市與社區', '責任消費'];
  let cardImgs = [sdgImg6, sdgImg7, sdgImg11, sdgImg12];
  let sdgDescriptions = [
    "確保所有人都能享有水及衛生及其永續管理",
    "確保所有的人都可取得負擔的起、可靠的、永續的，以及現代的能源",
    "建設包容、安全、具韌性且永續的城市與人類住區",
    "確保永續的消費與生產模式"
  ];
  let btnW = 120;
  let btnH = 180; // 調整為更大長方形卡牌比例
  let btnSpacing = 50; // 增加間距，讓卡牌更分散
  let totalWidth = (btnW * 4) + (btnSpacing * 3);
  let startX = (width - totalWidth) / 2;
  let btnY = vY + vHeight + 50;

  sdgButtons = []; // 每次重繪時更新按鈕範圍資訊
  for (let i = 0; i < sdgNames.length; i++) {
    let x = startX + i * (btnW + btnSpacing);
    
    // 儲存按鈕範圍供滑鼠偵測使用
    sdgButtons.push({ x: x, y: btnY, w: btnW, h: btnH, name: sdgNames[i], chinese: sdgChineseNames[i], index: i });

    // 更新縮放動畫：讓數值平滑地回歸到 1.0
    cardAnimationScales[i] = lerp(cardAnimationScales[i], 1.0, 0.25); // 提高動畫回彈速度
    
    // 更新翻轉動畫：目標角度 (背面為 0, 正面為 PI)
    let targetAngle = cardFlipped[i] ? PI : 0;
    cardRotationAngles[i] = lerp(cardRotationAngles[i], targetAngle, 0.25); // 提高翻牌旋轉速度

    // 偵測滑鼠是否懸停在該卡牌上 (需考慮捲動位移)
    let isHovering = mouseX > x && mouseX < x + btnW && 
                     mouseY > btnY + unit1ScrollY && mouseY < btnY + btnH + unit1ScrollY;

    push();
    let offsetX = 0;
    let offsetY = 0;

    if (isHovering && !showModal) {
      // 1. 發光效果：設定陰影
      drawingContext.shadowBlur = 20;
      drawingContext.shadowColor = 'rgba(255, 255, 150, 0.8)';
      
      // 2. 震動效果：微小的隨機偏移
      offsetX = random(-1.2, 1.2);
      offsetY = random(-1.2, 1.2);
    }

    translate(x + btnW / 2 + offsetX, btnY + btnH / 2 + offsetY); // 移動到卡牌中心點 (加上震動位移)
    
    // 結合縮放動畫與 3D 翻轉模擬 (利用 cos 縮放 X 軸)
    let flipXScale = cos(cardRotationAngles[i]);
    scale(flipXScale * cardAnimationScales[i], cardAnimationScales[i]);

    // 判定目前應該顯示哪一面 (以 90 度為分界線)
    if (abs(cardRotationAngles[i]) < HALF_PI) {
      // --- 繪製卡牌背面 ---
      if (isHovering && !showModal) {
        // 計算流光位移 (從 -0.5 到 1.5 循環)
        let flowPos = (frameCount * 0.02) % 2.0 - 0.5;
        let grad = drawingContext.createLinearGradient(-btnW, -btnH, btnW, btnH);
        // 設定背面虹彩流動漸變
        grad.addColorStop(0, 'rgb(60, 100, 180)');
        grad.addColorStop(constrain(flowPos, 0, 1), 'rgb(60, 100, 180)');
        grad.addColorStop(constrain(flowPos + 0.05, 0, 1), 'rgb(255, 150, 150)'); // 粉紅
        grad.addColorStop(constrain(flowPos + 0.10, 0, 1), 'rgb(255, 255, 150)'); // 淡黃
        grad.addColorStop(constrain(flowPos + 0.15, 0, 1), 'rgb(150, 255, 150)'); // 淡綠
        grad.addColorStop(constrain(flowPos + 0.20, 0, 1), 'rgb(150, 200, 255)'); // 亮藍
        grad.addColorStop(constrain(flowPos + 0.25, 0, 1), 'rgb(60, 100, 180)');
        grad.addColorStop(1, 'rgb(60, 100, 180)');
        drawingContext.fillStyle = grad;
      } else {
        fill(60, 100, 180);
      }
      stroke(255);
      strokeWeight(2);
      rect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
      
      // --- 繪製卡牌背面圖片 (對應 sdg6.png 等) ---
      if (cardImgs[i] && cardImgs[i].width > 0) {
        imageMode(CENTER);
        image(cardImgs[i], 0, -15, btnW * 0.8, btnW * 0.8);
      }

      fill(255);
      noStroke();
      textSize(18);
      textAlign(CENTER, CENTER);
      text(sdgNames[i], 0, 50); // 將編號文字下移
    } else {
      // --- 繪製卡牌正面 ---
      // 因為 X 軸縮放變為負數，內容會鏡像，我們需要補償翻轉
      scale(-1, 1); 
      
      if (isHovering && !showModal) {
        let flowPos = (frameCount * 0.02) % 2.0 - 0.5;
        let grad = drawingContext.createLinearGradient(-btnW, -btnH, btnW, btnH);
        // 設定正面虹彩流動漸變 (使用較淡的顏色以配合白色卡面)
        grad.addColorStop(0, 'rgb(255, 255, 255)');
        grad.addColorStop(constrain(flowPos, 0, 1), 'rgb(255, 255, 255)');
        grad.addColorStop(constrain(flowPos + 0.05, 0, 1), 'rgba(255, 200, 200, 0.6)'); 
        grad.addColorStop(constrain(flowPos + 0.10, 0, 1), 'rgba(255, 255, 200, 0.6)');
        grad.addColorStop(constrain(flowPos + 0.15, 0, 1), 'rgba(200, 255, 200, 0.6)');
        grad.addColorStop(constrain(flowPos + 0.20, 0, 1), 'rgba(200, 230, 255, 0.6)');
        grad.addColorStop(constrain(flowPos + 0.25, 0, 1), 'rgb(255, 255, 255)');
        grad.addColorStop(1, 'rgb(255, 255, 255)');
        drawingContext.fillStyle = grad;
      } else {
        fill(255);
      }
      stroke(60, 100, 180);
      strokeWeight(2);
      rect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
      
      // 如果有正面圖片，繪製圖片
      if (cardImgs[i] && cardImgs[i].width > 0) {
        imageMode(CENTER);
        image(cardImgs[i], 0, -20, btnW * 0.8, btnW * 0.8);
      }

      fill(60, 100, 180);
      noStroke();
      textSize(16);
      textAlign(CENTER, CENTER);
      text(sdgChineseNames[i], 0, 50); // 文字下移，留空間給圖片
    }

    // 等待按下後一秒 (1000ms)，才觸發彈窗彈出動畫
    if (pendingModalIndex === i && millis() - modalTimerStart > 1000) {
      showModal = true;
      modalOriginX = x + btnW / 2;
      modalOriginY = btnY + btnH / 2 + unit1ScrollY;
      modalText = "目標：" + sdgChineseNames[i] + "\n(" + sdgNames[i] + ")\n\n" + sdgDescriptions[i];
      pendingModalIndex = -1;
    }

    pop();
  }

  // --- 新增：介紹文字區 (移至按鈕下方) ---
  let textY = btnY + btnH + 50;
  fill(255, 180); // 半透明背景區塊增加易讀性
  noStroke();
  rect(vX - 20, textY - 20, vWidth + 40, 350, 15);
  
  fill(40);
  textAlign(LEFT, TOP);
  textSize(20);
  let introText = "聯合國永續發展目標（SDGs）包含 17 項核心指標，旨在解決從貧窮、不平等到氣候變遷等全球性挑戰。\n\n在這一單元中，我們將深入探討環境保護相關的目標：\n• 目標 6：確保所有人享有水和衛生及其永續管理。\n• 目標 7：確保所有人獲得負擔得起、可靠、永續且現代的能源。\n• 目標 12：促進綠色經濟，確保永續消費及生產模式。\n\n請點擊上方圖示查看詳細定義，或繼續向下捲動了解更多相關資訊。";
  text(introText, vX, textY, vWidth, 400);
  
  pop();

  // 2. 固定在最上層的 UI (不隨捲動移動)
  fill(60, 100, 180);
  noStroke();
  rect(20, 20, 50, 50, 5);
  fill(255);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("回首頁", 45, 45);

  // 捲動提示 (若在頂部則顯示)
  if (unit1ScrollY > -50) {
    fill(100, 150);
    textSize(14);
    text("向下捲動閱讀更多 ▼", width / 2, height - 30);
  }

  // 3. 彈出對話框 (Modal)
  if (showModal) {
    drawSDGModal();
  }
}

function drawSDGModal() {
  push();
  // 半透明黑色遮罩
  fill(0, 150 * modalScale);
  noStroke();
  rect(0, 0, width, height);

  // 計算彈窗目前的中心位置 (從卡牌中心飛往畫面中心)
  let currX = lerp(modalOriginX, width / 2, modalScale);
  let currY = lerp(modalOriginY, height / 2, modalScale);

  translate(currX, currY);
  scale(modalScale);

  // 白色對話框主體
  let mWidth = 600;
  let mHeight = 400;

  // --- 增加邊框發光與立體感 ---
  push();
  // 設定發光效果：顏色使用深藍色調並帶有透明度
  // 發光範圍 (shadowBlur) 隨縮放比例動態變化
  drawingContext.shadowBlur = 30 * modalScale;
  drawingContext.shadowColor = 'rgba(60, 100, 180, 0.6)';
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 5 * modalScale; // 稍微向下偏移，增加懸浮立體感

  fill(255);
  stroke(60, 100, 180, 100); // 加上淡淡的藍色邊框，強化邊緣定義
  strokeWeight(2);
  rectMode(CENTER);
  rect(0, 0, mWidth, mHeight, 15);
  pop(); // 畫完矩形後立刻 pop，避免陰影影響到後面的文字導致模糊

  // --- 內容文字動態縮放邏輯 ---
  fill(60);
  noStroke();
  textAlign(CENTER, CENTER);

  let tw = mWidth - 40;
  let th = mHeight - 60;

  let dynamicSize = 28; // 理想字級 (配合大視窗調大初始字級)
  let minSize = 10;     // 最小可接受字級
  textSize(dynamicSize);

  // 使用迴圈偵測文字是否超出範圍，並動態縮小字體
  while (dynamicSize > minSize) {
    textLeading(dynamicSize * 1.5); // 根據字級設定行距
    // 預估總行數：手動換行符 + 自動換行長度計算
    let paragraphs = modalText.split('\n');
    let totalLines = paragraphs.reduce((acc, p) => acc + Math.ceil(textWidth(p) / tw) || 1, 0);
    
    if (totalLines * textLeading() <= th) break; // 若高度符合則跳出
    dynamicSize--;
    textSize(dynamicSize);
  }

  // 關鍵修正：text(string, x, y, width, height) 配合 textAlign(CENTER, CENTER)
  // 必須確保 x, y 是文字框的左上角。
  // 因為 translate 已經在中心 (0,0)，所以左上角座標就是負的一半寬高。
  rectMode(CORNER); 
  text(modalText, -tw/2, -th/2, tw, th);
  rectMode(CENTER); // 恢復原有模式

  // 小提示
  textSize(12);
  text("(點擊畫面任何地方關閉視窗)", 0, mHeight / 2 - 25); // 隨視窗高度自動調整提示位置
  pop();
}

function drawCourseDropdown(x, y) {
  push();
  fill(255);
  stroke(220);
  rect(x, y, 140, 110, 0, 0, 5, 5);
  
  let subItems = ["第一單元", "第二單元", "第三單元"];
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  for (let i = 0; i < subItems.length; i++) {
    let subY = y + 15 + i * 30;
    // 偵測子項目懸停
    if (mouseX > x && mouseX < x + 140 && mouseY > subY && mouseY < subY + 25) {
      fill(100, 150, 255);
    } else {
      fill(80);
    }
    text("• " + subItems[i], x + 15, subY);
  }
  pop();
}

function drawUnit2Page() {
  // --- 1. Logo 區域 (左上角) ---
  fill(60, 100, 180);
  noStroke();
  rect(20, 20, 50, 50, 5);
  fill(255);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("回首頁", 45, 45);

  // --- 2. 標題 ---
  fill(60);
  textSize(32);
  text("第二單元：永續吉祥物互動", width / 2, 80);

  // --- 3. 吉祥物互動偵測 ---
  let hoveredMascot = null;
  for (let m of mascots) {
    if (m.checkHover(mouseX, mouseY)) {
      hoveredMascot = m;
      break;
    }
  }

  // 繪製所有吉祥物
  for (let m of mascots) {
    let isAnyHovered = (hoveredMascot !== null);
    let isThisHovered = (m === hoveredMascot);
    m.display(isAnyHovered, isThisHovered);
  }
}

// 吉祥物類別
class Mascot {
  constructor(name, x, y, type) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 120; // 配合圖片放大，偵測半徑也放大一倍
  }

  display(isAnyHovered, isThisHovered) {
    push();
    translate(this.x, this.y);

    // 1. 互動特效：Spotlight 與發光線
    if (isThisHovered) {
      // 頭頂 Spotlight 效果
      noStroke();
      fill(255, 255, 0, 50);
      triangle(0, -this.radius, -100, -height, 100, -height);

      // 手繪感光芒線
      stroke(255, 200, 0);
      strokeWeight(3);
      for (let i = 0; i < 8; i++) {
        let angle = TWO_PI / 8 * i;
        line(cos(angle) * 70, sin(angle) * 70, cos(angle) * 100, sin(angle) * 100);
      }
    }

    // 2. 繪製角色 (優先使用圖片，若無圖片則使用原有的向量圖形)
    if (this.type === "water" && waterImg && waterImg.width > 0) {
      imageMode(CENTER);
      if (isAnyHovered && !isThisHovered) tint(255, 120); // 懸停時的淡化效果
      image(waterImg, 0, 0, 240, 240); // 尺寸由 120 變更為 240
      noTint();
    } else if (this.type === "cloud" && co2Img && co2Img.width > 0) {
      imageMode(CENTER);
      if (isAnyHovered && !isThisHovered) tint(255, 120);
      image(co2Img, 0, 0, 240, 240); // 尺寸由 120 變更為 240
      noTint();
    } else if (this.type === "water") {
      noStroke();
      if (isAnyHovered && !isThisHovered) fill(180);
      else fill(100, 200, 255);
      beginShape();
      vertex(0, -120);
      bezierVertex(80, -40, 80, 80, 0, 120);
      bezierVertex(-80, 80, -80, -40, 0, -120);
      endShape(CLOSE);
    } else if (this.type === "cloud") {
      noStroke();
      if (isAnyHovered && !isThisHovered) fill(180);
      else fill(255);
      ellipse(0, 0, 200, 120);
      ellipse(-60, 40, 120, 100);
      ellipse(60, 40, 120, 100);
    } else if (this.type === "box") {
      noStroke();
      if (isAnyHovered && !isThisHovered) fill(180);
      else fill(255, 180, 100);
      rectMode(CENTER);
      rect(0, 0, 180, 180, 30);
    }

    // 3. 標註中文名稱
    fill(isAnyHovered && !isThisHovered ? 120 : 60);
    textSize(20);
    textAlign(CENTER);
    text(this.name, 0, 150); // 文字位置下移，避免與大圖重疊
    pop();
  }

  checkHover(mx, my) {
    return dist(mx, my, this.x, this.y) < this.radius + 20;
  }
}

function drawQuizPage() {
  // --- 1. Logo 區域 (回首頁) ---
  fill(60, 100, 180);
  noStroke();
  rect(20, 20, 50, 50, 5);
  fill(255);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("回首頁", 45, 45);

  // --- 3. QR Code 繪製 ---
  let qrSize = 250;
  let qx = (width - qrSize) / 2;
  let qy = (height - qrSize) / 2;

  // QR Code 外框
  fill(255);
  stroke(60);
  strokeWeight(2);
  rect(qx - 20, qy - 20, qrSize + 40, qrSize + 40, 10);

  // 模擬 QR Code 圖案 (這部分可以換成實際圖片，現在用圖形代表)
  fill(40);
  noStroke();
  rect(qx, qy, qrSize, qrSize);
  // 四角定位標誌
  fill(255);
  rect(qx + 10, qy + 10, 60, 60);
  rect(qx + qrSize - 70, qy + 10, 60, 60);
  rect(qx + 10, qy + qrSize - 70, 60, 60);

  // 提示文字
  fill(80);
  textSize(18);
  textAlign(CENTER);
  text("點擊 QR Code 進入外部測驗連結", width / 2, qy + qrSize + 60);
}

function drawCarDropdown(x, y) {
  push();
  fill(255);
  stroke(220);
  rect(x, y, 120, 105, 0, 0, 5, 5);
  
  let subItems = ["簡介", "影片", "預約"];
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  for (let i = 0; i < subItems.length; i++) {
    let subY = y + 15 + i * 30;
    if (mouseX > x && mouseX < x + 120 && mouseY > subY && mouseY < subY + 25) {
      fill(100, 150, 255);
    } else {
      fill(80);
    }
    text("▶ " + subItems[i], x + 15, subY);
  }
  pop();
}

function mousePressed() {
  if (gameState === 'MENU') {
    // 根據 drawMainMenu 的縮放比例計算按鈕點擊範圍
    let scaleFactor = min(width / 800, height / 600);
    
    // 設定你在 bg.png 中畫的按鈕位置 (以 800x600 為基準測量)
    // 假設你畫的按鈕中心在 400, 380，寬度 250，高度 100
    let targetX = width / 2; 
    let targetY = height / 2 + (80 * scaleFactor); 
    let targetW = 250 * scaleFactor; 
    let targetH = 100 * scaleFactor;

    if (mouseX > targetX - targetW/2 && mouseX < targetX + targetW/2 &&
        mouseY > targetY - targetH/2 && mouseY < targetY + targetH/2) {
      gameState = 'HOME';
    }
  } else if (gameState === 'HOME') {
    // 偵測 Logo 點擊 (重設頁面回選單)
    if (mouseX > 20 && mouseX < 120 && mouseY > 10 && mouseY < 50) {
      gameState = 'MENU';
    }

    // 偵測「總測驗」按鈕點擊 (startX 為 width - 450, 總測驗是 index 1)
    let quizBtnX = width - 350;
    if (mouseX > quizBtnX && mouseX < quizBtnX + 80 && mouseY > 0 && mouseY < 60) {
      gameState = 'QUIZ';
    }

    // 偵測課程單元下拉選單點擊
    if (showCourseDropdown) {
      let x = width - 450;
      for (let i = 0; i < 3; i++) {
        let subY = 60 + 15 + i * 30;
        if (mouseX > x && mouseX < x + 140 && mouseY > subY && mouseY < subY + 25) {
          if (i === 0) { // 如果點擊第一單元
            gameState = 'UNIT1';
          }
          if (i === 1) { // 如果點擊第二單元
            gameState = 'UNIT2';
          }
        }
      }
    }

    // 偵測環保車專區點擊 (依此類推)
    if (showCarDropdown) {
      // 可在此加入點擊「簡介、影片、預約」的邏輯
    }
  } else if (gameState === 'UNIT1') {
    // 如果彈窗開啟，優先偵測 X 按鈕
    if (showModal) {
      showModal = false; // 點擊任何地方關閉彈窗
      return;
    }

    // 偵測回首頁 Logo
    if (mouseX > 20 && mouseX < 70 && mouseY > 20 && mouseY < 70) {
      gameState = 'HOME';
    }

    // 偵測 SDGs 按鈕點擊
    for (let btn of sdgButtons) {
      if (mouseX > btn.x && mouseX < btn.x + btn.w && 
          mouseY > btn.y + unit1ScrollY && mouseY < btn.y + btn.h + unit1ScrollY) {
        
        cardFlipped[btn.index] = !cardFlipped[btn.index]; // 切換翻牌狀態
        cardAnimationScales[btn.index] = 1.3;             // 點擊時瞬間放大到 1.3 倍
        
        if (cardFlipped[btn.index]) {
          pendingModalIndex = btn.index; // 進入等待狀態，等翻轉完才彈出
          modalTimerStart = millis(); // 記錄按下這一刻的時間
        } else {
          showModal = false; // 翻回去時關閉彈窗
        }
      }
    }
  } else if (gameState === 'UNIT2') {
    // 偵測回首頁 Logo
    if (mouseX > 20 && mouseX < 70 && mouseY > 20 && mouseY < 70) {
      gameState = 'HOME';
    }

    // 修正：將吉祥物點擊偵測移至 UNIT2 區塊
    for (let m of mascots) {
      if (m.checkHover(mouseX, mouseY)) {
        if (m.name === "碳排放") {
          gameState = 'CO2';
          resetCO2Game();
        }
      }
    }
  } else if (gameState === 'QUIZ') {
    // 偵測回首頁 Logo
    if (mouseX > 20 && mouseX < 70 && mouseY > 20 && mouseY < 70) {
      gameState = 'HOME';
    }

    // 偵測 QR Code 點擊連結
    let qrSize = 250;
    let qx = (width - qrSize) / 2;
    let qy = (height - qrSize) / 2;
    if (mouseX > qx && mouseX < qx + qrSize && mouseY > qy && mouseY < qy + qrSize) {
      window.open("https://forms.gle/your-google-form-url", "_blank"); // 替換為你的連結
    }
  }
  else if (gameState === 'CO2') {
    // 返回按鈕偵測
    if (mouseX > 20 && mouseX < 70 && mouseY > 20 && mouseY < 70) {
      gameState = 'HOME';
      return;
    }

    if (isAlert) {
      // 警報響起後點擊重置回 1 隻牛
      resetCO2Game();
    } else {
      // 在畫面上隨機位置生成新牛隻，不再固定於滑鼠位置
      let randomX = random(50, width - 50);
      let randomY = random(150, height - 50);
      cows.push(new Cow(randomX, randomY));
      // 檢查是否達到 15 隻門檻
      if (cows.length >= 15) {
        isAlert = true;
      }
    }
  }
}

function windowResized() {
  // 當瀏覽器視窗大小改變時，重新調整畫布尺寸
  resizeCanvas(windowWidth, windowHeight);
}

function drawMacButtons(x, y) {
  push();
  strokeWeight(1.5);
  fill(255, 95, 87); ellipse(x, y, 15, 15);     // 紅
  fill(255, 189, 46); ellipse(x + 25, y, 15, 15); // 黃
  fill(39, 201, 63); ellipse(x + 50, y, 15, 15);  // 綠
  pop();
}

function drawEarth(x, y) {
  push();
  stroke(60); strokeWeight(3); fill(144, 238, 144);
  ellipse(x, y, 160, 160);
  fill(60); noStroke(); textAlign(CENTER, CENTER); textSize(60);
  text("地", x, y);
  // 旋轉箭頭
  stroke(80); noFill(); strokeWeight(2);
  line(x - 110, y, x - 110, y - 40); line(x - 110, y - 40, x - 120, y - 30); line(x - 110, y - 40, x - 100, y - 30);
  line(x + 110, y, x + 110, y + 40); line(x + 110, y + 40, x + 100, y + 30); line(x + 110, y + 40, x + 120, y + 30);
  pop();
}

// 重置小遊戲狀態
function resetCO2Game() {
  cows = [];
  // 重置時也隨機放置第一隻牛
  cows.push(new Cow(random(50, width - 50), random(150, height - 50)));
  isAlert = false;
}

function drawSaturn(x, y) {
  push();
  stroke(40); strokeWeight(3); noFill();
  ellipse(x, y, 220, 60); // 行星環
  fill(255, 200, 120); ellipse(x, y, 120, 120); // 星球主體
  pop();
}

function drawSprite(x, y) {
  push();
  stroke(255, 255, 255, 150);
  strokeWeight(2);
  drawingContext.setLineDash([5, 5]);
  line(x, y, 580, 350); // 連向土星
  drawingContext.setLineDash([]);
  noStroke();
  fill(144, 238, 144); ellipse(x - 15, y - 5, 20, 40); ellipse(x + 15, y - 5, 20, 40); // 翅膀
  fill(255, 230, 200); ellipse(x, y, 25, 25); // 身體
  fill(60); ellipse(x - 5, y - 2, 3, 3); ellipse(x + 5, y - 2, 3, 3); // 眼睛
  pop();
}

function drawStartButton(x, y) {
  push();
  noStroke();
  for(let i = 10; i > 0; i--) { // 發光效果
    fill(255, 255, 255, 20 - i);
    rect(x - 100 - i, y - 30 - i, 200 + i*2, 60 + i*2, 20);
  }
  stroke(200); strokeWeight(2); fill(255);
  rect(x - 100, y - 30, 200, 60, 15);
  noStroke(); fill(80); textAlign(CENTER, CENTER); textSize(28);
  text("進入遊戲", x, y);
  pop();
}

// 輔助函數：保持比例繪製背景圖 (Cover 模式)
function drawCoverImage(img, alpha = 255) {
  if (!img || img.width <= 0) return;
  let imgAspect = img.width / img.height;
  let canvasAspect = width / height;
  let drawW, drawH;
  if (canvasAspect > imgAspect) {
    drawW = width;
    drawH = width / imgAspect;
  } else {
    drawH = height;
    drawW = height * imgAspect;
  }
  push();
  tint(255, alpha); // 設定透明度
  image(img, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
  pop();
}

// 輔助函數：將圖片中的白色背景變為透明
function makeTransparent(img) {
  img.loadPixels();
  // 遍歷所有像素 (RGBA)
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];
    // 如果顏色接近純白 (255, 255, 255)，將 Alpha 通道 (透明度) 設為 0
    if (r > 245 && g > 245 && b > 245) {
      img.pixels[i + 3] = 0;
    }
  }
  img.updatePixels();
}
