// Opt-in localStorage. Off unless the user explicitly turns it on.
(function () {
  var CONSENT_SUFFIX = ':consent';

  function Store(key) {
    this.key = key;
    this.consentKey = key + CONSENT_SUFFIX;
  }

  Store.prototype.available = function () {
    try {
      localStorage.setItem('__t', '1');
      localStorage.removeItem('__t');
      return true;
    } catch (e) {
      return false;
    }
  };

  Store.prototype.enabled = function () {
    return this.available() && localStorage.getItem(this.consentKey) === 'yes';
  };

  Store.prototype.setEnabled = function (on) {
    if (!this.available()) return false;
    if (on) {
      localStorage.setItem(this.consentKey, 'yes');
    } else {
      localStorage.removeItem(this.consentKey);
      localStorage.removeItem(this.key);
    }
    return true;
  };

  Store.prototype.save = function (data) {
    if (!this.enabled()) return false;
    localStorage.setItem(this.key, JSON.stringify(data));
    return true;
  };

  Store.prototype.load = function () {
    if (!this.enabled()) return null;
    var raw = localStorage.getItem(this.key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  // Wired to the always-visible "erase everything" button. Must actually clear.
  Store.prototype.eraseAll = function () {
    if (!this.available()) return;
    localStorage.removeItem(this.key);
    localStorage.removeItem(this.consentKey);
  };

  // Warn before losing work when storage is off.
  Store.prototype.warnOnUnloadWhenOff = function (hasData) {
    var self = this;
    window.addEventListener('beforeunload', function (e) {
      if (self.enabled() || !hasData()) return;
      e.preventDefault();
      e.returnValue = '';
    });
  };

  window.WinnxtStorage = Store;
})();
