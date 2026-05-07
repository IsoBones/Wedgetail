import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

const DEFAULT_EMBED_COLOR = '#14B8A6' // Wedgetail teal

function required(name: string): string {
	const value = process.env[name]
	if (!value) {
		console.error(`[config] Missing required env var: ${name}`)
		process.exit(1)
	}
	return value
}

function optional(name: string, fallback: string): string {
	const v = process.env[name]?.trim()
	return v && v.length > 0 ? v : fallback
}

function parseColor(input: string): number {
	const hex = input.replace(/^#/, '').trim()
	if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
		console.error(`[config] Invalid EMBED_COLOR "${input}", using default ${DEFAULT_EMBED_COLOR}`)
		return parseInt(DEFAULT_EMBED_COLOR.slice(1), 16)
	}
	return parseInt(hex, 16)
}

export const Config = {
	token: required('TOKEN'),
	adChannelId: required('AD_CHANNEL_ID'),
	embedColor: parseColor(optional('EMBED_COLOR', DEFAULT_EMBED_COLOR)),
	cooldownMs: 14 * 24 * 60 * 60 * 1000,
} as const
