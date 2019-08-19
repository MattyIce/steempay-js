let steempay = (function() {
	let config = {
		api_url: 'https://steempay.io',
		pub_key: 'STM6LoQ2tr436jpLAefP8YyAyDkZCc8XB15DCeA5DA5eYND8kVvXc'
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

	function set_options(options) {
		config = Object.assign(config, options);
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

	function payment_methods() {
		let methods = ['steemconnect', 'active_key'];

		if(window.steem_keychain)
			methods.unshift('steem_keychain');

		if(!('ontouchstart' in window))
			methods.push('vessel');

		return methods;
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

	return {
		api,
		start_purchase,
		payment_methods
	}
})();