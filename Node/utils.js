var cryptoJS = require("crypto-js");
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');


module.exports = {
	//Functions to convert Map -> Json and vice versa, taken from 
	// https://2ality.com/2015/08/es6-map-json.html
	strMapToObj(strMap) {
		let obj = Object.create(null);
		for (let [k,v] of strMap) {
			// We don’t escape the key '__proto__'
			// which can cause problems on older engines
			obj[k] = v;
		}
		return obj;
	},

	objToStrMap(obj) {
		let strMap = new Map();
		for (let k of Object.keys(obj)) {
			strMap.set(k, obj[k]);
		}
		return strMap;
	},
	
	validURL(str) {
		const regex = '^((https?:\/\/))(?:([a-zA-Z]+)|(\d+\.\d+.\d+.\d+)):[0-9][0-9][0-9][0-9]$';
		const url = new RegExp(regex);
		return url.test(str);
	},

	hexStringToByte(str) {
		if (!str) {
		  return new Uint8Array();
		}
		
		var a = [];
		for (var i = 0, len = str.length; i < len; i+=2) {
		  a.push(parseInt(str.substr(i,2),16));
		}
		
		return new Uint8Array(a);
	},
	
	byteToHexString(byteArray) {
		return Array.prototype.map.call(byteArray, function(byte) {
			return ('0' + (byte & 0xFF).toString(16)).slice(-2);
		}).join('');
	},
	
	verifySignature(data, pubKeyCompressed, signature) {
		
		/*console.log('in verify signature');
		console.log('pubKeyCompressed: ' + pubKeyCompressed);
		console.log('data: ' + data);
		console.log('signature: ' + signature);*/
		
		let pubKeyX = pubKeyCompressed.substring(0, 64);
		let pubKeyOdd = parseInt(pubKeyCompressed.substring(64));
		let pubKeyPoint = secp256k1.curve.pointFromX(pubKeyX, pubKeyOdd);

		let keyPair = secp256k1.keyPair({pub : pubKeyPoint});
		let result = keyPair.verify(data, {r: signature[0], s : signature[1]});
	
		return result;
	},
	
	//helper function used to validate if an address exists. Must validate format only.
	validateAddress(address) {

		var re = /[0-9A-Fa-f]{6}/g;
		if(!re.test(address) || address.length != 40) {
			return 0;
		}

		return 1;
	}
}