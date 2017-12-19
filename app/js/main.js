/* global data */
/* exported google */

import SocialGraph from './models/social_graph';
import GeoGraph from './models/geo_graph';
import GoogleMapsLoader from 'google-maps';
import { googleKey } from './models/geo_graph.conf';
import { selectAll } from 'd3-selection';


import ScrollMagic from 'scrollmagic/scrollmagic/uncompressed/ScrollMagic';
import 'scrollmagic/scrollmagic/uncompressed/plugins/animation.gsap';
import 'scrollmagic/scrollmagic/uncompressed/plugins/debug.addIndicators';
// import TweenMax from 'gsap/src/uncompressed/TweenMax';
// import TimelineMax from 'gsap/src/uncompressed/TimelineMax';


var google; // eslint-disable-line no-unused-vars

if (typeof data !== 'undefined') {
  GoogleMapsLoader.KEY = googleKey;
  GoogleMapsLoader.load((gg) => {
    google = gg;
    window._geoGraph = new GeoGraph(data, 'geo-chart');
  });

  let cardItemHeights = selectAll('.card').nodes().map(function (d) {
    return d.clientHeight; // no margin
  });

  window._socialGraph = new SocialGraph(data, 'chart');

  // init controller
  const controller = new ScrollMagic.Controller();

  // build scene

  for (let i = 0; i < data.numScene; i++) {
    new ScrollMagic.Scene({
      triggerElement: '#trigger-' + (i + 1),
      duration: cardItemHeights[i],
      offset: 0,
    })
    // .setTween('#scene-10', 0.5, { scale: 2.5 }) // trigger a TweenMax.to tween
      .setClassToggle('#scene-' + (i + 1), 'active')
      .addIndicators({ name: `${i + 1} (duration: 150)` }) // add indicators (requires plugin)
      .on('enter', function (event) {
        const idx = parseInt(event.target.triggerElement().id.split('-')[1]) - 1;

        // 1. highlight if officer nodes
        if (data.timelineData[idx]['UID']) {
          const uids = data.timelineData[idx]['UID'].split('; ');
          window._socialGraph.setHighlightNodes(uids);
        }

        window._socialGraph.setCurrentDate(data.timelineData[idx]['Date']);

        // TODO: 2. highlight complaint nodes
      })
      .on('leave', function (event) {
        window._socialGraph.unsetHighlightNodes();
      })
      .addTo(controller);
  }

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
