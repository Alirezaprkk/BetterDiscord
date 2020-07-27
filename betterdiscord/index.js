const fs = require("fs");
const path = require("path");
const electron = require("electron");
const config = require("./config.json");
const buildInfoFile = path.resolve(electron.app.getAppPath(), "..", "build_info.json");

const ipc = electron.ipcMain;
ipc.handle("bd-config", async () => {return config;}); // deprecated
ipc.handle("bd-discord-info", async () => {return buildInfoFile;});
ipc.handle("bd-injector-info", async () => {
    return {
        path: path.resolve(__dirname, ".."),
        version: require(path.resolve(__dirname, "..", "package.json")).version
    };
});

// Locate data path to find transparency settings
let dataPath = "";
if (process.platform === "win32") dataPath = process.env.APPDATA;
else if (process.platform === "darwin") dataPath = path.join(process.env.HOME, "Library", "Preferences");
else dataPath = path.join(process.env.XDG_CONFIG_HOME ? process.env.XDG_CONFIG_HOME : process.env.HOME, ".config");
config.dataPath = path.join(dataPath, "BetterDiscord") + "/";

if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
if (!fs.existsSync(path.join(dataPath, "plugins"))) fs.mkdirSync(path.join(dataPath, "plugins"));
if (!fs.existsSync(path.join(dataPath, "themes"))) fs.mkdirSync(path.join(dataPath, "themes"));

module.exports = class BetterDiscord {
    static getWindowPrefs() {
        if (!fs.existsSync(buildInfoFile)) return {};
        const buildInfo = require(buildInfoFile);
        const prefsFile = path.resolve(config.dataPath, "data", buildInfo.releaseChannel, "windowprefs.json");
        if (!fs.existsSync(prefsFile)) return {};
        return require(prefsFile);
    }

    static getSetting(key) {
        if (this._settings) return this._settings[key];
        const settingsFile = path.resolve(config.dataPath, "bdstorage.json");
        if (!fs.existsSync(settingsFile) || !fs.existsSync(buildInfoFile)) {
            this._settings = {};
            return this._settings[key];
        }
        try {
            const buildInfo = require(buildInfoFile);
            const settings = require(settingsFile);
            const channelSettings = settings.settings && settings.settings[buildInfo.releaseChannel] && settings.settings[buildInfo.releaseChannel].settings;
            this._settings = channelSettings || {};
            return this._settings[key];
        }
        catch (_) {
            this._settings = {};
            return this._settings[key];
        }
    }
};