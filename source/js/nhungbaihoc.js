const storyList = document.getElementById('storyList');
const storyModal = document.getElementById('storyModal');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const modalEmotion = document.getElementById('modalEmotion');
const modalContent = document.getElementById('modalContent');

function renderStories() {
  stories.forEach((story, index) => {
    const card = document.createElement('div');
    card.className = 'story-card';
    card.innerHTML = `
          <div class="story-title">${story.title}</div>
          <div class="story-date">${story.date}</div>
        `;
    card.addEventListener('click', () => openModal(index));
    storyList.appendChild(card);
  });
}

function openModal(index) {
  const story = stories[index];
  modalTitle.textContent = story.title;
  modalText.textContent = story.content;
  modalContent.className = 'modal-content';

  const emo = story.emotion.toLowerCase().replace(/\s/g, '');
  modalContent.classList.add(`emotion-${emo}`);

  // Đổi nhạc theo cảm xúc
  const audio = document.getElementById('bgMusic');
  const audioBtn = document.getElementById('audioControl');
  const newSrc = `sound/${emo}.mp3`;

  if (audio.src !== location.origin + newSrc) {
    audio.src = newSrc;
    audio.load();
    audio.play();
    audioBtn.textContent = '🔈 Tắt nhạc';
  }

  storyModal.style.display = 'flex';
}


function closeModal() {
  storyModal.style.display = 'none';
}

renderStories();

// Tạo sao lấp lánh
function createStars(num) {
  const starsContainer = document.getElementById('stars');
  for (let i = 0; i < num; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    starsContainer.appendChild(star);
  }
}
createStars(80);
const audio = document.getElementById('bgMusic');
const audioBtn = document.getElementById('audioControl');
audio.volume = 0.4;

audioBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    audioBtn.textContent = '🔈 Tắt nhạc';
  } else {
    audio.pause();
    audioBtn.textContent = '🔇 Bật nhạc';
  }
});

