import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'

const [
  ,
  ,
  requestedView = 'library',
  output = '.visual-library.png',
  widthArg = '1920',
  heightArg = '1080',
  themeArg = 'light',
] = process.argv
const view = requestedView.replace(/-dark$/, '')
const isDark = themeArg === 'dark' || requestedView.endsWith('-dark')
const isReaderView = view.startsWith('reader')
const isAnalogyView = view.includes('analogy')
const isUploadView = view.startsWith('upload-')
const isPhysicsView = view.includes('physics')
const width = Number.parseInt(widthArg, 10)
const height = Number.parseInt(heightArg, 10)
const appUrl = 'http://127.0.0.1:5173/'
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9300 + Math.floor(Math.random() * 300)
const profilePath = await mkdtemp(join(tmpdir(), 'globallab-cdp-'))
const outputPath = resolve(output)

const sleep = (milliseconds) =>
  new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds))

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-default-apps',
    '--no-first-run',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profilePath}`,
    `--window-size=${width},${height}`,
    'about:blank',
  ],
  { stdio: 'ignore', windowsHide: true },
)

async function devtoolsJson(path) {
  const deadline = Date.now() + 12_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${path}`)
      if (response.ok) return response.json()
    } catch {
      // Chrome is still starting.
    }
    await sleep(120)
  }
  throw new Error('Chrome DevTools did not become ready.')
}

const pages = await devtoolsJson('/json/list')
const page = pages.find((candidate) => candidate.type === 'page')
if (!page?.webSocketDebuggerUrl) {
  chrome.kill()
  throw new Error('No Chrome page target was available.')
}

const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener('open', resolveOpen, { once: true })
  socket.addEventListener('error', rejectOpen, { once: true })
})

let commandId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (!message.id) return
  const command = pending.get(message.id)
  if (!command) return
  pending.delete(message.id)
  if (message.error) command.reject(new Error(message.error.message))
  else command.resolve(message.result)
})

function send(method, params = {}) {
  commandId += 1
  socket.send(JSON.stringify({ id: commandId, method, params }))
  return new Promise((resolveCommand, rejectCommand) => {
    pending.set(commandId, { resolve: resolveCommand, reject: rejectCommand })
  })
}

async function evaluate(expression) {
  return send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
}

async function click(selector, timeout = 8_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const result = await evaluate(
      `(() => {
        const element = document.querySelector(${JSON.stringify(selector)})
        if (!element) return false
        element.click()
        return true
      })()`,
    )
    if (result.result.value) return
    await sleep(160)
  }
  throw new Error(`Could not find ${selector} for the ${view} capture.`)
}

async function clickMatching(selector, text, timeout = 8_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const result = await evaluate(
      `(() => {
        const expected = ${JSON.stringify(text)}.toLowerCase()
        const element = [...document.querySelectorAll(${JSON.stringify(selector)})]
          .find((candidate) => candidate.textContent?.toLowerCase().includes(expected))
        if (!element) return false
        element.click()
        return true
      })()`,
    )
    if (result.result.value) return
    await sleep(160)
  }
  throw new Error(`Could not find ${text} within ${selector} for the ${view} capture.`)
}

try {
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  })
  await send('Page.navigate', { url: appUrl })
  await sleep(900)
  await evaluate(`localStorage.setItem(
    'globallab_profile',
    JSON.stringify({
      interest: ${JSON.stringify(isPhysicsView ? 'gaming' : 'basketball')},
      gradeLevel: 'Grade 11',
      createdAt: new Date().toISOString()
    })
  ); localStorage.setItem('gl_dark', ${JSON.stringify(isDark ? '1' : '0')}); location.reload()`)
  await sleep(4_000)

  if (isUploadView) {
    await send('DOM.enable')
    const documentNode = await send('DOM.getDocument', { depth: -1 })
    const fileInput = await send('DOM.querySelector', {
      nodeId: documentNode.root.nodeId,
      selector: 'input[type="file"]',
    })
    if (!fileInput.nodeId) throw new Error('Upload input was not available.')
    await send('DOM.setFileInputFiles', {
      nodeId: fileInput.nodeId,
      files: [
        view.includes('text')
          ? resolve('README.md')
          : resolve('public/diagrams/biology/cellular-respiration.png'),
      ],
    })
    await sleep(4_000)
    await click('.gl-library-book-trigger--user')
    await sleep(3_000)
    if (view.includes('companion')) {
      await click('.ubr-learn-trigger')
      await sleep(2_500)
    }
  }

  if (view.startsWith('toc') || isReaderView) {
    if (isPhysicsView) {
      await clickMatching(
        '.gl-library-book-trigger:not(.gl-library-book-trigger--soon)',
        'Physics',
      )
    } else {
      await click('.gl-library-book-trigger:not(.gl-library-book-trigger--soon)')
    }
    // Library selection intentionally waits for the physical book-lift motion
    // before the shared-element route transition begins.
    await sleep(2_500)
  }
  if (isReaderView) {
    if (isPhysicsView) {
      await clickMatching('.gl-toc__topic', 'Quantum Mechanics')
    } else {
      await click('.gl-toc__topic')
    }
    await sleep(3_000)
  }
  if (isAnalogyView) {
    await click('.tbp-learn-btn')
    await sleep(1_200)
  }
  if (view.includes('scroll-control')) {
    await click('.tbp-page-scroll-control--left')
    await sleep(800)
  }
  if (view === 'toc-contents') {
    await evaluate(`(() => {
      const spread = document.querySelector('.gl-toc__spread')
      if (spread) spread.scrollLeft = spread.scrollWidth
    })()`)
    await sleep(500)
  }
  if (view.endsWith('-bottom')) {
    await evaluate(`(() => {
      const page = document.querySelector('.tbp-page-scroll--left')
      if (page) page.scrollTop = page.scrollHeight
    })()`)
    await sleep(500)
  }

  const diagnostics = await evaluate(`(() => {
    const selectors = [
      '.gl-library',
      '.gl-toc__spread',
      '.textbook-reader-wrap',
      '.textbook-reader-stage',
      '.textbook-reader-page',
      '.textbook-bottom-nav',
      '.tbp-article',
      '.textbook-page-left .tbp-page-scroll',
      '.textbook-page-right .tbp-page-scroll',
      '.tbp-page-scroll-control',
      '.tbp-page-scroll-control--left',
      '.tbp-page-scroll-control--right',
      '.tbp-learn-zone',
      '.tbp-sticky-analogy',
      '.tbp-reference-layout',
      '.tbp-reference-primary',
      '.tbp-reference-hero',
      '.tbp-visual-field',
      '.tbp-equation',
      '.diagram-block',
      '.diagram-block img',
      '.tbp-reference-notes-grid'
    ]
    const rectangles = Object.fromEntries(selectors.map((selector) => {
      const element = document.querySelector(selector)
      if (!element) return [selector, null]
      const rect = element.getBoundingClientRect()
      const styles = getComputedStyle(element)
      return [selector, {
        className: element.className,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
        display: styles.display,
        position: styles.position,
        alignSelf: styles.alignSelf,
        widthStyle: styles.width,
        padding: styles.padding,
        flex: styles.flex,
        minHeight: styles.minHeight,
        maxHeight: styles.maxHeight,
        overflow: styles.overflow,
        gridTemplateRows: styles.gridTemplateRows,
      }]
    }))
    return {
      viewport: { width: innerWidth, height: innerHeight },
      body: { scrollWidth: document.body.scrollWidth, scrollHeight: document.body.scrollHeight },
      rectangles,
    }
  })()`)
  process.stdout.write(JSON.stringify(diagnostics.result.value) + '\n')

  await mkdir(dirname(outputPath), { recursive: true })
  const isJpeg = ['.jpg', '.jpeg'].includes(extname(outputPath).toLowerCase())
  const screenshot = await send('Page.captureScreenshot', {
    format: isJpeg ? 'jpeg' : 'png',
    ...(isJpeg ? { quality: 84 } : {}),
    fromSurface: true,
    captureBeyondViewport: false,
  })
  await writeFile(outputPath, Buffer.from(screenshot.data, 'base64'))
  process.stdout.write(outputPath + '\n')
} finally {
  socket.close()
  chrome.kill()
}
