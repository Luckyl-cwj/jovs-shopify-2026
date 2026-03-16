var swiperProhibitSelectSlidesCount = document.querySelectorAll(
  ".swiper-prohibit-select .swiper-wrapper > .swiper-slide"
).length;
var swiperProhibitSelectProgressFill = document.querySelector(
  "#section-prohibit-select .swiper-prohibit-select-progress .swiper-progress-bar .swiper-progress-bar-fill"
);

function updateProhibitSelectProgress(swiper) {
  if (!swiperProhibitSelectProgressFill || !swiperProhibitSelectSlidesCount) {
    return;
  }

  var progress = ((swiper.realIndex + 1) / swiperProhibitSelectSlidesCount) * 100;
  swiperProhibitSelectProgressFill.style.width = progress + "%";
}

var swiperProhibitSelectThumb = new Swiper(".swiper-prohibit-select-thumb", {
  spaceBetween: 30,

  effect: "fade",
});
var swiperProhibitSelect = new Swiper(".swiper-prohibit-select", {
  spaceBetween: 30,
  loop: true,
  navigation: {
    nextEl: ".swiper-prohibit-select-navigation .swiper-button-next",
    prevEl: ".swiper-prohibit-select-navigation .swiper-button-prev",
  },
  thumbs: {
    swiper: swiperProhibitSelectThumb,
  },
  on: {
    init: function (swiper) {
      updateProhibitSelectProgress(swiper);
    },
    slideChange: function (swiper) {
      updateProhibitSelectProgress(swiper);
    },
  },
});
var swiperShopByConcern =  new Swiper(".swiper-shop-by-concern", {
  spaceBetween: 12,
  slidesPerView: 'auto',
});
document.querySelector('.swiper-prohibit-select-progress .btn-swiper-prev').addEventListener('click', function () {
  swiperProhibitSelect.slidePrev()
})
document.querySelector('.swiper-prohibit-select-progress .btn-swiper-next').addEventListener('click', function () {
  swiperProhibitSelect.slideNext()
})
