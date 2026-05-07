"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUTTON_IDS = exports.MODAL_ID = void 0;
exports.buildAdModal = buildAdModal;
exports.buildAdEmbed = buildAdEmbed;
exports.buildAdMessage = buildAdMessage;
exports.buildManageRow = buildManageRow;
exports.buildDeleteConfirmRow = buildDeleteConfirmRow;
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
// ===== IDs =====
exports.MODAL_ID = 'wedgetail:modal';
exports.BUTTON_IDS = {
    EDIT: 'wedgetail:btn:edit',
    DELETE: 'wedgetail:btn:delete',
    DELETE_CONFIRM: 'wedgetail:btn:delete-confirm',
    DELETE_CANCEL: 'wedgetail:btn:delete-cancel',
};
// ===== Modal =====
function buildAdModal(prefill) {
    const modal = new discord_js_1.ModalBuilder().setCustomId(exports.MODAL_ID).setTitle('Unit Advertisement');
    const unitName = new discord_js_1.TextInputBuilder()
        .setCustomId('unit_name')
        .setLabel('Unit Name')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setMaxLength(100)
        .setPlaceholder('e.g. 17th Pathfinders')
        .setRequired(true);
    if (prefill?.unitName)
        unitName.setValue(prefill.unitName);
    const opTimes = new discord_js_1.TextInputBuilder()
        .setCustomId('op_times')
        .setLabel('Op Times & Timezone')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setMaxLength(100)
        .setPlaceholder('e.g. Saturdays 1900 AEST')
        .setRequired(true);
    if (prefill?.opTimes)
        opTimes.setValue(prefill.opTimes);
    const mods = new discord_js_1.TextInputBuilder()
        .setCustomId('mods')
        .setLabel('Mods')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setMaxLength(200)
        .setPlaceholder('list some of your bigger or cooler mods here i.e. ADF Re-Cut, RHO RAR, ROOMU etc.')
        .setRequired(true);
    if (prefill?.mods)
        mods.setValue(prefill.mods);
    const importantInfo = new discord_js_1.TextInputBuilder()
        .setCustomId('important_info')
        .setLabel('Important Info')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setMaxLength(500)
        .setPlaceholder('Mil-sim or casual? Mods? Age requirements? What makes your unit unique?')
        .setRequired(true);
    if (prefill?.importantInfo)
        importantInfo.setValue(prefill.importantInfo);
    const discordInvite = new discord_js_1.TextInputBuilder()
        .setCustomId('discord_invite')
        .setLabel('Discord Invite Link')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setMaxLength(100)
        .setPlaceholder('https://discord.gg/yourunit')
        .setRequired(true);
    if (prefill?.discordInvite)
        discordInvite.setValue(prefill.discordInvite);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(unitName), new discord_js_1.ActionRowBuilder().addComponents(opTimes), new discord_js_1.ActionRowBuilder().addComponents(mods), new discord_js_1.ActionRowBuilder().addComponents(importantInfo), new discord_js_1.ActionRowBuilder().addComponents(discordInvite));
    return modal;
}
function buildAdEmbed(ad, poster) {
    return new discord_js_1.EmbedBuilder()
        .setColor(config_1.Config.embedColor)
        .setAuthor({ name: poster.username, iconURL: poster.displayAvatarURL() })
        .setTitle(ad.unitName)
        .addFields({ name: '🕒 Op Times', value: ad.opTimes || '—', inline: true }, { name: '🎖️ mods', value: ad.mods || '—', inline: true }, { name: '\u200b', value: '\u200b', inline: true }, // spacer for clean 2-col layout
    { name: '📋 Important Info', value: ad.importantInfo || '—', inline: false })
        .setTimestamp()
        .setFooter({ text: 'Posted via Wedgetail' });
}
function buildAdMessage(unitName, posterId, discordInvite) {
    return `<@${posterId}> is recruiting for **${unitName}**\n${discordInvite}`;
}
// ===== Buttons =====
function buildManageRow() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(exports.BUTTON_IDS.EDIT)
        .setLabel('Edit Ad')
        .setEmoji('✏️')
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId(exports.BUTTON_IDS.DELETE)
        .setLabel('Delete Ad')
        .setEmoji('🗑️')
        .setStyle(discord_js_1.ButtonStyle.Danger));
}
function buildDeleteConfirmRow() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(exports.BUTTON_IDS.DELETE_CONFIRM)
        .setLabel('Yes, delete it')
        .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
        .setCustomId(exports.BUTTON_IDS.DELETE_CANCEL)
        .setLabel('Cancel')
        .setStyle(discord_js_1.ButtonStyle.Secondary));
}
