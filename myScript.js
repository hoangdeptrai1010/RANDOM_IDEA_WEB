function myfunction() {
    return Math.random() < 0.5 ? "Độc thân" : "Đã có người yêu";
}

function getRandomImage(folder) {
    const files = {
        "doc_than": [
            "doc_than/1.jpg",
            "doc_than/2.jpg"
        ],
        "co_ny": [
            "co_ny/1.jpg",
            "co_ny/2.jpg"
        ]
    };
    const arr = files[folder];
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}

$(document).ready(function () {
    $(".check-btn").click(function () {
        const statusText = myfunction();
        const rs = $(this).siblings(".status");
        const resultImage = $("#result-image");
        const singleAudio = document.getElementById("singleAudio");
        const loveAudio = document.getElementById("loveAudio");

        // Reset nhạc
        singleAudio.pause();
        loveAudio.pause();
        singleAudio.currentTime = 0;
        loveAudio.currentTime = 0;

        // Hiển thị trạng thái
        rs.text(statusText).fadeIn("slow").delay(2000).fadeOut(1000);

        // Đổi ảnh và phát nhạc
        if (statusText === "Độc thân") {
            resultImage.attr("src", getRandomImage("doc_than")).fadeIn();
            singleAudio.play();
        } else {
            resultImage.attr("src", getRandomImage("co_ny")).fadeIn();
            loveAudio.play();
        }
    });

    $("nav").mouseover(function () {
        $("a").css({
            "color": "red",
            "font-weight": "bold"
        });
    });

    $("nav").mouseout(function () {
        $("a").css({
            "color": "black",
            "font-weight": "normal"
        });
    });

    $("nav").click(function () {
    // Đổi text + thêm ảnh bên cạnh
    $("a").slideUp(500, function () {
        $(this).html(`làm chó gì có ny 🖕 <img id="sad-img" src="hehe.jpg" style="width: 24px; height: 24px; vertical-align: middle; margin-left: 8px;">`);
        $(this).slideDown(500);
    });
});

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

    setInterval(createHeart, 300);
});

