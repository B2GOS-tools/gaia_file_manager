
'use strict';

/**
 * pageSwitch.js 1rd release
 *
 * Copyright (C) 2012.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *
 * 2. Any redistribution, use, or modification is done solely for personal
 * benefit and not for any commercial purpose or for monetary gain.
 *
 **/

'use strict';

var currentPage = 0;

var pageSwitch = (function() {
  var container;

  var windowWidth = window.innerWidth;
  var thresholdForPanning = window.innerWidth / 4;
  var thresholdForTapping = 10;

  var kPageTransitionDuration = 300;

  var pages = [];

  // Limits for changing pages during dragging
  var limits = {
    left: 0,
    right: 0
  };

  var startEvent, isPanning = false;

  var isTouch = 'ontouchstart' in window;
  var touchstart = isTouch ? 'touchstart' : 'mousedown';
  var touchmove = isTouch ? 'touchmove' : 'mousemove';
  var touchend = isTouch ? 'touchend' : 'mouseup';

  var getX = (function getXWrapper() {
    return isTouch ? function(e) { return e.touches[0].pageX; } :
      function(e) { return e.pageX; };
  })();

  function handleEvent(evt) {
    switch (evt.type) {
      case touchstart:
        debug('lxp:: touchstart');
        evt.stopPropagation();
        touchStartTimestamp = evt.timeStamp;
        startEvent = isTouch ? evt.touches[0] : evt;
        debug('lxp:: pageX = ' + startEvent.pageX +
          ' pageY = ' + startEvent.pageY);
        attachEvents();
        break;

      case touchmove:
        if (evt.preventPanning === true) {
          return;
        }

        // Starts panning only when tapping does not make sense
        // anymore. The pan will then start from this point to avoid
        // a jump effect.
        var deltaX = getX(evt) - startEvent.pageX;
        //var deltaX = evt.touches[0].pageX - startEvent.pageX;
        if (!isPanning) {
          if (Math.abs(deltaX) < thresholdForTapping) {
            return;
          } else {
            isPanning = true;
            document.body.dataset.transitioning = 'true';

            debug(' ispanning = true');
          }
        }

        // Panning time! Stop listening here to enter into a dedicated
        // method for panning only the 2 relevants pages based on the
        // direction of the inputs. The code here is carefully written
        // to avoid as much as possible allocations while panning.
        window.removeEventListener(touchmove, handleEvent);

        // Before panning pages that are directly next to the current
        // target are set visible.
        togglePagesVisibility(currentPage - 1, currentPage + 1);

        debug(' togglePagesVisibility');

        var index = currentPage;

        var previous = index ? pages[index - 1].style : {};
        previous.transition = '';
        previous.transform = 'translateX(' + (-windowWidth) + 'px)';

        var current = pages[index].style;
        current.transition = '';
        current.transform = '';

        var next = index < pages.length - 1 ? pages[index + 1].style : {};
        next.transition = '';
        next.transform = 'translateX(' + windowWidth + 'px)';

//        previous.transformOrigin = 'center center';
//        next.transformOrigin = 'center center';
//        current.transformOrigin = 'center center';


        var translate = 'translateX($px)';
        var startX = startEvent.pageX;
        //var startX = startEvent.pageX;
        var forward = deltaX > 0;

        debug(' ok start');

        var refresh;

        if (index === 0) {
          refresh = function(e) {
            if (deltaX <= 0) {
              next.transform = translate.replace('$', windowWidth + deltaX);
              current.transform = translate.replace('$', deltaX);
            }
          };
        } else if (index === pages.length - 1) {
          refresh = function(e) {
            if (deltaX >= 0) {
              previous.transform =
                translate.replace('$', -windowWidth + deltaX);
              current.transform = translate.replace('$', deltaX);
            }
            else {
              return;
            }
          };
        } else {
          refresh = function(e) {
            if (deltaX >= 0) {
              previous.transform =
                translate.replace('$', -windowWidth + deltaX);

              // If we change direction make sure there isn't any part
              // of the page on the other side that stays visible.
              if (!forward) {
                forward = true;
                next.transform =
                  translate.replace('$', windowWidth);
              }
            } else {
              next.transform =
                translate.replace('$', windowWidth + deltaX);

              // If we change direction make sure there isn't any part
              // of the page on the other side that stays visible.
              if (forward) {
                forward = false;
                previous.transform =
                  translate.replace('$', -windowWidth);
              }
            }
            current.transform = translate.replace('$', deltaX);
          };
        }

        // Generate a function accordingly to the current page position.
        var pan = function(e) {
          debug(' pan');
          deltaX = getX(e) - startX;
          //deltaX = e.touches[0].pageX - startX;
          window.mozRequestAnimationFrame(refresh);
        };

        var pageContainer = pages[index];
        pageContainer.addEventListener(touchmove, pan, true);

        var removePanHandler = function removePanHandler(e) {
          touchEndTimestamp = e ? e.timeStamp : Number.MAX_VALUE;
          window.removeEventListener(touchend, removePanHandler, true);

          pageContainer.removeEventListener(touchmove, pan, true);

          isPanning = false;
          window.mozRequestAnimationFrame(function panTouchEnd() {
            onTouchEnd(deltaX, e);
          });
        };
        window.addEventListener(touchend, removePanHandler, true);
        window.removeEventListener(touchend, handleEvent);

        break;

      case touchend:
        releaseEvents();
        if (!isPanning && evt.target.href && currentView === '') {
          tap(evt); // defined in file_manager.js.
        }
        isPanning = false;
        break;
    }
  }

  function onTouchEnd(deltaX, evt) {
    debug(' onTouchEnd');
    var page = currentPage;
    /* Bigger than threshold for panning or a fast movement bigger than
     threshold for tapping */
    if (Math.abs(deltaX) > thresholdForPanning ||
      (Math.abs(deltaX) > thresholdForTapping &&
        touchEndTimestamp - touchStartTimestamp < kPageTransitionDuration)) {
      var forward = dirCtrl.goesForward(deltaX);
      if (forward && currentPage < pages.length - 1) {
        page = page + 1;
      } else if (!forward && currentPage >= 1) {
        page = page - 1;
      }
    } else if (!isPanning && evt) {
      releaseEvents();
    }

    goToPage(page);
  }

  function attachEvents() {
    window.addEventListener(touchmove, handleEvent);
    window.addEventListener(touchend, handleEvent);
  }

  function releaseEvents() {
    window.removeEventListener(touchmove, handleEvent);
    window.removeEventListener(touchend, handleEvent);
  }

  function togglePagesVisibility(start, end) {
    for (var i = 0; i < pages.length; i++) {
      var pagediv = pages[i];
      if (i < start || i > end) {
        //pagediv.style.display = 'none';
        pagediv.classList.add('hidden');
      } else {
        //pagediv.style.display = 'block';
        pagediv.classList.remove('hidden');
      }
    }
  }

  var touchStartTimestamp = 0;
  var touchEndTimestamp = 0;
  var lastGoingPageTimestamp = 0;

  function goToPage(index, callback) {
    window.removeEventListener('hashchange', showPanel);

    if (index < 0 || index >= pages.length)
      return;

    var delay = touchEndTimestamp - lastGoingPageTimestamp ||
      kPageTransitionDuration;
    lastGoingPageTimestamp += delay;
    var duration = delay < kPageTransitionDuration ?
      delay : kPageTransitionDuration;

    var goToPageCallback = function() {
      //delete document.body.dataset.transitioning;
      if (callback) {
        callback();
      }

      togglePagesVisibility(index, index);
      previousPage.style.transform = 'translateX(0px)';

      previousPage.addEventListener('transitionend',
        function transitionEnd(e) {
          previousPage.removeEventListener('transitionend', transitionEnd);
          debug('lxp:: goToPageCallback previousPage transitionend');
          delete document.body.dataset.transitioning;

          window.addEventListener('hashchange', showPanel);
          window.location.hash = '#' + pages[index].id;
          //pages[index].addEventListener(touchstart, handleEvent, true);
          //container.addEventListener(touchstart, handleEvent, true);
          debug('lxp:: goToPageCallback window.location.hash = ' +
            window.location.hash);
        });
    };

    var previousPage = pages[currentPage];
    var newPage = pages[index];

    if (index >= currentPage) {
      var forward = 1;
      var start = currentPage;
      var end = index;
    } else {
      var forward = -1;
      var start = index;
      var end = currentPage;
    }

    togglePagesVisibility(start, end);
    currentPage = index;

    if (previousPage == newPage) {
      goToPageCallback();

      newPage.style.transition = 'all ' + kPageTransitionDuration + 'ms ease';
      newPage.style.transform = 'translateX(0px)';
      return;
    }

    // Force a reflow otherwise the newPage appears immediately because it is
    // still considered display: none;
    newPage.getBoundingClientRect();

    previousPage.style.transition = 'all ' +
      kPageTransitionDuration + 'ms ease';
    previousPage.style.transform = 'translateX(' +
      (-forward * windowWidth) + 'px)';
    newPage.style.transition = 'all ' + kPageTransitionDuration + 'ms ease';
    newPage.style.transform = 'translateX(0px)';


    container.addEventListener('transitionend', function transitionEnd(e) {
      container.removeEventListener('transitionend', transitionEnd);
      goToPageCallback();
    });
  }

  function goToNextPage(callback) {
    document.body.dataset.transitioning = 'true';
    goToPage(currentPage + 1, callback);
  }

  function goToPreviousPage(callback) {
    document.body.dataset.transitioning = 'true';
    goToPage(currentPage - 1, callback);
  }

  /*
   * UI Localization
   *
   */
  var dirCtrl = {};
  function setDirCtrl() {
    function goesLeft(x) { return (x > 0); }
    function goesRight(x) { return (x < 0); }
    function limitLeft(x) { return (x < limits.left); }
    function limitRight(x) { return (x > limits.right); }
    var rtl = (document.documentElement.dir == 'rtl');

    dirCtrl.offsetPrev = rtl ? -1 : 1;
    dirCtrl.offsetNext = rtl ? 1 : -1;
    dirCtrl.limitPrev = rtl ? limitRight : limitLeft;
    dirCtrl.limitNext = rtl ? limitLeft : limitRight;
    dirCtrl.translatePrev = rtl ? 'translateX(100%)' : 'translateX(-100%)';
    dirCtrl.translateNext = rtl ? 'translateX(-100%)' : 'translateX(100%)';
    dirCtrl.goesForward = rtl ? goesLeft : goesRight;
  }

  /*
   * Initialize the UI.
   */
  function initUI(selector) {
    container = document.querySelector(selector);

    var page1 = document.getElementById('classify');
    pages.push(page1);
    var page2 = document.getElementById('storage');
    pages.push(page2);

    //container.addEventListener(touchstart, handleEvent, true);
    page1.addEventListener(touchstart, handleEvent, true);
    page2.addEventListener(touchstart, handleEvent, true);
    //container.addEventListener('contextmenu', onHomescreenContextmenu);

    limits.left = container.offsetWidth * 0.05;
    limits.right = container.offsetWidth * 0.95;

    setDirCtrl();
  }

  return {
    /*
     * Initializes the grid manager
     *
     * @param {String} selector
     *                 Specifies the HTML container element for the pages.
     *
     */
    init: function gm_init(gridSelector) {
      initUI(gridSelector);
    },

    goToPage: goToPage,

    goToPreviousPage: goToPreviousPage,

    goToNextPage: goToNextPage,

    dirCtrl: dirCtrl

  };
})();
