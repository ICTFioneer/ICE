// webapp/controller/DetailL2Product.controller.js
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/routing/History"
], function (Controller, JSONModel, History) {
  "use strict";

  return Controller.extend("ice.controller.DetailL2Product", {

    onInit: function () {
      this.getView().setModel(new JSONModel({
        keys: {
          ICERunDate: null,
          CompanyCode: "",
          TradingPartner: "",
          FinalBreakCode: "",
          Product: ""
        }
      }), "vm");

      this._sfbReady = false;
      this._stReady = false;
      this._pendingApply = false;

      var oSfb = this.byId("sfbL2Product");
      if (oSfb) {
        oSfb.attachInitialise(function () {
          this._sfbReady = true;
          if (this._pendingApply && this._stReady) {
            this._pendingApply = false;
            this._applySfbAndRebind();
          }
        }.bind(this));
      }

      var oSt = this.byId("stL2Product");
      if (oSt) {
        oSt.attachInitialise(function () {
          this._stReady = true;
          if (this._pendingApply && this._sfbReady) {
            this._pendingApply = false;
            this._applySfbAndRebind();
          }
        }.bind(this));
      }

      this.getOwnerComponent().getRouter()
        .getRoute("RouteDetailL2Product")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      var a = oEvent.getParameter("arguments") || {};
      var q = a["?query"] || {};

      var sIso = decodeURIComponent(q.iceRunDate || "");
      var dIce = sIso ? new Date(sIso) : null;

      this.getView().getModel("vm").setProperty("/keys", {
        ICERunDate: (dIce && !isNaN(dIce.getTime())) ? dIce : null,
        CompanyCode: decodeURIComponent(a.CompanyCode || ""),
        TradingPartner: decodeURIComponent(a.TradingPartner || ""),
        FinalBreakCode: decodeURIComponent(a.FinalBreakCode || ""),
        Product: decodeURIComponent(a.Product || "")
      });

      if (!this._sfbReady || !this._stReady) {
        this._pendingApply = true;
        return;
      }

      this._applySfbAndRebind();
    },

    _applySfbAndRebind: function () {
      var oSfb = this.byId("sfbL2Product");
      var oSt = this.byId("stL2Product");
      if (!oSfb || !oSt) { return; }

      var oData = this._readSessionFilters();

      // merge keys (da se vide u poljima)
      var k = this.getView().getModel("vm").getProperty("/keys") || {};
      oData.ICERunDate = k.ICERunDate || null;
      oData.CompanyCode = k.CompanyCode || "";
      oData.TradingPartner = k.TradingPartner || "";
      oData.FinalBreakCode = k.FinalBreakCode || "";
      oData.Product = k.Product || "";

      oSfb.setFilterData(oData, true);
      oSt.rebindTable(true);
    },

    _readSessionFilters: function () {
      // L2 prvo uzima DETAIL, pa fallback na MAIN
      var oData = {};
      try {
        var s = sessionStorage.getItem("DETAIL_SFB_FILTERS") || sessionStorage.getItem("MAIN_SFB_FILTERS");
        if (s) { oData = JSON.parse(s) || {}; }
      } catch (e) { /* ignore */ }

      // ICERunDate ako je string -> Date
      if (typeof oData.ICERunDate === "string") {
        var d = new Date(oData.ICERunDate);
        oData.ICERunDate = isNaN(d.getTime()) ? null : d;
      }
      return oData;
    },

    onSearch: function () {
      if (!this._sfbReady || !this._stReady) {
        this._pendingApply = true;
        return;
      }
      var oSt = this.byId("stL2Product");
      oSt && oSt.rebindTable(true);
    },

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
