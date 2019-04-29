import * as tf from "@tensorflow/tfjs";
import _ from "lodash";
import SalesData from "./SalesData";

export default class SalesDataContainer {
  // An array of SalesDatas
  salesData;
  _tfModel = undefined;
  _window = undefined;
  constructor(salesDataArray) {
    this.salesData = salesDataArray;
  }

  get modelReady() {
    return this._tfModel !== undefined;
  }

  /**
   * Clear the model
   */
  clearModel() {
    this._tfModel = undefined;
    this._window = undefined;
  }

  get maxUnitsSold() {
    return Math.max.apply(null, this.salesData.map(d => d.unitsSold));
  }
  get minUnitsSold() {
    return Math.min.apply(null, this.salesData.map(d => d.unitsSold));
  }

  /**
   * normalize the sales in this array
   *
   * @param {number[]} numericArray
   */
  _normalizeSalesArray(numericArray) {
    return numericArray.map(n => {
      return this._normalizeSales(n);
    });
  }

  /**
   * Normalize the sales using max & min to be in the 0-1 range.
   * @param {number} sales
   */
  _normalizeSales(sales) {
    return (
      (sales - this.minUnitsSold) / (this.maxUnitsSold - this.minUnitsSold)
    );
  }

  /**
   * denormalize the sales back to their real-world equivalent
   *
   * @param {number} normalizedSales (between 0-1)
   */
  _denormalizeSales(normalizedSales) {
    return (
      normalizedSales * (this.maxUnitsSold - this.minUnitsSold) +
      this.minUnitsSold
    );
  }

  inputTensorArray(window, considerMonths = true) {
    let windowArray = [];
    let tensorArray = [];

    // We stop before the last index, because we don't know the next value
    for (let i = 0; i < this.salesData.length - 1; i++) {
      let d = this.salesData[i];
      windowArray.push(this._normalizeSales(d.unitsSold));
      if (windowArray.length === window) {
        let windowArrayClone = _.clone(windowArray);
        windowArray.shift();
        tensorArray.push(
          this._createInputTensorArray(
            windowArrayClone,
            considerMonths,
            d.monthTensorArray
          )
        );
      }
    }
    return tensorArray;
  }

  _createInputTensorArray(
    windowArray,
    considerMonths = true,
    monthTensorArray = []
  ) {
    if (considerMonths) {
      return windowArray.concat(monthTensorArray);
    } else {
      return windowArray;
    }
  }

  outputTensorArray(window) {
    return this.salesData
      .map(d => {
        return [this._normalizeSales(d.unitsSold)];
      })
      .slice(window);
  }

  trainModel(
    epochs,
    learnRate,
    hiddenLayers,
    batchSize,
    window,
    considerMonths,
    futureMonths = 2,
    epochCallback = () => {},
    finishedCallback = () => {}
  ) {
    this._window = window;
    this._tfModel = undefined;

    let model = tf.sequential();
    let featureCount = considerMonths ? window + 12 : window;
    let inputNeurons = 100;

    model.add(
      tf.layers.dense({
        inputShape: [featureCount],
        units: inputNeurons
      })
    );

    let rnnInputLayerFeatures = 10;
    let rnnInputLayerTimesteps = Math.floor(
      inputNeurons / rnnInputLayerFeatures
    );
    let rnnInputShape = [rnnInputLayerFeatures, rnnInputLayerTimesteps];
    let rnnOutputNeurons = 30;

    let lstmCells = [];

    for (let i = 0; i < hiddenLayers; i++) {
      lstmCells.push(tf.layers.lstmCell({ units: rnnOutputNeurons }));
    }

    model.add(tf.layers.reshape({ targetShape: rnnInputShape }));
    model.add(
      tf.layers.rnn({
        cell: lstmCells,
        inputShape: rnnInputShape,
        returnSequences: false
      })
    );
    model.add(
      tf.layers.dense({
        inputShape: [rnnOutputNeurons],
        units: 1
      })
    );
    model.compile({
      optimizer: tf.train.adam(learnRate),
      loss: "meanSquaredError"
    });

    model.summary();

    let inputTensorArray = this.inputTensorArray(window, considerMonths);
    let outputTensorArray = this.outputTensorArray(window);

    let inputTensor = tf.tensor2d(inputTensorArray);
    let outputTensor = tf.tensor2d(outputTensorArray);

    model
      .fit(inputTensor, outputTensor, {
        epochs: epochs,
        batchSize: Number.parseInt(batchSize),
        callbacks: {
          onEpochEnd: (e, logs) => {
            // console.log(e + ':' + logs.loss);
            epochCallback(e, logs);
          }
        }
      })
      .then(() => {
        let windowArray = [];
        let testingData = [];
        let predictionData = [];

        let startingMonth = new Date(this.salesData[0].salesMonth);

        let incrementStartingMonth = () => {
          startingMonth.setMonth(startingMonth.getMonth() + 1);
        };

        let predict = (
          windowArray,
          salesDataTemplate,
          considerMonths = true
        ) => {
          windowArray = _.clone(windowArray);
          let predictionInputArray = this._createInputTensorArray(
            windowArray,
            considerMonths,
            salesDataTemplate.monthTensorArray
          );
          let prediction = model
            .predict(
              tf.tensor2d(predictionInputArray, [
                1,
                predictionInputArray.length
              ])
            )
            .dataSync()[0];
          return Math.round(this._denormalizeSales(prediction));
        };

        for (let i = 0; i < this.salesData.length - 1; i++) {
          // increment the month
          incrementStartingMonth();
          windowArray.push(this._normalizeSales(this.salesData[i].unitsSold));
          let currentData = new SalesData(new Date(startingMonth), 0);
          // If the window is full, do stuff
          if (windowArray.length === window) {
            currentData.unitsSold = predict(
              windowArray,
              currentData,
              considerMonths
            );
            currentData.salesMonth.setMonth(
              currentData.salesMonth.getMonth() + 1
            );
            testingData.push(currentData);
            // Shift the first element off to continue
            windowArray.shift();
          }
        }

        // Push the current onto the prediction array, so that we have a continuous line
        predictionData.push(testingData[testingData.length - 1]);
        // Put the last known sales on the windowArray, since we stopped -1
        windowArray.push(
          this._normalizeSales(
            this.salesData[this.salesData.length - 1].unitsSold
          )
        );

        for (let i = 0; i < futureMonths; i++) {
          incrementStartingMonth();
          let currentData = new SalesData(new Date(startingMonth), 0);
          currentData.unitsSold = predict(
            windowArray,
            currentData,
            considerMonths
          );
          currentData.salesMonth.setMonth(
            currentData.salesMonth.getMonth() + 1
          );
          predictionData.push(currentData);
          windowArray.push(this._normalizeSales(currentData.unitsSold));
          windowArray.shift();
        }
        finishedCallback(new PredictionResults(testingData, predictionData));
      });
  }
}

export class PredictionResults {
  testingData;
  predictionData;

  constructor(testingData, predictionData) {
    this.testingData = testingData;
    this.predictionData = predictionData;
  }
}
