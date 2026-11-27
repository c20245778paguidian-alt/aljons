gsap.registerPlugin(ScrollTrigger);

const leafContainer = document.getElementById("falling-leaves");
const leafColors = ["#ef4444", "#facc15", "#fb923c", "#22c55e", "#3b82f6"];

if (leafContainer && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const leafCount = window.innerWidth < 640 ? 14 : 24;

  for (let i = 0; i < leafCount; i++) {
    const leaf = document.createElement("span");
    const duration = 8 + Math.random() * 8;

    leaf.className = "falling-leaf";
    leaf.style.setProperty("--leaf-left", `${Math.random() * 100}%`);
    leaf.style.setProperty("--leaf-size", `${12 + Math.random() * 18}px`);
    leaf.style.setProperty("--leaf-color", leafColors[Math.floor(Math.random() * leafColors.length)]);
    leaf.style.setProperty("--leaf-opacity", `${0.65 + Math.random() * 0.35}`);
    leaf.style.setProperty("--leaf-duration", `${duration}s`);
    leaf.style.setProperty("--leaf-delay", `${-Math.random() * duration}s`);
    leaf.style.setProperty("--leaf-rotation", `${Math.random() * 180}deg`);
    leaf.style.setProperty("--leaf-sway-a", `${-80 + Math.random() * 160}px`);
    leaf.style.setProperty("--leaf-sway-b", `${-80 + Math.random() * 160}px`);
    leafContainer.appendChild(leaf);
  }
}

const tl = gsap.timeline({ defaults: { duration: 0.1, ease: "power2.out" } });
tl.from("h1", {
  x: -200,
  duration: 1.5,
  opacity: 0,
  ease: "back.out(1.7)"
}).from("nav *", {
  y: -20,
  opacity: 0,
  stagger: 0.15,
  ease: "power2.out"
}, "-=0.3");

document.getElementById("Replay").addEventListener("click", () => tl.restart());

const toggleButton = document.getElementById("Toggle");
let rotationAngle = 0;
toggleButton.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  rotationAngle += 360;
  gsap.to(toggleButton, {
    rotation: rotationAngle,
    duration: 0.6,
    ease: "back.out(1.7)"
  });
});

gsap.utils.toArray(".reveal").forEach((section) => {
  gsap.from(section, {
    y: 50,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out",
    scrollTrigger: {
      trigger: section,
      start: "top 80%",
      toggleActions: "play none none reverse"
    }
  });
});

gsap.fromTo("#progressBar",
  { scaleX: 0 },
  {
    scaleX: 1,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: true
    }
  }
);

document.getElementById("contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
});

(() => {
  const canvas = document.getElementById("physics-canvas");
  const context = canvas.getContext("2d");
  const countLabel = document.getElementById("ball-count");
  const statusLabel = document.getElementById("physics-status");
  const pauseButton = document.getElementById("physics-toggle");
  const addButton = document.getElementById("physics-add");
  const resetButton = document.getElementById("physics-reset");
  const gravityControl = document.getElementById("gravity-control");
  const gravityValue = document.getElementById("gravity-value");
  const colors = ["#ef4444", "#facc15", "#3b82f6", "#22c55e", "#a855f7"];
  const maxBalls = 1000;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let balls = [];
  let paused = reducedMotion;
  let previousTime = 0;
  let nextColor = 0;

  function updateCount() {
    countLabel.textContent = String(balls.length);
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    balls.forEach((ball) => {
      ball.x = Math.max(ball.radius, Math.min(width - ball.radius, ball.x));
      ball.y = Math.max(ball.radius, Math.min(height - ball.radius, ball.y));
    });
    draw();
  }

  function addBall(x = width * (0.2 + Math.random() * 0.6), y = 30) {
    if (balls.length >= maxBalls) {
      statusLabel.textContent = "The playground is full. Reset to add more balls.";
      return;
    }
    const radius = 12 + Math.random() * 12;
    balls.push({
      x: Math.max(radius, Math.min(width - radius, x)),
      y: Math.max(radius, Math.min(height - radius, y)),
      vx: (Math.random() - 0.5) * 180,
      vy: -Math.random() * 50,
      radius,
      color: colors[nextColor++ % colors.length]
    });
    updateCount();
    statusLabel.textContent = `Ball added. ${balls.length} balls in the playground.`;
  }

  function resolveCollisions() {
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const first = balls[i];
        const second = balls[j];
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const distance = Math.hypot(dx, dy);
        const minDistance = first.radius + second.radius;

        if (distance === 0 || distance >= minDistance) continue;

        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance;
        first.x -= nx * overlap * 0.5;
        first.y -= ny * overlap * 0.5;
        second.x += nx * overlap * 0.5;
        second.y += ny * overlap * 0.5;

        const relativeVelocity =
          (second.vx - first.vx) * nx +
          (second.vy - first.vy) * ny;

        if (relativeVelocity < 0) {
          const impulse = -(1 + 0.86) * relativeVelocity * 0.5;
          first.vx -= impulse * nx;
          first.vy -= impulse * ny;
          second.vx += impulse * nx;
          second.vy += impulse * ny;
        }
      }
    }
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    balls.forEach((ball) => {
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      context.fillStyle = ball.color;
      context.fill();
      context.lineWidth = 3;
      context.strokeStyle = document.documentElement.classList.contains("dark") ? "#fff" : "#000";
      context.stroke();
    });
  }

  function frame(time) {
    const delta = Math.min((time - (previousTime || time)) / 1000, 1 / 30);
    previousTime = time;

    if (!paused) {
      const gravity = Number(gravityControl.value) * 1000;
      balls.forEach((ball) => {
        ball.vy += gravity * delta;
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;

        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx) * 0.86;
        } else if (ball.x + ball.radius > width) {
          ball.x = width - ball.radius;
          ball.vx = -Math.abs(ball.vx) * 0.86;
        }

        if (ball.y + ball.radius > height) {
          ball.y = height - ball.radius;
          ball.vy = -Math.abs(ball.vy) * 0.78;
          ball.vx *= 0.985;
          if (Math.abs(ball.vy) < 18) ball.vy = 0;
        } else if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy) * 0.86;
        }
      });
      resolveCollisions();
    }

    draw();
    window.requestAnimationFrame(frame);
  }

  function setPaused(value) {
    paused = value;
    pauseButton.textContent = paused ? "Resume" : "Pause";
    pauseButton.setAttribute("aria-pressed", String(paused));
    statusLabel.textContent = paused ? "Simulation paused." : "Simulation running.";
  }

  canvas.addEventListener("pointerdown", (event) => {
    const bounds = canvas.getBoundingClientRect();
    addBall(event.clientX - bounds.left, event.clientY - bounds.top);
  });

  addButton.addEventListener("click", () => addBall());
  resetButton.addEventListener("click", () => {
    balls = [];
    nextColor = 0;
    for (let i = 0; i < 8; i++) {
      addBall(width * (0.15 + Math.random() * 0.7), 25 + Math.random() * 80);
    }
    setPaused(false);
    statusLabel.textContent = "Simulation reset.";
  });

  pauseButton.addEventListener("click", () => setPaused(!paused));
  gravityControl.addEventListener("input", () => {
    gravityValue.textContent = Number(gravityControl.value).toFixed(2);
  });

  window.addEventListener("resize", resizeCanvas);
  pauseButton.textContent = paused ? "Resume" : "Pause";
  pauseButton.setAttribute("aria-pressed", String(paused));
  resizeCanvas();
  for (let i = 0; i < 8; i++) {
    addBall(width * (0.15 + Math.random() * 0.7), 25 + Math.random() * 80);
  }
  window.requestAnimationFrame(frame);
})();
