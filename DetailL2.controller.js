sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/routing/History"
], function (Controller, Filter, FilterOperator, History) {
  "use strict";

  return Controller.extend("ice.controller.DetailL2", {

    onInit: function () {
      this._sfbReady = false;
      this._stReady = false;
      this._pending = false;

      this._navKeys = {};
      this._drill = { es: "", field: "", value: "" };

      var oSfb = this.byId("sfbDetailL2");
      if (oSfb) {
        oSfb.attachInitialise(function () {
          this._sfbReady = true;
          this._restoreSfbFromSession();
          if (this._pending) { this._pending = false; this._applyAndRebind(); }
        }.bind(this));
      }

      var oSt = this.byId("stDetailL2");
      if (oSt) {
        oSt.attachInitialise(function () {
          this._stReady = true;
          if (this._pending) { this._pending = false; this._applyAndRebind(); }
        }.bind(this));
      }

      this.getOwnerComponent().getRouter()
        .getRoute("RouteDetailL2")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      var a = oEvent.getParameter("arguments") || {};
      var q = a["?query"] || {};

      var sIceIso = decodeURIComponent(a.ICERunDate || "");
      var dIce = sIceIso ? new Date(sIceIso) : null;

      this._navKeys = {
        ICERunDate: (dIce && !isNaN(dIce.getTime())) ? dIce : null,
        CompanyCode: decodeURIComponent(a.CompanyCode || ""),
        TradingPartner: decodeURIComponent(a.TradingPartner || ""),
        FinalBreakCode: decodeURIComponent(a.FinalBreakCode || "")
      };

      this._drill = {
        es: decodeURIComponent(q.es || "TeamProductViewL2Set"),
        field: decodeURIComponent(q.field || ""),
        value: q.value ? decodeURIComponent(q.value) : ""
      };

      if (!this._sfbReady || !this._stReady) {
        this._pending = true;
        return;
      }

      this._applyAndRebind();
    },

    _restoreSfbFromSession: function () {
      var oSfb = this.byId("sfbDetailL2");
      if (!oSfb) { return; }

      try {
        var sData = sessionStorage.getItem("MAIN_SFB_FILTERS");
        if (sData) {
          oSfb.setFilterData(JSON.parse(sData), true);
        }
      } catch (e) {
        // ignore
      }
    },

    _applyAndRebind: function () {
      // 1) prebaci entitySet prema kliku
      var oSt = this.byId("stDetailL2");
      if (oSt && this._drill.es) {
        oSt.setEntitySet(this._drill.es);
      }

      // 2) rebind
      oSt && oSt.rebindTable(true);
    },

    onBeforeRebindL2: function (oEvent) {
      var p = oEvent.getParameter("bindingParams");
      p.filters = p.filters || [];

      // nav keys (obavezni)
      if (this._navKeys.ICERunDate) p.filters.push(new Filter("ICERunDate", FilterOperator.EQ, this._navKeys.ICERunDate));
      if (this._navKeys.CompanyCode) p.filters.push(new Filter("CompanyCode", FilterOperator.EQ, this._navKeys.CompanyCode));
      if (this._navKeys.TradingPartner) p.filters.push(new Filter("TradingPartner", FilterOperator.EQ, this._navKeys.TradingPartner));
      if (this._navKeys.FinalBreakCode) p.filters.push(new Filter("FinalBreakCode", FilterOperator.EQ, this._navKeys.FinalBreakCode));

      // SFB filters
      var oSfb = this.byId("sfbDetailL2");
      var aSfb = oSfb ? (oSfb.getFilters() || []) : [];
      p.filters = p.filters.concat(aSfb);

      // drill filter (field=value)
      if (this._drill.field && this._drill.value) {
        p.filters.push(new Filter(this._drill.field, FilterOperator.EQ, this._drill.value));
      }
    },

    onSearch: function () {
      var oSt = this.byId("stDetailL2");
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
