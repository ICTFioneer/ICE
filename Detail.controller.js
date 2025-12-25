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

      // flag za SmartFilterBar readiness
      this._bSfbReady = false;
      this._bPendingRebind = false;

      var oSfb = this.byId("sfbDetail");
      if (oSfb) {
        oSfb.attachInitialise(function () {
          this._bSfbReady = true;

          // restore filter data (ako postoji) kad je SFB spreman -> popuni polja
          this._restoreSmartFilterBar();

          // ako smo čekali rebind, okini sad
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

      // ako SFB nije spreman, onInit initialise handler će uraditi restore + rebind
      if (!this._bSfbReady) {
        this._bPendingRebind = true;
        return;
      }

      // SFB je spreman -> restore filtere i rebind
      this._restoreSmartFilterBar();
      this._rebindActiveSmartTable();
    },

    onNavBack: function () {
      var oHistory = History.getInstance();
      var sPrevHash = oHistory.getPreviousHash();

      // opciono: očisti state kad se vratiš
      // sessionStorage.removeItem("MAIN_SFB_FILTERS");

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

    _restoreSmartFilterBar: function () {
      var oSfb = this.byId("sfbDetail");
      if (!oSfb) { return; }

      // SFB mora biti inicijalizovan da bi se polja popunila
      if (!oSfb._bInitialized) { return; }

      var sData;
      try {
        sData = sessionStorage.getItem("MAIN_SFB_FILTERS");
      } catch (e) {
        return;
      }
      if (!sData) { return; }

      try {
        var oData = JSON.parse(sData);
        oSfb.setFilterData(oData, true);
      } catch (e2) {
        // ignore
      }
    },

    _rebindActiveSmartTable: function () {
      // ne rebinde-uj dok SFB nije spreman (da getFilters ne baca warning)
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

      // pouzdan flag (SmartTable init)
      if (oSt._bIsInitialized) {
        oSt.rebindTable(true);
        return;
      }

      // čekaj initialise, ali samo jednom
      if (!oSt._rebindAttached) {
        oSt._rebindAttached = true;
        oSt.attachInitialise(function () {
          oSt.rebindTable(true);
        });
      }
    },

    onBeforeRebindAny: function (oEvent) {
      var oBindingParams = oEvent.getParameter("bindingParams");
      oBindingParams.filters = (oBindingParams.filters || []).concat(this._getAllFilters());
    },

    _getAllFilters: function () {
      var a = [];

      // 1) nav keys
      var k = this.getView().getModel("vm").getProperty("/navKeys") || {};

      if (k.ICERunDate) a.push(new Filter("ICERunDate", FilterOperator.EQ, k.ICERunDate));
      if (k.CompanyCode) a.push(new Filter("CompanyCode", FilterOperator.EQ, k.CompanyCode));
      if (k.TradingPartner) a.push(new Filter("TradingPartner", FilterOperator.EQ, k.TradingPartner));
      if (k.FinalBreakCode) a.push(new Filter("FinalBreakCode", FilterOperator.EQ, k.FinalBreakCode));

      // 2) SFB filteri samo ako je inicijalizovan
      var oSfb = this.byId("sfbDetail");
      if (!oSfb || !oSfb._bInitialized) {
        return a;
      }

      var aSfbFilters = oSfb.getFilters() || [];
      return a.concat(aSfbFilters);
    }

  });
});
