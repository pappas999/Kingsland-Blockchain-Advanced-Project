var express = require('express');
var router = express.Router();
var svgCaptcha = require('svg-captcha');



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
      title: 'Faucet Application',
      data: {},
      errors: {}
  });
});


router.post('/', function(req, res, next) {
  var blockchainAddress = req.body.blockchainAddress;
  var nodeUrl = req.body.nodeUrl;
  var captchaInput = req.body.captchaInput;
  var errs = {};

  console.log(blockchainAddress);
  console.log(nodeUrl);
  console.log(captchaInput);
  console.log(req.session.captcha);

  if (!blockchainAddress || !nodeUrl || !captchaInput) {
    
    if(!blockchainAddress) {
      errs.blockchainAddress = {msg: 'Blockchain Address is required'};
    }
    if(!nodeUrl) {
      errs.nodeUrl = {msg: 'Node URL is required'};
    }
    if(!captchaInput) {
      errs.captchaInput = {msg: 'Captcha is required'};
    }

    res.render('index', {
      title: 'Faucet Application',
      data: req.body,
      errors: errs
    })
  }
  // At this point we are sure that the fields has all the data
  // we now validate the data;

  // validate address
  var re = /[0-9A-Fa-f]{6}/g;
  if(!re.test(blockchainAddress) || blockchainAddress.length != 20) {
      errs.blockchainAddress = {msg : "Blockchain Address is invalid!"};
      res.render('index', {
        title: 'Faucet Application',
        data: req.body,
        errors: errs
      });
  }

  // validate captcha
  if(captchaInput !== req.session.captcha) {
    errs.captchaInput = {msg: 'Invalid captcha input'};
    res.render('index', {
      title: 'Faucet Application',
      data: req.body,
      errors: errs
    });
  }

  req.flash('success', 'Got coins from the faucet!');
  res.redirect('/');
});

router.get('/captcha', function (req, res) {
  var captcha = svgCaptcha.create();
  req.session.captcha = captcha.text;
  req.session.save();
  
  res.type('svg');
  res.status(200).send(captcha.data);
});

module.exports = router;
