# Clash.gg Item Sniper and Bulk Seller

This is a simple script that will automatically purchase items from the Clash.gg store as soon as they become available, if the price is below a certain threshold.
It will also automatically sell items in bulk at a markup percentage that you specify.

### To Do
 - More discord webhook notifications than originally planned, so `src/discord/webhook.js` should get cleaned up.
 - Multiple account support
 - Steam account proxy support

### Features
 - Automatic item purchasing
	- Specify a minimum price threshold
	- Specify a maximum price threshold
	- Blacklist specific items
	- Purchase items based on Clash.gg markup percentage
	- Purchase items based on Buff163 percentage
	- Doppler phase and price checking (CLASH.GG DOESN'T PRICE DOPPLER GEMS)
 - Automatic item selling
	- Automatically send trade offers when we sell items
 - Steam account management
	- Automatically accept trade offers that only GIVE us items
 - Discord Webhook notifications (nice embeds)
 - Nice logging to console
 - Nice JSON purchase and sell logs for accounting
	- Logs are stored in `logs/` directory
 - Automatic price updating
	- Automatically update prices of items in the database with pricempire.com
 - Automatically scrape cf_clearance cookie from Clash.gg
 - Automatically update access_token when it expires
 - Balance tracking and smart purchasing
 - Convert JSON logs to CSV files for easy accounting

### Requirements
 - Node.js v12 or higher
 - MongoDB
 - Clash.gg account with "trader" mode enabled

### Setup
 - Clone this repository
 - Rename `.env.example` to `.env`
 - Fill your Clash.gg `refresh_token` cookie into `.env` as `REFRESH_TOKEN`
 - Fill in your Clash.gg `CF_CLEARANCE` cookie so we can bypass the cloudflare checkpoint. This will expire frequently so it will need to be updated.
 - Fill rest of `.env` as you wish, it is pretty self explanatory and commented well
 - Run `npm install` to install dependencies

### Usage
 - Run `npm start` to start the script
 - Run `npm run logs` to view a live stream of the logs
 - Run `npm run stop` to stop the script
 - Run `npm run restart` to restart the script
 - Run `npm run json2csv` to convert all of the JSON purchase and sell logs to CSV files! Output is in `output/` directory.

### Notes
 - The script uses `pm2` to manage the process, so you can use `pm2` commands to manage the process as well.
 - You will need to restart the script every time you change the `.env` file.

### Screenshots
![Discord Webhook Screenshot](https://raw.githubusercontent.com/easton36/clashgg-sniper/master/screenshots/Discord-Webhook-Screenshot.png)

### Disclaimer
 - I am not responsible for any bans or restrictions that you may receive from using this script.
 - Steam has shown to be very unpredictable with their bans, so use this script at your own risk.
 - I am not responsible for any loss of items or money that you may incur from using this script.
