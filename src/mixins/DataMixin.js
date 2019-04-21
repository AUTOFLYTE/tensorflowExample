/* global require */
import _ from "lodash";
import SalesData from "../model/SalesData.js";
import SalesDataContainer from "../model/SalesDataContainer.js";
let dealerA = require("../data/dealerA.json");

export const ISO_MONTH_KEY = "Month (ISO-8601)";

export default {
  data() {
    return {
      selectedModel: null,
      selectedData: dealerA,
      dataFiles: [
        {
          text: "Dealer A (114)",
          value: dealerA
        },
        {
          text: "Dealer B (285)",
          value: require("../data/dealerB.json")
        },
        {
          text: "Dealer C (161)",
          value: require("../data/dealerC.json")
        },
        {
          text: "Dealer D (38)",
          value: require("../data/dealerD.json")
        }
      ]
    };
  },
  computed: {
    availableModels() {
      let models = _.chain(this.selectedData)
        // TODO if possible.. filter out the no sales, breaks the Kalman filter currently
        //	.filter((d) => d.UnitsSold > 0)
        .map(d => d.Model)
        .uniq()
        .sortBy()
        .value();
      return [{ value: null, text: "ALL" }].concat(
        models.map(m => {
          return {
            value: m,
            text: m
          };
        })
      );
    },
    monthsInData() {
      return (
        _.chain(this.selectedData)
          .map(d => d[ISO_MONTH_KEY])
          .uniq()
          .map(m => new Date(m))
          // Sort the dates ASC
          .sortBy()
          .value()
      );
    },
    filteredData() {
      return _.chain(this.selectedData)
        .filter(s => {
          if (!this.selectedModel) {
            return true;
          } else {
            return this.selectedModel === s.Model;
          }
        })
        .groupBy(ISO_MONTH_KEY)
        .map((val, key) => {
          let retVal = {
            UnitsSold: _.sumBy(val, "UnitsSold")
          };
          retVal[ISO_MONTH_KEY] = key;
          return retVal;
        })
        .sortBy(ISO_MONTH_KEY)
        .value()
        .map(d => new SalesData(new Date(d[ISO_MONTH_KEY]), d.UnitsSold));
    },
    filteredSalesDataContainer() {
      return new SalesDataContainer(this.filteredData);
    }
  }
};
