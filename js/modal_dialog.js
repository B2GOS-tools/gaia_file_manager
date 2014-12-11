/**
 * Created with JetBrains WebStorm.
 * User: tclxa
 * Date: 4/22/14
 * Time: 2:04 PM
 * To change this template use File | Settings | File Templates.
 */
var Modal_dialog = (function() {
  var _ = navigator.mozL10n.get;
  var promptForm;
  var inputElement;
  var confirmButton;
  var cancelButton;
  var returnValue;

  function showDialog(detail) {
    dump('lx: showDialog ' + '\n');
    var message = detail.message || '';
    var content = detail.content || '';

    promptForm.classList.remove('hidden');
    promptForm.style.zIndex = 225;
    promptForm.focus();
    var promptMessage =
          promptForm.querySelector('.modal-dialog-prompt-message');
    promptMessage.innerHTML = _(content);
    promptMessage.setAttribute('data-l10n-id', content);
    promptForm.querySelector('.modal-dialog-prompt-input').value =
      message;
    confirmButton.textContent = _('ok');
    cancelButton.textContent = _('cancel');
  }

  function prompt(detail, callback) {
    returnValue = null;
    promptForm = document.getElementById('modal-dialog-prompt');
    inputElement = promptForm.querySelector('.modal-dialog-prompt-input');
    confirmButton = document.getElementById('modal-dialog-prompt-ok');
    cancelButton = document.getElementById('modal-dialog-prompt-cancel');
    confirmButton.onclick = confirmHandler;
    cancelButton.onclick = cancelHandler;

    function cancelHandler(clickEvt) {
      clickEvt.preventDefault();
      returnValue = null;
      inputElement.blur();
      promptForm.classList.add('hidden');
      callback(returnValue);

    }

    function confirmHandler(clickEvt) {
      clickEvt.preventDefault();
      returnValue = inputElement.value;
      promptForm.classList.add('hidden');
      callback(returnValue);
    }

    showDialog(detail);
  }

  return {
    prompt: prompt
  };
}());

