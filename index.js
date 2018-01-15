//import Binance from 'binance-api-node'
Binance = require('binance-api-node').default;
Filters = require('./filters');

var mainSymb = 'ETH';
var lastPrices = [];
var timeout = 60000;//
var percent = 1.8;
var numberObservTicks = 3;
var stack = 1;
var fs = require('fs');
var telegrammBot =  fs.readFileSync('bot_id.txt', 'utf8');
var chatId = '@WhatTheSCAM';
var reqUrl = `https://api.telegram.org/bot${telegrammBot}/sendMessage`;
var request = require('request');
var filtersList = [
	Filters.currency({mainSymb}),
	Filters.daylyPrice(),
	Filters.priceHistory({percent, numberObservTicks})
]

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


function getClearSymbolsList(changed) {
	var res = [];
	for(var k in changed) {
		res.push( k.substring(0, k.length - mainSymb.length) );
	}
	return res;
}



toFloat = (prices) => {
	var res = {};
	for(var k in prices) {
		res[k] = parseFloat(prices[k]);
	}

	return res;
}

var BinanceAdapte = {
	async getBalance() {
		client.balance(function(balances) {
			console.log("balances()", balances);
			console.log("ETH balance: ", balances.ETH.available);
			return balances.ETH.available;
		});
	},
	async getPrices() {
		return toFloat( client.prices() );
	},
	async getDaylyPrice(symb) {
		var dailyStats  = await client.dailyStats({ symbol: 'REQETH' });
		return parseFloat(dailyStats.weightedAvgPrice);
	}
}

class Rule {
	constructor({API, ruleAction}) {
		this.API = API;
		this.ruleAction = ruleAction;
	}

	filter(symbolArray) {
		return symbolArray.filter( (el)=>{
			return this.ruleAction(el);
		} )
	}
}

class Manager {
	constructor({API, communication, filtersList}) {
		this.API = API;
		this.stack = 1;
		this.notifi = communication;
		this.filtersList = filtersList;
	}

	async applyFilters(prices) {
		var filter;
		for(var filter of this.filtersList) {
			prices = await filter({prices: prices, manager: this});
		}

		return prices;
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

		changed = await this.applyFilters(prices);
		//lastPrices = prices;
		if(Object.keys(changed).length === 0) {
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

var manager = new Manager({API: BinanceAdapte, communication: notifi, filtersList});

function main() {
	manager.tick();
}

setInterval(main, timeout)
//test();

function test() {
	var manager;
	var percent = 3;
	var testDataTemplate = {
		RDNETH:0.00674780,
		QSPETH:0.00062312,
		REQETH:0.00082954
	};

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
				res[k] = el[k];
			}

			manager.tick(res);
		});
	}
	var testRes;

	function it1() {
		testRes = ['RDN'];

		var filtersList = [
			Filters.currency({mainSymb}),
			Filters.priceHistory({percent:3, numberObservTicks}),
			Filters.daylyPrice()
		]
		manager = new Manager({API: BinanceAdapte, communication: MockNotify, filtersList});

		BinanceAdapte.getDaylyPrice = function(symb) {
			return testDataTemplate.RDNETH + (testDataTemplate.RDNETH / 100) * (percent + 1)
		}

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
	}
	it1();

	function it2() {
		testRes = ['RDN'];

		var filtersList = [
			Filters.currency({mainSymb}),
			Filters.daylyPrice(),
			Filters.priceHistory({percent:3, numberObservTicks})
		]
		manager = new Manager({API: BinanceAdapte, communication: MockNotify, filtersList});

		BinanceAdapte.getDaylyPrice = function(symb) {
			return testDataTemplate.RDNETH + (testDataTemplate.RDNETH / 100) * (percent + 1)
		}

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
	}
	it2();

	function it3() {
		lastPrices = [];
		testRes = [];
		testData = [testDataTemplate];

		var filtersList = [
			Filters.currency({mainSymb}),
			Filters.priceHistory({percent:3, numberObservTicks}),
			Filters.daylyPrice()
		]

		manager = new Manager({API: BinanceAdapte, communication: MockNotify, filtersList});
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
	}
	it3();


	function it4() {
		lastPrices = [];
		testRes = ['REQ'];
		testData = [testDataTemplate];
		var filtersList = [
			Filters.currency({mainSymb}),
			Filters.priceHistory({percent:3, numberObservTicks}),
			Filters.daylyPrice()
		]
		BinanceAdapte.getDaylyPrice = function(symb) {
			return testDataTemplate.REQETH - (testDataTemplate.REQETH / 100) * (percent + 1)
		}

		manager = new Manager({API: BinanceAdapte, communication: MockNotify, filtersList});
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
	}
	it4();

	function it5() {
		lastPrices = [];
		testRes = ['QSP'];
		testData = [testDataTemplate];
		var filtersList = [
			Filters.currency({mainSymb}),
			Filters.priceHistory({percent:3, numberObservTicks}),
			Filters.daylyPrice()
		]
		BinanceAdapte.getDaylyPrice = function(symb) {
			return testDataTemplate.QSPETH - (testDataTemplate.QSPETH / 100) * (percent + 1)
		}

		manager = new Manager({API: BinanceAdapte, communication: MockNotify, filtersList});
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
	it5();

	function it6() {
		lastPrices = [];
		testRes = ['RDN'];
		testData = [testDataTemplate];
		var filtersList = [
			Filters.currency({mainSymb}),
			Filters.priceHistory({percent:3, numberObservTicks}),
			Filters.daylyPrice(),
		]
		BinanceAdapte.getDaylyPrice = function(symb) {
			return testDataTemplate.RDNETH + (testDataTemplate.RDNETH / 100) * (percent + 5)
		}

		manager = new Manager({API: BinanceAdapte, communication: MockNotify, filtersList});
		testData.push( {
			RDNETH: testDataTemplate.RDNETH + (testDataTemplate.RDNETH / 100) * (percent + 5),
			QSPETH: testDataTemplate.QSPETH + (testDataTemplate.QSPETH / 100) * (percent + 5) ,
			REQETH: testDataTemplate.REQETH + (testDataTemplate.REQETH / 100) * (percent + 0.5)
		} )
		testData.push( {
			RDNETH: testData[1].RDNETH + (testData[1].RDNETH / 100) * (percent + 5),
			QSPETH: testData[1].QSPETH + (testData[1].QSPETH / 100) * (percent + 0.1),
			REQETH: testData[1].REQETH + (testData[1].REQETH / 100) * (percent - 0.5)
		} )

		callForData(testData);
	}
	it6();
}
//test();

//main()
//client.time().then(time => console.log(time))