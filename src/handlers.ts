import {
	ButtonInteraction,
	ChatInputCommandInteraction,
	Client,
	Interaction,
	MessageFlags,
	ModalSubmitInteraction,
	TextChannel,
} from 'discord.js'
import { Config } from './config'
import {
	BUTTON_IDS,
	MODAL_ID,
	buildAdEmbed,
	buildAdMessage,
	buildAdModal,
	buildDeleteConfirmRow,
	buildManageRow,
} from './components'
import { AdData, deleteAdRecord, getAd, setAd } from './storage'
import { normaliseInvite, unixSeconds } from './util'

// ===== Helpers =====
async function getAdChannel(client: Client): Promise<TextChannel | null> {
	try {
		const channel = await client.channels.fetch(Config.adChannelId)
		if (!channel || !channel.isTextBased() || channel.isDMBased()) return null
		return channel as TextChannel
	} catch (err) {
		console.error('[handlers] Failed to fetch ad channel:', err)
		return null
	}
}

function isOnCooldown(ad: AdData): boolean {
	return Date.now() - ad.timestamp < Config.cooldownMs
}

function cooldownEndsAtUnix(ad: AdData): number {
	return unixSeconds(ad.timestamp + Config.cooldownMs)
}

// ===== /advertise =====
async function handleAdvertiseCommand(interaction: ChatInputCommandInteraction): Promise<void> {
	const existing = getAd(interaction.user.id)

	if (existing && existing.messageId && isOnCooldown(existing)) {
		const endsAt = cooldownEndsAtUnix(existing)
		await interaction.reply({
			content:
				`⏳ You're on cooldown — you can post a fresh ad <t:${endsAt}:R> (<t:${endsAt}:F>).\n` +
				`Until then, you can edit or delete your existing advertisement below.`,
			components: [buildManageRow()],
			flags: MessageFlags.Ephemeral,
		})
		return
	}

	// No existing ad, or cooldown expired — show modal (pre-filled if previous data exists)
	await interaction.showModal(buildAdModal(existing ?? undefined))
}

// ===== Modal submit =====
async function handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
	if (interaction.customId !== MODAL_ID) return

	await interaction.deferReply({ flags: MessageFlags.Ephemeral })

	const unitName = interaction.fields.getTextInputValue('unit_name').trim()
	const opTimes = interaction.fields.getTextInputValue('op_times').trim()
	const eras = interaction.fields.getTextInputValue('eras').trim()
	const importantInfo = interaction.fields.getTextInputValue('important_info').trim()
	const rawInvite = interaction.fields.getTextInputValue('discord_invite').trim()

	if (!unitName || !opTimes || !eras || !importantInfo || !rawInvite) {
		await interaction.editReply({ content: '❌ All fields are required (no whitespace-only entries).' })
		return
	}

	const discordInvite = normaliseInvite(rawInvite)
	if (!discordInvite) {
		await interaction.editReply({
			content:
				"❌ That doesn't look like a valid Discord invite link.\n" +
				'Use a full link like `https://discord.gg/yourcode` or `discord.gg/yourcode`.',
		})
		return
	}

	const channel = await getAdChannel(interaction.client)
	if (!channel) {
		await interaction.editReply({ content: '❌ Could not access the advertisement channel. Contact an admin.' })
		return
	}

	const messageContent = buildAdMessage(unitName, interaction.user.id, discordInvite)
	const embed = buildAdEmbed({ unitName, opTimes, eras, importantInfo }, interaction.user)

	const existing = getAd(interaction.user.id)
	const wasOnCooldown = existing ? isOnCooldown(existing) : false
	let messageId: string
	let action: 'created' | 'updated' | 'reposted'

	if (existing && existing.messageId && wasOnCooldown) {
		// Mid-cooldown edit: edit message in-place, preserve timestamp, keep position
		try {
			const message = await channel.messages.fetch(existing.messageId)
			await message.edit({ content: messageContent, embeds: [embed] })
			messageId = message.id
			action = 'updated'
		} catch {
			// Old message gone (deleted manually) — post fresh
			const fresh = await channel.send({ content: messageContent, embeds: [embed] })
			messageId = fresh.id
			action = 'created'
		}
	} else if (existing && existing.messageId) {
		// Cooldown expired: delete old message, post fresh (bumps to bottom of channel)
		try {
			const oldMsg = await channel.messages.fetch(existing.messageId)
			await oldMsg.delete()
		} catch (err) {
			console.error('[handlers] Could not delete old ad before repost (may already be gone):', err)
		}
		const fresh = await channel.send({ content: messageContent, embeds: [embed] })
		messageId = fresh.id
		action = 'reposted'
	} else {
		// First-ever post for this user
		const fresh = await channel.send({ content: messageContent, embeds: [embed] })
		messageId = fresh.id
		action = 'created'
	}

	// Preserve timestamp if mid-cooldown edit, reset on fresh post or repost
	const newTimestamp = wasOnCooldown && existing ? existing.timestamp : Date.now()

	const newRecord: AdData = {
		timestamp: newTimestamp,
		messageId,
		unitName,
		opTimes,
		eras,
		importantInfo,
		discordInvite,
	}
	setAd(interaction.user.id, newRecord)

	const url = `https://discord.com/channels/${interaction.guildId}/${channel.id}/${messageId}`
	const actionMsg = {
		created: '✅ Advertisement posted!',
		updated: '✅ Advertisement updated!',
		reposted: '✅ Advertisement refreshed and bumped to the bottom of the channel!',
	}[action]
	const cooldownText = `Your next fresh-post window opens <t:${cooldownEndsAtUnix(newRecord)}:R>.`

	await interaction.editReply({
		content: `${actionMsg} [Jump to post](${url})\n${cooldownText}`,
		components: [buildManageRow()],
	})

	console.log(`[ad] ${action} for ${interaction.user.tag} (${interaction.user.id}) — unit: "${unitName}"`)
}

// ===== Buttons =====
async function handleEditButton(interaction: ButtonInteraction): Promise<void> {
	const existing = getAd(interaction.user.id)
	if (!existing || !existing.messageId) {
		await interaction.reply({
			content: 'No advertisement found to edit. Use `/advertise` to create one.',
			flags: MessageFlags.Ephemeral,
		})
		return
	}
	await interaction.showModal(buildAdModal(existing))
}

async function handleDeleteButton(interaction: ButtonInteraction): Promise<void> {
	const existing = getAd(interaction.user.id)
	if (!existing || !existing.messageId) {
		await interaction.reply({
			content: 'No advertisement found to delete.',
			flags: MessageFlags.Ephemeral,
		})
		return
	}
	await interaction.reply({
		content:
			`Delete your advertisement for **${existing.unitName || 'your unit'}**?\n` +
			`This will remove the post and reset your 14-day cooldown.`,
		components: [buildDeleteConfirmRow()],
		flags: MessageFlags.Ephemeral,
	})
}

async function handleDeleteConfirm(interaction: ButtonInteraction): Promise<void> {
	await interaction.deferUpdate()

	const existing = getAd(interaction.user.id)
	if (!existing || !existing.messageId) {
		await interaction.editReply({ content: 'No advertisement to delete.', components: [] })
		return
	}

	const channel = await getAdChannel(interaction.client)
	if (channel) {
		try {
			const msg = await channel.messages.fetch(existing.messageId)
			await msg.delete()
		} catch (err) {
			console.error('[handlers] Failed to delete ad message (may already be gone):', err)
		}
	}

	deleteAdRecord(interaction.user.id)
	await interaction.editReply({
		content: '🗑️ Advertisement deleted. Cooldown reset — feel free to post fresh anytime.',
		components: [],
	})
	console.log(`[ad] deleted for ${interaction.user.tag} (${interaction.user.id})`)
}

async function handleDeleteCancel(interaction: ButtonInteraction): Promise<void> {
	await interaction.update({ content: 'Delete cancelled.', components: [] })
}

async function handleButton(interaction: ButtonInteraction): Promise<void> {
	switch (interaction.customId) {
		case BUTTON_IDS.EDIT:
			return handleEditButton(interaction)
		case BUTTON_IDS.DELETE:
			return handleDeleteButton(interaction)
		case BUTTON_IDS.DELETE_CONFIRM:
			return handleDeleteConfirm(interaction)
		case BUTTON_IDS.DELETE_CANCEL:
			return handleDeleteCancel(interaction)
	}
}

// ===== Router =====
async function safeReplyError(interaction: Interaction): Promise<void> {
	if (!('reply' in interaction)) return
	try {
		const i = interaction as
			| ChatInputCommandInteraction
			| ButtonInteraction
			| ModalSubmitInteraction
		if (i.replied || i.deferred) {
			await i.followUp({ content: 'Something went wrong! Please try again.', flags: MessageFlags.Ephemeral })
		} else {
			await i.reply({ content: 'Something went wrong! Please try again.', flags: MessageFlags.Ephemeral })
		}
	} catch (replyErr) {
		console.error('[handlers] Failed to send error message:', replyErr)
	}
}

export function attachHandlers(client: Client): void {
	client.on('interactionCreate', async (interaction: Interaction) => {
		try {
			if (interaction.isChatInputCommand() && interaction.commandName === 'advertise') {
				await handleAdvertiseCommand(interaction)
			} else if (interaction.isButton() && interaction.customId.startsWith('wedgetail:btn:')) {
				await handleButton(interaction)
			} else if (interaction.isModalSubmit()) {
				await handleModalSubmit(interaction)
			}
		} catch (err) {
			console.error('[handlers] Interaction error:', err)
			await safeReplyError(interaction)
		}
	})
}
