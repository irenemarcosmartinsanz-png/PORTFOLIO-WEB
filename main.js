const { Engine, Runner, Bodies, Body, Events, Composite } = Matter;

var imagenEstrella = 'assets/e4e1f376-bfc9-4d04-8957-f723b935d7c8.png';
var imagenAmarilla = 'assets/yellowstar.png';

// las 6 estrellas principales, 3 a cada lado
var estrellas = [
  { lado: 'izq', tamaño: 125, link: '#contact' },
  { lado: 'izq', tamaño: 100, link: '#contact' },
  { lado: 'izq', tamaño: 115, link: '#contact' },
  { lado: 'der', tamaño: 120, link: '#contact' },
  { lado: 'der', tamaño: 105, link: '#contact' },
  { lado: 'der', tamaño: 135, link: '#contact' },
];

function crearEstrella(tamaño) {
  var div = document.createElement('div');
  div.className = 'star star-interactive';
  div.style.width = tamaño + 'px';
  div.style.height = tamaño + 'px';
  div.innerHTML = '<img class="star-img" src="' + imagenEstrella + '" draggable="false" />'
                + '<div class="star-label">click me!</div>';
  return div;
}

function crearEstrellaAmarilla(tamaño) {
  var div = document.createElement('div');
  div.className = 'star';
  div.style.width = tamaño + 'px';
  div.style.height = tamaño + 'px';
  div.innerHTML = '<img class="star-img" src="' + imagenAmarilla + '" draggable="false" />';
  return div;
}

// estrellas amarillas — proyectos futuros, solo flotan
var estrellasAmarillas = [
  { tamaño: 65, lado: 'izq' },
  { tamaño: 50, lado: 'der' },
  { tamaño: 72, lado: 'izq' },
  { tamaño: 55, lado: 'der' },
  { tamaño: 60, lado: 'izq' },
  { tamaño: 68, lado: 'der' },
];

function init() {
  var hero = document.getElementById('hero');
  var contenedor = document.getElementById('stars-container');

  var W = hero.clientWidth;
  var H = hero.clientHeight;

  // motor de fisicas sin gravedad
  var engine = Engine.create({ gravity: { x: 0, y: 0 } });
  var world = engine.world;

  // zona de la foto aprox en el centro (30% - 70%)
  var fotoIzq = W * 0.30;
  var fotoDer = W * 0.70;

  // paredes para que no se salgan + bordes de la foto
  var paredOpts = { isStatic: true };
  Composite.add(world, [
    Bodies.rectangle(W / 2, 75,     W,  20, paredOpts), // techo bajo el nav
    Bodies.rectangle(W / 2, H + 25, W,  50, paredOpts),
    Bodies.rectangle(-25,   H / 2,  50, H,  paredOpts),
    Bodies.rectangle(W + 25, H / 2, 50, H,  paredOpts),
  ]);

  var todasLasEstrellas = [];

  estrellas.forEach(function(estrella) {
    var r = estrella.tamaño / 2;
    var x, y;

    if (estrella.lado === 'izq') {
      x = r + Math.random() * (fotoIzq - r * 2.5);
    } else {
      x = fotoDer + r + Math.random() * (W - fotoDer - r * 2.5);
    }
    y = H * 0.15 + Math.random() * H * 0.65;

    var el = crearEstrella(estrella.tamaño);
    contenedor.appendChild(el);

    var cuerpo = Bodies.circle(x, y, r, {
      frictionAir: 0.001,
      restitution: 0.85
    });

    Body.setVelocity(cuerpo, {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2
    });
    Body.setAngularVelocity(cuerpo, (Math.random() - 0.5) * 0.04);

    Composite.add(world, cuerpo);

    // al pasar el raton encima frena para poder clickar bien
    el.addEventListener('mouseenter', function() {
      cuerpo.frictionAir = 0.15;
      Body.setVelocity(cuerpo, {
        x: cuerpo.velocity.x * 0.2,
        y: cuerpo.velocity.y * 0.2
      });
    });
    el.addEventListener('mouseleave', function() {
      cuerpo.frictionAir = 0.001;
    });

    // al hacer click va al link
    el.addEventListener('click', function() {
      window.location.href = estrella.link;
    });

    todasLasEstrellas.push({ el: el, cuerpo: cuerpo });
  });

  // estrellas amarillas (proyectos futuros)
  estrellasAmarillas.forEach(function(e) {
    var r = e.tamaño / 2;
    var x, y;
    if (e.lado === 'izq') {
      x = r + Math.random() * (W * 0.45 - r * 2);
    } else {
      x = W * 0.55 + Math.random() * (W * 0.45 - r * 2);
    }
    y = 100 + Math.random() * (H - 160);

    var el = crearEstrellaAmarilla(e.tamaño);
    contenedor.appendChild(el);

    var cuerpo = Bodies.circle(x, y, r, {
      frictionAir: 0.001,
      restitution: 0.85
    });
    Body.setVelocity(cuerpo, {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2
    });
    Body.setAngularVelocity(cuerpo, (Math.random() - 0.5) * 0.04);
    Composite.add(world, cuerpo);

    todasLasEstrellas.push({ el: el, cuerpo: cuerpo });
  });

  // si una estrella se para le damos un empujoncito
  Events.on(engine, 'beforeUpdate', function() {
    todasLasEstrellas.forEach(function(s) {
      var vel = s.cuerpo.velocity;
      if (Math.sqrt(vel.x * vel.x + vel.y * vel.y) < 0.8) {
        Body.applyForce(s.cuerpo, s.cuerpo.position, {
          x: (Math.random() - 0.5) * 0.0002,
          y: (Math.random() - 0.5) * 0.0002
        });
      }
    });
  });

  // raton rapido = alborota las estrellas cercanas
  var mouseX = 0, mouseY = 0;
  var mouseXant = 0, mouseYant = 0;

  hero.addEventListener('mousemove', function(e) {
    var rect = hero.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    var dx = mouseX - mouseXant;
    var dy = mouseY - mouseYant;
    var velocidad = Math.sqrt(dx * dx + dy * dy);

    // solo si el raton va rapido
    if (velocidad > 3) {
      todasLasEstrellas.forEach(function(s) {
        var ex = s.cuerpo.position.x - mouseX;
        var ey = s.cuerpo.position.y - mouseY;
        var distancia = Math.sqrt(ex * ex + ey * ey);

        // solo afecta a las estrellas que estan cerca
        if (distancia < 220 && distancia > 0) {
          var fuerza = (velocidad / distancia) * 0.006;
          Body.applyForce(s.cuerpo, s.cuerpo.position, {
            x: (ex / distancia) * fuerza,
            y: (ey / distancia) * fuerza
          });
        }
      });
    }

    mouseXant = mouseX;
    mouseYant = mouseY;
  });

  Runner.run(Runner.create(), engine);

  // bucle para actualizar la posicion de cada estrella
  function animar() {
    todasLasEstrellas.forEach(function(s) {
      s.el.style.left = s.cuerpo.position.x + 'px';
      s.el.style.top  = s.cuerpo.position.y + 'px';
      s.el.querySelector('.star-img').style.transform = 'rotate(' + s.cuerpo.angle + 'rad)';
    });
    requestAnimationFrame(animar);
  }
  animar();

  window.addEventListener('resize', function() {
    location.reload();
  });
}

document.addEventListener('DOMContentLoaded', init);
