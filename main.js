const { Engine, Render, Runner, Bodies, Body, Events, Mouse, MouseConstraint, Composite, World } = Matter;

// --- Proyectos que representan cada estrella ---
const PROJECTS = [
  { label: 'Proyecto 1', target: '#project-1', color: '#b48aff' },
  { label: 'Proyecto 2', target: '#project-2', color: '#7eb8ff' },
  { label: 'Proyecto 3', target: '#project-3', color: '#ff8ab4' },
];

// --- Estrellas de fondo decorativas (sin física, solo CSS canvas) ---
const BG_STARS = 120;

// ============================================================
// 1. FONDO ESTRELLADO (canvas 2D puro, detrás del canvas de matter)
// ============================================================
function drawBackgroundStars(canvas) {
  const ctx = canvas.getContext('2d');
  const stars = Array.from({ length: BG_STARS }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.2,
    a: Math.random(),
    speed: Math.random() * 0.004 + 0.001,
    phase: Math.random() * Math.PI * 2,
  }));

  let t = 0;
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.016;
    for (const s of stars) {
      const alpha = s.a * (0.5 + 0.5 * Math.sin(t * s.speed * 60 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  loop();
}

// ============================================================
// 2. MATTER.JS — estrellas interactivas
// ============================================================
function initMatter() {
  const hero = document.getElementById('hero');
  const W = hero.clientWidth;
  const H = hero.clientHeight;

  // Canvas de fondo (estrellas decorativas)
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = W;
  bgCanvas.height = H;
  bgCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  hero.insertBefore(bgCanvas, hero.firstChild);
  drawBackgroundStars(bgCanvas);

  // Engine
  const engine = Engine.create({ gravity: { x: 0, y: 0 } });
  const world = engine.world;

  // Render (canvas de matter.js)
  const render = Render.create({
    element: hero,
    canvas: document.getElementById('stars-canvas'),
    engine,
    options: {
      width: W,
      height: H,
      background: 'transparent',
      wireframes: false,
    },
  });

  // Crear las estrellas interactivas (polígonos de 5 lados = estrella)
  const starBodies = PROJECTS.map((proj, i) => {
    const x = W * (0.2 + 0.3 * i) + (Math.random() - 0.5) * 80;
    const y = H * (0.25 + Math.random() * 0.5);
    const size = 22 + Math.random() * 10;

    const body = Bodies.polygon(x, y, 5, size, {
      frictionAir: 0.015,
      restitution: 0.7,
      label: proj.label,
      render: {
        fillStyle: proj.color,
        strokeStyle: proj.color,
        lineWidth: 0,
        opacity: 0.9,
      },
    });

    // Velocidad inicial suave
    Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 1.5,
      y: (Math.random() - 0.5) * 1.5,
    });

    body._project = proj;
    return body;
  });

  // Paredes invisibles
  const walls = [
    Bodies.rectangle(W / 2, -25, W, 50,   { isStatic: true, render: { visible: false } }),
    Bodies.rectangle(W / 2, H + 25, W, 50, { isStatic: true, render: { visible: false } }),
    Bodies.rectangle(-25, H / 2, 50, H,   { isStatic: true, render: { visible: false } }),
    Bodies.rectangle(W + 25, H / 2, 50, H, { isStatic: true, render: { visible: false } }),
  ];

  Composite.add(world, [...starBodies, ...walls]);

  // Mouse constraint (arrastrar estrellas)
  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.2, render: { visible: false } },
  });
  Composite.add(world, mouseConstraint);
  render.mouse = mouse;

  Runner.run(Runner.create(), engine);
  Render.run(render);

  // ---- Efecto glow en canvas de matter ----
  Events.on(render, 'afterRender', () => {
    const ctx = render.context;
    for (const body of starBodies) {
      const { x, y } = body.position;
      const color = body._project.color;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, 40);
      grad.addColorStop(0, color + '55');
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Texto del label debajo de la estrella
      ctx.font = 'bold 11px Segoe UI, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(body._project.label, x, y + 36);
    }
  });

  // ---- Hover: tooltip ----
  const tooltip = document.getElementById('star-tooltip');

  Events.on(mouseConstraint, 'mousemove', (e) => {
    const { x, y } = e.source.mouse.position;
    const hit = starBodies.find(b => isNearBody(b, x, y, 30));
    if (hit) {
      tooltip.textContent = `Ver ${hit._project.label}`;
      tooltip.classList.remove('hidden');
      tooltip.style.left = (e.source.mouse.absolute.x + 14) + 'px';
      tooltip.style.top  = (e.source.mouse.absolute.y - 10) + 'px';
      render.canvas.style.cursor = 'pointer';
    } else {
      tooltip.classList.add('hidden');
      render.canvas.style.cursor = 'default';
    }
  });

  // ---- Click: navegar al proyecto ----
  Events.on(mouseConstraint, 'mouseup', (e) => {
    const { x, y } = e.source.mouse.position;
    const hit = starBodies.find(b => isNearBody(b, x, y, 30));
    if (hit) {
      const target = document.querySelector(hit._project.target);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        flashCard(target);
      }
    }
  });

  // ---- Mantener las estrellas en movimiento suave ----
  Events.on(engine, 'beforeUpdate', () => {
    for (const body of starBodies) {
      const { x: vx, y: vy } = body.velocity;
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed < 0.3) {
        Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * 0.0005,
          y: (Math.random() - 0.5) * 0.0005,
        });
      }
      // Limitar velocidad máxima
      if (speed > 3) {
        Body.setVelocity(body, { x: vx * 0.9, y: vy * 0.9 });
      }
    }
  });

  // ---- Resize ----
  window.addEventListener('resize', () => {
    const nW = hero.clientWidth;
    const nH = hero.clientHeight;
    render.canvas.width = nW;
    render.canvas.height = nH;
    bgCanvas.width = nW;
    bgCanvas.height = nH;
    Render.setPixelRatio(render, window.devicePixelRatio);
  });
}

// ---- Utilidades ----
function isNearBody(body, mx, my, threshold) {
  const { x, y } = body.position;
  return Math.hypot(x - mx, y - my) < threshold;
}

function flashCard(el) {
  el.style.transition = 'box-shadow 0.3s';
  el.style.boxShadow = '0 0 0 3px #b48aff, 0 0 30px rgba(180,138,255,0.4)';
  setTimeout(() => {
    el.style.boxShadow = '';
  }, 1200);
}

// ---- Arrancar cuando carga la página ----
document.addEventListener('DOMContentLoaded', initMatter);
