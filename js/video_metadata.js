/**
 * Created with JetBrains WebStorm.
 * User: tclxa
 * Date: 7/19/13
 * Time: 5:24 PM
 * To change this template use File | Settings | File Templates.
 */
var THUMBNAIL_WIDTH = 60;  // Just a guess at a size for now
var THUMBNAIL_HEIGHT = 60;

// Given a video File object, asynchronously pass an object of metadata to
// the specified callback.
function metaDataParserVideo(videofile, callback) {
  var previewPlayer = document.createElement('video');
  var metadata = {};

  if (!previewPlayer.canPlayType(videofile.type)) {
    console.log('lxp:: !previewPlayer.canPlayType videofile.type = ' +
      videofile.type);
    metadata.isVideo = false;
    callback(metadata);
    return;
  }

  // Create a blob: url for the file. It will be revoked in unload().
  var url = URL.createObjectURL(videofile);

  // Load the video into an offscreen <video> element.
  previewPlayer.preload = 'metadata';
  previewPlayer.src = url;

  previewPlayer.style.width = THUMBNAIL_WIDTH + 'px';
  previewPlayer.style.height = THUMBNAIL_HEIGHT + 'px';

  previewPlayer.onerror = function(e) {
    // Something went wrong. Maybe the file was corrupt?
    console.error("Can't play video", videofile.name, e);
    metadata.isVideo = false;
    unload();
    callback(metadata);
  };

  previewPlayer.onloadedmetadata = function() {
    // If videoWidth is 0 then this is likely an audio file (ogg / mp4)
    // with an ambiguous filename extension that makes it look like a video.
    // This test only works correctly if we're using a new offscreen video
    // element each time. If I try to make the element a global, then it
    // retains the size of the last video when a non-video is loaded.
    if (!previewPlayer.videoWidth) {
      metadata.isVideo = false;
      unload();
      callback(metadata);
      console.log('lxp:: videofile.name = ' + videofile.name);
      console.log('lxp:: metadata.isVideo = ' + metadata.isVideo);
      return;
    }

    // Otherwise it is a video!
    metadata.isVideo = true;

    var index = videofile.name.lastIndexOf('/');
    var fileName = videofile.name.substring(index + 1);
    metadata.title = fileName;

    console.log('lxp:: metadata.title = ' + metadata.title);
    console.log('lxp:: metadata.isVideo = ' + metadata.isVideo);

    // The video element tells us the video duration and size.
    metadata.duration = previewPlayer.duration;
    metadata.width = previewPlayer.videoWidth;
    metadata.height = previewPlayer.videoHeight;

    // If this is a .3gp video file, look for its rotation matrix and
    // then create the thumbnail. Otherwise set rotation to 0 and
    // create the thumbnail immediately.  getVideoRotation is defined
    // in shared/js/media/get_video_rotation.js
    if (/.3gp$/.test(videofile.name)) {
      getVideoRotation(videofile, function(rotation) {
        if (typeof rotation === 'number')
          metadata.rotation = rotation;
        else if (typeof rotation === 'string')
          console.warn('Video rotation:', rotation);
        createThumbnail();
      });
    } else {
      metadata.rotation = 0;
      createThumbnail();
    }
  };


  function createThumbnail() {
    // Videos often begin with a black screen, so skip ahead 5 seconds
    // or 1/10th of the video, whichever is shorter in the hope that we'll
    // get a more interesting thumbnail that way.
    // Because of bug 874692, corrupt video files may not be seekable,
    // and may not fire an error event, so if we aren't able to seek
    // after a certain amount of time, we'll abort and assume that the
    // video is invalid.
    previewPlayer.currentTime = Math.min(5, previewPlayer.duration / 10);

    var failed = false;                      // Did seeking fail?
    var timeout = setTimeout(fail, 10000);   // Fail after 10 seconds
    previewPlayer.onerror = fail;           // Or if we get an error event
    function fail() {                        // Seeking failure case
      console.warn('Seek failed while creating thumbnail for ',
        videofile.name, '. Ignoring corrupt file.');
      failed = true;
      clearTimeout(timeout);
      previewPlayer.onerror = null;
      metadata.isVideo = false;
      unload();
      callback(metadata);
    }
    previewPlayer.onseeked = function() {   // Seeking success case
      if (failed) // Avoid race condition: if we already failed, stop now
        return;
      clearTimeout(timeout);
      captureFrame(previewPlayer, metadata, function(poster) {
        if (poster === null) {
          // If something goes wrong in captureFrame, it probably means that
          // this is not a valid video. In any case, if we don't have a
          // thumbnail image we shouldn't try to display it to the user.
          // XXX: See bug 869289: maybe we should not fail here.
          fail();
        }
        else {
          metadata.poster = poster;
          unload();
          callback(metadata); // We've got all the metadata we need now.
        }
      });
    };
  }

  // Free the resources being used by the offscreen video element
  function unload() {
    URL.revokeObjectURL(previewPlayer.src);
    previewPlayer.removeAttribute('src');
    previewPlayer.load();
  }

  // The text case of key in metadata is not always lower or upper cases. That
  // depends on the creation tools. This function helps to read keys in lower
  // cases and returns the value of corresponding key.
  function readFromMetadata(lowerCaseKey) {
    var tags = previewPlayer.mozGetMetadata();
    for (var key in tags) {
      // to lower case and match it.
      if (key.toLowerCase() === lowerCaseKey) {
        return tags[key];
      }
    }
    // no matched key, return undefined.
    return;
  }
}

function captureFrame(player, metadata, callback) {
  try {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = THUMBNAIL_WIDTH;
    canvas.height = THUMBNAIL_HEIGHT;

    var vw = player.videoWidth, vh = player.videoHeight;
    var tw, th;

    // If a rotation is specified, rotate the canvas context
    switch (metadata.rotation) {
      case 90:
        ctx.translate(THUMBNAIL_WIDTH, 0);
        ctx.rotate(Math.PI / 2);
        tw = THUMBNAIL_HEIGHT;
        th = THUMBNAIL_WIDTH;
        break;
      case 180:
        ctx.translate(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
        ctx.rotate(Math.PI);
        tw = THUMBNAIL_WIDTH;
        th = THUMBNAIL_HEIGHT;
        break;
      case 270:
        ctx.translate(0, THUMBNAIL_HEIGHT);
        ctx.rotate(-Math.PI / 2);
        tw = THUMBNAIL_HEIGHT;
        th = THUMBNAIL_WIDTH;
        break;
      default:
        tw = THUMBNAIL_WIDTH;
        th = THUMBNAIL_HEIGHT;
        break;
    }

    // Need to find the minimum ratio between heights and widths,
    // so the image (especailly the square thumbnails) would fit
    // in the container with right ratio and no extra stretch.
    // x and y are right/left and top/bottom margins and where we
    // start drawing the image. Since we scale the image, x and y
    // will be scaled too. Below gives us x and y actual pixels
    // without scaling.
    var scale = Math.min(tw / vw, th / vh),
        w = scale * vw, h = scale * vh,
        x = (tw - w) / 2 / scale, y = (th - h) / 2 / scale;

    // Scale the image
    ctx.scale(scale, scale);

    // Draw the current video frame into the image
    ctx.drawImage(player, x, y);

    // Convert it to an image file and pass to the callback.
    canvas.toBlob(callback, 'image/jpeg');
  }
  catch (e) {
    console.error('Exception in captureFrame:', e, e.stack);
    callback(null);
  }
}
