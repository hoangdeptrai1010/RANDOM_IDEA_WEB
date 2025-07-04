const currentYear = new Date().getFullYear();
    const startYear = 2019;

    for (let y = startYear; y <= currentYear; y++) {
      $('#year-select').append(`<option value="${y}">${y}</option>`);
    }

    $('#year-select').val(currentYear);

    function renderMonths(year) {
      const container = $('#calendar-grid');
      container.empty();

      for (let i = 1; i <= 12; i++) {
        container.append(`
          <div class="month-item">
            Tháng ${i}
            <button class="check-btn" data-month="${i}">Xem</button>
            <div class="status" style="display:none;"></div>
          </div>
        `);
      }
    }

    function getRandomImage(folder) {
      const files = {
        "doc_than": ["../picture/doc_than/1.jpg", "../picture/doc_than/2.jpg"],
        "co_ny": ["../picture/co_ny/1.jpg", "../picture/co_ny/2.jpg"]
      };
      const arr = files[folder];
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function createHeart() {
      const heart = document.createElement("div");
      heart.classList.add("heart");
      heart.innerText = "❤️";
      heart.style.left = Math.random() * 100 + "vw";
      heart.style.fontSize = Math.random() * 10 + 15 + "px";
      document.querySelector(".heart-container").appendChild(heart);
      setTimeout(() => {
        heart.remove();
      }, 4000);
    }

    $(document).ready(function () {
      renderMonths(currentYear);

      $('#year-select').change(function () {
        renderMonths(this.value);
      });

      $(document).on('click', '.check-btn', function () {
  const year = $('#year-select').val();
  const month = $(this).data('month');
  const key = `${year}-${String(month).padStart(2, '0')}`;
  const statusText = loveStatusData[key] || "Không có dữ liệu";

  const parentRow = $(this).closest(".month-row");
  const rs = parentRow.find(".status");
  const img = parentRow.find(".result-image");

  const singleAudio = document.getElementById("singleAudio");
  const loveAudio = document.getElementById("loveAudio");

  singleAudio.pause(); loveAudio.pause();
  singleAudio.currentTime = loveAudio.currentTime = 0;

  rs.text(statusText).fadeIn("slow").delay(2000).fadeOut(1000);

  if (statusText === "Độc thân") {
    img.attr("src", getRandomImage("doc_than")).fadeIn();
    singleAudio.play();
  } else if (statusText === "Đã có người yêu") {
    img.attr("src", getRandomImage("co_ny")).fadeIn();
    loveAudio.play();
  } else {
    img.fadeOut();
  }
});

      setInterval(createHeart, 300);
    });
    function renderMonths(year) {
  const container = $('#calendar-grid');
  container.empty();

  const col1 = $('<div class="month-col"></div>');
  const col2 = $('<div class="month-col"></div>');

  for (let i = 1; i <= 12; i++) {
    const row = $(`
      <div class="month-row">
        <h3>Tháng ${i}</h3>
        <button class="check-btn" data-month="${i}">Xem</button>
        <div class="status" style="display:none;"></div>
        <img class="result-image" src="" style="display:none;" />
      </div>
    `);

    if (i <= 6) col1.append(row);
    else col2.append(row);
  }

  container.append(col1, col2);
}
