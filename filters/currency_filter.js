module.exports = function({mainSymb}) {
    return async function ({prices}) {
        var result = {};
        for ( var k in prices ) {
            if( k.indexOf(mainSymb) === (k.length - mainSymb.length) ) {
                result[k] = prices[k];
            }
        }
        return result;
    }
}