let slides = document.querySelectorAll('.slide');
let current = 0;

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    slides[index].classList.add('active');
}

// show first slide
showSlide(current);

// auto-slide every 5 seconds
setInterval(() => {
    current = (current + 1) % slides.length;
    showSlide(current);
}, 5000);
