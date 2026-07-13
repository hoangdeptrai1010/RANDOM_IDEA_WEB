document.addEventListener('DOMContentLoaded', () => {

  /* ============================================
     3D CHARACTER — MOUSE FOLLOW
  ============================================ */
  const character = document.getElementById('character-wrapper');
  const charImg = document.getElementById('character-img');
  let mouseX = 0, mouseY = 0;
  let charX = 0, charY = 0;
  const ease = 0.08; // smoothing factor

  document.addEventListener('mousemove', (e) => {
    // Normalized mouse position: -1 to 1
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

    // 3D Parallax on hero layers
    const layers = document.querySelectorAll('.hero-layer');
    layers.forEach(layer => {
      const depth = parseFloat(layer.dataset.depth) || 0;
      const moveX = mouseX * depth * 60;
      const moveY = mouseY * depth * 40;
      layer.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  });

  // Smooth character animation loop
  function animateAll() {
    // --- 3D Character lerp ---
    charX += (mouseX * 30 - charX) * ease;
    charY += (mouseY * -15 - charY) * ease;
    const tilt = mouseX * 5;
    if (character) character.style.transform = `translate(${charX}px, ${charY}px) rotate(${tilt * 0.3}deg)`;
    const scale = 1 + mouseY * 0.02;
    if (charImg) charImg.style.transform = `scaleX(${mouseX > 0 ? 1 : -1 }) scale(${scale})`;

    requestAnimationFrame(animateAll);
  }
  animateAll();

  // Hide character when scrolled past hero
  const hero = document.getElementById('hero-3d');
  if (hero) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            character.classList.remove('hidden');
          } else {
            character.classList.add('hidden');
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(hero);
  }

  /* ============================================
     TAB SWITCHING
  ============================================ */
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.page-section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.hasAttribute('data-target')) return; // Ignore non-tab buttons

      const targetId = btn.dataset.target;

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      sections.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
      });

      const target = document.getElementById(targetId);
      target.style.display = 'block';
      // Force reflow for animation
      void target.offsetHeight;
      target.classList.add('active');

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Show/hide character based on tab
      if (targetId === 'section-about') {
        character.classList.remove('hidden');
      } else {
        character.classList.add('hidden');
      }

      // Re-trigger reveal animations
      setTimeout(revealElements, 100);
    });
  });

  /* ============================================
     SCROLL REVEAL
  ============================================ */
  function revealElements() {
    const items = document.querySelectorAll('.reveal-up');
    items.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight - 60;

      if (inView) {
        // Stagger the reveal
        setTimeout(() => {
          el.classList.add('visible');
        }, i * 80);
      }
    });
  }

  window.addEventListener('scroll', revealElements);
  revealElements(); // Initial run

  /* ============================================
     BOOKING FORM (Discord Webhook Integration)
  ============================================ */
  const form = document.getElementById('booking-form');
  const sendBtn = document.getElementById('sendBtn');
  const successPanel = document.getElementById('success-panel');
  const resetBtn = document.getElementById('resetBtn');

  // Dán link Webhook Discord của bạn vào đây:
  const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1526093981694562488/dabv_89wJAhLPZRYsiWg78UM76_udPQ10nA64-PQU2Dhr9qiqdSDvSBjIssehMI0P9dG';

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('f-name').value;
      const contact = document.getElementById('f-contact').value;
      const activity = document.querySelector('input[name="activity"]:checked');

      if (!name || !contact || !activity) {
        sendBtn.style.animation = 'shake 0.4s ease';
        setTimeout(() => { sendBtn.style.animation = ''; }, 400);
        return;
      }

      sendBtn.classList.add('loading');

      const dateVal = document.getElementById('f-date').value || 'Chưa chọn';
      const msgVal = document.getElementById('f-msg').value || '—';

      // Chạy demo nếu chưa điền webhook
      if (DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL') {
        console.warn('Discord Webhook chưa cấu hình — chạy demo.');
        setTimeout(() => onSuccess(), 1200);
        return;
      }

      // Tạo payload định dạng Embed xịn sò cho Discord
      const payload = {
        username: "Lịch Hẹn Của Bạn",
        avatar_url: "https://raw.githubusercontent.com/hoangdeptrai1010/RANDOM_IDEA_WEB/main/assets/cat/orange_idle.png", // Ảnh đại diện của Bot (Mèo Cam)
        embeds: [{
          title: "💖 Có Lời Hẹn Mới Từ Portfolio!",
          color: 3432616, // Màu xanh premium của web (#3464a8)
          fields: [
            { name: "👤 Tên khách", value: name, inline: true },
            { name: "📞 Liên lạc", value: contact, inline: true },
            { name: "🙏 Hoạt động", value: activity.value, inline: true },
            { name: "📅 Ngày hẹn", value: dateVal, inline: true },
            { name: "💬 Lời nhắn", value: msgVal }
          ],
          timestamp: new Date().toISOString()
        }]
      };

      fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error('Không thể gửi đến Discord');
        onSuccess();
      })
      .catch((err) => {
        console.error(err);
        alert('Có lỗi xảy ra khi gửi! Bạn nhắn trực tiếp qua Zalo/Instagram giúp Hoàng nhé.');
        sendBtn.classList.remove('loading');
      });
    });
  }

  function onSuccess() {
    sendBtn.classList.remove('loading');
    form.style.display = 'none';
    successPanel.classList.add('visible');

    // Confetti
    if (typeof confetti === 'function') {
      const end = Date.now() + 2000;
      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#3464a8', '#5b8dd9', '#f5f0e8']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3464a8', '#5b8dd9', '#f5f0e8']
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
    }
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      form.style.display = 'flex';
      successPanel.classList.remove('visible');
    });
  }

  /* ============================================
     BACKGROUND MUSIC
  ============================================ */
  const bgm = document.getElementById('bgm');
  const bgmBtn = document.getElementById('bgm-btn');
  let isPlaying = false;

  if (bgm && bgmBtn) {
    bgm.volume = 0.5; // Default volume 50%
    
    const tryPlayMusic = () => {
      if (!isPlaying) {
        const playPromise = bgm.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            isPlaying = true;
            bgmBtn.innerHTML = '🔊';
            bgmBtn.style.opacity = '1';
            // Remove the interaction listeners once it starts successfully
            ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
              document.removeEventListener(evt, tryPlayMusic);
            });
          }).catch(err => {
            // Autoplay blocked, wait for user interaction
          });
        }
      }
    };

    // Attempt to play immediately (usually works if user previously allowed it)
    tryPlayMusic();
    
    // Fallback: If blocked, play upon the very first user interaction
    ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, tryPlayMusic, { once: true });
    });

    bgmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isPlaying) {
        tryPlayMusic();
      } else {
        bgm.pause();
        isPlaying = false;
        bgmBtn.innerHTML = '🎵';
        bgmBtn.style.opacity = '0.7';
      }
    });
  }

  /* ============================================
     WHITE DOG INTERACTION
  ============================================ */
  const dogContainer = document.getElementById('pixel-dog-container');
  const dogImg = document.getElementById('pixel-dog');
  
  if (dogContainer && dogImg) {
    let heartInterval = null;
    
    const spawnLargeHeart = () => {
      const heart = document.createElement('div');
      heart.className = 'large-heart-particle';
      dogContainer.appendChild(heart);
      
      setTimeout(() => {
        heart.remove();
      }, 1200);
    };

    dogContainer.addEventListener('mouseenter', () => {
      dogImg.src = 'assets/dog/white_lie.gif';
      spawnLargeHeart();
      heartInterval = setInterval(spawnLargeHeart, 400);
    });

    dogContainer.addEventListener('mouseleave', () => {
      if (heartInterval) {
        clearInterval(heartInterval);
        heartInterval = null;
      }
      dogImg.src = 'assets/dog/white_idle.gif';
    });
  }

});
