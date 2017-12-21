let express = require('express');

let fs = require('fs');
let d3 = require('d3');
let _ = require('lodash');

let router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  render_watts_story(res, 'story');
});

router.get('/collapse', function (req, res, next) {
  render_watts_story(res, 'story_collapse');
});

function render_watts_story(res, target){
  fs.readFile('data/officer_graph_by_jamie.json', 'utf8', function (err, text) {
    if (err) throw err;

    const jsonObject = JSON.parse(text);
    fs.readFile('data/Watts_data_story.tsv', 'utf8', function (err, text) {
      let tsvData = d3.tsvParse(text);
      let timelineData = tsvData.map(function (d) {
        return _.pick(d, ['Date', 'cr_id', 'UID', 'content', 'complaint_date',
          'incident_date', 'complaint_category', 'lng', 'lat']);
      });

      const strJson = JSON.stringify(
        Object.assign({},
          jsonObject,
          {
            timelineData: timelineData,
            numScene: tsvData.length
          }),
        null, 0
      );
      res.render(target, {
        title: 'Officer unit 715',
        data: strJson,
        timelineData: tsvData
      });
    });
  });
}


module.exports = router;
