module.exports = function({numberObservTicks, percent}) {
    var lastPrices = [];

    return async function({prices}) {
        var changed = [],
            res = {};

        lastPrices.push(prices);
        if(lastPrices.length < numberObservTicks) {
            return changed;
        } else if(lastPrices.length > numberObservTicks) {
            lastPrices.splice(0, 1);
        }

        function compareWithCurrent(last, current) {
            var overLimit = {},
                lastValue, currentValue;

            for(var k in last) {
                lastValue = last[k];
                currentValue = current[k];
                persent = lastValue / 100 * percent;
                if(currentValue - lastValue  > persent) {
                    overLimit[k] = current[k]
                }
            }

            return overLimit;
        }

        var lastPrice, currPrice, persent, overLimit = [];
        for(var i = 1; i < lastPrices.length; i += 1) {
            lastPrice = lastPrices[i];
            changed.push( compareWithCurrent(lastPrices[i -1], lastPrice) );
        }

        res = changed.reduce((accum, curr)=>{
            var res = {};
            if(!accum) {
                return curr;
            }
            for(var k in accum) {
                if( typeof curr[k] !== 'undefined' ) {
                    res[k] = curr[k];
                }
            }

            return res;
        });

        return res;
    }
}
