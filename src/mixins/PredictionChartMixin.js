import _ from "lodash";
import Highcharts from "highcharts";
import { ISO_MONTH_KEY } from "./DataMixin";

export default {
  mixins: [],
  props: {
    forecastMonths: {
      type: Number,
      default: 1
    },
    selectedDataFile: {
      type: Array,
      required: true
    },
    selectedModel: {
      type: String,
      required: false
    }
  },
  data() {
    return {};
  },
  computed: {
    futureMonths() {
      // Have to clone dates... they are passed by reference
      // Dates are already sorted
      let lastMonth = new Date(this.monthsInData[this.monthsInData.length - 1]);
      let retVal = [];
      for (let i = 0; i < this.forecastMonths; i++) {
        retVal.push(new Date(lastMonth.setMonth(lastMonth.getMonth() + 1)));
      }
      return _.sortBy(retVal);
    },
    dataKeys() {
      return Object.keys(this.selectedDataFile[0]);
    },
    salesByMonth() {
      let retVal = [];

      let dataGroupedByMonth = _.chain(this.selectedDataFile)
        .filter(d => {
          if (this.selectedModel) {
            return d.Model === this.selectedModel;
          } else {
            return true;
          }
        })
        .groupBy(ISO_MONTH_KEY)
        .value();

      _.sortBy(Object.keys(dataGroupedByMonth)).forEach(month => {
        let unitsSold = _.sumBy(dataGroupedByMonth[month], "UnitsSold");
        retVal.push([new Date(month).getTime(), unitsSold]);
      });
      return retVal;
    },
    monthsInData() {
      return (
        _.chain(this.selectedDataFile)
          .map(d => d[ISO_MONTH_KEY])
          .uniq()
          .map(m => new Date(m))
          // Sort the dates ASC
          .sortBy()
          .value()
      );
    },
    chartTitle() {
      return "Sales Prediction";
    },
    defaultChartSeries() {
      return [
        {
          type: "line",
          name: "Total Sales",
          data: this.salesByMonth,
          marker: {
            lineColor: Highcharts.getOptions().colors[0]
          }
        }
      ];
    },
    chartOptions() {
      return {
        chart: {
          zoomType: "x"
        },
        title: {
          useHTML: true,
          text: this.chartTitle
        },
        subtitle: {
          text:
            document.ontouchstart === undefined
              ? "Click and drag in the plot area to zoom in"
              : "Pinch the chart to zoom in"
        },
        xAxis: {
          type: "datetime"
        },
        yAxis: {
          title: {
            text: "Units Sold"
          }
        },
        tooltip: {
          crosshairs: true,
          shared: true
        },
        legend: {
          enabled: true
        },
        plotOptions: {
          area: {
            fillColor: {
              linearGradient: {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 1
              },
              stops: [
                [0, Highcharts.getOptions().colors[0]],
                [
                  1,
                  Highcharts.Color(Highcharts.getOptions().colors[0])
                    .setOpacity(0)
                    .get("rgba")
                ]
              ]
            },
            marker: {
              radius: 2
            },
            lineWidth: 1,
            states: {
              hover: {
                lineWidth: 1
              }
            },
            threshold: null
          }
        },

        series: this.chartSeries
      };
    }
  }
};
