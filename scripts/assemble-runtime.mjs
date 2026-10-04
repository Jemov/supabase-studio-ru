import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { manifest, root, sha256, verifyPackage } from './common.mjs'

verifyPackage()
const app = path.resolve(process.argv[2] ?? '/work/app')
const runtime = path.resolve(process.argv[3] ?? '/runtime')
if (app === runtime || runtime.startsWith(app + path.sep) || app.startsWith(runtime + path.sep)) throw new Error('Runtime must be separate from the build app')
try {
  await fs.access(runtime)
  throw new Error('Runtime destination already exists; use a fresh directory')
} catch (error) { if (error.code !== 'ENOENT') throw error }
await fs.mkdir(runtime, { recursive: true })
await fs.cp(path.join(app, 'apps/studio/.next/standalone'), runtime, { recursive: true, verbatimSymlinks: true })
await fs.cp(path.join(app, 'apps/studio/.next/static'), path.join(runtime, 'apps/studio/.next/static'), { recursive: true, verbatimSymlinks: true })
await fs.cp(path.join(app, 'apps/studio/public'), path.join(runtime, 'apps/studio/public'), { recursive: true, verbatimSymlinks: true })
const wasm = 'node_modules/.pnpm/libpg-query@17.6.0/node_modules/libpg-query/wasm/libpg-query.wasm'
await fs.copyFile(path.join(app, wasm), path.join(runtime, wasm))
const require = createRequire(path.join(runtime, 'apps/studio/server.js'))
const parser = await fs.realpath(require.resolve('libpg-query'))
const relativeParser = path.relative(runtime, parser)
if (relativeParser.startsWith('..') || path.isAbsolute(relativeParser)) throw new Error('SQL parser resolves outside runtime')
const parsed = await require('libpg-query').parse('SELECT 1')
if (parsed.stmts?.length !== 1 || !parsed.stmts[0].stmt?.SelectStmt) throw new Error('Standalone SQL parser smoke test failed')
const plan = JSON.parse(await fs.readFile(path.join(root, 'patches/dependency-locales.json'), 'utf8'))
for (const record of plan.files) {
  const prefix = `${record.package.replaceAll('/', '+')}@${record.version}`
  const candidates = (await fs.readdir(path.join(app, 'node_modules/.pnpm'))).filter(name => name === prefix || name.startsWith(prefix + '_'))
  const file = path.join(app, 'node_modules/.pnpm', candidates[0], 'node_modules', record.package, record.file)
  if (sha256(await fs.readFile(file)) !== record.afterSha256) throw new Error('Build dependency locale changed')
}
const buildId = (await fs.readFile(path.join(runtime, 'apps/studio/.next/BUILD_ID'), 'utf8')).trim()
await fs.writeFile(path.join(runtime, 'build-provenance.json'), JSON.stringify({
  upstreamCommit: manifest.upstreamCommit, sourceHash: manifest.sourceHash, buildId, language: 'ru',
  dependencies: plan.packages, sqlParserSmoke: { query: 'SELECT 1', statements: 1 },
  wasmSha256: sha256(await fs.readFile(path.join(runtime, wasm))),
}, null, 2) + '\n')
console.log(JSON.stringify({ ok: true, buildId, sourceHash: manifest.sourceHash, sqlParserStatements: 1 }))
