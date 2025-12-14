sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("ice.controller.Main", {

    onInit: function () {
      // ništa specijalno ovde; itemPress je već na Table
    },

    onGoPosting: function () {
      const oSfb = this.byId("smartFilterBar");
      if (oSfb) {
        oSfb.search();
      } else {
        const oSmartTable = this.byId("smartTable");
        oSmartTable && oSmartTable.rebindTable(true);
      }
    },

    onItemPress: function (oEvent) {
      const oItem = oEvent.getParameter("listItem");
      const oCtx = oItem && oItem.getBindingContext();
      if (!oCtx) { return; }

      const oRow = oCtx.getObject() || {};

      const sCompanyCode = encodeURIComponent(oRow.CompanyCode || "");
      const sTradingPartner = encodeURIComponent(oRow.TradingPartner || "");
      const sFinalBreakCode = encodeURIComponent(oRow.FinalBreakCode || "");

      const sIceIso = encodeURIComponent(this._toIso(oRow.ICERunDate));

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

      const m = /\/Date\((\d+)\)\//.exec(String(v));
      if (m && m[1]) {
        const d = new Date(Number(m[1]));
        return isNaN(d.getTime()) ? "" : d.toISOString();
      }


      return String(v);
    }

  });
});
