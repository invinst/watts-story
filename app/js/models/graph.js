import _ from 'lodash';
import { scaleOrdinal, schemeCategory20c } from 'd3-scale';

export default class Graph {
  constructor(data, elementId) {
    this.width = 400;
    this.height = 500;
    this._elementId = elementId;
    this.data = data;
    this.refreshIntervalId = 0;
    this._timelineIndex = 0;
    this._dates = [];
    this._fill = scaleOrdinal(schemeCategory20c);
    this.tip = null;


    this.showCivilComplaintOnly = false;
    this.accumulatingDays = 0;

    this.initDate();
  }

  initDate() {
    this._dates = this.data.graph.list_event.sort();
  }

  setupGraph() {
    throw new TypeError('Unimplemented function');
  }

  updateGraph() {
    throw new TypeError('Unimplemented function');
  }

  setupToolTip() {
    throw new TypeError('Unimplemented function');
  }

  get currentDate() {
    return this._dates[this._timelineIndex];
  }

  set timelineIndex(index) {
    if (!(index >= 0 && index < this._dates.length)) {
      throw 'Index not valid';
    }
    this._timelineIndex = index;
    this.updateGraph();
  }

  setCurrentDate(date) {
    this.timelineIndex = _.findLastIndex(this._dates, function (d) {
      return (d <= date);
    });
  }
}
