/* global data */
/* exported google */

import SocialGraph from './models/social_graph';
import GeoGraph from './models/geo_graph';
import GoogleMapsLoader from 'google-maps';
import { googleKey } from './models/geo_graph.conf';
import { select, selectAll } from 'd3-selection';


import ScrollMagic from 'scrollmagic/scrollmagic/uncompressed/ScrollMagic';
import 'scrollmagic/scrollmagic/uncompressed/plugins/animation.gsap';
import 'scrollmagic/scrollmagic/uncompressed/plugins/debug.addIndicators';
// import TweenMax from 'gsap/src/uncompressed/TweenMax';
// import TimelineMax from 'gsap/src/uncompressed/TimelineMax';


var google; // eslint-disable-line no-unused-vars
// init controller
const controller = new ScrollMagic.Controller();
var scenes = [];

if (typeof data !== 'undefined') {

  window._socialGraph = new SocialGraph(data, 'chart');

  GoogleMapsLoader.KEY = googleKey;
  GoogleMapsLoader.load((gg) => {
    google = gg;
    window._geoGraph = new GeoGraph(data, 'geo-chart');

    // BUILD SCENES
    // let cardItemHeights = selectAll('.card').nodes().map(function (d) {
    //   return d.clientHeight; // no margin
    // });

    for (let i = 0; i < data.numScene; i++) {
      let scene = new ScrollMagic.Scene({
        triggerElement: '#trigger-' + (i + 1),
        offset: 0,
      })
      // .setTween('#scene-10', 0.5, { scale: 2.5 }) // trigger a TweenMax.to tween
      // .setPin('#scene-' + (i + 1), {pushFollowers: false})
        .addIndicators({ name: `${i + 1} (duration: 150)` }) // add indicators (requires plugin)
        .on('enter', function (event) {
          const idx = parseInt(event.target.triggerElement().id.split('-')[1]) - 1;
          eventTimelineCallback(idx);
        })
        .on('leave', function (event) {
          const idx = parseInt(event.target.triggerElement().id.split('-')[1]) - 2;
          eventTimelineCallback(idx);
        })
        .addTo(controller);
      scenes.push(scene);
    }
  });


  selectAll('.officerName')
    .on('mouseover', function () {
      const officerId = this.getAttributeNode('officerId').value;
      window._socialGraph.setHighlightNode(officerId);
    })
    .on('mouseout', function () {
      const officerId = this.getAttributeNode('officerId').value;
      window._socialGraph.setHighlightNode(officerId, false); // unset highlight
    });

  selectAll('.complaintId')
    .on('mouseover', function () {
      const complaintId = this.getAttributeNode('complaintId').value;
      window._geoGraph.setHighlightNode(complaintId);
    })
    .on('mouseout', function () {
      const complaintId = this.getAttributeNode('complaintId').value;
      window._geoGraph.setHighlightNode(complaintId, false); // unset highlight
    });
}


function eventTimelineCallback(idx) {
  let currentElement = select('#scene-' + (idx + 1)).node();
  selectAll('.card').attr('style', '').classed('active', false);

  if (!currentElement || typeof data === 'undefined') {
    return;
  }

  // 0. Set highlight
  currentElement.className += ' active';
  currentElement.style.height = (currentElement.scrollHeight + 5) + 'px';

  const currentEventData = data.timelineData[idx];

  // 1. highlight if officer nodes
  window._socialGraph.unsetHighlightNodes();
  if (currentEventData['UID']) {
    const uids = currentEventData['UID'].split('; ');
    window._socialGraph.setHighlightNodes(uids);
  }

  window._socialGraph.setCurrentDate(currentEventData['Date']);

  // 2. highlight complaint nodes
  const nextEventDate = ((idx + 1) < data.timelineData.length) ?
    data.timelineData[idx + 1]['Date'] : null;
  window._geoGraph.setActivePeriod(currentEventData['Date'], nextEventDate);
}

function scrollToScene(idx, target) {
  if (target.className.indexOf(' active') === -1) {
    const offsetX = select('#trigger-' + idx).node().offsetTop;
    controller.scrollTo(offsetX - Math.ceil(window.innerHeight / 2.0) + 20);
  }
}

window.scrollToScene = scrollToScene;
