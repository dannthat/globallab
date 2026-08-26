import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const wikimediaFile = (filename) => {
  const normalized = filename.replaceAll(' ', '_')
  const digest = createHash('md5').update(normalized).digest('hex')
  return `https://upload.wikimedia.org/wikipedia/commons/${digest[0]}/${digest.slice(0, 2)}/${encodeURIComponent(normalized)}`
}

const diagrams = [
  [wikimediaFile('Action_potential.svg'), 'public/diagrams/biology/resting-membrane-potential.png'],
  [wikimediaFile('Interference-pattern-two-point-sources.svg'), 'public/diagrams/physics/wave-interference.png'],
  [wikimediaFile('Electric_field_point_lines_equipotentials.svg'), 'public/diagrams/physics/electric-field-lines.png'],
  [wikimediaFile('Faraday_emf_experiment.svg'), 'public/diagrams/physics/faraday-induction.png'],
  [wikimediaFile('Photoelectric_effect.svg'), 'public/diagrams/physics/photoelectric-effect.png'],
  [wikimediaFile('Minkowski_diagram_-_photon.svg'), 'public/diagrams/physics/spacetime-diagram.png'],
  [wikimediaFile('Electron_orbitals.svg'), 'public/diagrams/chemistry/electron-orbitals.png'],
  [wikimediaFile('VSEPR_geometries.PNG'), 'public/diagrams/chemistry/vsepr-geometry.png'],
  [wikimediaFile('Catalysis-_Reaction_progress.png'), 'public/diagrams/chemistry/gibbs-reaction-profile.png'],
  [wikimediaFile('Galvanic_cell_with_no_cation_flow.svg'), 'public/diagrams/chemistry/galvanic-cell.png'],
  [wikimediaFile('Activation_energy.svg'), 'public/diagrams/chemistry/activation-energy.png'],
  [wikimediaFile('Tangent_to_a_curve.svg'), 'public/diagrams/mathematics/tangent-derivative.png'],
  [wikimediaFile('Integral_example.svg'), 'public/diagrams/mathematics/riemann-integral.png'],
  [wikimediaFile('Exponential_decay.svg'), 'public/diagrams/mathematics/exponential-decay.png'],
  [wikimediaFile('Linear_subspaces_with_shading.svg'), 'public/diagrams/mathematics/linear-subspace.png'],
  [wikimediaFile('Normal_Distribution_PDF.svg'), 'public/diagrams/mathematics/normal-distribution.png'],
]

const maxDimension = 800
const padding = 24
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function downloadAndRender(url, outputPath) {
  let response
  let lastError
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      response = await fetch(url, {
        headers: { 'User-Agent': 'GlobalLab-Education/1.0 (diagram attribution retained)' },
      })
      if (response.ok) break
      lastError = new Error(`${response.status} ${response.statusText} for ${url}`)
      if (response.status !== 429) throw lastError
    } catch (error) {
      lastError = error
      response = undefined
    }
    if (attempt < 5) {
      const backoff = attempt * 15000
      console.warn(`  Wikimedia unavailable; retrying in ${backoff / 1000}s...`)
      await delay(backoff)
    }
  }
  if (!response?.ok) {
    throw lastError ?? new Error(`Unable to download ${url}`)
  }

  const source = Buffer.from(await response.arrayBuffer())
  const header = source.subarray(0, 512)
  const isSvg = header.toString('utf8').includes('<svg')
  const isPng = header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (!isSvg && !isPng) {
    throw new Error(`Expected an SVG or PNG source for ${url}`)
  }

  const image = await loadImage(source)
  const available = maxDimension - padding * 2
  const scale = Math.min(available / image.width, available / image.height)
  const drawWidth = Math.max(1, Math.round(image.width * scale))
  const drawHeight = Math.max(1, Math.round(image.height * scale))
  const canvasWidth = drawWidth + padding * 2
  const canvasHeight = drawHeight + padding * 2
  const canvas = createCanvas(canvasWidth, canvasHeight)
  const context = canvas.getContext('2d')

  context.fillStyle = '#fffdf8'
  context.fillRect(0, 0, canvasWidth, canvasHeight)
  context.drawImage(image, padding, padding, drawWidth, drawHeight)

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, canvas.toBuffer('image/png'))
  return `${canvasWidth}x${canvasHeight}`
}

async function existingPngDimensions(outputPath) {
  if (!existsSync(outputPath)) return null
  try {
    const source = readFileSync(outputPath)
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    if (!source.subarray(0, 8).equals(signature)) return null
    const image = await loadImage(source)
    if (image.width > maxDimension || image.height > maxDimension) return null
    return `${image.width}x${image.height}`
  } catch {
    return null
  }
}
for (let index = 0; index < diagrams.length; index += 1) {
  const [url, outputPath] = diagrams[index]
  const existingDimensions = await existingPngDimensions(outputPath)
  if (existingDimensions) {
    console.log(`[${index + 1}/${diagrams.length}] Skipping valid ${outputPath} (${existingDimensions})`)
    continue
  }
  const dimensions = await downloadAndRender(url, outputPath)
  console.log(`[${index + 1}/${diagrams.length}] ${outputPath} (${dimensions})`)
  if (index < diagrams.length - 1) await delay(2000)
}
