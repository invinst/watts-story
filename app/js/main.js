/* global data */
/* exported google */

import SocialGraph from './models/social_graph';
import GeoGraph from './models/geo_graph';
import GoogleMapsLoader from 'google-maps';
import { googleKey } from './models/geo_graph.conf';

var google; // eslint-disable-line no-unused-vars

if (typeof data !== 'undefined') {
  GoogleMapsLoader.KEY = googleKey;
  GoogleMapsLoader.load((gg) => {
    google = gg;
    window._geoGraph = new GeoGraph(data, 'geo-chart');
  });

  window._socialGraph = new SocialGraph(data, 'chart');
}
