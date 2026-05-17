const { Engine, Runner, Bodies, Body, Events, Composite } = Matter;

const STAR_IMG = 'assets/e4e1f376-bfc9-4d04-8957-f723b935d7c8.png';

// 6 estrellas: 3 izquierda, 3 derecha — todas interactivas
const STARS = [
  { side: 'left',  size: 90,  href: '#contact' },
  { side: 'left',  size: 70,  href: '#contact' },
  { side: 'left',  size: 80,  href: '#contact' },
  { side: 'right', size: 85,  href: '#contact' },
  { side: 'right', size: 72,  href: '#contact' },
  { side: 'right', size: 95,  href: '#contact' },
];

function makeStarEl(size) {
  const el = document.createElement('div');
  el.className = 'star star-interactive';
  el.style.width  = size + 'px';
  el.style.height = size + 'px';
  el.innerHTML = `
    <img class="star-img" src="${STAR_IMG}" alt="" draggable="false" />
    <div class="star-label">click me!</div>
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

  // Zona central protegida (foto) — barreras físicas invisibles
  // La foto ocupa aprox. el 40% central de la pantalla
  const PHOTO_L = W * 0.30;
  const PHOTO_R = W * 0.70;

  const wallOpts = { isStatic: true, collisionFilter: { category: 0x0002 } };
  Composite.add(world, [
    Bodies.rectangle(W / 2,   -25, W,  50, wallOpts), // techo
    Bodies.rectangle(W / 2, H + 25, W,  50, wallOpts), // suelo
    Bodies.rectangle(  -25, H / 2, 50,  H,  wallOpts), // pared izquierda
    Bodies.rectangle(W + 25, H / 2, 50,  H,  wallOpts), // pared derecha
    Bodies.rectangle(PHOTO_L, H / 2,  8,  H,  wallOpts), // borde izq. foto
    Bodies.rectangle(PHOTO_R, H / 2,  8,  H,  wallOpts), // borde der. foto
  ]);

  const allStars = [];

  STARS.forEach(star => {
    const { size, side, href } = star;
    const r = size / 2;

    // Posición inicial dentro de su zona (izquierda o derecha)
    let x, y;
    if (side === 'left') {
      x = r + Math.random() * (PHOTO_L - r * 2.5);
      y = H * 0.15 + Math.random() * H * 0.65;
    } else {
      x = PHOTO_R + r + Math.random() * (W - PHOTO_R - r * 2.5);
      y = H * 0.15 + Math.random() * H * 0.65;
    }

    const el = makeStarEl(size);
    container.appendChild(el);

    const body = Bodies.circle(x, y, r, {
      frictionAir: 0.008,
      restitution: 0.85,
      collisionFilter: { category: 0x0001, mask: 0x0002 | 0x0001 },
    });
    Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.04);
    Composite.add(world, body);

    el.addEventListener('click', () => {
      window.location.href = href;
    });

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
