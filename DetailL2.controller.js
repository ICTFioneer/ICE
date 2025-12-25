// webapp/controller/DetailL2.controller.js
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
      // view model (ključevi koji moraju uvek da važe)
      this.getView().setModel(new JSONModel({
        keys: {
          ICERunDate: null,
          CompanyCode: "",
          TradingPartner: "",
          FinalBreakCode: "",
          Product: "" // L2 Product je key (TeamProductViewL2Set)
        }
      }), "vm");

      // readiness
      this._sfbReady = false;
      this._stReady = false;

      // pending
      this._pendingApply = false;

      // SFB initialise gate
      var oSfb = this.byId("sfbDetailL2");
      if (oSfb) {
        oSfb.attachInitialise(function () {
          this._sfbReady = true;

          // kad je SFB spreman, popuni ga (ako je ruta već stigla)
          if (this._pendingApply) {
            this._pendingApply = false;
            this._applySfbAndRebind();
          }
        }.bind(this));
      }

      // SmartTable initialise gate
      var oSt = this.byId("stDetailL2");
      if (oSt) {
        oSt.attachInitialise(function () {
          this._stReady = true;

          if (this._pendingApply) {
            this._pendingApply = false;
            this._applySfbAndRebind();
          }
        }.bind(this));
      }

      // routing
      this.getOwnerComponent().getRouter()
        .getRoute("RouteDetailL2")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      var a = oEvent.getParameter("arguments") || {};

      // decode args (ti šalješ encodeURIComponent)
      var sIso = decodeURIComponent(a.ICERunDate || "");
      var dIce = sIso ? new Date(sIso) : null;

      var oKeys = {
        ICERunDate: (dIce && !isNaN(dIce.getTime())) ? dIce : null,
        CompanyCode: decodeURIComponent(a.CompanyCode || ""),
        TradingPartner: decodeURIComponent(a.TradingPartner || ""),
        FinalBreakCode: decodeURIComponent(a.FinalBreakCode || ""),
        Product: decodeURIComponent(a.Product || "")
      };

      this.getView().getModel("vm").setProperty("/keys", oKeys);

      // ako nije spremno -> odloži
      if (!this._sfbReady || !this._stReady) {
        this._pendingApply = true;
        return;
      }

      this._applySfbAndRebind();
    },

    _applySfbAndRebind: function () {
      var oSfb = this.byId("sfbDetailL2");
      var oSt = this.byId("stDetailL2");
      if (!oSfb || !oSt) { return; }

      // 1) uzmi filter state sa Main-a iz sessionStorage (da se VIDI na ekranu)
      var oMainData = {};
      try {
        var sData = sessionStorage.getItem("MAIN_SFB_FILTERS");
        if (sData) {
          oMainData = JSON.parse(sData) || {};
        }
      } catch (e) { /* ignore */ }

      // 2) prepiši ključne filtere (uvek moraju da budu setovani)
      var k = this.getView().getModel("vm").getProperty("/keys") || {};
      oMainData.ICERunDate = k.ICERunDate || null;
      oMainData.CompanyCode = k.CompanyCode || "";
      oMainData.TradingPartner = k.TradingPartner || "";
      oMainData.FinalBreakCode = k.FinalBreakCode || "";
      oMainData.Product = k.Product || "";

      // 3) setFilterData popunjava UI polja
      oSfb.setFilterData(oMainData, true);

      // 4) rebind (tek sad, kad su SFB+ST initialised)
      oSt.rebindTable(true);
    },

    // OVDE NIKAD ne zovemo oSfb.getFilters() -> SmartTable to sam radi preko smartFilterId
    onBeforeRebindL2: function (oEvent) {
      var p = oEvent.getParameter("bindingParams");
      p.filters = p.filters || [];

      var k = this.getView().getModel("vm").getProperty("/keys") || {};

      if (k.ICERunDate) p.filters.push(new Filter("ICERunDate", FilterOperator.EQ, k.ICERunDate));
      if (k.CompanyCode) p.filters.push(new Filter("CompanyCode", FilterOperator.EQ, k.CompanyCode));
      if (k.TradingPartner) p.filters.push(new Filter("TradingPartner", FilterOperator.EQ, k.TradingPartner));
      if (k.FinalBreakCode) p.filters.push(new Filter("FinalBreakCode", FilterOperator.EQ, k.FinalBreakCode));
      if (k.Product) p.filters.push(new Filter("Product", FilterOperator.EQ, k.Product));
    },

    onSearch: function () {
      // search klik → samo rebind, ali opet sigurno
      if (!this._sfbReady || !this._stReady) {
        this._pendingApply = true;
        return;
      }
      var oSt = this.byId("stDetailL2");
      oSt && oSt.rebindTable(true);
    },

    onItemPress: function (oEvent) {
      // klik iz tabele (itemPress iz XML)
      var oItem = oEvent.getParameter("listItem");
      var oCtx = oItem && oItem.getBindingContext();
      if (!oCtx) { return; }

      var oRow = oCtx.getObject() || {};

      // OVDE radiš nav na sledeći page (L3) ako treba
      // samo dopuni koje ključeve treba da nosi dalje
      // (primer ostavljam prazno da ti ne izmišljam rutu)
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
