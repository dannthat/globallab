import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const diagramRoot = 'public/diagrams'
const maxDimension = 800

function listPngs(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name)
    return entry.isDirectory()
      ? listPngs(filePath)
      : extname(entry.name).toLowerCase() === '.png'
        ? [filePath]
        : []
  })
}

for (const filePath of listPngs(diagramRoot)) {
  const source = readFileSync(filePath)
  const image = await loadImage(source)

  if (image.width <= maxDimension && image.height <= maxDimension) {
    console.log(`Valid ${relative(diagramRoot, filePath)} (${image.width}x${image.height})`)
    continue
  }

  const scale = Math.min(maxDimension / image.width, maxDimension / image.height)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = createCanvas(width, height)
  canvas.getContext('2d').drawImage(image, 0, 0, width, height)
  writeFileSync(filePath, canvas.toBuffer('image/png'))

  console.log(
    `Resized ${relative(diagramRoot, filePath)} (${image.width}x${image.height} -> ${width}x${height})`,
  )
}
