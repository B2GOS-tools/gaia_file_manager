
'use strict';

const Classify = (function() {
  var loader = LazyLoader;

  // How many items are visible on a page.
  // Batch sizes are based on this.
  var PAGE_SIZE = 6;

  // added by tcl_chenguoqiang PR 687816
  function allScanEnd(firstScan) {
    if (firstScan) {
      if (!photodbFirstScan && !musicdbFirstScan &&
          !videodbFirstScan && !bluetoothdbFirstScan) {
        if ($('fresh-button').classList.contains('freshing')) {
          $('fresh-button').classList.remove('freshing');
        }
      }
    } else if (!photodbScan && !musicdbScan &&
      !videodbScan && !bluetoothdbScan) {
      if ($('fresh-button').classList.contains('freshing')) {
        $('fresh-button').classList.remove('freshing');
      }
    }
    if (!photodbScan && !musicdbScan &&
        !videodbScan && !bluetoothdbScan &&
        !photodbFirstScan && !musicdbFirstScan &&
        !videodbFirstScan && !bluetoothdbFirstScan) {
      if (mediaChanged) {
        freshMainPage();
      }
    }
  }

  /*picture code begin*/
  // Initialize MediaDB objects for photos, and set up their
  // event handlers.
  function initPictureDB() {
    photodb = new MediaDB('pictures', metadataParserPicture, {
//      mimeTypes: [
//        'image/gif',
//        'image/jpeg',
//        'image/jpg',
//        'image/pjpeg',
//        'image/png',
//        'image/x-png',
//        'image/x-portable-pixmap',
//        'image/x-xbitmap',
//        'image/x-xbm',
//        'image/xbm',
//        'image/x-jg',
//        'image/tiff',
//        'image/bmp',
//        'image/x-ms-bmp',
//        'image/x-icon',
//        'image/vnd.microsoft.icon',
//        'image/icon',
//        'video/x-mng',
//        'image/x-jng',
//        'image/svg+xml',
//        'image/vnd.wap.wbmp'
//      ],
      indexes: ['pureName'],
      version: 2,
      autoscan: false,     // We're going to call scan() explicitly
      batchHoldTime: 2000,  // Batch files during scanning
      batchSize: PAGE_SIZE // Max batch size when scanning
    });

    var loaded = false;
    function metadataParserPicture(file, onsuccess, onerror) {
      if (loaded) {
        metadataParser(file, onsuccess, onerror);
        return;
      }

      loader.load('js/picture_metadata_scripts.js', function() {
        loaded = true;
        metadataParser(file, onsuccess, onerror);
      });
    }

    //lxp videostorage = navigator.getDeviceStorage('videos');


    // show dialog in upgradestart, when it finished, it will turned to ready.
    photodb.onupgrading = function() {
      showOverlay('upgrade');
    };

    // This is called when DeviceStorage becomes unavailable because the
    // sd card is removed or because it is mounted for USB mass storage
    // This may be called before onready if it is unavailable to begin with
    // We don't need one of these handlers for the video db, since both
    // will get the same event at more or less the same time.
    photodb.onunavailable = function(event) {
      var why = event.detail;
      if (why === MediaDB.NOCARD)
        showOverlay('nocard');
      else if (why === MediaDB.UNMOUNTED)
        showOverlay('pluggedin');
    };

    photodb.onready = function() {
      // Hide the nocard or pluggedin overlay if it is displayed
      if (currentOverlay === 'nocard' || currentOverlay === 'pluggedin')
        showOverlay(null);

      showOverlay(null);
      photodb.scan();
    };

    photodb.onscanstart = function onscanstart() {
      dump('lxp:: performance picture start time ' + performance.now());
    };

    photodb.onscanend = function onscanend() {
      dump('lxp:: performance picture end time ' + performance.now());
      // It is safe to zoom in now
      scanningBigImages = false;

      if (photodbFirstScan === true) {
        photodbFirstScan = false;
        $('picture').classList.remove('disabled');

        allScanEnd(true);
        console.log('lxp:: photodbFirstScan = ' + photodbFirstScan);
      }

      if (photodbScan === true) {
        photodbScan = false;
        $('picture').classList.remove('disabled');

        allScanEnd(false);
      }

      if (renameScan === true) {
        renameScan = false;
        hideSpinner();
        removeDisabled();
      }

      countdb(photodb);
    };

    // On devices with internal and external device storage, this handler is
    // triggered when the user removes the sdcard. MediaDB remains usable
    // and we'll get a bunch of deleted events for the files that are no longer
    // available. But we need to listen to this event so we can switch back
    // to the list of thumbnails. We don't want to be left viewing or editing
    // a photo that is no longer available.
    photodb.oncardremoved = function oncardremoved() {
    };

    // One or more files was created (or was just discovered by a scan)
    photodb.oncreated = function(event) {
      event.detail.forEach(pictureFileCreated);

      if (photodbFirstScan === false)
        countdb(photodb);
    };

    // One or more files were deleted
    // (or were just discovered missing by a scan).
    photodb.ondeleted = function(event) {
      event.detail.forEach(pictureFileDeleted);

      if (photodbFirstScan === false)
        countdb(photodb);
    };
  }

  function pictureFileCreated(fileinfo) {
    debug('pictureFile created filename = ' + fileinfo.name);
    if (photodbFirstScan === true)
      return;

    if (currentView !== 'option-picture') {
      console.log('lxp:: option-picture currentView = ' + currentView);
      return;
    }

    var insertPosition;

    // If we were showing the 'no pictures' overlay, hide it
    if (currentOverlay === 'empty')
      showOverlay(null);

    // If this new image is newer than the first one, it goes first
    // This is the most common case for photos, screenshots, and edits
    if (sortType === 'date') {
      if (files.length === 0 || fileinfo.date > files[0].date) {
        insertPosition = 0;
      }
    } else if (sortType === 'name') {
      if (files.length === 0 ||
        SequenceList.compareFileByName(fileinfo, files[0]) <= 0) {
        insertPosition = 0;
      }
    }

    if (insertPosition !== 0) {
      var thumbnailElts = classifyLists.querySelectorAll('.thumbnail');
      if (thumbnailElts.length === 0)
        classifyLists.appendChild(thumbnail);
      else {
        // Otherwise we have to search for the right insertion spot
        if (sortType === 'date') {
          insertPosition =
            binarysearch(files, fileinfo, compareFilesByDate);
        } else if (sortType === 'name') {
          insertPosition =
            binarysearch(files, fileinfo, SequenceList.compareFileByName);
        }
      }
    }

    debug('pictureFile created insertPosition = ' + insertPosition);
    // Insert the image info into the array
    files.splice(insertPosition, 0, fileinfo);

    // Create a thumbnail for this image and insert it at the right spot
    var thumbnail =
      createListElement('picture', fileinfo, insertPosition);
    var thumbnailElts = classifyLists.querySelectorAll('.thumbnail');
    if (thumbnailElts.length === 0)
      classifyLists.appendChild(thumbnail);
    else
      classifyLists.insertBefore(thumbnail, thumbnailElts[insertPosition]);

    // increment the index of each of the thumbnails after the new one
    for (var i = insertPosition; i < thumbnailElts.length; i++) {
      thumbnailElts[i].dataset.index = i + 1;
    }

    if (renameScan === true) {
      renameScan = false;
      hideSpinner();
      removeDisabled();
    }

    if (files.length > 0) {
      removeDisabled();
    }
  }

  function pictureFileDeleted(filename) {
    debug('pictureFile Deleted filename = ' + filename);
    if (photodbFirstScan === true)
      return;

    if (currentView !== 'option-picture') {
      console.log('lxp:: option-picture currentView = ' + currentView);
      return;
    }

    // Find the deleted file in our pictureFiles = files array
    for (var n = 0; n < files.length; n++) {
      if (files[n].name === filename)
        break;
    }

    if (n >= files.length)  // It was a file we didn't know about
      return;

    // tcl_longxiuping add for bug 694314 begin
    var fileinfo = files[n];

    // If the metdata parser saved a preview image for this photo,
    // delete that, too.
    if (fileinfo &&
      fileinfo.metadata &&
      fileinfo.metadata.preview &&
      fileinfo.metadata.preview.filename) {
      // We use raw device storage here instead of MediaDB because that is
      // what picture_metadata_scripts.js uses for saving the preview.
      var pictures = navigator.getDeviceStorage('pictures');
      pictures.delete(fileinfo.metadata.preview.filename);
    }
    // tcl_longxiuping add for bug 694314 end

    // Remove the image from the array
    files.splice(n, 1)[0];

    // Remove the corresponding thumbnail
    var thumbnailElts = classifyLists.querySelectorAll('.thumbnail');
    URL.revokeObjectURL(
      thumbnailElts[n].querySelector('img').src.slice(5, -2));
    classifyLists.removeChild(thumbnailElts[n]);

    // Change the index associated with
    // all the thumbnails after the deleted one
    // This keeps the data-index attribute of each thumbnail element in sync
    // with the files[] array.
    for (var i = n + 1; i < thumbnailElts.length; i++) {
      thumbnailElts[i].dataset.index = i - 1;
    }

    // If there are no more photos show the "no pix" overlay
    if (files.length === 0) {
      //showOverlay('empty');
      if (renameScan === true) {
        renameScan = false;
        hideSpinner();
        removeDisabled();
      }
      addDisabled();

      if (window.location.hash === '#edit-form') {
        cancelEditMode();
      }
      var _ = navigator.mozL10n.get;
      var msg = _('no-picture-file');
      setTimeout(function() {
        alert(msg);
      }, 0);
    }
  }
  /*picture code end*/

  /* music code begin*/
  function initMusicDB() {
    debug('music init');
    // Here we use the mediadb.js which gallery is using (in shared/js/)
    // to index our music contents with metadata parsed.
    // So the behaviors of musicdb are the same as the MediaDB in gallery
    musicdb = new MediaDB('music', metadataParserMusic, {
//      mimeTypes: [
//        'audio/basic',
//        'audio/ogg',
//        'audio/x-wav',
//        'audio/webm',
//        'audio/mpeg',
//        'audio/mp4',
//        'audio/amr'
//      ],
      indexes: [
        'pureName', 'metadata.album', 'metadata.artist', 'metadata.title',
        'metadata.rated', 'metadata.played', 'date'],
      autoscan: false,     // We're going to call scan() explicitly
      batchSize: 1,
      version: 2
    });

    function metadataParserMusic(file, onsuccess, onerror) {
      debug('music parser');
      LazyLoader.load('js/music_metadata_scripts.js', function() {
        parseAudioMetadata(file, onsuccess, onerror);
      });
    }

    // show dialog in upgradestart, when it finished, it will turned to ready.
    musicdb.onupgrading = function() {
      showOverlay('upgrade');
    };

    // This is called when DeviceStorage becomes unavailable because the
    // sd card is removed or because it is mounted for USB mass storage
    // This may be called before onready if it is unavailable to begin with
    musicdb.onunavailable = function(event) {
      debug('musicdb onunavailable event.detail = ' + event.detail);
      var why = event.detail;
      if (why === MediaDB.NOCARD)
        showOverlay('nocard');
      else if (why === MediaDB.UNMOUNTED)
        showOverlay('pluggedin');
    };

    musicdb.onready = function() {
      // Hide the nocard or pluggedin overlay if it is displayed
      if (currentOverlay === 'nocard' || currentOverlay === 'pluggedin')
        showOverlay(null);

      showOverlay(null);
      musicdb.scan();
    };

    musicdb.onscanstart = function onscanstart() {
      dump('lxp:: performance music start time ' + performance.now());
    };

    musicdb.onscanend = function onscanend() {
      dump('lxp:: performance music end time ' + performance.now());
      if (musicdbFirstScan === true) {
        if (!videodb) {
          console.log('lxp:: init video');
          videodbFirstScan = true;
          Classify.initVideoDB();
        }

        musicdbFirstScan = false;
        $('music').classList.remove('disabled');

        allScanEnd(true);
        console.log('lxp:: musicdbFirstScan = ' + musicdbFirstScan);
      }

      if (musicdbScan === true) {
        if (videodb && !videodbFirstScan) {
          videodbScan = true;
          videodb.scan();
        }

        musicdbScan = false;
        $('music').classList.remove('disabled');

        allScanEnd(false);
      }

      if (renameScan === true) {
        renameScan = false;
        hideSpinner();
        removeDisabled();
      }

      countdb(musicdb);
    };

    // One or more files was created (or was just discovered by a scan)
    musicdb.oncreated = function(event) {
      event.detail.forEach(musicFileCreated);

      if (musicdbFirstScan === false)
        countdb(musicdb);
    };

    // One or more files were deleted
    // (or were just discovered missing by a scan).
    musicdb.ondeleted = function(event) {
      event.detail.forEach(musicFileDeleted);

      if (musicdbFirstScan === false)
        countdb(musicdb);
    };
  }

  function musicFileCreated(fileinfo) {
    debug('musicFile created filename = ' + fileinfo.name);
    if (musicdbFirstScan === true)
      return;

    if (currentView !== 'option-music') {
      console.log('lxp:: option-music currentView = ' + currentView);
      return;
    }

    var insertPosition;

    // If we were showing the 'no pictures' overlay, hide it
    if (currentOverlay === 'empty')
      showOverlay(null);

    // If this new image is newer than the first one, it goes first
    // This is the most common case for photos, screenshots, and edits
    if (sortType === 'date') {
      if (files.length === 0 || fileinfo.date > files[0].date) {
        insertPosition = 0;
      }
    } else if (sortType === 'name') {
      if (files.length === 0 ||
        SequenceList.compareFileByName(fileinfo, files[0]) <= 0) {
        insertPosition = 0;
      }
    }

    if (insertPosition !== 0) {
      var thumbnailElts = classifyLists.querySelectorAll('.music');
      if (thumbnailElts.length === 0)
        classifyLists.appendChild(thumbnail);
      else {
        // Otherwise we have to search for the right insertion spot
        if (sortType === 'date') {
          insertPosition =
            binarysearch(files, fileinfo, compareFilesByDate);
        } else if (sortType === 'name') {
          insertPosition =
            binarysearch(files, fileinfo, SequenceList.compareFileByName);
        }
      }
    }

    // Insert the image info into the array
    files.splice(insertPosition, 0, fileinfo);

    // Create a thumbnail for this image and insert it at the right spot
    //var thumbnail = createMusicList(insertPosition);
    var thumbnail =
      createListElement('music', fileinfo, insertPosition);
    var thumbnailElts = classifyLists.querySelectorAll('.music');
    if (thumbnailElts.length === 0)
      classifyLists.appendChild(thumbnail);
    else
      classifyLists.insertBefore(thumbnail, thumbnailElts[insertPosition]);

    // increment the index of each of the thumbnails after the new one
    for (var i = insertPosition; i < thumbnailElts.length; i++) {
      thumbnailElts[i].dataset.index = i + 1;
    }

    if (renameScan === true) {
      renameScan = false;
      hideSpinner();
      removeDisabled();
    }

    if (files.length > 0) {
      removeDisabled();
    }
  }

  function musicFileDeleted(filename) {
    debug('musicFile deleted filename = ' + filename);
    if (musicdbFirstScan === true)
      return;

    if (currentView !== 'option-music') {
      console.log('lxp:: option-music currentView = ' + currentView);
      return;
    }

    // Find the deleted file in our musicFiles array
    for (var n = 0; n < files.length; n++) {
      if (files[n].name === filename)
        break;
    }

    if (n >= files.length)  // It was a file we didn't know about
      return;

    // Remove the image from the array
    files.splice(n, 1)[0];

    // Remove the corresponding thumbnail
    var thumbnailElts = classifyLists.querySelectorAll('.music');
    classifyLists.removeChild(thumbnailElts[n]);

    // Change the index associated with all
    // the thumbnails after the deleted one
    // This keeps the data-index attribute of each thumbnail element in sync
    // with the pictureFiles[] array.
    for (var i = n + 1; i < thumbnailElts.length; i++) {
      thumbnailElts[i].dataset.index = i - 1;
    }

    // If there are no more photos show the "no pix" overlay
    if (files.length === 0) {
      //showOverlay('empty');
      if (renameScan === true) {
        renameScan = false;
        hideSpinner();
        removeDisabled();
      }
      addDisabled();

      if (window.location.hash === '#edit-form') {
        cancelEditMode();
      }
      var _ = navigator.mozL10n.get;
      var msg = _('no-music-file');
      setTimeout(function() {
        alert(msg);
      }, 0);
    }
  }
  /*music code end*/

  /*video code begin*/
  function initVideoDB() {
    videodb = new MediaDB('videos', metaDataParserVideo, {
      excludeFilter: /DCIM\/\d{3}MZLLA\/\.VID_\d{4}\.3gp$/,
//      mimeTypes: [
//        'video/mpeg',
//        'video/mp4',
//        'video/x-raw-yuv',
//        'video/ogg',
//        'video/webm',
//        'video/3gpp'
//      ],
      indexes: ['pureName'],
      autoscan: false,     // We're going to call scan() explicitly
      version: 2
    });

    // show dialog in upgradestart, when it finished, it will turned to ready.
    videodb.onupgrading = function() {
      showOverlay('upgrade');
    };

    videodb.onunavailable = function(event) {
      var why = event.detail;
      if (why === MediaDB.NOCARD)
        showOverlay('nocard');
      else if (why === MediaDB.UNMOUNTED)
        showOverlay('pluggedin');
    };

    // On devices that have internal and external storage, we get this event
    // when the user pulls the sdcard out. If we're playing a video when that
    // happens, we need to stop or risk a crash.
    videodb.oncardremoved = function() {
    };

    videodb.onready = function() {
      // Hide the nocard or pluggedin overlay if it is displayed
      if (currentOverlay === 'nocard' || currentOverlay === 'pluggedin')
        showOverlay(null);

      showOverlay(null);
      videodb.scan();
    };

    videodb.onscanstart = function() {
      dump('lxp:: performance video start time ' + performance.now());
    };

    videodb.onscanend = function() {
      dump('lxp:: performance video end time ' + performance.now());
      if (videodbFirstScan === true) {
        if (!photodb) {
          console.log('lxp:: init picture');
          photodbFirstScan = true;
          Classify.initPictureDB();
        }

        videodbFirstScan = false;
        $('video').classList.remove('disabled');

        allScanEnd(true);
        console.log('lxp:: videodbFirstScan = ' + videodbFirstScan);
      }

      countdb(videodb);
      if (videodbScan === true) {
        if (photodb && !photodbFirstScan) {
          photodbScan = true;
          photodb.scan();
        }

        videodbScan = false;
        $('video').classList.remove('disabled');

        allScanEnd(false);
      }

      if (renameScan === true) {
        renameScan = false;
        hideSpinner();
        removeDisabled();
      }
    };

    videodb.oncreated = function(event) {
      event.detail.forEach(videoFilecreated);

      if (videodbFirstScan === false)
        countdb(videodb);
    };
    videodb.ondeleted = function(event) {
      event.detail.forEach(videoFileDeleted);

      if (videodbFirstScan === false)
        countdb(videodb);
    };
  }

  function videoFilecreated(fileinfo) {
    debug('videocreated filename = ' + fileinfo.name);
    if (videodbFirstScan === true) {
      return;
    }

    if (currentView !== 'option-video') {
      console.log('lxp:: option-video currentView = ' + currentView);
      return;
    }

    var insertPosition;

    // If we were showing the 'no pictures' overlay, hide it
    if (currentOverlay === 'empty')
      showOverlay(null);

    // If this new image is newer than the first one, it goes first
    // This is the most common case for photos, screenshots, and edits
    if (sortType === 'date') {
      if (files.length === 0 || fileinfo.date > files[0].date) {
        insertPosition = 0;
      }
    } else if (sortType === 'name') {
      if (files.length === 0 ||
        SequenceList.compareFileByName(fileinfo, files[0]) <= 0) {
        insertPosition = 0;
      }
    }

    if (insertPosition !== 0) {
      var thumbnailElts = classifyLists.querySelectorAll('.video');
      if (thumbnailElts.length === 0)
        classifyLists.appendChild(thumbnail);
      else {
        // Otherwise we have to search for the right insertion spot
        if (sortType === 'date') {
          insertPosition =
            binarysearch(files, fileinfo, compareFilesByDate);
        } else if (sortType === 'name') {
          insertPosition =
            binarysearch(files, fileinfo, SequenceList.compareFileByName);
        }
      }
    }

    // Insert the image info into the array
    files.splice(insertPosition, 0, fileinfo);

    // Create a thumbnail for this image and insert it at the right spot
    //var thumbnail = createVideoList(insertPosition);
    var thumbnail =
      createListElement('video', fileinfo, insertPosition);
    var thumbnailElts = classifyLists.querySelectorAll('.video');
    if (thumbnailElts.length === 0)
      classifyLists.appendChild(thumbnail);
    else
      classifyLists.insertBefore(thumbnail, thumbnailElts[insertPosition]);

    // increment the index of each of the thumbnails after the new one
    for (var i = insertPosition; i < thumbnailElts.length; i++) {
      thumbnailElts[i].dataset.index = i + 1;
    }

    if (renameScan === true) {
      renameScan = false;
      hideSpinner();
      removeDisabled();
    }

    if (files.length > 0) {
      removeDisabled();
    }
  }

  function videoFileDeleted(filename) {
    debug('videoFileDeleted filename = ' + filename);

    if (videodbFirstScan === true) {
      return;
    }

    if (currentView !== 'option-video') {
      console.log('lxp:: option-video currentView = ' + currentView);
      return;
    }

    // Find the deleted file in our pictureFiles array
    for (var n = 0; n < files.length; n++) {
      if (files[n].name === filename)
        break;
    }

    if (n >= files.length)  // It was a file we didn't know about
      return;

    // Remove the image from the array
    files.splice(n, 1)[0];

    // Remove the corresponding thumbnail
    var thumbnailElts = classifyLists.querySelectorAll('.video');
    URL.revokeObjectURL(
      thumbnailElts[n].querySelector('img').src.slice(5, -2));
    classifyLists.removeChild(thumbnailElts[n]);

    // Change the index associated with all
    // the thumbnails after the deleted one
    // This keeps the data-index attribute of each thumbnail element in sync
    // with the pictureFiles[] array.
    for (var i = n + 1; i < thumbnailElts.length; i++) {
      thumbnailElts[i].dataset.index = i - 1;
    }

    // If there are no more photos show the "no pix" overlay
    if (files.length === 0) {
      if (renameScan === true) {
        renameScan = false;
        hideSpinner();
      }
      addDisabled();

      if (window.location.hash === '#edit-form') {
        cancelEditMode();
      }
      var _ = navigator.mozL10n.get;
      var msg = _('no-video-file');
      setTimeout(function() {
        alert(msg);
      }, 0);
    }
  }
  /*video code end*/

  /*bluetooth directory code begin*/
  function initBluetooth() {
    showSpinner();
    addDisabled();
    bluetoothenumerated = enumerateBluetooth();
  }

  function enumerateBluetooth() {
    var _ = navigator.mozL10n.get;

    var batch = [];
    var batchsize = PAGE_SIZE;

    var listFragment = document.createDocumentFragment();
    files = [];
    var handle = { state: 'enumerating' };
    var bluetoothdb = navigator.getDeviceStorage('extrasdcard');

    // tcl_longxiuping modified for bug 622073, change the
    // bluetooth location on firefox os v1.3.
    var cursor = bluetoothdb.enumerate('Download/Bluetooth');

    cursor.onerror = function() {
      console.error('bluetooth.enumerate() failed with', cursor.error);
      handle.state = 'error';
      // tcl_longxiuping modified for bug 622073, change the
      // bluetooth location on firefox os v1.3.
      hideSpinner();
      addDisabled();
      alert(_('no-bluetooth-file'));
    };

    cursor.onsuccess = function() {
      viewReleaseEvents();
      // If the enumeration has been cancelled, return without
      // calling the callback and without calling cursor.continue();
      if (handle.state === 'cancelling') {
        handle.state = 'cancelled';
        return;
      }

      var fileinfo = cursor.result;
      if (fileinfo) {
        if (fileinfo.size != 0xffffffff - 1) {
          try {
            batch.push(fileinfo);
            if (batch.length >= batchsize) {
              flush();
              batchsize *= 2;
            }
          }
            //callback(fileinfo, batch, batchsize, files);
          catch (e) {
            console.warn('bluetooth.enumerate(): callback threw', e);
          }
        }
        cursor.continue();
      } else {
        console.log('lxp:: enumerateBluetooth bluetooth done' +
          'fileinfo = ' + fileinfo);
        // Final time, tell the callback that there are no more.
        handle.state = 'complete';
        done();

        if (sortType === 'date') {
          bluetoothDatesort(files);
          cleanUI();
          for (var i = 0; i < files.length; i++) {
            var item = createListElement('bluetooth', files[i], i);
            listFragment.appendChild(item);
          }
          classifyLists.appendChild(listFragment);
          listFragment.innerHTML = '';
        }
        $('sort').addEventListener('change', handleSort);
        hideSpinner();
        removeDisabled();
        viewAttachEvents();

        if (files.length === 0) {
          addDisabled();
        }
      }
    };

    function flush() {
      batch.forEach(thumb);
      batch.length = 0;
    }

    function thumb(fileinfo) {
      files.push(fileinfo); // remember the file

      //var item = createListElement('bluetooth', fileinfo, files.length - 1);
      //classifyLists.appendChild(item); // display the thumbnail
    }

    function done() {
      console.log('lxp:: bluetooth done');
      flush();
      if (files.length === 0) { // If we didn't find anything.
        var _ = navigator.mozL10n.get;
        var msg = _('no-bluetooth-file');
        alert(msg);
      }
      console.log('lxp:: bluetooth done after flush');
    }

    return handle;
  }

  function cancelBluetoothEnumeration(handle) {
    console.log('lxp:: cancelEnumeration handle = ' + handle.state);
    if (handle.state === 'enumerating')
      handle.state = 'cancelling';
  }

  function bluetoothFilecreated(fileinfo) {
    debug('videocreated filename = ' + fileinfo.name);

    if (currentView !== 'option-bluetooth') {
      console.log('lxp:: option-bluetooth currentView = ' + currentView);
      return;
    }

    var insertPosition;

    // If we were showing the 'no pictures' overlay, hide it
    if (currentOverlay === 'empty')
      showOverlay(null);

    // If this new image is newer than the first one, it goes first
    // This is the most common case for photos, screenshots, and edits
    if (sortType === 'date') {
      if (files.length === 0 ||
        getUTCTime(fileinfo.lastModifiedDate) >
          getUTCTime(files[0].lastModifiedDate)) {
        insertPosition = 0;
      }
    } else if (sortType === 'name') {
      if (files.length === 0 ||
        SequenceList.compareFileByName(fileinfo, files[0]) <= 0) {
        insertPosition = 0;
      }
    }

    if (insertPosition !== 0) {
      var thumbnailElts = classifyLists.querySelectorAll('.bluetooth');
      if (thumbnailElts.length === 0)
        classifyLists.appendChild(thumbnail);
      else {
        // Otherwise we have to search for the right insertion spot
        if (sortType === 'date') {
          insertPosition =
            binarysearch(files, fileinfo, bluetoothCompareFilesByDate);
        } else if (sortType === 'name') {
          insertPosition =
            binarysearch(files, fileinfo, SequenceList.compareFileByName);
        }
      }
    }

    // Insert the image info into the array
    files.splice(insertPosition, 0, fileinfo);

    // Create a thumbnail for this image and insert it at the right spot
    var thumbnail =
      createListElement('bluetooth', fileinfo, insertPosition);
    var thumbnailElts = classifyLists.querySelectorAll('.bluetooth');
    if (thumbnailElts.length === 0)
      classifyLists.appendChild(thumbnail);
    else
      classifyLists.insertBefore(thumbnail, thumbnailElts[insertPosition]);

    // increment the index of each of the thumbnails after the new one
    for (var i = insertPosition; i < thumbnailElts.length; i++) {
      thumbnailElts[i].dataset.index = i + 1;
    }

    if (renameScan === true) {
      renameScan = false;
      hideSpinner();
      removeDisabled();
    }

    if (files.length > 0) {
      removeDisabled();
    }
  }

  function blueToothFileDeleted(filename) {
    debug('blueToothFileDeleted filename = ' + filename);

    if (currentView !== 'option-bluetooth') {
      console.log('lxp:: option-bluetooth currentView = ' + currentView);
      return;
    }

    // Find the deleted file in our pictureFiles array
    for (var n = 0; n < files.length; n++) {
      if (files[n].name === filename)
        break;
    }

    if (n >= files.length)  // It was a file we didn't know about
      return;

    // Remove the image from the array
    files.splice(n, 1)[0];

    // Remove the corresponding thumbnail
    var thumbnailElts = classifyLists.querySelectorAll('.bluetooth');
    classifyLists.removeChild(thumbnailElts[n]);

    // Change the index associated with all the thumbnails
    // after the deleted one
    // This keeps the data-index attribute of each thumbnail element in sync
    // with the pictureFiles[] array.
    for (var i = n + 1; i < thumbnailElts.length; i++) {
      thumbnailElts[i].dataset.index = i - 1;
    }

    // If there are no more photos show the "no pix" overlay
    if (files.length === 0) {
      if (renameScan === true) {
        renameScan = false;
        hideSpinner();
      }
      addDisabled();

      if (window.location.hash === '#edit-form') {
        cancelEditMode();
      }
      var _ = navigator.mozL10n.get;
      var msg = _('no-bluetooth-file');
      setTimeout(function() {
        alert(msg);
      }, 0);
    }
  }
  /*bluetooth code end*/

  /*Public function begin*/
  function countdb(mediadb, callback) {
    mediadb.count('date', null, function(num) {
      if (mediadb === photodb) {
        var fileNum = $('picture-num');
        //fileNum.innerHTML = 'Picture (' + num + ')';
        navigator.mozL10n.localize(fileNum, 'picture-num', {n: num});
        if (callback)
          callback(num);
      }
      if (mediadb === musicdb) {
        var fileNum = $('music-num');
        //fileNum.innerHTML = 'Music (' + num + ')';
        navigator.mozL10n.localize(fileNum, 'music-num', {n: num});
        if (callback)
          callback(num);
      }
      if (mediadb === videodb) {
        var fileNum = $('video-num');
        //fileNum.innerHTML = 'Video (' + num + ')';
        navigator.mozL10n.localize(fileNum, 'video-num', {n: num});
        if (callback)
          callback(num);
      }
    });
  }

  function countBluetooth() {
    if (bluetoothdbFirstScan === true || bluetoothdbScan === true) {
      $('bluetooth').classList.add('disabled');
    }

    var fileCount = 0;
    var bluetoothdb = navigator.getDeviceStorage('extrasdcard');
    var cursor = bluetoothdb.enumerate('Download/Bluetooth');
    cursor.onsuccess = function() {
      // enumerate the bluetooth file.
      var fileinfo = cursor.result;
      if (fileinfo) {
        if (fileinfo.size != 0xffffffff - 1) {
          fileCount = fileCount + 1;
        }
        cursor.continue();
      } else {
        var fileNum = $('bluetooth-num');
        //fileNum.innerHTML = 'Bluetooth (' + fileCount + ')';
        navigator.mozL10n.localize(fileNum, 'bluetooth-num', {n: fileCount});

        if (bluetoothdbFirstScan === true) {
          bluetoothdbFirstScan = false;
          $('bluetooth').classList.remove('disabled');

          allScanEnd(true);
          console.log('lxp:: bluetoothdbFirstScan = ' + bluetoothdbFirstScan);
        }

        if (bluetoothdbScan === true) {
          bluetoothdbScan = false;
          $('bluetooth').classList.remove('disabled');

          allScanEnd(false);
        }
      }
    };

    cursor.onerror = function() {
      console.log('Error count bluetooth files number ' + cursor.error + '\n');

      var fileNum = $('bluetooth-num');
      //fileNum.innerHTML = 'Bluetooth (' + fileCount + ')';
      navigator.mozL10n.localize(fileNum, 'bluetooth-num', {n: fileCount});

      if (bluetoothdbFirstScan === true) {
        bluetoothdbFirstScan = false;
        $('bluetooth').classList.remove('disabled');

        allScanEnd(true);
      }

      if (bluetoothdbScan === true) {
        bluetoothdbScan = false;
        $('bluetooth').classList.remove('disabled');

        allScanEnd(false);
      }
    };
  }

  // user click the main page options to show the special
  // classify file lists.
  function showFileLists(dbType, type, order) {
    showSpinner();
    addDisabled();
    viewReleaseEvents();

    console.log('lxp:: showFileLists dbType = ' +
      dbType + '\n' + 'type = ' + type + '\n' + 'order = ' + order);
    files = [];
    switch (dbType) {
      case 'picture':
        db = photodb;
        break;

      case 'music':
        db = musicdb;
        break;

      case 'video':
        db = videodb;
        break;
    }

    // Temporary arrays to hold enumerated files
    var batch = [];
    var batchsize = PAGE_SIZE;

    enumerated = db.enumerate(type, null, order, function(fileinfo) {
      if (fileinfo) {
        //console.log('lxp:: fileinfo.name = ' + fileinfo.name);
        batch.push(fileinfo);
        if (batch.length >= batchsize) {
          flush();
          batchsize *= 2;
        }
      }
      else {
        done();
        viewAttachEvents();

        if (files.length === 0) {
          addDisabled();
        }
      }
    });

    function flush() {
      batch.forEach(thumb);
      batch.length = 0;
    }

    function thumb(fileinfo) {
      files.push(fileinfo); // remember the file
      var item = createListElement(dbType, fileinfo, files.length - 1);
      classifyLists.appendChild(item); // display the thumbnail
    }

    function done() {
      flush();
      if (files.length === 0) { // If we didn't find anything.
        var _ = navigator.mozL10n.get;
        switch (dbType) {
          case 'picture':
            var msg = _('no-picture-file');
            break;

          case 'music':
            var msg = _('no-music-file');
            break;

          case 'video':
            var msg = _('no-video-file');
            break;
        }
        alert(msg);
      }

      console.log('lxp:: done enumerated.state = ' + enumerated.state);
      hideSpinner();
      removeDisabled();
      $('sort').addEventListener('change', handleSort);
    }
    console.log('lxp:: enumerated.state = ' + enumerated.state);
  }

  //utils function
  function createListElement(option, data, num, highlight) {
    var li = document.createElement('li');
    li.dataset.index = num;
    li.classList.add('file-list');

    var fileinfo = data;
    switch (option) {
      case 'picture':
        li.classList.add('thumbnail');
        // We revoke this url in imageDeleted
        if (fileinfo.metadata && fileinfo.metadata.thumbnail) {
          var url = URL.createObjectURL(fileinfo.metadata.thumbnail);
        } else {
          var url = 'style/images/photo.png';
        }
        break;

      case 'music':
        li.classList.add('music');
        var url = 'style/images/music.png';
        break;

      case 'video':
        li.classList.add('video');
        // We revoke this url in videoDeleted
        if (fileinfo.metadata && fileinfo.metadata.poster) {
          var url = URL.createObjectURL(fileinfo.metadata.poster);
        } else {
          var url = 'style/images/video.png';
        }
        break;

      case 'bluetooth':
        li.classList.add('bluetooth');
        var url = 'style/images/bluetooth.png';
        break;
    }

    var index = fileinfo.name.lastIndexOf('/');
    var fileName = fileinfo.name.substring(index + 1);
    if (option === 'bluetooth') {
      var fileDate =
        new Date(fileinfo.lastModifiedDate).Format('yyyy-MM-dd hh:mm:ss');
    } else {
      var fileDate = new Date(fileinfo.date).Format('yyyy-MM-dd hh:mm:ss');
    }

    var entry =
      '<label class="pack-checkbox mycheckbox">' +
        '<input type="checkbox">' +
        '<span></span> ' +
        '</label> ' +
        '<a href="#" >' +
        '<img class="picture" src=' + url + '></img>' +

        '<p class="primary-info">' + fileName + '</p>' +

        '<p class="secondary-info">' +
        '<span class="file-date">' + fileDate + ' | ' +
        '</span>' +
        '<span class="file-size">' + formatSize(fileinfo.size) +
        ' </span>' +
        '</p> ' +
        '</a>';

    li.innerHTML = entry;
//    var highlightDom = li.querySelector('.primary-info');
//    if (highlight)
//      highlightText(highlightDom, highlight);

    return li;
  }

  function handleDateSort() {
    console.log('lxp:: handleDateSort');

    function beginSort(callback) {
      showSpinner();
      addDisabled();
      if (callback) {
        setTimeout(callback, 100);
      }
    }

    function callback() {
      cleanUI();

      var len = files.length;
      console.log('lxp:: currentView = ' + currentView +
        ' files.len = ' + len);
      switch (currentView) {
        case 'option-picture':
          var type = 'picture';
          datesort(files);
          break;
        case 'option-music':
          var type = 'music';
          datesort(files);
          break;
        case 'option-video':
          var type = 'video';
          datesort(files);
          break;
        case 'option-bluetooth':
          var type = 'bluetooth';
          bluetoothDatesort(files);
          break;
      }

      for (var i = 0; i < len; i++) {
        var item = createListElement(type, files[i], i);
        classifyLists.appendChild(item);
      }

      hideSpinner();
      removeDisabled();
    }

    beginSort(callback);
  }

// Assuming that array is sorted according to comparator, return the
// array index at which element should be inserted to maintain sort order
  function binarysearch(array, element, comparator, from, to) {
    if (comparator === undefined)
      comparator = function(a, b) {
        if (a < b)
          return -1;
        if (a > b)
          return 1;
        return 0;
      };

    if (from === undefined)
      return binarysearch(array, element, comparator, 0, array.length);

    if (from === to)
      return from;

    var mid = Math.floor((from + to) / 2);

    var result = comparator(element, array[mid]);
    if (result < 0)
      return binarysearch(array, element, comparator, from, mid);
    else
      return binarysearch(array, element, comparator, mid + 1, to);
  }

  /*date sort for array*/
  function datesort(array) {
    console.log('lxp:: datesort');
    if (array == null)
      return;

    array.sort(compareFilesByDate);
  }

  /*date sort for bluetooth files*/
  function bluetoothDatesort(array) {
    if (array == null)
      return;

    array.sort(bluetoothCompareFilesByDate);
  }

  /*for sdcard bluetooth files to get date*/
  function getUTCTime(date) {
    return date.getTime();
  }

  function handleNameSort() {
    function beginSort(callback) {
      showSpinner();
      addDisabled();
      if (callback) {
        setTimeout(callback, 100);
      }
    }

    function callback() {
      cleanUI();

      var len = files.length;
      if (len) {
        SequenceList.pinyinSort(files);
      }

      switch (currentView) {
        case 'option-picture':
          var type = 'picture';
          break;
        case 'option-music':
          var type = 'music';
          break;
        case 'option-video':
          var type = 'video';
          break;
        case 'option-bluetooth':
          var type = 'bluetooth';
          break;
      }

      for (var i = 0; i < len; i++) {
        var item = createListElement(type, files[i], i);
        classifyLists.appendChild(item);
      }

      hideSpinner();
      removeDisabled();
    }

    beginSort(callback);
  }

  // This comparison function is used for sorting arrays and doing binary
  // search on the resulting sorted arrays.
  function compareFilesByDate(a, b) {
    if (a.date < b.date)
      return 1;  // larger (newer) dates come first
    else if (a.date > b.date)
      return -1;
    return 0;
  }

  function bluetoothCompareFilesByDate(a, b) {
    if (a.lastModifiedDate.getTime() < b.lastModifiedDate.getTime())
      return 1;  // larger (newer) dates come first
    else if (a.lastModifiedDate.getTime() > b.lastModifiedDate.getTime())
      return -1;
    return 0;
  }

  function handleClick(e) {
    if (window.location.hash === '#edit-form') {
      return;
    }
    var contextmenuItem = document.getElementById('contextmenuItem');
    if (!ctxTriggered && contextmenuItem) {
      if (e.target === contextmenuItem.parentNode) {
        e.target.removeChild(contextmenuItem);
        e.target.style.height = '6rem';
      }
    } else {
      handleOpenFile(files[e.target.dataset.index]);
    }
  }

  function handleOpenFile(fileinfo) {
    console.log('lxp:: handleOpenFile fileinfo = ' + JSON.stringify(fileinfo));
    var _ = navigator.mozL10n.get;
    if (!ctxTriggered) {
      var type = fileinfo.type;
      var fileName = fileinfo.name;

      var storage = navigator.getDeviceStorage('sdcard');
      var getreq = storage.get(fileName);

      getreq.onerror = function() {
        var msg = 'failed to get file:' +
          fileName + getreq.error.name +
          getreq.error.name;
        console.log(msg);
      };

      getreq.onsuccess = function() {
        var file = getreq.result;
        if (window.location.hash != '#edit') {
          var a = new MozActivity({
            name: 'open',
            data: {
              'type': type,
              // XXX: https://bugzilla.mozilla.org/show_bug.cgi?id=812098
              filename: fileName,
              blob: file
            }
          });
          a.onsuccess = function onOpenSuccess() {
            console.log('open success');
          };
          a.onerror = function onOpenError() {
            // added by tcl_chenguoqiang PR 679982
            if (this.error.name != 'ActivityCanceled') {
              console.warn('open failed!');
              alert(_('open-error'));
            }
          };
        }
      };
    } else {
      ctxTriggered = false;
    }
  }

  function handleContextMenu(evt) {
    // tcl_longxiuping add for bug 620613 begin.
    if (window.location.hash === '#edit-form') {
      return;
    }
    // tcl_longxiuping add for bug 620613 end.

    var contextmenuItem = document.getElementById('contextmenuItem');
    if (!contextmenuItem) {
      ctxTriggered = true;
      evt.target.style.height = '12rem';

      var item = document.createElement('menu');
      item.id = 'contextmenuItem';

      var gotoBtn = document.createElement('button');
      gotoBtn.id = 'folder';
      gotoBtn.dataset.l10nId = 'folder';
      navigator.mozL10n.localize(gotoBtn, 'folder');
      var renameBtn = document.createElement('button');
      renameBtn.id = 'rename';
      renameBtn.dataset.l10nId = 'rename';
      navigator.mozL10n.localize(renameBtn, 'rename');
      var profileBtn = document.createElement('button');
      profileBtn.id = 'details';
      profileBtn.dataset.l10nId = 'details';
      navigator.mozL10n.localize(profileBtn, 'details');

      item.appendChild(gotoBtn);
      item.appendChild(renameBtn);
      item.appendChild(profileBtn);
      evt.target.appendChild(item);

      var fileinfo = files[evt.target.dataset.index];
      handleContextmenuEvent(fileinfo);
    }
  }

  function handleContextmenuEvent(fileinfo) {
    debug('handleContextmenu fileinfo.name = ' + fileinfo.name);

    $('details').onclick = function(e) {
      console.log('details fileinfo.name = ' + fileinfo.name);
      fileDetails(fileinfo);
    };
    $('rename').onclick = function(e) {
      console.log('details fileinfo.name = ' + fileinfo.name);
      fileRename(fileinfo);
    };
    $('folder').onclick = function(e) {
      FileScan.goToFolder(fileinfo.name);
    };
  }

  return {
    initPictureDB: initPictureDB,
    initMusicDB: initMusicDB,
    initVideoDB: initVideoDB,
    initBluetooth: initBluetooth,

    showFileLists: showFileLists,
    createListElement: createListElement,

    countdb: countdb,
    countBluetooth: countBluetooth,

    cancelBluetoothEnumeration: cancelBluetoothEnumeration,

    handleContextMenu: handleContextMenu,
    handleClick: handleClick,

    handleDateSort: handleDateSort,
    handleNameSort: handleNameSort,

    bluetoothFilecreated: bluetoothFilecreated,
    blueToothFileDeleted: blueToothFileDeleted,

    pictureFileDeleted: pictureFileDeleted,
    musicFileDeleted: musicFileDeleted,
    videoFileDeleted: videoFileDeleted,

    handleOpenFile: handleOpenFile
  };
})();

function showSpinner() {
  if ($('spinner-overlay').classList.contains('hidden')) {
    $('spinner-overlay').classList.remove('hidden');
  }
}

function hideSpinner() {
  if (!$('spinner-overlay').classList.contains('hidden')) {
    $('spinner-overlay').classList.add('hidden');
  }
}

function addDisabled() {
  if (!$('icon-edit').classList.contains('disabled')) {
    $('icon-edit').classList.add('disabled');
  }

  if (!$('fileSort').classList.contains('disabled')) {
    $('fileSort').classList.add('disabled');
  }
}

function removeDisabled() {
  if ($('icon-edit').classList.contains('disabled')) {
    $('icon-edit').classList.remove('disabled');
  }

  if ($('fileSort').classList.contains('disabled')) {
    $('fileSort').classList.remove('disabled');
  }
}

function viewAttachEvents() {
  console.log('lxp:: viewAttachEvents');
  classifyLists.addEventListener('click', Classify.handleClick);
  classifyLists.addEventListener('contextmenu', Classify.handleContextMenu);
}

function viewReleaseEvents() {
  console.log('lxp:: viewReleaseEvents');
  classifyLists.removeEventListener('click', Classify.handleClick);
  classifyLists.removeEventListener('contextmenu', Classify.handleContextMenu);
}
