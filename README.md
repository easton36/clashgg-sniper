# Clash.gg Item Sniper and Bulk Seller

This is a simple script that will automatically purchase items from the Clash.gg store as soon as they become available, if the price is below a certain threshold.
It will also automatically sell items in bulk at a markup percentage that you specify.

### Features
 - Automatic item purchasing
	- Specify a minimum price threshold
	- Specify a maximum price threshold
	- Blacklist specific items
	- Purchase items based on Clash.gg markup percentage
	- Purchase items based on Buff163 percentage
 - Automatic item selling
	- Automatically send trade offers when we sell items
 - Steam account management
	- Automatically accept trade offers that only GIVE us items
 - Discord Webhook notifications (nice embeds)

### Requirements
 - Node.js v12 or higher
 - MongoDB
 - Clash.gg account with "trader" mode enabled

### Setup
 - Clone this repository
 - Rename `.env.example` to `.env`
 - Fill your Clash.gg `refresh_token` cookie into `.env` as `REFRESH_TOKEN`
 - Fill your Clash.gg `cf_clearance` cookie into `.env` as `CF_CLEARANCE`
 - Fill rest of `.env` as you wish, it is pretty self explanatory and commented well
 - Run `npm install` to install dependencies

### Usage
 - Run `npm start` to start the script

### Notes
 - You will need to restart the script every time you change the `.env` file.

### Screenshots
![Discord Webhook Screenshot](https://raw.githubusercontent.com/easton36/clashgg-sniper/master/screenshots/Discord-Webhook-Screenshot.png)

### Disclaimer
 - I am not responsible for any bans or restrictions that you may receive from using this script.
 - Steam has shown to be very unpredictable with their bans, so use this script at your own risk.
 - I am not responsible for any loss of items or money that you may incur from using this script.