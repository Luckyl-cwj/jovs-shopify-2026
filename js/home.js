var swiperProhibitSelectSlidesCount = document.querySelectorAll(
  ".swiper-prohibit-select .swiper-wrapper > .swiper-slide"
).length;
var swiperTopBannerProgressFill = document.querySelector(
  "#section-top-banner .swiper-progress-bar-fill"
);
var swiperTopBannerPrevButton = document.querySelector(
  "#section-top-banner .swiper-top-banner-progress .btn-swiper-prev"
);
var swiperTopBannerNextButton = document.querySelector(
  "#section-top-banner .swiper-top-banner-progress .btn-swiper-next"
);
var swiperProhibitSelectProgressFill = document.querySelector(
  "#section-prohibit-select   .swiper-progress-bar-fill"
);
var swiperShopByConcernProgressFill = document.querySelector(
  "#section-shop-by-concern   .swiper-progress-bar-fill"
);
var swiperProhibitSelectPrevButton = document.querySelector(
  ".swiper-prohibit-select-progress .btn-swiper-prev"
);
var swiperProhibitSelectNextButton = document.querySelector(
  ".swiper-prohibit-select-progress .btn-swiper-next"
);
var swiperShopByConcernPrevButton = document.querySelector(
  "#section-shop-by-concern .swiper-shop-by-concern-progress .btn-swiper-prev"
);
var swiperShopByConcernNextButton = document.querySelector(
  "#section-shop-by-concern .swiper-shop-by-concern-progress .btn-swiper-next"
);
var swiperTrustedRecommendedProgressFill = document.querySelector(
  "#section-trusted-recommended .swiper-progress-bar-fill"
);
var swiperTrustedRecommendedPrevButton = document.querySelector(
  "#section-trusted-recommended .btn-swiper-prev"
);
var swiperTrustedRecommendedNextButton = document.querySelector(
  "#section-trusted-recommended .btn-swiper-next"
);
var swiperAddBlogProgressFill = document.querySelector(
  "#section-add-blog .swiper-progress-bar-fill"
);
var swiperAddBlogPrevButton = document.querySelector(
  "#section-add-blog .btn-swiper-prev"
);
var swiperAddBlogNextButton = document.querySelector(
  "#section-add-blog .btn-swiper-next"
);
var swiperAddTextCardProgressFill = document.querySelector(
  "#section-add-text-card .swiper-progress-bar-fill"
);
var swiperAddTextCardPrevButton = document.querySelector(
  "#section-add-text-card .btn-swiper-prev"
);
var swiperAddTextCardNextButton = document.querySelector(
  "#section-add-text-card .btn-swiper-next"
);
var swiperOurMissionProgressFill = document.querySelector(
  "#section-our-mission .swiper-progress-bar-fill"
);
var swiperOurMissionPrevButton = document.querySelector(
  "#section-our-mission .btn-swiper-prev"
);
var swiperOurMissionNextButton = document.querySelector(
  "#section-our-mission .btn-swiper-next"
);
var swiperAddTextCardElement = document.querySelector(".swiper-add-text-card");
var swiperAddTextCardMediaQuery = window.matchMedia("(max-width: 991px)");
var swiperAddTextCard = null;
var swiperAwardsLogoElement = document.querySelector(".swiper-awards-logo-list");
var swiperAwardsLogoMediaQuery = window.matchMedia("(max-width: 991px)");
var swiperAwardsLogo = null;
var halfCardShowSection = document.querySelector("#section-half-card-show");
var halfCardShowItems = halfCardShowSection
  ? halfCardShowSection.querySelectorAll(".content-wrap > .item")
  : [];
var halfCardShowMediaQuery = window.matchMedia("(max-width: 992px)");

function updateProhibitSelectProgress(swiper) {
  if (!swiperProhibitSelectProgressFill || !swiperProhibitSelectSlidesCount) {
    return;
  }

  var progress = ((swiper.realIndex + 1) / swiperProhibitSelectSlidesCount) * 100;
  swiperProhibitSelectProgressFill.style.width = progress + "%";
}

function updateShopByConcernProgress(swiper) {
  if (!swiperShopByConcernProgressFill) {
    return;
  }

  var stepsCount =
    swiper.snapGrid && swiper.snapGrid.length ? swiper.snapGrid.length : swiper.slides.length;

  if (!stepsCount) {
    return;
  }

  var currentStep = typeof swiper.snapIndex === "number" ? swiper.snapIndex + 1 : 1;
  var progress = (currentStep / stepsCount) * 100;
  swiperShopByConcernProgressFill.style.width = progress + "%";
}

function updateSwiperProgress(swiper, progressFill) {
  if (!progressFill) {
    return;
  }

  var stepsCount =
    swiper.snapGrid && swiper.snapGrid.length ? swiper.snapGrid.length : swiper.slides.length;

  if (!stepsCount) {
    return;
  }

  var currentStep = typeof swiper.snapIndex === "number" ? swiper.snapIndex + 1 : 1;
  var progress = (currentStep / stepsCount) * 100;
  progressFill.style.width = progress + "%";
}

function updateOurMissionProgress(swiper) {
  updateSwiperProgress(swiper, swiperOurMissionProgressFill);
}

function isOurMissionMobileLayout() {
  return window.innerWidth <= 992;
}

function setHalfCardShowActiveItem(targetItem) {
  if (!halfCardShowItems.length || !targetItem) {
    return;
  }

  halfCardShowItems.forEach(function (item) {
    item.classList.toggle("is-active", item === targetItem);
  });
}

function syncHalfCardShowActiveItem() {
  if (!halfCardShowItems.length || !halfCardShowMediaQuery.matches) {
    return;
  }

  var activeItem =
    halfCardShowSection.querySelector(".content-wrap > .item.is-active") || halfCardShowItems[0];

  setHalfCardShowActiveItem(activeItem);
}

function isVisibleElement(element) {
  return !!(element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length));
}

function ensureTopBannerVideoSources(video) {
  if (!video || video.dataset.sourcesLoaded === "true") {
    return;
  }

  var sources = video.querySelectorAll("source");
  var shouldLoad = false;

  Array.prototype.forEach.call(sources, function (source) {
    var dataSrc = source.getAttribute("data-src");

    if (dataSrc && !source.getAttribute("src")) {
      source.setAttribute("src", dataSrc);
      shouldLoad = true;
    }
  });

  if (shouldLoad) {
    video.load();
  }

  video.dataset.sourcesLoaded = "true";
}

function syncTopBannerVideos(swiper) {
  if (!swiper || !swiper.el) {
    return;
  }

  var bannerVideos = swiper.el.querySelectorAll(".item-video video");

  Array.prototype.forEach.call(bannerVideos, function (video) {
    video.pause();
  });

  var activeSlide = swiper.slides && swiper.slides[swiper.activeIndex];

  if (!activeSlide || !activeSlide.classList.contains("item-video")) {
    return;
  }

  var activeVideos = activeSlide.querySelectorAll("video");

  Array.prototype.forEach.call(activeVideos, function (video) {
    if (!isVisibleElement(video)) {
      return;
    }

    ensureTopBannerVideoSources(video);

    var playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {});
    }
  });
}

function requestTopBannerVideoSync(swiper) {
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(function () {
      syncTopBannerVideos(swiper);
    });
    return;
  }

  setTimeout(function () {
    syncTopBannerVideos(swiper);
  }, 0);
}

var swiperTopBanner = new Swiper(".swiper-top-banner", {
  spaceBetween: 30,
  navigation: {
    nextEl: swiperTopBannerNextButton,
    prevEl: swiperTopBannerPrevButton,
  },
  on: {
    init: function (swiper) {
      updateSwiperProgress(swiper, swiperTopBannerProgressFill);
      requestTopBannerVideoSync(swiper);
    },
    slideChange: function (swiper) {
      updateSwiperProgress(swiper, swiperTopBannerProgressFill);
      requestTopBannerVideoSync(swiper);
    },
    resize: function (swiper) {
      updateSwiperProgress(swiper, swiperTopBannerProgressFill);
      requestTopBannerVideoSync(swiper);
    },
  },
});

function toggleAwardsLogoSwiper() {
  if (!swiperAwardsLogoElement) {
    return;
  }

  if (swiperAwardsLogoMediaQuery.matches) {
    if (!swiperAwardsLogo) {
      swiperAwardsLogo = new Swiper(swiperAwardsLogoElement, {
        slidesPerView: 5.5,
        spaceBetween: 10,
        speed: 600,
        watchOverflow: true,
        breakpoints: {
        
          768: {
            slidesPerView: 6,
            spaceBetween: 12,
          },
        },
      });
    } else {
      swiperAwardsLogo.update();
    }

    return;
  }

  if (swiperAwardsLogo) {
    swiperAwardsLogo.destroy(true, true);
    swiperAwardsLogo = null;
  }
}

function toggleAddTextCardSwiper() {
  if (!swiperAddTextCardElement) {
    return;
  }

  if (swiperAddTextCardMediaQuery.matches) {
    if (!swiperAddTextCard) {
      swiperAddTextCard = new Swiper(swiperAddTextCardElement, {
        slidesPerView: 1.08,
        spaceBetween: 14,
        speed: 600,
        watchOverflow: true,
        navigation: {
          nextEl: swiperAddTextCardNextButton,
          prevEl: swiperAddTextCardPrevButton,
        },
        breakpoints: {
          396: {
            slidesPerView: 1.15,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 18,
          },
        },
        on: {
          init: function (swiper) {
            updateSwiperProgress(swiper, swiperAddTextCardProgressFill);
          },
          slideChange: function (swiper) {
            updateSwiperProgress(swiper, swiperAddTextCardProgressFill);
          },
          resize: function (swiper) {
            updateSwiperProgress(swiper, swiperAddTextCardProgressFill);
          },
        },
      });
    } else {
      swiperAddTextCard.update();
      updateSwiperProgress(swiperAddTextCard, swiperAddTextCardProgressFill);
    }

    return;
  }

  if (swiperAddTextCard) {
    swiperAddTextCard.destroy(true, true);
    swiperAddTextCard = null;
  }
}

var swiperProhibitSelectThumb = new Swiper(".swiper-prohibit-select-thumb", {
  spaceBetween: 30,
  allowTouchMove: false,
  simulateTouch: false,
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
var swiperShopByConcern = new Swiper(".swiper-shop-by-concern", {
  spaceBetween: 12,
  slidesPerView: "auto",
  navigation: {
    nextEl: swiperShopByConcernNextButton,
    prevEl: swiperShopByConcernPrevButton,
  },
  on: {
    init: function (swiper) {
      updateShopByConcernProgress(swiper);
    },
    slideChange: function (swiper) {
      updateShopByConcernProgress(swiper);
    },
    resize: function (swiper) {
      updateShopByConcernProgress(swiper);
    },
  },
});
if (swiperProhibitSelectPrevButton) {
  swiperProhibitSelectPrevButton.addEventListener("click", function () {
    swiperProhibitSelect.slidePrev();
  });
}
if (swiperProhibitSelectNextButton) {
  swiperProhibitSelectNextButton.addEventListener("click", function () {
    swiperProhibitSelect.slideNext();
  });
}
var swiperUserEvaluation = new Swiper(".swiper-user-evaluation", {
  spaceBetween: 14,
  slidesPerView: 1.08,
  watchOverflow: true,
  breakpoints: {
    396: {
      slidesPerView: 1.2,
      spaceBetween: 16,
    },
    768: {
      slidesPerView: 2,
      spaceBetween: 18,
    },
    992: {
      slidesPerView: 3,
      spaceBetween: 36,
    },
    1600: {
      slidesPerView: 3,
      spaceBetween: 60,
    },
  },
});

var swiperTrustedRecommended = new Swiper(".swiper-trusted-recommended", {
  spaceBetween: 14,
  slidesPerView:2.1,
  height: 300,
  watchOverflow: true,
  navigation: {
    nextEl: swiperTrustedRecommendedNextButton,
    prevEl: swiperTrustedRecommendedPrevButton,
  },
  breakpoints: {
   
    768: {
      slidesPerView: 2.2,
      spaceBetween: 18,
      height: 400,
    },
    992: {
      slidesPerView: 4,
      spaceBetween: 24,
      height: 420,
    },
    1600: {
      slidesPerView: 4,
      spaceBetween: 28,
      height: 460,
    },
  },
  on: {
    init: function (swiper) {
      updateSwiperProgress(swiper, swiperTrustedRecommendedProgressFill);
    },
    slideChange: function (swiper) {
      updateSwiperProgress(swiper, swiperTrustedRecommendedProgressFill);
    },
    resize: function (swiper) {
      updateSwiperProgress(swiper, swiperTrustedRecommendedProgressFill);
    },
  },
});



var swiperOurMissionThumb = new Swiper(".swiper-our-mission-thumb", {
  slidesPerView: 3,
  direction: "vertical",
  spaceBetween: 12,
  watchSlidesProgress: true,
  slideToClickedSlide: true,
  mousewheel: {
    enabled: true,
    forceToAxis: true,
  },
  breakpoints: {
    0: {
      slidesPerView: 3,
      direction: "vertical",
      spaceBetween: 12,
      mousewheel: {
        enabled: false,
        forceToAxis: true,
      },
    },
    993: {
      slidesPerView: 3,
      direction: "vertical",
      spaceBetween: 12,
      mousewheel: {
        enabled: true,
        forceToAxis: true,
      },
    },
  },
  on: {
    init: function (swiper) {
      updateOurMissionProgress(swiper);
    },
    slideChange: function (swiper) {
      updateOurMissionProgress(swiper);
    },
    resize: function (swiper) {
      updateOurMissionProgress(swiper);
    },
  },
});

function keepOurMissionThumbInView(targetIndex) {
  var slidesPerView = Number(swiperOurMissionThumb.params.slidesPerView) || 1;
  var visibleSlidesCount = Math.max(Math.floor(slidesPerView), 1);
  var maxStartIndex = Math.max(swiperOurMissionThumb.slides.length - visibleSlidesCount, 0);
  var currentStartIndex = swiperOurMissionThumb.activeIndex;
  var visibleEndIndex = currentStartIndex + visibleSlidesCount - 1;
  var nextStartIndex = currentStartIndex;

  if (targetIndex >= visibleEndIndex) {
    if (visibleSlidesCount > 1) {
      nextStartIndex = Math.min(targetIndex - visibleSlidesCount + 2, maxStartIndex);
    } else {
      nextStartIndex = Math.min(targetIndex, maxStartIndex);
    }
  } else if (targetIndex <= currentStartIndex) {
    if (visibleSlidesCount > 1) {
      nextStartIndex = Math.max(targetIndex - 1, 0);
    } else {
      nextStartIndex = Math.max(targetIndex, 0);
    }
  }

  if (nextStartIndex !== currentStartIndex) {
    swiperOurMissionThumb.slideTo(nextStartIndex);
  }
}

function syncOurMissionThumbLayout() {
  var isMobile = isOurMissionMobileLayout();

  swiperOurMissionThumb.params.mousewheel.enabled = !isMobile;

  if (isMobile) {
    swiperOurMission.params.creativeEffect.prev.translate = [0, -16, 0];
    swiperOurMission.params.creativeEffect.prev.scale = 0.97;
    swiperOurMission.params.creativeEffect.prev.opacity = 0.24;
    swiperOurMission.params.creativeEffect.next.translate = [0, 16, 0];
    swiperOurMission.params.creativeEffect.next.scale = 0.97;
    swiperOurMission.params.creativeEffect.next.opacity = 0.24;
  } else {
    swiperOurMission.params.creativeEffect.prev.translate = [0, -30, 0];
    swiperOurMission.params.creativeEffect.prev.scale = 0.95;
    swiperOurMission.params.creativeEffect.prev.opacity = 0.4;
    swiperOurMission.params.creativeEffect.next.translate = [0, 30, 0];
    swiperOurMission.params.creativeEffect.next.scale = 0.95;
    swiperOurMission.params.creativeEffect.next.opacity = 0.4;
  }

  swiperOurMissionThumb.update();
  swiperOurMission.update();
  keepOurMissionThumbInView(swiperOurMission.activeIndex);
  updateOurMissionProgress(swiperOurMissionThumb);
}

var swiperOurMission = new Swiper(".swiper-our-mission", {
  spaceBetween: 12,
  slidesPerView: 1,
  effect: "creative",
  allowTouchMove:false,
  navigation: {
    nextEl: swiperOurMissionNextButton,
    prevEl: swiperOurMissionPrevButton,
  },
  thumbs: {
    swiper: swiperOurMissionThumb,
  },
  on: {
    init: function (swiper) {
      keepOurMissionThumbInView(swiper.activeIndex);
    },
    slideChange: function (swiper) {
      keepOurMissionThumbInView(swiper.activeIndex);
    },
  },
  creativeEffect: {
    limitProgress: 2,
    prev: {
      shadow: false,
      translate: [0, -30, 0],
      scale: 0.95,
      opacity: 0.4,
    },
    next: {
      shadow: false,
      translate: [0, 30, 0],
      scale: 0.95,
      opacity: 0.4,
    },
  },
});

function syncOurMissionByThumb(swiper) {
  if (typeof swiper.clickedIndex !== "number") {
    return;
  }

  swiperOurMission.slideTo(swiper.clickedIndex);
  keepOurMissionThumbInView(swiper.clickedIndex);
}

swiperOurMissionThumb.on("click", syncOurMissionByThumb);
swiperOurMissionThumb.on("tap", syncOurMissionByThumb);
swiperOurMissionThumb.on("breakpoint", syncOurMissionThumbLayout);


var swiperAddBlog = new Swiper(".swiper-add-blog", {
  spaceBetween: 14,
  slidesPerView: 1.4,
  height: 240,
  watchOverflow: true,
  navigation: {
    nextEl: swiperAddBlogNextButton,
    prevEl: swiperAddBlogPrevButton,
  },
  breakpoints: {
    
    768: {
      slidesPerView: 2.2,
      spaceBetween: 18,
      height: 390,
    },
    992: {
      slidesPerView: 4,
      spaceBetween: 24,
      height: 420,
    },
    1600: {
      slidesPerView: 4,
      spaceBetween: 28,
      height: 440,
    },
  },
  on: {
    init: function (swiper) {
      updateSwiperProgress(swiper, swiperAddBlogProgressFill);
    },
    slideChange: function (swiper) {
      updateSwiperProgress(swiper, swiperAddBlogProgressFill);
    },
    resize: function (swiper) {
      updateSwiperProgress(swiper, swiperAddBlogProgressFill);
    },
  },
});

if (halfCardShowItems.length) {
  syncHalfCardShowActiveItem();

  halfCardShowItems.forEach(function (item) {
    item.addEventListener("click", function (event) {
      if (!halfCardShowMediaQuery.matches) {
        return;
      }

      var productLink = event.target.closest(".bottom-img-wrap");

      if (productLink && !item.classList.contains("is-active")) {
        event.preventDefault();
      }

      setHalfCardShowActiveItem(item);
    });
  });
}

toggleAwardsLogoSwiper();
toggleAddTextCardSwiper();
syncOurMissionThumbLayout();

if (typeof swiperAwardsLogoMediaQuery.addEventListener === "function") {
  swiperAwardsLogoMediaQuery.addEventListener("change", toggleAwardsLogoSwiper);
} else {
  swiperAwardsLogoMediaQuery.addListener(toggleAwardsLogoSwiper);
}

if (typeof swiperAddTextCardMediaQuery.addEventListener === "function") {
  swiperAddTextCardMediaQuery.addEventListener("change", toggleAddTextCardSwiper);
} else {
  swiperAddTextCardMediaQuery.addListener(toggleAddTextCardSwiper);
}

if (typeof halfCardShowMediaQuery.addEventListener === "function") {
  halfCardShowMediaQuery.addEventListener("change", syncHalfCardShowActiveItem);
} else {
  halfCardShowMediaQuery.addListener(syncHalfCardShowActiveItem);
}
