(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["amps"] = factory();
	else
		root["amps"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 632:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);
var bigInt = (function (undefined) {
    "use strict";

    var BASE = 1e7,
        LOG_BASE = 7,
        MAX_INT = 9007199254740992,
        MAX_INT_ARR = smallToArray(MAX_INT),
        LOG_MAX_INT = Math.log(MAX_INT);

    function Integer(v, radix) {
        if (typeof v === "undefined") return Integer[0];
        if (typeof radix !== "undefined") return +radix === 10 ? parseValue(v) : parseBase(v, radix);
        return parseValue(v);
    }

    function BigInteger(value, sign) {
        this.value = value;
        this.sign = sign;
        this.isSmall = false;
    }
    BigInteger.prototype = Object.create(Integer.prototype);

    function SmallInteger(value) {
        this.value = value;
        this.sign = value < 0;
        this.isSmall = true;
    }
    SmallInteger.prototype = Object.create(Integer.prototype);

    function isPrecise(n) {
        return -MAX_INT < n && n < MAX_INT;
    }

    function smallToArray(n) { // For performance reasons doesn't reference BASE, need to change this function if BASE changes
        if (n < 1e7)
            return [n];
        if (n < 1e14)
            return [n % 1e7, Math.floor(n / 1e7)];
        return [n % 1e7, Math.floor(n / 1e7) % 1e7, Math.floor(n / 1e14)];
    }

    function arrayToSmall(arr) { // If BASE changes this function may need to change
        trim(arr);
        var length = arr.length;
        if (length < 4 && compareAbs(arr, MAX_INT_ARR) < 0) {
            switch (length) {
                case 0: return 0;
                case 1: return arr[0];
                case 2: return arr[0] + arr[1] * BASE;
                default: return arr[0] + (arr[1] + arr[2] * BASE) * BASE;
            }
        }
        return arr;
    }

    function trim(v) {
        var i = v.length;
        while (v[--i] === 0);
        v.length = i + 1;
    }

    function createArray(length) { // function shamelessly stolen from Yaffle's library https://github.com/Yaffle/BigInteger
        var x = new Array(length);
        var i = -1;
        while (++i < length) {
            x[i] = 0;
        }
        return x;
    }

    function truncate(n) {
        if (n > 0) return Math.floor(n);
        return Math.ceil(n);
    }

    function add(a, b) { // assumes a and b are arrays with a.length >= b.length
        var l_a = a.length,
            l_b = b.length,
            r = new Array(l_a),
            carry = 0,
            base = BASE,
            sum, i;
        for (i = 0; i < l_b; i++) {
            sum = a[i] + b[i] + carry;
            carry = sum >= base ? 1 : 0;
            r[i] = sum - carry * base;
        }
        while (i < l_a) {
            sum = a[i] + carry;
            carry = sum === base ? 1 : 0;
            r[i++] = sum - carry * base;
        }
        if (carry > 0) r.push(carry);
        return r;
    }

    function addAny(a, b) {
        if (a.length >= b.length) return add(a, b);
        return add(b, a);
    }

    function addSmall(a, carry) { // assumes a is array, carry is number with 0 <= carry < MAX_INT
        var l = a.length,
            r = new Array(l),
            base = BASE,
            sum, i;
        for (i = 0; i < l; i++) {
            sum = a[i] - base + carry;
            carry = Math.floor(sum / base);
            r[i] = sum - carry * base;
            carry += 1;
        }
        while (carry > 0) {
            r[i++] = carry % base;
            carry = Math.floor(carry / base);
        }
        return r;
    }

    BigInteger.prototype.add = function (v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
            return this.subtract(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall) {
            return new BigInteger(addSmall(a, Math.abs(b)), this.sign);
        }
        return new BigInteger(addAny(a, b), this.sign);
    };
    BigInteger.prototype.plus = BigInteger.prototype.add;

    SmallInteger.prototype.add = function (v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
            return this.subtract(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
            if (isPrecise(a + b)) return new SmallInteger(a + b);
            b = smallToArray(Math.abs(b));
        }
        return new BigInteger(addSmall(b, Math.abs(a)), a < 0);
    };
    SmallInteger.prototype.plus = SmallInteger.prototype.add;

    function subtract(a, b) { // assumes a and b are arrays with a >= b
        var a_l = a.length,
            b_l = b.length,
            r = new Array(a_l),
            borrow = 0,
            base = BASE,
            i, difference;
        for (i = 0; i < b_l; i++) {
            difference = a[i] - borrow - b[i];
            if (difference < 0) {
                difference += base;
                borrow = 1;
            } else borrow = 0;
            r[i] = difference;
        }
        for (i = b_l; i < a_l; i++) {
            difference = a[i] - borrow;
            if (difference < 0) difference += base;
            else {
                r[i++] = difference;
                break;
            }
            r[i] = difference;
        }
        for (; i < a_l; i++) {
            r[i] = a[i];
        }
        trim(r);
        return r;
    }

    function subtractAny(a, b, sign) {
        var value;
        if (compareAbs(a, b) >= 0) {
            value = subtract(a,b);
        } else {
            value = subtract(b, a);
            sign = !sign;
        }
        value = arrayToSmall(value);
        if (typeof value === "number") {
            if (sign) value = -value;
            return new SmallInteger(value);
        }
        return new BigInteger(value, sign);
    }

    function subtractSmall(a, b, sign) { // assumes a is array, b is number with 0 <= b < MAX_INT
        var l = a.length,
            r = new Array(l),
            carry = -b,
            base = BASE,
            i, difference;
        for (i = 0; i < l; i++) {
            difference = a[i] + carry;
            carry = Math.floor(difference / base);
            difference %= base;
            r[i] = difference < 0 ? difference + base : difference;
        }
        r = arrayToSmall(r);
        if (typeof r === "number") {
            if (sign) r = -r;
            return new SmallInteger(r);
        } return new BigInteger(r, sign);
    }

    BigInteger.prototype.subtract = function (v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
            return this.add(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall)
            return subtractSmall(a, Math.abs(b), this.sign);
        return subtractAny(a, b, this.sign);
    };
    BigInteger.prototype.minus = BigInteger.prototype.subtract;

    SmallInteger.prototype.subtract = function (v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
            return this.add(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
            return new SmallInteger(a - b);
        }
        return subtractSmall(b, Math.abs(a), a >= 0);
    };
    SmallInteger.prototype.minus = SmallInteger.prototype.subtract;

    BigInteger.prototype.negate = function () {
        return new BigInteger(this.value, !this.sign);
    };
    SmallInteger.prototype.negate = function () {
        var sign = this.sign;
        var small = new SmallInteger(-this.value);
        small.sign = !sign;
        return small;
    };

    BigInteger.prototype.abs = function () {
        return new BigInteger(this.value, false);
    };
    SmallInteger.prototype.abs = function () {
        return new SmallInteger(Math.abs(this.value));
    };

    function multiplyLong(a, b) {
        var a_l = a.length,
            b_l = b.length,
            l = a_l + b_l,
            r = createArray(l),
            base = BASE,
            product, carry, i, a_i, b_j;
        for (i = 0; i < a_l; ++i) {
            a_i = a[i];
            for (var j = 0; j < b_l; ++j) {
                b_j = b[j];
                product = a_i * b_j + r[i + j];
                carry = Math.floor(product / base);
                r[i + j] = product - carry * base;
                r[i + j + 1] += carry;
            }
        }
        trim(r);
        return r;
    }

    function multiplySmall(a, b) { // assumes a is array, b is number with |b| < BASE
        var l = a.length,
            r = new Array(l),
            base = BASE,
            carry = 0,
            product, i;
        for (i = 0; i < l; i++) {
            product = a[i] * b + carry;
            carry = Math.floor(product / base);
            r[i] = product - carry * base;
        }
        while (carry > 0) {
            r[i++] = carry % base;
            carry = Math.floor(carry / base);
        }
        return r;
    }

    function shiftLeft(x, n) {
        var r = [];
        while (n-- > 0) r.push(0);
        return r.concat(x);
    }

    function multiplyKaratsuba(x, y) {
        var n = Math.max(x.length, y.length);

        if (n <= 30) return multiplyLong(x, y);
        n = Math.ceil(n / 2);

        var b = x.slice(n),
            a = x.slice(0, n),
            d = y.slice(n),
            c = y.slice(0, n);

        var ac = multiplyKaratsuba(a, c),
            bd = multiplyKaratsuba(b, d),
            abcd = multiplyKaratsuba(addAny(a, b), addAny(c, d));

        var product = addAny(addAny(ac, shiftLeft(subtract(subtract(abcd, ac), bd), n)), shiftLeft(bd, 2 * n));
        trim(product);
        return product;
    }

    // The following function is derived from a surface fit of a graph plotting the performance difference
    // between long multiplication and karatsuba multiplication versus the lengths of the two arrays.
    function useKaratsuba(l1, l2) {
        return -0.012 * l1 - 0.012 * l2 + 0.000015 * l1 * l2 > 0;
    }

    BigInteger.prototype.multiply = function (v) {
        var n = parseValue(v),
            a = this.value, b = n.value,
            sign = this.sign !== n.sign,
            abs;
        if (n.isSmall) {
            if (b === 0) return Integer[0];
            if (b === 1) return this;
            if (b === -1) return this.negate();
            abs = Math.abs(b);
            if (abs < BASE) {
                return new BigInteger(multiplySmall(a, abs), sign);
            }
            b = smallToArray(abs);
        }
        if (useKaratsuba(a.length, b.length)) // Karatsuba is only faster for certain array sizes
            return new BigInteger(multiplyKaratsuba(a, b), sign);
        return new BigInteger(multiplyLong(a, b), sign);
    };

    BigInteger.prototype.times = BigInteger.prototype.multiply;

    function multiplySmallAndArray(a, b, sign) { // a >= 0
        if (a < BASE) {
            return new BigInteger(multiplySmall(b, a), sign);
        }
        return new BigInteger(multiplyLong(b, smallToArray(a)), sign);
    }
    SmallInteger.prototype._multiplyBySmall = function (a) {
            if (isPrecise(a.value * this.value)) {
                return new SmallInteger(a.value * this.value);
            }
            return multiplySmallAndArray(Math.abs(a.value), smallToArray(Math.abs(this.value)), this.sign !== a.sign);
    };
    BigInteger.prototype._multiplyBySmall = function (a) {
            if (a.value === 0) return Integer[0];
            if (a.value === 1) return this;
            if (a.value === -1) return this.negate();
            return multiplySmallAndArray(Math.abs(a.value), this.value, this.sign !== a.sign);
    };
    SmallInteger.prototype.multiply = function (v) {
        return parseValue(v)._multiplyBySmall(this);
    };
    SmallInteger.prototype.times = SmallInteger.prototype.multiply;

    function square(a) {
        var l = a.length,
            r = createArray(l + l),
            base = BASE,
            product, carry, i, a_i, a_j;
        for (i = 0; i < l; i++) {
            a_i = a[i];
            for (var j = 0; j < l; j++) {
                a_j = a[j];
                product = a_i * a_j + r[i + j];
                carry = Math.floor(product / base);
                r[i + j] = product - carry * base;
                r[i + j + 1] += carry;
            }
        }
        trim(r);
        return r;
    }

    BigInteger.prototype.square = function () {
        return new BigInteger(square(this.value), false);
    };

    SmallInteger.prototype.square = function () {
        var value = this.value * this.value;
        if (isPrecise(value)) return new SmallInteger(value);
        return new BigInteger(square(smallToArray(Math.abs(this.value))), false);
    };

    function divMod1(a, b) { // Left over from previous version. Performs faster than divMod2 on smaller input sizes.
        var a_l = a.length,
            b_l = b.length,
            base = BASE,
            result = createArray(b.length),
            divisorMostSignificantDigit = b[b_l - 1],
            // normalization
            lambda = Math.ceil(base / (2 * divisorMostSignificantDigit)),
            remainder = multiplySmall(a, lambda),
            divisor = multiplySmall(b, lambda),
            quotientDigit, shift, carry, borrow, i, l, q;
        if (remainder.length <= a_l) remainder.push(0);
        divisor.push(0);
        divisorMostSignificantDigit = divisor[b_l - 1];
        for (shift = a_l - b_l; shift >= 0; shift--) {
            quotientDigit = base - 1;
            if (remainder[shift + b_l] !== divisorMostSignificantDigit) {
              quotientDigit = Math.floor((remainder[shift + b_l] * base + remainder[shift + b_l - 1]) / divisorMostSignificantDigit);
            }
            // quotientDigit <= base - 1
            carry = 0;
            borrow = 0;
            l = divisor.length;
            for (i = 0; i < l; i++) {
                carry += quotientDigit * divisor[i];
                q = Math.floor(carry / base);
                borrow += remainder[shift + i] - (carry - q * base);
                carry = q;
                if (borrow < 0) {
                    remainder[shift + i] = borrow + base;
                    borrow = -1;
                } else {
                    remainder[shift + i] = borrow;
                    borrow = 0;
                }
            }
            while (borrow !== 0) {
                quotientDigit -= 1;
                carry = 0;
                for (i = 0; i < l; i++) {
                    carry += remainder[shift + i] - base + divisor[i];
                    if (carry < 0) {
                        remainder[shift + i] = carry + base;
                        carry = 0;
                    } else {
                        remainder[shift + i] = carry;
                        carry = 1;
                    }
                }
                borrow += carry;
            }
            result[shift] = quotientDigit;
        }
        // denormalization
        remainder = divModSmall(remainder, lambda)[0];
        return [arrayToSmall(result), arrayToSmall(remainder)];
    }

    function divMod2(a, b) { // Implementation idea shamelessly stolen from Silent Matt's library http://silentmatt.com/biginteger/
        // Performs faster than divMod1 on larger input sizes.
        var a_l = a.length,
            b_l = b.length,
            result = [],
            part = [],
            base = BASE,
            guess, xlen, highx, highy, check;
        while (a_l) {
            part.unshift(a[--a_l]);
            trim(part);
            if (compareAbs(part, b) < 0) {
                result.push(0);
                continue;
            }
            xlen = part.length;
            highx = part[xlen - 1] * base + part[xlen - 2];
            highy = b[b_l - 1] * base + b[b_l - 2];
            if (xlen > b_l) {
                highx = (highx + 1) * base;
            }
            guess = Math.ceil(highx / highy);
            do {
                check = multiplySmall(b, guess);
                if (compareAbs(check, part) <= 0) break;
                guess--;
            } while (guess);
            result.push(guess);
            part = subtract(part, check);
        }
        result.reverse();
        return [arrayToSmall(result), arrayToSmall(part)];
    }

    function divModSmall(value, lambda) {
        var length = value.length,
            quotient = createArray(length),
            base = BASE,
            i, q, remainder, divisor;
        remainder = 0;
        for (i = length - 1; i >= 0; --i) {
            divisor = remainder * base + value[i];
            q = truncate(divisor / lambda);
            remainder = divisor - q * lambda;
            quotient[i] = q | 0;
        }
        return [quotient, remainder | 0];
    }

    function divModAny(self, v) {
        var value, n = parseValue(v);
        var a = self.value, b = n.value;
        var quotient;
        if (b === 0) throw new Error("Cannot divide by zero");
        if (self.isSmall) {
            if (n.isSmall) {
                return [new SmallInteger(truncate(a / b)), new SmallInteger(a % b)];
            }
            return [Integer[0], self];
        }
        if (n.isSmall) {
            if (b === 1) return [self, Integer[0]];
            if (b == -1) return [self.negate(), Integer[0]];
            var abs = Math.abs(b);
            if (abs < BASE) {
                value = divModSmall(a, abs);
                quotient = arrayToSmall(value[0]);
                var remainder = value[1];
                if (self.sign) remainder = -remainder;
                if (typeof quotient === "number") {
                    if (self.sign !== n.sign) quotient = -quotient;
                    return [new SmallInteger(quotient), new SmallInteger(remainder)];
                }
                return [new BigInteger(quotient, self.sign !== n.sign), new SmallInteger(remainder)];
            }
            b = smallToArray(abs);
        }
        var comparison = compareAbs(a, b);
        if (comparison === -1) return [Integer[0], self];
        if (comparison === 0) return [Integer[self.sign === n.sign ? 1 : -1], Integer[0]];

        // divMod1 is faster on smaller input sizes
        if (a.length + b.length <= 200)
            value = divMod1(a, b);
        else value = divMod2(a, b);

        quotient = value[0];
        var qSign = self.sign !== n.sign,
            mod = value[1],
            mSign = self.sign;
        if (typeof quotient === "number") {
            if (qSign) quotient = -quotient;
            quotient = new SmallInteger(quotient);
        } else quotient = new BigInteger(quotient, qSign);
        if (typeof mod === "number") {
            if (mSign) mod = -mod;
            mod = new SmallInteger(mod);
        } else mod = new BigInteger(mod, mSign);
        return [quotient, mod];
    }

    BigInteger.prototype.divmod = function (v) {
        var result = divModAny(this, v);
        return {
            quotient: result[0],
            remainder: result[1]
        };
    };
    SmallInteger.prototype.divmod = BigInteger.prototype.divmod;

    BigInteger.prototype.divide = function (v) {
        return divModAny(this, v)[0];
    };
    SmallInteger.prototype.over = SmallInteger.prototype.divide = BigInteger.prototype.over = BigInteger.prototype.divide;

    BigInteger.prototype.mod = function (v) {
        return divModAny(this, v)[1];
    };
    SmallInteger.prototype.remainder = SmallInteger.prototype.mod = BigInteger.prototype.remainder = BigInteger.prototype.mod;

    BigInteger.prototype.pow = function (v) {
        var n = parseValue(v),
            a = this.value,
            b = n.value,
            value, x, y;
        if (b === 0) return Integer[1];
        if (a === 0) return Integer[0];
        if (a === 1) return Integer[1];
        if (a === -1) return n.isEven() ? Integer[1] : Integer[-1];
        if (n.sign) {
            return Integer[0];
        }
        if (!n.isSmall) throw new Error("The exponent " + n.toString() + " is too large.");
        if (this.isSmall) {
            if (isPrecise(value = Math.pow(a, b)))
                return new SmallInteger(truncate(value));
        }
        x = this;
        y = Integer[1];
        while (true) {
            if (b & 1 === 1) {
                y = y.times(x);
                --b;
            }
            if (b === 0) break;
            b /= 2;
            x = x.square();
        }
        return y;
    };
    SmallInteger.prototype.pow = BigInteger.prototype.pow;

    BigInteger.prototype.modPow = function (exp, mod) {
        exp = parseValue(exp);
        mod = parseValue(mod);
        if (mod.isZero()) throw new Error("Cannot take modPow with modulus 0");
        var r = Integer[1],
            base = this.mod(mod);
        while (exp.isPositive()) {
            if (base.isZero()) return Integer[0];
            if (exp.isOdd()) r = r.multiply(base).mod(mod);
            exp = exp.divide(2);
            base = base.square().mod(mod);
        }
        return r;
    };
    SmallInteger.prototype.modPow = BigInteger.prototype.modPow;

    function compareAbs(a, b) {
        if (a.length !== b.length) {
            return a.length > b.length ? 1 : -1;
        }
        for (var i = a.length - 1; i >= 0; i--) {
            if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
        }
        return 0;
    }

    BigInteger.prototype.compareAbs = function (v) {
        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (n.isSmall) return 1;
        return compareAbs(a, b);
    };
    SmallInteger.prototype.compareAbs = function (v) {
        var n = parseValue(v),
            a = Math.abs(this.value),
            b = n.value;
        if (n.isSmall) {
            b = Math.abs(b);
            return a === b ? 0 : a > b ? 1 : -1;
        }
        return -1;
    };

    BigInteger.prototype.compare = function (v) {
        // See discussion about comparison with Infinity:
        // https://github.com/peterolson/BigInteger.js/issues/61
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }

        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (this.sign !== n.sign) {
            return n.sign ? 1 : -1;
        }
        if (n.isSmall) {
            return this.sign ? -1 : 1;
        }
        return compareAbs(a, b) * (this.sign ? -1 : 1);
    };
    BigInteger.prototype.compareTo = BigInteger.prototype.compare;

    SmallInteger.prototype.compare = function (v) {
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }

        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (n.isSmall) {
            return a == b ? 0 : a > b ? 1 : -1;
        }
        if (a < 0 !== n.sign) {
            return a < 0 ? -1 : 1;
        }
        return a < 0 ? 1 : -1;
    };
    SmallInteger.prototype.compareTo = SmallInteger.prototype.compare;

    BigInteger.prototype.equals = function (v) {
        return this.compare(v) === 0;
    };
    SmallInteger.prototype.eq = SmallInteger.prototype.equals = BigInteger.prototype.eq = BigInteger.prototype.equals;

    BigInteger.prototype.notEquals = function (v) {
        return this.compare(v) !== 0;
    };
    SmallInteger.prototype.neq = SmallInteger.prototype.notEquals = BigInteger.prototype.neq = BigInteger.prototype.notEquals;

    BigInteger.prototype.greater = function (v) {
        return this.compare(v) > 0;
    };
    SmallInteger.prototype.gt = SmallInteger.prototype.greater = BigInteger.prototype.gt = BigInteger.prototype.greater;

    BigInteger.prototype.lesser = function (v) {
        return this.compare(v) < 0;
    };
    SmallInteger.prototype.lt = SmallInteger.prototype.lesser = BigInteger.prototype.lt = BigInteger.prototype.lesser;

    BigInteger.prototype.greaterOrEquals = function (v) {
        return this.compare(v) >= 0;
    };
    SmallInteger.prototype.geq = SmallInteger.prototype.greaterOrEquals = BigInteger.prototype.geq = BigInteger.prototype.greaterOrEquals;

    BigInteger.prototype.lesserOrEquals = function (v) {
        return this.compare(v) <= 0;
    };
    SmallInteger.prototype.leq = SmallInteger.prototype.lesserOrEquals = BigInteger.prototype.leq = BigInteger.prototype.lesserOrEquals;

    BigInteger.prototype.isEven = function () {
        return (this.value[0] & 1) === 0;
    };
    SmallInteger.prototype.isEven = function () {
        return (this.value & 1) === 0;
    };

    BigInteger.prototype.isOdd = function () {
        return (this.value[0] & 1) === 1;
    };
    SmallInteger.prototype.isOdd = function () {
        return (this.value & 1) === 1;
    };

    BigInteger.prototype.isPositive = function () {
        return !this.sign;
    };
    SmallInteger.prototype.isPositive = function () {
        return this.value > 0;
    };

    BigInteger.prototype.isNegative = function () {
        return this.sign;
    };
    SmallInteger.prototype.isNegative = function () {
        return this.value < 0;
    };

    BigInteger.prototype.isUnit = function () {
        return false;
    };
    SmallInteger.prototype.isUnit = function () {
        return Math.abs(this.value) === 1;
    };

    BigInteger.prototype.isZero = function () {
        return false;
    };
    SmallInteger.prototype.isZero = function () {
        return this.value === 0;
    };
    BigInteger.prototype.isDivisibleBy = function (v) {
        var n = parseValue(v);
        var value = n.value;
        if (value === 0) return false;
        if (value === 1) return true;
        if (value === 2) return this.isEven();
        return this.mod(n).equals(Integer[0]);
    };
    SmallInteger.prototype.isDivisibleBy = BigInteger.prototype.isDivisibleBy;

    function isBasicPrime(v) {
        var n = v.abs();
        if (n.isUnit()) return false;
        if (n.equals(2) || n.equals(3) || n.equals(5)) return true;
        if (n.isEven() || n.isDivisibleBy(3) || n.isDivisibleBy(5)) return false;
        if (n.lesser(25)) return true;
        // we don't know if it's prime: let the other functions figure it out
    }

    BigInteger.prototype.isPrime = function () {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined) return isPrime;
        var n = this.abs(),
            nPrev = n.prev();
        var a = [2, 3, 5, 7, 11, 13, 17, 19],
            b = nPrev,
            d, t, i, x;
        while (b.isEven()) b = b.divide(2);
        for (i = 0; i < a.length; i++) {
            x = bigInt(a[i]).modPow(b, n);
            if (x.equals(Integer[1]) || x.equals(nPrev)) continue;
            for (t = true, d = b; t && d.lesser(nPrev) ; d = d.multiply(2)) {
                x = x.square().mod(n);
                if (x.equals(nPrev)) t = false;
            }
            if (t) return false;
        }
        return true;
    };
    SmallInteger.prototype.isPrime = BigInteger.prototype.isPrime;

    BigInteger.prototype.isProbablePrime = function (iterations) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined) return isPrime;
        var n = this.abs();
        var t = iterations === undefined ? 5 : iterations;
        // use the Fermat primality test
        for (var i = 0; i < t; i++) {
            var a = bigInt.randBetween(2, n.minus(2));
            if (!a.modPow(n.prev(), n).isUnit()) return false; // definitely composite
        }
        return true; // large chance of being prime
    };
    SmallInteger.prototype.isProbablePrime = BigInteger.prototype.isProbablePrime;

    BigInteger.prototype.modInv = function (n) {
        var t = bigInt.zero, newT = bigInt.one, r = parseValue(n), newR = this.abs(), q, lastT, lastR;
        while (!newR.equals(bigInt.zero)) {
            q = r.divide(newR);
            lastT = t;
            lastR = r;
            t = newT;
            r = newR;
            newT = lastT.subtract(q.multiply(newT));
            newR = lastR.subtract(q.multiply(newR));
        }
        if (!r.equals(1)) throw new Error(this.toString() + " and " + n.toString() + " are not co-prime");
        if (t.compare(0) === -1) {
            t = t.add(n);
        }
        if (this.isNegative()) {
            return t.negate();
        }
        return t;
    };

    SmallInteger.prototype.modInv = BigInteger.prototype.modInv;

    BigInteger.prototype.next = function () {
        var value = this.value;
        if (this.sign) {
            return subtractSmall(value, 1, this.sign);
        }
        return new BigInteger(addSmall(value, 1), this.sign);
    };
    SmallInteger.prototype.next = function () {
        var value = this.value;
        if (value + 1 < MAX_INT) return new SmallInteger(value + 1);
        return new BigInteger(MAX_INT_ARR, false);
    };

    BigInteger.prototype.prev = function () {
        var value = this.value;
        if (this.sign) {
            return new BigInteger(addSmall(value, 1), true);
        }
        return subtractSmall(value, 1, this.sign);
    };
    SmallInteger.prototype.prev = function () {
        var value = this.value;
        if (value - 1 > -MAX_INT) return new SmallInteger(value - 1);
        return new BigInteger(MAX_INT_ARR, true);
    };

    var powersOfTwo = [1];
    while (powersOfTwo[powersOfTwo.length - 1] <= BASE) powersOfTwo.push(2 * powersOfTwo[powersOfTwo.length - 1]);
    var powers2Length = powersOfTwo.length, highestPower2 = powersOfTwo[powers2Length - 1];

    function shift_isSmall(n) {
        return ((typeof n === "number" || typeof n === "string") && +Math.abs(n) <= BASE) ||
            (n instanceof BigInteger && n.value.length <= 1);
    }

    BigInteger.prototype.shiftLeft = function (n) {
        if (!shift_isSmall(n)) {
            throw new Error(String(n) + " is too large for shifting.");
        }
        n = +n;
        if (n < 0) return this.shiftRight(-n);
        var result = this;
        while (n >= powers2Length) {
            result = result.multiply(highestPower2);
            n -= powers2Length - 1;
        }
        return result.multiply(powersOfTwo[n]);
    };
    SmallInteger.prototype.shiftLeft = BigInteger.prototype.shiftLeft;

    BigInteger.prototype.shiftRight = function (n) {
        var remQuo;
        if (!shift_isSmall(n)) {
            throw new Error(String(n) + " is too large for shifting.");
        }
        n = +n;
        if (n < 0) return this.shiftLeft(-n);
        var result = this;
        while (n >= powers2Length) {
            if (result.isZero()) return result;
            remQuo = divModAny(result, highestPower2);
            result = remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
            n -= powers2Length - 1;
        }
        remQuo = divModAny(result, powersOfTwo[n]);
        return remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
    };
    SmallInteger.prototype.shiftRight = BigInteger.prototype.shiftRight;

    function bitwise(x, y, fn) {
        y = parseValue(y);
        var xSign = x.isNegative(), ySign = y.isNegative();
        var xRem = xSign ? x.not() : x,
            yRem = ySign ? y.not() : y;
        var xBits = [], yBits = [];
        var xStop = false, yStop = false;
        while (!xStop || !yStop) {
            if (xRem.isZero()) { // virtual sign extension for simulating two's complement
                xStop = true;
                xBits.push(xSign ? 1 : 0);
            }
            else if (xSign) xBits.push(xRem.isEven() ? 1 : 0); // two's complement for negative numbers
            else xBits.push(xRem.isEven() ? 0 : 1);

            if (yRem.isZero()) {
                yStop = true;
                yBits.push(ySign ? 1 : 0);
            }
            else if (ySign) yBits.push(yRem.isEven() ? 1 : 0);
            else yBits.push(yRem.isEven() ? 0 : 1);

            xRem = xRem.over(2);
            yRem = yRem.over(2);
        }
        var result = [];
        for (var i = 0; i < xBits.length; i++) result.push(fn(xBits[i], yBits[i]));
        var sum = bigInt(result.pop()).negate().times(bigInt(2).pow(result.length));
        while (result.length) {
            sum = sum.add(bigInt(result.pop()).times(bigInt(2).pow(result.length)));
        }
        return sum;
    }

    BigInteger.prototype.not = function () {
        return this.negate().prev();
    };
    SmallInteger.prototype.not = BigInteger.prototype.not;

    BigInteger.prototype.and = function (n) {
        return bitwise(this, n, function (a, b) { return a & b; });
    };
    SmallInteger.prototype.and = BigInteger.prototype.and;

    BigInteger.prototype.or = function (n) {
        return bitwise(this, n, function (a, b) { return a | b; });
    };
    SmallInteger.prototype.or = BigInteger.prototype.or;

    BigInteger.prototype.xor = function (n) {
        return bitwise(this, n, function (a, b) { return a ^ b; });
    };
    SmallInteger.prototype.xor = BigInteger.prototype.xor;

    var LOBMASK_I = 1 << 30, LOBMASK_BI = (BASE & -BASE) * (BASE & -BASE) | LOBMASK_I;
    function roughLOB(n) { // get lowestOneBit (rough)
        // SmallInteger: return Min(lowestOneBit(n), 1 << 30)
        // BigInteger: return Min(lowestOneBit(n), 1 << 14) [BASE=1e7]
        var v = n.value, x = typeof v === "number" ? v | LOBMASK_I : v[0] + v[1] * BASE | LOBMASK_BI;
        return x & -x;
    }

    function max(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.greater(b) ? a : b;
    }
    function min(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.lesser(b) ? a : b;
    }
    function gcd(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        if (a.equals(b)) return a;
        if (a.isZero()) return b;
        if (b.isZero()) return a;
        var c = Integer[1], d, t;
        while (a.isEven() && b.isEven()) {
            d = Math.min(roughLOB(a), roughLOB(b));
            a = a.divide(d);
            b = b.divide(d);
            c = c.multiply(d);
        }
        while (a.isEven()) {
            a = a.divide(roughLOB(a));
        }
        do {
            while (b.isEven()) {
                b = b.divide(roughLOB(b));
            }
            if (a.greater(b)) {
                t = b; b = a; a = t;
            }
            b = b.subtract(a);
        } while (!b.isZero());
        return c.isUnit() ? a : a.multiply(c);
    }
    function lcm(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        return a.divide(gcd(a, b)).multiply(b);
    }
    function randBetween(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        var low = min(a, b), high = max(a, b);
        var range = high.subtract(low);
        if (range.isSmall) return low.add(Math.round(Math.random() * range));
        var length = range.value.length - 1;
        var result = [], restricted = true;
        for (var i = length; i >= 0; i--) {
            var top = restricted ? range.value[i] : BASE;
            var digit = truncate(Math.random() * top);
            result.unshift(digit);
            if (digit < top) restricted = false;
        }
        result = arrayToSmall(result);
        return low.add(typeof result === "number" ? new SmallInteger(result) : new BigInteger(result, false));
    }
    var parseBase = function (text, base) {
        var length = text.length;
        if (2 <= base && base <= 36) {
            if (length <= LOG_MAX_INT / Math.log(base)) {
                return new SmallInteger(parseInt(text, base));
            }
        }
        base = parseValue(base);
        var digits = [];
        var i;
        var isNegative = text[0] === "-";
        for (i = isNegative ? 1 : 0; i < text.length; i++) {
            var c = text[i].toLowerCase(),
                charCode = c.charCodeAt(0);
            if (48 <= charCode && charCode <= 57) digits.push(parseValue(c));
            else if (97 <= charCode && charCode <= 122) digits.push(parseValue(c.charCodeAt(0) - 87));
            else if (c === "<") {
                var start = i;
                do { i++; } while (text[i] !== ">");
                digits.push(parseValue(text.slice(start + 1, i)));
            }
            else throw new Error(c + " is not a valid character");
        }
        return parseBaseFromArray(digits, base, isNegative);
    };

    function parseBaseFromArray(digits, base, isNegative) {
        var val = Integer[0], pow = Integer[1], i;
        for (i = digits.length - 1; i >= 0; i--) {
            val = val.add(digits[i].times(pow));
            pow = pow.times(base);
        }
        return isNegative ? val.negate() : val;
    }

    function stringify(digit) {
        var v = digit.value;
        if (typeof v === "number") v = [v];
        if (v.length === 1 && v[0] <= 35) {
            return "0123456789abcdefghijklmnopqrstuvwxyz".charAt(v[0]);
        }
        return "<" + v + ">";
    }
    function toBase(n, base) {
        base = bigInt(base);
        if (base.isZero()) {
            if (n.isZero()) return "0";
            throw new Error("Cannot convert nonzero numbers to base 0.");
        }
        if (base.equals(-1)) {
            if (n.isZero()) return "0";
            if (n.isNegative()) return new Array(1 - n).join("10");
            return "1" + new Array(+n).join("01");
        }
        var minusSign = "";
        if (n.isNegative() && base.isPositive()) {
            minusSign = "-";
            n = n.abs();
        }
        if (base.equals(1)) {
            if (n.isZero()) return "0";
            return minusSign + new Array(+n + 1).join(1);
        }
        var out = [];
        var left = n, divmod;
        while (left.isNegative() || left.compareAbs(base) >= 0) {
            divmod = left.divmod(base);
            left = divmod.quotient;
            var digit = divmod.remainder;
            if (digit.isNegative()) {
                digit = base.minus(digit).abs();
                left = left.next();
            }
            out.push(stringify(digit));
        }
        out.push(stringify(left));
        return minusSign + out.reverse().join("");
    }

    BigInteger.prototype.toString = function (radix) {
        if (radix === undefined) radix = 10;
        if (radix !== 10) return toBase(this, radix);
        var v = this.value, l = v.length, str = String(v[--l]), zeros = "0000000", digit;
        while (--l >= 0) {
            digit = String(v[l]);
            str += zeros.slice(digit.length) + digit;
        }
        var sign = this.sign ? "-" : "";
        return sign + str;
    };
    SmallInteger.prototype.toString = function (radix) {
        if (radix === undefined) radix = 10;
        if (radix != 10) return toBase(this, radix);
        return String(this.value);
    };

    BigInteger.prototype.valueOf = function () {
        return +this.toString();
    };
    BigInteger.prototype.toJSNumber = BigInteger.prototype.valueOf;

    SmallInteger.prototype.valueOf = function () {
        return this.value;
    };
    SmallInteger.prototype.toJSNumber = SmallInteger.prototype.valueOf;

    function parseStringValue(v) {
            if (isPrecise(+v)) {
                var x = +v;
                if (x === truncate(x))
                    return new SmallInteger(x);
                throw "Invalid integer: " + v;
            }
            var sign = v[0] === "-";
            if (sign) v = v.slice(1);
            var split = v.split(/e/i);
            if (split.length > 2) throw new Error("Invalid integer: " + split.join("e"));
            if (split.length === 2) {
                var exp = split[1];
                if (exp[0] === "+") exp = exp.slice(1);
                exp = +exp;
                if (exp !== truncate(exp) || !isPrecise(exp)) throw new Error("Invalid integer: " + exp + " is not a valid exponent.");
                var text = split[0];
                var decimalPlace = text.indexOf(".");
                if (decimalPlace >= 0) {
                    exp -= text.length - decimalPlace - 1;
                    text = text.slice(0, decimalPlace) + text.slice(decimalPlace + 1);
                }
                if (exp < 0) throw new Error("Cannot include negative exponent part for integers");
                text += (new Array(exp + 1)).join("0");
                v = text;
            }
            var isValid = /^([0-9][0-9]*)$/.test(v);
            if (!isValid) throw new Error("Invalid integer: " + v);
            var r = [], max = v.length, l = LOG_BASE, min = max - l;
            while (max > 0) {
                r.push(+v.slice(min, max));
                min -= l;
                if (min < 0) min = 0;
                max -= l;
            }
            trim(r);
            return new BigInteger(r, sign);
    }

    function parseNumberValue(v) {
        if (isPrecise(v)) {
            if (v !== truncate(v)) throw new Error(v + " is not an integer.");
            return new SmallInteger(v);
        }
        return parseStringValue(v.toString());
    }

    function parseValue(v) {
        if (typeof v === "number") {
            return parseNumberValue(v);
        }
        if (typeof v === "string") {
            return parseStringValue(v);
        }
        return v;
    }
    // Pre-define numbers in range [-999,999]
    for (var i = 0; i < 1000; i++) {
        Integer[i] = new SmallInteger(i);
        if (i > 0) Integer[-i] = new SmallInteger(-i);
    }
    // Backwards compatibility
    Integer.one = Integer[1];
    Integer.zero = Integer[0];
    Integer.minusOne = Integer[-1];
    Integer.max = max;
    Integer.min = min;
    Integer.gcd = gcd;
    Integer.lcm = lcm;
    Integer.isInstance = function (x) { return x instanceof BigInteger || x instanceof SmallInteger; };
    Integer.randBetween = randBetween;

    Integer.fromArray = function (digits, base, isNegative) {
        return parseBaseFromArray(digits.map(parseValue), parseValue(base || 10), isNegative);
    };

    return Integer;
})();

// Node.js check
if ( true && module.hasOwnProperty("exports")) {
    module.exports = bigInt;
}


/***/ }),

/***/ 208:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BookmarkField = void 0;
var BigInteger = __webpack_require__(632);
/**
 * This is the class that encapsulates a bookmark object (which consists of a publisher id and a sequence number).
 */
var BookmarkField = /** @class */ (function () {
    /**
     * @param {string} raw The raw bookmark string of a format: `10357694053628526720|1490901822670001000|`.
     */
    function BookmarkField(raw) {
        if (raw === void 0) { raw = null; }
        var _this = this;
        this.raw = raw;
        this.publisherId = null;
        this.sequenceNumber = null;
        this.length = 0;
        /**
         * This internal method parses the bookmark string into the sequence number and the publisher id.
         * @private
         * @hidden
         */
        this.parseBookmark = function () {
            if (!_this.raw || _this.isTimestamp() || _this.isRange() || _this.raw === '0') {
                _this.sequenceNumber = BigInteger.zero;
                return;
            }
            // regular bookmark
            try {
                var parts = _this.raw.split('|');
                if (parts.length < 2) {
                    throw '';
                }
                _this.publisherId = parts[0];
                _this.sequenceNumber = BigInteger(parts[1]);
            }
            catch (err) {
                throw new Error('Invalid Bookmark');
            }
        };
        if (raw) {
            this.length = raw.length;
        }
    }
    /**
     * This method identifies if this bookmark represents a timestamp.
     * Example of a timestamp: `20150102T123500Z`
     *
     * @returns {boolean} True if the bookmark field is a timestamp, false otherwise.
     */
    BookmarkField.prototype.isTimestamp = function () {
        return this.length >= BookmarkField.MIN_TIMESTAMP_LENGTH
            && this.length <= BookmarkField.MAX_TIMESTAMP_LENGTH
            && this.raw[8] === 'T'
            && this.raw[this.length - 1] === 'Z';
    };
    /**
     * This method identifies if this bookmark represents a range value.
     * Only checks for starting [( and ending ]) so not a full validation.
     * Example of a range value: `[20150102T122500Z:20150102T123500Z]`
     *
     * @returns {boolean} True if the bookmark field is a range bookmark value, false otherwise.
     */
    BookmarkField.prototype.isRange = function () {
        if (this.length >= 5) {
            var pos = 0;
            while (this.raw[pos] === ' ') {
                if (++pos >= this.length) {
                    return false;
                }
            }
            if (this.raw[pos] === '(' || this.raw[pos] === '[') {
                pos = this.length - 1;
                while (this.raw[pos] === ' ') {
                    if (--pos <= 0) {
                        return false;
                    }
                }
                if (this.raw[pos] === ')' || this.raw[pos] === ']') {
                    return true;
                }
            }
        }
        return false;
    };
    /**
     * Returns the publisher id for the bookmark or 0 if it's a timestamp.
     *
     * @returns {string} The corresponding publisher id for this bookmark or null if it's a timestamp or a range value.
     */
    BookmarkField.prototype.getPublisherId = function () {
        if (this.sequenceNumber === null) {
            this.parseBookmark();
        }
        return this.publisherId;
    };
    /**
     * This method returns the sequence number for the bookmark or 0 if it's a timestamp or a range value.
     *
     * @returns {BigInteger} The corresponding sequence number for this bookmark.
     */
    BookmarkField.prototype.getSequenceNumber = function () {
        if (this.sequenceNumber === null) {
            this.parseBookmark();
        }
        return this.sequenceNumber;
    };
    /**
     * This method returns the raw bookmark value as a string.
     *
     * @returns {string} The raw bookmark value.
     */
    BookmarkField.prototype.toString = function () {
        return this.raw;
    };
    /**
     * This method provides a way to make this object a duplicate of a field if the field represents
     * a valid bookmark.
     *
     * @param {BookmarkField} field The bookmark field object.
     */
    BookmarkField.prototype.copyFrom = function (field) {
        this.raw = field.toString();
        this.length = this.raw ? this.raw.length : 0;
        this.sequenceNumber = field.sequenceNumber;
        this.publisherId = field.publisherId;
    };
    /**
     * This method provides a way to duplicate this object.
     *
     * @returns {BookmarkField} The copied bookmark field object.
     */
    BookmarkField.prototype.copy = function () {
        var field = new BookmarkField(this.raw);
        field.sequenceNumber = this.sequenceNumber;
        field.publisherId = this.publisherId;
        return field;
    };
    /**
     * This method compares the current object with another object.
     *
     * @param {BookmarkField | string} field Another bookmark field object or a string raw bookmark.
     * @returns {boolean} True if the two objects are equal, false otherwise.
     */
    BookmarkField.prototype.equals = function (field) {
        if (typeof field === 'string') {
            return this.raw === field;
        }
        if (field === null || !(field instanceof BookmarkField)) {
            return false;
        }
        if (this.length !== field.length) {
            return false;
        }
        return this.raw === field.raw;
    };
    /**
     * This method resets/clears this object.
     */
    BookmarkField.prototype.reset = function () {
        this.raw = null;
        this.length = 0;
        this.sequenceNumber = null;
        this.publisherId = null;
    };
    /**
     * This method returns whether it's clear/reset or not.
     *
     * @returns {boolean} True if the object is "null" (reset), false otherwise.
     */
    BookmarkField.prototype.isNull = function () {
        return this.raw === null || this.length === 0;
    };
    // Constants
    BookmarkField.MAX_BOOKMARK_LENGTH = 42;
    BookmarkField.MAX_TIMESTAMP_LENGTH = 24;
    BookmarkField.MIN_TIMESTAMP_LENGTH = 10;
    return BookmarkField;
}());
exports.BookmarkField = BookmarkField;


/***/ }),

/***/ 748:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BookmarkRangeField = void 0;
var bookmark_field_1 = __webpack_require__(208);
/**
 * This is the class that encapsulates a bookmark range object.
 */
var BookmarkRangeField = /** @class */ (function (_super) {
    __extends(BookmarkRangeField, _super);
    /**
     * @param {string} rawBookmark The string of a range format, for example: `[20190808T100002Z:20190808T100004Z]`.
     */
    function BookmarkRangeField(rawBookmark) {
        if (rawBookmark === void 0) { rawBookmark = null; }
        var _this = _super.call(this, rawBookmark) || this;
        _this.start = null;
        _this.end = null;
        _this.open = -1;
        /**
         * This internal method resets the field state due to an invalid value.
         * @private
         * @hidden
         */
        _this.notValid = function () {
            _this.start = null;
            _this.end = null;
            _this.open = -1;
        };
        /**
         * This internal method does a full parse into start/end of range.
         * @private
         * @hidden
         */
        _this.parse = function () {
            _this.notValid();
            var foundClose = false;
            var foundSeparator = false;
            var pos = 0;
            var end = _this.raw.length;
            var startPos = -1;
            var endPos = -1;
            while (pos < end) {
                switch (_this.raw[pos]) {
                    // beginning of range
                    case '(':
                    case '[':
                        // can't be past the end of already started
                        if (foundClose || _this.open > -1) {
                            _this.notValid();
                            return;
                        }
                        _this.open = pos;
                        break;
                    // valid bookmark characters
                    case '0':
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                    case '8':
                    case '9':
                    case '|':
                    case ',':
                    case 'T':
                    case 'Z':
                        // have to be between start and end
                        if (foundClose || _this.open < 0) {
                            _this.notValid();
                            return;
                        }
                        else if (foundSeparator) {
                            if (endPos < 0) {
                                // found the end bookmark starting position
                                endPos = pos;
                            }
                        }
                        else if (startPos < 0) {
                            // found the start bookmark starting position
                            startPos = pos;
                        }
                        break;
                    case ':':
                        // have to be between start and end and have begun the start bookmark
                        if (foundClose || _this.open < 0 || startPos < 0 || foundSeparator) {
                            _this.notValid();
                            return;
                        }
                        foundSeparator = true;
                        // create the start bookmark field
                        _this.start = new bookmark_field_1.BookmarkField(_this.raw.slice(startPos, pos));
                        break;
                    // close the range
                    case ']':
                    case ')':
                        // have to be between start and end and begun the end bookmark
                        if (foundClose || _this.open < 0 || endPos < 0) {
                            _this.notValid();
                            return;
                        }
                        foundClose = true;
                        _this.length = pos + 1;
                        // create the end bookmark field
                        _this.end = new bookmark_field_1.BookmarkField(_this.raw.slice(endPos, pos));
                        break;
                    // spaces are skipped, but allowed
                    case ' ':
                        break;
                    default:
                        _this.notValid();
                        return;
                }
                pos++;
            }
            if (_this.end === null || _this.start === null || !foundSeparator || !foundClose || _this.open < 0) {
                _this.notValid();
            }
        };
        if (rawBookmark) {
            _this.parse();
        }
        return _this;
    }
    /**
     * This method provides a way to make this object a duplicate of a field if the field represents
     * a valid bookmark range.
     *
     * @param {BookmarkField} field The bookmark field object.
     */
    BookmarkRangeField.prototype.copyFrom = function (field) {
        _super.prototype.copyFrom.call(this, field);
        this.parse();
    };
    /**
     * This method returns whether this is a valid range or not.
     *
     * @returns {boolean} True if this is a valid range, false otherwise.
     */
    BookmarkRangeField.prototype.isValid = function () {
        return this.open >= 0;
    };
    /**
     * This method returns the start bookmark of a range.
     *
     * @returns {BookmarkField} The start bookmark field of a range.
     */
    BookmarkRangeField.prototype.getStart = function () {
        return this.start;
    };
    /**
     * This method returns the end bookmark of a range.
     *
     * @returns {BookmarkField} The end bookmark field of a range.
     */
    BookmarkRangeField.prototype.getEnd = function () {
        return this.end;
    };
    /**
     * This method replaces the start bookmark of the range.
     *
     * @param {BookmarkField} start The bookmark field object with the new start value.
     * @param {boolean} makeExclusive If true, the new start range should be exclusive, otherwise it keeps
     * the previous value.
     */
    BookmarkRangeField.prototype.replaceStart = function (start, makeExclusive) {
        if (makeExclusive === void 0) { makeExclusive = true; }
        if (!this.isValid()) {
            return;
        }
        // Don't go backwards
        if (start.getPublisherId() === this.start.getPublisherId()
            && start.getSequenceNumber().lesserOrEquals(this.start.getSequenceNumber())) {
            return;
        }
        var openClause = makeExclusive ? '(' : this.raw[this.open];
        this.open = 0;
        this.start = start;
        this.raw = openClause + this.start.toString() + ':' + this.end.toString() + this.raw[this.length - 1];
        this.length = this.raw.length;
    };
    /**
     * This method returns whether the start of the range is inclusive or not.
     *
     * @returns {boolean} True if the start range is inclusive, false otherwise.
     */
    BookmarkRangeField.prototype.isStartInclusive = function () {
        return this.isValid() && this.raw[this.open] === '[';
    };
    /**
     * This method returns whether the end of the range is inclusive or not.
     *
     * @returns {boolean} True if the end range is inclusive, false otherwise.
     */
    BookmarkRangeField.prototype.isEndInclusive = function () {
        return this.isValid() && this.raw[this.length - 1] === ']';
    };
    return BookmarkRangeField;
}(bookmark_field_1.BookmarkField));
exports.BookmarkRangeField = BookmarkRangeField;


/***/ }),

/***/ 304:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BookmarkRingBuffer = exports.Entry = void 0;
var bookmark_field_1 = __webpack_require__(208);
/**
 * This class encapsulates an entry in a bookmark ring buffer.
 * @hidden
 */
var Entry = /** @class */ (function () {
    function Entry() {
        this.index = 0;
        this.active = false;
        this.bookmark = new bookmark_field_1.BookmarkField();
    }
    Entry.prototype.setBookmark = function (field) {
        this.bookmark.copyFrom(field);
        return this;
    };
    Entry.prototype.getBookmark = function () {
        return this.bookmark;
    };
    Entry.prototype.setIndex = function (index) {
        this.index = index;
        return this;
    };
    Entry.prototype.getIndex = function () {
        return this.index;
    };
    Entry.prototype.isActive = function () {
        return this.active;
    };
    Entry.prototype.setActive = function (active) {
        this.active = active;
        return this;
    };
    Entry.prototype.toString = function () {
        return "".concat(this.index, ": ").concat(this.bookmark.toString(), " ").concat(this.active ? 'active' : 'discarded');
    };
    return Entry;
}());
exports.Entry = Entry;
/**
 * A ring buffer of bookmarks and activation status
 * Used by the memory bookmark store to track state of bookmarks
 * we need to hold on to, either because they're active or because
 * they're after an active one.
 *
 * @hidden
 */
var BookmarkRingBuffer = /** @class */ (function () {
    /**
     * Constructor.
     *
     * Initializes the underlying array, and sets the "last discarded" value to something reasonable.
     */
    function BookmarkRingBuffer() {
        var _this = this;
        this.start = 1;
        this.end = 1;
        this.index = 1;
        this.indexOfStart = 0;
        this.lastDiscarded = null;
        this.empty = true;
        /**
         * This method is called when self is full, assumes all entries are valid.
         */
        this.resize = function () {
            var oldLength = _this.entries.length;
            // allocate a new array (1.5x resize factor)
            // copy over the data.
            var newEntries = Array(Math.round(oldLength * 1.5));
            // copy second part (start -> end) of the old array
            var j = 0;
            for (var i = _this.start; i < oldLength; ++i, ++j) {
                newEntries[j] = _this.entries[i];
            }
            // copy the first part (0 -> start) of the old array
            if (_this.start > 0) {
                for (var i = 0; i < _this.start; ++i, ++j) {
                    newEntries[j] = _this.entries[i];
                }
            }
            _this.indexOfStart += _this.start;
            _this.start = 0;
            _this.end = oldLength;
            // initialize the rest of the new array
            for (var i = oldLength; i < newEntries.length; ++i) {
                newEntries[i] = new Entry();
            }
            _this.entries = newEntries;
        };
        this.entries = Array(BookmarkRingBuffer.INITIAL_ENTRY_COUNT);
        this.lastDiscarded = new bookmark_field_1.BookmarkField('0');
        for (var i = 0; i < this.entries.length; ++i) {
            this.entries[i] = new Entry();
        }
    }
    /**
     * This method resets this bookmark ring buffer for reuse by clearing out its state.
     */
    BookmarkRingBuffer.prototype.reset = function () {
        for (var i = 0; i < this.entries.length; ++i) {
            this.entries[i].setActive(false).setIndex(0).getBookmark().reset();
        }
        this.start = 1;
        this.end = 1;
        this.index = 1;
        this.indexOfStart = 0;
        this.lastDiscarded = new bookmark_field_1.BookmarkField('0');
        this.empty = true;
        this.store = null;
        this.subId = null;
    };
    /**
     * This method returns the size of underlying array.
     *
     * @returns {number} Current capacity of self.
     */
    BookmarkRingBuffer.prototype.capacity = function () {
        return this.entries.length;
    };
    /**
     * This method retrieves an Entry given an index.
     *
     * @param {number} index An index returned by .getIndex(), getStartIndex(), getEndIndex(), log, etc.
     * @returns {Entry} The entry at that index, or null if not found.
     */
    BookmarkRingBuffer.prototype.getByIndex = function (index) {
        // The index must be higher than the lowest we have stored, and less than our highest.
        if ((index < (this.indexOfStart + this.start)) || (index > this.index)) {
            return null;
        }
        return this.entries[(index - this.indexOfStart) % this.entries.length];
    };
    /**
     * This method returns the "last discarded" bookmark. This may be a newer bookmark than the one you last passed
     * to discard(), if you're discarding out of order.
     *
     * @returns {BookmarkField} the last bookmark to be discarded.
     */
    BookmarkRingBuffer.prototype.getLastDiscarded = function () {
        return this.lastDiscarded;
    };
    /**
     * This method returns whether the buffer is currently empty.
     *
     * @returns {boolean} true if self is empty and false otherwise.
     */
    BookmarkRingBuffer.prototype.isEmpty = function () {
        return this.empty;
    };
    /**
     * This method returns the index value associated with the first valid [[Entry]] in self.
     *
     * @returns {number} index of first valid entry.
     */
    BookmarkRingBuffer.prototype.getStartIndex = function () {
        if (this.empty) {
            return BookmarkRingBuffer.UNSET_INDEX;
        }
        return this.indexOfStart + this.start;
    };
    /**
     * This method returns the index value one greater than the last valid [[Entry]] in self.
     *
     * @returns {number} index 1 greater than last valid entry.
     */
    BookmarkRingBuffer.prototype.getEndIndex = function () {
        if (!this.empty) {
            return this.index;
        }
        return BookmarkRingBuffer.UNSET_INDEX;
    };
    /**
     * This method logs the bookmark by allocating an [[Entry]], setting the entry to active, copying the bookmark value
     * to that entry, and returning the index of that entry.
     *
     * @param {BookmarkField} bookmark the bookmark to log.
     * @returns {number} the index of the new Entry.
     */
    BookmarkRingBuffer.prototype.log = function (bookmark) {
        if (this.end === this.start && !this.empty) {
            this.resize();
        }
        this.empty = false;
        this.entries[this.end++].setBookmark(bookmark).setActive(true).setIndex(this.index);
        if (this.end === this.entries.length) {
            this.end = 0;
        }
        return this.index++;
    };
    /**
     * This method discards an entry by index. If the discard is completed, lastDiscarded will change, otherwise the
     * discard is cached in the entry, and the getLastDiscarded() value is unchanged.
     *
     * @param {number} index the index of the entry.
     * @returns {boolean} true if this caused lastDiscarded to change.
     */
    BookmarkRingBuffer.prototype.discard = function (index) {
        var retVal = false;
        if ((index < (this.indexOfStart + this.start)) || (index >= this.index)) {
            return retVal;
        }
        var offsetFromStart = index - this.indexOfStart;
        var indexInArray = offsetFromStart % this.entries.length;
        this.entries[indexInArray].setActive(false);
        if (this.start === indexInArray) {
            var lastDiscardedEntry = null;
            while (!this.entries[this.start].isActive()
                && !this.entries[this.start].getBookmark().isNull()
                && ((this.start !== this.end) || !this.empty)) {
                if (lastDiscardedEntry !== null) {
                    lastDiscardedEntry.getBookmark().reset();
                }
                lastDiscardedEntry = this.entries[this.start];
                if (++this.start === this.entries.length) {
                    this.start = 0;
                    this.indexOfStart += this.entries.length;
                }
                this.empty = this.start === this.end;
            }
            if (lastDiscardedEntry !== null) {
                var bookmark = lastDiscardedEntry.getBookmark();
                if (bookmark !== null && !bookmark.isNull()) {
                    this.lastDiscarded.copyFrom(bookmark);
                    bookmark.reset();
                }
                retVal = true;
            }
        }
        return retVal;
    };
    /**
     * This method searches valid Entries for the given bookmark.
     *
     * @param {BookmarkField} field The bookmark to search for.
     * @returns {Entry} The Entry containing the given bookmark, or null, if not found.
     */
    BookmarkRingBuffer.prototype.find = function (field) {
        if (this.empty) {
            return null;
        }
        var index = this.indexOfStart + this.start;
        var i = this.start;
        do {
            if (!this.entries[i].getBookmark().isNull() && this.entries[i].getBookmark().equals(field)) {
                // hooray! we found it.
                return this.entries[i].setIndex(index);
            }
            ++index;
            i = (i + 1) % this.entries.length;
        } while (i !== this.end);
        return null;
    };
    BookmarkRingBuffer.prototype.setSubId = function (subId) {
        this.subId = subId;
    };
    /**
     * @hidden
     */
    BookmarkRingBuffer.prototype.toString = function () {
        return "Capacity: ".concat(this.entries.length, "\n").concat(this.entries.map(function (entry) { return entry.toString(); }).join('\n'));
    };
    BookmarkRingBuffer.INITIAL_ENTRY_COUNT = 1000;
    BookmarkRingBuffer.UNSET_INDEX = -1;
    return BookmarkRingBuffer;
}());
exports.BookmarkRingBuffer = BookmarkRingBuffer;


/***/ }),

/***/ 836:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";
///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Client = void 0;
var BigInteger = __webpack_require__(632);
var helpers_1 = __webpack_require__(196);
var command_1 = __webpack_require__(372);
var message_1 = __webpack_require__(220);
var type_helper_1 = __webpack_require__(817);
var bookmark_field_1 = __webpack_require__(208);
var memory_publish_store_1 = __webpack_require__(816);
var memory_bookmark_store_1 = __webpack_require__(808);
var default_subscription_manager_1 = __webpack_require__(552);
var default_authenticator_1 = __webpack_require__(652);
var default_server_chooser_1 = __webpack_require__(444);
var exponential_delay_strategy_1 = __webpack_require__(708);
var fixed_delay_strategy_1 = __webpack_require__(628);
// Conditional imports: Node.js-like environment requires WebSocket and (optionally) Promise
var W3WebSocket = (helpers_1.IS_NODE || helpers_1.IS_ELECTRON) ? (eval('require')('websocket')).w3cwebsocket : WebSocket;
if (helpers_1.IS_BROWSER && (typeof Promise === 'undefined')) {
    throw new Error('Promise support is required. Please include es6-promise library');
}
var Client = /** @class */ (function () {
    /**
     * @param {string} name Unique name for the client (important for queues and sow). It is strongly recommended to
     * set a client name, but if it's not set, it'll be assigned automatically.
     *
     * When a transaction log is present, AMPS requires the Client Name for a publisher to be:
     *
     * - Unique within a set of replicated AMPS instances
     * - Consistent from invocation to invocation if the publisher will be publishing the same logical stream
     *   of messages
     *
     * 60East recommends always using consistent, unique client names.
     */
    function Client(name) {
        var _this = this;
        // Private data
        this._name = null;
        this._nameHash = null;
        this._logonCorrelationId = null;
        this._serverVersion = null;
        this._serverIntVersion = 0;
        this._nextSubId = 0;
        this.subscriptions = {};
        this.connection = null;
        this._isConnected = false;
        this._isLoggedOn = false;
        this.typeHelper = null;
        this._disconnectHandler = null;
        this._transportFilter = null;
        this._stateListenerId = 1;
        this._connectionStateListeners = {};
        this._serverChooser = null;
        this._delayStrategy = null;
        this._publishStore = null;
        this._bookmarkStore = null;
        this._subscriptionManager = null;
        this.timeouts = {};
        this._autoAck = false;
        this._ackBatch = { toAck: {}, ackTimeout: undefined, ackBatchSize: 0 };
        this._heartbeat = null;
        this.messageState = { inGroup: false, currentSow: null, mergedHeader: false, recordsRemaining: 0, publishHeader: null };
        // Assigning the default error handler
        this._errorHandler = function (error) {
            var prefix = new Date().toISOString() + ' [' + (_this._name ? 'client: ' + _this._name : 'ERROR') + '] >>>';
            if (error.name && error.message) {
                console.error(prefix, error.name + ':', error.message);
            }
            else {
                console.error(prefix, error);
            }
        };
        /**
         * This is a private internal method that sends a batch ack message.
         * @param {string} topic The topic value.
         * @returns 0 if no actual ack command were sent, 1 otherwise.
         * @private
         * @hidden
         */
        this._ack = function (topic) {
            var bookmarks = _this._ackBatch.toAck[topic];
            if (bookmarks !== undefined && bookmarks.length > 0) {
                _this.execute(new command_1.Command('sow_delete').topic(topic).bookmark(bookmarks.join(',')));
                _this._ackBatch.toAck[topic] = [];
                return 1;
            }
            return 0;
        };
        /**
         * This is a private internal method that is invoked upon ackTimeout timer event.
         * @private
         * @hidden
         */
        this._onAckTimer = function () {
            // if auto ack is off, short circuit
            if (!_this._autoAck || !_this._isConnected) {
                return;
            }
            // Acknowledge messages
            Object.keys(_this._ackBatch.toAck).map(function (topic) { return _this._ack(topic); });
            // reset the timer (if it's non-zero)
            if (_this._ackBatch.ackTimeout) {
                _this._ackBatch.ackTimeoutTimerId = setTimeout(_this._onAckTimer.bind(_this), _this._ackBatch.ackTimeout);
            }
        };
        /**
         * This is a helper method that creates a command handler for the client.
         * @param {(message: Message) => void} messageHandler A callback for a message/requested ack message
         * @param {function} resolve a callback for execution report (success)
         * @param {function} reject a callback for execution report (failure)
         * @param {string} acks command-required ackType(s).
         * @param {string} userAcks ackTypes requested by a user.
         * @param {string} commandName the name of the command.
         * @param {string} subscriptionId the id of the subscription (can be either a command id or a subscription id).
         * @private
         * @hidden
         */
        this.makeCommandHandler = function (messageHandler, resolve, reject, systemAcks, userAcks, commandName, subscriptionId) {
            if (commandName === 'logon') {
                _this.subscriptions[subscriptionId] = function (message) {
                    if (message.c === 'ack') {
                        if (message.a === 'processed') {
                            // Detect error/success
                            var response = { commandId: subscriptionId, message: message };
                            if (message.status === 'failure') {
                                reject(response);
                            }
                            else {
                                resolve(response);
                                delete _this.subscriptions[subscriptionId];
                            }
                        }
                    }
                };
                return;
            }
            // Parse the acks into lists of unique values
            var parsedUserAcks = Client.parseAcks(userAcks);
            var parsedSystemAcks = Client.parseAcks(systemAcks);
            var resolveCalled = false;
            // If the command is a subscribe type
            var isSubscribe = [
                'subscribe', 'sow_and_subscribe', 'delta_subscribe', 'sow_and_delta_subscribe'
            ].indexOf(commandName) >= 0;
            // non-logon command
            _this.subscriptions[subscriptionId] = function (message) {
                // cancel the timeout (if any)
                clearTimeout(_this.timeouts[message.cid]);
                delete _this.timeouts[message.cid];
                // Detect an Ack message
                if (message.c === 'ack') {
                    if (message.a === 'processed') {
                        // Detect failure/retry/success
                        if (message.status === 'failure') {
                            if (reject) {
                                reject(new Error(message.reason));
                            }
                        }
                        // retry case - perhaps need to update the token
                        else if (message.status === 'retry') {
                            _this.connection.close(4000, 'Authentication token/password must be updated/renewed');
                            return;
                        }
                        else {
                            if (message.opts !== undefined) {
                                // try to find max_backlog option, and if found, adjust the batchSize accordingly
                                var maxBacklogValue = Client.maxBacklogRegex.exec(message.opts)[1];
                                // if we have a max backlog value, we ignore still in favor of timeout (if set)
                                if (maxBacklogValue !== undefined && !_this._ackBatch.ackTimeout) {
                                    if (_this._ackBatch.ackBatchSize > +maxBacklogValue) {
                                        _this._ackBatch.ackBatchSize = +maxBacklogValue;
                                    }
                                }
                            }
                            if (resolve) {
                                resolve(subscriptionId);
                            }
                        }
                    }
                    var userAckIndex = parsedUserAcks.indexOf(message.a);
                    var ackIndex = parsedSystemAcks.indexOf(message.a);
                    // Detect if the message should be reported to the message handler
                    if (userAckIndex >= 0 && messageHandler) {
                        // Deliver the message
                        message = message_1.Message.fromObject(message);
                        messageHandler(message);
                    }
                    // Delete acks from the delivery lists
                    if (ackIndex >= 0) {
                        parsedSystemAcks.splice(ackIndex, 1);
                    }
                    if (userAckIndex >= 0) {
                        parsedUserAcks.splice(userAckIndex, 1);
                    }
                    // Delete the handler after getting all the acknowledgment messages in order to not overflow the heap
                    if (parsedUserAcks.length === 0 && parsedSystemAcks.length === 0) {
                        if (!isSubscribe) {
                            delete _this.subscriptions[subscriptionId];
                        }
                    }
                }
                // Timeout error
                else if (message.c === 'timeout') {
                    reject({ commandId: subscriptionId, message: message });
                }
                else if (messageHandler) {
                    // assign a header wrapper
                    message = message_1.Message.fromObject(message);
                    // a message for a bookmark subscription
                    // detect queue messages
                    var isQueue = message.lp !== undefined;
                    if (message.bm && _this._bookmarkStore && !isQueue) {
                        if (!_this._bookmarkStore.isDiscarded(message)) {
                            // log the bookmark
                            _this._bookmarkStore.log(message);
                            messageHandler(message);
                        }
                    }
                    // if this is a queue and auto-ack is enabled
                    else if (isQueue && _this._autoAck) {
                        // if the message handler does not throw an exception, ack the message
                        try {
                            messageHandler(message);
                            _this.ack(message);
                        }
                        catch (err) {
                            _this.onError(err);
                        }
                    }
                    else {
                        // simply deliver the message
                        messageHandler(message);
                    }
                    // if no acks were expected and the first message is an actual message, resolve the command
                    if (resolve && !resolveCalled) {
                        resolve(subscriptionId);
                        resolveCalled = true;
                    }
                }
            };
        };
        /**
         * This internal method invokes the corresponding callback handler (if any), based on id.
         * @param {string} id the id of the message to handle.
         * @param {any} message message to handle.
         * @private
         * @hidden
         */
        this.invokeHandler = function (id, message) {
            var handler = _this.subscriptions[id];
            var isAck = message.c === 'ack';
            // process persisted ack first
            try {
                if (isAck && message.a === 'persisted') {
                    _this.persistedAckReceived(message);
                }
                // deliver the message
                if (handler) {
                    handler(message);
                }
                else if (isAck && !handler) {
                    var ackHandler = _this.subscriptions[message.cid];
                    if (ackHandler) {
                        ackHandler(message);
                    }
                }
                else if (!isAck && _this._lastChanceMessageHandler) {
                    _this._lastChanceMessageHandler(message);
                }
            }
            catch (err) {
                if (_this._errorHandler) {
                    _this._errorHandler(err);
                }
            }
        };
        /**
         * This internal method reacts to a persisted ack message received in order to update publish and bookmark stores.
         *
         * @param {Message} message The persisted ack message.
         * @private
         * @hidden
         */
        this.persistedAckReceived = function (message) {
            var handled = false;
            var reason = message.reason;
            // publish store
            if (_this._publishStore && message.s !== undefined) {
                var sequenceId = BigInteger(message.s);
                // Write Failure occurred, let's replay this single message
                if (_this._failedWriteHandler
                    && (['duplicate', 'not entitled'].indexOf(reason) >= 0 || message.status === 'failure')) {
                    _this._publishStore.replaySingle(function (header, data) {
                        _this._failedWriteHandler(message_1.Message.fromObject(__assign(__assign({}, header), { data: data })), reason);
                    }, sequenceId);
                }
                handled = true;
                // there is persisted record update for this client, let's discard persisted messages
                _this._publishStore.discardUpTo(sequenceId);
                var lastPersisted = _this._publishStore.lastPersisted();
                if (lastPersisted !== null && _this.sequenceId.compare(lastPersisted) <= 0) {
                    _this.sequenceId = lastPersisted;
                }
            }
            else if (_this._failedWriteHandler
                && (['duplicate', 'not entitled'].indexOf(reason) >= 0 || message.status === 'failure')) {
                _this._failedWriteHandler(message, reason);
                handled = true;
            }
            // bookmark store
            var isQueue = message.lp !== undefined;
            if (!handled && _this._bookmarkStore && message.sub_id !== undefined && message.bm !== undefined && !isQueue) {
                if (message.status === 'success' && _this.subscriptions[message.sub_id] !== undefined) {
                    if (message.bm.length > 1) {
                        handled = true;
                        // report that all other messages have been persisted
                        _this._bookmarkStore.persisted(message.sub_id, new bookmark_field_1.BookmarkField(message.bm));
                    }
                }
            }
            // still not handled, send to last chance handler, if any
            if (!handled && _this._lastChanceMessageHandler) {
                _this._lastChanceMessageHandler(message);
            }
        };
        /**
         * This internal method is called upon receiving a heartbeat message from the server. It verifies if it's time to
         * send a heartbeat message by verifying that the timedelta between current time and last timestamp is > pulse
         * interval. If the method is forced to do so, the timestamp value is ignored.
         *
         * @param {boolean} force If the heartbeat message MUST be sent.
         * @private
         * @hidden
         */
        this.checkAndSendHeartbeat = function (force) {
            if (!_this._heartbeat || (_this._heartbeat && !_this._heartbeat.timestamp)) {
                return;
            }
            // timer expired, let's send the HB message (or maybe we just do it)
            if (force || (new Date().getTime() - _this._heartbeat.timestamp.getTime()) > _this._heartbeat.interval * 1000) {
                // assign the new timestamp
                _this._heartbeat.timestamp = new Date();
                // reset the heartbeat timeout timer
                clearTimeout(_this._heartbeat.timeoutId);
                _this._heartbeat.timeoutId = setTimeout(_this._heartbeat.onHeartbeatAbsence.bind(_this), _this._heartbeat.timeout * 1000);
                // Do the beat
                _this.execute(new command_1.Command('heartbeat').options('beat'));
            }
        };
        /**
         * This internal method is being invoked by the WebSocket connection's onmessage event handler.
         *
         * State Machine:
         *    SOW command
         *    |- 'ack' failure
         *    |     |- done
         *    |- 'ack' success
         *    |- 'group_begin'
         *    |- 0 or more of 'sow' batch  (bs contains number of records following)
         *    |     |- record header
         *    |     |- record data
         *    |- 'group_end'
         *    |- done
         *
         * @param event message event from the WebSocket connection.
         * @private
         * @hidden
         */
        this.onMessage = function (event) {
            var state = _this.messageState;
            try {
                var message = void 0;
                if (!state.recordsRemaining) {
                    // Message body
                    if (state.publishHeader) {
                        // This event contains data for our last publish.
                        try {
                            state.publishHeader.data = _this.typeHelper.deserialize(event.data);
                        }
                        catch (err) {
                            // if there was a parsing error, we still need to expect new message after, thus the header = 0
                            state.publishHeader = null;
                            throw err;
                        }
                        var subIds = state.publishHeader.sids.split(',');
                        for (var _i = 0, subIds_1 = subIds; _i < subIds_1.length; _i++) {
                            var subId = subIds_1[_i];
                            _this.invokeHandler(subId, state.publishHeader);
                        }
                        state.publishHeader = null;
                        return;
                    }
                    // Otherwise, this is the message header.
                    message = JSON.parse(event.data);
                    if (message.s !== undefined) {
                        message.s = Client.seqRegex.exec(event.data)[1];
                    }
                    switch (message.c) {
                        case 'p':
                        case 'publish':
                        case 'oof':
                            // special case -- no data (length = 0)
                            if (message.l === 0) {
                                message.data = null;
                                var subIds = message.sids.split(',');
                                for (var _a = 0, subIds_2 = subIds; _a < subIds_2.length; _a++) {
                                    var subId = subIds_2[_a];
                                    _this.invokeHandler(subId, message);
                                }
                                return;
                            }
                            state.publishHeader = message;
                            break;
                        case 'sow':
                            state.currentSow = message;
                            state.mergedHeader = false;
                            state.recordsRemaining = message.bs; // batch size
                            break;
                        case 'group_begin':
                            state.inGroup = true;
                            _this.invokeHandler(message.query_id, message);
                            break;
                        case 'group_end':
                            state.inGroup = false;
                            _this.invokeHandler(message.query_id, message);
                            break;
                        case 'ack':
                            _this.invokeHandler(message.query_id ? message.query_id : message.sub_id ? message.sub_id : message.cid, message);
                            break;
                        case 'heartbeat':
                            if (_this._heartbeat && _this._heartbeat.timestamp) {
                                var timedelta = new Date().getTime() - _this._heartbeat.timestamp.getTime();
                                // if the interval is > than the timeout, let's send HB immediately
                                if (_this._heartbeat && timedelta > _this._heartbeat.interval * 1000) {
                                    _this.checkAndSendHeartbeat(true);
                                }
                            }
                            return;
                    }
                    // just sync heartbeat info (if needed)
                    if (_this._heartbeat) {
                        _this.checkAndSendHeartbeat(false);
                    }
                }
                else {
                    // SOW Batch Processing Logic - Message header
                    if (!state.mergedHeader) {
                        message = JSON.parse(event.data);
                        state.currentSow.k = message.k;
                        state.currentSow.x = message.x;
                        state.currentSow.ts = message.ts;
                        state.mergedHeader = true;
                    }
                    // SOW Batch - Message body
                    else {
                        // Adjust these before a possible parsing failure
                        state.mergedHeader = false;
                        --(state.recordsRemaining);
                        // this can fail, but we're good since we adjusted state machine
                        state.currentSow.data = _this.typeHelper.deserialize(event.data);
                        _this.invokeHandler(state.currentSow.query_id, state.currentSow);
                    }
                }
            }
            catch (e) {
                _this.onError({
                    name: '997',
                    message: 'Error ' + e.message + ' encountered while processing message (' + event.data + ') from AMPS',
                    stack: null
                });
            }
        };
        /**
         * This is a private internal method that broadcasts the connection state change to the subscribers.
         * @param {number} connectionState the new connection state.
         * @private
         * @hidden
         */
        this._broadcastStateChange = function (connectionState) {
            for (var listenerId in _this._connectionStateListeners) {
                if (_this._connectionStateListeners[listenerId]) {
                    _this._connectionStateListeners[listenerId](connectionState);
                }
            }
        };
        this._publishInternal = function (pubType, topic, data, params) {
            // if params are used - let's send it through the execute interface (full mode)
            if (params) {
                _this.execute(new command_1.Command(pubType).topic(topic).data(data).addParams(params));
                return;
            }
            var header = { c: pubType, t: topic };
            // if we have a publish store, persist messages
            if (_this._publishStore) {
                header.a = 'persisted';
                // Increment the sequence id for the next publish
                _this.sequenceId = _this.sequenceId.next();
                header.s = _this.sequenceId.toString();
                // store the message
                _this._publishStore.store(__assign(__assign({}, header), { data: data }));
            }
            else if (!_this.connection || !_this._isConnected) {
                throw new Error('Must connect before sending data');
            }
            if (_this.connection && _this._isConnected) {
                var serializedHeader = JSON.stringify(header);
                var sizeBuffer = void 0;
                // serialize data
                data = _this.typeHelper.serialize(data);
                sizeBuffer = type_helper_1.TypeHelper.littleEndianSizeBuffer(data.length + 1);
                try {
                    // pass the size to the transport filter, if provided
                    if (_this._transportFilter) {
                        _this._transportFilter(sizeBuffer, true);
                    }
                    _this.connection.send(sizeBuffer);
                    // pass data to the transport filter, if provided
                    if (_this._transportFilter) {
                        _this._transportFilter(serializedHeader, true);
                    }
                    _this.connection.send(serializedHeader);
                    if (data.length === 1) {
                        if (_this._transportFilter) {
                            _this._transportFilter(data[0], true);
                        }
                        _this.connection.send(data[0]);
                    }
                    else {
                        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                            var item = data_1[_i];
                            // pass data to the transport filter, if provided
                            if (_this._transportFilter) {
                                _this._transportFilter(item, true);
                            }
                            _this.connection.send(item);
                        }
                    }
                }
                catch (err) { } // only connection error can occur ATM, and it's handled already
            }
        };
        this._name = name ? name : 'AMPS-JavaScript-' + new Date().getTime();
    }
    /**
     * This is a convenience static method that creates a memory-backed client that tracks
     * bookmarks and subscriptions in memory. Subscriptions are automatically restored after a reconnection using
     * [[DefaultSubscriptionManager]] object. [[MemoryBookmarkStore]] is enabled for bookmarks, [[MemoryPublishStore]]
     * is enabled for publishing messages.
     *
     * @param {string} name Unique name for the client (important for queues and sow). It is strongly recommended to
     * set a client name, but if it's not set, it'll be assigned automatically.
     * @returns {Client} a highly available [[Client]] instance.
     */
    Client.createMemoryBacked = function (name) {
        return new Client(name)
            .subscriptionManager(new default_subscription_manager_1.DefaultSubscriptionManager())
            .bookmarkStore(new memory_bookmark_store_1.MemoryBookmarkStore())
            .publishStore(new memory_publish_store_1.MemoryPublishStore());
    };
    /**
     * This is a private internal method that parses a string with acks (ex: 'processed,completed') into a list of
     * predefined ackTypes. Clears bad types, duplicates, etc. Returns an empty list if the ack string is empty, null,
     * or does not contain any valuable information.
     * @param {string[]} ackStrings the string to parse.
     * @private
     * @hidden
     */
    Client.parseAcks = function () {
        var ackStrings = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            ackStrings[_i] = arguments[_i];
        }
        if (!ackStrings) {
            return [];
        }
        // non-string, null, undefined, etc.
        var acksInfo = {
            received: false,
            processed: false,
            completed: false,
            persisted: false,
            stats: false
        };
        for (var _a = 0, ackStrings_1 = ackStrings; _a < ackStrings_1.length; _a++) {
            var ackString = ackStrings_1[_a];
            if (!ackString) {
                continue;
            }
            ackString.split(',').map(function (ack) { if (acksInfo[ack] !== undefined) {
                acksInfo[ack] = true;
            } });
        }
        return Object.keys(acksInfo).filter(function (ack) { return acksInfo[ack]; });
    };
    /**
     * This method returns the server version returned by the AMPS server in the logon acknowledgement.
     * If logon has not been performed yet, returns null.
     * @returns {string} The version of the AMPS server.
     */
    Client.prototype.serverVersion = function () {
        return this._serverVersion;
    };
    /**
     * This method returns the server version returned by the AMPS server in the logon acknowledgement in a form
     * of an integer XXYYZZWWW. For example, for 5.2.1.22 will be represented as `050201022`.
     * If logon has not been performed yet, returns 0.
     * @returns {number} The version of the AMPS server.
     */
    Client.prototype.serverVersionAsInt = function () {
        return this._serverIntVersion;
    };
    /**
     * This method is a setter/getter for the client's name.
     * If logon has not been performed yet and the name was not set, returns null.
     *
     * When a transaction log is present, AMPS requires the Client Name for a publisher to be:
     *
     * - Unique within a set of replicated AMPS instances
     * - Consistent from invocation to invocation if the publisher will be publishing the same logical stream
     *   of messages
     *
     * 60East recommends always using consistent, unique client names.
     *
     * @param {string} name The name of the AMPS client instance.
     * @returns {Client | string} The client object if the setter is called. The name of the AMPS
     * client instance (if any) otherwise.
     */
    Client.prototype.name = function (name) {
        if (name && name.length > 0) {
            if (this._isConnected) {
                throw new Error('Cannot set the client name when connected');
            }
            this._name = name;
            return this;
        }
        return this._name;
    };
    /**
     * This method is a getter for the client's name hash value. If logon has not been performed yet
     * and the name hash value was not set, returns null.
     *
     * Here's an example of a name hash value: `5934099655320710513`. This corresponds to the name `Test`.
     *
     * @returns {string} The name hash value of this client instance.
     */
    Client.prototype.nameHash = function () {
        return this._nameHash;
    };
    /**
     * This static method returns a version of the AMPS client.
     * @returns {string} The version of this AMPS client.
     */
    Client.version = function () {
        return '5.3.4.0.377383.60b2fcc';
    };
    /**
     * This is the private method that sends commands to an AMPS server. It's allowed to use it outside for
     * specific purposes such as custom subscription manager implementations. Please reach our specialists if
     * you're implementing something like that.
     *
     * @param {Header} header The header object to send.
     * @param {any} data The data to send.
     * @param {number} timeout The timeout in milliseconds to send the message and get a response.
     * @private
     * @hidden
     */
    Client.prototype.send = function (header, data, timeout) {
        var _this = this;
        if (!this.connection) {
            throw new Error('Must connect before sending data');
        }
        // short circuit - cannot send non-logon commands before connect and logon
        if (!this._isConnected && header.c !== 'logon') {
            return;
        }
        // set the command timeout, if any
        if (timeout !== undefined && timeout > 0) {
            this.timeouts[header.cid] = setTimeout(function () { return _this.onTimeout(header.cid); }, timeout);
        }
        // serialize the header
        var finalHeader = __assign({}, header);
        delete finalHeader._subscription;
        delete finalHeader.bookmarkSeqNo;
        var serializedHeader = JSON.stringify(finalHeader);
        var sizeBuffer;
        // a command without data
        if (!data) {
            sizeBuffer = type_helper_1.TypeHelper.littleEndianSizeBuffer(1);
            // pass the size to the transport filter, if provided
            if (this._transportFilter) {
                this._transportFilter(sizeBuffer, true);
            }
            this.connection.send(sizeBuffer);
            // pass data to the transport filter, if provided
            if (this._transportFilter) {
                this._transportFilter(serializedHeader, true);
            }
            this.connection.send(serializedHeader);
        }
        // command with data, probably publish
        else {
            // serialize data
            data = this.typeHelper.serialize(data);
            sizeBuffer = type_helper_1.TypeHelper.littleEndianSizeBuffer(data.length + 1);
            // pass the size to the transport filter, if provided
            if (this._transportFilter) {
                this._transportFilter(sizeBuffer, true);
            }
            this.connection.send(sizeBuffer);
            // pass data to the transport filter, if provided
            if (this._transportFilter) {
                this._transportFilter(serializedHeader, true);
            }
            this.connection.send(serializedHeader);
            for (var _i = 0, data_2 = data; _i < data_2.length; _i++) {
                var item = data_2[_i];
                // pass data to the transport filter, if provided
                if (this._transportFilter) {
                    this._transportFilter(item, true);
                }
                this.connection.send(item);
            }
        }
    };
    /**
     * This is the private event that handles the execution of a command that has been timed out.
     * @param {string} commandId the id of a command to time out.
     * @private
     * @hidden
     */
    Client.prototype.onTimeout = function (commandId) {
        this.invokeHandler(commandId, { c: 'timeout', reason: 'The command has been timed out.' });
        delete this.subscriptions[commandId];
    };
    /**
     * This is a general method that is executed if an error occurred. It reports the error to the client's
     * connect() execution handler.
     * @param {Error} err the error to report.
     * @private
     * @hidden
     */
    Client.prototype.onError = function (err) {
        // Report the general error to the error handler (if any)
        if (this._errorHandler) {
            this._errorHandler(err);
        }
    };
    /**
     * This is a method that is only used with external modules like SubscribeManager. Reports the connection
     * status of the client.
     *
     * @returns {boolean} The connection status.
     * @hidden
     */
    Client.prototype.isConnected = function () {
        return this._isConnected;
    };
    /**
     * This is a method that is only used with external modules like SubscribeManager. Provides next available id
     * for a command/message.
     *
     * @returns {string} The sub/command id.
     * @hidden
     */
    Client.prototype.nextSubId = function () {
        return "auto".concat(this._nextSubId++);
    };
    /**
     * This method replaces a message handler for a subscription. It is only used by a SubscribeManager object.
     * It is not intended to be used otherwise.
     *
     * @param {string} subId The subscription id.
     * @param {(message: Message) => void} messageHandler The message handler function.
     * @hidden
     */
    Client.prototype.setMessageHandler = function (subId, messageHandler) {
        if (this.subscriptions) {
            this.subscriptions[subId] = messageHandler;
        }
    };
    /**
     * This is the command execution interface method that allows to send commands that don't have a convenience
     * method or require
     * additional settings that are not provided by the convenience methods.
     * The purpose of the method is to execute Command objects.
     *
     * ```javascript
     * const subCommand = new Command('subscribe')
     *   .topic('messages')
     *   .filter('/id > 20');
     *
     * const commandId = await client.execute(subCommand, message => {
     *     console.log('message: ', message.data);
     * });
     *
     * console.log('commandId: ', commandId);
     * ```
     * @param {Command} command a Command object.
     * @param {(message: Message) => void} handler a callback to report the messages (including ack messages if they
     * were requested).
     * @param {number} timeout a timeout value for the command execution in milliseconds.
     * @returns {Promise<string>} The promise object fulfilled with the command id created.
     */
    Client.prototype.execute = function (command, handler, timeout) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // set the command id and the initial (empty) ack type
            command.commandId(_this.nextSubId());
            var systemAckType = '';
            var notSow = false;
            var isSubscribe = false;
            var isPublish = false;
            switch (command.command()) {
                case 'subscribe':
                case 'delta_subscribe':
                    // bookmarked subscription
                    if (command.bookmark()) {
                        // bookmark store
                        if (_this._bookmarkStore) {
                            // request persisted ack
                            systemAckType = 'persisted,';
                            var bookmark = command.bookmark();
                            var bmSubId = command.subId() ? command.subId() : command.commandId();
                            if (bookmark === Client.Bookmarks.MOST_RECENT) {
                                command.bookmark(_this._bookmarkStore.mostRecent(bmSubId, true).toString());
                            }
                            else if (bookmark.length >= 5 || bookmark !== Client.Bookmarks.EPOCH) {
                                command.subId(bmSubId);
                                var _message = command.toMessage();
                                if (!_this._bookmarkStore.isDiscarded(_message)) {
                                    _this._bookmarkStore.log(_message);
                                    _this._bookmarkStore.discard(_message);
                                    _this._bookmarkStore.persisted(bmSubId, new bookmark_field_1.BookmarkField(bookmark));
                                }
                            }
                        }
                        else if (Client.Bookmarks.MOST_RECENT === command.bookmark()) {
                            command.bookmark(Client.Bookmarks.EPOCH);
                        }
                    }
                    // This is a non-sow command
                    notSow = true;
                /* falls through */
                case 'sow_and_subscribe':
                case 'sow_and_delta_subscribe':
                    if (!command.subId()) {
                        command.subId(command.commandId());
                    }
                    isSubscribe = true;
                /* falls through */
                case 'sow':
                    if (!notSow && !command.queryId()) {
                        command.queryId(command.subId() ? command.subId() : command.commandId());
                    }
                    systemAckType += 'processed';
                    // for SOW only, we get a completed ack so we know when to remove the handler
                    if (isSubscribe === false) {
                        systemAckType += ',completed';
                    }
                    // if a custom batchSize value is not set, it is 10 by default for SOW queries
                    if (!notSow && command.batchSize() === undefined) {
                        command.batchSize(10);
                    }
                    // Assign the handler
                    _this.makeCommandHandler(handler, resolve, reject, systemAckType, command.ackType(), command.command(), isSubscribe ? (command.queryId() ? command.queryId() : command.subId()) : command.commandId());
                    break;
                case 'unsubscribe':
                    if (!command.subId()) {
                        command.subId('all');
                    }
                    // delete all subscriptions
                    if (command.subId() === 'all') {
                        if (_this._subscriptionManager) {
                            _this._subscriptionManager.clear();
                        }
                        _this.subscriptions = {};
                    }
                    else {
                        if (_this._subscriptionManager) {
                            _this._subscriptionManager.unsubscribe(command.subId());
                        }
                        delete _this.subscriptions[command.subId()];
                    }
                /* falls through */
                // The below commands can have ack messages received, even though it can only be in the message handler
                case 'heartbeat':
                case 'stop_timer':
                    systemAckType = 'processed';
                /* falls through */
                case 'flush':
                    systemAckType = (command.ackType() && command.ackType().length) ?
                        command.ackType().slice() :
                        'processed';
                    // Assign the handler
                    _this.makeCommandHandler(handler, resolve, reject, systemAckType, command.ackType(), command.command(), isSubscribe ? command.subId() : command.commandId());
                    break;
                case 'sow_delete':
                case 'delta_publish':
                case 'publish':
                    isPublish = true;
                    // if we have a publish store, persist messages
                    if (_this._publishStore) {
                        systemAckType = 'persisted';
                        // Increment the sequence id for the next publish
                        _this.sequenceId = _this.sequenceId.next();
                        command.sequenceId(_this.sequenceId);
                    }
                    else {
                        systemAckType = '';
                    }
                    // Assign the handler (fall through) but only if a user requested an acknowledgment
                    if (command.ackType() !== undefined) {
                        _this.makeCommandHandler(handler, null, null, '', // never expect any acks for publish/delta publish in the command handler -
                        // catch only user-requested acks in onMessage
                        command.ackType(), command.command(), command.commandId());
                    }
                    // Resolve right away
                    resolve(command.commandId());
                    break;
                default: break;
            }
            // Add user-requested acks (those will be delivered in the message handler as well)
            if (command.ackType() !== undefined) {
                command.ackType(Client.parseAcks(systemAckType, command.ackType()).join(','));
            }
            else if (command.command() !== 'heartbeat') {
                command.ackType(systemAckType);
            }
            // Add credentials in case of the logon command
            if (command.command() === 'logon') {
                command.ackType('processed');
                if (_this._logonCorrelationId) {
                    command.correlationId(_this._logonCorrelationId);
                }
                command.rawHeader().version = "".concat(Client.version(), ":javascript");
                if (_this._logonOptions) {
                    command.options(_this._logonOptions);
                }
                command.clientName(_this._name);
                if (_this.username !== undefined) {
                    command.rawHeader().user_id = _this.username;
                    if (_this.password !== undefined && _this.password.length) {
                        command.rawHeader().pw = _this.password;
                    }
                }
                _this.makeCommandHandler(handler, resolve, reject, command.ackType(), '', command.command(), command.commandId());
            }
            // store the subscription if we have a subscription manager set
            if (isSubscribe && _this._subscriptionManager) {
                _this._subscriptionManager.subscribe(command.rawHeader(), _this.subscriptions[command.subId()]);
            }
            // Send the command
            try {
                if (isPublish && _this._publishStore) {
                    _this._publishStore.store(command.toMessage());
                }
                if (_this.connection) {
                    _this.send(command.rawHeader(), command.data(), timeout);
                }
            }
            catch (err) {
                reject(err);
            }
        });
    };
    /**
     * This method connects the AMPS client to the server. It automatically calls logon() upon successful connection.
     * If the [[ServerChooser]] is set, arguments are ignored.
     *
     * ```javascript
     * const client = new Client('my-application');
     *
     * try {
     *     await client.connect('ws://localhost:9100/amps/json');
     *
     *     // now the client is ready to send and receive any commands
     *     // ...
     * }
     * catch (err) {
     *     console.error('Connection error: ', err);
     * }
     * ```
     *
     * @param {string} uri The URI containing all required credentials/addresses/types.
     * @param {Authenticator} authenticator The authenticator object for custom authentication scenarios.
     * @see [[Authenticator]] for details.
     * @param {string} logonOptions The logon options, such as `pretty``.
     * @returns {Promise<Message>} The promise object with the result of fulfilling/failing the connection promise.
     */
    Client.prototype.connect = function (uri, authenticator, logonOptions) {
        var _this = this;
        var currentAuthenticator;
        // if there's no server chooser yet, create a default one
        var noChooser = this._serverChooser === null || this._serverChooser === undefined;
        if (noChooser) {
            if (uri) {
                var chooser = new default_server_chooser_1.DefaultServerChooser();
                chooser.add(uri, authenticator ? authenticator : new default_authenticator_1.DefaultAuthenticator());
                this._serverChooser = chooser;
            }
            else {
                throw new Error('No Server Chooser or URI Provided');
            }
        }
        // if there's no delay strategy set
        if (!this._delayStrategy) {
            // HAClient mode: if there's no delay strategy assigned, we're gonna use Exponential Delay with defaults
            if (!noChooser) {
                this._delayStrategy = new exponential_delay_strategy_1.ExponentialDelayStrategy();
            }
            // Else: Classic mode: if there's no chooser and no delay strategy, have classic behavior (don't reconnect)
        }
        // set the sequence id
        this.sequenceId = BigInteger(new Date().getTime().toString() + '000000');
        /**
         * This method is called when the delay timer is fired (i.e. it's time to attempt to create a connection).
         * @ignore
         */
        var onDelayTick = function (resolve, reject) {
            // reset delay tick (connection) timer id
            _this._connectionTimerId = undefined;
            var currentUri = _this._serverChooser.getCurrentURI();
            currentAuthenticator = _this._serverChooser.getCurrentAuthenticator();
            if (!currentAuthenticator) {
                currentAuthenticator = new default_authenticator_1.DefaultAuthenticator();
            }
            var parsedURI = helpers_1.Helpers.parseUri(currentUri);
            // validate the URI
            var pathComponents = parsedURI.path.split('/');
            var pathLen = pathComponents.length;
            var protocol = pathComponents[pathLen - 2].toLowerCase();
            var messageType;
            if (pathComponents.length > 2) {
                messageType = pathComponents[pathLen - 1];
            }
            else {
                messageType = '';
            }
            if (protocol !== 'amps') {
                throw new Error('Specification of message type requires amps protocol');
            }
            // if logon options were supplied
            if (logonOptions) {
                _this._logonOptions = logonOptions;
            }
            if (!_this._logonOptions) {
                _this._logonOptions = '';
            }
            // parse 'pretty' option (the only one supported ATM)
            if (parsedURI.queryKey.pretty === 'true' && _this._logonOptions.indexOf('pretty') < 0) {
                if (_this._logonOptions.length > 0) {
                    _this._logonOptions += ',pretty';
                }
                else {
                    _this._logonOptions = 'pretty';
                }
            }
            var connectionUri = parsedURI.source.split('?')[0];
            // Node.js
            if (helpers_1.IS_NODE || helpers_1.IS_ELECTRON) {
                var headers = {};
                if (parsedURI.user.length > 0 || parsedURI.password.length > 0) {
                    headers.Authorization = 'Basic ' +
                        Buffer.from(parsedURI.user + ':' + parsedURI.password).toString('base64');
                }
                _this.connection = new W3WebSocket(connectionUri, null, null, headers, null, {
                    maxReceivedFrameSize: 0x10000000000, // support large messages
                    assembleFragments: true
                });
            }
            // everything else
            else {
                _this.connection = new W3WebSocket(connectionUri);
            }
            _this.connection.binaryType = 'arraybuffer';
            _this.typeHelper = type_helper_1.TypeHelper.helper(messageType);
            _this._isConnected = false;
            _this.connection.onopen = function () {
                _this._isConnected = true;
                _this._broadcastStateChange(Client.ConnectionStateListener.Connected);
                _this.username = parsedURI.user;
                _this.password = parsedURI.password;
                try {
                    _this.connection.send(messageType === 'json' ? 'text' : 'binary');
                }
                // at this point onDelayTick has failed, the connection attempt has failed:
                // there's no need to handle it in any special way since the onclose method
                // will be called shortly after
                catch (err) {
                    return;
                }
                // Mark as connected and report success to the chooser, and reset the strategy
                _this._serverChooser.reportSuccess(_this.connection);
                if (_this._delayStrategy) {
                    _this._delayStrategy.reset();
                }
                // We're done here
                resolve();
            };
            _this.connection.onclose = function (event) {
                // onclose can only be called in case of a connection error, otherwise we null it first
                var reason = event.reason;
                if (reason.length === 0) {
                    switch (event.code) {
                        case 1002:
                            reason = 'The endpoint is terminating the connection due to a protocol error.';
                            break;
                        case 1003:
                            reason = 'Connection terminated: AMPS received data of a type it cannot accept';
                            break;
                        case 1006:
                            reason = 'Connection Failed';
                            break;
                        case 1007:
                            reason = "The endpoint is terminating the connection because a message was received that\n                            contained inconsistent data ";
                            break;
                        case 1009:
                            reason = 'Connection terminated: a data frame was received that is too large.';
                            break;
                        case 1011:
                            reason = "The server is terminating the connection because it encountered an unexpected\n                            condition that prevented it from fulfilling the request.";
                            break;
                        default:
                            reason = 'Unknown error';
                    }
                }
                onConnectionError({ name: event.code.toString(), message: reason }, resolve, reject);
            };
            _this.connection.onerror = function (event) { };
            _this.connection.onmessage = function (message) {
                // pass the incoming message if the transport filter is set
                if (_this._transportFilter) {
                    _this._transportFilter(message, false);
                }
                _this.onMessage(message);
            };
        };
        /**
         * This internal method is called upon a connection error.
         *
         * @param {Error} err An error object.
         * @param {function} resolve Promise-resolving function that needs to be bound to the onDelayTick method.
         * @param {function} reject Promise-rejecting function that needs to be bound to the onDelayTick method.
         */
        var onConnectionError = function (err, resolve, reject) {
            var wasConnected = _this._isConnected;
            var wasLoggedOn = _this._isLoggedOn;
            _this._isConnected = false;
            _this._isLoggedOn = false;
            // if we had a heartbeat, clear the timer
            if (_this._heartbeat) {
                clearTimeout(_this._heartbeat.timeoutId);
                _this._heartbeat.timestamp = null;
                delete _this._heartbeat.onHeartbeatAbsence;
            }
            // report failure to the chooser
            _this._serverChooser.reportFailure(err, _this.connection);
            _this._broadcastStateChange(Client.ConnectionStateListener.Disconnected);
            // wipe the previous connection object
            if (_this.connection) {
                _this.connection.onopen = null;
                _this.connection.onmessage = null;
                _this.connection.onerror = null;
                _this.connection.onclose = null;
                _this.connection.close();
            }
            _this.connection = null;
            // wipe previous subscriptions
            _this.subscriptions = {};
            // reset the state machine
            _this.messageState = {
                inGroup: false,
                currentSow: null,
                mergedHeader: false,
                recordsRemaining: 0,
                publishHeader: null
            };
            var onTimeoutInternal;
            // report disconnection to the disconnect handler instead of reconnecting ourselves
            if (_this._disconnectHandler) {
                reject(err);
                // report to the error handler as well if the connection error occurs after successful connection
                if (wasLoggedOn) {
                    _this.onError(err);
                }
                return _this._disconnectHandler(_this, err);
            }
            // if we were connected before
            if (wasLoggedOn || wasConnected) {
                // reconnect
                onTimeoutInternal = function () { return openConnection().then(beforeLogon).then(logon).then(afterLogon).catch(reject); };
            }
            // connecting for the first time or attempting to reconnect
            else {
                onTimeoutInternal = onDelayTick.bind(null, resolve, reject);
            }
            // attempting to reconnect/connect after a delay
            try {
                if (_this._delayStrategy) {
                    _this._connectionTimerId = setTimeout(onTimeoutInternal, _this._delayStrategy.getConnectWaitDuration(_this._serverChooser.getCurrentURI()));
                }
                else {
                    throw err;
                }
            }
            // if we're here, that's the RetryTimeExceeded error - that means we're giving up on connecting
            catch (err) {
                if (_this._delayStrategy) {
                    _this._delayStrategy.reset();
                }
                // report errors only after successfully connecting at least once
                if (wasLoggedOn || _this._nextSubId > 2) {
                    _this.onError(err);
                }
                _this.disconnect();
                reject(err);
            }
        };
        /**
         * This internal method initiates a new connection.
         * @ignore
         */
        var openConnection = function () {
            return new Promise(function (resolve, reject) {
                // classic mode - no autoreconnect
                if (!_this._delayStrategy) {
                    onDelayTick(resolve, reject);
                }
                else {
                    _this._connectionTimerId = setTimeout(function () {
                        try {
                            onDelayTick(resolve, reject);
                        }
                        // if we're here, that's the critical error - that means we're giving up on connecting
                        catch (err) {
                            var error = new Error(err.message + '\n' + _this._serverChooser.getError());
                            error.name = err.name;
                            _this.onError(error);
                            _this._delayStrategy.reset();
                            _this.disconnect();
                            reject(error);
                        }
                    }, _this._delayStrategy.getConnectWaitDuration(_this._serverChooser.getCurrentURI()));
                }
            });
        };
        /**
         * This internal method is being called right before the logon (mainly in order to use authenticator methods).
         * @ignore
         */
        var beforeLogon = function () {
            return currentAuthenticator
                .authenticate(_this.username, _this.password)
                .then(function (passwordHeader) { return _this.password = passwordHeader; })
                // if the authentication wasn't successful
                .catch(function (err) {
                _this.disconnect();
                throw err;
            });
        };
        /**
         * This internal method performs the logon command. Upon result, the promise object will be fulfilled.
         * of failure.
         * @ignore
         */
        var logon = function () {
            /**
             * This internal function is called once the ack for the logon command has been received. It's used for
             * setting up the serverVersion variable and proceed with the authenticator methods.
             *
             * @param {object} message The ack message from the server.
             * @returns The promise object.
             * @ignore
             */
            var uponLogonAttempt = function (result) {
                var message = result.message;
                return new Promise(function (resolve, reject) {
                    if (message.c === 'ack' && message.a === 'processed') {
                        switch (message.status) {
                            case 'success':
                                if (message.version.indexOf('develop') >= 0) {
                                    message.version = '5.3.4.0';
                                }
                                _this._serverVersion = message.version;
                                var versionParts = message.version.split('.');
                                _this._serverIntVersion =
                                    +(versionParts[0]) * Math.pow(10, 7)
                                        + +(versionParts[1]) * Math.pow(10, 5)
                                        + +(versionParts[2]) * Math.pow(10, 3)
                                        + +(versionParts[3]);
                                currentAuthenticator.completed(message.user_id, message.pw, message.reason || '');
                                // parse and assign the client hash value
                                try {
                                    _this._nameHash = message.bm.split('|')[0];
                                }
                                catch (err) { }
                                resolve(message);
                                break;
                            case 'retry':
                                _this.username = message.user_id;
                                currentAuthenticator.retry(message.user_id, message.pw)
                                    // if the authentication wasn't successful
                                    .catch(function (err) {
                                    _this.disconnect();
                                    throw err;
                                })
                                    .then(function (passwordHeader) {
                                    _this.password = passwordHeader;
                                    logon().then(resolve).catch(reject);
                                });
                                break;
                            // Failure case
                            default:
                                reject(Error(message.reason));
                        }
                    }
                });
            };
            return _this.execute(new command_1.Command('logon')).then(uponLogonAttempt);
        };
        /**
         * This internal method is being called upon successful logon. In case of the heartbeat option enabled, it
         * sets up and initiates the heartbeat protocol.
         * @ignore
         */
        var afterLogon = function (message) {
            _this._isLoggedOn = true;
            _this._broadcastStateChange(Client.ConnectionStateListener.LoggedOn);
            // add header methods
            if (message !== undefined) {
                message = message_1.Message.fromObject(message);
            }
            return new Promise(function (resolve, reject) {
                // enable heartbeat mode
                if (_this._heartbeat) {
                    establishHeartbeat();
                }
                // if we have a subscription manager restore subscriptions
                if (_this._subscriptionManager) {
                    _this._subscriptionManager.resubscribe(_this);
                    _this._broadcastStateChange(Client.ConnectionStateListener.Resubscribed);
                }
                // if we have a publish store, it's about time to republish not-persisted-yet messages
                if (_this._publishStore) {
                    // there is persistence record for this client, let's catch up
                    _this._publishStore.discardUpTo(message.header.sequenceId());
                    // after catching up, here's the new sequence id
                    var lastPersisted = _this._publishStore.lastPersisted();
                    if (lastPersisted !== null && _this.sequenceId.compare(lastPersisted) <= 0) {
                        _this.sequenceId = lastPersisted;
                    }
                    var self_1 = _this;
                    (function replayTry() {
                        try {
                            self_1._publishStore.replay(self_1.send.bind(self_1));
                            self_1._broadcastStateChange(Client.ConnectionStateListener.PublishReplayed);
                            // reset the ack timeout timer (if set)
                            if (self_1._ackBatch.ackTimeout) {
                                clearTimeout(self_1._ackBatch.ackTimeoutTimerId);
                                self_1._ackBatch.ackTimeoutTimerId = setTimeout(self_1._onAckTimer.bind(self_1), self_1._ackBatch.ackTimeout);
                            }
                            // finally resolve
                            resolve(message);
                        }
                        catch (err) {
                            if (self_1.connection && self_1._isLoggedOn) {
                                setTimeout(replayTry, 500);
                            }
                            // disconnected while replaying (retry again)
                            else {
                                onConnectionError(err, resolve, reject);
                            }
                        }
                    })();
                }
                else {
                    // reset the ack timeout timer (if set)
                    if (_this._ackBatch.ackTimeout) {
                        clearTimeout(_this._ackBatch.ackTimeoutTimerId);
                        _this._ackBatch.ackTimeoutTimerId = setTimeout(_this._onAckTimer.bind(_this), _this._ackBatch.ackTimeout);
                    }
                    // no publish store set, can just proceed
                    resolve(message);
                }
            });
        };
        /**
         * This function establishes the heartbeat mode after a successful logon.
         * @ignore
         */
        var establishHeartbeat = function () {
            _this._heartbeat.onHeartbeatAbsence = function () {
                // clear all timeouts
                clearTimeout(_this._heartbeat.timeoutId);
                _this._heartbeat.timestamp = null;
                _this._heartbeat.onHeartbeatAbsence = null;
                onConnectionError({
                    name: '4000',
                    message: 'Heartbeat absence error'
                }, function () { }, function () { });
            };
            // Starting from here, we have a heartbeat mode with the server enabled
            _this._heartbeat.timestamp = new Date();
            // Initiate the heartbeat procedure
            _this.execute(new command_1.Command('heartbeat').ackType('received').options('start,' + _this._heartbeat.interval), function (message) {
                if (message.c === 'ack' && message.a === 'received' && message.status === 'success') {
                    _this._broadcastStateChange(Client.ConnectionStateListener.HeartbeatInitiated);
                    // Set heartbeat timeout
                    if (_this._isLoggedOn && _this._heartbeat) {
                        _this._heartbeat.timeoutId = setTimeout(_this._heartbeat.onHeartbeatAbsence.bind(_this), _this._heartbeat.timeout * 1000);
                    }
                }
            }).catch(function (err) {
                _this.onError({
                    name: '4000',
                    message: 'Heartbeat connection error'
                });
            });
        };
        return openConnection().then(beforeLogon).then(logon).then(afterLogon);
    };
    Client.prototype.errorHandler = function (errorHandler) {
        if (typeof errorHandler === 'function') {
            this._errorHandler = errorHandler;
            return this;
        }
        return this._errorHandler;
    };
    Client.prototype.failedWriteHandler = function (failedWriteHandler) {
        if (typeof failedWriteHandler === 'function') {
            this._failedWriteHandler = failedWriteHandler;
            return this;
        }
        return this._failedWriteHandler;
    };
    Client.prototype.lastChanceMessageHandler = function (lastChanceMessageHandler) {
        if (typeof lastChanceMessageHandler === 'function') {
            this._lastChanceMessageHandler = lastChanceMessageHandler;
            return this;
        }
        return this._lastChanceMessageHandler;
    };
    /**
     * This method adds a connection state listener that will be called every time a connection state has been changed.
     *
     * ```javascript
     * const client = new Client();
     * const listenerId = client.addConnectionStateListener(state => {
     *     console.log('state: ', state);
     * });
     *
     * // ... later
     * client.removeConnectionStateListener(listenerId);
     * ```
     *
     * @param {(connectionState: number) => void} connectionStateListener The callback function that will be invoked
     * in case of a connection state change.
     * @returns {number} The unique monotonically increasing listener id that can be used to remove the listener later.
     */
    Client.prototype.addConnectionStateListener = function (connectionStateListener) {
        if (typeof connectionStateListener === 'function') {
            this._connectionStateListeners[this._stateListenerId] = connectionStateListener;
            return this._stateListenerId++;
        }
        throw new Error('Invalid connection state listener object was provided');
    };
    /**
     * This method removes a connection state listener with the id provided.
     *
     * ```javascript
     * const client = new Client();
     * const listenerId = client.addConnectionStateListener(state => {
     *     console.log('state: ', state);
     * });
     *
     * // ... later
     * client.removeConnectionStateListener(listenerId);
     * ```
     *
     * @param {number} connectionStateListener The callback function that will be invoked in case of a connection
     * state change.
     */
    Client.prototype.removeConnectionStateListener = function (connectionStateListenerId) {
        if (connectionStateListenerId) {
            try {
                delete this._connectionStateListeners[connectionStateListenerId];
                return;
            }
            catch (err) { }
        }
        throw new Error('The connection state listener was not found');
    };
    Client.prototype.disconnectHandler = function (disconnectHandler) {
        if (disconnectHandler !== undefined && typeof disconnectHandler === 'function') {
            this._disconnectHandler = disconnectHandler;
            return this;
        }
        return this._disconnectHandler;
    };
    Client.prototype.transportFilter = function (transportFilter) {
        if (transportFilter !== undefined && typeof transportFilter === 'function') {
            this._transportFilter = transportFilter;
            return this;
        }
        return this._transportFilter;
    };
    /**
     * This method sets up the heartbeat mode with the server. It sends a command to AMPS that starts or refreshes
     * a heartbeat timer. When a heartbeat timer is active, AMPS publishes periodic heartbeat messages to AMPS and
     * expects the client to respond with a heartbeat message. If the client does not provide a heartbeat within the
     * time specified, AMPS logs an error and disconnects the connection.
     *
     * ```javascript
     * // Initialize a client with the heartbeat of 5 seconds
     * const client = new Client().heartbeat(5);
     * ```
     *
     * @param {number} interval the heartbeat value in seconds.
     * @param {number} timeout the timeout value in seconds. By default it is the heartbeat interval value times 2.
     * @returns {client} The Client object.
     */
    Client.prototype.heartbeat = function (interval, timeout) {
        // Set up the default timeout value
        if (timeout === undefined) {
            timeout = interval * 2;
        }
        this._heartbeat = {
            interval: interval,
            timeout: timeout
        };
        return this;
    };
    Client.prototype.logonOptions = function (logonOptions) {
        // setter mode
        if (logonOptions !== undefined) {
            if (this._isConnected) {
                throw new Error('Cannot set the logon options when connected');
            }
            this._logonOptions = logonOptions;
            return this;
        }
        return this._logonOptions;
    };
    Client.prototype.serverChooser = function (serverChooser) {
        // setter mode
        if (serverChooser !== undefined) {
            if (this._isConnected) {
                throw new Error('Cannot set the server chooser when connected');
            }
            this._serverChooser = serverChooser;
            return this;
        }
        return this._serverChooser;
    };
    Client.prototype.delayStrategy = function (delayStrategy) {
        // setter mode
        if (delayStrategy !== undefined) {
            this._delayStrategy = delayStrategy;
            return this;
        }
        return this._delayStrategy;
    };
    /**
     * This method sets a reconnection delay for the client. This is a convenience method that sets up a
     * [[FixedDelayStrategy]] with a requested delay value.
     *
     * ```javascript
     * // create a client and set a reconnect delay
     * const client = new Client().reconnectDelay(5000);
     * ```

     * @param {number} delay=200 The delay between reconnection attempts in milliseconds.
     * @returns {Client} The client object.
     * @see [[Client.delayStrategy]] for more flexible controls over reconnection logic.
     */
    Client.prototype.reconnectDelay = function (delay) {
        if (delay === void 0) { delay = 200; }
        this._delayStrategy = new fixed_delay_strategy_1.FixedDelayStrategy((delay >= 0) ? delay : 200);
        return this;
    };
    Client.prototype.subscriptionManager = function (subscriptionManager) {
        if (subscriptionManager !== undefined) {
            this._subscriptionManager = subscriptionManager;
            return this;
        }
        return this._subscriptionManager;
    };
    Client.prototype.logonCorrelationId = function (logonCorrelationId) {
        if (logonCorrelationId !== undefined) {
            if (this._isConnected) {
                throw new Error('Cannot set the logon correlation id when connected');
            }
            this._logonCorrelationId = logonCorrelationId;
            return this;
        }
        return this._logonCorrelationId;
    };
    Client.prototype.publishStore = function (publishStore) {
        if (publishStore !== undefined) {
            if (this._isConnected) {
                throw new Error('Cannot set the publish store when connected');
            }
            this._publishStore = publishStore;
            return this;
        }
        return this._publishStore;
    };
    Client.prototype.bookmarkStore = function (bookmarkStore) {
        if (bookmarkStore !== undefined) {
            if (this._isConnected) {
                throw new Error('Cannot set the bookmark store when connected');
            }
            this._bookmarkStore = bookmarkStore;
            return this;
        }
        return this._bookmarkStore;
    };
    Client.prototype.autoAck = function (autoAck) {
        if (autoAck !== undefined) {
            this._autoAck = autoAck;
            // Kill the ack timer (if any)
            clearTimeout(this._ackBatch.ackTimeoutTimerId);
            // connected and just enabled auto acking
            if (this._isLoggedOn && this._autoAck && this._ackBatch.ackTimeout) {
                this._ackBatch.ackTimeoutTimerId = setTimeout(this._onAckTimer.bind(this), this._ackBatch.ackTimeout);
            }
            return this;
        }
        return this._autoAck;
    };
    Client.prototype.ackBatchSize = function (ackBatchSize) {
        var _this = this;
        if (typeof ackBatchSize === 'number') {
            if (ackBatchSize < 0) {
                throw new Error('Invalid acknowledgement batch size value');
            }
            this._ackBatch.ackBatchSize = ackBatchSize;
            // if auto ack is enabled
            if (this._autoAck) {
                // if we're connected
                if (this._isLoggedOn) {
                    // if the size of batch is full enough, let's ack the batches
                    Object.keys(this._ackBatch.toAck).map(function (topic) {
                        var currentBookmarks = _this._ackBatch.toAck[topic] || [];
                        if (_this._ackBatch.ackBatchSize <= currentBookmarks.length) {
                            _this._ack(topic);
                        }
                    });
                }
                // If no ackTimeout set, and the batch size > 1, establish the default timeout value (1000)
                if (ackBatchSize > 1 && this._ackBatch.ackTimeout === undefined) {
                    this._ackBatch.ackTimeout = 1000;
                    if (this._isLoggedOn) {
                        // since we're connected and just established a new timeout value, start timer as well
                        clearTimeout(this._ackBatch.ackTimeoutTimerId);
                        this._ackBatch.ackTimeoutTimerId = setTimeout(this._onAckTimer.bind(this), 1000);
                    }
                }
            }
            return this;
        }
        return this._ackBatch.ackBatchSize;
    };
    Client.prototype.ackTimeout = function (ackTimeout) {
        if (typeof ackTimeout === 'number') {
            if (ackTimeout < 0) {
                throw new Error('Invalid acknowledgment batch timeout value');
            }
            this._ackBatch.ackTimeout = ackTimeout;
            // kill the previous timer (if any)
            clearTimeout(this._ackBatch.ackTimeoutTimerId);
            // start calling the onAckTick method with the new timeout value
            if (this._autoAck && this._isLoggedOn && ackTimeout > 0) {
                this._ackBatch.ackTimeoutTimerId = setTimeout(this._onAckTimer.bind(this), ackTimeout);
            }
            return this;
        }
        return this._ackBatch.ackTimeout;
    };
    /**
     * This method disconnects the client from an AMPS server (if the connection existed).
     * @returns The promise object fulfilled once disconnection is finished.
     */
    Client.prototype.disconnect = function () {
        var _this = this;
        this._broadcastStateChange(Client.ConnectionStateListener.Shutdown);
        // clear connection timeout, if any
        if (this._connectionTimerId) {
            clearTimeout(this._connectionTimerId);
            this._connectionTimerId = undefined;
        }
        return new Promise(function (resolve, reject) {
            var destroyConnection = function () {
                _this._isConnected = false;
                _this._isLoggedOn = false;
                // take care of heartbeat
                if (_this._heartbeat) {
                    clearTimeout(_this._heartbeat.timeoutId);
                    _this._heartbeat.timestamp = null;
                    delete _this._heartbeat.onHeartbeatAbsence;
                }
                // delete all timeouts
                for (var timeoutId in _this.timeouts) {
                    clearTimeout(_this.timeouts[timeoutId]);
                    delete _this.timeouts[timeoutId];
                }
                // delete all subscriptions
                for (var subId in _this.subscriptions) {
                    delete _this.subscriptions[subId];
                }
                // reset message state machine
                _this.messageState = {
                    inGroup: false,
                    currentSow: null,
                    mergedHeader: false,
                    recordsRemaining: 0,
                    publishHeader: null
                };
                // reset next id
                _this._nextSubId = 1;
                // reset the to ack map
                _this._ackBatch.toAck = {};
                // if still connected
                if (_this.connection) {
                    // null connection-related stuff
                    _this.username = null;
                    _this.password = null;
                    _this.connection.onclose = null;
                    _this.connection.onopen = null;
                    _this.connection.onerror = null;
                    // close the connection
                    _this.connection.close(1000, 'Disconnect from the client');
                    _this.connection = null;
                }
                _this._serverChooser = null;
                _this._delayStrategy = null;
                _this._subscriptionManager = null;
                // resolve the promise
                resolve();
            };
            // reset ack batch settings
            _this._autoAck = false;
            _this._ackBatch.ackBatchSize = 0;
            clearTimeout(_this._ackBatch.ackTimeoutTimerId);
            _this._ackBatch.ackTimeout = undefined;
            // send the acks that are not sent yet
            var ackTopics = Object.keys(_this._ackBatch.toAck);
            if (ackTopics.length > 0) {
                var ackCommandsSent = 0;
                for (var _i = 0, ackTopics_1 = ackTopics; _i < ackTopics_1.length; _i++) {
                    var topic = ackTopics_1[_i];
                    ackCommandsSent += _this._ack(topic);
                }
                if (ackCommandsSent > 0) {
                    _this.flush().then(function () { return destroyConnection(); }).catch(reject);
                }
                else {
                    destroyConnection();
                }
            }
            else {
                destroyConnection();
            }
        });
    };
    /**
     * Publish a message to an AMPS topic. If the client has a [[PublishStore]] set,
     * then the client will store the message before forwarding the message to AMPS.
     * This method does not wait for a response from the AMPS server. To detect failure,
     * set a [[Client.failedWriteHandler]]. If a disconnection occurs, the message is still
     * stored in the publish store.
     *
     * ```javascript
     * client.publish('topic', {id: 1});     // publish data as a native object
     * client.publish('topic', '{"id":1}');  // publish data as a string
     * ```
     *
     * Depending on the available [[TypeHelper]] for the message type used, data can be
     * published as a native object or a string -- the type helper can take care of the
     * serializing it before sending, if needed.
     *
     * @see [[TypeHelper]] for more details.
     *
     * @param {string} topic the topic to publish data.
     * @param data the data to publish to a topic.
     * @param {object} params an object with params, like: &#123;expiration: 30, ...&#125;
     */
    Client.prototype.publish = function (topic, data, params) {
        this._publishInternal('publish', topic, data, params);
    };
    /**
     * This method delta publishes a message to a SOW topic. If the client has a [[PublishStore]] set,
     * then the client will store the message before forwarding the message to AMPS.
     * This method does not wait for a response from the AMPS server. To detect failure,
     * set a [[Client.failedWriteHandler]]. If a disconnection occurs, the message is still
     * stored in the publish store.
     *
     * ```javascript
     * client.deltaPublish('topic', {id: 1, text: 'Hello, World'});
     * ```
     *
     * @param {string} topic the topic to publish data.
     * @param data the data to publish to a topic.
     * @param {object} params an object with params, like: &#123;expiration: 30, ...&#125;
     */
    Client.prototype.deltaPublish = function (topic, data, params) {
        this._publishInternal('delta_publish', topic, data, params);
    };
    Client.prototype.flush = function (tOrA, timeout) {
        var _this = this;
        if (!this._isConnected) {
            return Promise.reject(new Error('Cannot flush when not connected'));
        }
        var isAckType = typeof tOrA === 'string' && tOrA.length > 0;
        if (isAckType && tOrA !== 'persisted' && tOrA !== 'processed') {
            return Promise.reject(new Error('Flush only accepts processed or persisted ack types'));
        }
        var ackType = (isAckType && this._serverIntVersion >= 50303000) ? tOrA : 'processed';
        return new Promise(function (resolve, reject) {
            _this.execute(new command_1.Command('flush').ackType(ackType).clientName(_this._name), function (message) {
                if (message.c === 'ack' && message.a === ackType && message.status === 'success') {
                    resolve();
                }
                else {
                    reject(new Error(message.reason));
                }
            }, !isAckType && typeof tOrA === 'number' ? tOrA : timeout).catch(reject);
        });
    };
    /**
     * This method performs the __subscribe__ command. The __subscribe__ command is the primary way to retrieve messages
     * from the AMPS processing stream. A client can issue a __subscribe__ command on a topic to receive all published
     * messages to that topic in the future. Additionally, content filtering can be used to choose which messages the
     * client is interested in receiving.
     *
     * ```javascript
     * try {
     *     const subId = await client.subscribe(message => console.log(message.data), 'topic');
     *     console.log(subId);
     * }
     * catch (err) {
     *     console.error('err: ', err);
     * }
     * ```
     *
     * @param {(message: Message) => void} onMessage a message handler that will be called each time a message is
     * received.
     * @param {string} topic The topic argument in subscribe.
     * @param {string} filter The filter argument in subscribe.
     * @param {CommandParams} params The params like ackType, bookmark, commandId, etc in an object.
     * @returns {Promise<string>} The Promise object with the subscription id of the command.
     */
    Client.prototype.subscribe = function (onMessage, topic, filter, params) {
        if (typeof topic !== 'string') {
            throw 'The topic argument in subscribe must be a string, not a "' + (typeof topic) + '"';
        }
        if (typeof onMessage !== 'function') {
            throw 'The message handler argument in subscribe must be a function, not a "' + (typeof onMessage) + '"';
        }
        if (filter === undefined || filter === null) {
            filter = '';
        }
        else if (typeof filter !== 'string') {
            throw 'The filter argument in subscribe must be a string, not a "' + (typeof filter) + '"';
        }
        return this.execute(new command_1.Command('subscribe')
            .topic(topic)
            .filter(filter)
            .addParams(params), onMessage);
    };
    /**
     * This method performs the __sow__ command. The __sow__ command is use to query the contents of a previously
     * defined SOW Topic. A __sow__ command can be used to query an entire SOW Topic, or a filter can be used to further
     * refine the results found inside a SOW Topic. For more information, see the State of the World and SOW Queries
     * chapters in the AMPS User Guide.
     *
     * ```javascript
     * const sowHandler = message => {
     *     switch (message.header.command()) {
     *         case 'group_begin':
     *             console.log('--- Begin SOW Results ---');
     *             break;
     *
     *         case 'sow':
     *             console.log(message.data);
     *             break;
     *
     *         case 'group_end':
     *             console.log('--- End SOW Results ---');
     *             break;
     *     }
     * };
     *
     * try {
     *     const queryId = await client.sow(sowHandler, 'sow-topic');
     *     console.log(queryId);
     * }
     * catch (err) {
     *     console.error('err: ', err);
     * }
     * ```
     *
     * @param {(message: Message) => void} onMessage a message handler that will be called each time a message is
     * received.
     * @param {string} topic The topic argument in sow.
     * @param {string} filter The filter argument in sow.
     * @param {CommandParams} params The params like ackType, bookmark, commandId, etc in an object.
     * @returns {Promise<string>}  The Promise object with the query id of the command.
     */
    Client.prototype.sow = function (onMessage, topic, filter, params) {
        if (typeof topic !== 'string') {
            throw 'The topic argument in sow must be a string, not a "' + (typeof topic) + '"';
        }
        if (typeof onMessage !== 'function') {
            throw 'The message handler argument in sow must be a function, not a "' + (typeof onMessage) + '"';
        }
        if (filter === undefined || filter === null) {
            filter = '';
        }
        else if (typeof filter !== 'string') {
            throw 'The filter argument in sow must be a string, not a "' + (typeof filter) + '"';
        }
        return this.execute(new command_1.Command('sow')
            .topic(topic)
            .filter(filter)
            .addParams(params), onMessage);
    };
    /**
     * This method performs the __sow_and_subscribe__ command. A __sow_and_subscribe__ command is used to combine the
     * functionality of __sow__ and a __subscribe__ command in a single command. The __sow_and_subscribe__ command is
     * used
     *
     * * to query the contents of a SOW topic (this is the __sow__ command); and
     * * to place a subscription such that any messages matching the subscribed SOW topic and query filter will
     *      be published to the AMPS client (this is the __subscribe__ command). As with the __subscribe__ command,
     *      publish messages representing updates to SOW records will contain only information that has changed.
     *
     * ```javascript
     * try {
     *     const queryId = await client.sowAndSubscribe(
     *         message => console.log(message),
     *         'sow-topic'
     *     );
     *
     *     console.log(queryId);
     * }
     * catch (err) {
     *     console.error('err: ', err);
     * }
     * ```
     *
     * @see [[Client.sow]] for details about the message handler implementation.
     *
     * @param {(message: Message) => void} onMessage a message handler that will be called each time a message is
     * received.
     * @param {string} topic The topic argument in sow.
     * @param {string} filter The filter argument in sow.
     * @param {CommandParams} params The params like ackType, bookmark, commandId, etc in an object.
     * @returns {Promise<string>} The Promise object with the query id of the command.
     */
    Client.prototype.sowAndSubscribe = function (onMessage, topic, filter, params) {
        if (typeof topic !== 'string') {
            throw 'The topic argument in sow_and_subscribe must be a string, not a "' + (typeof topic) + '"';
        }
        if (typeof onMessage !== 'function') {
            throw 'The message handler arg in sow_and_subscribe must be a function, not a "' + (typeof onMessage) + '"';
        }
        if (filter === undefined || filter === null) {
            filter = '';
        }
        else if (typeof filter !== 'string') {
            throw 'The filter argument in sow_and_subscribe must be a string, not a "' + (typeof filter) + '"';
        }
        return this.execute(new command_1.Command('sow_and_subscribe')
            .topic(topic)
            .filter(filter)
            .addParams(params), onMessage);
    };
    /**
     * This method performs the __delta_subscribe__ command. The __delta_subscribe__ command is like the __subscribe__
     * command except that subscriptions placed through __delta_subscribe__ will receive only messages that have changed
     * between the SOW record and the new update. If __delta_subscribe__ is used on a record which does not currently
     * exist in the SOW or if it is used on a topic which does not have a SOW-topic store defined, then
     * __delta_subscribe__ behaves like a __subscribe__ command.
     *
     * ```javascript
     * try {
     *     const subId = await client.deltaSubscribe(message => console.log(message.data), 'topic');
     *     console.log(subId);
     * }
     * catch (err) {
     *     console.error('err: ', err);
     * }
     * ```
     *
     * @param {(message: Message) => void} onMessage a message handler that will be called each time a message is
     * received.
     * @param {string} topic The topic argument in sow.
     * @param {string} filter The filter argument in sow.
     * @param {CommandParams} params The params like ackType, bookmark, commandId, etc in an object.
     * @returns {Promise<string>} The Promise object with the subscription id of the command.
     */
    Client.prototype.deltaSubscribe = function (onMessage, topic, filter, params) {
        if (typeof topic !== 'string') {
            throw 'The topic argument in delta_subscribe must be a string, not a "' + (typeof topic) + '"';
        }
        if (typeof onMessage !== 'function') {
            throw 'The message handler arg in delta_subscribe must be a function, not a "' + (typeof onMessage) + '"';
        }
        if (filter === undefined || filter === null) {
            filter = '';
        }
        else if (typeof filter !== 'string') {
            throw 'The filter argument in delta_subscribe be a string, not a "' + (typeof filter) + '"';
        }
        return this.execute(new command_1.Command('delta_subscribe')
            .topic(topic)
            .filter(filter)
            .addParams(params), onMessage);
    };
    /**
     * This method performs the __sow_and_delta_subscribe__ command.
     * A __sow_and_delta_subscribe__ command is used to combine the functionality of commands __sow__ and a
     * __delta_subscribe__ in a single command. The __sow_and_delta_subscribe__ command is used
     *
     * * to query the contents of a SOW topic (this is the __sow__ command); and
     * * to place a subscription such that any messages matching the subscribed SOW topic and query filter
     *   will be published to the AMPS client (this is the __delta_subscribe__ command).
     *
     * As with the __delta_subscribe__ command, publish messages representing updates to SOW records will contain only
     * the information that has changed. If a __sow_and_delta_subscribe__ is issued on a record that does not currently
     * exist in the SOW topic, or if it is used on a topic that does not have a SOW-topic store defined,
     * then a __sow_and_delta_subscribe__ will behave like a __sow_and_subscribe__ command.
     *
     * ```javascript
     * try {
     *     const queryId = await client.sowAndDeltaSubscribe(
     *         message => console.log(message),
     *         'sow-topic'
     *     );
     *
     *     console.log(queryId);
     * }
     * catch (err) {
     *     console.error('err: ', err);
     * }
     * ```
     *
     * @param {(message: Message) => void} onMessage a message handler that will be called each time a message is
     * received.
     * @param {string} topic The topic argument in sow.
     * @param {string} filter The filter argument in sow.
     * @param {CommandParams} params The params like ackType, bookmark, commandId, etc in an object.
     * @returns {Promise<string>} The Promise object with the query id of the command.
     */
    Client.prototype.sowAndDeltaSubscribe = function (onMessage, topic, filter, params) {
        if (typeof topic !== 'string') {
            throw 'The topic argument in sow_and_delta_subscribe must be a string, not a "' + (typeof topic) + '"';
        }
        if (typeof onMessage !== 'function') {
            throw 'The message handler arg in sow_and_delta_subscribe must be a function, not a "' +
                (typeof onMessage) + '"';
        }
        if (filter === undefined || filter === null) {
            filter = '';
        }
        else if (typeof filter !== 'string') {
            throw 'The filter argument in sow_and_delta_subscribe must be a string, not a "' + (typeof filter) + '"';
        }
        return this.execute(new command_1.Command('sow_and_delta_subscribe')
            .topic(topic)
            .filter(filter)
            .addParams(params), onMessage);
    };
    /**
     * This method performs the unsubscribe command. The unsubscribe command unsubscribes the client from the topic
     * which messages the client is no more interested in receiving. If not subscription id is provided, the client
     * will unsubscribe from all subscriptions.
     *
     * ```javascript
     * await client.unsubscribe();       // unsubscribe from all
     * await client.unsubscribe('123');  // unsubscribe for the subscription with id "123"
     * ```
     *
     * @param {string} subId The id of the subscription.
     * @returns {Promise<string>} The Promise object with the command id of the command.
     */
    Client.prototype.unsubscribe = function (subId) {
        if (subId === undefined || subId === null) {
            subId = 'all';
        }
        if (typeof subId !== 'string') {
            throw 'The subId argument in unsubscribe must be a string, not a "' + (typeof subId) + '"';
        }
        return this.execute(new command_1.Command('unsubscribe').subId(subId).ackType('processed'));
    };
    Client.prototype.ack = function (topicOrMessage, bookmark, options) {
        // data required
        var topic;
        // message case
        if (typeof topicOrMessage !== 'string') {
            // if it's not a queue message, simply do nothing
            if (topicOrMessage.lp === undefined) {
                return;
            }
            topic = topicOrMessage.t;
            // In this case, options is actually in the bookmark field
            options = bookmark;
            bookmark = topicOrMessage.bm;
        }
        // topic/bookmark case
        else if (typeof topicOrMessage === 'string') {
            topic = topicOrMessage;
            if (typeof bookmark !== 'string') {
                throw 'The bookmark argument in ack() must be a string, not a "' + (typeof bookmark) + '"';
            }
        }
        else {
            throw 'Either a message object or a topic and bookmark strings should be provided in ack()';
        }
        // if there's no topic or bookmark -- there's nothing to acknowledge
        if (topic === undefined || topic.length === 0 || bookmark === undefined || bookmark.length === 0) {
            return;
        }
        // if the batch size is 0 or 1, or it has options, then ack() the message right away
        if (this._ackBatch.ackBatchSize <= 1 || (typeof options === 'string' && options.length > 0)) {
            var command = new command_1.Command('sow_delete').topic(topic).bookmark(bookmark);
            // We have options, let's append them
            if (typeof options === 'string' && options.length > 0) {
                command.options(options);
            }
            this.execute(command);
        }
        else {
            // add the new bookmark to the list of bookmarks to ack for this topic
            var bookmarks = this._ackBatch.toAck[topic];
            if (bookmarks === undefined) {
                bookmarks = [];
                this._ackBatch.toAck[topic] = bookmarks;
            }
            bookmarks.push(bookmark);
            // Enough messages in the batch, let's ack
            if (bookmarks.length >= this._ackBatch.ackBatchSize) {
                this._ack(topic);
            }
        }
    };
    /**
     * This method executes a SOW delete with a filter.
     *
     * ```javascript
     * const result = await client.sowDelete('sow-topic', '/status = "obsolete"');
     * console.log(result.header.ackType(), ': ',  result.header.status());
     * ```
     *
     * @param {string} topic The topic to execute the SOW delete against.
     * @param {string} filter The filter. To delete all records, set a filter that is always true: `1=1`
     * @param {string} options A comma separated list of values indicating additional processing options.
     * @returns {Promise<Message>} The promise object with the results of execution of the command.
     */
    Client.prototype.sowDelete = function (topic, filter, options) {
        var _this = this;
        if (topic === undefined || topic === null || topic === '') {
            throw 'A non-null, defined, non-empty topic argument must be provided';
        }
        else if (typeof topic !== 'string') {
            throw 'The topic argument in sow_delete must be a string, not a "' + (typeof topic) + '"';
        }
        if (filter === undefined || filter === null || filter === '') {
            throw 'A non-null, defined, non-empty filter argument must be provided';
        }
        else if (typeof filter !== 'string') {
            throw 'The filter argument in sow_delete must be a string, not a "' + (typeof filter) + '"';
        }
        return new Promise(function (resolve, reject) {
            // build the command object
            var command = new command_1.Command('sow_delete').topic(topic).filter(filter).ackType('stats');
            // Assign options, if any
            if (options !== undefined && options !== null) {
                command.options(options);
            }
            _this.execute(command, resolve).catch(reject);
        });
    };
    /**
     * This method deletes a message from a SOW, using data supplied to locate a SOW entry with matching keys.
     *
     * ```javascript
     * const topic = sowMessage.header.topic();
     * const data = sowMessage.data;
     *
     * const result = await client.sowDeleteByData(topic, data);
     * console.log(result.header.ackType(), ': ',  result.header.status());
     * ```
     *
     * @param {string} topic The topic to execute the SOW delete against.
     * @param {any} data The A message data whose keys match the message to be deleted in the server’s SOW.
     * @returns {Promise<Message>} The promise object with the results of execution of the command.
     */
    Client.prototype.sowDeleteByData = function (topic, data) {
        var _this = this;
        if (topic === undefined || topic === null || topic === '') {
            throw 'A non-null, defined, non-empty topic argument must be provided';
        }
        else if (typeof topic !== 'string') {
            throw 'The topic argument in sow_delete must be a string, not a "' + (typeof topic) + '"';
        }
        if (data === undefined || data === null || data === '') {
            throw 'A non-null, defined, non-empty data argument must be provided';
        }
        return new Promise(function (resolve, reject) {
            _this.execute(new command_1.Command('sow_delete').topic(topic).data(data).ackType('stats'), resolve).catch(reject);
        });
    };
    /**
     * This method executes a SOW delete with sow keys (supplied as a comma-separated values in a string). SOW keys are
     * provided in the header of a SOW message, and are the internal identifier AMPS uses for that SOW message.
     *
     * ```javascript
     * const topic = sowMessage1.header.topic();
     * const keys = sowMessage1.header.sowKey() + ',' + sowMessage2.header.sowKey();
     *
     * const result = await client.sowDeleteByKeys(topic, keys);
     * console.log(result.header.ackType(), ': ',  result.header.status());
     * ```
     *
     * @param {string} topic The topic to execute the SOW delete against.
     * @param {string} keys A comma separated list of SOW keys to be deleted. SOW keys are provided in the header of
     * a SOW message, and are the internal identifier AMPS uses for that SOW message.
     * @returns {Promise<Message>} The promise object with the results of execution of the command.
     */
    Client.prototype.sowDeleteByKeys = function (topic, keys) {
        var _this = this;
        if (topic === undefined || topic === null || topic === '') {
            throw 'A non-null, defined, non-empty topic argument must be provided';
        }
        else if (typeof topic !== 'string') {
            throw 'The topic argument in sow_delete must be a string, not a "' + (typeof topic) + '"';
        }
        if (keys === undefined || keys === null || keys === '') {
            throw 'A non-null, defined, non-empty keys argument must be provided';
        }
        else if (typeof keys !== 'string') {
            throw 'The keys argument in sow_delete must be a string, not a "' + (typeof keys) + '"';
        }
        return new Promise(function (resolve, reject) {
            _this.execute(new command_1.Command('sow_delete').topic(topic).sowKeys(keys).ackType('stats'), resolve).catch(reject);
        });
    };
    // static data
    Client.seqRegex = /"s":(\d+),/;
    Client.maxBacklogRegex = /max_backlog=(\d+)/;
    Client.Bookmarks = {
        MOST_RECENT: 'recent',
        EPOCH: '0',
        NOW: '0|1|'
    };
    Client.ConnectionStateListener = {
        Disconnected: 0,
        Shutdown: 1,
        Connected: 2,
        LoggedOn: 4,
        PublishReplayed: 8,
        HeartbeatInitiated: 16,
        Resubscribed: 32,
        UNKNOWN: 16834
    };
    return Client;
}());
exports.Client = Client;


/***/ }),

/***/ 372:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Command = void 0;
var BigInteger = __webpack_require__(632);
var header_1 = __webpack_require__(192);
/**
 * The Command class encapsulates the AMPS Command entity. The JavaScript client sends [[Command]] objects to the server
 * and receives [[Message]] objects from the server.
 */
var Command = /** @class */ (function () {
    /**
     * @param {string} command The name of the command.
     */
    function Command(command) {
        this._data = null;
        if (Command.commandTypes.indexOf(command) < 0) {
            throw new Error('Invalid command name');
        }
        this.header = new header_1.Header();
        this.header.c = command;
    }
    /**
     * This method returns the 'raw' header of the command as an object with key-value pairs.
     * @hidden
     */
    Command.prototype.rawHeader = function () { return this.header; };
    /**
     * This method returns a command converted into a message.
     * @hidden
     */
    Command.prototype.toMessage = function () {
        var message = this.header;
        if (this._data) {
            message.data = this._data;
        }
        return message;
    };
    Command.prototype.command = function (value) {
        if (value !== undefined) {
            if (Command.commandTypes.indexOf(value) < 0) {
                throw new Error('Invalid command name');
            }
            this.header.c = value;
            return this;
        }
        return this.header.c;
    };
    Command.prototype.commandId = function (value) {
        if (value !== undefined) {
            this.header.cid = value;
            return this;
        }
        return this.header.cid;
    };
    Command.prototype.queryId = function (value) {
        if (value !== undefined) {
            this.header.query_id = value;
            return this;
        }
        return this.header.query_id;
    };
    Command.prototype.subId = function (value) {
        if (value !== undefined) {
            this.header.sub_id = value;
            return this;
        }
        return this.header.sub_id;
    };
    Command.prototype.ackType = function (value) {
        if (value !== undefined) {
            this.header.a = value;
            return this;
        }
        return this.header.a;
    };
    Command.prototype.data = function (value) {
        if (value !== undefined) {
            this._data = value;
            return this;
        }
        return this._data;
    };
    Command.prototype.topN = function (value) {
        if (value !== undefined) {
            this.header.top_n = value;
            return this;
        }
        return this.header.top_n;
    };
    Command.prototype.batchSize = function (value) {
        if (value !== undefined) {
            this.header.bs = value;
            return this;
        }
        return this.header.bs;
    };
    Command.prototype.topic = function (value) {
        if (value !== undefined) {
            this.header.t = value;
            return this;
        }
        return this.header.t;
    };
    Command.prototype.filter = function (value) {
        if (value !== undefined) {
            this.header.filter = value;
            return this;
        }
        return this.header.filter;
    };
    Command.prototype.bookmark = function (value) {
        if (value !== undefined) {
            this.header.bm = value;
            return this;
        }
        return this.header.bm;
    };
    Command.prototype.options = function (value) {
        if (value !== undefined) {
            this.header.o = value;
            return this;
        }
        return this.header.o;
    };
    Command.prototype.correlationId = function (value) {
        if (value !== undefined) {
            this.header.x = value;
            return this;
        }
        return this.header.x;
    };
    Command.prototype.orderBy = function (value) {
        if (value !== undefined) {
            this.header.orderby = value;
            return this;
        }
        return this.header.orderby;
    };
    Command.prototype.sowKey = function (value) {
        if (value !== undefined) {
            this.header.k = value;
            return this;
        }
        return this.header.k;
    };
    Command.prototype.sowKeys = function (value) {
        if (value !== undefined) {
            this.header.sow_keys = value;
            return this;
        }
        return this.header.sow_keys;
    };
    Command.prototype.expiration = function (value) {
        if (value !== undefined) {
            this.header.e = value;
            return this;
        }
        return this.header.e;
    };
    Command.prototype.clientName = function (value) {
        if (value !== undefined) {
            this.header.client_name = value;
            return this;
        }
        return this.header.client_name;
    };
    Command.prototype.sequenceId = function (value) {
        if (value !== undefined) {
            this.header.s = value.toString();
            return this;
        }
        return BigInteger(this.header.s);
    };
    Command.prototype.subIds = function (value) {
        if (value !== undefined) {
            this.header.sids = value;
            return this;
        }
        return this.header.sids;
    };
    /**
     * Parses an object with params into a set of command parameters. For example,
     * an object &#123; expiration: 30, filter: '/age > 20' &#125; will be equivalent to make a command using
     * new amps.Command().expiration(30).filter('/age > 20');
     * @param {object} [params] An object with params.
     * @returns {Command} The updated Command object.
     * @hidden
     */
    Command.prototype.addParams = function (params) {
        if (params === null || params === undefined) {
            return this;
        }
        var paramKeys = Object.keys(params);
        for (var i = 0; i < paramKeys.length; ++i) {
            var param = paramKeys[i];
            try {
                this[param](params[param]);
            }
            catch (err) {
                throw new Error('Parameter "' + param + '" not found.');
            }
        }
        return this;
    };
    /**
     * This method creates and returns a deep copy of the command Header data.
     * @returns {Header} The deep copy of command header.
     * @hidden
     */
    Command.prototype.headerCopy = function () {
        var header = new header_1.Header();
        header.c = this.header.c.slice(0);
        for (var key in this.header) {
            header[key] = (typeof this.header[key] === 'string') ? this.header[key].slice(0) : this.header[key];
        }
        return header;
    };
    Command.commandTypes = [
        'logon',
        'publish',
        'delta_publish',
        'subscribe',
        'delta_subscribe',
        'sow',
        'sow_and_subscribe',
        'sow_and_delta_subscribe',
        'sow_delete',
        'unsubscribe',
        'flush',
        'heartbeat',
        'start_timer',
        'stop_timer'
    ];
    return Command;
}());
exports.Command = Command;


/***/ }),

/***/ 652:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DefaultAuthenticator = void 0;
/**
 * @hidden
 */
var DefaultAuthenticator = /** @class */ (function () {
    function DefaultAuthenticator() {
    }
    DefaultAuthenticator.prototype.authenticate = function (login, password) {
        return new Promise(function (resolve) { return resolve(password); });
    };
    DefaultAuthenticator.prototype.retry = function (login, password) {
        return new Promise(function (resolve) { return resolve(password); });
    };
    DefaultAuthenticator.prototype.completed = function (login, password, reason) { };
    return DefaultAuthenticator;
}());
exports.DefaultAuthenticator = DefaultAuthenticator;


/***/ }),

/***/ 444:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DefaultServerChooser = void 0;
/**
 * This is a simple server chooser that implements the [[ServerChooser]] interface. It keeps a list of AMPS instance
 * URIs and Authenticators, and advances to the next one when a failure occurs. You can add any number of URIs to the
 * [[DefaultServerChooser]].
 *
 * *To use the [[DefaultServerChooser]], you add the URIs for the server to choose from, then set the chooser to the
 * [[Client]]:*
 *
 * ```javascript
 * const chooser = new DefaultServerChooser();
 * chooser.add('wss://server:9005/amps/nvfix');
 * chooser.add('wss://server-two:9005/amps/nvfix');
 *
 * const client = new Client('showchooser');
 * client.serverChooser(chooser);
 *
 * await client.connect();
 * ```
 */
var DefaultServerChooser = /** @class */ (function () {
    /**
     * This is the constructor for the [[DefaultServerChooser ]] class.
     */
    function DefaultServerChooser() {
        this.servers = [];
        this.index = 0;
        this.error = null;
    }
    /**
     * This method adds a URI and an optional authenticator for [[Client]] to choose from.
     *
     * ```javascript
     * chooser.add('wss://server:9005/amps/json');
     * chooser.add('wss://another_server:9006/amps/json', myAuthenticator);
     * ```
     *
     * @param {string} uri The URI of the server.
     * @param {Authenticator} authenticator The authenticator object for custom authentication scenarios.
     * @returns {DefaultServerChooser} The server chooser object.
     */
    DefaultServerChooser.prototype.add = function (uri, authenticator) {
        if (authenticator === void 0) { authenticator = null; }
        if (uri.length === 0) {
            throw new Error('Invalid URI');
        }
        this.servers.push({ uri: uri, authenticator: authenticator });
        return this;
    };
    /**
     * This method allows to add as many server choosers as needed. The arguments can be either uri strings or objects
     * that contain uri key, and optionally, the authenticator key.
     *
     * ```javascript
     * chooser.addAll(
     *     'wss://server:9005/amps/json',
     *     {uri: 'wss://extra_server:9007/amps/json'},
     *     {uri: 'wss://another_server:9003/amps/json', authenticator: myAuthenticator}
     * );
     * ```
     *
     * @param {...(string | ChooserItem)} options either uri strings or objects that contain uri key, and optionally,
     * the authenticator key.
     * @returns {DefaultServerChooser} The server chooser object.
     */
    DefaultServerChooser.prototype.addAll = function () {
        var options = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            options[_i] = arguments[_i];
        }
        for (var _a = 0, options_1 = options; _a < options_1.length; _a++) {
            var option = options_1[_a];
            if (!option) {
                throw new Error('Invalid URI option');
            }
            if (typeof option === 'string') {
                this.add(option);
            }
            else {
                this.add(option.uri, option.authenticator);
            }
        }
        return this;
    };
    /**
     * This method returns the current URI chosen. If no URI was chosen yet, returns null.
     *
     * @returns {string} The current URI chosen (if any).
     */
    DefaultServerChooser.prototype.getCurrentURI = function () {
        return (this.servers.length > 0) ? this.servers[this.index].uri : null;
    };
    /**
     * This method returns the current authenticator chosen. If no authenticator was chosen yet, returns null.
     *
     * @returns {Authenticator} The current authenticator chosen (if any).
     */
    DefaultServerChooser.prototype.getCurrentAuthenticator = function () {
        return (this.servers.length > 0) ? this.servers[this.index].authenticator : null;
    };
    /**
     * This method is invoked by the [[Client]] to indicate a connection failure occurred.
     *
     * @param {Error} error An error object containing an error message.
     * @param {any} connectionInfo An object of properties associated with the failed connection.
     */
    DefaultServerChooser.prototype.reportFailure = function (error, connectionInfo) {
        this.error = error;
        // advancing the index to the next position
        this.index = (this.index + 1) % this.servers.length;
    };
    /**
     * This method is invoked by the [[Client]] to indicate a connection attempt was successful.
     *
     * @param {any} connectionInfo An object of properties associated with the successful connection.
     */
    DefaultServerChooser.prototype.reportSuccess = function (connectionInfo) {
        this.error = null;
    };
    /**
     * This method provides additional detail to be included in an exception thrown by when the AMPS instance(s) are not
     * available. Called by the [[Client]] when creating an exception.
     *
     * @returns {string} A string with information about the connection that failed and the reason for the failure.
     * When no further information is available, returns an empty string.
     */
    DefaultServerChooser.prototype.getError = function () { return this.error ? this.error.message : ''; };
    return DefaultServerChooser;
}());
exports.DefaultServerChooser = DefaultServerChooser;


/***/ }),

/***/ 552:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DefaultSubscriptionManager = void 0;
var header_1 = __webpack_require__(192);
/**
 * [[DefaultSubscriptionManager]] is used to resubscribe and manage client subscriptions in case of a unintended
 * disconnection.
 *
 * ```javascript
 * // create a client
 * const client = new Client('my-client');
 *
 * // Create and assign the subscription manager
 * client.subscriptionManager(new DefaultSubscriptionManager());
 *
 * // ... access the subscription manager later
 * client.subscriptionManager().clear();
 * ```
 */
var DefaultSubscriptionManager = /** @class */ (function () {
    /**
     * This is the constructor for the DefaultSubscriptionManager class.
     * @param {number} resubscriptionTimeout The maximum time (milliseconds) for the Resubscription to timeout. If
     * it is equal to zero, it never times out.
     */
    function DefaultSubscriptionManager(_resubscriptionTimeout) {
        if (_resubscriptionTimeout === void 0) { _resubscriptionTimeout = 0; }
        var _this = this;
        this._resubscriptionTimeout = _resubscriptionTimeout;
        /**
         * This is the internal method that wraps the resubscribe logic per subscription so that the public
         * resubscribe() method looks clear and concise.
         * @private
         * @hidden
         */
        this.resubscribeInternal = function (subId, client, subscription) {
            var hasOptions = subscription.header.o !== undefined;
            // make sure we're not sending 'replace' again
            if (hasOptions) {
                subscription.header.o = subscription.header.o.replace(/replace,?/g, '');
            }
            // bookmark subscription
            if (subscription.header.bm) {
                // if paused, subscribe with the most recent bookmark
                if (!hasOptions || subscription.header.o.indexOf('pause') < 0) {
                    // get the most recent bookmark from bookmark store and assign it as a new bm value
                    subscription.header.bm = client.bookmarkStore().mostRecent(subscription.header.sub_id, true).toString();
                }
            }
            // assign a command id (should increase)
            subscription.header.cid = client.nextSubId();
            // send the subscription command
            client.setMessageHandler(subId, subscription.handler);
            client.send(subscription.header, undefined, _this._resubscriptionTimeout);
        };
        // Detect negative value and short circuit in this case
        if (_resubscriptionTimeout < 0) {
            throw new Error('Invalid value: Cannot use negative argument values');
        }
        this.activeSubs = {};
        this.resumedSubs = {};
        this.resubscribing = false;
    }
    /**
     * This method performs the subscription to a topic.
     *
     * @param {Header} header The subscription command header with all command data.
     * @param {(message: Message) => void} messageHandler The message handler callback function. Not required in case
     * of 'replace' or 'pause' subscriptions.
     */
    DefaultSubscriptionManager.prototype.subscribe = function (header, messageHandler) {
        // short circuit
        if (!header || (header.sub_id === undefined && header.sids === undefined)) {
            return;
        }
        // copy the command object
        header = DefaultSubscriptionManager.copyHeader(header);
        // have options, such as oof, replace, etc
        if (header.o) {
            var subIds = header.sub_id + (header.sids ? ',' + header.sids : '').split(',');
            // subscription header with a 'resume' option set - add it to the 'resumed' subscriptions list
            if (header.o.indexOf('resume') >= 0) {
                for (var _i = 0, subIds_1 = subIds; _i < subIds_1.length; _i++) {
                    var subId = subIds_1[_i];
                    if (!this.resumedSubs[subId]) {
                        this.resumedSubs[subId] = {
                            header: header,
                            handler: messageHandler
                        };
                    }
                }
                return;
            }
            // subscription header with a 'pause' option set - remove it from the 'resumed' list, set 'pause' flag
            // for any existing subscriptions in the 'active' list
            else if (header.o.indexOf('pause') >= 0) {
                for (var _a = 0, subIds_2 = subIds; _a < subIds_2.length; _a++) {
                    var subId = subIds_2[_a];
                    // if we have a resumed sub, remove it
                    if (this.resumedSubs[subId]) {
                        delete this.resumedSubs[subId];
                    }
                    if (this.activeSubs[subId]) {
                        // if there's no 'replace' option set
                        if (header.o.indexOf('replace') < 0) {
                            var currentSubOptions = this.activeSubs[subId].o;
                            this.activeSubs[subId].o = (currentSubOptions ? 'pause,' + currentSubOptions : 'pause');
                            continue;
                        }
                        else {
                            messageHandler = this.activeSubs[subId].handler;
                        }
                    }
                    this.activeSubs[subId] = {
                        header: header,
                        handler: messageHandler
                    };
                }
                return;
            }
        }
        // subscriptions without options
        var existingSubscription = this.activeSubs[header.sub_id];
        if (existingSubscription) {
            messageHandler = existingSubscription.handler;
        }
        // store the subscription
        this.activeSubs[header.sub_id] = {
            header: header,
            handler: messageHandler
        };
    };
    /**
     * This method unsubscribes from a topic using the subscription id.
     *
     * @param {string} subId The subscription id.
     */
    DefaultSubscriptionManager.prototype.unsubscribe = function (subId) {
        delete this.activeSubs[subId];
        delete this.resumedSubs[subId];
    };
    /**
     * This method clears all the managed subscriptions so that in case of the disconnection there will be no
     * subscriptions to restore.
     */
    DefaultSubscriptionManager.prototype.clear = function () {
        this.activeSubs = {};
        this.resumedSubs = {};
    };
    /**
     * This method sets/gets the resubscription timeout value. It should be bigger or equal to zero. If it
     * is equal to zero, it never times out.
     *
     * @param {number} timeout The timeout value (in milliseconds).
     * @returns {number} The subscription timeout.
     */
    DefaultSubscriptionManager.prototype.resubscriptionTimeout = function (timeout) {
        if (timeout === void 0) { timeout = 0; }
        if (timeout !== undefined) {
            if (typeof timeout !== 'number' || timeout < 0) {
                throw new Error('Invalid value');
            }
            this._resubscriptionTimeout = timeout;
        }
        return this._resubscriptionTimeout;
    };
    /**
     * This method resubscribes to all the stored subscriptions using the [[Client]] object provided.
     *
     * @param {Client} client The AMPS client object. It must be connected.
     */
    DefaultSubscriptionManager.prototype.resubscribe = function (client) {
        var _this = this;
        // short circuit
        if (client === undefined || client === null || !client || !client.isConnected()) {
            throw new Error('A connected client must be provided');
        }
        this.resubscribing = true;
        // send active, then resumed subs
        Object.keys(this.activeSubs).map(function (subId) { _this.resubscribeInternal(subId, client, _this.activeSubs[subId]); });
        Object.keys(this.resumedSubs).map(function (subId) { _this.resubscribeInternal(subId, client, _this.resumedSubs[subId]); });
        this.resubscribing = false;
    };
    /**
     * This is a deep copy method (in order to preserve the message headers).
     *
     * @param {Header} header The command header to copy.
     * @returns {Header} The copy of the original object.
     * @private
     * @hidden
     */
    DefaultSubscriptionManager.copyHeader = function (obj) {
        var copiedObj = new header_1.Header();
        copiedObj.c = obj.c.slice(0);
        Object.keys(obj).map(function (key) {
            copiedObj[key] = (typeof obj[key] === 'string') ? obj[key].slice(0) : obj[key];
        });
        return copiedObj;
    };
    return DefaultSubscriptionManager;
}());
exports.DefaultSubscriptionManager = DefaultSubscriptionManager;


/***/ }),

/***/ 708:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExponentialDelayStrategy = void 0;
/**
 * [[ExponentialDelayStrategy]] is an implementation that exponentially backs off when reconnecting to the same server,
 * with a maximum time to retry before it gives up entirely.
 *
 *
 * Create the strategy with all default values:
 *
 * ```javascript
 * const strategy = new ExponentialDelayStrategy();
 * ```
 *
 * Set jitter to 3.5, and keep other parameters default:
 *
 * ```javascript
 * const strategy = new ExponentialDelayStrategy({jitter: 3.5});
 * ```
 *
 * Set all params as arguments ...
 *
 * ```javascript
 * const strategy = new ExponentialDelayStrategy(400, 25000, 1.5, 0, 2.5);
 * ```
 *
 * ... or using the object with values ...
 *
 * ```javascript
 * const strategy = new ExponentialDelayStrategy({
 *     initialDelay: 400,
 *     maximumDelay: 25000,
 *     backoffExponent: 1.5,
 *     maximumRetryTime: 0,
 *     jitter: 2.5
 * });
 * ```
 *
 * ... or using setter methods:
 *
 * ```javascript
 * const strategy = new ExponentialDelayStrategy()
 *     .initialDelay(400)
 *     .maximumDelay(25000)
 *     .backoffExponent(1.5)
 *     .maximumRetryTime(0)
 *     .jitter(2.5);
 * ```
 *
 * Setter methods can also be used after initialization of the strategy to change values dynamically.
 */
var ExponentialDelayStrategy = /** @class */ (function () {
    function ExponentialDelayStrategy(initialDelayOrParams, maximumDelay, backoffExponent, maximumRetryTime, jitter) {
        if (maximumDelay === void 0) { maximumDelay = 20000; }
        if (backoffExponent === void 0) { backoffExponent = 2.0; }
        if (maximumRetryTime === void 0) { maximumRetryTime = 0; }
        if (jitter === void 0) { jitter = 1.0; }
        this.firstUri = null;
        this.recentUri = null;
        this.currentUri = null;
        this.currentDelay = -1;
        // Treat the first argument as a the object with values
        if (typeof initialDelayOrParams !== 'number' && initialDelayOrParams) {
            maximumDelay = initialDelayOrParams.maximumDelay;
            backoffExponent = initialDelayOrParams.backoffExponent;
            maximumRetryTime = initialDelayOrParams.maximumRetryTime;
            jitter = initialDelayOrParams.jitter;
            initialDelayOrParams = initialDelayOrParams.initialDelay;
        }
        // set values
        this._initialDelay = (typeof initialDelayOrParams !== 'number' ? 200 : initialDelayOrParams);
        this._maximumDelay = (typeof maximumDelay !== 'number' ? 20000 : maximumDelay);
        this._backoffExponent = (typeof backoffExponent !== 'number' ? 2.0 : backoffExponent);
        this._maximumRetryTime = (typeof maximumRetryTime !== 'number' ? 0 : maximumRetryTime);
        this._jitter = (typeof jitter !== 'number' ? 1.0 : jitter);
        // Detect negative values and short circuit in this case
        if (this._initialDelay < 0 ||
            this._maximumDelay < 0 ||
            this._backoffExponent < 0 ||
            this._maximumRetryTime < 0 ||
            this._jitter < 0) {
            throw new Error(ExponentialDelayStrategy.NEGATIVE_VALUE_ERROR);
        }
        // initialize state variables
        this.reset();
    }
    /**
     * This method sets the time (in milliseconds) to wait before reconnecting to a server for the first time after
     * a failed connection.
     *
     * @param {number} initialDelay The time (in milliseconds) to wait before reconnecting to a server for the
     * first time after a failed connection.
     * @returns {ExponentialDelayStrategy} The Delay object.
     */
    ExponentialDelayStrategy.prototype.initialDelay = function (initialDelay) {
        if (initialDelay === void 0) { initialDelay = 200; }
        if (initialDelay < 0) {
            throw new Error(ExponentialDelayStrategy.NEGATIVE_VALUE_ERROR);
        }
        this._initialDelay = initialDelay;
        this.currentDelay = this._initialDelay;
        return this;
    };
    /**
     * This method sets the maximum time to wait between any reconnection attempts.
     * Exponential backoff will not exceed this maximum.
     *
     * @param {number} maximumDelay The maximum time to wait for any reconnect attempt (milliseconds).
     * Exponential backoff will not exceed this maximum.
     * @returns {ExponentialDelayStrategy} The ExponentialDelayStrategy object.
     */
    ExponentialDelayStrategy.prototype.maximumDelay = function (maximumDelay) {
        if (maximumDelay === void 0) { maximumDelay = 20000; }
        if (maximumDelay < 0) {
            throw new Error(ExponentialDelayStrategy.NEGATIVE_VALUE_ERROR);
        }
        this._maximumDelay = maximumDelay;
        return this;
    };
    /**
     *  This method sets the exponent to use for calculating the next delay time. For example if the initial time is
     *  200ms and the exponent is 2.0, the next delay will be 400ms, then 800ms, etc.
     *
     * @param {number} backoffExponent The exponent to use for calculating the next delay time. For example, if
     * the initial time is 200ms and the exponent is 2.0, the next delay will be 400ms, then 800ms, etc.
     * @returns {ExponentialDelayStrategy} The ExponentialDelayStrategy object.
     */
    ExponentialDelayStrategy.prototype.backoffExponent = function (backoffExponent) {
        if (backoffExponent === void 0) { backoffExponent = 2.0; }
        if (backoffExponent < 0) {
            throw new Error(ExponentialDelayStrategy.NEGATIVE_VALUE_ERROR);
        }
        this._backoffExponent = backoffExponent;
        return this;
    };
    /**
     * This method sets the time (in milliseconds) to allow reconnect attempts to continue without a successful
     * connection, before "giving up" and abandoning the connection attempt. 0 means never give up.
     *
     * @param {number} maximumRetryTime The maximum time (milliseconds) to allow reconnect attempts to continue
     * without a successful connection, before giving up and abandoning the connection attempt. If zero, the client
     * never gives up.
     * @returns {ExponentialDelayStrategy} The ExponentialDelayStrategy object.
     */
    ExponentialDelayStrategy.prototype.maximumRetryTime = function (maximumRetryTime) {
        if (maximumRetryTime === void 0) { maximumRetryTime = 0; }
        if (maximumRetryTime < 0) {
            throw new Error(ExponentialDelayStrategy.NEGATIVE_VALUE_ERROR);
        }
        this._maximumRetryTime = maximumRetryTime;
        return this;
    };
    /**
     * This method sets the jitter factor used to add randomness to the delay time. Jitter is represented as a multiple
     * of the initial delay time;
     * a random number from `[ 0, (JITTER * INITIAL_DELAY) )` is added to nonzero time delays.
     *
     * @param {number} jitter The amount of 'jitter' to apply when calculating a delay time, measured in
     * multiples of the initial delay. Jitter is used to reduce the number of simultaneous reconnects that may be
     * issued from multiple clients.
     * @returns {ExponentialDelayStrategy} The ExponentialDelayStrategy object.
     */
    ExponentialDelayStrategy.prototype.jitter = function (jitter) {
        if (jitter === void 0) { jitter = 1.0; }
        if (jitter < 0) {
            throw new Error(ExponentialDelayStrategy.NEGATIVE_VALUE_ERROR);
        }
        this._jitter = jitter;
        return this;
    };
    /**
     * This method returns the time (in milliseconds) that the client should delay before connecting to the given
     * server URI.
     *
     * @param {string} uri The URI of the server.
     * @returns {number} The time (in milliseconds) that the client should delay.
     */
    ExponentialDelayStrategy.prototype.getConnectWaitDuration = function (uri) {
        var currentTime = new Date().getTime();
        // exceeded time check
        if (this._maximumRetryTime > 0) {
            // maximum retry time is exceeded
            if (this.startTime >= 0 && this._maximumRetryTime <= (currentTime - this.startTime)) {
                throw new Error('Maximum Retry Time Exceeded');
            }
        }
        var finalValue;
        // next server in the chain or the first launch - return 0
        if (uri !== this.recentUri && uri !== this.firstUri) {
            // first launch
            if (!this.firstUri) {
                this.firstUri = uri;
                this.startTime = currentTime;
            }
            finalValue = 0;
        }
        // wrapped circle or the same server again - return a new non-zero value
        else {
            // calculate the delay
            this.currentDelay = (this.currentDelay < 0) ?
                this._initialDelay :
                Math.min(this._maximumDelay, (this.currentDelay * this._backoffExponent));
            // calculate the jittered value
            finalValue = Math.round(this.currentDelay + Math.random() * this._jitter * this._initialDelay);
            // adjust it if it's too big by mirroring the delta: ex: 15005 => 14995
            if (finalValue > this._maximumDelay) {
                finalValue = 2 * this._maximumDelay - finalValue;
                // make sure the final value is not smaller than the minimum delay (in case of a huge jitter value)
                if (finalValue < this._initialDelay) {
                    finalValue = this._initialDelay;
                }
            }
        }
        // next this will be the recent uri
        this.recentUri = uri;
        return finalValue;
    };
    /**
     * This method resets the state of this reconnect delay. AMPS calls this method when a connection is established.
     */
    ExponentialDelayStrategy.prototype.reset = function () {
        this.startTime = -1;
        this.firstUri = null;
        this.recentUri = null;
        this.currentUri = null;
        this.currentDelay = -1;
    };
    ExponentialDelayStrategy.NEGATIVE_VALUE_ERROR = 'Invalid value(s): Cannot use negative argument values';
    return ExponentialDelayStrategy;
}());
exports.ExponentialDelayStrategy = ExponentialDelayStrategy;


/***/ }),

/***/ 628:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FixedDelayStrategy = void 0;
/**
 * [[FixedDelayStrategy]] is a reconnect delay strategy implementation that waits a fixed amount of time before retrying
 * a connection.
 *
 * Create the fixed strategy with all default values:
 *
 * ```javascript
 * const strategy = new FixedDelayStrategy();
 * ```
 *
 * Set the maximum retry time to 15 seconds, leave the default delay value:
 *
 * ```javascript
 * const strategy = new FixedDelayStrategy({maximumRetryTime: 15000});
 * ```
 *
 * Set all params as arguments...
 *
 * ```javascript
 * const strategy = new FixedDelayStrategy(2000, 45000);
 * ```
 *
 * ... or using the object with values:
 *
 * ```javascript
 * const strategy = new FixedDelayStrategy({delay: 2000, maximumRetryTime: 45000});
 * ```
 */
var FixedDelayStrategy = /** @class */ (function () {
    function FixedDelayStrategy(delayOrParams, maximumRetryTime) {
        if (maximumRetryTime === void 0) { maximumRetryTime = 0; }
        // Treat the first argument as a the object with values
        if (typeof delayOrParams !== 'number' && delayOrParams) {
            maximumRetryTime = delayOrParams.maximumRetryTime;
            delayOrParams = delayOrParams.delay;
        }
        // set values
        this.delay = (typeof delayOrParams !== 'number' ? 200 : delayOrParams);
        this.maximumRetryTime = (typeof maximumRetryTime !== 'number' ? 0 : maximumRetryTime);
        // Detect negative values and short circuit in this case
        if (this.delay < 0 || this.maximumRetryTime < 0) {
            throw new Error('Invalid value(s): Cannot use negative argument values');
        }
        // initialize other internal variables
        this.reset();
    }
    /**
     * This method returns the time (in milliseconds) that the client should delay before connecting to the given
     * server URI.
     *
     * @param {string} uri The URI of the server.
     * @returns {number} The time (in milliseconds) that the client should delay.
     */
    FixedDelayStrategy.prototype.getConnectWaitDuration = function (uri) {
        var currentTime = new Date().getTime();
        // exceeded time check
        if (this.maximumRetryTime > 0) {
            // maximum retry time is exceeded
            if (this.startTime >= 0 && this.maximumRetryTime <= (currentTime - this.startTime)) {
                throw new Error('Maximum Retry Time Exceeded');
            }
        }
        var finalValue;
        // next server in the chain or the first launch - return 0
        if (uri !== this.recentUri && uri !== this.firstUri) {
            // first launch
            if (!this.firstUri) {
                this.firstUri = uri;
                this.startTime = currentTime;
            }
            finalValue = 0;
        }
        else {
            finalValue = this.delay;
        }
        // next this will be the recent uri
        this.recentUri = uri;
        return finalValue;
    };
    /**
     * This method resets the state of this reconnect delay. AMPS calls this method when a connection is established.
     */
    FixedDelayStrategy.prototype.reset = function () {
        this.startTime = -1;
        this.firstUri = null;
        this.recentUri = null;
    };
    return FixedDelayStrategy;
}());
exports.FixedDelayStrategy = FixedDelayStrategy;


/***/ }),

/***/ 192:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Header = void 0;
/**
 * This is the underlying class for [[Message]] / [[Command]] headers. It represents raw parameter names as they are
 * sent to / received from the server.
 * @hidden
 */
var Header = /** @class */ (function () {
    function Header() {
    }
    return Header;
}());
exports.Header = Header;


/***/ }),

/***/ 196:
/***/ ((module, exports) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IS_WEBWORKER = exports.IS_ELECTRON = exports.IS_OPENFIN = exports.IS_NODE = exports.IS_BROWSER = exports.Helpers = void 0;
/* tslint:disable */
var parseUri = function (str) {
    var o = this.parseUri.options, m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str), uri = {}, i = 14;
    while (i--) {
        uri[o.key[i]] = m[i] || '';
    }
    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) {
            uri[o.q.name][$1] = $2;
        }
    });
    return uri;
};
/* tslint:enable */
// parseUri 1.2.2 (c) Steven Levithan <stevenlevithan.com> MIT License
parseUri.options = {
    strictMode: false,
    key: [
        'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative',
        'path', 'directory', 'file', 'query', 'anchor'
    ],
    q: { name: 'queryKey', parser: /(?:^|&)([^&=]*)=?([^&]*)/g },
    parser: {
        /* tslint:disable */
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        /* tslint:enable */
    }
};
/**
 * @hidden
 */
var Helpers = /** @class */ (function () {
    function Helpers() {
    }
    Helpers.parseUri = parseUri;
    return Helpers;
}());
exports.Helpers = Helpers;
/* tslint:enable */
var isBrowser = false;
// Openfin check
var isFin = (typeof window !== 'undefined') && window.fin && window.fin.desktop; // jshint ignore:line
// Node js check
var isNode = false;
try {
    isNode = Object.prototype.toString.call(global.process) === '[object process]';
}
catch (e) { }
// Electron check
/* tslint:disable */
var isElectron = (typeof window !== 'undefined') && window.process && window.process.versions && window.process.versions.electron; // jshint ignore:line
/* tslint:enable */
// Worker environment
/* tslint:disable */
var isWebWorker = !isNode && (typeof window === 'undefined') && ("object" !== 'undefined') && (typeof module.exports !== 'undefined'); // jshint ignore:line
/* tslint:enable */
// else Browser environment
isBrowser = !isFin && !isNode && !isElectron;
/**
 * Browser environment detected.
 */
exports.IS_BROWSER = isBrowser;
/**
 * Node.js (and derivatives) environment detected.
 */
exports.IS_NODE = isNode;
/**
 * OpenFin environment detected.
 */
exports.IS_OPENFIN = isFin;
/**
 * Electron environment detected.
 */
exports.IS_ELECTRON = isElectron;
/**
 * WebWorker context detected.
 */
exports.IS_WEBWORKER = isWebWorker;


/***/ }),

/***/ 808:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MemoryBookmarkStore = void 0;
var BigInteger = __webpack_require__(632);
var bookmark_ring_buffer_1 = __webpack_require__(304);
var bookmark_range_field_1 = __webpack_require__(748);
var bookmark_field_1 = __webpack_require__(208);
var client_1 = __webpack_require__(836);
var Subscription = /** @class */ (function () {
    function Subscription(subscriptionId) {
        // The last persisted bookmark
        this.lastPersisted = null;
        // If this subscription uses range, save it here
        this.range = new bookmark_range_field_1.BookmarkRangeField();
        // bookmark storage
        this.ring = new bookmark_ring_buffer_1.BookmarkRingBuffer();
        // The per-subscription memory of what we've seen from publishers
        this.publishers = {};
        if (subscriptionId) {
            this.setSubscription(subscriptionId);
        }
        this.lastPersisted = new bookmark_field_1.BookmarkField();
        this.lastPersisted.copyFrom(Subscription.EPOCH_FIELD);
    }
    Subscription.prototype.setSubscription = function (subscriptionId) {
        this.sub = subscriptionId;
        this.ring.setSubId(this.sub);
    };
    Subscription.prototype.setParent = function (parent) {
        this.parent = parent;
    };
    Subscription.prototype.log = function (bookmark) {
        if (bookmark.equals(client_1.Client.Bookmarks.NOW)) {
            return 0;
        }
        if (!bookmark.isRange()) {
            return this.ring.log(bookmark);
        }
        // range case
        this.range.copyFrom(bookmark);
        if (!this.range.isValid()) {
            this.range.reset();
            throw new Error('Invalid bookmark range specified');
        }
        // The only time a range is logged is when subscribing. No need to store.
        return 0;
    };
    Subscription.prototype.discard = function (index) {
        this.ring.discard(index);
    };
    // Check to see if this message is older than the most recent one seen, and if it is, check if it discarded.
    Subscription.prototype.isDiscarded = function (bookmark) {
        if (bookmark.equals(client_1.Client.Bookmarks.NOW)) {
            return true;
        }
        var publisher = bookmark.getPublisherId();
        var sequence = bookmark.getSequenceNumber();
        if (!this.publishers[publisher] || this.publishers[publisher].lesser(sequence)) {
            this.publishers[publisher] = sequence;
            return false;
        }
        // message is in flight or discarded
        return true;
    };
    Subscription.prototype.getRange = function () {
        return this.range;
    };
    Subscription.prototype.mostRecent = function () {
        return this.ring.getLastDiscarded().copy();
    };
    Subscription.prototype.mostRecentList = function (useList) {
        var lastDiscarded = this.ring.getLastDiscarded();
        var useLastDiscarded = lastDiscarded !== null && !lastDiscarded.isNull();
        var lastDiscardedPub = null;
        var lastDiscardedSeq = BigInteger.zero;
        var useLastPersisted = (this.lastPersisted !== null
            && !this.lastPersisted.isNull()
            && !this.lastPersisted.equals(Subscription.EPOCH_FIELD));
        var lastPersistedPub = null;
        var lastPersistedSeq = BigInteger.zero;
        if (useLastPersisted) {
            lastPersistedPub = this.lastPersisted.getPublisherId();
            lastPersistedSeq = this.lastPersisted.getSequenceNumber();
        }
        if (useLastDiscarded) {
            if (this.ring.isEmpty() && useLastPersisted) {
                useLastDiscarded = false;
            }
            else {
                lastDiscardedPub = lastDiscarded.getPublisherId();
                lastDiscardedSeq = lastDiscarded.getSequenceNumber();
                if (useLastPersisted && lastDiscardedPub === lastPersistedPub) {
                    useLastDiscarded = lastDiscardedSeq.lesser(lastPersistedSeq);
                    useLastPersisted = !useLastDiscarded;
                }
            }
        }
        var recentList;
        var recentStr = '';
        if (useLastDiscarded) {
            recentStr += lastDiscarded.toString();
        }
        if (((!useLastDiscarded && !useLastPersisted)
            || (this.lastPersisted !== null && this.lastPersisted.equals(Subscription.EPOCH_FIELD))
            || this.range.isValid())
            && useList) {
            if (Object.keys(this.publishers).length === 0 && !this.range.isValid()) {
                if (this.lastPersisted === null) {
                    this.lastPersisted = new bookmark_field_1.BookmarkField();
                    this.lastPersisted.copyFrom(Subscription.EPOCH_FIELD);
                }
                return this.lastPersisted;
            }
            if (useLastDiscarded && lastDiscarded.equals(Subscription.EPOCH_FIELD)) {
                // EPOCH only
                if (recentStr.length === 1) {
                    recentStr = '';
                }
                // remove ,0 for EPOCH
                else {
                    recentStr = recentStr.slice(0, recentStr.length - 2);
                }
            }
            var publisherBookmarksList = [];
            for (var _i = 0, _a = Object.keys(this.publishers); _i < _a.length; _i++) {
                var key = _a[_i];
                if (useLastDiscarded && key === lastDiscardedPub) {
                    continue;
                }
                publisherBookmarksList.push("".concat(key, "|").concat(this.publishers[key].toString(), "|"));
            }
            if (publisherBookmarksList.length > 0) {
                if (recentStr.length > 0) {
                    recentStr += ',';
                }
                recentStr += publisherBookmarksList.join(',');
            }
            recentList = new bookmark_field_1.BookmarkField(recentStr);
            if (this.range.isValid()) {
                if (recentList.length > 1 && !recentList.equals(this.range.getStart())) {
                    this.range.replaceStart(recentList, true);
                }
                return this.range;
            }
            return recentList;
        }
        if (useLastPersisted) {
            if (recentStr.length > 0) {
                recentStr += ',';
            }
            recentStr += this.lastPersisted.toString();
        }
        recentList = new bookmark_field_1.BookmarkField(recentStr);
        if (this.range.isValid()) {
            if (recentList.length > 1 && !recentList.equals(this.range.getStart())) {
                this.range.replaceStart(recentList, true);
            }
            return this.range;
        }
        if (recentList.length === 0) {
            return Subscription.EPOCH_FIELD;
        }
        return recentList;
    };
    Subscription.prototype.setLastPersisted = function (bookmarkOrIndex) {
        if (bookmarkOrIndex instanceof bookmark_field_1.BookmarkField) {
            this.setLastPersistedBookmark(bookmarkOrIndex);
        }
        else {
            this.setLastPersistedIndex(bookmarkOrIndex);
        }
    };
    Subscription.prototype.setLastPersistedIndex = function (index) {
        var entry = this.ring.getByIndex(index);
        if (!entry) {
            return;
        }
        this.lastPersisted = entry.getBookmark().copy();
    };
    Subscription.prototype.setLastPersistedBookmark = function (bookmark) {
        if (!bookmark || bookmark.isNull()
            || bookmark.equals(this.lastPersisted)
            || bookmark.isRange()
            || this.range.isValid()) {
            return;
        }
        if (bookmark.isTimestamp()) {
            this.lastPersisted = bookmark.copy();
            return;
        }
        if (this.lastPersisted !== null
            && bookmark.getPublisherId() === this.lastPersisted.getPublisherId()
            && bookmark.getSequenceNumber().lesserOrEquals(this.lastPersisted.getSequenceNumber())) {
            return;
        }
        this.lastPersisted = bookmark.copy();
    };
    Subscription.prototype.oldestBookmarkSeq = function () {
        return this.ring.getStartIndex();
    };
    // EPOCH field for ease-of-use
    Subscription.EPOCH_FIELD = new bookmark_field_1.BookmarkField('0');
    return Subscription;
}());
/**
 * Bookmark store is used by the [[Client]] to provide resumable subscriptions and client-side duplicate message
 * handling using in-memory storage.
 *
 * ```javascript
 * // create the bookmark store
 * var bookmarkStore = new amps.MemoryBookmarkStore();
 *
 * // create the client instance and assign the bookmark store to it
 * var client = new amps.Client('my-client');
 * client.bookmarkStore(bookmarkStore);
 *
 * // ... access the bookmark store later
 * client.bookmarkStore().purge();
 * ```
 */
var MemoryBookmarkStore = /** @class */ (function () {
    function MemoryBookmarkStore() {
        // Internal state
        this.subscriptionsInfo = {};
    }
    /**
     * This method is called internally by the [[Client]] to log a bookmark to the persistent log.
     *
     * @param {Message} message The message to bookmark.
     * @returns {number} The corresponding bookmark sequence in the store.
     */
    MemoryBookmarkStore.prototype.log = function (message) {
        var bookmark = new bookmark_field_1.BookmarkField(message.bm);
        if (bookmark.isTimestamp() || bookmark.equals(Subscription.EPOCH_FIELD)) {
            return 0;
        }
        var sub = message._subscription;
        if (!sub) {
            sub = this.findSubscription(message.sub_id || message.sids);
            message._subscription = sub;
        }
        var index = sub.log(bookmark);
        message.bookmarkSeqNo = index;
        return index;
    };
    MemoryBookmarkStore.prototype.discard = function (messageOrSubId, bookmarkSeqNo) {
        // single argument: message
        if (typeof messageOrSubId !== 'string') {
            var bookmark = new bookmark_field_1.BookmarkField(messageOrSubId.bm);
            if (bookmark.isTimestamp() || bookmark.equals(client_1.Client.Bookmarks.NOW)) {
                return;
            }
            var sub = messageOrSubId._subscription;
            if (!sub) {
                var subId = messageOrSubId.sub_id || messageOrSubId.sids;
                sub = this.findSubscription(subId);
                messageOrSubId._subscription = sub;
            }
            sub.discard(messageOrSubId.bookmarkSeqNo);
        }
        else {
            this.findSubscription(messageOrSubId).discard(bookmarkSeqNo);
        }
    };
    /**
     * This method is called when you want to return the most recent bookmark from the log that ought to be used for
     * (re-)subscriptions.
     *
     * @param {string} subId The subscription id.
     * @returns {BookmarkField} The most recent bookmark.
     */
    MemoryBookmarkStore.prototype.mostRecent = function (subId, useList) {
        if (useList === void 0) { useList = true; }
        return this.findSubscription(subId).mostRecentList(useList);
    };
    /**
     * This method is called for each arriving message to determine if the application has already processed and
     * discarded this message. Returns 'true' if the bookmark is in the log and marked as discarded and should therefore
     * not be reprocessed. Otherwise, returns 'false'. Generally, isDiscarded is called by the
     * [[Client]] however, if needed it can be called by the application as well.
     *
     * @param {Message} message The message to check.
     * @returns {boolean} `true` if the bookmark is in the log and marked as discarded and should therefore
     * not be reprocessed. Otherwise, returns `false`.
     */
    MemoryBookmarkStore.prototype.isDiscarded = function (message) {
        var bookmark = new bookmark_field_1.BookmarkField(message.bm);
        if (bookmark.isTimestamp()) {
            return false;
        }
        if (bookmark.equals(Subscription.EPOCH_FIELD)) {
            return true;
        }
        var sub = message._subscription;
        if (!sub) {
            sub = this.findSubscription(message.sub_id || message.sids);
            message._subscription = sub;
        }
        return sub.isDiscarded(bookmark);
    };
    /**
     * This method is called when you want to purge the contents of this store. If the subId is not provided, removes
     * any tracking history associated with publishers and received messages. Otherwise, removes history for that subId
     * only.
     *
     * @param {string} subId The identifier of the subscription to purge.
     */
    MemoryBookmarkStore.prototype.purge = function (subId) {
        if (subId !== undefined) {
            delete this.subscriptionsInfo[subId];
        }
        else {
            this.subscriptionsInfo = {};
        }
    };
    /**
     * This method is called when you want to retrieve the sequence of the oldest bookmark in the store.
     *
     * @param {string} subId The identifier of the subscription.
     * @returns {number} The sequence number of the oldest bookmark in the store. 0 if not found/doesn't exist
     */
    MemoryBookmarkStore.prototype.oldestBookmarkSeq = function (subId) {
        return this.findSubscription(subId).oldestBookmarkSeq();
    };
    /**
     * This method is called internally by the [[Client]] to mark a message as safely persisted by AMPS to all of its
     * sync replication destinations.
     *
     * @param {string} subId The identifier of the subscription.
     * @param {BookmarkField} bookmark A bookmark field object.
     */
    MemoryBookmarkStore.prototype.persisted = function (subId, bookmark) {
        this.findSubscription(subId).setLastPersisted(bookmark);
    };
    // internal methods
    MemoryBookmarkStore.prototype.findSubscription = function (subId) {
        var subscription = this.subscriptionsInfo[subId];
        if (!subscription) {
            // create new subscription record
            subscription = new Subscription();
            subscription.setSubscription(subId);
            subscription.setParent(this);
            this.subscriptionsInfo[subId] = subscription;
        }
        return subscription;
    };
    return MemoryBookmarkStore;
}());
exports.MemoryBookmarkStore = MemoryBookmarkStore;


/***/ }),

/***/ 816:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MemoryPublishStore = void 0;
var BigInteger = __webpack_require__(632);
/**
 * [[MemoryPublishStore]] represents the default implementation of the in-memory publish store. The AMPS client uses
 * publish stores for recovery purposes. The store is responsible for maintaining the state of published messages and
 * recovering that state in the event of a disconnection.
 */
var MemoryPublishStore = /** @class */ (function () {
    function MemoryPublishStore() {
        this.messageQueue = [];
        this._lastPersisted = null;
        this._lowestUnpersisted = null;
    }
    /**
     * Store the provided message. The sequence of the message is a key that the client can later use to replay the
     * operation or remove the operation from the store. Implementations may assume that the sequence increases
     * monotonically.
     *
     * @param {Message} message The message that contains fields like command name, topic name, data, etc.
     */
    MemoryPublishStore.prototype.store = function (message) {
        // Validation first
        if (message.c !== 'publish' && message.c !== 'delta_publish' && message.c !== 'sow_delete') {
            throw new Error('Invalid message type to store');
        }
        if (this.messageQueue.length > 0 &&
            this.messageQueue[this.messageQueue.length - 1].sequence.compare(message.s) >= 0) {
            // Invalid: sequence is not increasing
            throw new Error('Sequence id is not increasing');
        }
        // store the message
        this.messageQueue.push({ sequence: BigInteger(message.s), header: message, data: message.data });
        // remove data field from message
        delete message.data;
    };
    /**
     * This method replays all messages in the store using the provided message sender.
     *
     * @param {function} messageSender The sender that will re-send the messages.
     */
    MemoryPublishStore.prototype.replay = function (messageSender) {
        for (var _i = 0, _a = this.messageQueue; _i < _a.length; _i++) {
            var messageItem = _a[_i];
            messageSender(messageItem.header, messageItem.data);
        }
    };
    /**
     * This method replays the message with the specified sequenceId.
     *
     * @param {function} messageSender The sender that will re-send the message.
     * @param {BigInteger} sequenceId The sequence id of the message to replay.
     */
    MemoryPublishStore.prototype.replaySingle = function (messageSender, sequenceId) {
        var index = this.findQueueIndex(sequenceId);
        if (index < 0) {
            return;
        }
        var messageItem = this.messageQueue[index];
        messageSender(messageItem.header, messageItem.data);
    };
    /**
     * This method discards all operations up to the index provided.
     *
     * @param {BigInteger} sequenceId The sequence id to keep. All previous sequence numbers will be discarded.
     */
    MemoryPublishStore.prototype.discardUpTo = function (sequenceId) {
        // determine the index of the last message to release
        var cutBefore = this.findQueueIndex(sequenceId);
        if (this.messageQueue.length === 0 || cutBefore < 0) {
            return;
        }
        // set last persisted
        if (this._lastPersisted === null || this._lastPersisted.compare(sequenceId) < 0) {
            this._lastPersisted = sequenceId;
        }
        // release messages with sequence id < sequenceId not including sequenceId
        this.messageQueue.splice(0, cutBefore + 1);
        // adjust flags
        if (this.messageQueue.length > 0) {
            this._lowestUnpersisted = this.messageQueue[0].sequence;
        }
        else {
            this._lowestUnpersisted = null;
        }
    };
    /**
     * This method returns the number of messages in the store.
     *
     * @returns {number} The number of messages in the store.
     */
    MemoryPublishStore.prototype.unpersistedCount = function () {
        return this.messageQueue.length;
    };
    /**
     * This method returns the oldest sequence in the store.
     *
     * @returns {BigInteger} The oldest sequence number in the store.
     */
    MemoryPublishStore.prototype.lowestUnpersisted = function () {
        return this._lowestUnpersisted;
    };
    /**
     * This method returns the last persisted sequence id in the store.
     *
     * @returns {BigInteger} The sequence number of the last discarded message.
     */
    MemoryPublishStore.prototype.lastPersisted = function () {
        return this._lastPersisted;
    };
    // internal methods
    /**
     * This method finds the index of the sequence number in the message queue using classic binary search.
     * No need to take care of duplicates since we assume there is none. Since it's possible to have missing chains in
     * this list, we're looking for the last sequence id that is <= sequenceId rather than looking for a strict match.
     *
     * @param {BigInteger} sequenceId The sequence number to find.
     * @returns {number} The index found. If the sequence is not in the queue, returns -1. Not found in this case means
     * it's either bigger or smaller than all sequence numbers in the list
     * @private
     * @hidden
     */
    MemoryPublishStore.prototype.findQueueIndex = function (sequenceId) {
        var start = 0;
        var end = this.messageQueue.length;
        var last = end - 1;
        var found = -1;
        // short circuit
        if (end === 0 || this.messageQueue[0].sequence.compare(sequenceId) > 0) {
            return found;
        }
        var mid;
        while (start < end) {
            mid = Math.floor((start + end) / 2);
            if (this.messageQueue[mid].sequence.compare(sequenceId) > 0) {
                end = mid;
            }
            else if (this.messageQueue[mid].sequence.compare(sequenceId) <= 0 &&
                (mid === last || this.messageQueue[mid + 1].sequence.compare(sequenceId) > 0)) {
                found = mid;
                break;
            }
            else {
                start = mid + 1;
            }
        }
        return found;
    };
    return MemoryPublishStore;
}());
exports.MemoryPublishStore = MemoryPublishStore;


/***/ }),

/***/ 220:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Message = exports.MessageHeader = void 0;
var BigInteger = __webpack_require__(632);
var header_1 = __webpack_require__(192);
/**
 * This is a class that encapsulates a message header. The message header is exposed via `message.header` field of
 * the [[Message]] class:
 *
 * ```javascript
 * const  messageHandler = message => {
 *     if (message.header.command() === 'sow') {
 *         console.log(message.header.groupSequenceNumber());
 *         console.log(message.data);
 *     }
 * };
 * ```
 * @notice Not all messages populate all headers. The *Command Reference* provides detailed description of the headers
 * returned on specific messages and what they contain.
 */
var MessageHeader = /** @class */ (function () {
    function MessageHeader(_header) {
        this._header = _header;
    }
    /**
     * Returns the command name, e.g. 'publish', 'sow_and_subscribe', which is one of the following:
     * - ack
     * - publish
     * - delta_publish
     * - subscribe
     * - delta_subscribe
     * - oof
     * - sow
     * - sow_and_subscribe
     * - sow_and_delta_subscribe
     * - sow_delete
     * - unsubscribe
     *
     * Returns the command name.
     * @returns {string} The command name value.
     */
    MessageHeader.prototype.command = function () { return this._header.c; };
    /**
     * Returns the command id.
     * @returns {string} The command id value.
     */
    MessageHeader.prototype.commandId = function () { return this._header.cid; };
    /**
     * Returns the query id.
     * @returns {string} The query id.
     */
    MessageHeader.prototype.queryId = function () { return this._header.query_id; };
    /**
     * Returns the subscription id.
     * @returns {string} The subscription id.
     */
    MessageHeader.prototype.subId = function () { return this._header.sub_id; };
    /**
     * Returns the acknowledgement type for the given command. Multiple ack types are comma-delimited.
     * @returns {string} The acknowledgement message type.
     */
    MessageHeader.prototype.ackType = function () { return this._header.a; };
    /**
     * Returns the number of records to return. Note: If TopN is not equally divisible by the batch size, then more
     * records will be returned so that the total number of records is equally divisible by the batch size setting.
     * @returns {number} The top N value.
     */
    MessageHeader.prototype.topN = function () { return this._header.top_n; };
    /**
     * Returns the specified number of messages that are batched together when returning a query result.
     * @returns {number} The batch size value.
     */
    MessageHeader.prototype.batchSize = function () { return this._header.bs; };
    /**
     * Returns the topic value.
     * @returns {string} The topic value.
     */
    MessageHeader.prototype.topic = function () { return this._header.t; };
    /**
     * Returns a client-originated identifier used to mark a location in journaled messages.
     * @returns {string} The bookmark value.
     */
    MessageHeader.prototype.bookmark = function () { return this._header.bm; };
    /**
     * Returns a comma-delimited list of options on a specific command.
     * @returns {string} The options value.
     */
    MessageHeader.prototype.options = function () { return this._header.o ? this._header.o : this._header.opts; };
    /**
     * Returns the correlation id: opaque token set by an application and returned with the message. Must be
     * `base64` encoded characters only.
     * @returns {string} The correlationId value.
     */
    MessageHeader.prototype.correlationId = function () { return this._header.x; };
    /**
     * Returns the SOW topic key(s) by which to order SOW query.
     * @returns {string} The orderBy value.
     */
    MessageHeader.prototype.orderBy = function () { return this._header.orderby; };
    /**
     * Returns the sow key value.
     * A SOW key will accompany each message returned in an SOW batch. A SowKey may also be added to messages coming in
     * on a subscription when the published message matches a record in the SOW.
     *
     * Format:
     *
     * - string containing the digits of an unsigned long for AMPS-generated SOW keys
     *
     * OR
     *
     * - arbitrary string in the base64 character set for user-provided SOW keys.
     * @returns {string} The sow key value.
     */
    MessageHeader.prototype.sowKey = function () { return this._header.k; };
    /**
     * Returns the sowKeys as a comma-delimited value.
     * @returns {string} The sowKeys value.
     */
    MessageHeader.prototype.sowKeys = function () { return this._header.sow_keys; };
    /**
     * Returns the Message expiration value (in seconds).
     * @returns {number} The Message expiration value.
     */
    MessageHeader.prototype.expiration = function () { return this._header.e; };
    /**
     * Returns the client name value.
     * Used to identify a client. Useful for publishers that wish to identify the source of a publish, client status
     * messages and for client heartbeats.
     * @returns {string} The client name value.
     */
    MessageHeader.prototype.clientName = function () { return this._header.client_name; };
    /**
     * Returns an integer that corresponds to the publish message sequence number. For more information see the
     * *Replication* section in the *User Guide*.
     * @returns {BigInteger} The sequenceId value.
     */
    MessageHeader.prototype.sequenceId = function () {
        if (this._header.s !== undefined) {
            return BigInteger(this._header.s);
        }
        return undefined;
    };
    /**
     * Returns a comma-separated list of SubIds sent from AMPS engine to identify which client subscriptions match a
     * given `publish` message.
     * @returns {string} The subIds (comma-delimited) value.
     */
    MessageHeader.prototype.subIds = function () { return this._header.sids; };
    /**
     * Returns the content filter value.
     * @returns {string} The content filter value.
     */
    MessageHeader.prototype.filter = function () { return this._header.filter ? this._header.filter : this._header.f; };
    /**
     * Returns the message timestamp set by the server in a ISO-8601 date-time format.
     * @returns {string} The timestamp value.
     */
    MessageHeader.prototype.timestamp = function () { return this._header.ts; };
    /**
     * Returns the number of topic matches for the SOW query. Sent in `stats` acknowledgement message.
     * @returns {string} The topicMatches value.
     */
    MessageHeader.prototype.topicMatches = function () { return this._header.topic_matches; };
    /**
     * Returns the user id used to identify the user of a command.
     * @returns {string} The userId value.
     */
    MessageHeader.prototype.userId = function () { return this._header.user_id; };
    /**
     * Returns the failure message that appears when an acknowledgement returns a status of failure.
     * @returns {string} The failure reason value.
     */
    MessageHeader.prototype.reason = function () { return this._header.reason; };
    /**
     * Returns the number of records deleted from the SOW with a `sow_delete` command.
     * Used in conjunction with the stats acknowledgement.
     * @returns {string} The recordsDeleted value.
     */
    MessageHeader.prototype.recordsDeleted = function () { return this._header.records_deleted; };
    /**
     * Returns the number of records inserted into the SOW. Used in conjunction with the stats acknowledgement.
     * @returns {string} The recordsInserted value.
     */
    MessageHeader.prototype.recordsInserted = function () { return this._header.records_inserted; };
    /**
     * Returns number of records in the store. The value is returned in the acknowledgement to an SOW query.
     * @returns {string} The recordsReturned value.
     */
    MessageHeader.prototype.recordsReturned = function () { return this._header.records_returned; };
    /**
     * Returns the number of records updated in the SOW. Used in conjunction with the stats acknowledgement.
     * @returns {string} The recordsUpdated value.
     */
    MessageHeader.prototype.recordsUpdated = function () { return this._header.records_updated; };
    /**
     * For messages from a queue, returns the time at which the lease expires.
     */
    MessageHeader.prototype.leasePeriod = function () { return this._header.lp; };
    /**
     * Returns the transmission time value.
     * @returns {string} The transmission time value.
     */
    MessageHeader.prototype.transmissionTime = function () { return this._header.transmission_time; };
    /**
     * As a part of the acknowledgement to a SOW query, returns the number of matches.
     */
    MessageHeader.prototype.matches = function () { return this._header.matches; };
    /**
     * Sent with XML formatted message data to indicate the number of bytes used by the message body.
     */
    MessageHeader.prototype.messageLength = function () { return this._header.l; };
    /**
     * Returns the Group Sequence Number for each batch message of a SOW response.
     */
    MessageHeader.prototype.groupSequenceNumber = function () { return this._header.gseq; };
    /**
     * Returns the client status when client is monitored for heartbeats.
     * @returns {string} The client status value.
     */
    MessageHeader.prototype.status = function () { return this._header.status; };
    return MessageHeader;
}());
exports.MessageHeader = MessageHeader;
/**
 * This is the AMPS Message representation class. Any Message received from AMPS is a [[Message]] object.
 *
 * Message have two main fields: `header` and `data`. The `header` property is used to access message header fields,
 * such as command type, message length, sow key, etc. The `data` fields contains the message payload.
 *
 * ```javascript
 * const messageHandler = message => {
 *     // print out the command type
 *     console.log(message.header.command());
 *
 *     // get the subscription id of the message
 *     console.log(message.header.subId());
 *
 *     // print out message data
 *     console.log(message.data);
 * };
 * ```
 *
 * @see [[MessageHeader]] for the list of available header methods.
 */
var Message = /** @class */ (function (_super) {
    __extends(Message, _super);
    /**
     * The constructor basically prepares the header field so that a user can have access methods for header fields.
     * @private
     * @hidden
     */
    function Message() {
        var _this = _super.call(this) || this;
        // bookmark store-specific fields
        /**
         * @private
         * @hidden
         */
        _this.bookmarkSeqNo = 0;
        /**
         * @private
         * @hidden
         */
        _this._subscription = null;
        _this.header = new MessageHeader(_this);
        return _this;
    }
    /**
     * This is the method that initializes messages that are created from simple objects
     * @hidden
     */
    Message.fromObject = function (messageObject) {
        // A bit of black magic to convert a simple dict into an object of class Message
        messageObject.header = new MessageHeader(messageObject);
        return messageObject;
    };
    return Message;
}(header_1.Header));
exports.Message = Message;


/***/ }),

/***/ 817:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TypeHelper = exports.FixTypeHelper = void 0;
/**
 * This is a default implementation of the FIX/NVFIX type helper. Messages are converted into JavaScript objects.
 * Repeating groups will take on their last value and ordering of fields isn’t preserved. It is possible to set a
 * custom delimiter for messages, by default it is `\x01`.
 *
 * [[TypeHelper]] class already provides instances of this class for types `fix` and `nvfix`.
 */
var FixTypeHelper = /** @class */ (function () {
    /**
     * This is the constructor of the FixNvfixTypeHelper class.
     * @param delimiter Optional delimiter value.
     */
    function FixTypeHelper(delimiter) {
        if (delimiter === void 0) { delimiter = '\x01'; }
        this._delimiter = delimiter;
    }
    /**
     * This method is used to serialize data in order send it to the server. All data chunks will be converted into
     * an array of strings.
     *
     * @param {string | {[key: string]: any}} data The data to serialize.
     * @returns {string[]} Serialized data as an array of strings.
     */
    FixTypeHelper.prototype.serialize = function (data) {
        // already formatted fix/nvfix string
        if (typeof data === 'string') {
            return [data];
        }
        // otherwise, we assume it's an object with keys and values
        return [Object.keys(data)
                .map(function (key) { return key + '=' + data[key]; })
                .join(this._delimiter) + this._delimiter];
    };
    /**
     * This method deserializes FIX/NVFIX data from the Server into an object with key/value pairs. Non-unique values
     * will use the last value found in the message.
     *
     * @param data The data to deserialize.
     * @returns {{[key: string]: string}} Deserialized data as an object with key/value pairs.
     */
    FixTypeHelper.prototype.deserialize = function (data) {
        var parsedData = {};
        decodeURIComponent(escape(TypeHelper.Uint8ToString(new Uint8Array(data))))
            .split(this._delimiter)
            .filter(function (keyValue) { return keyValue.length > 0; })
            .map(function (keyValue) {
            var keyValueTuple = keyValue.split('=');
            var key = keyValueTuple[0];
            // no '=' inside of the value
            if (keyValueTuple.length === 2) {
                parsedData[key] = keyValueTuple[1];
            }
            else {
                parsedData[key] = keyValue.slice(key.length + 1);
            }
        });
        return parsedData;
    };
    FixTypeHelper.prototype.delimiter = function (delimiter) {
        if (typeof delimiter !== 'undefined') {
            this._delimiter = delimiter;
            return this;
        }
        return this._delimiter;
    };
    return FixTypeHelper;
}());
exports.FixTypeHelper = FixTypeHelper;
/**
 * This is a helper class that is used to register custom message types in order for the client to support them.
 * By default, the [[Client]] supports the following message types:
 * * __JSON__
 * * __FIX__  / __NVFIX__ - via [[FixTypeHelper]] class.
 * * __Binary__
 *
 * __Composite__ message types can be created using [[TypeHelper.compositeHelper]] method.
 *
 * Message type helpers can be accessed and registered via [[TypeHelper.helper]] static method.
 *
 * #### Create a custom helper for XML messages:
 *
 * ```javascript
 * const xmlTypeHelper = {
 *     serialize: data => [new XMLSerializer().serializeToString(data)],
 *     deserialize: data => {
 *         if (data.constructor === String) {
 *             return new DOMParser().parseFromString(data);
 *         }
 *         else {
 *             // Binary buffer, need to decode utf8
 *             return new DOMParser().parseFromString(
 *                 decodeURIComponent(escape(Uint8ToString(data)))
 *             );
 *         }
 *     }
 * };
 *
 * // Register the above XML custom helper for parsing all XML messages automatically
 * TypeHelper.helper('xml', xmlTypeHelper);
 * ```
 *
 * #### In case the custom parsing behavior is expected, it is possible to override the default type helper:
 *
 * ```javascript
 * // create a JSON type helper that does not parse JSON data into native JS objects keeping it as a string
 * const jsonHelper = {
 *     serialize: data => [data],
 *     deserialize: data => JSON.stringify(data)
 * };
 *
 * // override the default type helper
 * TypeHelper.helper('json', jsonHelper);
 * ```
 *
 * #### Register the `json-json-json-binary` composite message type with the type helper:
 *
 * ```javascript
 * TypeHelper.helper(
 *     'compositejjjb',
 *     TypeHelper.compositeHelper('json', 'json', 'json', 'binary')
 * );
 * ```
 *
 * #### Set the custom delimiter for NVFIX format:
 *
 * ```javascript
 * TypeHelper.helper('nvfix').delimiter('%01');
 * ```
 *
 * #### Register the custom helper for NVFIX format:
 *
 * ```javascript
 * const nvfixTypeHelper = {
 *     serialize: data => {
 *         // already formatted fix/nvfix string
 *         if (typeof data === 'string') {
 *             return [data];
 *         }
 *
 *         // otherwise, we assume it's an object with keys and values
 *         return [
 *             Object.keys(data).map(key => key + '=' + data[key]).join('\x01') + '\x01'
 *         ];
 *     },
 *     deserialize: data => {
 *         const parsedData = {};
 *         String.fromCharCode.apply(null, new Int8Array(data))
 *             .split('\x01')
 *             .slice(0, -1)
 *             .map(function(keyValue) {
 *                  const keyValueTuple = keyValue.split('=');
 *                  const key = keyValueTuple[0];
 *
 *                  // no '=' inside of the value
 *                  if (keyValueTuple.length === 2) {
 *                      parsedData[key] = keyValueTuple[1];
 *                  }
 *                  else {
 *                      parsedData[key] = keyValue.slice(key.length + 1);
 *                  }
 *             });
 *
 *         return parsedData;
 *     }
 * };
 *
 * // Register the above NVFIX custom helper for parsing all NVFIX messages automatically
 * TypeHelper.helper('nvfix', nvfixTypeHelper);
 * ```
 */
var TypeHelper = /** @class */ (function () {
    function TypeHelper() {
    }
    TypeHelper.getInstance = function () {
        if (!TypeHelper.instance) {
            TypeHelper.instance = TypeHelper.createInstance();
        }
        return TypeHelper.instance;
    };
    TypeHelper.createInstance = function () {
        var jsonTypeHelper = {
            serialize: function (data) {
                if (typeof data === 'string') {
                    return [data];
                }
                return [JSON.stringify(data)];
            },
            deserialize: function (data) {
                if (typeof data === 'string') {
                    return JSON.parse(data);
                }
                else {
                    // Binary buffer, need to decode utf8
                    return JSON.parse(String.fromCharCode.apply(null, new Uint8Array(data)));
                }
            }
        };
        var binaryTypeHelper = {
            serialize: function (data) { return [data]; },
            deserialize: function (data) { return data; }
        };
        return {
            'json': jsonTypeHelper,
            'binary': binaryTypeHelper,
            'fix': new FixTypeHelper(),
            'nvfix': new FixTypeHelper()
        };
    };
    /**
     * @hidden
     */
    TypeHelper.littleEndianSizeBuffer = function (size) {
        var result = new Uint32Array(1);
        result[0] = size;
        return result;
    };
    /**
     * @hidden
     */
    TypeHelper.bigEndianSizeBuffer = function (size) {
        var result = new Uint32Array(1);
        result[0] = ((size & 0x000000FF) << 24)
            | ((size & 0x0000FF00) << 8)
            | ((size & 0x00FF0000) >>> 8)
            | ((size & 0xFF000000) >>> 24);
        return result;
    };
    /**
     * @hidden
     */
    TypeHelper.Uint8ToString = function (uint8Array) {
        var CHUNK_SZ = 0x8000;
        var chars = [];
        for (var i = 0; i < uint8Array.length; i += CHUNK_SZ) {
            chars.push(String.fromCharCode.apply(null, uint8Array.subarray(i, i + CHUNK_SZ)));
        }
        return chars.join('');
    };
    TypeHelper.convertToArrayBuffers = function (data) {
        var result = [];
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var item = data_1[_i];
            if (typeof item === 'string') {
                // Need to convert to an ArrayBuffer
                var encoded = unescape(encodeURIComponent(item));
                var arrayified = new Uint8Array(encoded.length);
                for (var i = 0; i < encoded.length; ++i) {
                    arrayified[i] = encoded.charCodeAt(i);
                }
                result.push(arrayified);
            }
            else {
                result.push(item);
            }
        }
        return result;
    };
    /**
     * This method provides a helper for parsing messages of different types. If a helper was provided by a user,
     * registers it for future use.
     *
     * ```javascript
     * // access/store the existing helper
     * const oldHelper = TypeHelper.helper('json');
     *
     * // create a JSON type helper that does not parse JSON data into native JS objects keeping it as a string
     * const jsonHelper = {
     *     serialize: data => [data],
     *     deserialize: data => JSON.stringify(data)
     * };
     *
     * // override the existing/default type helper
     * TypeHelper.helper('json', jsonHelper);
     * ```
     *
     * @param {string} messageType The type of message to handle.
     * @param {ITypeHelper} newHelper A helper object with predefined functions that can be provided for custom
     * parsing/handling of a message type.
     * @returns {ITypeHelper} The helper object assigned/registered.
     */
    TypeHelper.helper = function (messageType, newHelper) {
        var instance = TypeHelper.getInstance();
        if (newHelper !== undefined) {
            instance[messageType] = newHelper;
            return newHelper;
        }
        if (instance[messageType] !== undefined) {
            return instance[messageType];
        }
        return instance.binary;
    };
    /**
     * This method is used to create composite message types from other registered types, such as JSON, XML, or
     * the ones added by a user prior to calling this method.
     *
     * ```javascript
     * // Register the json-xml-json-binary composite message type with the type helper
     * TypeHelper.helper(
     *     'compositejxjb',
     *     TypeHelper.compositeHelper('json', 'xml', 'json', 'binary')
     * );
     * ```
     *
     * @param {...string} messageType Previously registered types of messages.
     * @returns {ITypeHelper} A created [[ITypeHelper]]-compatible object.
     */
    TypeHelper.compositeHelper = function () {
        var messageTypes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messageTypes[_i] = arguments[_i];
        }
        // Generate all the type base helpers that are included in this composite helper
        var helpers = messageTypes.map(function (item) { return TypeHelper.helper(item); });
        return {
            // The list of types this composite helps with
            helpers: helpers,
            serialize: function (data) {
                if (data.length > helpers.length) {
                    throw 'too many elements to serialize';
                }
                var result = [];
                for (var i = 0; i < data.length; ++i) {
                    var part = TypeHelper.convertToArrayBuffers(helpers[i].serialize(data[i]));
                    result = result.concat(TypeHelper.bigEndianSizeBuffer(part[0].length), part);
                }
                return result;
            },
            deserialize: function (data) {
                var result = [];
                var position = 0;
                var index = 0;
                while (data.byteLength - position > 0) {
                    var sizeBuffer = new Uint8Array(data, position, 4);
                    position += 4;
                    var bytes = (sizeBuffer[0] << 24) |
                        (sizeBuffer[1] << 16) |
                        (sizeBuffer[2] << 8) |
                        (sizeBuffer[3]);
                    result.push(helpers[index].deserialize(new Uint8Array(data, position, bytes)));
                    position += bytes;
                    ++index;
                }
                return result;
            }
        };
    };
    return TypeHelper;
}());
exports.TypeHelper = TypeHelper;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;
///////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2016-2024 60East Technologies Inc., All Rights Reserved.
//
// This computer software is owned by 60East Technologies Inc. and is
// protected by U.S. copyright laws and other laws and by international
// treaties.  This computer software is furnished by 60East Technologies
// Inc. pursuant to a written license agreement and may be used, copied,
// transmitted, and stored only in accordance with the terms of such
// license agreement and with the inclusion of the above copyright notice.
// This computer software or any other copies thereof may not be provided
// or otherwise made available to any other person.
//
// U.S. Government Restricted Rights.  This computer software: (a) was
// developed at private expense and is in all respects the proprietary
// information of 60East Technologies Inc.; (b) was not developed with
// government funds; (c) is a trade secret of 60East Technologies Inc.
// for all purposes of the Freedom of Information Act; and (d) is a
// commercial item and thus, pursuant to Section 12.212 of the Federal
// Acquisition Regulations (FAR) and DFAR Supplement Section 227.7202,
// Government's use, duplication or disclosure of the computer software
// is subject to the restrictions set forth by 60East Technologies Inc..
//
////////////////////////////////////////////////////////////////////////////

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MemoryPublishStore = exports.BookmarkRangeField = exports.BookmarkField = exports.MemoryBookmarkStore = exports.FixedDelayStrategy = exports.ExponentialDelayStrategy = exports.DefaultSubscriptionManager = exports.DefaultServerChooser = exports.BigInteger = exports.TypeHelper = exports.Message = exports.Header = exports.Command = exports.Client = void 0;
var BigInteger = __webpack_require__(632);
exports.BigInteger = BigInteger;
var client_1 = __webpack_require__(836);
Object.defineProperty(exports, "Client", ({ enumerable: true, get: function () { return client_1.Client; } }));
var header_1 = __webpack_require__(192);
Object.defineProperty(exports, "Header", ({ enumerable: true, get: function () { return header_1.Header; } }));
var command_1 = __webpack_require__(372);
Object.defineProperty(exports, "Command", ({ enumerable: true, get: function () { return command_1.Command; } }));
var message_1 = __webpack_require__(220);
Object.defineProperty(exports, "Message", ({ enumerable: true, get: function () { return message_1.Message; } }));
var default_server_chooser_1 = __webpack_require__(444);
Object.defineProperty(exports, "DefaultServerChooser", ({ enumerable: true, get: function () { return default_server_chooser_1.DefaultServerChooser; } }));
var default_subscription_manager_1 = __webpack_require__(552);
Object.defineProperty(exports, "DefaultSubscriptionManager", ({ enumerable: true, get: function () { return default_subscription_manager_1.DefaultSubscriptionManager; } }));
var exponential_delay_strategy_1 = __webpack_require__(708);
Object.defineProperty(exports, "ExponentialDelayStrategy", ({ enumerable: true, get: function () { return exponential_delay_strategy_1.ExponentialDelayStrategy; } }));
var fixed_delay_strategy_1 = __webpack_require__(628);
Object.defineProperty(exports, "FixedDelayStrategy", ({ enumerable: true, get: function () { return fixed_delay_strategy_1.FixedDelayStrategy; } }));
var memory_bookmark_store_1 = __webpack_require__(808);
Object.defineProperty(exports, "MemoryBookmarkStore", ({ enumerable: true, get: function () { return memory_bookmark_store_1.MemoryBookmarkStore; } }));
var memory_publish_store_1 = __webpack_require__(816);
Object.defineProperty(exports, "MemoryPublishStore", ({ enumerable: true, get: function () { return memory_publish_store_1.MemoryPublishStore; } }));
var type_helper_1 = __webpack_require__(817);
Object.defineProperty(exports, "TypeHelper", ({ enumerable: true, get: function () { return type_helper_1.TypeHelper; } }));
var bookmark_field_1 = __webpack_require__(208);
Object.defineProperty(exports, "BookmarkField", ({ enumerable: true, get: function () { return bookmark_field_1.BookmarkField; } }));
var bookmark_range_field_1 = __webpack_require__(748);
Object.defineProperty(exports, "BookmarkRangeField", ({ enumerable: true, get: function () { return bookmark_range_field_1.BookmarkRangeField; } }));

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=amps.js.map