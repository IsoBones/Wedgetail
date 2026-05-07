import { createWriteStream } from 'fs'

const logStream = createWriteStream('console_output.txt', { flags: 'a' })

const ts = (): string => new Date().toISOString()

const fmt = (args: unknown[]): string =>
	args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')

const origLog = console.log
const origErr = console.error

console.log = (...args: unknown[]): void => {
	logStream.write(`[${ts()}] LOG: ${fmt(args)}\n`)
	origLog(...args)
}

console.error = (...args: unknown[]): void => {
	logStream.write(`[${ts()}] ERROR: ${fmt(args)}\n`)
	origErr(...args)
}
