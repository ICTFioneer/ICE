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
        const oArgs = oEvent.getParameter("arguments") || {};
        const oQuery = oArgs["?query"] || {};
  
        const sIso = decodeURIComponent(oQuery.iceRunDate || "");
        const dIce = sIso ? new Date(sIso) : null;
  
        this.getView().getModel("vm").setProperty("/navKeys", {
          ICERunDate: dIce && !isNaN(dIce.getTime()) ? dIce : null,
          CompanyCode: decodeURIComponent(oArgs.CompanyCode || ""),
          TradingPartner: decodeURIComponent(oArgs.TradingPartner || ""),
          FinalBreakCode: decodeURIComponent(oArgs.FinalBreakCode || "")
        });
  
        const sTab = (oQuery.tab ? decodeURIComponent(oQuery.tab) : "product") || "product";
        this.byId("itbViews").setSelectedKey(sTab);
  
        setTimeout(this._rebindActive.bind(this),0.6)
      },
  
      onNavBack: function () {
        const oHistory = History.getInstance();
        const sPrevHash = oHistory.getPreviousHash();
  
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
        const sKey = this.byId("itbViews").getSelectedKey();
        const m = {
          product: "stProduct",
          segment: "stSegment",
          caption: "stCaption"
        };
        const oSt = this.byId(m[sKey]);
        oSt && oSt.rebindTable(true);
      },
  
      onBeforeRebindAny: function (oEvent) {
        const oBindingParams = oEvent.getParameter("bindingParams");
        oBindingParams.filters = (oBindingParams.filters || []).concat(this._getAllFilters());
      },
  
      _getAllFilters: function () {
        const a = [];
  
        const k = this.getView().getModel("vm").getProperty("/navKeys") || {};
  
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
  
        const oSfb = this.byId("sfbDetail");
        const aSfbFilters = oSfb ? (oSfb.getFilters() || []) : [];
        return a.concat(aSfbFilters);
      }
  
    });
  });
