let steempay = (function() {
	let config = {
		api_url: 'https://steempay.io',
		pub_key: 'STM6LoQ2tr436jpLAefP8YyAyDkZCc8XB15DCeA5DA5eYND8kVvXc',
		chain_id: 'ssc-mainnet1'
	}

	let tokens = {};

	let payment_functions = {
		steemconnect: submit_payment_steemconnect,
		active_key: submit_payment_active_key,
		steem_keychain: submit_payment_steem_keychain,
		vessel: submit_payment_vessel
	}

	function api(url, data) {
		return new Promise((resolve, reject) => {
			if (data == null || data == undefined) data = {};

			// Add a dummy timestamp parameter to prevent IE from caching the requests.
			data.v = new Date().getTime();

			if (_player) {
				data.token = _player.token;
				data.username = _player.name;
			}

			var xhr = new XMLHttpRequest();
			xhr.open('GET', config.api_url + url + '?' + param(data));
			xhr.onload = function() {
				if (xhr.status === 200)
					resolve(try_parse(xhr.responseText));
				else
					reject('Request failed.  Returned status of ' + xhr.status);
			};
			xhr.send();
		});
	}

	async function init(options) {
		config = Object.assign(config, options);
		tokens = await api('/supported_tokens');
	}

	async function start_purchase(account, amount, price_currency, payment_currency, data) {
		return new Promise(async (resolve, reject) => {
			try {
				let result = await api('/start_payment', {
					account,
					amount,
					price_currency,
					payment_currency,
					data
				});

				if(!result)
					reject();

				if(result.success)
					resolve(result.payment);
				else
					reject(result.error);
			} catch (err) { reject(err); }
		});
	}

	async function lookup_purchase(id) {
		return await api('/find_payment', { id });
	}

	async function submit_payment(payment_method, payment, from_address, key) {
		let payment_function = payment_functions[payment_method];

		if(!payment_function)
			return { error: 'Unsupported payment method specified.' };

		return await payment_function(payment, from_address, key);
	}

	async function submit_payment_steemconnect(payment, from_address) {
		if(!payment || !payment.payment_currency || !tokens[payment.payment_currency] || !['steem', 'steem-engine'].includes(tokens[payment.payment_currency].type))
			return { error: 'Invalid payment information or unsupported payment currency.' };

		let token_type = tokens[payment.payment_currency].type;
		let url = null;

		if(token_type == 'steem') {
			url = `https://v2.steemconnect.com/sign/transfer?to=${payment.account}&amount=${parseFloat(payment.payment_amount).toFixed(3)}%20${payment.payment_currency}&memo=${payment.id}`;
		} else if (token_type == 'steem_engine') {
			url = 'https://steemconnect.com/sign/custom-json?authority=active';
			url += '&required_posting_auths=' + encodeURI('[]');
			url += '&required_auths=' + encodeURI('["' + from_address + '"]');
			url += '&id=' + config.chain_id;
			url += '&json=' + encodeURI(JSON.stringify(get_se_transfer_data(payment)));
		}

		popupCenter(url, 'SteemConnect Payment', 600, 800);
	}

	async function submit_payment_steem_keychain(payment, from_address) {
		if(!payment || !payment.payment_currency || !tokens[payment.payment_currency] || !['steem', 'steem-engine'].includes(tokens[payment.payment_currency].type))
			return { error: 'Invalid payment information or unsupported payment currency.' };

		let token_type = tokens[payment.payment_currency].type;

		if(token_type == 'steem') {
			return new Promise(resolve => {
				steem_keychain.requestTransfer(from_address, payment.account, parseFloat(payment.payment_amount).toFixed(3), payment.id, payment.payment_currency, r => {
					resolve({
						success: r.success, 
						trx_id: r.success ? r.result.id : null,
						error: r.success ? null : ((typeof r.error == 'string') ? r.error : JSON.stringify(r.error))
					})
				});
			});
		} else if (token_type == 'steem_engine') {
			new Promise(resolve => steem_keychain.requestCustomJson(from_address, config.chain_id, 'Active', get_se_transfer_data(payment), 'Transfer Tokens', r => {
				resolve({
					success: r.success, 
					trx_id: r.success ? r.result.id : null,
					error: r.success ? null : ((typeof r.error == 'string') ? r.error : JSON.stringify(r.error))
				})
			}));
		}
	}

	function payment_methods(token_symbol) {
		let token = tokens[token_symbol];

		if(!token)
			return [];

		if(['steem', 'steem_engine'].includes(token.type)) {
			let methods = ['steemconnect', 'active_key'];

			if(window.steem_keychain)
				methods.unshift('steem_keychain');

			if(!('ontouchstart' in window))
				methods.push('vessel');

			return methods;
		}

		if(token.type == 'tron')
			return ['tronweb'];
	}

	function param(object) {
    var encodedString = '';
    for (var prop in object) {
        if (object.hasOwnProperty(prop)) {
            if (encodedString.length > 0) {
                encodedString += '&';
            }
            encodedString += encodeURI(prop + '=' + object[prop]);
        }
    }
    return encodedString;
	}

	function try_parse(json) {
		try {
			return JSON.parse(json);
		} catch(err) {
			console.log('Error trying to parse JSON: ' + json);
			return null;
		}
	}

	function get_se_transfer_data(payment) {
		return {
			"contractName": "tokens",
			"contractAction": "transfer",
			"contractPayload": {
				"symbol": payment.payment_currency,
				"to": payment.account,
				"quantity": parseFloat(payment.payment_amount) + '',
				"memo": payment.id
			}
		};
	}

	function popupCenter(url, title, w, h) {
		// Fixes dual-screen position                         Most browsers      Firefox
		var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
		var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
	
		var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
		var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
	
		var left = ((width / 2) - (w / 2)) + dualScreenLeft;
		var top = ((height / 2) - (h / 2)) + dualScreenTop;
		var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
	
		// Puts focus on the newWindow
		if (window.focus) {
				newWindow.focus();
		}
	
		return newWindow;
	}

	return {
		api,
		init,
		start_purchase,
		lookup_purchase,
		payment_methods,
		submit_payment
	}
})();