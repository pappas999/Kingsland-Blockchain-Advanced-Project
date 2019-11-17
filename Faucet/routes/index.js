var express = require('express');
var router = express.Router();
var svgCaptcha = require('svg-captcha');
var FaucetTransaction = require("../libs/faucet-transaction");


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
      title: 'Faucet Application',
      data: {},
      errors: {}
  });
});

/* POST request to home page */
router.post('/', function(req, res, next) {
  var blockchainAddress = req.body.blockchainAddress;
  var nodeUrl = req.body.nodeUrl;
  var captchaInput = req.body.captchaInput;
  var errs = {};

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
  if(!re.test(blockchainAddress) || blockchainAddress.length != 40) {
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

  var txn = new FaucetTransaction(blockchainAddress);
  txn.calculateTransactionHash();
  txn.sign();
  var val = txn.getTxnValue();

  txn.send(nodeUrl, function (response) {
    if(response.status === 1) {
      req.flash('success', "Transferred " + val + " coins with transaction " + response.msg.transactionDataHash) ;
    } else {
      req.flash('error', 'failed to get coins :(');
    }
    res.render('index', { 
      title: 'Faucet Application',
      data: {},
      errors: {}
    });
  });
});

router.get('/captcha', function (req, res) {
  var captcha = svgCaptcha.create();
  req.session.captcha = captcha.text;
  req.session.save();
  
  res.type('svg');
  res.status(200).send(captcha.data);
});

module.exports = router;
