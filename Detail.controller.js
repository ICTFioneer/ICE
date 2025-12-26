sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/routing/History",
  "ice/util/DateUtil"
], function (Controller, JSONModel, Filter, FilterOperator, History, DateUtil) {
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

      this._sfbReady = false;
      this._stReady = { stProduct: false, stSegment: false, stCaption: false };
      this._pendingRebind = false;
      this._pendingRebindBySt = { stProduct: false, stSegment: false, stCaption: false };

      // SFB init gate
      var oSfb = this.byId("sfbDetail");
      if (oSfb) {
        oSfb.attachInitialise(function () {
          this._sfbReady = true;

          // popuni SFB iz MAIN session storage
          this._restoreSfbFromSession("MAIN_SFB_FILTERS");

          if (this._pendingRebind) {
            this._pendingRebind = false;
            this._rebindActiveSafe();
          }
        }.bind(this));
      }

      // SmartTable init gate (3 taba)
      this._attachSmartTableInit("stProduct");
      this._attachSmartTableInit("stSegment");
      this._attachSmartTableInit("stCaption");

      this.getOwnerComponent().getRouter()
        .getRoute("RouteDetail")
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

      var dIce = DateUtil.fromIso(oQuery.iceRunDate || "");

      this.getView().getModel("vm").setProperty("/navKeys", {
        ICERunDate: dIce,
        CompanyCode: decodeURIComponent(oArgs.CompanyCode || ""),
        TradingPartner: decodeURIComponent(oArgs.TradingPartner || ""),
        FinalBreakCode: decodeURIComponent(oArgs.FinalBreakCode || "")
      });

      var sTab = (oQuery.tab ? decodeURIComponent(oQuery.tab) : "product") || "product";
      this.byId("itbViews").setSelectedKey(sTab);

      // ako je SFB već spreman, restore odmah
      if (this._sfbReady) {
        this._restoreSfbFromSession("MAIN_SFB_FILTERS");
      }

      this._rebindActiveSafe();
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
      this._rebindActiveSafe();
    },

    onTabSelect: function () {
      this._rebindActiveSafe();
    },

    _restoreSfbFromSession: function (sKey) {
      var oSfb = this.byId("sfbDetail");
      if (!oSfb) { return; }

      try {
        var sData = sessionStorage.getItem(sKey);
        if (!sData) { return; }
        oSfb.setFilterData(JSON.parse(sData), true);
      } catch (e) {}
    },

    _rebindActiveSafe: function () {
      if (!this._sfbReady) {
        this._pendingRebind = true;
        return;
      }

      var sKey = this.byId("itbViews").getSelectedKey();
      var m = { product: "stProduct", segment: "stSegment", caption: "stCaption" };
      var sId = m[sKey];

      var oSt = this.byId(sId);
      if (!oSt) { return; }

      if (!this._stReady[sId]) {
        this._pendingRebindBySt[sId] = true;
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

      var k = this.getView().getModel("vm").getProperty("/navKeys") || {};
      if (k.ICERunDate) a.push(new Filter("ICERunDate", FilterOperator.EQ, k.ICERunDate));
      if (k.CompanyCode) a.push(new Filter("CompanyCode", FilterOperator.EQ, k.CompanyCode));
      if (k.TradingPartner) a.push(new Filter("TradingPartner", FilterOperator.EQ, k.TradingPartner));
      if (k.FinalBreakCode) a.push(new Filter("FinalBreakCode", FilterOperator.EQ, k.FinalBreakCode));

      var oSfb = this.byId("sfbDetail");
      var aSfbFilters = oSfb ? (oSfb.getFilters() || []) : [];

      return a.concat(aSfbFilters);
    },

    // XML ti već poziva itemPress=".onProductRowPress" na svim tabelama
    onProductRowPress: function (oEvent) {
      var oItem = oEvent.getParameter("listItem");
      var oCtx = oItem && oItem.getBindingContext();
      if (!oCtx) { return; }

      // snimi DETAIL filter state (da se L2 popuni)
      try {
        var oSfb = this.byId("sfbDetail");
        sessionStorage.setItem("DETAIL_SFB_FILTERS", JSON.stringify((oSfb && oSfb.getFilterData()) || {}));
      } catch (e) {}

      var oRow = oCtx.getObject() || {};
      var sTab = this.byId("itbViews").getSelectedKey(); // product/segment/caption

      // jedan KeyValue zavisno od taba
      var sRoute = "RouteDetailL2Product";
      var sKeyValue = "";

      if (sTab === "product") {
        sRoute = "RouteDetailL2Product";
        sKeyValue = oRow.Product || "";
      } else if (sTab === "segment") {
        sRoute = "RouteDetailL2Segment";
        sKeyValue = oRow.Segment || "";
      } else {
        sRoute = "RouteDetailL2Category";
        sKeyValue = oRow.ICCategory || "";
      }

      this.getOwnerComponent().getRouter().navTo(sRoute, {
        CompanyCode: oRow.CompanyCode || "",
        TradingPartner: oRow.TradingPartner || "",
        FinalBreakCode: oRow.FinalBreakCode || "",
        KeyValue: sKeyValue,
        "?query": {
          iceRunDate: DateUtil.toIso(oRow.ICERunDate)
        }
      });
    }

  });
});
