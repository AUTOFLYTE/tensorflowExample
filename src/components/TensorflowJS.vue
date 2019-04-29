<template>
  <div>
    <v-flex xs12>
      <v-form>
        <v-container>
          <v-layout row wrap>
            <v-flex xs6 sm4 md2>
              <v-text-field
                :min="10"
                :max="1000"
                type="number"
                label="Iterations"
                v-model="model.epochs"
              />
            </v-flex>
            <v-flex xs6 sm4 md2>
              <v-text-field
                :min="1"
                :max="Math.floor(this.salesDataContainer.salesData.length / 2)"
                type="number"
                label="Window Size"
                v-model="model.window"
              />
            </v-flex>
            <v-flex xs6 sm3>
              <v-checkbox v-model="model.considerMonths" label="Consider Months"></v-checkbox>
            </v-flex>
            <v-flex sm1>
              <v-btn @click="calculatePrediction" color="info">Predict</v-btn>
            </v-flex>
          </v-layout>
        </v-container>
        <v-container>
          <v-layout row wrap>
            <v-flex xs4 sm3>
              <v-text-field
                :min="1"
                :step="1"
                type="number"
                label="Batch Size"
                v-model="model.batchSize"
              />
            </v-flex>
            <v-flex xs4 sm3>
              <v-text-field
                :min="0.0001"
                :max="1"
                :step="0.01"
                type="number"
                label="Learning Rate"
                v-model="model.learnRate"
              />
            </v-flex>
            <v-flex xs4 sm3>
              <v-text-field
                :min="1"
                :max="10"
                :step="1"
                type="number"
                label="Hidden Layers"
                v-model="model.hiddenLayers"
              />
            </v-flex>
            <v-flex xs4 sm3>
              <v-text-field
                :min="1"
                :max="12"
                :step="1"
                type="number"
                label="Prediction Range"
                v-model="forecastMonths"
              />
            </v-flex>
          </v-layout>
        </v-container>
      </v-form>
    </v-flex>
    <transition name="slide-fade">
      <div v-if="trainProgress.working">
        <v-flex xs12>
          <span>
            Iteration {{ trainProgress.progress }} of
            {{ trainProgress.steps }}
          </span>
        </v-flex>
        <v-flex xs12>
          <v-progress-linear :value="loadingProgress"></v-progress-linear>
        </v-flex>
      </div>
    </transition>
    <transition name="slide-fade">
      <v-flex xs12 v-if="trainProgress.loss">
        <span class="text-xs-right">Loss {{ trainProgress.loss }}</span>
      </v-flex>
    </transition>
    <v-flex xs12>
      <!-- For some reason, highcharts is not resizing when the screen changes -->
      <highcharts :options="chartOptions"/>
    </v-flex>
  </div>
</template>
<script>
import SalesDataContainer from "../model/SalesDataContainer";
import Highcharts from "highcharts";
export default {
  props: {
    salesDataContainer: {
      type: SalesDataContainer,
      required: true
    }
  },
  data() {
    return {
      trainProgress: {
        steps: 0,
        progress: 0,
        working: false,
        loss: undefined
      },
      results: undefined,
      forecastMonths: 2,
      model: {
        epochs: 100,
        learnRate: 0.01,
        hiddenLayers: 1,
        batchSize: 10,
        window: 12,
        considerMonths: true
      }
    };
  },
  computed: {
    loadingProgress() {
      return this.trainProgress.steps === 0
        ? 0
        : (this.trainProgress.progress / this.trainProgress.steps) * 100;
    },
    chartSeries() {
      let retVal = [this.salesSeries];
      if (this.results) {
        retVal = retVal.concat(this.testSeries).concat(this.predictionSeries);
      }
      return retVal;
    },
    salesSeries() {
      return {
        type: "line",
        name: "Total Sales",
        data: this.salesDataContainer.salesData.map(d => {
          return [d.timestamp, d.unitsSold];
        }),
        marker: {
          lineColor: Highcharts.getOptions().colors[0]
        }
      };
    },
    testSeries() {
      if (this.results) {
        return {
          type: "line",
          name: "Testing Data",
          data: this.results.testingData.map(d => {
            return [d.timestamp, d.unitsSold];
          }),
          marker: {
            lineColor: Highcharts.getOptions().colors[3]
          }
        };
      } else {
        return {};
      }
    },
    predictionSeries() {
      if (this.results) {
        return {
          type: "line",
          name: "Predictions",
          data: this.results.predictionData.map(d => {
            return [d.timestamp, d.unitsSold];
          }),
          marker: {
            lineColor: Highcharts.getOptions().colors[4]
          }
        };
      } else {
        return {};
      }
    },
    chartOptions() {
      return {
        chart: {
          zoomType: "x"
        },
        title: {
          useHTML: true,
          text: "Sales Prediction using Tensorflow"
        },
        subtitle: {
          text:
            "Model generation and predictions are all done by the client (browser)."
        },
        xAxis: {
          type: "datetime",
          plotBands: [
            {
              color: "#9EEBEA66", // Color value
              from: 0, // Start of the plot band
              to: this.salesDataContainer.salesData[this.model.window - 1]
                .timestamp // End of the plot band
            }
          ]
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
  },
  methods: {
    calculatePrediction() {
      this.trainProgress.steps = this.model.epochs;
      this.trainProgress.progress = 0;
      this.trainProgress.working = true;

      this.salesDataContainer.trainModel(
        Number.parseInt(this.model.epochs),
        Number.parseFloat(this.model.learnRate),
        Number.parseInt(this.model.hiddenLayers),
        Number.parseInt(this.model.batchSize),
        Number.parseInt(this.model.window),
        this.model.considerMonths,
        this.forecastMonths,
        (e, logs) => {
          this.trainProgress.progress++;
          this.trainProgress.loss = logs.loss;
        },
        results => {
          this.trainProgress.working = false;
          this.results = results;
        }
      );
    }
  }
};
</script>
<style lang="scss" scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}
</style>
