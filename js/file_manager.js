'use strict';

var DEBUG = false;

var CONFIG_MAX_IMAGE_PIXEL_SIZE = 5242880;
var CONFIG_MAX_SNAPSHOT_PIXEL_SIZE = 5242880;
var CONFIG_REQUIRED_EXIF_PREVIEW_WIDTH = 0;
var CONFIG_REQUIRED_EXIF_PREVIEW_HEIGHT = 0;
var CONFIG_MAX_GIF_IMAGE_FILE_SIZE = 2097152;
var CONFIG_MAX_GIF_IMAGE_PIXEL_SIZE = 1048576;

var volumeList = []; // volume list in device.

// classify db.
var photodb;
var musicdb;
var videodb;

var db; // photodb or musicdb or videodb.
var enumerated = {}; // photodb or musicdb or videodb enumerated.
var bluetoothenumerated = {};

var photodbFirstScan = false;
var musicdbFirstScan = false;
var videodbFirstScan = false;
var bluetoothdbFirstScan = false;

var photodbScan = false;
var musicdbScan = false;
var videodbScan = false;
var bluetoothdbScan = false;

var scanningBigImages = false; // using in photodb.

var files = []; // currentView files array in classify.

var sortType = 'date'; // value is 'date' or 'name'.

// UI elements.
var classifyHeader = $('classify-title'); // classify currentView title.
var sdcardHeader = $('sdcard-title');
var fresh = $('fresh');
var rootPage = document.querySelector('#root');

var backButton = $('file-back'); // classify back button.
var listPage = document.querySelector('#fileListView'); // classify list page.
var currentView = '';
// classify list.
var classifyLists = document.querySelector('#fileListView > ul');

var sdcardPage = document.getElementById('sdcardList');
var sdcardLists = document.querySelector('#sdcardList > ul');
var sdcardView = sdcardLists;

// classify edit item.
var cancelButton = document.getElementById('cancel-button');
var editForm = document.getElementById('edit-form');

var classifyShareBtn = document.getElementById('classify-share');
var classifyDeleteBtn = document.getElementById('classify-delete');

var fileSelected = [];
var srcFilePath = [];
var selectedFileNamesToBlobs = {};

var selectedAllFiles = false; // The flag for select or deselect all files.

var ctxTriggered = false; // Identify the click or contextmenu event.

// Overlay messages.
var currentOverlay;  // The id of the current overlay or null if none.

// added by xiaohui.li for PR 657772 start
// The flag that files have been changed(deleted,create,renamed)
var mediaChanged = false;
// added by xiaohui.li for PR 657772 end

//
// If id is null then hide the overlay. Otherwise, look up the localized
// text for the specified id and display the overlay with that text.
// Supported ids include:
//
//   nocard: no sdcard is installed in the phone
//   pluggedin: the sdcard is being used by USB mass storage
//   empty: no pictures found
//
function showOverlay(id) {
  currentOverlay = id;

  if (id === null) {
    document.getElementById('overlay').classList.add('hidden');
    return;
  }

  var title, text;
  if (id === 'nocard') {
    title = navigator.mozL10n.get('nocard2-title');
    text = navigator.mozL10n.get('nocard2-text');
  } else {
    title = navigator.mozL10n.get(id + '-title');
    text = navigator.mozL10n.get(id + '-text');
  }

  var titleElement = document.getElementById('overlay-title');
  var textElement = document.getElementById('overlay-text');

  titleElement.textContent = title;
  titleElement.dataset.l10nId = id + '-title';
  textElement.textContent = text;
  textElement.dataset.l10nId = id + '-text';

  document.getElementById('overlay').classList.remove('hidden');
}

// XXX
// Until https://bugzilla.mozilla.org/show_bug.cgi?id=795399 is fixed,
// we have to add a dummy click event handler on the overlay in order to
// make it opaque to touch events. Without this, it does not prevent
// the user from interacting with the UI.
$('overlay').addEventListener('click', function dummyHandler() {});

function editItemHidden(id) {
  var insertEle = document.getElementById(id);
  if (insertEle && insertEle.parentNode) {
    insertEle.parentNode.style.height = '6rem';
    insertEle.parentNode.removeChild(insertEle);
  }
}

document.addEventListener('visibilitychange', function visibilityChange() {
  if (!document.mozHidden &&
    (window.location.hash == '#root' ||
      window.location.hash == '#classify' ||
      window.location.hash == '#storage')) {
    freshMainPage();
  }
});

navigator.mozL10n.ready(function startupLocale() {
  dump('filemanager:: navigator.mozL10n.ready');

  // This function should be called once. According to the implementation of
  // mozL10n.ready, it may become the event handler of localized.
  // So, we need to prevent MediaStorage re-initialize.
  // XXX: once bug 882592 is fixed, we should remove it and just
  // call MediaStorage.init.
  if (volumeList.length === 0) {
    MediaStorage.init();
  }
});

window.addEventListener('localized', function localized() {
  dump('filemanager:: localized');
  // This will be called during startup, and any time the languange is changed

  // Set the 'lang' and 'dir' attributes to <html> when the page is translated
  document.documentElement.lang = navigator.mozL10n.language.code;
  document.documentElement.dir = navigator.mozL10n.language.direction;
});

window.addEventListener('load', function startup(evt) {
  dump('filemanager:: load');
  window.removeEventListener('load', startup);

  function initDBOrUpdateInfo() {
    if (!musicdb) {
      console.log('lxp:: init music');
      musicdbFirstScan = true;
      if (!$('fresh-button').classList.contains('freshing'))
        $('fresh-button').classList.add('freshing');
      $('picture').classList.add('disabled');
      $('music').classList.add('disabled');
      $('video').classList.add('disabled');
      Classify.initMusicDB();
    }
  }

  initDBOrUpdateInfo(); // music -> video -> picture

  bluetoothdbFirstScan = true;
  Classify.countBluetooth();

  SequenceList.init();
  //rootPage.addEventListener('click', rootPageInit);
  pageSwitch.init('#root');
  fresh.addEventListener('click', freshMainPage);
  backButton.onclick = cancelEnumerate;
  initEdit();

  // startup
  window.addEventListener('hashchange', showPanel);
  switch (window.location.hash) {
    case '#root':
      // Nothing to do here; default startup case.
      break;
    case '':
      document.location.hash = 'root';
      break;
    default:
      document.getElementById('root').classList.remove('current');
      showPanel();
      break;
  }
});

// panel navigation
var oldHash = window.location.hash || '#root';
function showPanel() {
  debug('showPanel  window.location.hash =' + window.location.hash);

  if (window.location.hash === '#classify') {
    $('classify').classList.remove('hidden');
    $('storage').classList.add('hidden');
    $('classify-filter').setAttribute('aria-selected', 'true');
    $('storage-filter').setAttribute('aria-selected', 'false');

    currentPage = 0;
    $('classify').style.transform = 'translateX(0px)';
    rootPage.dataset.type = 'classify';
    // added by xiaohui.li for PR 657772 start
    // If files have been changed, we would refresh classify panel
    // modified by tcl_chenguoqiang PR 687816
    if (mediaChanged && !photodbScan && !musicdbScan &&
        !videodbScan && !bluetoothdbScan &&
        !photodbFirstScan && !musicdbFirstScan &&
        !videodbFirstScan && !bluetoothdbFirstScan) {
      freshMainPage();
    }
    // added by xiaohui.li for PR 657772 end
    return;
  }
  if (window.location.hash === '#storage') {
    $('classify').classList.add('hidden');
    $('storage').classList.remove('hidden');
    $('classify-filter').setAttribute('aria-selected', 'false');
    $('storage-filter').setAttribute('aria-selected', 'true');

    currentPage = 1;
    $('storage').style.transform = 'translateX(0px)';
    rootPage.dataset.type = 'storage';
    return;
  }

  if (window.location.hash == '#edit-form') {
    if (cancelButton && cancelButton.classList.contains('disabled')) {
      cancelButton.classList.remove('disabled');
    }

    if (!$('sort-filter').classList.contains('hidden')) {
      $('sort-filter').classList.add('hidden');
    }
    if ($('edit-select').classList.contains('hidden')) {
      $('edit-select').classList.remove('hidden');
    }

    listPage.classList.toggle('edit');
    checkInputs(classifyLists, 'selectedFileNum');
    editItemHidden('contextmenuItem');

    oldHash = window.location.hash;
    return;
  }

  if (window.location.hash == '#sdcard-edit-form') {
    if (sdcardCancelButton &&
      sdcardCancelButton.classList.contains('disabled')) {
      sdcardCancelButton.classList.remove('disabled');
    }

    selectedAllFiles = false;
    deselectAll(sdcardView, 'sdcard-selectedFileNum');

    if (!$('sdcard-sort-filter').classList.contains('hidden')) {
      $('sdcard-sort-filter').classList.add('hidden');
    }
    if ($('sdcard-edit-select').classList.contains('hidden')) {
      $('sdcard-edit-select').classList.remove('hidden');
    }

    sdcardPage.classList.toggle('edit');
    sdcardLists.removeEventListener('touchstart', HandleGesture.handleEvent);
    checkInputs(sdcardView, 'sdcard-selectedFileNum');
    editItemHidden('insert-div');
    console.log('showpanel remove Touchstart');

    oldHash = window.location.hash;
    console.log('lxp:: sdcard-edit-form oldHash = ' + oldHash);
    return;
  }

  if (window.location.hash == '#root') {
    currentView = '';
  }

  if (window.location.hash === '#fileListView') {
    selectedAllFiles = false;
    deselectAll(classifyLists, 'selectedFileNum');

    $('editCheckbox').querySelector('input').checked = false;

    if ($('sort-filter').classList.contains('hidden')) {
      $('sort-filter').classList.remove('hidden');
    }
    if (!$('edit-select').classList.contains('hidden')) {
      $('edit-select').classList.add('hidden');
    }

    if (oldHash === '#edit-form') {
      listPage.classList.remove('edit');
      oldHash = window.location.hash;
      return;
    }
  }

  if (window.location.hash === '#sdcardList') {
    $('sdcard-editCheckbox').querySelector('input').checked = false;
    if ($('sdcard-sort-filter').classList.contains('hidden')) {
      $('sdcard-sort-filter').classList.remove('hidden');
    }
    if (!$('sdcard-edit-select').classList.contains('hidden')) {
      $('sdcard-edit-select').classList.add('hidden');
    }
    sdcardLists.addEventListener('touchstart', HandleGesture.handleEvent);
    //sdcardPage.classList.remove('edit');

    if (oldHash === '#sdcard-edit-form') {
      sdcardPage.classList.remove('edit');
      oldHash = window.location.hash;
      console.log('lxp:: sdcardList oldHash = ' + oldHash);
      return;
    }
  }

  var hash = window.location.hash;
  var oldPanel = document.querySelector(oldHash);
  var newPanel = document.querySelector(hash);

  // switch previous/current/forward classes.
  oldPanel.className = newPanel.className ? '' : 'previous';
  newPanel.className = 'current';
  oldHash = hash;

  /**
   * Most browsers now scroll content into view taking CSS transforms into
   * account.  That's not what we want when moving between <section>s,
   * because the being-moved-to section is offscreen when we navigate to its
   * #hash.  The transitions assume the viewport is always at document 0,0.
   * So add a hack here to make that assumption true again.
   * https://bugzilla.mozilla.org/show_bug.cgi?id=803170
   */
  if ((window.scrollX !== 0) || (window.scrollY !== 0)) {
    window.scrollTo(0, 0);
  }

  window.addEventListener('transitionend', function paintWait() {
    window.removeEventListener('transitionend', paintWait);
  });
}

// UI showing.
function tap(evt) {
//function rootPageInit(evt) {
  console.log('tap evt.target.id = ' + evt.target.id);

  var _ = navigator.mozL10n.get;

  function reset() {
    $('sort').removeEventListener('change', handleSort);
    $('sort').options[0].selected = true;
    sortType = 'date';
    cleanUI();
  }

  switch (evt.target.id) {
//    case 'fresh':
//      freshMainPage();
//      break;
    case 'option-picture':
      currentView = 'option-picture';
      navigator.mozL10n.localize(classifyHeader, 'classify-picture');
      reset();
      console.log('init Picture DB');
      Classify.showFileLists('picture', 'date', 'prev');
      break;

    case 'option-music':
      currentView = 'option-music';
      navigator.mozL10n.localize(classifyHeader, 'classify-music');
      reset();
      console.log('init Music DB');
      Classify.showFileLists('music', 'date', 'prev');
      break;

    case 'option-video':
      currentView = 'option-video';
      navigator.mozL10n.localize(classifyHeader, 'classify-video');
      reset();
      console.log('init Video DB');
      Classify.showFileLists('video', 'date', 'prev');
      break;

    case 'option-bluetooth':
      currentView = 'option-bluetooth';
      navigator.mozL10n.localize(classifyHeader, 'classify-bluetooth');
      reset();
      console.log('init bluetooth');
      Classify.initBluetooth();
      break;

    case 'option-internal-sdcard':
      currentView = 'option-internal-sdcard';
      var storage = getInternalStorage(volumeList);
      var storageName = getInternalStorageName(volumeList);
      if (storageName !== '') {
        sdcardHeader.textContent = storageName;
        $('folder-storage-name').textContent = storageName;
      }

      console.log('fileSelected.length = ' + fileSelected.length);
      if (fileSelected.length > 0 &&
        (FileScan.flagCopy || FileScan.flagCut)) {
        FileScan.showPasteMenu();
        FileScan.pasteOperate();
      }
      console.log('init optionSDcard');
      FileScan.init(storage);
      break;

    case 'option-sdcard-0':
      currentView = 'option-sdcard-0';
      var storage = getSdcard(volumeList);
      var storageName = getSdcardName(volumeList);
      if (storageName !== '') {
        sdcardHeader.textContent = storageName;
        $('folder-storage-name').textContent = storageName;
      }

      console.log('fileSelected.length = ' + fileSelected.length);
      if (fileSelected.length > 0 &&
        (FileScan.flagCopy || FileScan.flagCut)) {
        FileScan.showPasteMenu();
        FileScan.pasteOperate();
      }
      console.log('init optionSDcard');
      FileScan.init(storage);
      break;

    default:
      console.log('lxp:: default');
      break;
  }
}

function cancelEnumerate() {
  debug('cancelEnumerate currentView = ' + currentView);

  if (enumerated.state && enumerated.state === 'enumerating') {
    db.cancelEnumeration(enumerated);
  }
  if (bluetoothenumerated.state &&
    bluetoothenumerated.state === 'enumerating') {
    console.log('bluetoothenumerated.state = ' + bluetoothenumerated.state);
    Classify.cancelBluetoothEnumeration(bluetoothenumerated);
  }

  if (mediaChanged && !photodbScan && !musicdbScan &&
    !videodbScan && !bluetoothdbScan &&
    !photodbFirstScan && !musicdbFirstScan &&
    !videodbFirstScan && !bluetoothdbFirstScan) {
    freshMainPage();
  }
}

function freshMainPage() {
  debug('freshMainPage fresh');
  if ($('fresh-button').classList.contains('freshing'))
    return;

  if (!$('fresh-button').classList.contains('freshing'))
    $('fresh-button').classList.add('freshing');

  if (rootPage.dataset.type === 'storage') {
    console.log('lxp:: freshMainPage fresh rootPage.dataset.type = ' +
      rootPage.dataset.type);
//    $('internal-sdcard').classList.add('disabled');
//    $('sdcard').classList.add('disabled');
//    Storage.update();
    updateInfo(volumeList);
  } else {
    // added by tcl_chenguoqiang PR 687816
    mediaChanged = false;
    bluetoothdbScan = true;
    Classify.countBluetooth();

    // music -> video -> picture
    if (musicdb && !musicdbFirstScan) {
      $('picture').classList.add('disabled');
      $('music').classList.add('disabled');
      $('video').classList.add('disabled');
      musicdbScan = true;
      musicdb.scan();
    }
  }
}

function cleanUI() {
  console.log('lxp:: cleanUI');
  if (classifyLists.firstChild !== null) {
    classifyLists.innerHTML = '';
  }
}

/* edit mode */
var sdcardCancelButton = document.getElementById('sdcard-cancel');
var editForm = document.getElementById('edit-form');
var sdcardForm = document.getElementById('sdcard-edit-form');
var selectedAllFiles = false;

function initEdit() {
  cancelButton.onclick = cancelEditMode;
  sdcardCancelButton.onclick = cancelEditMode;
  classifyLists.addEventListener('click', editHandleEvent);
  $('editCheckbox').addEventListener('click', editHandleEvent);
  classifyShareBtn.onclick = fileShare;
  classifyDeleteBtn.onclick = fileDelete;
  editForm.addEventListener('submit', editHandleEvent);
}

function editHandleEvent(evt) {
  debug('evt.type = ' + evt.type + '   window.location.hash = ' +
    window.location.hash);
  switch (evt.type) {
    case 'click':
      console.log('lxp:: editHandleEvent click');
      if (window.location.hash != '#edit-form') {
        return;
      }

      if (evt.target.type &&
        evt.target.type === 'checkbox' &&
        evt.target.parentNode.classList.contains('edit-checkbox')) {
        if (!checkIfSelectedAll(classifyLists)) {
          selectedAllFiles = true;
          selectAll(classifyLists, 'selectedFileNum');
        } else {
          selectedAllFiles = false;
          deselectAll(classifyLists, 'selectedFileNum');
        }
        break;
      }

      //check the selected files number
      if (evt.target.type && evt.target.type === 'checkbox') {
        checkInputs(classifyLists, 'selectedFileNum');
      }
      break;

    case 'submit':
      evt.preventDefault();
      return false;
      break;

    default:
      return;
  }
}

function selectAll(view, selectedNum) {
  debug('selectAll view ' + view);
  var selectAllInput =
    view.parentNode.querySelector('.select-deselect-all');

  if (selectAllInput && selectAllInput.classList.contains('disabled')) {
    return;
  }

  if (selectAllInput) {
    selectAllInput.classList.add('disabled');
  }

  var inputs =
    view.querySelectorAll('input[type="checkbox"]:not(:checked)');
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].checked = true;
    chooseItem(inputs[i]);
  }
  checkInputs(view, selectedNum);
}

function deselectAll(view, selectedNum) {
  debug('deselectAll view ' + view);

  var selectAllInput =
    view.parentNode.querySelector('.select-deselect-all');

  if (selectAllInput && selectAllInput.classList.contains('disabled')) {
    return;
  }

  if (selectAllInput) {
    selectAllInput.classList.add('disabled');
  }

  var inputs =
    view.querySelectorAll('input[type="checkbox"]:checked');
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].checked = false;
    chooseItem(inputs[i]);
  }
  checkInputs(view, selectedNum);
}

function cancelEditMode(e) {
  if (checkSelected) {
    return;
  }

  if (e && e.target == cancelButton) {
    if (cancelButton.classList.contains('disabled')) {
      return;
    }

    cancelButton.classList.add('disabled');
  }

  if (e && e.target == sdcardCancelButton) {
    if (sdcardCancelButton.classList.contains('disabled')) {
      return;
    }

    sdcardCancelButton.classList.add('disabled');
  }

  window.history.go(-1);
}

function chooseItem(target) {
  if (!target.checked) {
    // Removing red bubble
    target.parentNode.classList.remove('selected');
  } else {
    // Adding red bubble
    target.parentNode.classList.add('selected');
  }
}

// tcl_longxiuping add for bug 675662 begin.
function checkIfSelectedAll(view) {
  var selected = view.querySelectorAll('input[type="checkbox"]:checked');
  var allInputs = view.querySelectorAll('input[type="checkbox"]');

  if (selected.length === allInputs.length) {
    return true;
  }

  return false;
}
// tcl_longxiuping add for bug 675662 end.

var checkSelected = false;
function checkInputs(view, selectedNum) {
  checkSelected = true;

  var selected = view.querySelectorAll('input[type="checkbox"]:checked');
  // tcl_longxiuping add for bug 619292 begin.
  var allInputs = view.querySelectorAll('input[type="checkbox"]');

  if (selected.length === allInputs.length) {
    if (view == sdcardView) {
      $('sdcard-editCheckbox').querySelector('input').checked = true;
    }
    if (view == classifyLists) {
      $('editCheckbox').querySelector('input').checked = true;
    }
  } else {
    if (view == sdcardView) {
      $('sdcard-editCheckbox').querySelector('input').checked = false;
    }
    if (view == classifyLists) {
      $('editCheckbox').querySelector('input').checked = false;
    }
  }
  // tcl_longxiuping add for bug 619292 end.

  if (selected.length > 0) {
    navigator.mozL10n.localize($(selectedNum), 'selected',
      {n: selected.length});
  } else {
    navigator.mozL10n.localize($(selectedNum), 'no-selected');
  }

  clearEditArray();

  var flag = 'false';
  for (var i = 0; i < selected.length; i++) {
    debug('checkInputs ' + selected.length +
      ' selected[i].parentNode.dataset.index = ' +
      selected[i].parentNode.parentNode.dataset.index);

    fileSelected.push(selected[i]);
    var num = selected[i].parentNode.parentNode.dataset.index;

    if (currentView === 'option-internal-sdcard' ||
      currentView === 'option-sdcard-0') {
      if (selected[i].parentNode.parentNode.dataset.isFolder == 'true') {
        flag = 'true';
      }
      FileScan.userSelectedFile(num);
    } else {
      var fileName = files[num].name;
      srcFilePath.push(fileName);
    }
  }

  if (flag == 'true') {
    $('sdcard-share').classList.add('disabled');
  } else {
    if ($('sdcard-share').classList.contains('disabled')) {
      $('sdcard-share').classList.remove('disabled');
    }
  }

  var selectAllInput =
    view.parentNode.querySelector('.select-deselect-all');
  if (selectAllInput && selectAllInput.classList.contains('disabled')) {
    selectAllInput.classList.remove('disabled');
  }

  checkSelected = false;
  debug('checkInputs fileSelected.length = ' + fileSelected.length);
}

// Clicking on the share button in select mode shares all selected files.
function fileShare() {
  var _ = navigator.mozL10n.get;

  if (srcFilePath.length === 0) {
    var shareMsg = _('no-file-to-share');
    alert(shareMsg);
    return;
  }

  // tcl_longxiuping modified for bug 700038 begin
  if (JSON.stringify(selectedFileNamesToBlobs) !== '{}') {
    reallyShare();
    return;
  }

  if (window.location.hash === '#edit-form') {
    if (srcFilePath.length > 50) {
      showSpinner();
    }
  }

  if (window.location.hash === '#sdcard-edit-form') {
    if (srcFilePath.length > 50) {
      sdcardShowSpinner();
    }
  }
  // tcl_longxiuping modified for bug 700038 end

  var getFileNum = 0;
  srcFilePath.forEach(function(filename) {
    //We get files through the sdcard
    getFile(filename, function(file) {
      selectedFileNamesToBlobs[filename] = file;
      if (getFileNum === srcFilePath.length) {
        reallyShare();
      }
    }, function() {
      if (getFileNum === srcFilePath.length) {
        reallyShare();
      }
    });
  });

  // Look up the specified filename in DeviceStorage and pass the
  // resulting File object to the specified callback.
  function getFile(filename, callback, errback) {
    console.log('lxp:: filename = ' + filename);

    var storage = navigator.getDeviceStorage('extrasdcard');
    var getRequest = storage.get(filename);
    getRequest.onsuccess = function() {
      getFileNum++;
      callback(getRequest.result);
    };
    getRequest.onerror = function() {
      getFileNum++;
      var errmsg = getRequest.error && getRequest.error.name;
      if (errback)
        errback(errmsg);
      else
        console.error('MediaDB.getFile:', errmsg);
    };
  }

  function reallyShare() {
    var blobs = srcFilePath.map(function(name) {
      return selectedFileNamesToBlobs[name];
    });
    share(blobs);

    if (window.location.hash === '#edit-form') {
      hideSpinner();
    }

    if (window.location.hash === '#sdcard-edit-form') {
      sdcardHideSpinner();
    }
  }
}

function share(blobs) {
  debug('files share blobs.length = ' + blobs.length);
  var _ = navigator.mozL10n.get;

  if (blobs.length === 0) {
    var shareMsg = _('no-file-to-share');
    alert(shareMsg);
    return;
  }

  var names = [], types = [], fullpaths = [];

  // Get the file name (minus path) and type of each blob.
  blobs.forEach(function(blob) {
    debug('blobs.forEach ' + blob.name);
    // Discard the path, we just want the base name
    var name = blob.name;
    // We try to fix Bug 814323 by using
    // current workaround of bluetooth transfer
    // so we will pass both filenames and fullpaths
    // The fullpaths can be removed after Bug 811615 is fixed
    fullpaths.push(name);
    name = name.substring(name.lastIndexOf('/') + 1);
    names.push(name);

    // And we just want the first component of the type "image" or "video".
    var type = blob.type;
    debug('files share type = ' + type);
    if (type)
      type = type.substring(0, type.indexOf('/'));
    types.push(type);
    debug('types files share type = ' + type);
  });

  // If there is just one type, or if all types are the same, then use
  // that type plus '/*'. Otherwise, use 'multipart/mixed'
  // If all the blobs are image we use 'image/*'. If all are videos
  // we use 'video/*'. Otherwise, 'multipart/mixed'.
  var type;
  if (types.length === 1 ||
    types.every(function(t) { return t === types[0]; })) {
    type = types[0] + '/*';
  } else {
    type = 'multipart/mixed';
  }

  var a = new MozActivity({
    name: 'share',
    data: {
      type: type,
      number: blobs.length,
      blobs: blobs,
      filenames: names,
      filepaths: fullpaths
    }
  });

  a.onsuccess = function(e) {
    console.log('share success!');
    if (currentView === 'option-internal-sdcard' ||
      currentView === 'option-sdcard-0') {
      deselectAll(sdcardView, 'sdcard-selectedFileNum');
    } else {
      deselectAll(classifyLists, 'selectedFileNum');
    }
  };

  a.onerror = function(e) {
    console.log('share error!');
    if (a.error.name === 'NO_PROVIDER') {
      var errorMsg = _('share-noprovider');
      alert(errorMsg);
    }
    else {
      console.warn('share activity error:', a.error.name);
    }
  };
}

// using in classify.
function fileDelete() {
  var _ = navigator.mozL10n.get;

  if (srcFilePath.length === 0) {
    var deleteMsg = _('no-file-to-delete');
    alert(deleteMsg);
    return;
  }

  var confirmMsg = _('delete-confirm', {n: srcFilePath.length});
  if (confirm(confirmMsg)) {
    showSpinner();
    var deleteSuccess = 0;
    var deleteError = 0;
    var storage = navigator.getDeviceStorage('extrasdcard');
    srcFilePath.forEach(function(filename) {
      var request = storage.delete(filename);
      request.onerror = function(e) {
        function errorCallbcak() {
          console.error('bluetoothdb.deleteFile(): Failed to delete',
            filename, 'from DeviceStorage:', e.target.error);

          var name = filename.substring(filename.lastIndexOf('/') + 1);
          alert(name + ' ' + _('delete-error'));

          deleteError++;
          if ((deleteSuccess + deleteError) === srcFilePath.length) {
            hideSpinner();
            clearEditArray();
            deselectAll(classifyLists, 'selectedFileNum');
          }
        }

        setTimeout(errorCallbcak, 0);
      };

      request.onsuccess = function(e) {
        deleteSuccess++;
        switch (currentView) {
          case 'option-picture':
            Classify.pictureFileDeleted(filename);
            break;

          case 'option-music':
            Classify.musicFileDeleted(filename);
            break;

          case 'option-video':
            Classify.videoFileDeleted(filename);
            break;

          case 'option-bluetooth':
            Classify.blueToothFileDeleted(filename);
            break;
        }

        // added by xiaohui.li for PR 657772 start
        if (!mediaChanged)
          mediaChanged = true;
        // added by xiaohui.li for PR 657772 end

        console.log('fileDelete: success from DeviceStorage');
        if ((deleteSuccess + deleteError) === srcFilePath.length) {
          hideSpinner();
          clearEditArray();
          deselectAll(classifyLists, 'selectedFileNum');
        }
      };
    });
  }
}

function fileDetails(fileinfo) {
  var _ = navigator.mozL10n.get;
  var data = {};

  console.log('lxp:: fileDetails fileinfo = ' + JSON.stringify(fileinfo));

  var index = fileinfo.name.lastIndexOf('/');
  var index2 = fileinfo.name.indexOf('/', 1);
  var fileName = fileinfo.name.substring(index + 1);
  var location = fileinfo.name.substring(0, index + 1);
  var dlElement = document.querySelector('#detail-view dl');
  // tcl_longxiuping add for bug 619031.
  if (volumeList.length > 1 && location.indexOf('/sdcard/') === 0) {
    var storageName = getInternalStorageName(volumeList);
    location = location.replace(/sdcard/, storageName);
  } else if (location.indexOf('/sdcard/') === 0) {
    var storageName = getSdcardName(volumeList);
    location = location.replace(/sdcard/, storageName);
  } else if (location.indexOf('/external_sdcard/') === 0) {
    var storageName = getSdcardName(volumeList);
    location = location.replace(/external_sdcard/, storageName);
  }

  if (fileinfo.size && fileinfo.size == 0xffffffff - 1) {
    var filepath = fileinfo.name.substring(index2 + 1);
    console.log('lxp:: fileDetails filePath ' + filepath);
    FileScan.enumerateCount(filepath, function(fileCount) {
      var fileLabel = $('file-label');
      fileLabel.setAttribute('data-l10n-id', 'files-count-label');

      fileLabel.textContent = _('files-count-label');
      $('detail-view').classList.remove('hidden');
      $('detail-view').style.zIndex = 225;
      data = {
        'detail-location': location,
        'detail-name': fileName,
        'detail-count': fileCount

      };

      // Populate info overlay view
      MediaUtils.populateMediaInfo(data);
    });
  } else if (fileinfo.size && fileinfo.size != 0xffffffff - 1) {
    var fileLabel = $('file-label');
    fileLabel.setAttribute('data-l10n-id', 'file-size-label');
    fileLabel.textContent = _('file-size-label');
    $('detail-view').classList.remove('hidden');
    $('detail-view').style.zIndex = 225;
    data = {
      'detail-location': location,
      'detail-name': fileName,
      'detail-count': formatSize(fileinfo.size)

    };
    // Populate info overlay view
    MediaUtils.populateMediaInfo(data);
  } else if (fileinfo.size === 0) {
    var fileLabel = $('file-label');
    fileLabel.setAttribute('data-l10n-id', 'file-size-label');
    //necessary for textContent change
    fileLabel.textContent = _('file-size-label');

    $('detail-view').classList.remove('hidden');
    $('detail-view').style.zIndex = 225;
    data = {
      'detail-location': location,
      'detail-name': fileName,
      'detail-count': formatSize(fileinfo.size)
    };
    // Populate info overlay view
    MediaUtils.populateMediaInfo(data);
  } else {
    alert(_('unknown-details'));
  }
}

$('detail-close-button').onclick = function hideFileInformation() {
  $('detail-view').classList.add('hidden');
};
//using in classify
var renameScan = false;
function fileRename(fileinfo) {
  console.log('lxp:: fileRename');
  var _ = navigator.mozL10n.get;

  var srcPath = fileinfo.name;
  var myName = fileinfo.name.substring(fileinfo.name.lastIndexOf('/') + 1);
  var destPath =
    fileinfo.name.substring(0, fileinfo.name.lastIndexOf('/') + 1);
  var detail = {};
  detail.message = myName;
  //detail.content = _('change-name');
  detail.content = 'change-name';

  //var nameEntered = window.prompt(_('change-name'), myName);
  Modal_dialog.prompt(detail, fileRenameOperate);

  function fileRenameOperate(nameEntered) {
    if (!nameEntered || nameEntered === '' || nameEntered === myName) {
      if (nameEntered === '') {
        alert(_('input-new-name-message'));
      }
      return;
    }

    var newName = nameEntered;
    if (!nameCheck(newName)) {
      alert(_('invalid-name'));
      return;
    }
    console.log('rename newName = ' + newName + '  destPath = ' + destPath);

    if (countCharacters(nameEntered) > 255) {
      alert(myName + ' ' + _('rename-error'));
      return;
    }

    var renamedb = navigator.getDeviceStorage('extrasdcard');
    var request = renamedb.moveTo(srcPath, destPath + newName);
    request.onsuccess = function() {
      console.log('rename success');

      // added by xiaohui.li for PR 657772 start
      if (!mediaChanged)
        mediaChanged = true;
      // added by xiaohui.li for PR 657772 end

      var result = request.result;
      for (var i = 0 in result) {
        console.log('rename:: result.' + i + ' = ' + result[i]);
      }

      renameScan = true;
      showSpinner();
      addDisabled();

      switch (currentView) {
        case 'option-picture':
          photodb.scan();
          break;
        case 'option-music':
          musicdb.scan();
          break;
        case 'option-video':
          videodb.scan();
          break;
        case 'option-bluetooth':
          Classify.blueToothFileDeleted(fileinfo.name);
          var getRequest = renamedb.get(destPath + newName);

          getRequest.onsuccess = function() {
            Classify.bluetoothFilecreated(getRequest.result);
          };
          getRequest.onerror = function() {
            var errmsg = getRequest.error && getRequest.error.name;
            console.error('lxp:: bluetooth file rename  getFile: ', errmsg);
            alert(myName + ' ' + _('delete-error'));
          };
          break;
        /*case 'option-sdcard':
         var newPath = destPath + newName;
         FileScan.renameFile(result, newPath);
         break;*/
      }
      //window.location.hash = '#fileListView';//???
    };

    request.onerror = function() {
      console.error('Rename error' + request.error + '\n');
      alert(myName + ' ' + _('rename-error'));
    };
  }
}

function clearEditArray() {
  fileSelected = [];
  srcFilePath = [];
  copyOrCutSeleted = [];
  selectedFileNamesToBlobs = {};
}

//using in classify
function handleSort(event) {
  debug('handleSort event.target.type = ' + event.target.type);
  var input = event.target;
  var type = input.dataset.type || input.type; // bug344618
  var key = input.name;

  if (!key || event.type != 'change')
    return;

  var value;
  switch (type) {
    case 'select-one':
      value = input.value; // default as text
      sortType = value;
      console.log('lxp:: select-one value = ' + value);
      break;
  }

  if (sortType === 'date') {
    console.log('lxp:: handleSort date sortType = ' + sortType);
    Classify.handleDateSort();
  } else if (sortType === 'name') {
    console.log('lxp:: handleSort name sortType = ' + sortType);
    Classify.handleNameSort();
  }
}

function debug(s) {
  if (DEBUG) {
    console.log('File Manager :: ' + s + '\n');
  }
}
