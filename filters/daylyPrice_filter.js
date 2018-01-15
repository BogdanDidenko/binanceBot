module.exports = function() {
    var price,
        daylyPrice;

    return async function({prices, manager}) {
        var res = {};

        for(var k in prices) {
            price = prices[k];
            var daylyPrice = await manager.API.getDaylyPrice(k);

            if(price > daylyPrice) {
                res[k] = prices[k];
            }
        }

        return res;
    }
}