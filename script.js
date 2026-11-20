(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Split hero letters ---------- */
  $$('[data-split]').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach(ch => {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch;
      s.setAttribute('aria-hidden', 'true');
      el.appendChild(s);
    });
  });
  $$('.hero .char').forEach((c, i) => c.style.setProperty('--i', i));

  /* ---------- Loader ---------- */
  const loader = $('.loader');
  const countEl = $('#loadCount');
  const finish = () => {
    loader.classList.add('is-done');
    document.body.classList.add('is-ready');
    setTimeout(() => loader.remove(), 1100);
  };
  if (reduce) {
    finish();
  } else {
    const dur = 1300, t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const v = Math.round(e * 100);
      countEl.textContent = String(v).padStart(3, '0');
      loader.style.setProperty('--p', v + '%');
      $('.loader__bar span').style.width = v + '%';
      p < 1 ? requestAnimationFrame(tick) : setTimeout(finish, 180);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Clock (Ghana = GMT) ---------- */
  const clock = $('#clock');
  const setClock = () => {
    clock.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Accra', hour: '2-digit', minute: '2-digit' });
  };
  setClock(); setInterval(setClock, 15000);
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Nav hide on scroll ---------- */
  const nav = $('.nav');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
  }, { passive: true });

  /* ---------- Hero variable-font proximity ---------- */
  const chars = $$('.hero .char');
  let mx = -9999, my = -9999, pointerActive = false;
  if (!reduce) {
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; pointerActive = true; }, { passive: true });
    const hero = $('.hero');
    const heroLoop = t => {
      const r = hero.getBoundingClientRect();
      if (r.bottom > 0) {
        chars.forEach((c, i) => {
          let k;
          if (pointerActive && finePointer) {
            const b = c.getBoundingClientRect();
            const d = Math.hypot(mx - (b.left + b.width / 2), my - (b.top + b.height / 2));
            k = Math.max(0, 1 - d / 420);
          } else {
            k = (Math.sin(t / 900 - i * .55) + 1) / 2;
          }
          c.style.setProperty('--wg', (300 + k * 500).toFixed(0));
          c.style.setProperty('--wd', (100 - k * 25).toFixed(1));
        });
      }
      requestAnimationFrame(heroLoop);
    };
    requestAnimationFrame(heroLoop);
  }

  /* ---------- Cursor + glow ---------- */
  const cursor = $('.cursor');
  const glow = $('.glow');
  if (finePointer && !reduce) {
    document.body.classList.add('has-cursor');
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy, gx = cx, gy = cy;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; glow.style.opacity = 1; }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * .22; cy += (ty - cy) * .22;
      gx += (tx - gx) * .06; gy += (ty - gy) * .06;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      glow.style.left = gx + 'px'; glow.style.top = gy + 'px';
      requestAnimationFrame(loop);
    };
    loop();
    const label = $('.cursor__label');
    document.addEventListener('pointerover', e => {
      const big = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button');
      cursor.classList.toggle('is-big', !!big);
      cursor.classList.toggle('is-link', !big && !!link);
      if (big) label.textContent = big.dataset.cursor;
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduce) {
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * .25}px, ${y * .35}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1)';
        el.style.transform = '';
        setTimeout(() => (el.style.transition = ''), 600);
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  $$('.section-head, .note, .bento__cell, .arch__row, .about__img, .about__body, .stat, .contact__row, .tcard').forEach((el, i) => {
    el.setAttribute('data-reveal', '');
    el.style.transitionDelay = ((i % 4) * 70) + 'ms';
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal], .case, .tower').forEach(el => io.observe(el));

  /* ---------- Counters ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count;
      countIO.unobserve(el);
      if (reduce) { el.textContent = end; return; }
      const t0 = performance.now(), dur = 1400;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round((1 - Math.pow(1 - p, 4)) * end);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Statement word scrub ---------- */
  const st = $('[data-words]');
  if (st) {
    const words = st.textContent.trim().split(/\s+/);
    st.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    const ws = $$('.w', st);
    const scrub = () => {
      const r = st.getBoundingClientRect();
      const start = innerHeight * .85, end = innerHeight * .3;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * .6)));
      const n = Math.round(p * ws.length);
      ws.forEach((w, i) => w.classList.toggle('on', i < n));
    };
    if (reduce) ws.forEach(w => w.classList.add('on'));
    else { addEventListener('scroll', scrub, { passive: true }); scrub(); }
  }

  /* ---------- LexiAid read-along ---------- */
  const lexi = $('#lexi');
  if (lexi) {
    const words = lexi.textContent.trim().split(/\s+/);
    lexi.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    const ws = $$('.w', lexi);
    let i = 0;
    if (!reduce) setInterval(() => {
      ws.forEach((w, j) => { w.classList.toggle('now', j === i); w.classList.toggle('past', j < i); });
      i = (i + 1) % (ws.length + 3);
    }, 380);
  }

  /* ---------- MeetActions waveform ---------- */
  const wave = $('#maWave');
  if (wave) {
    const bars = Array.from({ length: 42 }, () => wave.appendChild(document.createElement('i')));
    let visible = false;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(wave);
    const animate = t => {
      if (visible) {
        bars.forEach((b, i) => {
          const v = Math.abs(Math.sin(t / 260 + i * .45) * Math.sin(t / 700 + i * .13)) * .85 + Math.random() * .15;
          b.style.height = (8 + v * 92) + '%';
        });
      }
      if (!reduce) setTimeout(() => requestAnimationFrame(animate), 90);
    };
    requestAnimationFrame(animate);
  }

  /* ---------- Copy email ---------- */
  const mailBtn = $('#copyMail');
  mailBtn.addEventListener('click', async () => {
    const hint = $('#mailHint');
    try {
      await navigator.clipboard.writeText('triggerstorm100@gmail.com');
      hint.textContent = 'Copied ✓ Talk soon';
    } catch {
      location.href = 'mailto:triggerstorm100@gmail.com';
    }
    setTimeout(() => (hint.textContent = 'Click to copy'), 2400);
  });
})();

/* ---------- Screenshot galleries ---------- */
(() => {
  const lb = document.getElementById('lb');
  if (!lb) return;
  const img = lb.querySelector('img');
  const cap = lb.querySelector('.lb__cap');
  const count = lb.querySelector('.lb__count');
  let items = [], idx = 0;

  const show = i => {
    idx = (i + items.length) % items.length;
    const [src, text] = items[idx];
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    img.src = src; img.alt = text;
    cap.textContent = text;
    count.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    // warm the next image
    const next = new Image(); next.src = items[(idx + 1) % items.length][0];
  };
  const open = (list, start) => {
    items = list; show(start);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
  };
  const close = () => { lb.close ? lb.close() : lb.removeAttribute('open'); };
  lb.addEventListener('close', () => { document.body.style.overflow = ''; });

  document.querySelectorAll('[data-gallery]').forEach(v => {
    let list;
    try { list = JSON.parse(v.dataset.gallery); } catch { return; }
    v.setAttribute('data-cursor', 'View');
    v.addEventListener('click', e => {
      const fig = e.target.closest('[data-open]');
      const start = fig ? Math.max(0, list.findIndex(([src]) => src.includes(fig.dataset.open + '.'))) : 0;
      open(list, start);
    });
  });

  lb.querySelector('.lb__close').addEventListener('click', close);
  lb.querySelector('.lb__prev').addEventListener('click', () => show(idx - 1));
  lb.querySelector('.lb__next').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (!lb.open) return;
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });
  let sx = null;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    sx = null;
  });
})();
