const { Engine, Runner, Bodies, Body, Events, Composite } = Matter;

const STAR_IMG = 'assets/e4e1f376-bfc9-4d04-8957-f723b935d7c8.png';

const PROJECTS = [
  { id: 'project-1', size: 72 },
  { id: 'project-2', size: 60 },
  { id: 'project-3', size: 68 },
];

const DECO_SIZES = [55, 48, 64];

function makeStarEl(size, interactive) {
  const el = document.createElement('div');
  el.className = 'star ' + (interactive ? 'star-interactive' : 'star-deco');
  el.style.width  = size + 'px';
  el.style.height = size + 'px';
  el.innerHTML = `
    <img class="star-img" src="${STAR_IMG}" alt="" draggable="false" />
    ${interactive ? '<div class="star-label">click me!</div>' : ''}
  `;
  return el;
}

function init() {
  const hero      = document.getElementById('hero');
  const container = document.getElementById('stars-container');
  const W = hero.clientWidth;
  const H = hero.clientHeight;

  const engine = Engine.create({ gravity: { x: 0, y: 0 } });
  const world  = engine.world;

  const wallOpts = { isStatic: true };
  Composite.add(world, [
    Bodies.rectangle(W / 2,   -25, W,  50, wallOpts),
    Bodies.rectangle(W / 2, H + 25, W,  50, wallOpts),
    Bodies.rectangle(  -25, H / 2, 50,  H, wallOpts),
    Bodies.rectangle(W + 25, H / 2, 50,  H, wallOpts),
  ]);

  const allStars = [];

  // Estrellas interactivas (una por proyecto)
  PROJECTS.forEach((proj, i) => {
    const { size } = proj;
    const x = W * (0.15 + 0.28 * i) + (Math.random() - 0.5) * 80;
    const y = H * (0.25 + Math.random() * 0.5);

    const el = makeStarEl(size, true);
    container.appendChild(el);

    const body = Bodies.circle(x, y, size / 2, { frictionAir: 0.008, restitution: 0.85 });
    Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.04);
    Composite.add(world, body);

    // Click → scroll al proyecto
    el.addEventListener('click', () => {
      const target = document.getElementById(proj.id);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('highlight');
      setTimeout(() => target.classList.remove('highlight'), 900);
    });

    allStars.push({ el, body });
  });

  // Estrellas decorativas
  DECO_SIZES.forEach(size => {
    const x = W * 0.05 + Math.random() * W * 0.9;
    const y = H * 0.05 + Math.random() * H * 0.9;

    const el = makeStarEl(size, false);
    container.appendChild(el);

    const body = Bodies.circle(x, y, size / 2, { frictionAir: 0.01, restitution: 0.8 });
    Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.5, y: (Math.random() - 0.5) * 1.5 });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);
    Composite.add(world, body);

    allStars.push({ el, body });
  });

  // Mantener movimiento mínimo
  Events.on(engine, 'beforeUpdate', () => {
    for (const { body } of allStars) {
      if (Math.hypot(body.velocity.x, body.velocity.y) < 0.4) {
        Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * 0.00035,
          y: (Math.random() - 0.5) * 0.00035,
        });
      }
    }
  });

  // Loop RAF: sincronizar posición y rotación con el body físico
  Runner.run(Runner.create(), engine);

  function tick() {
    for (const { el, body } of allStars) {
      el.style.left = body.position.x + 'px';
      el.style.top  = body.position.y + 'px';
      el.querySelector('.star-img').style.transform = `rotate(${body.angle}rad)`;
    }
    requestAnimationFrame(tick);
  }
  tick();

  window.addEventListener('resize', () => location.reload());
}

document.addEventListener('DOMContentLoaded', init);
