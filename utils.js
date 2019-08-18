function tryParse(json) {
	try {
		return JSON.parse(json);
	} catch(err) {
		return null;
	}
}

module.exports = {
	tryParse
}