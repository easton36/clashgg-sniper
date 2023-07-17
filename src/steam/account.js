const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');

const CONFIG = require('../config');
const Logger = require('../utils/logger.util');
const { tradeOfferAccepted } = require('../discord/webhook');

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
}) => {
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
	 * Accept a Steam trade confirmation
	 */
	const acceptConfirmation = (confirmationId) => new Promise((resolve, reject) => {
		if(!identitySecret) return reject(new Error('No identity secret'));

		community.acceptConfirmationForObject(identitySecret, confirmationId, (err) => {
			if(err) return reject(err);

			return resolve(true);
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

	// called when the client has finished logging in
	const _loggedOn = () => {
		Logger.info(`[${username}] Logged in to Steam as ${client.steamID.getSteamID64()}`);
		client.setPersona(EPersonaState.Online);
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
		Logger.info(`[${username}] Account limitations: limited=${limited} communityBanned=${communityBanned} locked=${locked}`);
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

					if(CONFIG.DISCORD_WEBHOOK_URL){
						tradeOfferAccepted(CONFIG.DISCORD_WEBHOOK_URL, offer);
					}
				} catch(err){
					Logger.error(`[${username}] Failed to accept trade offer: ${err.message || err}`);
				}
			} else{
				// Inform the user that the bot cannot accept the trade, don't accept it
				Logger.info(`[${username}] Trade offer ${offer.id} from ${partnerSteamId} is requesting items from us. Leaving for manual review.`);
			}
		}
	};

	// Steam Event Handlers
	client.on('loggedOn', _loggedOn);
	client.on('webSession', _webSessionInitialized);
	client.on('error', _error);
	client.on('disconnected', _disconnected);
	client.on('accountLimitations', _accountLimitations);

	community.on('sessionExpired', _sessionExpired);

	manager.on('newOffer', _newOffer);

	return {
		getSteamTotpCode,
		getSteamServerTime,

		fetchConfirmations,

		acceptConfirmation,
		acceptAllConfirmations,

		createOffer,
		attemptOfferSend,

		login,
		reLogin
	};
};