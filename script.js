const header = document.querySelector(".site-header");

window.addEventListener(
  "scroll",
  () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  },
  { passive: true }
);

const canvas = document.querySelector("#snack-game");
const startButton = document.querySelector("#game-start");
const resetButton = document.querySelector("#game-reset");
const scoreNode = document.querySelector("#game-score");
const bestNode = document.querySelector("#game-best");
const livesNode = document.querySelector("#game-lives");

if (canvas) {
  const ctx = canvas.getContext("2d");
  const amnomImage = new Image();
  const coinImage = new Image();
  amnomImage.src = "assets/amnom-open-cut.png";
  coinImage.src = "assets/solana-coin-cut.png";

  const state = {
    running: false,
    over: false,
    score: 0,
    best: Number(localStorage.getItem("solnom-best") || 0),
    lives: 3,
    playerX: canvas.width / 2,
    targetX: canvas.width / 2,
    speed: 1,
    drops: [],
    keys: new Set(),
    lastTime: 0,
    spawnTimer: 0,
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => min + Math.random() * (max - min);
  const imageReady = (image) => image.complete && image.naturalWidth > 0;

  const updateHud = () => {
    scoreNode.textContent = state.score;
    bestNode.textContent = state.best;
    livesNode.textContent = state.lives;
  };

  const resetGame = () => {
    state.running = false;
    state.over = false;
    state.score = 0;
    state.lives = 3;
    state.speed = 1;
    state.drops = [];
    state.spawnTimer = 0;
    state.playerX = canvas.width / 2;
    state.targetX = canvas.width / 2;
    startButton.textContent = "Start drop";
    updateHud();
    draw();
  };

  const startGame = () => {
    if (state.over || state.lives <= 0) {
      resetGame();
    }

    state.running = !state.running;
    startButton.textContent = state.running ? "Pause" : "Resume";
    canvas.focus({ preventScroll: true });
  };

  const spawnDrop = () => {
    const isHazard = Math.random() < Math.min(0.16 + state.score * 0.006, 0.34);
    const size = isHazard ? rand(34, 46) : rand(42, 58);

    state.drops.push({
      x: rand(size, canvas.width - size),
      y: -size,
      size,
      vy: rand(145, 220) + state.speed * 18,
      spin: rand(-2.4, 2.4),
      angle: rand(0, Math.PI * 2),
      hazard: isHazard,
    });
  };

  const getPointerX = (event) => {
    const rect = canvas.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * canvas.width;
  };

  const moveToPointer = (event) => {
    state.targetX = clamp(getPointerX(event), 80, canvas.width - 80);
  };

  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    moveToPointer(event);
    if (!state.running) {
      startGame();
    }
  });

  canvas.addEventListener("pointermove", moveToPointer);

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === " ") {
      event.preventDefault();
    }

    if (event.key === " ") {
      startGame();
      return;
    }

    state.keys.add(event.key);
  });

  window.addEventListener("keyup", (event) => {
    state.keys.delete(event.key);
  });

  startButton?.addEventListener("click", startGame);
  resetButton?.addEventListener("click", resetGame);

  const drawBackground = () => {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#c7f5ff");
    sky.addColorStop(0.68, "#fff3bf");
    sky.addColorStop(1, "#b8ef51");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(24, 48, 15, 0.08)";
    for (let x = -20; x < canvas.width; x += 52) {
      ctx.fillRect(x, 0, 4, canvas.height);
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(120, 76, 38, 0, Math.PI * 2);
    ctx.arc(162, 72, 48, 0, Math.PI * 2);
    ctx.arc(206, 82, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#85d80b";
    ctx.fillRect(0, canvas.height - 54, canvas.width, 54);
    ctx.fillStyle = "#18300f";
    ctx.fillRect(0, canvas.height - 58, canvas.width, 5);
  };

  const drawHazard = (drop) => {
    ctx.save();
    ctx.translate(drop.x, drop.y);
    ctx.rotate(drop.angle);
    ctx.fillStyle = "#ff5148";
    ctx.strokeStyle = "#18300f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(-drop.size / 2, -drop.size / 3, drop.size, drop.size * 0.66, 8);
    } else {
      ctx.rect(-drop.size / 2, -drop.size / 3, drop.size, drop.size * 0.66);
    }
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff3bf";
    ctx.fillRect(-drop.size * 0.3, -drop.size * 0.08, drop.size * 0.6, drop.size * 0.16);
    ctx.restore();
  };

  const drawDrops = () => {
    for (const drop of state.drops) {
      if (drop.hazard) {
        drawHazard(drop);
        continue;
      }

      ctx.save();
      ctx.translate(drop.x, drop.y);
      ctx.rotate(drop.angle);
      if (imageReady(coinImage)) {
        ctx.drawImage(coinImage, -drop.size / 2, -drop.size / 2, drop.size, drop.size);
      } else {
        ctx.fillStyle = "#ffc83d";
        ctx.beginPath();
        ctx.arc(0, 0, drop.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  const drawPlayer = () => {
    const width = 150;
    const height = 150;
    const x = state.playerX - width / 2;
    const y = canvas.height - height - 6;

    ctx.save();
    ctx.shadowColor = "rgba(24, 48, 15, 0.5)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 12;
    if (imageReady(amnomImage)) {
      ctx.drawImage(amnomImage, x, y, width, height);
    } else {
      ctx.fillStyle = "#85d80b";
      ctx.beginPath();
      ctx.arc(state.playerX, canvas.height - 78, 58, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawOverlay = () => {
    if (state.running) {
      return;
    }

    ctx.save();
    ctx.fillStyle = "rgba(255, 243, 191, 0.84)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#18300f";
    ctx.textAlign = "center";
    ctx.font = "700 42px Fredoka, Arial";
    ctx.fillText(state.over ? "Snack run over" : "Catch the solankas", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "800 22px Nunito, Arial";
    ctx.fillText("Move mouse, finger, or arrows. Space pauses.", canvas.width / 2, canvas.height / 2 + 28);
    ctx.restore();
  };

  const draw = () => {
    drawBackground();
    drawDrops();
    drawPlayer();
    drawOverlay();
  };

  const endGame = () => {
    state.running = false;
    state.over = true;
    startButton.textContent = "Play again";
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem("solnom-best", String(state.best));
    }
    updateHud();
  };

  const update = (time) => {
    const delta = Math.min((time - state.lastTime) / 1000 || 0, 0.032);
    state.lastTime = time;

    if (state.running) {
      if (state.keys.has("ArrowLeft") || state.keys.has("a")) {
        state.targetX -= 520 * delta;
      }
      if (state.keys.has("ArrowRight") || state.keys.has("d")) {
        state.targetX += 520 * delta;
      }

      state.targetX = clamp(state.targetX, 80, canvas.width - 80);
      state.playerX += (state.targetX - state.playerX) * Math.min(1, delta * 14);
      state.spawnTimer -= delta;

      if (state.spawnTimer <= 0) {
        spawnDrop();
        state.spawnTimer = Math.max(0.34, 0.9 - state.score * 0.012);
      }

      const mouthX = state.playerX;
      const mouthY = canvas.height - 82;
      const nextDrops = [];

      for (const drop of state.drops) {
        drop.y += drop.vy * delta;
        drop.angle += drop.spin * delta;

        const distance = Math.hypot(drop.x - mouthX, drop.y - mouthY);
        if (distance < drop.size * 0.58 + 36) {
          if (drop.hazard) {
            state.lives -= 1;
          } else {
            state.score += 1;
            state.speed += 0.04;
          }
          continue;
        }

        if (drop.y > canvas.height + 70) {
          if (!drop.hazard) {
            state.lives -= 1;
          }
          continue;
        }

        nextDrops.push(drop);
      }

      state.drops = nextDrops;

      if (state.lives <= 0) {
        endGame();
      } else {
        updateHud();
      }
    }

    draw();
    requestAnimationFrame(update);
  };

  updateHud();
  draw();
  requestAnimationFrame(update);
}
