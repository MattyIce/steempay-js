# SteemPay JS
JavaScript SDK for the SteemPay service. For more information and to set up your account, visit the SteemPay website at [https://steempay.io](https://steempay.io).

## Installation

### Server-side Node JS

```
npm install steempay-js
```

### Browser

```
<script src="steempay.min.js"></script>
```

## Payment Notifications

The primary function of the SteemPay service is to send a server-to-server notification whenever a successful payment is received. In your app's back-end code you will need to set up an API endpoint that can receive a `GET` request from the SteemPay servers for the payment notification messages. The examples below show how this can be implemented using the `express` package in Node JS, however any method of receiving and processing `GET` API requests will work.

You can register the IPN URL for your account with the SteemPay system through the [steempay.io website](https://steempay.io).

```
const steempay = require('steempay');
const express = require('express');
const app = express();

app.get('/steempay_notification', async (req, res) => {
	// Validate that the request comes from SteemPay
	if(!steempay.validate(req.query.sig, req.query.trx_id)) {
		// Return an error if the signature provided with the request is not valid
		res.json({ error: 'Invalid signature provided.' });
		return;
	}

	// Process the payment and respond with the result
});
```

IPN requests will look like the following:

```
{
	"id": "steempay-aTNE1VbAYyaGzpWYRwZP",
	"from": "sender",
	"to": "your-account",
	"amount": 1.234,
	"currency": "STEEM",
	"block_time": "2019-08-19T15:57:51.000Z",
	"block_num": 35692906,
	"trx_id": "f2a92b684c6989b1e100d15df9b93d273b728c00",
	"block_id": "0220a16a6565c7fa1d8398d3d069a4a1bbf9a18c",
	"data": "your custom data for this purchase",
	"sig": "2004700a19a6ec68364293914a437bd57f0043157856d26b8bd24f3d9b128905ce0fe60babb5341ddf5cdb08292762ac4a9d54a42cb91c13c92416a485efa8c80f"
}
```

The ID of the payment transaction on the Steem blockchain, identified by the `trx_id` property, is digitally signed with the public key for the SteemPay service `STM6LoQ2tr436jpLAefP8YyAyDkZCc8XB15DCeA5DA5eYND8kVvXc` to generate the `sig` property value. By verifying this signature you can be sure that the request is coming from the SteemPay service.
