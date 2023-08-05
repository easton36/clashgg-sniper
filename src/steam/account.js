const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');

const CONFIG = require('../config');
const Logger = require('../utils/logger.util');

const { EPersonaState } = SteamUser;
const { ETradeOfferState } = TradeOfferManager;

/**
 * Steam account manager
 * @param {Object} options - The options for the Steam account manager
 * @param {String} options.username - The username for the Steam account manager
 * @param {String} options.password - The password for the Steam account manager
 * @param {String} options.sharedSecret - The shared secret for the Steam account manager
 * @param {String} options.identitySecret - The identity secret for the Steam account manager
 * @param {String} options.domain - OPTIONAL; The domain for the Steam account manager
 * @param {Object} options.proxy - OPTIONAL; The proxy for the Steam account manager
 * @param {String} options.proxy.httpProxy - OPTIONAL; The HTTP proxy for the Steam account manager
 * @param {String} options.proxy.socksProxy - OPTIONAL; The SOCKS proxy for the Steam account manager
 * @param {Function} callback - The callback for the Steam account manager
 * @returns {Object} The Steam account manager
 */
module.exports = ({
	username,
	password,
	sharedSecret,
	identitySecret,
	domain = 'localhost',
	proxy: {
		httpProxy,
		socksProxy
	} = {}
}, callback) => {
	const steamSessionOpts = {};

	if(httpProxy) steamSessionOpts.httpProxy = httpProxy;
	if(socksProxy) steamSessionOpts.socksProxy = socksProxy;

	// Steam user
	const client = new SteamUser({ autoRelogin: true });
	// Steam Community
	const community = new SteamCommunity();
	// Trade offer manager
	const manager = new TradeOfferManager({
		steam: client,
		domain,
		language: 'en',
		savePollData: true,
		pollInterval: 1000 * 30, // 30 seconds

		cancelTime: (1000 * 60 * 10) - 30, // 10 minutes until trades cancelled - poll interval
		pendingCancelTime: 1000 * 60 * 2 // if trade isnt confirmed by mobile after 2 minutes, cancel it
	});

	const createdOffers = {};

	/**
	 * Get steam totp code
	 */
	const getSteamTotpCode = () => SteamTotp.generateAuthCode(sharedSecret || '');

	/**
	 * Get steam server time
	 */
	const getSteamServerTime = () => SteamTotp.time();

	/**
	 * Logs into Steam
	 * @returns {void}
	 */
	const login = () => {
		try{
			client.logOn({
				accountName: username,
				password,
				twoFactorCode: SteamTotp.generateAuthCode(sharedSecret)
			});
		} catch(err){
			Logger.error(`[${username}] Failed to login: ${err.message || err}`);
		}
	};

	/**
	 * Attempts to relog into Steam
	 * @returns {void}
	 */
	const reLogin = () => {
		try{
			// if steamid isnt set we need to reconnect
			if(!client.steamID){
				login();
			} else client.webLogOn();
		} catch(err){
			Logger.error(`[${username}] Failed to relogin: ${err.message || err}`);
		}
	};

	/**
	 * Fetch Steam account trade confirmations
	 */
	const fetchConfirmations = async () => new Promise((resolve, reject) => {
		if(!identitySecret) throw new Error('No identity secret');

		const currentTime = Math.floor(Date.now() / 1000);
		const confirmationKey = SteamTotp.getConfirmationKey(identitySecret, currentTime, 'conf');

		community.getConfirmations(currentTime, confirmationKey, (err, confirmations) => {
			if(err) return reject(err);

			return resolve(confirmations);
		});
	});

	/**
	 * Accept all Steam trade confirmations
	 */
	const acceptAllConfirmations = () => new Promise((resolve, reject) => {
		if(!identitySecret) return reject(new Error('No identity secret'));

		const currentTime = Math.floor(Date.now() / 1000);
		const confirmationKey = SteamTotp.getConfirmationKey(identitySecret, currentTime, 'conf');
		const allowKey = SteamTotp.getConfirmationKey(identitySecret, currentTime, 'allow');

		community.acceptAllConfirmations(currentTime, confirmationKey, allowKey, (err) => {
			if(err) return reject(err);

			return resolve(true);
		});
	});

	/**
	 * Accept a Steam trade offer
	 * @param {Object} offer - The Steam trade offer
	 * @returns {Promise<String>} The Steam trade offer status
	 * @throws {Error} The error which occurred
	 */
	const acceptOffer = (offer) => new Promise((resolve, reject) => {
		offer.accept((err, status) => {
			if(err) return reject(err);

			return resolve(status);
		});
	});

	/**
	 * Create a new trade offer
	 * @param {String} tradelink - The tradelink to send the offer to
	 * @returns {TradeOffer}
	 */
	const createOffer = (tradelink) => {
		try{
			const offer = manager.createOffer(tradelink);

			return offer;
		} catch(err){
			Logger.error(`[${username}] Failed to create trade offer: ${err.message || err}`);

			return null;
		}
	};

	/**
	 * Attempt to send a trade offer
	 * @async
	 * @private
	 * @param {TradeOffer} offer - The offer to send
	 * @param {*} tradelink - The tradelink to send the offer to
	 * @returns {Promise<Object>}
	 */
	const attemptOfferSend = (offer, tradelink) => new Promise((resolve, reject) => {
		try{
			Logger.info(`[${username}] Attempting to send offer to ${tradelink}`);

			offer.send((err, result) => {
				if(err){
					Logger.warn(`[${username}] Failed to send offer to ${tradelink}: ${err.message || err}`);

					return reject(err);
				}

				resolve(result);
			});
		} catch(err){
			return reject(err);
		}
	});

	/**
	 * Cancel an offer with a specific offer ID
	 * @param {String} offerId - The offerId to cancel
	 * @returns {Promise<Object>} The result of the cancellation
	 */
	const cancelOffer = (offerId) => new Promise((resolve, reject) => {
		try{
			Logger.info(`[${username}] Attempting to cancel offer ${offerId}`);

			const offer = createdOffers[offerId];
			// cancel the offer
			offer.cancel((err, result) => {
				if(err){
					Logger.warn(`[${username}] Failed to cancel offer ${offer.id}: ${err.message || err}`);

					return reject(err);
				}

				resolve(result || true);
			});
		} catch(err){
			return reject(err);
		}
	});

	/**
	 * Create and send a new trade offer
	 * @async
	 * @param {String} tradelink - The tradelink to send the offer to
	 * @param {Object} item - The item to send
	 * @param {String} item.appid - The appid of the item
	 * @param {String} item.contextid - The contextid of the item
	 * @param {String} item.assetid - The assetid of the item
	 * @param {String} item.name - The name of the item
	 * @param {String} message - OPTIONAL, The message to send with the offer
	 * @returns {Promise<String>} The offer ID
	 * @throws {Error} If the offer cannot be sent
	 */
	const sendOffer = async (tradelink, item, message) => {
		const itemString = `ITEM: ${item.name}, ASSETID: ${item.assetid}`;

		try{
			const offer = createOffer(tradelink);
			if(message){
				offer.setMessage(message);
			}
			// add item to the offer
			offer.addMyItem({
				appid: item.appid,
				assetid: item.assetid,
				id: item.assetid,
				contextid: item.contextid,
				amount: 1
			});

			const status = await _attemptOfferSend(offer, tradelink);
			Logger.info(`[${username}] Sent offer ${offer.id} to ${tradelink} with status ${status}. ${itemString}`);

			if(status === 'pending'){
				await _mobileConfirmOffer(offer.id);
			}

			createdOffers[offer.id] = offer;

			return offer.id;
		} catch(err){
			Logger.error(`[${username}] Failed to send offer to ${tradelink}. ${itemString}: ${err.message || err}`);

			return false;
		}
	};

	/**
	 * Attempt to send a trade offer
	 * @async
	 * @private
	 * @param {TradeOffer} offer - The offer to send
	 * @param {*} tradelink - The tradelink to send the offer to
	 * @returns {Promise<Object>}
	 */
	const _attemptOfferSend = (offer, tradelink) => new Promise((resolve, reject) => {
		try{
			Logger.info(`[${username}] Attempting to send offer to ${tradelink}`);

			offer.send((err, result) => {
				if(err){
					Logger.warn(`[${username}] Failed to send offer to ${tradelink}: ${err.message || err}`);

					return reject(err);
				}

				resolve(result);
			});
		} catch(err){
			return reject(err);
		}
	});

	/**
	 * Confirm an offer on mobile
	 * @async
	 * @param {String} offerId - The offer id to confirm
	 * @returns {Promise<void>}
	 */
	const _mobileConfirmOffer = async (offerId) => new Promise((resolve, reject) => {
		try{
			Logger.info(`[${username}] Attempting to confirm offer ${offerId}`);

			community.acceptConfirmationForObject(identitySecret, offerId, (err) => {
				if(err){
					return reject(err);
				}

				return resolve(true);
			});

			Logger.info(`[${username}] Mobile confirmed offer: ${offerId}`);
		} catch(err){
			Logger.warn(`[${username}] Failed to confirm offer ${offerId}: ${err.message || err}`);
		}
	});

	// called when the client has finished logging in
	const _loggedOn = () => {
		Logger.info(`[${username}] Logged in to Steam as ${client.steamID.getSteamID64()}`);

		client.setPersona(EPersonaState.Online);

		if(CONFIG.PLAY_GAME_APPID){
			client.gamesPlayed([CONFIG.PLAY_GAME_APPID], true);
		}
	};

	/**
	 * When the client has successfully logged on to Steam and the sentry file has been saved
	 * @param {String} sessionId - The Steam session ID
	 * @param {String} cookies - The Steam cookies
	 * @returns {void}
	 * @private
	 */
	const _webSessionInitialized = (sessionId, cookies) => {
		Logger.info(`[${username}] Got session: ${sessionId}`);

		community.setCookies(cookies);
		manager.setCookies(cookies, (err) => {
			if(err){
				return Logger.warn(`[${username}] Failed to set cookies: ${err?.message}`);
			}

			Logger.info(`[${username}] Trade offer manager ready`);
		});
	};

	/**
	 * When the client encounters an error
	 * @param {String} err - The error
	 * @returns {void}
	 * @private
	 */
	const _error = (err) => {
		Logger.warn(`[${username}] Error: ${err?.message}`);

		return login();
	};

	/**
	 * Called when the client is disconnected
	 * @param {String} eresult - The error result
	 * @param {String} msg - The message
	 * @returns {void}
	 * @private
	 */
	const _disconnected = (eresult, msg) => {
		Logger.warn(`[${username}] Disconnected: eresult=${eresult} msg=${msg} (should auto-reconnect)`);
	};

	/**
	 * Called when the client receives account limitations from Steam
	 * @param {Boolean} limited - If the account is limited
	 * @param {Boolean} communityBanned - If the account is community banned
	 * @param {Boolean} locked - If the account is locked
	 * @returns {void}
	 * @private
	 */
	const _accountLimitations = (limited, communityBanned, locked) => {
		const message = `[${username}] Account limitations: limited=${limited} communityBanned=${communityBanned} locked=${locked}`;

		if(limited || communityBanned || locked){
			Logger.warn(message);
		} else{
			Logger.info(message);
		}
	};

	/**
	 * Called when the community session has expired
	 * @param {String} err - The error
	 * @returns {void}
	 * @private
	 */
	const _sessionExpired = (err) => {
		try{
			Logger.info(`[${username}] Session expired, attempting to relogin ${err.message}`);

			reLogin();
		} catch(err){
			Logger.error(`[${username}] Failed to relogin: ${err.message || err}`);
		}
	};

	/**
	 * Called when the bot receives a new trade offer
	 * @param {TradeOffer} offer - the trade offer
	 * @returns {void}
	 */
	const _newOffer = async (offer) => {
		if(offer.state === ETradeOfferState.Active){
			const partnerSteamId = offer.partner.getSteamID64();
			Logger.info(`[${username}] New offer received from ${partnerSteamId}. Offer ID: ${offer.id}.`);

			// If the trade is only receiving items and not sending any, accept it
			if(offer.itemsToGive.length === 0){
				try{
					const status = await acceptOffer(offer);
					const itemNames = offer.itemsToReceive.map(item => item.market_hash_name).join(', ');

					Logger.info(`[${username}] Accepted trade offer: ${offer.id}. Status: ${status}. Items Received: ${itemNames}`);

					callback('trade_accepted', offer);
				} catch(err){
					Logger.error(`[${username}] Failed to accept trade offer: ${err.message || err}`);
				}
			} else{
				// Inform the user that the bot cannot accept the trade, don't accept it
				Logger.info(`[${username}] Trade offer ${offer.id} from ${partnerSteamId} is requesting items from us. Leaving for manual review.`);
			}
		}
	};

	/**
	 * Called when the process is shutting down
	 * @returns {void}
	 * @private
	 */
	const _shutdown = () => {
		Logger.warn(`[${username}] Logging off`);

		// log off from Steam
		client.logOff();

		Logger.warn('Shutting down...');
		// exit the process
		process.exit(0);
	};

	// Steam Event Handlers
	client.on('loggedOn', _loggedOn);
	client.on('webSession', _webSessionInitialized);
	client.on('error', _error);
	client.on('disconnected', _disconnected);
	client.on('accountLimitations', _accountLimitations);

	community.on('sessionExpired', _sessionExpired);

	manager.on('newOffer', _newOffer);

	// listen for process exit
	process.on('SIGINT', _shutdown);
	process.on('SIGTERM', _shutdown);
	process.on('SIGQUIT', _shutdown);
	process.on('beforeExit', _shutdown);

	return {
		getSteamTotpCode,
		getSteamServerTime,

		fetchConfirmations,

		acceptAllConfirmations,

		createOffer,
		attemptOfferSend,
		cancelOffer,

		login,
		reLogin,

		sendOffer
	};
};