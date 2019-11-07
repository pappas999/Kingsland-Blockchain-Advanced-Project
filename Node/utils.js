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
	}
	
	/* [
xah_obj_to_map(obj) convert obj to map datatype.
Return a map instance. The variable obj is not changed.
Only keys converted are: own property, enumerable, string keys.
Version 2018-02-02
] 
 xah_obj_to_map = ( obj => {
    const mp = new Map;
    Object.keys ( obj ). forEach (k => { mp.set(k, obj[k]) });
    return mp;
}),

 xah_map_to_obj = ( aMap => {
    const obj = {};
    aMap.forEach ((v,k) => { obj[k] = v });
    return obj;
})*/
}