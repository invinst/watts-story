/* global google */

import _ from 'lodash';
import * as d3 from 'd3';
import moment from 'moment';
import d3tip from 'd3-tip';
import Graph from './graph';
import { customGoogleMapStyle, zoomLevel, mapCenter } from './geo_graph.conf';

export default class GeoGraph extends Graph {
  constructor(data, elementId) {
    super(data, elementId);

    this.force = null;
    this.gmap = null;
    this.setupGraph();
    this.setupToolTip();

    this.timelineIndex = this._dates.length - 1;
  }

  setupGraph() {
    this.initGeographyMap();
    this.initComplaintNetwork();
  }

  updateGraph() {
    this.updateComplaintGraph();
  }

  setupToolTip() {
    this.tip = d3tip()
      .attr('class', 'd3-tip')
      .offset([-5, 0])
      .html((d) => {
        return '<p> CRID: ' + d.cr_id + '</p>' +
          '<p> Complaint Date: ' + d.complaint_date + '</p>';
      });
  }

  initGeographyMap() {
    this.gmap = new google.maps.Map(d3.select('#geo-chart').node(), {
      zoom: zoomLevel,
      center: new google.maps.LatLng(mapCenter['lat'], mapCenter['lng']),
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      streetViewControl: false,
      styles: customGoogleMapStyle
    });
  }

  initComplaintNetwork() {
    this.overlay = new google.maps.OverlayView();
    // Add the container when the overlay is added to the map.
    this.overlay.onAdd = () => {
      const layer = d3.select(this.overlay.getPanes().overlayMouseTarget).append('div')
        .attr('class', 'complaints');

      // Draw all markers as single SVG only.
      this.overlay.draw = () => {
        const w = 4000,
          h = 4000;

        d3.selectAll('#gvis').remove();
        this.svg = layer.append('svg')
          .attr('id', 'gvis')
          .attr('width', w)
          .attr('height', h)
          .call(this.tip);
        this.updateComplaintGraph();
      };
    };

    // Bind our overlay to the map…
    this.overlay.setMap(this.gmap);
  }

  updateComplaintGraph() {
    const complaints = this.recalculateValidComplaints();

    d3.selectAll('.gnode').remove();

    if (typeof this.svg === 'undefined')
      return;

    this.node = this.svg.selectAll('.complaints').data(complaints);

    this.node.exit().remove();

    this.node.enter()
      .append('g')
      .attr('transform', (d) => this._transform(d))
      .attr('class', 'gnode')
      .merge(this.node)
      .append('circle')
      .attr('r', 4)
      .attr('fill', (d) => {
        if (d['complaint_date'] === this.currentDate)
          return '#A00';
        else
          return '#0AA';
      })
      .attr('class', 'marker')
      .attr('cursor', 'pointer')
      .on('mouseover', this.tip.show)
      .on('mouseout', this.tip.hide);
  }

  _transform(d) {
    const padding = 0;
    let p = new google.maps.LatLng(d.lat, d.lng);
    p = this.overlay.getProjection().fromLatLngToDivPixel(p);
    p.x = p.x - padding;
    p.y = p.y - padding;
    return 'translate(' + p.x + ',' + p.y + ')';
  }

  recalculateValidComplaints() {
    const _complaints = this.data.gnodes;
    const _currentDate = moment(this.currentDate);
    const _unsortedComplaints = _.filter(_complaints, (c) => {
      return (moment(c['complaint_date']) <= _currentDate) &&
        (!this.showCivilComplaintOnly || !c['by_officer']) &&
        (this.accumulatingDays === 0 ||
          _currentDate.diff(moment(c['complaint_date']), 'days') <= this.accumulatingDays);
    });
    return _.sortBy(_unsortedComplaints, 'complaint_date');
  }
}
