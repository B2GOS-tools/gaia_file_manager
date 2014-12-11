/**
 * Created with JetBrains WebStorm.
 * User: tclxa
 * Date: 6/20/13
 * Time: 11:03 AM
 * To change this template use File | Settings | File Templates.
 */
/**
 * These so-called "dialog boxes" are just standard Settings panels (<section
 * role="region" />) with reset/submit buttons: these buttons both return to the
 * previous panel when clicked, and each button has its own (optional) callback.
 */

function $(id) {
  return document.getElementById(id);
}

function openDialog(dialogID, onSubmit, onReset) {
  if ('#' + dialogID == document.location.hash)
    return;

  var origin = document.location.hash;
  var dialog = document.getElementById(dialogID);

  var submit = dialog.querySelector('[type=submit]');
  if (submit) {
    submit.onclick = function onsubmit() {
      if (onSubmit)
        (onSubmit.bind(dialog))();
      document.location.hash = origin; // hide dialog box
    };
  }

  var reset = dialog.querySelector('[type=reset]');
  if (reset) {
    reset.onclick = function onreset() {
      if (onReset)
        (onReset.bind(dialog))();
      document.location.hash = origin; // hide dialog box
    };
  }

  document.location.hash = dialogID; // show dialog box
}

// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.Format = function(fmt) {
  var o = {
    'M+': this.getMonth() + 1,
    'd+': this.getDate(),
    'h+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'q+': Math.floor((this.getMonth() + 3) / 3),
    'S': this.getMilliseconds()
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(RegExp.$1,
      (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp('(' + k + ')').test(fmt))
      fmt = fmt.replace(RegExp.$1,
        (RegExp.$1.length == 1) ?
          (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
  return fmt;
};


function formatSize(size) {
  if (size === undefined || isNaN(size)) {
    return;
  }

  // KB - 3 KB (nearest ones), MB, GB - 1.2 MB (nearest tenth)
  var fixedDigits = (size < 1024 * 1024) ? 0 : 1;
  var sizeInfo = FileSizeFormatter.getReadableFileSize(size, fixedDigits);

  return sizeInfo.size + ' ' + sizeInfo.unit;
}
/**
 * L10n helper
 */

var localize = navigator.mozL10n.localize;

/**
 * Helper class for formatting file size strings
 * required by *_storage.js
 */

var FileSizeFormatter = (function FileSizeFormatter(fixed) {
  function getReadableFileSize(size, digits) { // in: size in Bytes
    if (size === undefined)
      return {};

    var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = 0;
    while (size >= 1024) {
      size /= 1024;
      ++i;
    }

    var sizeString = size.toFixed(digits || 0);
    var sizeDecimal = parseFloat(sizeString);

    return {
      size: sizeDecimal.toString(),
      unit: units[i]
    };
  }

  return { getReadableFileSize: getReadableFileSize };
})();

/**
 * Helper class for getting available/used storage
 * required by *_storage.js
 */

var DeviceStorageHelper = (function DeviceStorageHelper() {
  function getStat(storage, callback) {
    if (!storage) {
      console.error('Storage is invalid');
      return;
    }

    storage.freeSpace().onsuccess = function(e) {
      var freeSpace = e.target.result;
      storage.usedSpace().onsuccess = function(e) {
        var usedSpace = e.target.result;
        callback(usedSpace, freeSpace);
      };
    };
  }

  function getFreeSpace(storage, callback) {
    if (!storage) {
      console.error('Storage is invalid');
      return;
    }

    storage.freeSpace().onsuccess = function(e) {
      var freeSpace = e.target.result;
      callback(freeSpace);
    };
  }

  function getTotalSpace(storage, callback) {
    if (!storage) {
      console.error('Storage is invalid');
      return;
    }

    storage.freeSpace().onsuccess = function(e) {
      var freeSpace = e.target.result;
      storage.usedSpace().onsuccess = function(e) {
        var usedSpace = e.target.result;
        var totalSpace = usedSpace + freeSpace;
        callback(totalSpace);
      };
    };
  }

  function showFormatedSize(element, l10nId, usedSpace, freeSpace) {
    if (usedSpace === undefined || isNaN(usedSpace) ||
      freeSpace === undefined || isNaN(freeSpace)) {
      element.textContent = '';
      return;
    }

    var totalSpace = usedSpace + freeSpace;
    if (totalSpace === 0) {
      element.parentNode.parentNode.classList.add('hidden');
    }

    // KB - 3 KB (nearest ones), MB, GB - 1.2 MB (nearest tenth)
    var freefixedDigits = (freeSpace < 1024 * 1024) ? 0 : 1;
    var freeSizeInfo =
      FileSizeFormatter.getReadableFileSize(freeSpace, freefixedDigits);

    var totalfixedDigits = (totalSpace < 1024 * 1024) ? 0 : 1;
    var totalSizeInfo =
      FileSizeFormatter.getReadableFileSize(totalSpace, totalfixedDigits);

    var _ = navigator.mozL10n.get;
    element.textContent = _(l10nId, {
      size: freeSizeInfo.size,
      unit: _('byteUnit-' + freeSizeInfo.unit),
      totalsize: totalSizeInfo.size,
      totalunit: _('byteUnit-' + totalSizeInfo.unit)
    });
  }

  return {
    getStat: getStat,
    getFreeSpace: getFreeSpace,
    getTotalSpace: getTotalSpace,
    showFormatedSize: showFormatedSize
  };
})();

// check the file or folder name is valid or not.
function nameCheck(name) {
  if (name.indexOf('\\') !== -1) {
    return false;
  }

  var reg = new RegExp('[*:/?<>\"|\\x5c]', 'g');
  if (reg.test(name)) {
    // invalid file or folder name.
    return false;
  }
  return true;
}

// UTF-8 count file name characters
function countCharacters(newName) {
  if (!newName) {
    return 0;
  }

  var totalCount = 0, code, len = newName.length;
  for (var i = 0; i < len; i++) {
    code = newName.charCodeAt(i);
    if (code >= 0x0 && code <= 0x7f) {
      totalCount++;
    } else if (code <= 0x7ff) {
      totalCount += 2;
    } else if (code <= 0xffff) {
      totalCount += 3;
    }
  }

  console.log('lxp:: File Manager totalCount = ' + totalCount);
  return totalCount;
}
