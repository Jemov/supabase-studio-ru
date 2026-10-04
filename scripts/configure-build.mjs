import fs from 'node:fs'
import path from 'node:path'

const app = path.resolve(process.argv[2] ?? '.')
const workspace = path.join(app, 'pnpm-workspace.yaml')
fs.writeFileSync(workspace, fs.readFileSync(workspace, 'utf8').replaceAll('set this to true or false', 'false'))
if (!process.argv.includes('--workspace-only')) {
  const file = path.join(app, 'apps/studio/next.config.ts')
  let config = fs.readFileSync(file, 'utf8')
  if (!config.includes('// studio-ru bounded webpack build')) {
    if (!config.includes('experimental: {') || !config.includes('const nextConfig = {')) throw new Error('Pinned Next configuration changed')
    config = config.replace('experimental: {', `experimental: {
    cpus: 2,
    webpackBuildWorker: true,
    webpackMemoryOptimizations: true,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,`)
    config = config.replace('const nextConfig = {', `const nextConfig = {
  // studio-ru bounded webpack build
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/public/deno/edge-runtime.d.ts$': process.cwd() + '/public/deno/edge-runtime.d.ts',
      '@/public/deno/lib.deno.d.ts$': process.cwd() + '/public/deno/lib.deno.d.ts',
    }
    config.module.rules.push({ test: /\\.md$/, use: ['raw-loader'] })
    config.module.rules.push({ test: /(?:edge-runtime|lib\\.deno)\\.d\\.ts$/, use: ['raw-loader'] })
    return config
  },`)
    fs.writeFileSync(file, config)
  }
}
console.log('Pinned standalone build configuration prepared.')
