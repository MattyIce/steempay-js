const utils = require('./utils');
const dsteem = require('dsteem');
const request = require('request');

let config = {
	api_url: 'https://steempay.io',
	pub_key: 'STM6LoQ2tr436jpLAefP8YyAyDkZCc8XB15DCeA5DA5eYND8kVvXc'
}

function set_options(options) {
	config = Object.assign(config, options);
}

function validate(sig, msg, pub_key) {
	if(!pub_key)
		pub_key = config.pub_key;

	try {
		let from_sig = dsteem.Signature.fromString(sig).recover(Buffer.from(dsteem.cryptoUtils.sha256(msg)));
		return from_sig == pub_key;
	} catch (err) { return false; }
}

async function start_purchase(account_name, amount, price_currency, payment_currency) {
	return new Promise((resolve, reject) => {
		request.get(`${config.api_url}/start_payment?account=${account_name}&amount=${amount}&price_currency=${price_currency}&payment_currency=${payment_currency}`, (e, r, data) => {
			if(e)
				reject(e);
			else
				resolve(utils.tryParse(data));
		});
	});
}

async function lookup_purchase(id) {
	return new Promise((resolve, reject) => {
		request.get(`${config.api_url}/find_payment?id=${id}`, (e, r, data) => {
			if(e)
				reject(e);
			else
				resolve(utils.tryParse(data));
		});
	});
}

module.exports = {
	set_options,
	validate,
	start_purchase,
	lookup_purchase
}