import { _decorator } from 'cc';
const Random = {
	getSeed: function () {
		return this._seed;
	},
	setSeed: function (seed) {
		seed = (seed < 1 ? 1 / seed : seed);
		this._seed = seed;
		this._s0 = (seed >>> 0) * this._frac;
		seed = (seed * 69069 + 1) >>> 0;
		this._s1 = seed * this._frac;
		seed = (seed * 69069 + 1) >>> 0;
		this._s2 = seed * this._frac;
		this._c = 1;
		return this;
	},
	getUniform: function () {
		var t = 2091639 * this._s0 + this._c * this._frac;
		this._s0 = this._s1;
		this._s1 = this._s2;
		this._c = t | 0;
		this._s2 = t - this._c;
		return this._s2;
	},
	getUniformInt: function (lowerBound, upperBound) {
		var max = Math.max(lowerBound, upperBound);
		var min = Math.min(lowerBound, upperBound);
		return Math.floor(this.getUniform() * (max - min + 1)) + min;
	},
	getNormal: function (mean, stddev) {
		do {
			var u = 2 * this.getUniform() - 1;
			var v = 2 * this.getUniform() - 1;
			var r = u * u + v * v;
		} while (r > 1 || r == 0);
		var gauss = u * Math.sqrt(-2 * Math.log(r) / r);
		return (mean || 0) + gauss * (stddev || 1);
	},
	getPercentage: function () {
		return 1 + Math.floor(this.getUniform() * 100);
	},
	getWeightedValue: function (data) {
		var total = 0;
		for (var id in data) {
			total += data[id];
		}
		var random = this.getUniform() * total;
		var part = 0;
		for (var id in data) {
			part += data[id];
			if (random < part) { return id; }
		}
		return id;
	},
	getState: function () {
		return [this._s0, this._s1, this._s2, this._c];
	},
	setState: function (state) {
		this._s0 = state[0];
		this._s1 = state[1];
		this._s2 = state[2];
		this._c = state[3];
		return this;
	},
	clone: function () {
		var clone = Object.create(this);
		clone.setState(this.getState());
		return clone;
	},
	_s0: 0,
	_s1: 0,
	_s2: 0,
	_c: 0,
	_frac: 2.3283064365386963e-10
};
const PI =  Math.PI
const trigfill = function () {
	var pi = PI, tau = pi * 2, hpi = pi / 2, qpi = pi / 4
		, spi = pi / 6, epi = pi / 8, sq3 = 1.7320508075688772
	function version() { return "0.9.5" }
	function modp(a, b) {
		return a - Math.floor(a / b) * b
	}
	function modn(a, b) {
		return a - Math.floor(a / b + 0.5) * b
	}
	function cos(x) {
		x = x - Math.floor(x / tau) * tau
		if (x > pi) x = tau - x
		if (x >= hpi) { var pol = -1; x = pi - x } else { pol = 1 }
		if (x > qpi) return pol * sintay(hpi - x)
		return pol * costay(x)
	}
	function sin(x) {
		x=x-Math.floor(x/tau)*tau
		if(x>pi){ var pol=-1; x-=pi }else{ pol=1 }
		if(x>=hpi) x=pi-x 
		if(x>qpi) return pol*costay(hpi-x) 
		return pol*sintay(x) 
	}
	var f24 = 100000 / 2399999, f720 = 100000 / 71998376, f40k = 1000 / 40578583
	function costay(x) {
		var x2 = x * x, x4 = x2 * x2
		return 1 - x2 * 0.5 + x4 * f24 - x4 * x2 * f720 + x4 * x4 * f40k
	}
	var fh6 = 100000000 / 600000005, f120 = 1 / 120, f5k = 1000 / 5039680, f362k = 10 / 3628880
	function sintay(x) {
		var x3 = x * x * x, x6 = x3 * x3
		return x - x3 * fh6 + x3 * x * x * f120 - x6 * x * f5k + x6 * x3 * f362k
	}
	var ff3 = 100000000000 / 299999999177
		, ff5 = 10000000 / 50000082
		, ff7 = 100000 / 700011, ff9 = 10000 / 90019, ff11 = 1000 / 11768
	function atan(x) {
		var pos = 1, mut = false, mut2 = false
		if (x < 0) { pos = -1, x = -x }
		if (x > 1) { x = 1 / x, mut = true }
		if (x > 0.26794919) {
			x = (sq3 * x - 1) / (sq3 + x)
			mut2 = true
		}
		var x2 = x * x, x4 = x2 * x2, x9 = x4 * x4 * x
		x = x - x * x2 * ff3 + x4 * x * ff5 - x4 * x2 * x * ff7 + x9 * ff9 - x9 * x2 * ff11
		if (mut2) x += spi
		if (mut) x = hpi - x
		return x * pos
	}
	function atan2(y, x) {
		if (x === 0) {
			if (y === 0) return 0
			if (y < 0) return -hpi; else return hpi
		}
		var r = atan(y / x)
		if (x > 0) return r
		if (y < 0) r -= pi; else r += pi
		return r - Math.floor(r / tau + 0.5) * tau
	}
	var fg3 = 1000000000 / 2999999887, f15 = 200000000 / 1500000678
		, f315 = 170000 / 3150457, f2k = 6200 / 282874, f155k = 1382 / 146286
	function tan(x) {
		var pos = 1, mut = false, mut2 = false
		x = modp(x, pi) * 0.99999999999999993
		if (x > hpi) x = pi - x, pos = -1
		if (x > qpi) x = hpi - x, mut = true
		if (x > epi) x = x * 0.5, mut2 = true
		var x2 = x * x, x4 = x2 * x2, x9 = x4 * x4 * x
		x = x + x * x2 * fg3 + x4 * x * f15 + x4 * x2 * x * f315 + x9 * f2k + x9 * x2 * f155k
		if (mut2) x = 2 * x / (1 - x * x)
		if (mut) x = 1 / x
		return x * pos
	}
	function acos(x) {
		if (x == -1) return PI
		return modp(atan(Math.sqrt(1 - x * x) / x), PI)
	}
	function asin(x) { return atan(x / Math.sqrt(1 - x * x)) }
	function setmaths() {
		Math.sin = sin, Math.cos = cos, Math.tan = tan
		, Math.acos = acos, Math.asin = asin, Math.atan = atan, Math.atan2 = atan2
	}
	return {
		sin: sin, cos: cos, tan: tan
		, acos: acos, asin: asin, atan: atan, atan2: atan2
		, modp: modp, modn: modn
		, setmaths: setmaths
		, version: version
	}
}
const Trigfill = trigfill()
Trigfill.setmaths()
export {
	Random,
	Trigfill
} 
