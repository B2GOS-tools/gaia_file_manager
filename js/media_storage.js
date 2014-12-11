/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var Volume = function(name, external, externalIndex, storages) {
  console.log('lxp:: new  name = ' + name + '--> external = ' + external);

  this.name = name;
  this.external = external;
  this.externalIndex = externalIndex;
  this.storages = storages;
  this.sizeElement = null;  //<span></span>
};

// This function will create a view for each volume under #storage,
// the DOM structure looks like:
//
//<li id="internal-sdcard">
//  <a id="option-internal-sdcard" href="#sdcardList"
//   data-action="internal-sdcard">
//    <img src="style/images/SD.png">
//    <span id="internal-sdcard-name" data-l10n-id="internal-sdcard-name">
//      Internal Storage </span>
//    <span id="internal-sdcard-size" data-l10n-id="internal-sdcard-size">
//    </span>
//  </a>
//</li>

Volume.prototype.createView = function volume_createView(listRoot) {
  var _ = navigator.mozL10n.get;
  // create li
  var li = document.createElement('li');
  if (this.external) {
    li.id = 'sdcard-' + this.externalIndex;
  } else {
    li.id = 'internal-sdcard';
  }

  // create a
  var a = document.createElement('a');
  if (this.external) {
    a.id = 'option-sdcard-' + this.externalIndex;
    a.dataset.action = 'sdcard-' + this.externalIndex;
  } else {
    a.id = 'option-internal-sdcard';
    a.dataset.action = 'internal-sdcard';
  }
  a.href = '#sdcardList';

  // create img
  var img = document.createElement('img');
  if (this.external) {
    img.src = 'style/images/SD.png';
  } else {
    img.src = 'style/images/USB.png';
  }
  a.appendChild(img);

  // create span1 for storage name
  var span1 = document.createElement('span');
  if (this.external) {
    span1.id = 'sdcard-' + this.externalIndex + '-name';
    span1.dataset.l10nId = 'sdcard-' + this.externalIndex + '-name';
    span1.textContent = _('sdcard-' + this.externalIndex + '-name');
    console.log('lxp:: new span1.dataset.l10nId = ' + span1.dataset.l10nId);
  } else {
    span1.id = 'internal-sdcard-name';
    span1.dataset.l10nId = 'internal-sdcard-name';
    span1.textContent = _('internal-sdcard-name');
    console.log('lxp:: new span1.dataset.l10nId = ' + span1.dataset.l10nId);
  }
  a.appendChild(span1);

  // create this.sizeElement for storage size
  this.sizeElement = document.createElement('span');
  if (this.external) {
    this.sizeElement.id = 'sdcard-' + this.externalIndex + '-size';
    this.sizeElement.dataset.l10nId = 'sdcard-' + this.externalIndex + '-size';
  } else {
    this.sizeElement.id = 'internal-sdcard-size';
    this.sizeElement.dataset.l10nId = 'internal-sdcard-size';
  }

  a.appendChild(this.sizeElement);
  li.appendChild(a);

  listRoot.appendChild(li);
};

Volume.prototype.updateStorageInfo = function volume_updateStorageInfo() {
  if (this.sizeElement.parentNode.parentNode.classList.contains('hidden')) {
    this.sizeElement.parentNode.parentNode.classList.remove('hidden');
  }

  // Update the storage size
  var self = this;

  this.getSpace(function(usedSpace, freeSpace) {
    var element = self.sizeElement;
    DeviceStorageHelper.showFormatedSize(element,
      'storageSize', usedSpace, freeSpace);
  });
};

Volume.prototype.getSpace = function volume_getStats(callback) {
  var self = this;

  this.storages.freeSpace().onsuccess = function(e) {
    var freeSpace = e.target.result;
    self.storages.usedSpace().onsuccess = function(e) {
      var usedSpace = e.target.result;
      if (callback)
        callback(usedSpace, freeSpace);
    };
  };
};

Volume.prototype.updateInfo = function volume_updateInfo(callback) {
  var self = this;
  var availreq = this.storages.available();
  availreq.onsuccess = function availSuccess(evt) {
    var state = evt.target.result;
    switch (state) {
      case 'shared':
        break;
      case 'unavailable':
        console.log('lxp:: unavailable name = ' + self.name);
        self.setInfoUnavailable();

        // tcl_longxiuping add for bug 673276 begin.
        if (currentView === 'option-sdcard-0') {
          window.location.hash = '#root';
        }
        // tcl_longxiuping add for bug 673276 end.

        break;
      case 'available':
        console.log('lxp:: available name = ' + self.name);
        self.updateStorageInfo();
        break;
    }
    if (callback)
      callback(state);
  };
};

Volume.prototype.setInfoUnavailable = function volume_setInfoUnavailable() {
  this.sizeElement.parentNode.parentNode.classList.add('hidden'); // li
};

var MediaStorage = {
  init: function ms_init() {
    this._volumeList = this.initAllVolumeObjects();
    volumeList = this._volumeList;

    this.documentStorageListener = false;
    this.updateListeners();

    // Use visibilitychange so that we don't get notified of device
    // storage notifications when the settings app isn't visible.
    document.addEventListener('visibilitychange', this);
    window.addEventListener('localized', this);
    this.updateInfo();
  },

  initAllVolumeObjects: function ms_initAllVolumeObjects() {
    var volumes = {};
    var totalVolumes = 0;
    var storages = navigator.getDeviceStorages('extrasdcard');
    storages.forEach(function(storage) {
      var name = storage.storageName;
      if (!volumes.hasOwnProperty(name)) {
        volumes[name] = {};
        totalVolumes++;
      }
      volumes[name] = storage;
    });

    var volumeList = [];
    var externalIndex = 0;
    var volumeListRootElement =
      document.querySelector('#storage > article > ul');
    for (var name in volumes) {
      var volume;
      // XXX: This is a heuristic to determine whether a storage is internal or
      // external (e.g. a pluggable SD card). It does *not* work in general, but
      // it works for all officially-supported devices.
      if (totalVolumes > 1 && name === 'sdcard') {
        volume = new Volume(name, false /* internal */, 0, volumes[name]);
      } else {
        volume = new Volume(name, true /* external */, externalIndex++,
          volumes[name]);
      }
      volume.createView(volumeListRootElement);
      volumeList.push(volume);
    }

    return volumeList;
  },

  handleEvent: function ms_handleEvent(evt) {
    switch (evt.type) {
      case 'localized':
      case 'change':
        // we are handling storage state changes
        // possible state: available, unavailable, shared
        this.updateInfo();
        break;
      case 'visibilitychange':
        this.updateListeners(this.updateInfo.bind(this));
        break;
    }
  },

  updateListeners: function ms_updateListeners(callback) {
    var self = this;
    if (document.hidden) {
      // Settings is being hidden. Unregister our change listener so we won't
      // get notifications whenever files are added in another app.
      if (this.documentStorageListener) {
        this._volumeList.forEach(function(volume) {
          var volumeStorage = volume.storages;
          volumeStorage.removeEventListener('change', self);
        });
        this.documentStorageListener = false;
      }
    } else {
      if (!this.documentStorageListener) {
        this._volumeList.forEach(function(volume) {
          var volumeStorage = volume.storages;
          volumeStorage.addEventListener('change', self);
        });
        this.documentStorageListener = true;
      }
      if (callback)
        callback();
    }
  },

  updateInfo: function ms_updateInfo() {
    var self = this;
    this._volumeList.forEach(function(volume) {
      volume.updateInfo();
    });
  }
};

function updateInfo(volumeList) {
  var storageListElement =
    document.querySelectorAll('#storage > article > ul li');

  if (!storageListElement || storageListElement == null) {
    return;
  }

  volumeList.forEach(function(volume) {
    volume.updateInfo();
  });

  if ($('fresh-button').classList.contains('freshing')) {
    setTimeout(function() {
      console.log('lxp:: update fresh-button');

      for (var i = 0; i < storageListElement.length; i++) {
        storageListElement[i].classList.remove('disabled');
      }

      $('fresh-button').classList.remove('freshing');
    }, 1000);
  }
}

function getInternalStorage(volumeList) {
  for (var i = 0, len = volumeList.length; i < len; i++) {
    if (len > 1 && volumeList[i].name === 'sdcard') {
      return volumeList[i].storages;
    }
  }
}

function getSdcard(volumeList) {
  for (var i = 0, len = volumeList.length; i < len; i++) {
    if (len > 1 && volumeList[i].name === 'sdcard') {
      console.log('lxp:: this is internal storage');
      continue;
    } else {
      return volumeList[i].storages;
    }
  }
}

function getInternalStorageName(volumeList) {
  var _ = navigator.mozL10n.get;
  for (var i = 0, len = volumeList.length; i < len; i++) {
    if (len > 1 && volumeList[i].name === 'sdcard') {
      return _('internal-sdcard-name');
    }
  }
  return '';
}

function getSdcardName(volumeList) {
  var _ = navigator.mozL10n.get;
  for (var i = 0, len = volumeList.length; i < len; i++) {
    if (len > 1 && volumeList[i].name === 'sdcard') {
      console.log('lxp:: this is internal storage');
      continue;
    } else {
      return _('sdcard-0-name');
    }
  }
  return '';
}

