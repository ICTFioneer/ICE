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

      // readiness
      this._sfbReady = false;
      this._stReady = { stProduct: false, stSegment: false, stCaption: false };

      // pending rebind flags
      this._pendingRebind = false;
      this._pendingRebindBySt = { stProduct: false, stSegment: false, stCaption: false };

      // SmartFilterBar initialise
      var oSfb = this.byId("sfbDetail");
      if (oSfb) {
        oSfb.attachInitialise(function () {
          this._sfbReady = true;

          // popuni polja iz sessionStorage kad je SFB spreman
          this._restoreSfbFromSession();

          // ako je neko tražio rebind ranije, sad ga okini
          if (this._pendingRebind) {
            this._pendingRebind = false;
            this._rebindActiveSafe();
          }
        }.bind(this));
      }

      // SmartTable initialise (za svaku tab tabelu)
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

        // ako baš ovu tabelu čekamo da bi rebindovali, uradi sad
        if (this._pendingRebindBySt[sId]) {
          this._pendingRebindBySt[sId] = false;
          // rebind samo ako je trenutno aktivan tab taj
          this._rebindActiveSafe();
        }
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

      // restore odmah ako je SFB spreman (inače će uraditi initialise handler)
      if (this._sfbReady) {
        this._restoreSfbFromSession();
      }

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
      // 1) SFB gate: ako nije spreman -> zapamti i izađi
      if (!this._sfbReady) {
        this._pendingRebind = true;
        return;
      }

      var sKey = this.byId("itbViews").getSelectedKey();
      var m = { product: "stProduct", segment: "stSegment", caption: "stCaption" };
      var sId = m[sKey];

      var oSt = this.byId(sId);
      if (!oSt) { return; }

      // 2) SmartTable gate: ako nije spreman -> zapamti za tu tabelu i izađi
      if (!this._stReady[sId]) {
        this._pendingRebindBySt[sId] = true;
        return;
      }

      // 3) Sve spremno -> rebind
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

      // SFB je spreman (rebind ga garantuje), pa možemo getFilters
      var oSfb = this.byId("sfbDetail");
      var aSfbFilters = oSfb ? (oSfb.getFilters() || []) : [];
      return a.concat(aSfbFilters);
    }

  });
});
