'use strict';

var Uni2pinyin = (function() {
  var spell = [];
  var isIniting = false;
  var init = function(callback) {
    if (isIniting) {
      return;
    }
    isIniting = true;
    read('/js/Uni2Pinyin.txt', function(content) {
      var lines = content.split('",');
      for (var i = 0; i < lines.length; i++) {
        spell[i] = lines[i].toString().substring(lines[i].indexOf('"') + 1);
      }
      isIniting = false;
      if (callback) {
        callback(spell);
      }
    });
  };
  var read = function xhrFileSystemStorage_read(name, callback) {
    var content = '';
    function doCallback() {
      if (callback) {
        callback(content);
      }
    }

    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', name, true);
      xhr.responseType = 'text';
      xhr.overrideMimeType('text/plain; charset=UTF-8');
      xhr.onreadystatechange = function xhrReadystatechange(ev) {
        if (xhr.readyState !== XMLHttpRequest.DONE) {
          return;
        }
        if (xhr.status == 200 || xhr.status == 304) {
          content = xhr.responseText;
        } else {
          // error occurred.
          console.log('XhrFileSystemStorage failed to load file.' +
            'Error Code:' + xhr.status);
        }
        doCallback();
      };
      xhr.send(null);
    } catch (ex) {
      doCallback();
    }
  };
  return {
    'init': init
  };
})();
