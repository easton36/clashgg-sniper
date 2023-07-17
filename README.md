# Clash.gg Item Sniper

## This is a work in progress. It is not yet functional.

This is a simple script that will automatically purchase items from the Clash.gg store as soon as they become available, if the price is below a certain threshold.
Probably add functionality to automatically sell items as well.

### Requirements
 - Node.js v12 or higher
 - MongoDB
 - Clash.gg account with "trader" mode enabled

### Setup
 - Clone this repository
 - Rename .env.example to .env
 - Fill your Clash.gg "refresh_token" cookie into .env as REFRESH_TOKEN
 - Fill your Clash.gg "cf_clearance" cookie into .env as CF_CLEARANCE
 - Fill rest of .env as you wish, it is pretty self explanatory and commented well
 - Run `npm install` to install dependencies

### Usage
 - Run `npm start` to start the script

### Notes
You will need to restart the script every time you change the .env file.