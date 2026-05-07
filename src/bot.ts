import './logger' // side-effect import: hooks console.log/error to file
import { Client, GatewayIntentBits } from 'discord.js'
import { Config } from './config'
import { attachHandlers } from './handlers'
import { initStorage } from './storage'

const VERSION = '2.1.0'

process.on('uncaughtException', (err) => console.error('[fatal] Uncaught Exception:', err))
process.on('unhandledRejection', (reason) => console.error('[fatal] Unhandled Rejection:', reason))

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
})

initStorage()
attachHandlers(client)

client.once('ready', () => {
	console.log(`🦅 Wedgetail v${VERSION} — logged in as ${client.user?.tag}`)
	client.application?.commands
		.set([{ name: 'advertise', description: 'Post or manage your unit advertisement' }])
		.then(() => console.log('[bot] Slash commands registered'))
		.catch((err) => console.error('[bot] Failed to register commands:', err))
})

let shuttingDown = false
async function shutdown(signal: string): Promise<void> {
	if (shuttingDown) return
	shuttingDown = true
	console.log(`[bot] ${signal} received, shutting down...`)
	try {
		await client.destroy()
	} catch (err) {
		console.error('[bot] Error during client.destroy:', err)
	}
	process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

client.login(Config.token)
