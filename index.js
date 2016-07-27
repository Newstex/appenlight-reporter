/**
 * AppEnlight Error reporting
 *
 * @author: Chris Moyer <cmoyer@aci.info>
 * @see: https://github.com/Newstex/appenlight-reporter
 */
'use strict';
var request = require('request');
var _ = require('lodash');
var os = require('os');

var HOSTNAME = os.hostname();

// Default Endpoints
var DEFAULT_ENDPOINT = 'https://api.appenlight.com/api/';
var PROTOCOL_VERSION = '0.5';

/**
 * Generic transmitter for AppEnlight reports
 *
 * @param config: Object consisting of:
 * 	api_key:  (required) Your API key for submitting reports to AppEnlight
 * 	tags: (optional) global tags to send along with each request
 * 	endpoint: (optional) Custom endpoint if you're self-hosting AppEnlight (defaults to https://api.appenlight.com/api/)
 * 	server_name: (optional) Server name to send instead of the default os.hostname();
 */
function AppEnlightReporter(config){
	if(!config || !config.api_key){
		throw new Error('API Key is required');
	}
	if(!config.endpoint){
		config.endpoint = DEFAULT_ENDPOINT;
	}
	if(!config.server_name){
		config.server_name = HOSTNAME;
	}
	this.config = config;
}

/**
 * Low-level request.
 *
 * @param api: API name to call, should be one of the APIs at: https://getappenlight.com/page/api/main.html
 * @param data: The JSON Object of data to send
 * @param callback: (Optional) An optional callback to return the results to
 */
AppEnlightReporter.prototype.makeRequest = function makeRequest(api, data, callback){
	request({
		method: 'POST',
		uri: this.config.endpoint + api + '?protocol_version=' + PROTOCOL_VERSION,
		headers: {
			'X-appenlight-api-key': this.config.api_key,
		},
		json: data,
	}, function(e,r,b){
		if(!/^OK/.test(b)){
			console.error('AppEnlight REQUEST FAILED', b, data);
		}
		if(callback){
			callback(e,r,b);
		}
	});
};

/**
 * Send metrics to the General Metrics API.
 *
 * @see: https://getappenlight.com/page/api/0.5/general_metrics.html
 *
 * @param namespace: A "namespace" for these metrics. Used for grouping
 * @param vals: An array of arrays, consisting of key, value for a given metric.
 * 	For example: ```[['counter_a', 15.5], ['counter_b', 63]]```
 * @param callback: (Optional) An optional callback to return the results to
 */
AppEnlightReporter.prototype.sendMetrics = function sendMetrics(namespace, vals, callback){
	this.makeRequest('general_metrics', [{
		timestamp: (new Date()).toISOString(),
		namespace: namespace,
		server_name: this.config.server_name,
		tags: vals,
	}], callback);
};

/**
 * Send an error or "slow call" report
 *
 * @see: https://getappenlight.com/page/api/0.5/reports.html
 *
 * @param options: See available options at: https://getappenlight.com/page/api/0.5/reports.html
 * @param callback: (Optional) An optional callback to return the results to
 */
AppEnlightReporter.prototype.sendReport = function sendReport(options, callback){
	options.client = 'node-appenlight-reporter';
	options.language = 'node.js';
	if(!options.server){
		options.server = this.config.server;
	}
	if(!options.end_time){
		options.end_time = (new Date()).toISOString();
	}
	this.makeRequest('reports', [options], callback);
};

module.exports = AppEnlightReporter;
