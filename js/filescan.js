/**
 * Created with JetBrains WebStorm.
 * User: tclxa
 * Date: 6/5/13
 * Time: 10:04 AM
 * To change this template use File | Settings | File Templates.
 */

var sdcardFiles = [];
var sdcardOrderType = 'name';
var foldSize = 4294967294;
var copyOrCutSeleted = []; // used in copy or cut when selected.
var copyOrCutRecord = []; // used in copy or cut when paste.

var FileScan = (function() {
  var lastpath = '';
  var foldername = '';
  var PAGE_SIZE = 15;
  var folderContainer;
  var listFragment;
  var _storage = null;
  var foldercount = 0;
  var hasfile = true;
  var destFilePath = '';
  var enumerateHandle = {};
  var countHandle = {};
  var deleteSuccess = 0;
  var deleteError = 0;
  var flagCopy = false;
  var flagCut = false;
  var pasteMenu;
  var sdcardBackButton;
  var folderArray = [];
  var fileArray = [];

  function backButtonClick() {
    var _ = navigator.mozL10n.get;

    cancelEnumeration(enumerateHandle);
    cancelEnumeration(countHandle);
    debug('backButtonClick lastpath ' + lastpath + '\n');

    if (lastpath == '') {
      sdcardLists.removeEventListener('click', clickFolder);
      sdcardLists.removeEventListener('contextmenu', pressFile);
      sdcardLists.removeEventListener('touchstart', HandleGesture.handleEvent);
      sdcardPage.dataset.move = '';
      window.location.hash = '#storage';
      sdcardBackButton.href = '#root';
      updateInfo(volumeList);
    } else {
      sdcardBackButton.href = '#sdcardList';
      var index = lastpath.lastIndexOf('/');
      lastpath = lastpath.substring(0, index);
      debug('back lastpath ' + lastpath);

      // lastpath is the root directory of each storage.
      if (lastpath === '/sdcard' || lastpath === '/external_sdcard') {
        if (volumeList.length > 1 && lastpath === '/sdcard') {
          var storageName = getInternalStorageName(volumeList);
          sdcardHeader.textContent = storageName;
        } else {
          var storageName = getSdcardName(volumeList);
          sdcardHeader.textContent = storageName;
        }
        lastpath = '';
        foldername = '';
        enumerateHandle = enumeratefolder('');
      } else {
        var filename = lastpath.substring(lastpath.lastIndexOf('/') + 1);
        sdcardHeader.textContent = filename;
        var fIndex = foldername.lastIndexOf('/');
        foldername = foldername.substring(0, fIndex);
        debug('back foldername ' + foldername);
        enumerateHandle = enumeratefolder(foldername);
      }
    }
  }

  function init(storage, path) {
    debug('lx:: initFileList ');
    initVarible();
    // tcl_longxiuping add for bug 706970 begin
    $('sdcard-sort').removeEventListener('change', sdcardOderChange);
    $('sdcard-sort').options[1].selected = true;
    // tcl_longxiuping add for bug 706970 end
    HandleGesture.init();
    _storage = storage;
    //_storage = navigator.getDeviceStorage(StorageOrSdcard);

    folderContainer = document.querySelector('#folder-directory > ul');
    listFragment = document.createDocumentFragment();
    if (path === undefined)
      enumerateHandle = enumeratefolder('');
    else
      enumerateHandle = enumeratefolder(path);
    sdcardListOperate();
    editOperate();
  }

  function sdcardListOperate() {
    sdcardBackButton.onclick = backButtonClick;
    folderContainer.onclick = clickFolderName;
    $('sdcard-sort').onchange = sdcardOderChange;
    $('sdcard-add-file').onclick = addNewFile;
    $('sdcard-refresh').onclick = function() {
      refreshFile(lastpath);
    };
    $('sdcard-editCheckbox').onclick = clickFolder;
  }

  function initVarible() {
    sdcardFiles = [];
    folderArray = [];
    fileArray = [];
    lastpath = '';
    foldername = '';
    PAGE_SIZE = 15;
    folderContainer = null;
    listFragment;
    _storage = null;
    foldercount = 0;
    destFilePath = '';
    sdcardOrderType = 'name';
    enumerateHandle = {};
    countHandle = {};
    deleteSuccess = 0;
    deleteError = 0;
//    flagCopy = false;
//    flagCut = false;
    pasteMenu = $('paste-menu');
    sdcardBackButton = $('sdcard-back');
  }

  function clickFolder(evt) {
    if (window.location.hash == '#sdcard-edit-form') {
      debug('evt.type = ' + evt.type + '   window.location.hash = ' +
        window.location.hash);
      console.log('lx:: evt.target = ' + evt.target.nodeName);
      console.log('lx:className ' + evt.target.parentNode.className);

      if (evt.target.type &&
        evt.target.type === 'checkbox' &&
        evt.target.parentNode.classList.contains('edit-checkbox')) {

        if (!checkIfSelectedAll(sdcardView)) {
          selectedAllFiles = true;
          selectAll(sdcardView, 'sdcard-selectedFileNum');

        } else {
          selectedAllFiles = false;
          deselectAll(sdcardView, 'sdcard-selectedFileNum');
        }
      }

      if (evt.target.type && evt.target.type === 'checkbox') {
        checkInputs(sdcardView, 'sdcard-selectedFileNum');
      }
      return;
    }
    console.log('lx:clickFolder ---> ' + evt.target + '\n');
    var input = evt.target;
    var type = input.type || input.dataset.type;
    console.log('lx:sdcardLists target ' + input + ' type ' + type + '\n');

    switch (type) {
      case 'filelist':
        debug('press Flag ' + ctxTriggered);
        var insertDiv = document.getElementById('insert-div');
        if (!ctxTriggered) {
          if (insertDiv) {
            editItemHidden('insert-div');
            sdcardLists.addEventListener('touchstart',
              HandleGesture.handleEvent);
            return;
          }
          clickItem(evt);
        } else {
          ctxTriggered = false;
        }
        break;
      default :
        break;
    }
  }

  function clickItem(evt) {
    var fdIndex = evt.target.dataset.index;
    console.log('lx:-->click  ' + fdIndex + '\n');
    if (fdIndex) {
      var fileinfo = sdcardFiles[fdIndex];
      var filePath = fileinfo.name;
      var filename = filePath.substring(filePath.lastIndexOf('/') + 1);

      if (fileinfo.size === foldSize) {
        sdcardHeader.textContent = filename;
        lastpath = filePath;
        foldername = filePath.substring(lastpath.indexOf('/', 1) + 1);
        debug(' file.name = ' + foldername + ' is directory' +
          ' lastpath ' + lastpath);
        enumerateHandle = enumeratefolder(foldername);
      }
      else {
        debug(' file.name = ' + filename + ' is not directory' +
          ' lastpath ' + lastpath);
        Classify.handleOpenFile(fileinfo);
      }
    }
  }

  function pressFile(evt) {
    console.log('lx:press File +++++++++ ' + window.location.hash);
    // tcl_longxiuping add for bug 620613 begin.
    if (window.location.hash === '#sdcard-edit-form') {
      return;
    }
    // tcl_longxiuping add for bug 620613 end.

    var insertDiv = document.getElementById('insert-div');
    var fdIndex = evt.target.dataset.index;
    console.log('lx:press file fdIndex ' + fdIndex);
    if (!insertDiv && fdIndex) {
      ctxTriggered = true;
      sdcardLists.removeEventListener('touchstart',
        HandleGesture.handleEvent);
      var fileinfo = sdcardFiles[fdIndex];
      var items = sdcardLists.querySelectorAll('.file-item');
      var item = items[fdIndex];
      item.classList.add('insert-item');
      item.style.height = '11rem';
      var div = document.createElement('div');
      div.setAttribute('id', 'insert-div');
      var renameBtn = document.createElement('button');
      renameBtn.setAttribute('id', 'rename-button');
      renameBtn.classList.add('insert-button');
      renameBtn.dataset.l10nId = 'rename';
      navigator.mozL10n.localize(renameBtn, 'rename');

      var detailBtn = document.createElement('button');
      detailBtn.setAttribute('id', 'detail-button');
      detailBtn.classList.add('insert-button');
      detailBtn.dataset.l10nId = 'details';
      navigator.mozL10n.localize(detailBtn, 'details');
      div.appendChild(renameBtn);
      div.appendChild(detailBtn);
      item.appendChild(div);

      renameBtn.onclick = function() {
        renameFile(fileinfo);
      };
      detailBtn.onclick = function() {
        fileDetails(fileinfo);
      };
      debug(' pressFile ');
    }
  }

  function enumeratefolder(dir) {
    console.log('lx:---->enumeratefolder dir  ' + dir + '\n');

    var handle = { state: 'enumerating'};
    sdcardLists.removeEventListener('click', clickFolder);
    sdcardLists.removeEventListener('contextmenu', pressFile);
    sdcardAddDisable();
    sdcardLists.innerHTML = '';
    sdcardShowSpinner();
    hasfile = true;
    var batchFiles = [];
    var batchsize = PAGE_SIZE;
    var cursor = _storage.enumerate(dir);
    sdcardFiles = [];
    folderArray = [];
    fileArray = [];

    cursor.onsuccess = function() {
      if (handle.state === 'cancelling') {
        debug('  handle.state    ' + handle.state);
        handle.state = 'cancelled';
        return;
      }
      var fileinfo = cursor.result;
      if (fileinfo) {
        if (isFolderCheck(fileinfo)) {
          folderArray.push(fileinfo);
        } else {
          fileArray.push(fileinfo);
        }

        batchFiles.push(fileinfo);
        if (batchFiles.length >= batchsize) {
          flush();
          batchsize *= 2;
        }
        cursor.continue();
      } else {
        handle.state = 'complete';
        debug(' enumerate finished \n');
        done();
        if (sdcardOrderType === 'date' || sdcardOrderType === 'name') {
          sdcardLists.innerHTML = '';
          if (sdcardOrderType === 'date') {
            datesort(folderArray);
            datesort(fileArray);
            sdcardFiles = folderArray.concat(fileArray);
          } else if (sdcardOrderType === 'name') {
            SequenceList.pinyinSort(folderArray);
            SequenceList.pinyinSort(fileArray);
            sdcardFiles = folderArray.concat(fileArray);
          }
          var len = sdcardFiles.length;
          for (var i = 0; i < len; i++) {
            var fileinfo = sdcardFiles[i];
            var item = loadFile(fileinfo, i);
            listFragment.appendChild(item);
          }
          sdcardLists.appendChild(listFragment);
          listFragment.innerHTML = '';
        }
        sdcardHideSpinner();
        dump('lx:++++++++ hash ' + window.location.hash + '\n');
        if (window.location.hash === '#sdcardList') {
          sdcardRemoveDisable();
        }
        sdcardLists.addEventListener('contextmenu', pressFile);
        sdcardLists.addEventListener('click', clickFolder);
        SequenceList.init();
        insertFolder(dir);
        fileCount();
      }
    };
    cursor.onerror = function() {
      console.log('lx: Error while scanning ' + cursor.error + '\n');
    };

    function flush() {
      batchFiles.forEach(thumb);
      sdcardLists.appendChild(listFragment);

      listFragment.innerHTML = '';
      batchFiles.length = 0;
      batchFiles = [];
    }

    function thumb(fileinfo) {
      sdcardFiles.push(fileinfo);
      if (sdcardFiles.length > 0 && sdcardOrderType === 'default') {
        var item = loadFile(fileinfo, sdcardFiles.length - 1);
        listFragment.appendChild(item);
      }
    }

    function done() {
      flush();
      if (sdcardFiles.length === 0) { // If we didn't find anything.
        sdcardHideSpinner();
      }
    }

    return handle;
  }

  function cancelEnumeration(handle) {
    if (handle.state === 'enumerating')
      handle.state = 'cancelling';
  }

  function datesort(array) {
    console.log('lxp:: datesort');
    if (array == null)
      return;

    array.sort(compareFilesByDate);
  }

  function enumerateCount(dir, callback) {
    var handle = { state: 'enumerating'};
    var cursor = _storage.enumerate(dir);
    var mycount = 0;
    foldercount = 0;
    cursor.onsuccess = function() {
      if (handle.state === 'cancelling') {
        debug('enumerateCount  handle.state    ' + handle.state);
        handle.state = 'cancelled';
        return;
      }
      var fileinfo = cursor.result;
      if (fileinfo) {
        mycount++;
        cursor.continue();
      } else {
        handle.state = 'complete';
        foldercount = mycount;
        // debug("enumerateCount " + mycount);
        if (callback) {
          callback(foldercount);
        }
      }
    };
    return handle;
  }

  function fileCount() {
    var items = sdcardLists.querySelectorAll('.file-item');
    var len = items.length;
    for (var i = 0; i < len; i++) {
      fileItemCount(items[i]);
    }
  }

  function fileItemCount(item) {
    var filePath = item.dataset.path;
    var findex = item.dataset.index;
    var fileinfo = sdcardFiles[findex];
    if (fileinfo.size === foldSize) {
      var foldernail = 'style/images/folder.png';
      item.querySelector('img').src = foldernail;
      var enumeratePath = filePath.substring(filePath.indexOf('/', 1) + 1);
      countHandle = enumerateCount(enumeratePath, function(fileSize) {
        item.querySelector('.file-size').textContent = fileSize;
      });
    } else {
      //var findex = item.dataset.index;
      var fileType = sdcardFiles[findex].type;
      var pictureTypes = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/bmp': 'bmp',
        'image/vnd.wap.wbmp': 'wbmp'
      };
      var musicTypes = {
        'audio/mpeg': 'mp3',
        'audio/mp4': 'm4a',
        'audio/ogg': 'ogg',
        'audio/webm': 'webm',
        'audio/3gpp': '3gp',
        'audio/amr': 'amr',
        'audio/aac': 'aac',
        'audio/x-wav': 'wav' // tcl_longxiuping add for bug 704086
      };
      var videoTypes = {
        'video/mp4': 'mp4',
        'video/mpeg': 'mpg',
        'video/ogg': 'ogg',
        'video/webm': 'webm',
        'video/3gpp': '3gp'
      };
      if (fileType in pictureTypes) {
        var filenail = 'style/images/photo.png';
        item.querySelector('img').src = filenail;
      } else if (fileType in musicTypes) {
        var filenail = 'style/images/music.png';
        item.querySelector('img').src = filenail;
      } else if (fileType in videoTypes) {
        var filenail = 'style/images/video.png';
        item.querySelector('img').src = filenail;
      } else {
        var filenail = 'style/images/file.png';
        item.querySelector('img').src = filenail;
      }
    }
  }

  function isFolderCheck(fileinfo) {
    if (fileinfo.size === undefined ||
      isNaN(fileinfo.size)) {
      return;
    }

    if (fileinfo.size === foldSize) {
      return true;
    } else {
      return false;
    }
  }

  function loadFile(fileinfo, filenum, highlight) {
    var content = '';
    var li = document.createElement('li');
    li.classList.add('file-item');
    // li.dataset.foldIndex = filenum;
    li.dataset.index = filenum;
    li.dataset.type = 'filelist';

    var fileinfo = fileinfo;
    li.dataset.path = fileinfo.name;
    var filePath = fileinfo.name;
    var filename = filePath.substring(filePath.lastIndexOf('/') + 1);
    li.dataset.name = filename;

    if (isFolderCheck(fileinfo) === true) {
      li.dataset.isFolder = 'true';
    } else {
      li.dataset.isFolder = 'false';
    }

    content = CreateFileEntry(fileinfo);
    li.innerHTML = content;

//    var highlightDom = li.querySelector('.primary-info');
//    if (highlight)
//      highlightText(highlightDom, highlight);

    return li;
  }

  function CreateFileEntry(fileinfo) {
    var filePathOrName = fileinfo.name;
    var filename =
      filePathOrName.substring(filePathOrName.lastIndexOf('/') + 1);
    var fileDate =
      new Date(fileinfo.lastModifiedDate).Format('yyyy-MM-dd hh:mm:ss');

    var fileSize = 0;
    if (fileinfo.size !== foldSize) {
      fileSize = formatSize(fileinfo.size);
    }

    var entry =
      '<label class="pack-checkbox mycheckbox">' +
        '<input type="checkbox">' +
        '<span data-type="span"></span> ' +
        '</label> ' +
        '<a href="#" >' +
        '<img class="picture" >' + '</img>' +

        '<p class="primary-info">' + filename + '</p>' +

        '<p class="secondary-info">' +
        '<span class="modify-time">' + fileDate + ' | ' +
        '</span>' +
        '<span class="file-size">' + fileSize +
        ' </span>' +
        '</p> ' +
        '</a>';
    return entry;
  }

  function insertBeforeItem(result) {
    console.log('lxp:: insertBeforeItem result' + result);
    var insertPosition = 0;
    if (sdcardOrderType === 'date') {
      debug('=========== dateOrder \n');

      if (isFolderCheck(result)) {
        insertPosition =
          binarySearchPosition(folderArray, result, compareFilesByDate);
        folderArray.splice(insertPosition, 0, result);
      } else {
        insertPosition =
          binarySearchPosition(fileArray, result, compareFilesByDate);
        folderArray.splice(insertPosition, 0, result);
        insertPosition = folderArray.length + insertPosition;
      }
    } else if (sdcardOrderType === 'name') {
      debug(' =========== nameOrder \n');

      if (isFolderCheck(result)) {
        insertPosition =
          binarySearchPosition(folderArray, result,
            SequenceList.compareFileByName);
        folderArray.splice(insertPosition, 0, result);
      } else {
        insertPosition =
          binarySearchPosition(fileArray, result,
            SequenceList.compareFileByName);
        fileArray.splice(insertPosition, 0, result);
        insertPosition = folderArray.length + insertPosition;
      }
    }
    console.log('lx: position ' + insertPosition);
    sdcardFiles = folderArray.concat(fileArray);

    var items = sdcardLists.querySelectorAll('.file-item');
    debug('insert folder path ' + lastpath + ' result.name' + result.name);
    var item = loadFile(result, insertPosition);
    if (sdcardLists.hasChildNodes()) {
      sdcardLists.insertBefore(item, items[insertPosition]);
    } else {
      sdcardLists.appendChild(item);
    }
    var len = items.length;
    for (var i = insertPosition; i < len; i++) {
      items[i].dataset.index = i + 1;
    }
    return item;
  }

  function compareFilesByDate(a, b) {
    if (a.lastModifiedDate.getTime() < b.lastModifiedDate.getTime())
      return 1;  // larger (newer) dates come first
    else if (a.lastModifiedDate.getTime() > b.lastModifiedDate.getTime())
      return -1;
    return 0;
  }

  function binarySearchPosition(array, element, comparator, from, to) {
    if (comparator === undefined)
      comparator = function(a, b) {
        if (a < b)
          return -1;
        if (a > b)
          return 1;
        return 0;
      };

    if (from === undefined)
      return binarySearchPosition(array, element, comparator, 0, array.length);

    if (from === to)
      return from;

    var mid = Math.floor((from + to) / 2);

    //binary compare time order from small to big
    var result = comparator(element, array[mid]);
    debug(' compare Files result  ' + result);
    if (result < 0)
    //a>b return -1
      return binarySearchPosition(array, element, comparator, from, mid);
    else
    //a<b return 1
      return binarySearchPosition(array, element, comparator, mid + 1, to);

  }

  function sameFileCheck(nameEntered) {
    var _ = navigator.mozL10n.get;

    for (var i = 0, len = sdcardFiles.length; i < len; i++) {
      var filepath = sdcardFiles[i].name;
      var filename = filepath.substring(filepath.lastIndexOf('/') + 1);
      debug('  fielname  ' + filename + '\n');
      if (filename === nameEntered) {
        alert('"' + filename + '" ' + _('same-name'));
        return true;
      }
    }

    return false;
  }

  function addNewFile() {
    var _ = navigator.mozL10n.get;

    var inputname = '';
    var detail = {};
    detail.message = inputname;
    detail.content = 'input-new-folder-name';
    // var nameEntered = window.prompt(_('input-new-folder-name'), inputname);
    Modal_dialog.prompt(detail, addNewFileOperate);

    function addNewFileOperate(nameEntered) {
      if (!nameEntered || nameEntered === '')
        return;
      debug('  nameEntered   ' + nameEntered + 'sdcardFiles.length ' +
        sdcardFiles.length + '\n');
      if (sameFileCheck(nameEntered)) {
        return;
      }

      createFolder(nameEntered);
    }

    function createFolder(inputname) {
      var addpath;
      console.log('lx:createFolder input name ' + inputname + '\n');
      if (inputname == '') {
        alert(_('input-name-message'));
        return;
      }

      if (!nameCheck(inputname)) {
        alert(_('invalid-name'));
        return;
      }

      debug(' create new folder ' + lastpath);
      if (lastpath == '') {
        addpath = inputname;
      }
      else {
        addpath = foldername + '/' + inputname;
      }
      debug(' add folder path  ' + addpath + '\n');
      var createRequest = _storage.createDirectory(addpath);

      createRequest.onsuccess = function() {
        //debug(' ===== new  file name ' + createRequest.result);
        var getRequest = _storage.get(createRequest.result);
        getRequest.onsuccess = function() {
          var fileinfo = getRequest.result;
          var item = insertBeforeItem(fileinfo);
          fileItemCount(item);
        };
      };
      createRequest.onerror = function() {
        console.error('Add new folder error, ' + createRequest.error);
        alert(_('add-folder-error-message'));
      };
    }
  }

  function dateOrderFile() {
    datesort(folderArray);
    datesort(fileArray);
    sdcardFiles = folderArray.concat(fileArray);

    var len = sdcardFiles.length;
    sdcardShowSpinner();
    for (var i = 0; i < len; i++) {
      sdcardLists.innerHTML = '';
      listFragment.innerHtml = '';
      var fileinfo = sdcardFiles[i];
      var item = loadFile(fileinfo, i);
      listFragment.appendChild(item);
    }
    sdcardLists.appendChild(listFragment);
    sdcardHideSpinner();
    fileCount();
  }

  function nameOrderFile() {
    SequenceList.pinyinSort(folderArray);
    SequenceList.pinyinSort(fileArray);
    sdcardFiles = folderArray.concat(fileArray);

    var len = sdcardFiles.length;
    sdcardShowSpinner();
    for (var i = 0; i < len; i++) {
      sdcardLists.innerHTML = '';
      listFragment.innerHTML = '';
      var fileinfo = sdcardFiles[i];
      var item = loadFile(fileinfo, i);
      listFragment.appendChild(item);
    }
    sdcardLists.appendChild(listFragment);
    sdcardHideSpinner();
    fileCount();
  }

  function sdcardOderChange(evt) {
    var select = evt.target;
    debug(' sdcardOderChange' + select.value);
    sdcardOrderType = select.value;
    switch (sdcardOrderType) {
      case 'date':
        dateOrderFile();
        break;
      case 'name':
        nameOrderFile();
        break;
      default:
        //refreshFile(lastpath);
        break;
    }
  }

  function refreshFile(refPath) {
    debug('lx:sdcard-refreash lastpath' + refPath);
    var refreshpath = refPath;
    if (lastpath.indexOf('/') != -1) {
      refreshpath = refPath.substring(refPath.indexOf('/', 1) + 1);
    }
    debug('lx:sdcard-refreash refreshpath' + refreshpath);
    enumerateHandle = enumeratefolder(refreshpath);
  }

  function editOperate() {
    $('cut').onclick = function() {
      var _ = navigator.mozL10n.get;

      if (srcFilePath.length === 0) {
        alert(_('no-file-to-cut'));
        return;
      }
      var len = fileSelected.length;
      debug('lx: cut ' + len + ' currentView ' + currentView);
      if (len > 0 && (currentView == 'option-internal-sdcard' ||
        currentView == 'option-sdcard-0')) {
        sdcardShowSpinner();

        flagCopy = false;
        flagCut = true;
        copyOrCutRecord = [];
        copyOrCutSeleted.map(function(fileinfo) {
          copyOrCutRecord.push(fileinfo);
        });
        cancelEditMode();
        showPasteMenu();
        pasteOperate();
        sdcardHideSpinner();
      }
    };
    $('copy').onclick = function() {
      console.log('lxp:: paste copy click');
      var _ = navigator.mozL10n.get;

      if (srcFilePath.length === 0) {
        alert(_('no-file-to-copy'));
        return;
      }
      var len = fileSelected.length;
      debug('lx: copy ' + len + ' currentView ' + currentView);
      if (len > 0 && (currentView == 'option-internal-sdcard' ||
        currentView == 'option-sdcard-0')) {
        sdcardShowSpinner();

        flagCopy = true;
        flagCut = false;
        copyOrCutRecord = [];
        copyOrCutSeleted.map(function(fileinfo) {
          copyOrCutRecord.push(fileinfo);
        });
        cancelEditMode();
        showPasteMenu();
        pasteOperate();
        sdcardHideSpinner();
      }
    };

    $('sdcard-share').onclick = fileShare;
    $('sdcard-delete').onclick = function() {
      var _ = navigator.mozL10n.get;

      if (srcFilePath.length === 0) {
        var deleteMsg = _('no-file-to-delete');
        alert(deleteMsg);
        return;
      }

      var confirmMsg = _('delete-confirm', {n: srcFilePath.length});
      if (confirm(confirmMsg)) {
        deleteFile();
      }
    };
  }

  function showPasteMenu() {
    if (pasteMenu.classList.contains('hidden')) {
      pasteMenu.classList.remove('hidden');
    }
  }

  function renameFile(fileinfo) {
    var _ = navigator.mozL10n.get;
    var filepath = fileinfo.name;
    var filename = filepath.substring(filepath.lastIndexOf('/') + 1);

    // var nameEntered = window.prompt(_('change-name'), filename);

    var detail = {};
    detail.message = filename;
    //detail.content = _('change-name');
    detail.content = 'change-name';
    //var nameEntered = Modal_dialog.showDialog(evt);
    Modal_dialog.prompt(detail, renameOperate);

    function renameOperate(nameEntered) {

      dump('lx: renameFile nameEntered ' + nameEntered + '\n');
      if (!nameEntered || nameEntered === '' || filename == '') {
        if (nameEntered === '') {
          alert(_('input-new-name-message'));
        }
        return;
      }

      debug(' rename  nameEntered   ' + nameEntered + '\n');

      if (sameFileCheck(nameEntered)) {
        return;
      }

      if (!nameCheck(nameEntered)) {
        alert(_('invalid-name'));
        return;
      }

      if (countCharacters(nameEntered) > 255) {
        alert(filename + ' ' + _('rename-error'));
        return;
      }

      var sdcarddb = _storage;
      var destpath =
        filepath.substring(0, filepath.lastIndexOf('/') + 1) + nameEntered;
      // added by xiaohui.li for PR 657772 start
      // moved by tcl_chenguoqiang PR 687816
      if (!mediaChanged)
        mediaChanged = true;
      // added by xiaohui.li for PR 657772 end
      var renamerequest = sdcarddb.moveTo(filepath, destpath);
      renamerequest.onsuccess = function() {
        var result = renamerequest.result;
        deleteItem(result);

        var getRequest = _storage.get(destpath);
        getRequest.onsuccess = function() {
          var item = insertBeforeItem(getRequest.result);
          fileItemCount(item);
          refreshFile(lastpath);
        };
        sdcardLists.addEventListener('touchstart',
          HandleGesture.handleEvent);
      };
      renamerequest.onerror = function() {
        console.error('Rename error' + renamerequest.error + '\n');
        alert(filename + ' ' + _('rename-error'));
      };
    }

  }

  function deleteFile() {
    sdcardShowSpinner();

    var _ = navigator.mozL10n.get;
    deleteSuccess = 0;
    deleteError = 0;
    srcFilePath.forEach(function(filepath) {
      deleteItemFile(filepath);
    });
  }

  function deleteItemFile(filepath) {
    var _ = navigator.mozL10n.get;

    var deletepath = filepath.substring(filepath.indexOf('/', 1) + 1);
    debug('lx: delete  ' + deletepath);

    var storage = _storage;
    // added by xiaohui.li for PR 657772 start
    // moved by tcl_chenguoqiang PR 687816
    if (!mediaChanged)
      mediaChanged = true;
    // added by xiaohui.li for PR 657772 end
    var delRequest = storage.delete(deletepath);
    delRequest.onsuccess = function() {
      debug('delete file');
      deleteItem(filepath);
      deleteSuccess++;
      if ((deleteSuccess + deleteError) === srcFilePath.length) {
        sdcardHideSpinner();
        clearEditArray();
        deselectAll(sdcardView, 'sdcard-selectedFileNum');

        if (sdcardFiles.length === 0) {
          window.history.go(-1);
        }
      }
    };

    delRequest.onerror = function(evt) {
      function errorCallback() {
        alert(filepath + ' ' + _('delete-error'));

        deleteError++;
        if ((deleteSuccess + deleteError) === srcFilePath.length) {
          sdcardHideSpinner();
          clearEditArray();
          deselectAll(sdcardView, 'sdcard-selectedFileNum');

          if (sdcardFiles.length === 0) {
            window.history.go(-1);
          }
        }
      }

      setTimeout(errorCallback, 0);
    };
  }

  function deleteItem(filepath) {
    debug('deleteItem filepath ' + filepath + '\n');

    for (var n = 0; n < sdcardFiles.length; n++) {
      if (sdcardFiles[n].name === filepath)   //n indicate remove index
        break;
    }
    if (n >= sdcardFiles.length)  // It was a file we didn't know about
      return;

    if (sdcardFiles[n].size === foldSize) {
      folderArray.splice(n, 1);
    } else {
      fileArray.splice(n - folderArray.length, 1);
    }

    sdcardFiles.splice(n, 1);
    var items = sdcardLists.querySelectorAll('.file-item');
    sdcardLists.removeChild(items[n]);
    var len = items.length;
    for (var i = n + 1; i < len; i++) {
      items[i].dataset.index = i - 1;
    }
  }

  function pasteOperate() {
    var _ = navigator.mozL10n.get;
    $('paste').onclick = function() {
      console.log('lxp:: paste click');

      sdcardShowSpinner();
      pasteMenu.classList.add('disabled');
      sdcardBackButton.classList.add('disabled');
      if (lastpath == '') {
        //destFilePath = '/sdcard/';
        destFilePath = '/' + _storage.storageName + '/';
      } else {
        destFilePath = lastpath + '/';
      }
      debug('paste file path  ' + lastpath);

      var countSuccess = 0;
      var countError = 0;
      var totalCount = 0;

      function afterCopyOrCut() {
        copyOrCutRecord = [];
        sdcardHideSpinner();
        sdcardBackButton.classList.remove('disabled');
        pasteMenu.classList.remove('disabled');
        pasteMenu.classList.add('hidden');
        clearEditArray();
        if (flagCopy) {
          flagCopy = false;
        }
        if (flagCut) {
          flagCut = false;
        }
      }

      debug('paste  copyOrCutRecord length' + copyOrCutRecord.length);
      debug('paste destFilePath ' + destFilePath);

      for (var i = 0; i < copyOrCutRecord.length; i++) {
        var srcPath = copyOrCutRecord[i].name;

        // Becuase source files or folders are come from the same
        // directory, so we compare once is enough.
        if (destFilePath.indexOf(srcPath + '/') === -1 && flagCopy) {
          break;
        }

        if (destFilePath.indexOf(srcPath + '/') !== -1) {
          alert(_('the-same-folder'));
          afterCopyOrCut();
          break;
        }

        // can not cut a file or folder in the same folder.
        var srcLocation = srcPath.substring(0, srcPath.lastIndexOf('/') + 1);
        console.log('paste srcLocation ' + srcLocation);
        if (srcLocation === destFilePath && flagCut) {
          alert(_('cut-in-the-same-folder'));
          afterCopyOrCut();
          break;
        }
      }

      var _cpuWakeLock = navigator.requestWakeLock('cpu');
      copyOrCutRecord.forEach(function(fileinfo) {
        var srcPath = fileinfo.name;
        console.log('lxp:: paste forEach srcPath = ' + srcPath);

        var srcfilename = srcPath.substring(srcPath.lastIndexOf('/') + 1);
        var srcfile = srcPath.substring(0, srcPath.lastIndexOf('/') + 1);
        if (flagCopy) {
          debug('-------> copy srcfile ' + srcfile + ' destFilePath  ' +
            destFilePath + '\n');

          var copyrequest = _storage.copyTo(srcPath, destFilePath);
          copyrequest.onsuccess = function() {
            function successCallback() {
              countSuccess++;
              totalCount = countSuccess + countError;
              if (totalCount == copyOrCutRecord.length) {
                destFilePath = '';
                afterCopyOrCut();

                console.log('lxp:: paste lastpath = ' + lastpath);
                refreshFile(lastpath);
                // added by xiaohui.li for PR 657772 start
                if (!mediaChanged)
                  mediaChanged = true;
                // added by xiaohui.li for PR 657772 end
                if (_cpuWakeLock) {
                  _cpuWakeLock.unlock();
                  _cpuWakeLock = null;
                }
              }
            }

            successCallback();
          };

          copyrequest.onerror = function() {
            function errorCallback() {
              alert(srcfilename + ' ' + _('copy-error'));
              countError++;

              totalCount = countSuccess + countError;
              if (totalCount == copyOrCutRecord.length) {
                destFilePath = '';
                afterCopyOrCut();

                console.log('lxp:: paste lastpath = ' + lastpath);
                refreshFile(lastpath);
                if (_cpuWakeLock) {
                  _cpuWakeLock.unlock();
                  _cpuWakeLock = null;
                }
              }
            }

            setTimeout(errorCallback, 0);
          };
        } else if (flagCut) {
          debug('-------> cut srcfile ' + srcfile + ' destFilePath  ' +
            destFilePath + '\n');
          // added by xiaohui.li for PR 657772 start
          // moved by tcl_chenguoqiang PR 687816
          if (!mediaChanged)
            mediaChanged = true;
          // added by xiaohui.li for PR 657772 end
          var cutrequest = _storage.moveTo(srcPath, destFilePath);
          cutrequest.onsuccess = function() {
            function successCallback() {
              countSuccess++;
              totalCount = countSuccess + countError;
              if (totalCount == copyOrCutRecord.length) {
                destFilePath = '';
                afterCopyOrCut();

                console.log('lxp:: paste lastpath = ' + lastpath);
                refreshFile(lastpath);
                if (_cpuWakeLock) {
                  _cpuWakeLock.unlock();
                  _cpuWakeLock = null;
                }
              }
            }

            successCallback();
          };

          cutrequest.onerror = function() {
            function errorCallback() {
              alert(srcfilename + ' ' + _('cut-error'));
              countError++;

              totalCount = countSuccess + countError;
              if (totalCount == copyOrCutRecord.length) {
                destFilePath = '';
                afterCopyOrCut();

                console.log('lxp:: paste lastpath = ' + lastpath);
                refreshFile(lastpath);
                if (_cpuWakeLock) {
                  _cpuWakeLock.unlock();
                  _cpuWakeLock = null;
                }
              }
            }

            setTimeout(errorCallback, 0);
          };
        }
      });
    };

    $('cancel').onclick = function() {
      copyOrCutRecord = [];
      clearEditArray();
      flagCopy = false;
      flagCut = false;
      pasteMenu.classList.add('hidden');
    };
  }

  function userSelectedFile(num) {
    copyOrCutSeleted.push(sdcardFiles[num]);
    var filePath = sdcardFiles[num].name;
    srcFilePath.push(filePath);
  }

  function insertFolder(dir) {
    dump(' lx:======= insertFolder dir  ' + dir);
    var fragElement = document.createDocumentFragment();
    folderContainer.innerHTML = '';
    dir = '/' + _storage.storageName + '/' + dir;
    dump(' lx:after insertFolder dir  ' + dir);
    if (dir == ('/' + _storage.storageName + '/')) {
      var item = insertFolderEntry('/' + _storage.storageName,
        '/' + _storage.storageName);
      folderContainer.appendChild(item);
    } else {
      var index = 0;
      var start = 1;

      while ((start = lastpath.indexOf('/', start)) != -1) {
        var folder = lastpath.substring(index, start);

        var path = lastpath.substring(0, start);
        index = start;
        console.log('lx:insert folder ' + folder + '  path  ' + path + '\n');
        var item = insertFolderEntry(folder, path);
        fragElement.appendChild(item);
        start++;
      }
      var folder = lastpath.substring(lastpath.lastIndexOf('/'));
      var item = insertFolderEntry(folder, lastpath);
      fragElement.appendChild(item);
      folderContainer.appendChild(fragElement);
    }
  }

  function insertFolderEntry(folder, path) {
    var item = document.createElement('li');
    item.dataset.path = path;
    if (folder === path) {
      if (volumeList.length > 1 && folder === '/sdcard') {
        folder = '/' + getInternalStorageName(volumeList);
      } else {
        folder = '/' + getSdcardName(volumeList);
      }
    }

    item.innerHTML =
      '<a class="folder-link">' +
        '<img class="picture" src="style/images/folder.png">' + '</img>' +
        '<span class="folderName">' + folder + '</span>' + '</a>';
    return item;
  }

  function clickFolderName(evt) {
    var _ = navigator.mozL10n.get;
    var target = evt.target;
    dump('lx: clickFolderName target ' + evt.target);
    dump('lx: folderName path ' + target.dataset.path);

    var path = target.dataset.path;
    if (path == ('/' + _storage.storageName)) {
      lastpath = '';
      if (volumeList.length > 1 && _storage.storageName === 'sdcard') {
        var storageName = getInternalStorageName(volumeList);
        sdcardHeader.textContent = storageName;
      } else {
        var storageName = getSdcardName(volumeList);
        sdcardHeader.textContent = storageName;
      }
      enumeratefolder('');
    } else {
      var filename = path.substring(path.lastIndexOf('/') + 1);
      sdcardHeader.textContent = filename;
      lastpath = path;
      path = path.substring(path.indexOf('/', 1) + 1);
      dump('lx: click enumeratefolder path ' + path + '\n');
      enumeratefolder(path);
    }
    console.log('lx: clickFolderName lastpath ' + lastpath + '\n');
  }

  function goToFolder(path) {
    debug('lx:----> path ' + path);
    var _ = navigator.mozL10n.get;
    window.location.hash = '#sdcardList';

    var storageName = path.substring(1, path.indexOf('/', 1));
    console.log('lxp:: storageName = ' + storageName);
    var directory = path.substring(0, path.lastIndexOf('/'));

    if (volumeList.length > 1 && storageName === 'sdcard') {
      currentView = 'option-internal-sdcard';
      var storage = getInternalStorage(volumeList);
    } else {
      currentView = 'option-sdcard-0';
      var storage = getSdcard(volumeList);
    }

    if (directory === '/sdcard' || directory === '/external_sdcard') {
      var location = '';
      if (volumeList.length > 1 && storageName === 'sdcard') {
        var storageName = getInternalStorageName(volumeList);
        sdcardHeader.textContent = storageName;
      } else {
        var storageName = getSdcardName(volumeList);
        sdcardHeader.textContent = storageName;
      }
    } else {
      var index = path.lastIndexOf('/');
      var index2 = path.indexOf('/', 1);
      var location = path.substring(index2 + 1, index);
      var filename = directory.substring(directory.lastIndexOf('/') + 1);
      sdcardHeader.textContent = filename;
    }

    // this function will give value to lastpath,
    // so we should give value to lastpath after.
    init(storage, location);
    if (directory !== '/sdcard' && directory !== '/external_sdcard') {
      lastpath = path.substring(0, path.lastIndexOf('/'));
      foldername = lastpath.substring(lastpath.indexOf('/', 1) + 1);
    }
  }

  return {
    userSelectedFile: userSelectedFile,
    pasteOperate: pasteOperate,
    showPasteMenu: showPasteMenu,
    enumerateCount: enumerateCount,
    clickFolder: clickFolder,
    goToFolder: goToFolder,
    dateOrderFile: dateOrderFile,
    nameOrderFile: nameOrderFile,
    loadFile: loadFile,
    fileCount: fileCount,

    flagCopy: flagCopy,
    flagCut: flagCut,

    init: init
  };
}());

function sdcardShowSpinner() {
  if ($('sdcard-spinner-overlay').classList.contains('hidden')) {
    $('sdcard-spinner-overlay').classList.remove('hidden');
  }
}

function sdcardHideSpinner() {
  if (!$('sdcard-spinner-overlay').classList.contains('hidden')) {
    $('sdcard-spinner-overlay').classList.add('hidden');
  }
}

function sdcardAddDisable() {
  if (!$('sdcard-fileSort').classList.contains('disabled')) {
    $('sdcard-fileSort').classList.add('disabled');
  }
  if (!$('sdcard-addFile').classList.contains('disabled')) {
    $('sdcard-addFile').classList.add('disabled');
  }
  if (!$('sdcard-refresh').classList.contains('disabled')) {
    $('sdcard-refresh').classList.add('disabled');
  }
  if (!$('sdcard-icon-edit').classList.contains('disabled')) {
    $('sdcard-icon-edit').classList.add('disabled');
  }
}

function sdcardRemoveDisable() {
  if ($('sdcard-fileSort').classList.contains('disabled')) {
    $('sdcard-fileSort').classList.remove('disabled');
  }
  if ($('sdcard-addFile').classList.contains('disabled')) {
    $('sdcard-addFile').classList.remove('disabled');
  }
  if ($('sdcard-refresh').classList.contains('disabled')) {
    $('sdcard-refresh').classList.remove('disabled');
  }
  if ($('sdcard-icon-edit').classList.contains('disabled')) {
    $('sdcard-icon-edit').classList.remove('disabled');
  }
}
