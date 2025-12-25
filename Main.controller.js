// webapp/controller/Main.controller.js
sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("ice.controller.Main", {

    onInit: function () {
      // nema specijalne inicijalizacije
    },

    onGoPosting: function () {
      var oSfb = this.byId("smartFilterBar");
      if (oSfb) {
        oSfb.search();
      } else {
        var oSmartTable = this.byId("smartTable");
        if (oSmartTable) {
          oSmartTable.rebindTable(true);
        }
      }
    },

    onItemPress: function (oEvent) {
      var oItem = oEvent.getParameter("listItem");
      var oCtx = oItem && oItem.getBindingContext();
      if (!oCtx) { return; }

      var oRow = oCtx.getObject() || {};

      var sCompanyCode = encodeURIComponent(oRow.CompanyCode || "");
      var sTradingPartner = encodeURIComponent(oRow.TradingPartner || "");
      var sFinalBreakCode = encodeURIComponent(oRow.FinalBreakCode || "");
      var sIceIso = encodeURIComponent(this._toIso(oRow.ICERunDate));

      // 👉 snimi SmartFilterBar stanje u sessionStorage
      var oSfb = this.byId("smartFilterBar");
      if (oSfb) {
        try {
          sessionStorage.setItem(
            "MAIN_SFB_FILTERS",
            JSON.stringify(oSfb.getFilterData(true))
          );
        } catch (e) {
          // ignore
        }
      }

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

    _toIso: function (v) {
      if (!v) { return ""; }

      if (v instanceof Date) {
        return v.toISOString();
      }

      // OData V2 format: /Date(123456789)/
      var m = /\/Date\((\d+)\)\//.exec(String(v));
      if (m && m[1]) {
        var d = new Date(Number(m[1]));
        return isNaN(d.getTime()) ? "" : d.toISOString();
      }

      return String(v);
    }

  });
});
