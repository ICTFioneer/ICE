sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History",
  "ice/util/DateUtil"
], function (Controller, History, DateUtil) {
  "use strict";

  return Controller.extend("ice.controller.DetailL2", {

    onInit: function () {
      this._sfbReady = false;
      this._stReady = false;
      this._pendingApply = false;

      this._cfg = null;   // setuje se po ruti
      this._keys = null;  // setuje se na match

      var oSfb = this.byId("sfbDetailL2");
      if (oSfb) {
        oSfb.attachInitialise(function () {
          this._sfbReady = true;
          this._tryApply();
        }.bind(this));
      }

      var oSt = this.byId("stDetailL2");
      if (oSt) {
        oSt.attachInitialise(function () {
          this._stReady = true;
          this._tryApply();
        }.bind(this));
      }

      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("RouteDetailL2Product").attachPatternMatched(this._onMatchedProduct, this);
      oRouter.getRoute("RouteDetailL2Segment").attachPatternMatched(this._onMatchedSegment, this);
      oRouter.getRoute("RouteDetailL2Category").attachPatternMatched(this._onMatchedCategory, this);
    },

    _onMatchedProduct: function (oEvent) {
      this._cfg = {
        entitySet: "TeamProductViewL2Set",
        keyField: "Product",
        fields: "ICERunDate,CompanyCode,TradingPartner,FinalBreakCode,Product,Currency,TradingPartnerName,ReportingUnitBalance,CounterpartyUnitBalance,BalanceDifference,Status,TPSystem"
      };
      this._onMatchedCommon(oEvent);
    },

    _onMatchedSegment: function (oEvent) {
      this._cfg = {
        entitySet: "TeamSegmentViewL2Set",
        keyField: "Segment",
        fields: "ICERunDate,CompanyCode,TradingPartner,FinalBreakCode,Segment,Currency,TradingPartnerName,ReportingUnitBalance,CounterpartyUnitBalance,BalanceDifference,Status,TPSystem"
      };
      this._onMatchedCommon(oEvent);
    },

    _onMatchedCategory: function (oEvent) {
      this._cfg = {
        entitySet: "TeamCategoryViewL2Set",
        keyField: "ICCategory",
        fields: "ICERunDate,CompanyCode,TradingPartner,FinalBreakCode,ICCategory,Currency,TradingPartnerName,ReportingUnitBalance,CounterpartyUnitBalance,BalanceDifference,Status,TPSystem"
      };
      this._onMatchedCommon(oEvent);
    },

    _onMatchedCommon: function (oEvent) {
      var a = oEvent.getParameter("arguments") || {};
      var q = a["?query"] || {};

      this._keys = {
        ICERunDate: DateUtil.fromIso(q.iceRunDate || ""),
        CompanyCode: decodeURIComponent(a.CompanyCode || ""),
        TradingPartner: decodeURIComponent(a.TradingPartner || ""),
        FinalBreakCode: decodeURIComponent(a.FinalBreakCode || ""),
        KeyValue: decodeURIComponent(a.KeyValue || "")
      };

      this._pendingApply = true;
      this._tryApply();
    },

    _tryApply: function () {
      if (!this._pendingApply) { return; }
      if (!this._cfg || !this._keys) { return; }
      if (!this._sfbReady || !this._stReady) { return; }

      this._pendingApply = false;
      this._applyAndRebind();
    },

    _applyAndRebind: function () {
      var oSfb = this.byId("sfbDetailL2");
      var oSt = this.byId("stDetailL2");
      if (!oSfb || !oSt) { return; }

      // 1) set entitySet (SFB + ST)
      oSfb.setEntitySet(this._cfg.entitySet);
      oSt.setEntitySet(this._cfg.entitySet);

      // 2) set visible fields (po tipu L2)
      oSt.setInitiallyVisibleFields(this._cfg.fields);

      // 3) restore filters iz sessionStorage (DETAIL -> L2)
      var oStored = {};
      try {
        var s = sessionStorage.getItem("DETAIL_SFB_FILTERS");
        if (s) { oStored = JSON.parse(s) || {}; }
      } catch (e) {}

      // 4) merge + obavezni ključevi + JEDAN drill key
      var oFD = Object.assign({}, oStored);
      oFD.ICERunDate = this._keys.ICERunDate || null;
      oFD.CompanyCode = this._keys.CompanyCode || "";
      oFD.TradingPartner = this._keys.TradingPartner || "";
      oFD.FinalBreakCode = this._keys.FinalBreakCode || "";
      oFD[this._cfg.keyField] = this._keys.KeyValue || "";

      // 5) popuni polja na ekranu i rebind
      oSfb.setFilterData(oFD, true);
      oSt.rebindTable(true);
    },

    onSearch: function () {
      var oSt = this.byId("stDetailL2");
      if (oSt && this._stReady && this._sfbReady) {
        oSt.rebindTable(true);
      }
    },

    onRowPress: function (oEvent) {
      // TODO: ovde ide L3 ako budeš pravio
      // var oItem = oEvent.getParameter("listItem"); ...
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
