import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const outputDirectory = path.join(
  scriptDirectory,
  '../public/diagrams/biology',
)

fs.mkdirSync(outputDirectory, { recursive: true })

const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const pngBuffer = Buffer.from(pngBase64, 'base64')

const files = [
  'cellular-respiration.png',
  'cell-membrane.png',
  'dna-transcription.png',
  'action-potential.png',
  'enzyme-kinetics.png',
]

for (const file of files) {
  fs.writeFileSync(path.join(outputDirectory, file), pngBuffer)
  console.log('Created:', file)
}
