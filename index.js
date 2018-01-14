//import Binance from 'binance-api-node'
Binance = require('binance-api-node').default;
var mainSymb = 'ETH';
var lastPrices = [];
var timeout = 60000;
var percent = 2.7;
var numberObservTicks = 3;
var stack = 1;
var telegrammBot = 'ask';
var chatId = '@WhatTheSCAM';
var reqUrl = `https://api.telegram.org/bot${telegrammBot}/sendMessage`;
var request = require('request');
//debugger
//const client = Binance()

// Authenticated client, can make signed calls
const client = Binance({
})

function req(text) {
	var reqOptions = {
		url: reqUrl,
		method: 'POST',
		headers: {
			'Content-Type':     'application/x-www-form-urlencoded'
		},
		form: {
			chat_id: chatId,
			parse_mode: 'HTML',
			text: text
		}
	}

	request(reqOptions, (data, err) => {
		console.log(err, err);
	})
}

req('Hello');

function notifi(simbols) {
	var tamplate = "symbol <b><%S%></b>\n" +
		"<a href='https://www.google.com.ua/search?q=<%S%>+token'>serch in google</a>\n" +
		"<a href='https://www.google.com.ua/search?q=<%S%>+token+twitter'>serch twitter</a>\n" +
		"<a href='https://www.binance.com/trade.html?symbol=<%S%>_ETH'>Binance</a>\n"

	var text = '';
	var simbol;
	for(var i = 0; i < simbols.length; i += 1) {
		simbol = simbols[i];
		text += tamplate.replace(/<%S%>/g, simbol) + '\n';
	}

	req(text);
}

function priceFilster(prices) {
	var result = {};
	for ( var k in prices ) {
		if( k.indexOf(mainSymb) === (k.length - mainSymb.length) ) {
			result[k] = prices[k];
		}
	}
	return result;
}

function getChanges(lastPrices) {
	var changed = [];
	function compareWithCurrent(last, current) {
		var overLimit = [],
			lastValue, currentValue;

		for(var k in last) {
			lastValue = parseFloat(last[k]);
			currentValue = parseFloat(current[k]);
			persent = lastValue / 100 * percent;
			if(currentValue - lastValue  > persent) {
				overLimit.push(k);
			}
		}

		return overLimit;
	}

	var lastPrice, currPrice, persent, overLimit = [];
	for(var i = 1; i < lastPrices.length; i += 1) {
		lastPrice = lastPrices[i];
		changed.push( compareWithCurrent(lastPrices[i -1], lastPrice) );
	}
	changed = changed.reduce((accum, curr)=>{
		var res = [];
		if(!accum) {
			return curr;
		}
		for(var i = 0; i < accum.length; i += 1) {
			if( curr.includes(accum[i]) ) {
				res.push(accum[i]);
			}
		}

		return res;
	});

	return changed;
}

function getClearSymbolsList(changed) {
	return changed.map( function(el) {
		return el.substring(0, el.length - mainSymb.length);
	} );
}

var BinanceAdapte = {
	getBalance() {
		client.balance(function(balances) {
			console.log("balances()", balances);
			console.log("ETH balance: ", balances.ETH.available);
			return balances.ETH.available;
		});
	},
	getPrices() {
		return client.prices();
	}
}

class Manager {
	constructor(API, communication) {
		this.API = API;
		this.part = 0.2;
		this.symb = mainSymb;
		this.stack = 1;
		this.notifi = communication;
	}

	async tick(prices) {
		//for test
		if(!prices) {
			prices = await this.API.getPrices()
		}

		var changed = [], clearSimbols;
		if(prices instanceof Error) {
			return
		}
		prices = priceFilster(prices);
		lastPrices.push(prices);
		if(lastPrices.length < numberObservTicks) {
			return;
		} else if(lastPrices.length > numberObservTicks) {
			lastPrices.splice(0, 1);
		}

		changed = getChanges(lastPrices);
		//lastPrices = prices;
		if(changed.length === 0) {
			return;
		}

		//this.buyProcess(changed);

		clearSimbols = getClearSymbolsList(changed);
		console.log(clearSimbols);
		this.notifi(clearSimbols);
	}

	defineExchangePrice(balance) {
		var price = 0,
			overPrice = 0;

		if(balance >= this.part) {
			price = this.part;
			// if (balance > this.stack) {
			// 	// define overprice. If stack == 1 and balance == 1.3 and part == 0.2 than overPrice = 0.3 / 0.2
			// 	overPrice = (balance - this.stack) / (this.stack / this.part)
			// }
			price = price + overPrice;
		}
		return price
	}

	async buyProcess(changed) {
		var balance = this.API.getBalance(),
			price = this.defineExchangePrice(balance);

		if(price == 0) {
			return
		}

	}

	buy(simbols) {
		var balance = this.getBalance();
	}
}

var manager = new Manager(BinanceAdapte, notifi);

function main() {
	manager.tick();
}

setInterval(main, timeout)

function test() {
	var testRes = ['RDN'];
	function MockNotify(data) {
		if( !Array.isArray(data) ) {
			throw 'Test Mock should be a array'
		}
		if(data.length !== testRes.length) {
			throw "he length of data and test data shoul be equal"
		}
		for(var i = 0; i < data.length; i += 1) {
			if( !testRes.includes(data[i]) ) {
				throw data[i] + ' not includes in testRes;'
			}
		}
		console.log('test pass');
	}

	function callForData(data) {
		data.forEach((el)=>{
			var res = {};
			for(var k in el) {
				res[k] = el[k] + '';
			}

			manager.tick(res);
		});
	}

	var manager = new Manager(BinanceAdapte, MockNotify);
	var testDataTemplate = {
		RDNETH:0.00674780,
		QSPETH:0.00062312,
		REQETH:0.00082954
	};

	// fitst test
	var testData = [testDataTemplate];
	testData.push( {
		RDNETH: testDataTemplate.RDNETH + (testDataTemplate.RDNETH / 100) * (percent + 1),
		QSPETH: testDataTemplate.QSPETH + (testDataTemplate.QSPETH / 100) * (percent - 1) ,
		REQETH: testDataTemplate.REQETH + (testDataTemplate.REQETH / 100) * (percent)
	} )
	testData.push( {
		RDNETH: testData[1].RDNETH + (testData[1].RDNETH / 100) * (percent + 1),
		QSPETH: testData[1].QSPETH + (testData[1].QSPETH / 100) * (percent - 1),
		REQETH: testData[1].REQETH + (testData[1].REQETH / 100) * (percent)
	} )

	callForData(testData);

	// second test
	lastPrices = [];
	testRes = [];
	testData = [testDataTemplate];
	testData.push( {
		RDNETH: testDataTemplate.RDNETH + (testDataTemplate.RDNETH / 100) * (percent ),
		QSPETH: testDataTemplate.QSPETH + (testDataTemplate.QSPETH / 100) * (percent - 1) ,
		REQETH: testDataTemplate.REQETH + (testDataTemplate.REQETH / 100) * (percent)
	} )
	testData.push( {
		RDNETH: testData[1].RDNETH + (testData[1].RDNETH / 100) * (percent ),
		QSPETH: testData[1].QSPETH + (testData[1].QSPETH / 100) * (percent - 1),
		REQETH: testData[1].REQETH + (testData[1].REQETH / 100) * (percent)
	} )

	callForData(testData);
	console.log('test pass');

	// third test
	lastPrices = [];
	testRes = ['REQ'];
	testData = [testDataTemplate];
	testData.push( {
		RDNETH: testDataTemplate.RDNETH + (testDataTemplate.RDNETH / 100) * (percent),
		QSPETH: testDataTemplate.QSPETH + (testDataTemplate.QSPETH / 100) * (percent + 1) ,
		REQETH: testDataTemplate.REQETH + (testDataTemplate.REQETH / 100) * (percent + 0.5)
	} )
	testData.push( {
		RDNETH: testData[1].RDNETH + (testData[1].RDNETH / 100) * (percent - 0.5),
		QSPETH: testData[1].QSPETH + (testData[1].QSPETH / 100) * (percent - 0.5),
		REQETH: testData[1].REQETH + (testData[1].REQETH / 100) * (percent +0.5)
	} )

	callForData(testData);

	// 4 test
	lastPrices = [];
	testRes = ['QSP'];
	testData = [testDataTemplate];
	testData.push( {
		RDNETH: testDataTemplate.RDNETH + (testDataTemplate.RDNETH / 100) * (percent + 5),
		QSPETH: testDataTemplate.QSPETH + (testDataTemplate.QSPETH / 100) * (percent + 5) ,
		REQETH: testDataTemplate.REQETH + (testDataTemplate.REQETH / 100) * (percent + 0.5)
	} )
	testData.push( {
		RDNETH: testData[1].RDNETH + (testData[1].RDNETH / 100) * (percent - 0.1),
		QSPETH: testData[1].QSPETH + (testData[1].QSPETH / 100) * (percent + 0.1),
		REQETH: testData[1].REQETH + (testData[1].REQETH / 100) * (percent - 0.5)
	} )

	callForData(testData);
}
//test();

//main()
//client.time().then(time => console.log(time))