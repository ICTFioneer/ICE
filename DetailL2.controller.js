sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/routing/History"
], function (Controller, JSONModel, Filter, FilterOperator, History) {
  "use strict";

  return Controller.extend("ice.controller.DetailL2", {

    onInit: function () {
      this.getView().setModel(new JSONModel({
        navKeys: {
          ICERunDate: null,
          CompanyCode: "",
          TradingPartner: "",
          FinalBreakCode: ""
        },
        drill: {
          field: "",
          value: ""
        }
      }), "vm");

      this._sfbReady = false;
      this._stReady = { stProductL2: false, stSegmentL2: false, stCaptionL2: false };
      this._pendingRebind = false;
      this._pendingRebindBySt = { stProductL2: false, stSegmentL2: false, stCaptionL2: false };

      var oSfb = this.byId("sfbDetailL2");
      if (oSfb) {
        oSfb.attachInitialise(function () {
          this._sfbReady = true;
          this._restoreSfbFromSession();
          if (this._pendingRebind) {
            this._pendingRebind = false;
            this._rebindActiveSafe();
          }
        }.bind(this));
      }

      this._attachSmartTableInit("stProductL2");
      this._attachSmartTableInit("stSegmentL2");
      this._attachSmartTableInit("stCaptionL2");

      this.getOwnerComponent().getRouter()
        .getRoute("RouteDetailL2")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _attachSmartTableInit: function (sId) {
      var oSt = this.byId(sId);
      if (!oSt) { return; }

      oSt.attachInitialise(function () {
        this._stReady[sId] = true;
        if (this._pendingRebindBySt[sId]) {
          this._pendingRebindBySt[sId] = false;
          this._rebindActiveSafe();
        }
      }.bind(this));
    },

    _onRouteMatched: function (oEvent) {
      var oArgs = oEvent.getParameter("arguments") || {};
      var oQuery = oArgs["?query"] || {};

      var sIceIso = decodeURIComponent(oArgs.ICERunDate || "");
      var dIce = sIceIso ? new Date(sIceIso) : null;

      this.getView().getModel("vm").setProperty("/navKeys", {
        ICERunDate: dIce && !isNaN(dIce.getTime()) ? dIce : null,
        CompanyCode: decodeURIComponent(oArgs.CompanyCode || ""),
        TradingPartner: decodeURIComponent(oArgs.TradingPartner || ""),
        FinalBreakCode: decodeURIComponent(oArgs.FinalBreakCode || "")
      });

      var sTab = (oQuery.tab ? decodeURIComponent(oQuery.tab) : "product") || "product";
      this.byId("itbViewsL2").setSelectedKey(sTab);

      this.getView().getModel("vm").setProperty("/drill", {
        field: decodeURIComponent(oQuery.field || ""),
        value: decodeURIComponent(oQuery.value || "")
      });

      if (this._sfbReady) {
        this._restoreSfbFromSession();
      }

      this._rebindActiveSafe();
    },

    _restoreSfbFromSession: function () {
      var oSfb = this.byId("sfbDetailL2");
      if (!oSfb) { return; }

      try {
        var sData = sessionStorage.getItem("MAIN_SFB_FILTERS");
        if (!sData) { return; }

        oSfb.setFilterData(JSON.parse(sData), true);
      } catch (e) {
        // ignore
      }
    },

    onBeforeRebindAny: function (oEvent) {
      var p = oEvent.getParameter("bindingParams");
      p.filters = (p.filters || []).concat(this._getAllFilters());
    },

    _getAllFilters: function () {
      var a = [];
      var oVM = this.getView().getModel("vm");

      var k = oVM.getProperty("/navKeys") || {};
      if (k.ICERunDate) a.push(new Filter("ICERunDate", FilterOperator.EQ, k.ICERunDate));
      if (k.CompanyCode) a.push(new Filter("CompanyCode", FilterOperator.EQ, k.CompanyCode));
      if (k.TradingPartner) a.push(new Filter("TradingPartner", FilterOperator.EQ, k.TradingPartner));
      if (k.FinalBreakCode) a.push(new Filter("FinalBreakCode", FilterOperator.EQ, k.FinalBreakCode));

      var oSfb = this.byId("sfbDetailL2");
      var aSfb = oSfb ? (oSfb.getFilters() || []) : [];
      a = a.concat(aSfb);

      var d = oVM.getProperty("/drill") || {};
      if (d.field && d.value) {
        a.push(new Filter(d.field, FilterOperator.EQ, d.value));
      }

      return a;
    },

    _rebindActiveSafe: function () {
      if (!this._sfbReady) {
        this._pendingRebind = true;
        return;
      }

      var sKey = this.byId("itbViewsL2").getSelectedKey();
      var m = { product: "stProductL2", segment: "stSegmentL2", caption: "stCaptionL2" };
      var sId = m[sKey];

      var oSt = this.byId(sId);
      if (!oSt) { return; }

      if (!this._stReady[sId]) {
        this._pendingRebindBySt[sId] = true;
        return;
      }

      oSt.rebindTable(true);
    },

    onSearch: function () { this._rebindActiveSafe(); },
    onTabSelect: function () { this._rebindActiveSafe(); },

    onNavBack: function () {
      var oHistory = History.getInstance();
      var sPrevHash = oHistory.getPreviousHash();
      if (sPrevHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
      }
    }

  });
});
