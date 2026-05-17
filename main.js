const { Engine, Runner, Bodies, Body, Events, Composite } = Matter;

// ── Proyectos: cada uno es una estrella interactiva ──────────────────────────
const PROJECTS = [
  { id: 'project-1', name: 'Proyecto 1', size: 54 },
  { id: 'project-2', name: 'Proyecto 2', size: 40 },
  { id: 'project-3', name: 'Proyecto 3', size: 48 },
];

// Estrellas decorativas extra (solo flotan, sin interacción)
const DECO_SIZES = [28, 22, 35, 20];

// SVG de estrella de 5 puntas rellena
const starSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">
  <polygon
    points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
    fill="#111111"
  />
</svg>`;

// ── Main ─────────────────────────────────────────────────────────────────────
function init() {
  const hero      = document.getElementById('hero');
  const container = document.getElementById('stars-container');
  const cursor    = document.getElementById('cursor-follow');

  const W = hero.clientWidth;
  const H = hero.clientHeight;

  // ── Motor de física (sin gravedad) ──
  const engine = Engine.create({ gravity: { x: 0, y: 0 } });
  const world  = engine.world;

  // Paredes invisibles
  const wallOpts = { isStatic: true, render: { visible: false } };
  Composite.add(world, [
    Bodies.rectangle(W / 2,   -25, W,   50, wallOpts),
    Bodies.rectangle(W / 2, H + 25, W,   50, wallOpts),
    Bodies.rectangle(  -25, H / 2, 50,  H,  wallOpts),
    Bodies.rectangle(W + 25, H / 2, 50,  H,  wallOpts),
  ]);

  const allStars = [];

  // ── Estrellas de proyectos (interactivas) ──
  PROJECTS.forEach((proj, i) => {
    const size = proj.size;

    // Posición inicial distribuida horizontalmente con algo de aleatoriedad
    const x = W * (0.15 + 0.28 * i) + (Math.random() - 0.5) * 80;
    const y = H * (0.25 + Math.random() * 0.5);

    // Elemento DOM
    const el = document.createElement('div');
    el.className  = 'star star-interactive';
    el.style.width  = size + 'px';
    el.style.height = size + 'px';
    el.innerHTML = `
      <div class="star-svg">${starSVG}</div>
      <div class="star-label">${proj.name}</div>
    `;
    container.appendChild(el);

    // Cuerpo físico (círculo — el visual es el div)
    const body = Bodies.circle(x, y, size / 2, {
      frictionAir: 0.008,
      restitution: 0.85,
      label: proj.id,
    });
    Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.04);
    Composite.add(world, body);

    allStars.push({ el, body, proj, interactive: true });
  });

  // ── Estrellas decorativas ──
  DECO_SIZES.forEach(size => {
    const x = W * 0.05 + Math.random() * W * 0.9;
    const y = H * 0.05 + Math.random() * H * 0.9;

    const el = document.createElement('div');
    el.className  = 'star star-deco';
    el.style.width  = size + 'px';
    el.style.height = size + 'px';
    el.innerHTML = `<div class="star-svg">${starSVG}</div>`;
    container.appendChild(el);

    const body = Bodies.circle(x, y, size / 2, {
      frictionAir: 0.01,
      restitution: 0.8,
    });
    Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 1.5,
      y: (Math.random() - 0.5) * 1.5,
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);
    Composite.add(world, body);

    allStars.push({ el, body, interactive: false });
  });

  // ── Cursor personalizado: sigue al ratón dentro del hero ──
  hero.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });

  // ── Hover e interacción en estrellas de proyectos ──
  allStars.filter(s => s.interactive).forEach(star => {
    star.el.addEventListener('mouseenter', () => {
      cursor.classList.add('visible');
    });
    star.el.addEventListener('mouseleave', () => {
      cursor.classList.remove('visible');
    });
    star.el.addEventListener('click', () => {
      const target = document.getElementById(star.proj.id);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash de highlight al llegar
      target.classList.add('highlight');
      setTimeout(() => target.classList.remove('highlight'), 900);
    });
  });

  // ── Mantener las estrellas en movimiento (evitar que se paren) ──
  Events.on(engine, 'beforeUpdate', () => {
    for (const { body } of allStars) {
      const { x: vx, y: vy } = body.velocity;
      if (Math.hypot(vx, vy) < 0.4) {
        Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * 0.00035,
          y: (Math.random() - 0.5) * 0.00035,
        });
      }
    }
  });

  // ── Loop RAF: sincronizar posición CSS con el cuerpo físico ──
  Runner.run(Runner.create(), engine);

  function tick() {
    for (const { el, body } of allStars) {
      const { x, y } = body.position;
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
      // Rotar el SVG interno según el ángulo del cuerpo
      el.querySelector('.star-svg').style.transform = `rotate(${body.angle}rad)`;
    }
    requestAnimationFrame(tick);
  }
  tick();

  // ── Resize: reconstruir paredes ──
  window.addEventListener('resize', () => {
    // Recargar es lo más sencillo; en producción se actualizarían las paredes
    location.reload();
  });
}

document.addEventListener('DOMContentLoaded', init);
