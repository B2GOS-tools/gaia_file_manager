/**
 * Created with JetBrains WebStorm.
 * User: tclxa
 * Date: 7/18/13
 * Time: 2:38 PM
 * To change this template use File | Settings | File Templates.
 */

function debug(msg) {
  dump('lx:handleGesture ' + msg + '\n');
}


var HandleGesture = (function() {
  var windowWidth = window.innerWidth;
  var windowHeight = window.innerHeight;
  var panningThreshold = window.innerWidth / 4, tapThreshold = 10;
  var kPageTransitionDuration = 300;

  var startEvent,
    isPanning = false,
    startX,
    currentX,
    deltaX,
    startY,
    currentY,
    deltaY,
    removePanHandler;
  insertButtonMode = {};
  var limits = {
    left: 0,
    right: 0
  };
  var startPoint = {};

  var isTouch = 'ontouchstart' in window;
  var touchstart = isTouch ? 'touchstart' : 'mousedown';
  var touchmove = isTouch ? 'touchmove' : 'mousemove';
  var touchend = isTouch ? 'touchend' : 'mouseup';
  debug(' isTouch ' + isTouch + ' \n ');

  var getX = (function getXWrapper() {
    return isTouch ? function(e) {
      return e.touches[0].pageX;
    } :
      function(e) {
        return e.pageX;
      };
  })();
  var getY = (function getYWrapper() {
    return isTouch ? function(e) {
      return e.touches[0].pageY;
    } :
      function(e) {
        return e.pageY;
      };
  })();

  var touchStartTimestamp = 0;
  var touchEndTimestamp = 0;
  var getDeltaX;
  var getDeltaY;

  function initVarible() {
    insertButtonMode = {};
    touchStartTimestamp = 0;
    touchEndTimestamp = 0;
    limits = {
      left: 0,
      right: 0
    };
  }

  function initPanningPrediction() {
    debug(' initPanningPrediction ');
    // Get our configuration data from build/applications-data.js
    var cPrediction = {'enabled': true, 'lookahead': 16 };

    // Assume that if we're using mouse events we're on a desktop that
    // is fast enough that we don't need to do this prediction.
    if (!isTouch || !cPrediction.enabled) {  //
      getDeltaX = function getDeltaX(evt) {
        return currentX - startX;
      };
      getDeltaY = function getDeltaX(evt) {
        return currentY - startY;
      };
      return;
    }
    // Predictions are based on the change between events, so we need to
    // remember some things from the previous invocation
    var lookahead, lastPredictionX, x0, t0, x1, t1 = 0;
    var lookahead, lastPredictionY, y0, yt0, y1, yt1 = 0;

    getDeltaX = function getDeltaX(evt) {
      var dx, dt, velocity, adjustment, prediction, deltaP;
      // dump("lx:t1 = " + t1 + "touchStartTimestamp" +
      // touchStartTimestamp +"\n");
      if (t1 < touchStartTimestamp) {
        // If this is the first move of this series, use the start event
        x0 = startX;
        t0 = touchStartTimestamp;
        lastPredictionX = null;
        // Start each new touch with the configured lookahead value
        lookahead = cPrediction.lookahead;    //lookahead=16
      } else {
        x0 = x1;
        t0 = t1;
      }
      // If we've overshot too many times, don't predict anything
      if (lookahead === 0) {
        return currentX - startX;
      }

      x1 = currentX;
      t1 = evt.timeStamp;
      //dump("lx: x1 "+ x1+"  t1  "+ t1+"\n");
      dx = x1 - x0;
      dt = t1 - t0;
      //dump("lx: dx "+ dx+"  dt  "+ dt+"\n");
      velocity = dx / dt; // px/ms
      // dump("lx: velocity = "+ velocity +"\n");
      // Guess how much extra motion we will have
      // by the time the redraw happens.
      adjustment = velocity * lookahead;

      // predict deltaX based on that extra motion
      prediction = Math.round(x1 + adjustment - startX);

      // Make sure we don't return a prediction greater than the screen width
      if (prediction >= windowWidth) {
        prediction = windowWidth - 1;
      }
      else if (prediction <= -windowWidth) {
        prediction = -windowWidth + 1;
      }

      // If the change in the prediction has a different sign than the
      // change in the user's finger position, then we overshot: the
      // previous prediction was too large. So temporarily reduce the
      // lookahead so we don't overshoot as easily next time. Also,
      // return the last prediction to give the user's finger a chance
      // to catch up with where we've already panned to. If we don't
      // do this, the panning changes direction and looks jittery.
      if (lastPredictionX !== null) {
        deltaP = prediction - lastPredictionX;
        if ((deltaP > 0 && dx < 0) || (deltaP < 0 && dx > 0)) {
          lookahead = lookahead >> 1;  // avoid future overshoots for this pan
          startX += deltaP;            // adjust for overshoot
          prediction = lastPredictionX; // alter our prediction
        }
      }

      // Remember this for next time.
      lastPredictionX = prediction;
      // dump("lx:prediction "+ prediction+ "\n");
      return prediction;
    };

    getDeltaY = function getDeltaX(evt) {
      var dy, dt, velocity, adjustment, prediction, deltaP;
      // dump("lx:t1 = " + t1 + "touchStartTimestamp" +
      // touchStartTimestamp +"\n");
      if (yt1 < touchStartTimestamp) {
        // If this is the first move of this series, use the start event
        y0 = startY;
        yt0 = touchStartTimestamp;
        lastPredictionY = null;
        // Start each new touch with the configured lookahead value
        lookahead = cPrediction.lookahead;    //lookahead=16
      } else {
        y0 = y1;
        yt0 = yt1;
      }
      // If we've overshot too many times, don't predict anything
      if (lookahead === 0) {
        return currentY - startY;
      }

      y1 = currentY;
      yt1 = evt.timeStamp;
      //dump("lx: x1 "+ x1+"  t1  "+ t1+"\n");
      dy = y1 - y0;
      dt = yt1 - yt0;
      //dump("lx: dx "+ dx+"  dt  "+ dt+"\n");
      velocity = dy / dt; // px/ms
      // dump("lx: velocity = "+ velocity +"\n");
      // Guess how much extra motion we will have
      // by the time the redraw happens
      adjustment = velocity * lookahead;

      // predict deltaX based on that extra motion
      prediction = Math.round(y1 + adjustment - startY);

      // Make sure we don't return a prediction greater than the screen width
      if (prediction >= windowHeight) {
        prediction = windowHeight - 1;
      }
      else if (prediction <= -windowHeight) {
        prediction = -windowHeight + 1;
      }

      // If the change in the prediction has a different sign than the
      // change in the user's finger position, then we overshot: the
      // previous prediction was too large. So temporarily reduce the
      // lookahead so we don't overshoot as easily next time. Also,
      // return the last prediction to give the user's finger a chance
      // to catch up with where we've already panned to. If we don't
      // do this, the panning changes direction and looks jittery.
      if (lastPredictionY !== null) {
        deltaP = prediction - lastPredictionY;
        if ((deltaP > 0 && dy < 0) || (deltaP < 0 && dy > 0)) {
          lookahead = lookahead >> 1;  // avoid future overshoots for this pan
          startY += deltaP;            // adjust for overshoot
          prediction = lastPredictionY; // alter our prediction
        }
      }

      // Remember this for next time.
      lastPredictionY = prediction;
      // dump("lx:prediction "+ prediction+ "\n");
      return prediction;
    };
  }

  function init() {
    dump('lx: gesture init ');

//        navigator.mozL10n.ready(function localize() {
//            setLocale();
//
//        });

    initVarible();
    setDirCtrl();
    //sdcardLists.addEventListener(touchstart, handleEvent, true);
    initPanningPrediction();
  }

  function handleEvent(evt) {
    dump('lx:handlegesture evt.type' + evt.type + '\n');
    switch (evt.type) {
      case touchstart:
        evt.stopPropagation();
        touchStartTimestamp = evt.timeStamp;    //touchstart time
        startEvent = isTouch ? evt.touches[0] : evt;
        deltaX = 0;
        deltaY = 0;
        startPoint.X = startEvent.pageX;
        startPoint.Y = startEvent.pageY;
        console.log('lx:touchstart ' + startPoint.X +
          ', ' + startPoint.Y + '\n');
        attachEvents();
        isPanning = false;
        break;
      case touchmove:
        if (evt.preventPanning === true) {
          return;
        }
        // Start panning immediately but only disable
        // the tap when we've moved far enough.
        startX = startEvent.pageX;
        currentX = getX(evt);

        if (currentX === startX)
          return;

        startY = startEvent.pageY;
        currentY = getY(evt);
        // dump("lx:currentX  " +currentX +"\n");
        deltaX = getDeltaX(evt);
        deltaY = getDeltaY(evt);
        // dump("lx: ---> touch move deltaX " + deltaX+"\n");
        if (deltaX === 0)
          return;

        document.body.dataset.transitioning = 'true';
        window.removeEventListener(touchmove, handleEvent);
        var pan = function(e) {
          currentX = getX(e);
          deltaX = getDeltaX(e);

          currentY = getY(e);
          deltaY = getDeltaY(e);

          if (!isPanning && Math.abs(deltaX) >= tapThreshold) {
            isPanning = true;
          }
        };

        removePanHandler = function removePanHandler(e) {
          touchEndTimestamp = e ? e.timeStamp : Number.MAX_VALUE;
          window.removeEventListener(touchend, removePanHandler, true);

          sdcardLists.removeEventListener(touchmove, pan, true);
          onTouchEnd(deltaX, deltaY, e);

        };

        sdcardLists.addEventListener(touchmove, pan, true);

        window.addEventListener(touchend, removePanHandler, true);
        window.removeEventListener(touchend, handleEvent);
        break;
      case touchend:
        releaseEvents();

        break;
      case 'contextmenu':
        console.log('lx:contextmenu process \n');

        if (isPanning) {
          evt.stopImmediatePropagation();
          return;
        }
        console.log('lx:contextmenu process 111 \n');
        break;
    }
  }

  function onTouchEnd(deltaX, deltaY, evt) {
    // If movement over 25% of the screen size or
    // fast movement over threshold for tapping, then swipe
    dump('lx:onTouchEnd x = ' + deltaX + '--- lx:onTouchEnd y = ' + deltaY);
    if (((Math.abs(deltaX) > panningThreshold) && Math.abs(deltaY) < 60) ||
      (Math.abs(deltaX) > tapThreshold &&
        touchEndTimestamp - touchStartTimestamp < kPageTransitionDuration &&
        Math.abs(deltaY) < 60)) {
      var forward = dirCtrl.goesForward(deltaX);
      if (forward) {
        if (window.location.hash != '#sdcard-edit-form') {
          dump('lx:onTouchEnd move-left \n');
          hideDirectory();

        }
      } else if (!forward) {
        if (window.location.hash != '#sdcard-edit-form') {
          dump('lx: onTouchEnd move-right \n');
          displayDirectory();
        }
      }
    } else if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
      dump('lx:maybe scroll \n');

    }
//    else if (!isPanning && evt && Math.abs(deltaY) <= tapThreshold) {
//      FileScan.clickFolder(evt);
//      releaseEvents();
//      dump('lx:maybe click event \n');
//    }
    delete document.body.dataset.transitioning;
  }

  function displayDirectory() {
    window.location.hash = '#folder-directory';
    $('folder-directory').style.display = 'block';
    $('folder-directory').style.zIndex = 1;
    sdcardPage.dataset.move = 'right-move';
    $('sdcard-back').classList.add('disabled');
    sdcardAddDisable();
  }

  function hideDirectory() {
    //$('folder-directory').classList.add('hidden');
    $('folder-directory').style.display = 'none';
    $('folder-directory').style.zIndex = -1;
    sdcardPage.dataset.move = 'left-move';
    //window.history.go(-1);
    window.location.hash = '#sdcardList';
    if ($('sdcard-back').classList.contains('disabled'))
      $('sdcard-back').classList.remove('disabled');
    sdcardRemoveDisable();
  }

  function attachEvents() {
    window.addEventListener(touchmove, handleEvent);
    window.addEventListener(touchend, handleEvent);
  }

  function releaseEvents() {
    window.removeEventListener(touchmove, handleEvent);
    window.removeEventListener(touchend, handleEvent);
  }

  function endReleaseEvent() {
    sdcardLists.removeEventListener(touchstart, handleEvent);
  }

  var dirCtrl = {};

  function setDirCtrl() {
    debug(' setDirCtrl ');
    function goesLeft(x) {
      return (x > 0);
    }

    function goesRight(x) {
      return (x < 0);
    }

    function limitLeft(x) {
      return (x < limits.left);
    }

    function limitRight(x) {
      return (x > limits.right);
    }

    var rtl = (document.documentElement.dir == 'rtl');
    dump('lx: rtl ' + rtl);
    dirCtrl.offsetPrev = rtl ? -1 : 1;
    dirCtrl.offsetNext = rtl ? 1 : -1;
    dirCtrl.limitPrev = rtl ? limitRight : limitLeft;
    dirCtrl.limitNext = rtl ? limitLeft : limitRight;
    dirCtrl.translatePrev = rtl ? 'translateX(100%)' : 'translateX(-100%)';
    dirCtrl.translateNext = rtl ? 'translateX(-100%)' : 'translateX(100%)';
    dirCtrl.goesForward = rtl ? goesLeft : goesRight;

  }

  return {
    releaseEvents: releaseEvents,
    endReleaseEvent: endReleaseEvent,
    handleEvent: handleEvent,
    init: init
  };

})();
