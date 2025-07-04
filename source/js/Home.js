
  const icons = ['⚽', '🏋️', '🍞'];
  const container = document.querySelector('.random-icons');

  function createIcons() {
    const count = Math.floor(Math.random() * 3) + 2; // Tạo 2–4 icon một lúc

    for (let i = 0; i < count; i++) {
      const icon = document.createElement('div');
      icon.className = 'icon';
      icon.textContent = icons[Math.floor(Math.random() * icons.length)];

      // Vị trí ngẫu nhiên
      icon.style.left = Math.random() * 90 + '%';
      icon.style.top = (Math.random() * 50 + 30) + 'px'; // khoảng giữa phần header

      container.appendChild(icon);

      // Tự xoá sau animation
      setTimeout(() => icon.remove(), 2500);
    }
  }

  // Gọi liên tục mỗi 1 giây
  setInterval(createIcons, 1000);


  const text = "thân hong mà nhìn";
  const typeTarget = document.getElementById("type-text");

  // Gõ chữ từng ký tự sau khi khung hiện
  function typeWriter(text, i = 0) {
    if (i < text.length) {
      typeTarget.textContent += text.charAt(i);
      setTimeout(() => typeWriter(text, i + 1), 100);
    }
  }

  // Delay cho khung thoại hiện ra trước rồi mới gõ chữ
  setTimeout(() => {
    typeWriter(text);
  }, 1000); // sau 1 giây sau khi load

  