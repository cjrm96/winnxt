// PDF via print stylesheet. Text/JSON via Blob download. Both work on file://.
(function () {
  function printPage() {
    window.print();
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function downloadJSON(filename, data) {
    download(filename, JSON.stringify(data, null, 2), 'application/json');
  }

  // navigator.clipboard is unavailable on file:// in some browsers.
  function copyText(text, onResult) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(ta);
      onResult(ok);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        onResult(true);
      }, fallback);
    } else {
      fallback();
    }
  }

  window.WinnxtExport = {
    print: printPage,
    download: download,
    downloadJSON: downloadJSON,
    copyText: copyText
  };
})();
