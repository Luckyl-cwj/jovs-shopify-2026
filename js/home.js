
var swiperProhibitSelectThumb = new Swiper(".swiper-prohibit-select-thumb", {
  spaceBetween: 30,

  effect: "fade",
});
var swiperProhibitSelect = new Swiper(".swiper-prohibit-select", {
  spaceBetween: 30,
  loop: 'true',
  navigation: {
    nextEl: ".swiper-prohibit-select-navigation .swiper-button-next",
    prevEl: ".swiper-prohibit-select-navigation .swiper-button-prev",
  },
  thumbs: {
    swiper: swiperProhibitSelectThumb,
  },
  on: {
    slideChange: function () {
      console.log(swiperProhibitSelect.activeIndex);

    }

  }
});
document.querySelector('.swiper-prohibit-select-progress .btn-swiper-prev').addEventListener('click', function () {
  swiperProhibitSelect.slidePrev()
})
document.querySelector('.swiper-prohibit-select-progress .btn-swiper-next').addEventListener('click', function () {
  swiperProhibitSelect.slideNext()
})