// webapp/controller/Main.controller.js
sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("ice.controller.Main", {

    onInit: function () {},

    onGoPosting: function () {
      var oSfb = this.byId("smartFilterBar");
      if (oSfb) {
        oSfb.search();
      } else {
        var oSmartTable = this.byId("smartTable");
        oSmartTable && oSmartTable.rebindTable(true);
      }
    },

    onItemPress: function (oEvent) {
      // 1) snimi MAIN SFB stanje (da se prenese na Detail)
      this._storeSfbToSession("smartFilterBar", "MAIN_SFB_FILTERS");

      // 2) nav keys iz kliknutog reda
      var oItem = oEvent.getParameter("listItem");
      var oCtx = oItem && oItem.getBindingContext();
      if (!oCtx) { return; }

      var oRow = oCtx.getObject() || {};

      var sCompanyCode = encodeURIComponent(oRow.CompanyCode || "");
      var sTradingPartner = encodeURIComponent(oRow.TradingPartner || "");
      var sFinalBreakCode = encodeURIComponent(oRow.FinalBreakCode || "");
      var sIceIso = encodeURIComponent(this._toIso(oRow.ICERunDate));

      // 3) na L1 detail (tab product default)
      this.getOwnerComponent().getRouter().navTo("RouteDetail", {
        CompanyCode: sCompanyCode,
        TradingPartner: sTradingPartner,
        FinalBreakCode: sFinalBreakCode,
        "?query": {
          iceRunDate: sIceIso,
          tab: "product"
        }
      });
    },

    _storeSfbToSession: function (sSfbId, sKey) {
      var oSfb = this.byId(sSfbId);
      if (!oSfb) { return; }

      try {
        var oData = oSfb.getFilterData() || {};
        sessionStorage.setItem(sKey, JSON.stringify(oData));
      } catch (e) {
        // ignore
      }
    },

    _toIso: function (v) {
      if (!v) { return ""; }

      if (v instanceof Date) {
        return v.toISOString();
      }

      var m = /\/Date\((\d+)\)\//.exec(String(v));
      if (m && m[1]) {
        var d = new Date(Number(m[1]));
        return isNaN(d.getTime()) ? "" : d.toISOString();
      }

      return String(v);
    }

  });
});
