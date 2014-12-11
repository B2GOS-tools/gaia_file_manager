/**
 * Created with JetBrains WebStorm.
 * User: tclxa
 * Date: 7/8/13
 * Time: 10:15 AM
 * To change this template use File | Settings | File Templates.
 */

SequenceList = (function() {
  var spell = null;

  function init() {
    // dump("lxp: init  spell = " + spell + "\n");
    spell = null;
    if (spell == null) {//tcl-guzhenquan 2013.3.15 for switch version
      Uni2pinyin.init(function(ret) {
        spell = ret;
        //  dump("lxp:spell length  " + spell.length + "\n");
        //pinyinSort(array);
      });
    }

  };

  function initsort(callback) {
    if (callback)
      callback;
  }

  var isCnWord = function(str) {
    if (str != null) {
      for (var i = 0; i < str.length; i++) {
        if ((str.charCodeAt(i) == 0x3007) ||
          ((str.charCodeAt(i) > 0x4E00) && (str.charCodeAt(i) < 0x9FA5))) {
          return true;
        }
      }
    }
    return false;
  };

  var trim = function(str, allspc) {
    if (allspc) {
      return str.replace(/(^\s*)|(\s*$)|(\s+)/g, '');
    }
    return str.replace(/(^\s*)|(\s*$)/g, '').replace(/\s+/g, 0x01);
  };

  var cnWordToPinyin = function cnWordToPinyin(str, search) {
    if (str) {
      var pStr = '';
      for (var i = 0; i < str.length; i++) {
        if (!isCnWord(str.charAt(i))) {
          pStr += str.charAt(i).toLowerCase();
        } else {
          pStr += pinyin(str.charAt(i));
        }
        if (!search) {
          pStr += '560578';//the special string is used to split chinese word
        }
      }
      return pStr;
    }
    return '';
  };

  //add by gzq 2013.1.9 for sort acording to pinyin
  var pinyin = function pinyin(char) {
    if (char.charCodeAt(0) == 0x3007) {
      return 'ling';
    }
    if ((char.charCodeAt(0) > 0x9FA5) || (char.charCodeAt(0) < 0x4E00)) {
      return '';
    }
    var index = char.charCodeAt(0) - 0x4E00;
    if (spell) {
      var str = '';
      str = spell[index];
      //  dump("lxp:: pinyin str "+str+"\n");
      return trim(str, true);
    }
    return '';
  };

  function pinyinSort(array) {
    console.log('lxp:: pinyinSort');
    if (array == null)
      return;

    array.sort(compareFileByName);
  }

  function transferToPinyin(fileinfo, callback) {
    var path = fileinfo.name;
    // dump("lx: path = " + path + "\n");
    var aName = path.substring(path.lastIndexOf('/') + 1);
    // dump("lx: aName = " + aName + "\n");
    var cName;
    var tName = trim(aName);
    var cNameOrig = tName;
    if (isCnWord(aName)) {
      cName = cnWordToPinyin(tName);
    } else {
      cName = tName;
    }
    dump('lx:  ------> transfer cName = ' + cName + '\n');
    var cNameCN = cName;
    if (callback)
      callback(cNameCN, cNameOrig);
  }

  function compareFileByName(a, b) {
    var aNameCN, aNameOrig;
    var bNameCN, bNameOrig;

    transferToPinyin(a, function(name, nameorig) {
      aNameCN = name.toLowerCase();
      aNameOrig = nameorig;
    });

    transferToPinyin(b, function(name, nameorig) {
      bNameCN = name.toLowerCase();
      bNameOrig = nameorig;
    });

    debug('lx:aNameCN ' + aNameCN + ' bNameCN ' + bNameCN);
    if (aNameCN.localeCompare(bNameCN) > 0) {
      return 1;
    } else if (aNameCN.localeCompare(bNameCN) < 0) {
      return -1;
    } else if (aNameOrig.localeCompare(bNameOrig) > 0) {
      return 1;
    } else if (aNameOrig.localeCompare(bNameOrig) < 0) {
      return -1;
    } else {
      return a.name.localeCompare(b.name);
    }
  }

  return {
    'init': init,
    'pinyinSort': pinyinSort,
    'compareFileByName': compareFileByName
  };
})();
