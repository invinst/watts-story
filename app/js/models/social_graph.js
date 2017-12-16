import _ from 'lodash';
// import * as d3 from 'd3';
import { select } from 'd3-selection';
import * as d3Force from 'd3-force';
import d3tip from 'd3-tip';
import moment from 'moment';
import Graph from './graph';


export default class SocialGraph extends Graph {
  constructor(data, elementId) {
    super(data, elementId);

    this.maxWeight = 0;
    this.maxNodeInCommunities = {};
    this.toggleNode = 0; // this use for double click and highlight current node
    this.linkedByIndex = {};

    this.thresholdValue = 1;

    this.setupGraph();
    this.setupToolTip();
    this.timelineIndex = 10;
  }

  setupGraph() {
    // this.graph = d3.layout.force()
    //   .size([this.width, this.height])
    //   .nodes(this.data.nodes) // initialize with default data (no filter)
    //   .charge(-60)
    //   .friction(0.5)
    //   .links(this.data.links)
    //   .on('tick', () => this.tick());

    this.graph = d3Force.forceSimulation()
      .force('charge', d3Force.forceManyBody().strength(-700).distanceMin(100).distanceMax(1000))
      .force('collide', d3Force.forceCollide(function (d) {
        return d.r + 8;
      }).iterations(16))
      .force('center', d3Force.forceCenter(this.width / 2, this.height / 2))
      .force('y', d3Force.forceY(0.001))
      .force('x', d3Force.forceX(0.001))
      .nodes(this.data.nodes)
      .force('link', d3Force.forceLink(this.data.links))
      .on('tick', () => this.tick());

    this.svg = select(`#${this._elementId}`).append('svg:svg')
      .attr('width', '100%')
      .attr('height', this.height)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`);
    this.node = this.svg.selectAll('.node');
    this.link = this.svg.selectAll('.link');
  }

  setupToolTip() {
    this.tip = d3tip()
      .attr('class', 'd3-tip')
      .offset([-5, 0])
      .html((d) => {
        // TODO: use template
        return `<span> ${d.full_name} (${d.uid}) </span>`;
      });
    this.svg.call(this.tip);
  }

  updateGraph() {
    let [newNodes, newLinks] = this.recalculateNodeLinks();

    this.updateNodes(newNodes);
    this.updateLinks(newLinks);

    this.toggleNode = 0; // toggle/hide other nodes

    // Update and restart the simulation.
    this.graph.nodes(newNodes);
    this.graph.force('link').links(newLinks);
    this.graph.alpha(1).restart();
  }

  updateLinks(newLinks) {
    this.graph.force('link').links(newLinks);
    // .linkStrength((d) => {
    //   return ((d.weight + 1) / (this.maxWeight + 1));
    // });
    this.link = this.link.data(newLinks);
    this.link.exit().remove();
    this.link = this.link.enter().insert('line', '.node')
      .attr('class', 'link')
      .merge(this.link)
      .attr('stroke-width', function (d) {
        return Math.ceil(Math.sqrt(d.weight));
      })
      .classed('highlight', (d) => {
        return d.highlight;
      });
  }

  updateNodes(newNodes) {
    this.node = this.node.data(newNodes);

    this.node.exit().remove();

    this.node = this.node.enter().insert('circle', '.cursor')
      .attr('class', 'node')
      // .call(this.graph.drag)
      .on('mouseover', this.tip.show)
      .on('mouseout', this.tip.hide)
      .merge(this.node) // UPDATE start here (new in v4)
      .attr('r', function (d) {
        return (d.degree / 2 + 2);
      })
      .attr('fill', (d) => {
        return this._fill(d.group);
      });
  }

  tick() {
    const radius = 10;
    this.node.attr('cx', (d) => {
      return d.x = Math.max(radius, Math.min(this.width - radius, d.x));
    }).attr('cy', (d) => {
      return d.y = Math.max(radius, Math.min(this.height - radius, d.y));
    });

    this.link.attr('x1', function (d) {
      return d.source.x;
    }).attr('y1', function (d) {
      return d.source.y;
    }).attr('x2', function (d) {
      return d.target.x;
    }).attr('y2', function (d) {
      return d.target.y;
    });

  }

  _cleanNeighbor() {
    this.linkedByIndex = {};
  }

  saveNeighbor(node1, node2) {
    this.linkedByIndex[node1.id + ',' + node2.id] = true;
    this.linkedByIndex[node2.id + ',' + node1.id] = true;
  }

  isNeighboring(node1, node2) {
    if (node1.id === node2.id)
      return true;
    else
      return this.linkedByIndex[node1.id + ',' + node2.id];
  }

  getCurrentGroup(node) {
    if (this.currentDate)
      return this.data.graph.community_by_date[this.currentDate][node.uid];
    else
      return 0;
  }

  recalculateNodeLinks() {
    this.maxWeight = 0;
    this.maxNodeInCommunities = {};
    this._cleanNeighbor();

    let links = this._recalculateLinks();
    let nodes = this._recalculateNodes(links);
    this._updateMaxNodesInCommunutyWithLinks(nodes, links);
    return [nodes, links];
  }

  _recalculateLinks() {
    /*
    select links which has complaints before the current date
    update link weight
    mark highlight
     */
    if (!this.currentDate)
      return [];

    else {
      return _.reduce(this.data.links, (acc, link) => {
        const complaints = this.filterValidComplaint(link['complaints']);
        if (complaints.length < this.thresholdValue) {
          return acc;
        }
        else {
          if (this.maxWeight < complaints.length) {
            this.maxWeight = complaints.length;
          }

          const highlight = _.some(complaints, { 'complaint_date': this.currentDate });
          acc.push({
            'weight': complaints.length,
            'source': link.source,
            'target': link.target,
            'highlight': highlight
          });
          return acc;
        }
      }, []);
    }

  }

  _recalculateNodes(links) {
    /*
    update nodes degree and group, neighbors
     */
    let nodes = this.data.nodes;
    nodes.forEach((n) => {
      n.degree = 0;
      n.group = this.getCurrentGroup(n);
    });

    links.forEach((link) => {
      this.saveNeighbor(link.source, link.target);
      // recalculate degree of node
      nodes[link.source.id].degree += 1;
      nodes[link.target.id].degree += 1;
    });
    return nodes;
  }

  _updateMaxNodesInCommunutyWithLinks(nodes, links) {
    links.forEach((link) => {
      this._updateMaxNodesInCommunuty(nodes[link.source.id]);
      this._updateMaxNodesInCommunuty(nodes[link.target.id]);
    });
  }

  _updateMaxNodesInCommunuty(node) {
    if (node.degree)
      return;
    if (!(node.group in this.maxNodeInCommunities) ||
      (this.maxNodeInCommunities[node.group].degree < node.degree)) {
      this.maxNodeInCommunities[node.group] = node;
    }
  }

  filterValidComplaint(complaints) {
    const _currentDate = moment(this.currentDate);
    return _.filter(complaints, (c) => {
      return (moment(c['complaint_date']) <= _currentDate) &&
        (!this.showCivilComplaintOnly || !c['by_officer']) &&
        (this.accumulatingDays === 0 ||
          _currentDate.diff(moment(c['complaint_date']), 'days') <= this.accumulatingDays);
    });
  }
}
