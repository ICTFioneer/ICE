sap.ui.define([], function () {
  "use strict";

  function toIso(v) {
    if (!v) { return ""; }

    if (v instanceof Date) {
      return v.toISOString();
    }

    // ABAP /Date(....)/
    var m = /\/Date\((\d+)\)\//.exec(String(v));
    if (m && m[1]) {
      var d = new Date(Number(m[1]));
      return isNaN(d.getTime()) ? "" : d.toISOString();
    }

    // already string
    return String(v);
  }

  function fromIso(s) {
    if (!s) { return null; }
    var d = new Date(String(s));
    return isNaN(d.getTime()) ? null : d;
  }

  return {
    toIso: toIso,
    fromIso: fromIso
  };
});
