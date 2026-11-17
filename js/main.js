(function () {
  'use strict';
  var WA_NUMBER = '5567998295633';
  var HDR = 84;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  $('#ano').textContent = new Date().getFullYear();

  /* ---------- Lenis (scroll suave) ---------- */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    window.lenis = lenis;
  }
  function scrollY() { return lenis ? lenis.scroll : window.scrollY; }
  function goTo(target) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -HDR + 1 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
  function stopScroll() { if (lenis) lenis.stop(); }
  function startScroll() { if (lenis) lenis.start(); }

  /* âncoras */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      goTo(el);
      history.replaceState(null, '', id);
    });
  });

  /* ---------- Header / voltar ao topo ---------- */
  var header = $('.header'), toTop = $('#toTop'), solid = null, shown = null;
  function onScroll() {
    var y = scrollY(), s = y > 40, t = y > 700;
    if (s !== solid) { solid = s; header.classList.toggle('is-solid', s); }
    if (t !== shown) { shown = t; toTop.classList.toggle('show', t); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () {
    if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Menu mobile ---------- */
  var burger = $('#burger'), menu = $('#menu');
  function closeMenu() {
    if (!menu.classList.contains('open')) return;
    menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Abrir menu'); startScroll();
  }
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    open ? stopScroll() : startScroll();
  });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Revelação do título (palavra a palavra) ---------- */
  $$('.split').forEach(function (h) {
    var n = 0;
    function wrap(node, extra) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'); o.className = 'w' + (extra ? ' ' + extra : '');
            var i = document.createElement('span'); i.textContent = w; i.style.transitionDelay = (0.15 + n++ * 0.09) + 's';
            o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) {
          var cls = c.classList.contains('grad') ? 'grad' : extra;
          wrap(c, cls);
          if (c.classList.contains('grad')) {
            var kids = Array.prototype.slice.call(c.childNodes);
            kids.forEach(function (k) { c.parentNode.insertBefore(k, c); });
            c.parentNode.removeChild(c);
          }
        }
      });
    }
    wrap(h, '');
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('is-in'); }); });
  });

  /* ---------- Reveal + contadores ---------- */
  var revealEls = $$('.reveal');
  function countUp(el) {
    var to = +el.dataset.count, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1200, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          $$('[data-count]', en.target).forEach(countUp);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el, i) {
      if (!el.style.transitionDelay) el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    $$('[data-count]').forEach(function (el) { el.textContent = el.dataset.count; });
  }

  /* ---------- Link ativo por seção ---------- */
  var links = $$('.nav a[href^="#"]:not(.nav__cta)');
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          var l = map[en.target.id]; if (l) l.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  }

  /* ---------- Símbolo: dispara animação ao entrar na tela ---------- */
  var sym = $('.symbol');
  if (sym && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en, ob) {
      if (en[0].isIntersecting) { sym.classList.add('is-in'); ob.disconnect(); }
    }, { threshold: 0.3 }).observe(sym);
  } else if (sym) { sym.classList.add('is-in'); }

  /* ---------- Parallax no rolamento + progresso da timeline + mouse ---------- */
  var par = $$('[data-speed]').map(function (el) { return { el: el, speed: parseFloat(el.dataset.speed) || 0, mid: 0 }; });
  var steps = $('.steps'), stepsTop = 0, stepsH = 1;
  var vh = window.innerHeight;
  function measure() {
    vh = window.innerHeight;
    var y = window.scrollY;
    par.forEach(function (p) {
      var prev = p.el.style.translate; p.el.style.translate = 'none';
      var r = p.el.getBoundingClientRect();
      p.mid = r.top + y + r.height / 2;
      p.el.style.translate = prev;
    });
    if (steps) { var r2 = steps.getBoundingClientRect(); stepsTop = r2.top + y; stepsH = r2.height; }
    lastY = -1; lastSteps = -1;
  }
  var mx = 0, my = 0, tx = 0, ty = 0, lastY = -1, lastSteps = -1;
  var depthEls = $$('[data-depth]');
  function frame(time) {
    if (lenis) lenis.raf(time);
    var y = scrollY(), c = y + vh / 2;
    if (!reduce) {
      if (Math.abs(y - lastY) > 0.05) {
        lastY = y;
        for (var i = 0; i < par.length; i++) {
          var p = par[i];
          if (Math.abs(p.mid - c) < vh * 1.6) p.el.style.translate = '0 ' + ((c - p.mid) * p.speed).toFixed(1) + 'px';
        }
      }
      if (fine && (Math.abs(mx - tx) > 0.001 || Math.abs(my - ty) > 0.001)) {
        tx += (mx - tx) * 0.07; ty += (my - ty) * 0.07;
        for (var j = 0; j < depthEls.length; j++) {
          var d = parseFloat(depthEls[j].dataset.depth);
          depthEls[j].style.translate = (tx * d).toFixed(1) + 'px ' + (ty * d).toFixed(1) + 'px';
        }
      }
    }
    if (steps && Math.abs(y - lastSteps) > 0.05) {
      lastSteps = y;
      var pr =Math.min(1, Math.max(0, (y + vh * 0.7 - stepsTop) / (stepsH + vh * 0.2)));
      steps.style.setProperty('--p', pr.toFixed(3));
    }
    requestAnimationFrame(frame);
  }
  if (fine && !reduce) {
    var hero = $('.hero');
    hero.addEventListener('mousemove', function (e) {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    hero.addEventListener('mouseleave', function () { mx = 0; my = 0; });
  }
  /* resize: ignora mudanças só de altura (barra de endereço do celular) e agrupa chamadas */
  var lastW = window.innerWidth, rzT = 0;
  function onResize() {
    clearTimeout(rzT);
    rzT = setTimeout(function () {
      if (window.innerWidth !== lastW) { lastW = window.innerWidth; document.dispatchEvent(new Event('orion:resize')); }
      measure();
    }, 150);
  }
  measure();
  window.addEventListener('load', measure);
  window.addEventListener('resize', onResize);

  /* pausa animações CSS das seções fora da tela */
  if ('IntersectionObserver' in window) {
    var vis = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-off', !en.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    $$('.hero, .sec--sym, #sobre, .steps, .marquee, .for').forEach(function (el) { vis.observe(el); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  requestAnimationFrame(frame);

  /* ---------- Tilt 3D nos cartões ---------- */
  if (fine && !reduce) {
    $$('.tile, .step-card, .pillar, .card').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(700px) rotateX(' + (-py * 7).toFixed(2) + 'deg) rotateY(' + (px * 9).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Filtro de produtos ---------- */
  var tabs = $$('.tab'), cards = $$('#cards .card');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false'); });
      t.classList.add('is-active'); t.setAttribute('aria-selected', 'true');
      var f = t.dataset.filter;
      cards.forEach(function (c) {
        c.classList.toggle('is-hidden', f !== 'todos' && c.dataset.cat !== f);
        c.classList.add('in');
      });
      setTimeout(measure, 50);
    });
  });

  /* "Quero saber mais" -> pré-seleciona interesse */
  $$('[data-interest]').forEach(function (b) {
    b.addEventListener('click', function () {
      var sel = $('#interesse'), v = b.dataset.interest;
      for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].text === v) { sel.selectedIndex = i; break; } }
      goTo('#contato');
      setTimeout(function () { $('#nome').focus({ preventScroll: true }); }, 900);
    });
  });

  /* Acordeões: um aberto por vez */
  $$('[data-acc]').forEach(function (acc) {
    var items = $$('details', acc);
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; });
        setTimeout(measure, 450);
      });
    });
  });

  /* Modal */
  $$('[data-open]').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = document.getElementById(b.dataset.open);
      if (m && m.showModal) { m.showModal(); stopScroll(); m.addEventListener('close', startScroll, { once: true }); }
    });
  });

  /* Máscara de telefone */
  var tel = $('#tel');
  tel.addEventListener('input', function () {
    var d = tel.value.replace(/\D/g, '').slice(0, 11), r = d;
    if (d.length > 10) r = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    else if (d.length > 6) r = '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    else if (d.length > 2) r = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    else if (d.length) r = '(' + d;
    tel.value = r;
  });

  /* Formulário -> WhatsApp */
  var form = $('#form');
  function setErr(input, msg) {
    var f = input.closest('.field'); if (!f) return;
    f.classList.toggle('has-error', !!msg);
    $('.err', f).textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true, first = null;
    var nome = $('#nome'), cidade = $('#cidade'), inter = $('#interesse'), lgpd = $('#lgpd');
    function bad(el, msg) { setErr(el, msg); ok = false; if (!first) first = el; }
    nome.value.trim().split(/\s+/).length < 2 ? bad(nome, 'Informe nome e sobrenome.') : setErr(nome, '');
    var digits = tel.value.replace(/\D/g, '');
    (digits.length < 10) ? bad(tel, 'Informe um WhatsApp válido com DDD.') : setErr(tel, '');
    cidade.value.trim().length < 2 ? bad(cidade, 'Informe sua cidade.') : setErr(cidade, '');
    !inter.value ? bad(inter, 'Selecione uma opção.') : setErr(inter, '');
    $('#lgpd-err').textContent = lgpd.checked ? '' : 'É necessário concordar para continuar.';
    if (!lgpd.checked) { ok = false; if (!first) first = lgpd; }
    if (!ok) { first.focus(); return; }

    var valor = $('#valor').value, msg = $('#msg').value.trim();
    var text = 'Olá! Vim pelo site da ORION Soluções em Crédito e gostaria de uma simulação de consórcio.\n\n' +
      '*Nome:* ' + nome.value.trim() + '\n' +
      '*WhatsApp:* ' + tel.value + '\n' +
      '*Cidade/UF:* ' + cidade.value.trim() + '\n' +
      '*Interesse:* ' + inter.value + '\n' +
      (valor ? '*Crédito desejado:* ' + valor + '\n' : '') +
      (msg ? '*Mensagem:* ' + msg + '\n' : '');
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
    window.open(url, '_blank', 'noopener');
  });
  $$('input,select', form).forEach(function (el) {
    el.addEventListener('input', function () { if (el.closest('.field')) setErr(el, ''); });
  });

  /* ---------- Céu estrelado (canvas) ---------- */
  var cv = $('#stars');
  if (cv && !reduce) {
    var ctx = cv.getContext('2d'), stars = [], w, h, raf = 0, onScreen = true;
    var size = function () {
      var small = window.innerWidth < 760;
      var dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(Math.round(w * h / (small ? 14000 : 8000)), 140); stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + .3, p: Math.random() * 6.28, s: Math.random() * .02 + .005, v: Math.random() * .12 + .02 });
    };
    var draw = function () {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i]; s.p += s.s; s.y -= s.v; if (s.y < -2) { s.y = h + 2; s.x = Math.random() * w; }
        ctx.globalAlpha = .25 + .55 * Math.abs(Math.sin(s.p));
        ctx.fillStyle = i % 9 === 0 ? '#4DA3FF' : '#CFE3FF';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      raf = onScreen && !document.hidden ? requestAnimationFrame(draw) : 0;
    };
    var kick = function () { if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(draw); };
    size(); draw();
    document.addEventListener('orion:resize', size);
    document.addEventListener('visibilitychange', kick);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; kick(); }).observe(cv);
    }
  }
})();
