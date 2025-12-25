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

      // SFB ready gate
      this._bSfbReady = false;
      this._bPendingRebind = false;

      var oSfb = this.byId("sfbDetail");
      if (oSfb) {
        oSfb.attachInitialise(function () {
          this._bSfbReady = true;

          // kad SFB postane spreman, popuni polja iz sessionStorage
          this._restoreSmartFilterBar();

          // ako je rebind bio tražen ranije, okini sad
          if (this._bPendingRebind) {
            this._bPendingRebind = false;
            this._rebindActiveSmartTable();
          }
        }.bind(this));
      }

      this.getOwnerComponent()
        .getRouter()
        .getRoute("RouteDetail")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      var oArgs = oEvent.getParameter("arguments") || {};
      var oQuery = oArgs["?query"] || {};

      // nav keys
      var sIso = decodeURIComponent(oQuery.iceRunDate || "");
      var dIce = sIso ? new Date(sIso) : null;

      this.getView().getModel("vm").setProperty("/navKeys", {
        ICERunDate: dIce && !isNaN(dIce.getTime()) ? dIce : null,
        CompanyCode: decodeURIComponent(oArgs.CompanyCode || ""),
        TradingPartner: decodeURIComponent(oArgs.TradingPartner || ""),
        FinalBreakCode: decodeURIComponent(oArgs.FinalBreakCode || "")
      });

      // tab
      var sTab = (oQuery.tab ? decodeURIComponent(oQuery.tab) : "product") || "product";
      this.byId("itbViews").setSelectedKey(sTab);

      // ako SFB nije spreman, sačekaj initialise pa rebind (onInit handler radi restore+rebind)
      if (!this._bSfbReady) {
        this._bPendingRebind = true;
        return;
      }

      // SFB spreman -> restore + rebind
      this._restoreSmartFilterBar();
      this._rebindActiveSmartTable();
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
      this._rebindActiveSmartTable();
    },

    onTabSelect: function () {
      this._rebindActiveSmartTable();
    },

    // -------------------------
    // SmartFilterBar restore
    // -------------------------
    _restoreSmartFilterBar: function () {
      var oSfb = this.byId("sfbDetail");
      if (!oSfb) { return; }

      // ako nije inicijalizovan još, ne pokušavaj (onInit initialise handler će pozvati opet)
      if (!this._bSfbReady) { return; }

      try {
        var sData = sessionStorage.getItem("MAIN_SFB_FILTERS");
        if (!sData) { return; }

        var oData = JSON.parse(sData);
        oSfb.setFilterData(oData, true);
      } catch (e) {
        // ignore
      }
    },

    // -------------------------
    // SmartTable rebind (SAFE)
    // -------------------------
    _rebindActiveSmartTable: function () {
      // ne rebinduj dok SFB nije spreman (da getFilters ne baca warning)
      if (!this._bSfbReady) {
        this._bPendingRebind = true;
        return;
      }

      var sKey = this.byId("itbViews").getSelectedKey();
      var m = {
        product: "stProduct",
        segment: "stSegment",
        caption: "stCaption"
      };

      var oSt = this.byId(m[sKey]);
      if (!oSt) { return; }

      this._whenSmartTableReady(oSt).then(function () {
        oSt.rebindTable(true);
      });
    },

    _whenSmartTableReady: function (oSt) {
      // 1) Najbolje: koristi _oTableReady ako postoji (vidiš ga u debuggeru)
      if (oSt._oTableReady && typeof oSt._oTableReady.then === "function") {
        return oSt._oTableReady;
      }

      // 2) Fallback: čekaj initialise (attach samo jednom)
      if (!oSt._pInit) {
        oSt._pInit = new Promise(function (resolve) {
          oSt.attachInitialise(function () {
            resolve();
          });
        });
      }
      return oSt._pInit;
    },

    onBeforeRebindAny: function (oEvent) {
      var oBindingParams = oEvent.getParameter("bindingParams");
      oBindingParams.filters = (oBindingParams.filters || []).concat(this._getAllFilters());
    },

    _getAllFilters: function () {
      var a = [];

      // nav keys
      var k = this.getView().getModel("vm").getProperty("/navKeys") || {};

      if (k.ICERunDate) a.push(new Filter("ICERunDate", FilterOperator.EQ, k.ICERunDate));
      if (k.CompanyCode) a.push(new Filter("CompanyCode", FilterOperator.EQ, k.CompanyCode));
      if (k.TradingPartner) a.push(new Filter("TradingPartner", FilterOperator.EQ, k.TradingPartner));
      if (k.FinalBreakCode) a.push(new Filter("FinalBreakCode", FilterOperator.EQ, k.FinalBreakCode));

      // SFB filteri (samo ako je SFB ready)
      if (!this._bSfbReady) {
        return a;
      }

      var oSfb = this.byId("sfbDetail");
      var aSfbFilters = oSfb ? (oSfb.getFilters() || []) : [];
      return a.concat(aSfbFilters);
    }

  });
});
