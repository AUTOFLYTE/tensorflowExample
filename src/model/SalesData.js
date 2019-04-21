export default class SalesData {
  salesMonth;
  unitsSold;

  constructor(salesMonth, unitsSold) {
    this.salesMonth = salesMonth;
    this.unitsSold = unitsSold;
  }

  get yearMonthString() {
    return `${this.salesMonth.getFullYear()}-${this.salesMonth.getMonth() + 1}`;
  }

  get timestamp() {
    return this.salesMonth.getTime();
  }

  /**
   * Produce a one-hot array representing the month that this data contains.
   *
   * I.E. Sales for March would return [0,0,1,0,0,0,0,0,0,0,0,0]
   */
  get monthTensorArray() {
    let numMonths = 12;
    let retVal = [];
    for (let i = 0; i < numMonths; i++) {
      let month = this.salesMonth.getMonth();
      retVal.push(month === i ? 1 : 0);
    }
    return retVal;
  }
}
