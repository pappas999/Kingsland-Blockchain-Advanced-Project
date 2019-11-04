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
	}
}