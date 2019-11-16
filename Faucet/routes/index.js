var express = require('express');
var router = express.Router();
var svgCaptcha = require('svg-captcha');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Faucet Application' });
});


/* GET home page. */
// router.post('/', function(req, res, next) {
//   res.render('index', { title: 'Faucet Application' });
// });

router.get('/captcha', function (req, res) {
  var captcha = svgCaptcha.create();
  req.session.captcha = captcha.text;
  
  res.type('svg');
  res.status(200).send(captcha.data);
});

module.exports = router;
