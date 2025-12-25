// webapp/controller/Detail.controller.js
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/routing/History"
], function (Controller, JSONModel, Filter, FilterOperator, History) {
  "use strict";

  return Controller.extend("ice.controller.Detail", {

    onInit: function () {
      this.getView().setModel(new JSONModel({
        navKeys: {
          ICERunDate: null,
          CompanyCode: "",
          TradingPartner: "",
          FinalBreakCode: ""
        }
      }), "vm");

      this.getOwnerComponent()
        .getRouter()
        .getRoute("RouteDetail")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    /* =========================================================== */
    /* =============== ROUTE HANDLING ============================= */
    /* =========================================================== */

    _onRouteMatched: function (oEvent) {
      var oArgs = oEvent.getParameter("arguments") || {};
      var oQuery = oArgs["?query"] || {};

      // --- nav keys ---
      var sIso = decodeURIComponent(oQuery.iceRunDate || "");
      var dIce = sIso ? new Date(sIso) : null;

      this.getView().getModel("vm").setProperty("/navKeys", {
        ICERunDate: dIce && !isNaN(dIce.getTime()) ? dIce : null,
        CompanyCode: decodeURIComponent(oArgs.CompanyCode || ""),
        TradingPartner: decodeURIComponent(oArgs.TradingPartner || ""),
        FinalBreakCode: decodeURIComponent(oArgs.FinalBreakCode || "")
      });

      // --- tab ---
      var sTab = (oQuery.tab ? decodeURIComponent(oQuery.tab) : "product") || "product";
      this.byId("itbViews").setSelectedKey(sTab);

      // --- restore SmartFilterBar state (SAFE) ---
      this._restoreSmartFilterBar();

      // --- trigger rebind (SAFE) ---
      this._rebindActiveSmartTable();
    },

    onNavBack: function () {
      var oHistory = History.getInstance();
      var sPrevHash = oHistory.getPreviousHash();

      // opciono: očisti filtere kad se vratiš
      // sessionStorage.removeItem("MAIN_SFB_FILTERS");

      if (sPrevHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
      }
    },

    /* =========================================================== */
    /* =============== SMART FILTER BAR =========================== */
    /* =========================================================== */

    _restoreSmartFilterBar: function () {
      var oSfb = this.byId("sfbDetail");
      if (!oSfb) { return; }

      var sData;
      try {
        sData = sessionStorage.getItem("MAIN_SFB_FILTERS");
      } catch (e) {
        return;
      }
      if (!sData) { return; }

      var oData;
      try {
        oData = JSON.parse(sData);
      } catch (e) {
        return;
      }

      // ✔ mora se čekati initialise
      oSfb.attachInitialise(function () {
        oSfb.setFilterData(oData, true);
      });
    },

    /* =========================================================== */
    /* =============== TAB / SEARCH =============================== */
    /* =========================================================== */

    onSearch: function () {
      this._rebindActiveSmartTable();
    },

    onTabSelect: function () {
      this._rebindActiveSmartTable();
    },

    /* =========================================================== */
    /* =============== SMART TABLE HANDLING ======================= */
    /* =========================================================== */

    _rebindActiveSmartTable: function () {
      var sKey = this.byId("itbViews").getSelectedKey();
      var m = {
        product: "stProduct",
        segment: "stSegment",
        caption: "stCaption"
      };

      var oSt = this.byId(m[sKey]);
      if (!oSt) { return; }

      // ✔ ako je već inicijalizovan
      if (oSt.getTable && oSt.getTable()) {
        oSt.rebindTable(true);
        return;
      }

      // ✔ ako nije – čekaj initialise
      oSt.attachInitialise(function () {
        oSt.rebindTable(true);
      });
    },

    onBeforeRebindAny: function (oEvent) {
      var oBindingParams = oEvent.getParameter("bindingParams");
      oBindingParams.filters = (oBindingParams.filters || [])
        .concat(this._getAllFilters());
    },

    _getAllFilters: function () {
      var a = [];

      // 1) nav keys
      var k = this.getView().getModel("vm").getProperty("/navKeys") || {};

      if (k.ICERunDate) {
        a.push(new Filter("ICERunDate", FilterOperator.EQ, k.ICERunDate));
      }
      if (k.CompanyCode) {
        a.push(new Filter("CompanyCode", FilterOperator.EQ, k.CompanyCode));
      }
      if (k.TradingPartner) {
        a.push(new Filter("TradingPartner", FilterOperator.EQ, k.TradingPartner));
      }
      if (k.FinalBreakCode) {
        a.push(new Filter("FinalBreakCode", FilterOperator.EQ, k.FinalBreakCode));
      }

      // 2) SmartFilterBar filters
      var oSfb = this.byId("sfbDetail");
      var aSfbFilters = oSfb ? (oSfb.getFilters() || []) : [];

      return a.concat(aSfbFilters);
    }

  });
});
