'use strict';

const req = require("request")
const cookieStore = require("tough-cookie-file-store")
const fs = require('fs')
const path = require('path')
const debug = require('debug')('eero')

const timeout = 5000
const apiEndpoint = "https://api-user.e2ro.com"
const apiVersion = "2.2"
// Use /tmp on Heroku (ephemeral but writable), or local tmp directory
const tmpDir = process.env.DYNO ? '/tmp' : path.join(__dirname, '.tmp')
const cookieFile = path.join(tmpDir, 'eero_cookies.json')

class Eero {
	constructor() {
		// this.token = null
		this.networkUrl = null

		// make a cookie directory and file if needed
		if (!fs.existsSync(tmpDir)) {
			fs.mkdirSync(tmpDir, { recursive: true })
		}
		if (!fs.existsSync(cookieFile)) {
			let createStream = fs.createWriteStream(cookieFile)
			createStream.end()
		}
		this.cookieJar = req.jar(new cookieStore(cookieFile))
	}

	_loggedIn() {
		let cookies = this.cookieJar.getCookies(`${apiEndpoint}/${apiVersion}/`)
		for (const cookie of cookies) {
			if (cookie.key == 's') {
				debug("cookie is "+cookie.value)
				return cookie.value.length > 16
			}
		}
		debug("not logged in")
		return false
	}

	logout() {
		let options = { maxAge: 0 }
		this.cookieJar.setCookie('s=none', `${apiEndpoint}/`, options)
	}

	_post(path, form = null) {
		return new Promise((resolve, reject) => {
			let url = `${apiEndpoint}/${apiVersion}/${path}`
			debug(`_post ${url}`)
			let options = { 
				url: url, 
				jar: this.cookieJar, 
				json: true, 
				timeout: timeout,
				headers: {
					'User-Agent': 'eero/6.63.0 (iPhone; iOS 17.0; Scale/2.00)',
					'X-eero-client-version': '6.63.0',
					'X-eero-client-os': 'ios',
					'X-eero-client-os-version': '17.0'
				}
			}
			if (form) {
				options.form = form
			}
			req.post(
				options,
				(err, res, body) => {
					if (err) {
						reject({
							error: err, response: res, 
							message: `POST Error path: ${path}'. ERROR ${err}`
						})
						return
					}
					if (res.statusCode !== 200) {
						reject({
							error: err, response: res, 
							message: `POST failed to ${path}. Response: ${res.statusCode} ${
								res.statusMessage}`
						})

						return
					}
					resolve(body.data)
				}
			)
		})
	}

	_put(fullPath, data = null) {
		return new Promise((resolve, reject) => {
			debug("_put - loggedIn?")
			if (!this._loggedIn()) {
				reject ({ error: new Error("User not logged in"), response: null, message: 'PUT failed, not logged in'})
				return
			}
			let url = `${apiEndpoint}${fullPath}`
			debug(`_put ${url}`, data)
			let options = { 
				url: url, 
				jar: this.cookieJar, 
				json: true, 
				timeout: timeout,
				headers: {
					'User-Agent': 'eero/6.63.0 (iPhone; iOS 17.0; Scale/2.00)',
					'X-eero-client-version': '6.63.0',
					'X-eero-client-os': 'ios',
					'X-eero-client-os-version': '17.0'
				}
			}
			
			if (data) {
				options.body = data
			}
			
			req.put(
				options,
				(err, res, body) => {
					if (err) {
						reject({
							error: err, response: res, 
							message: `PUT Error path: ${fullPath}'. ERROR ${err}`
						})
						return
					}
					if (res.statusCode !== 200) {
						reject({
							error: err, response: res, 
							message: `PUT failed to ${fullPath}. Response: ${res.statusCode} ${
								res.statusMessage}`
						})
						return
					}
					resolve(body.data)
				}
			)
		})
	}

	_postUrl(fullPath, data = null) {
		return new Promise((resolve, reject) => {
			debug("_postUrl - loggedIn?")
			if (!this._loggedIn()) {
				reject ({ error: new Error("User not logged in"), response: null, message: 'POST failed, not logged in'})
				return
			}
			let url = `${apiEndpoint}${fullPath}`
			debug(`_postUrl ${url}`, data)
			let options = { 
				url: url, 
				jar: this.cookieJar, 
				json: true, 
				timeout: timeout,
				headers: {
					'User-Agent': 'eero/6.63.0 (iPhone; iOS 17.0; Scale/2.00)',
					'X-eero-client-version': '6.63.0',
					'X-eero-client-os': 'ios',
					'X-eero-client-os-version': '17.0'
				}
			}
			
			if (data) {
				options.body = data
			}
			
			req.post(
				options,
				(err, res, body) => {
					if (err) {
						reject({
							error: err, response: res, 
							message: `POST Error path: ${fullPath}'. ERROR ${err}`
						})
						return
					}
					if (res.statusCode !== 200) {
						reject({
							error: err, response: res, 
							message: `POST failed to ${fullPath}. Response: ${res.statusCode} ${
								res.statusMessage}`
						})
						return
					}
					resolve(body.data)
				}
			)
		})
	}

	_delete(fullPath) {
		return new Promise((resolve, reject) => {
			debug("_delete - loggedIn?")
			if (!this._loggedIn()) {
				reject ({ error: new Error("User not logged in"), response: null, message: 'DELETE failed, not logged in'})
				return
			}
			let url = `${apiEndpoint}${fullPath}`
			debug(`_delete ${url}`)
			let options = { 
				url: url, 
				jar: this.cookieJar, 
				json: true, 
				timeout: timeout,
				headers: {
					'User-Agent': 'eero/6.63.0 (iPhone; iOS 17.0; Scale/2.00)',
					'X-eero-client-version': '6.63.0',
					'X-eero-client-os': 'ios',
					'X-eero-client-os-version': '17.0'
				}
			}
			
			req.delete(
				options,
				(err, res, body) => {
					if (err) {
						reject({
							error: err, response: res, 
							message: `DELETE Error path: ${fullPath}'. ERROR ${err}`
						})
						return
					}
					if (res.statusCode !== 200 && res.statusCode !== 204) {
						reject({
							error: err, response: res, 
							message: `DELETE failed to ${fullPath}. Response: ${res.statusCode} ${
								res.statusMessage}`
						})
						return
					}
					resolve(body ? body.data : {})
				}
			)
		})
	}

	_get(path) {
		debug("GET", path)
		return new Promise((resolve, reject) => {
			debug("_get - loggedIn?")
			if (!this._loggedIn()) {
				reject ({ error: new Error("User not logged in"), response: null, message: 'GET failed, not logged in'})
				return
			}
			let url = `${apiEndpoint}${path}`;
			let that = this
			req({ 
				url: url, 
				jar: this.cookieJar, 
				json:true, 
				timeout: timeout,
				headers: {
					'User-Agent': 'eero/6.63.0 (iPhone; iOS 17.0; Scale/2.00)',
					'X-eero-client-version': '6.63.0',
					'X-eero-client-os': 'ios',
					'X-eero-client-os-version': '17.0'
				}
			},
				(err, res, body) => {
					if (err) {
						reject({
							error: err, response: res, 
							message: `GET Error path: ${path}'. ERROR ${err}`
						})
						return
					}
					if (res.statusCode !== 200) {
						reject({
							error: err, response: res, 
							message: `GET failed to ${path}. Response: ${res.statusCode} ${
								res.statusMessage}`
						})
						return
					}
					debug("GET: got body, size=%s", Object.keys(body.data).length)
					resolve(body.data);
				}
			)
		})
	}

	_retryGet(path, retries = 1) {
		return this._get(path)
			.then(res => {
				return res
			})
			.catch(reject => {
				if (retries == 0) {
					if (reject.response && reject.response.statusCode == 401) {
						// we ran out of retries and its 401 status, kill the cookie
						this.logout()
						debug("FAILED, rejected 401")
						throw reject
					}
					else {
						debug("FAILED, rejected", reject)
						throw reject
					}
				}
				debug("_retryGet - loggedIn?")
				if (!this._loggedIn()) {
					// nothing to refresh, just retry
					return this._retryGet(path, retries - 1)
				}
				// refresh login and try again
				return this.loginRefresh()
					.then(() => {
						debug("Retry", path)
						return this._retryGet(path, retries - 1)
					})
					.catch(reject => {
						throw reject
					})
			})
	}

	login(identifier) {
		let form = { 'login': identifier }
		return this._post('login', form)
			.then(res => {
				return res
			})
	}

	loginVerify(verificationCode) {
		let form = { 'code': verificationCode }
		return this._post('login/verify', form)
			.then(res => {
				return res
			})
			.catch(reject => {
				if (reject.response.statusCode == 401) {
					reject.message = 'You need to login() to set up your session'
				}
				throw reject
			})
	}

	loginRefresh() {
		return this._post('login/refresh')
			.then(res => {
				return res
			})
			.catch(reject => {
				_logout()
			})
	}

	get(url) {
		return this._retryGet(url)
	}

	account() {
		return this._retryGet(`/${apiVersion}/account`)
	}

	networks() {
		return this._retryGet(`/${apiVersion}/networks`)
	}

	network(networkUrl) {
		return this._retryGet(networkUrl)
	}

	devices(networkUrl) {
		return this._retryGet(`${networkUrl}/devices`)
	}

	eeros(networkUrl) {
		return this._retryGet(`${networkUrl}/eeros`)
	}

	reboot(deviceId) {
		return this._retryGet(`${apiVersion}/eeros/${deviceId}/reboot`)
	}

	pause(deviceUrl) {
		// Attempt to pause device (note: may not work if device_blacklist capability is disabled)
		return this._put(deviceUrl, { paused: true })
	}

	unpause(deviceUrl) {
		// Unpause device
		return this._put(deviceUrl, { paused: false })
	}

	deleteDevice(deviceUrl) {
		return this._delete(deviceUrl)
	}

	block(deviceUrl) {
		return this._put(deviceUrl, { blocked: true})
	}

	unblock(deviceUrl) {
		return this._put(deviceUrl, { blocked: false })
	}

	profiles(networkUrl) {
		return this._retryGet(`${networkUrl}/profiles`)
	}

	insights(networkUrl) {
		return this._retryGet(`${networkUrl}/insights`)
	}

	// Eero hardware controls
	rebootEero(eeroUrl) {
		return this._retryGet(`${eeroUrl}/reboot`)
	}

	eeroLed(eeroUrl, action) {
		// action can be 'on' or 'off'
		return this._put(`${eeroUrl}/led`, { led_on: action === 'on' })
	}

	eeroConnections(eeroUrl) {
		return this._retryGet(`${eeroUrl}/connections`)
	}

	// Profile schedules
	profileSchedules(profileUrl) {
		return this._retryGet(`${profileUrl}/schedules`)
	}

	createSchedule(profileUrl, name, days, startTime, endTime) {
		// days: array of day names, e.g. ['monday', 'tuesday']
		// startTime/endTime: 'HH:MM' format, e.g. '21:30'
		return this._postUrl(`${profileUrl}/schedules`, {
			name: name,
			enabled: true,
			days: days,
			start: startTime,
			end: endTime
		})
	}

	updateSchedule(scheduleUrl, data) {
		return this._put(scheduleUrl, data)
	}

	deleteSchedule(scheduleUrl) {
		return this._delete(scheduleUrl)
	}
	device_blacklist(networkUrl) {
		return this._retryGet(`${networkUrl}/device_blacklist`)
	}
}

module.exports = Eero
