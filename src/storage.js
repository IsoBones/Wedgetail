"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStorage = initStorage;
exports.getAd = getAd;
exports.setAd = setAd;
exports.deleteAdRecord = deleteAdRecord;
const fs_1 = require("fs");
const FILE = 'ads.json';
let cache = {};
let loaded = false;
function migrate(raw) {
    const out = {};
    for (const [userId, data] of Object.entries(raw)) {
        out[userId] = {
            timestamp: data.timestamp ?? 0,
            messageId: data.messageId ?? '',
            unitName: data.unitName ?? '',
            opTimes: data.opTimes ?? '',
            mods: data.mods ?? '',
            importantInfo: data.importantInfo ?? '',
            discordInvite: data.discordInvite ?? '',
        };
    }
    return out;
}
function load() {
    if (!(0, fs_1.existsSync)(FILE)) {
        cache = {};
        loaded = true;
        return;
    }
    try {
        const raw = JSON.parse((0, fs_1.readFileSync)(FILE, 'utf8'));
        cache = migrate(raw);
    }
    catch (err) {
        console.error('[storage] Failed to load ads.json, starting empty:', err);
        cache = {};
    }
    loaded = true;
}
function persist() {
    try {
        (0, fs_1.writeFileSync)(FILE, JSON.stringify(cache, null, 4));
    }
    catch (err) {
        console.error('[storage] Failed to write ads.json:', err);
    }
}
function initStorage() {
    load();
    console.log(`[storage] Loaded ${Object.keys(cache).length} ad(s) from ${FILE}`);
}
function getAd(userId) {
    if (!loaded)
        load();
    return cache[userId] ?? null;
}
function setAd(userId, data) {
    if (!loaded)
        load();
    cache[userId] = data;
    persist();
}
function deleteAdRecord(userId) {
    if (!loaded)
        load();
    delete cache[userId];
    persist();
}
