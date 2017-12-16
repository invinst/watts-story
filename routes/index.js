let express = require('express');

let fs = require("fs");

let router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    fs.readFile("data/officer_graph_by_jamie.json", 'utf8', function (err, text) {
        if (err) throw err;
        const jsonObject = JSON.parse(text);
        const strJson = JSON.stringify(jsonObject, null, 0);

        res.render('social_graph', {
            title: 'Officer unit 715',
            data: strJson
        });
    });
});


module.exports = router;
