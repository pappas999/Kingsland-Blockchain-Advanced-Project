var express = require('express');
var router = express.Router();
var svgCaptcha = require('svg-captcha');
var FaucetTransaction = require("../libs/faucet-transaction");
var cache = require('memory-cache');

const ONE_HOUR_TO_MS = 60 * 60 * 1000;


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
  let blockchainAddress = req.body.blockchainAddress;
  let nodeUrl = req.body.nodeUrl;
  let captchaInput = req.body.captchaInput;
  let errs = {};
  let e_flag = 0;

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

    e_flag = 1;
  }
  // At this point we are sure that the fields has all the data
  // we now validate the data;

  // validate address
  let re = /[0-9A-Fa-f]{6}/g;
  if(!re.test(blockchainAddress) || blockchainAddress.length != 40) {
    e_flag = 1;
      errs.blockchainAddress = {msg : "Blockchain Address is invalid!"};
  }

  // validate captcha
  if(captchaInput !== req.session.captcha) {
    errs.captchaInput = {msg: 'Invalid captcha input'};
    e_flag = 1;
  }

  // now we verify if the address is spamming us or not
  if(e_flag === 0) {
      let c = cache.get(blockchainAddress);
      if (c) {
        req.flash('error', "Don't be greedy. You've got coins! Please try again later");
        res.render('index', { 
          title: 'Faucet Application',
          data: {},
          errors: {}
        });
      } else {

        let txn = new FaucetTransaction(blockchainAddress);
        txn.calculateTransactionHash();
        txn.sign();
        let val = txn.getTxnValue();

          txn.send(nodeUrl, function (response) {
            if(response.status === 1) {
              req.flash('success', "Transferred " + val + " coins with transaction " + response.msg.transactionDataHash);
              cache.put(blockchainAddress, 1, ONE_HOUR_TO_MS);
            } else {
              req.flash('error', 'failed to get coins :(');
            }
            res.render('index', { 
              title: 'Faucet Application',
              data: {},
              errors: {}
            });
          });
      }
  } else {
    res.render('index', {
      title: 'Faucet Application',
      data: req.body,
      errors: errs
    });
  }
});

router.get('/captcha', function (req, res) {
  var captcha = svgCaptcha.create();
  req.session.captcha = captcha.text;
  req.session.save();
  
  res.type('svg');
  res.status(200).send(captcha.data);
});

module.exports = router;
