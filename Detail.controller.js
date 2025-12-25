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

      // readiness flags (na controlleru, ne na kontrolama)
      this._sfbReady = false;
      this._stReady = { stProduct: false, stSegment: false, stCaption: false };

      // SFB initialise -> postavi flag + restore + opcionalni pending rebind
      var oSfb = this.byId("sfbDetail");
      if (oSfb) {
        oSfb.attachInitialise(function () {
          this._sfbReady = true;
          this._restoreSfbFromSession(); // popuni UI polja kad je SFB spreman
        }.bind(this));
      }

      // SmartTable initialise -> set flag (za svaku posebno)
      this._attachSmartTableInit("stProduct");
      this._attachSmartTableInit("stSegment");
      this._attachSmartTableInit("stCaption");

      this.getOwnerComponent().getRouter()
        .getRoute("RouteDetail")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _attachSmartTableInit: function (sId) {
      var oSt = this.byId(sId);
      if (!oSt) { return; }
      oSt.attachInitialise(function () {
        this._stReady[sId] = true;
      }.bind(this));
    },

    _onRouteMatched: function (oEvent) {
      var oArgs = oEvent.getParameter("arguments") || {};
      var oQuery = oArgs["?query"] || {};

      var sIso = decodeURIComponent(oQuery.iceRunDate || "");
      var dIce = sIso ? new Date(sIso) : null;

      this.getView().getModel("vm").setProperty("/navKeys", {
        ICERunDate: dIce && !isNaN(dIce.getTime()) ? dIce : null,
        CompanyCode: decodeURIComponent(oArgs.CompanyCode || ""),
        TradingPartner: decodeURIComponent(oArgs.TradingPartner || ""),
        FinalBreakCode: decodeURIComponent(oArgs.FinalBreakCode || "")
      });

      var sTab = (oQuery.tab ? decodeURIComponent(oQuery.tab) : "product") || "product";
      this.byId("itbViews").setSelectedKey(sTab);

      // Ako je SFB već spreman, odmah restore (inače će se uraditi u initialise handleru)
      if (this._sfbReady) {
        this._restoreSfbFromSession();
      }

      // Uvek traži rebind, ali “safe”
      this._rebindActiveSafe();
    },

    onNavBack: function () {
      var oHistory = History.getInstance();
      var sPrevHash = oHistory.getPreviousHash();

      if (sPrevHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
      }
    },

    onSearch: function () {
      this._rebindActiveSafe();
    },

    onTabSelect: function () {
      this._rebindActiveSafe();
    },

    _restoreSfbFromSession: function () {
      var oSfb = this.byId("sfbDetail");
      if (!oSfb) { return; }

      try {
        var sData = sessionStorage.getItem("MAIN_SFB_FILTERS");
        if (!sData) { return; }
        var oData = JSON.parse(sData);
        oSfb.setFilterData(oData, true);
      } catch (e) {
        // ignore
      }
    },

    _rebindActiveSafe: function () {
      // ne rebinduj dok SFB nije spreman (da getFilters ne baca warning)
      if (!this._sfbReady) { return; }

      var sKey = this.byId("itbViews").getSelectedKey();
      var m = { product: "stProduct", segment: "stSegment", caption: "stCaption" };
      var sId = m[sKey];

      var oSt = this.byId(sId);
      if (!oSt) { return; }

      // ako SmartTable još nije inicijalizovan -> zakači ONCE initialise pa rebind
      if (!this._stReady[sId]) {
        if (!this._pendingRebind) { this._pendingRebind = {}; }
        if (this._pendingRebind[sId]) { return; } // već zakačeno
        this._pendingRebind[sId] = true;

        oSt.attachInitialise(function () {
          this._stReady[sId] = true;
          this._pendingRebind[sId] = false;
          oSt.rebindTable(true);
        }.bind(this));

        return;
      }

      // spreman je
      oSt.rebindTable(true);
    },

    onBeforeRebindAny: function (oEvent) {
      var oBindingParams = oEvent.getParameter("bindingParams");
      oBindingParams.filters = (oBindingParams.filters || []).concat(this._getAllFilters());
    },

    _getAllFilters: function () {
      var a = [];
      var k = this.getView().getModel("vm").getProperty("/navKeys") || {};

      if (k.ICERunDate) a.push(new Filter("ICERunDate", FilterOperator.EQ, k.ICERunDate));
      if (k.CompanyCode) a.push(new Filter("CompanyCode", FilterOperator.EQ, k.CompanyCode));
      if (k.TradingPartner) a.push(new Filter("TradingPartner", FilterOperator.EQ, k.TradingPartner));
      if (k.FinalBreakCode) a.push(new Filter("FinalBreakCode", FilterOperator.EQ, k.FinalBreakCode));

      // SFB filteri samo kad je ready (ovde jeste, jer _rebindActiveSafe to garantuje)
      var oSfb = this.byId("sfbDetail");
      var aSfbFilters = oSfb ? (oSfb.getFilters() || []) : [];
      return a.concat(aSfbFilters);
    }

  });
});
