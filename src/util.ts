// Match: discord.gg/code, https://discord.gg/code, discord.com/invite/code, discordapp.com/invite/code
const INVITE_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9-]+)\/?$/i

/**
 * Validates and normalises a Discord invite link.
 * Returns the canonical https://discord.gg/CODE form, or null if invalid.
 */
export function normaliseInvite(input: string): string | null {
	const match = input.trim().match(INVITE_REGEX)
	if (!match) return null
	return `https://discord.gg/${match[1]}`
}

/** Returns Unix seconds (for Discord <t:N:F> formatting) */
export function unixSeconds(ms: number): number {
	return Math.floor(ms / 1000)
}
