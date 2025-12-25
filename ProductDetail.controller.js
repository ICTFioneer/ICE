
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/History"
  ], function (Controller, Filter, FilterOperator, History) {
    "use strict";
  
    return Controller.extend("ice.controller.ProductDetail", {
  
      onInit: function () {
        this._sfbReady = false;
        this._stReady = false;
        this._pending = false;
  
        var oSfb = this.byId("sfbProductDetail");
        if (oSfb) {
          oSfb.attachInitialise(function () {
            this._sfbReady = true;
            if (this._pending) { this._pending = false; this._applyAndRebind(); }
          }.bind(this));
        }
  
        var oSt = this.byId("stProductDetail");
        if (oSt) {
          oSt.attachInitialise(function () {
            this._stReady = true;
            if (this._pending) { this._pending = false; this._applyAndRebind(); }
          }.bind(this));
        }
  
        this.getOwnerComponent().getRouter()
          .getRoute("RouteProductDetail")
          .attachPatternMatched(this._onRouteMatched, this);
      },
  
      _onRouteMatched: function (oEvent) {
        var a = oEvent.getParameter("arguments") || {};
  
        // decode (ruter ti već daje stringove, ali ti si ranije encodovao pa dekoduj)
        this._keys = {
          ICERunDate: decodeURIComponent(a.ICERunDate || ""),
          CompanyCode: decodeURIComponent(a.CompanyCode || ""),
          TradingPartner: decodeURIComponent(a.TradingPartner || ""),
          FinalBreakCode: decodeURIComponent(a.FinalBreakCode || ""),
          Product: decodeURIComponent(a.Product || "")
        };
  
        // ako SFB/ST nisu spremni, odloži
        if (!this._sfbReady || !this._stReady) {
          this._pending = true;
          return;
        }
  
        this._applyAndRebind();
      },
  
      _applyAndRebind: function () {
        // 1) Popuni SFB polja (da se vide na ekranu)
        var oSfb = this.byId("sfbProductDetail");
        if (oSfb) {
          // ICERunDate u OData metadata je Edm.DateTime
          // setFilterData očekuje JS Date za date polja (u većini UI5 verzija)
          var d = this._parseIsoToDate(this._keys.ICERunDate);
  
          oSfb.setFilterData({
            ICERunDate: d || null,
            CompanyCode: this._keys.CompanyCode,
            TradingPartner: this._keys.TradingPartner,
            FinalBreakCode: this._keys.FinalBreakCode,
            Product: this._keys.Product
          }, true);
        }
  
        // 2) Rebind (SmartTable)
        var oSt = this.byId("stProductDetail");
        if (oSt) {
          oSt.rebindTable(true);
        }
      },
  
      onBeforeRebind: function (oEvent) {
        var p = oEvent.getParameter("bindingParams");
        p.filters = p.filters || [];
  
        var d = this._parseIsoToDate(this._keys && this._keys.ICERunDate);
  
        if (d) p.filters.push(new Filter("ICERunDate", FilterOperator.EQ, d));
        if (this._keys.CompanyCode) p.filters.push(new Filter("CompanyCode", FilterOperator.EQ, this._keys.CompanyCode));
        if (this._keys.TradingPartner) p.filters.push(new Filter("TradingPartner", FilterOperator.EQ, this._keys.TradingPartner));
        if (this._keys.FinalBreakCode) p.filters.push(new Filter("FinalBreakCode", FilterOperator.EQ, this._keys.FinalBreakCode));
        if (this._keys.Product) p.filters.push(new Filter("Product", FilterOperator.EQ, this._keys.Product));
      },
  
      onSearch: function () {
        var oSt = this.byId("stProductDetail");
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
      },
  
      _parseIsoToDate: function (sIso) {
        if (!sIso) { return null; }
  
        // ako ti ICERunDate u URL-u šalješ kao ISO string (2025-03-10T00:00:00.000Z)
        var d = new Date(sIso);
        if (!isNaN(d.getTime())) { return d; }
  
        // ako šalješ već “datetime'...’” – očisti
        var m = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/.exec(String(sIso));
        if (m && m[1]) {
          var d2 = new Date(m[1]);
          return isNaN(d2.getTime()) ? null : d2;
        }
  
        return null;
      }
  
    });
  });
  
