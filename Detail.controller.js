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

      this.getOwnerComponent().getRouter()
        .getRoute("RouteDetail")
        .attachPatternMatched(this._onRouteMatched, this);
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

      // PRIMI FILTER STATE SA MAIN-A I POSTAVI NA DETAIL SFB
      var sFD = oQuery.fd ? decodeURIComponent(oQuery.fd) : "";
      if (sFD) {
        try {
          var oData = JSON.parse(sFD);
          var oSfb = this.byId("sfbDetail");
          if (oSfb) {
            oSfb.setFilterData(oData, true);
          }
        } catch (e) {
          // ignore
        }
      }

      // rebind malo odložen da SmartTable stigne da se inicijalizuje
      setTimeout(this._rebindActive.bind(this), 0);
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
      this._rebindActive();
    },

    onTabSelect: function () {
      this._rebindActive();
    },

    _rebindActive: function () {
      var sKey = this.byId("itbViews").getSelectedKey();
      var m = {
        product: "stProduct",
        segment: "stSegment",
        caption: "stCaption"
      };

      var oSt = this.byId(m[sKey]);
      if (!oSt) { return; }

      // optional guard: ne zovi pre init
      if (!oSt.getTable || !oSt.getTable()) {
        setTimeout(this._rebindActive.bind(this), 50);
        return;
      }

      oSt.rebindTable(true);
    },

    onBeforeRebindAny: function (oEvent) {
      var oBindingParams = oEvent.getParameter("bindingParams");
      oBindingParams.filters = (oBindingParams.filters || []).concat(this._getAllFilters());
    },

    _getAllFilters: function () {
      var a = [];

      // 1) obavezni nav keys filteri
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

      // 2) filteri sa detail smartfilterbar-a (posle setFilterData)
      var oSfb = this.byId("sfbDetail");
      var aSfbFilters = oSfb ? (oSfb.getFilters() || []) : [];

      return a.concat(aSfbFilters);
    }

  });
});
