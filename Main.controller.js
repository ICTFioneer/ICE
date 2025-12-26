sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "ice/util/DateUtil"
], function (Controller, DateUtil) {
  "use strict";

  return Controller.extend("ice.controller.Main", {

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
      var oItem = oEvent.getParameter("listItem");
      var oCtx = oItem && oItem.getBindingContext();
      if (!oCtx) { return; }

      // 1) snimi filter state iz MAIN SFB (da se L1 popuni)
      try {
        var oSfb = this.byId("smartFilterBar");
        var oFD = oSfb ? (oSfb.getFilterData() || {}) : {};
        sessionStorage.setItem("MAIN_SFB_FILTERS", JSON.stringify(oFD));
      } catch (e) {}

      var oRow = oCtx.getObject() || {};

      // 2) navigacija na L1 detail
      this.getOwnerComponent().getRouter().navTo("RouteDetail", {
        CompanyCode: oRow.CompanyCode || "",
        TradingPartner: oRow.TradingPartner || "",
        FinalBreakCode: oRow.FinalBreakCode || "",
        "?query": {
          iceRunDate: DateUtil.toIso(oRow.ICERunDate),
          tab: "product"
        }
      });
    }

  });
});
