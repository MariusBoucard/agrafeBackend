import fs from 'fs/promises'
import path from 'path'
import { createRequire } from 'module'
import { createCanvas } from 'canvas'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'

const require = createRequire(import.meta.url)
const pdfjsRoot = path.dirname(require.resolve('pdfjs-dist/package.json'))
GlobalWorkerOptions.workerSrc = path.join(pdfjsRoot, 'legacy', 'build', 'pdf.worker.mjs')

class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height)
    return { canvas, context: canvas.getContext('2d') }
  }

  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width
    canvasAndContext.canvas.height = height
  }

  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0
    canvasAndContext.canvas.height = 0
    canvasAndContext.canvas = null
    canvasAndContext.context = null
  }
}

async function renderPageToPng(pdf, pageNumber, scale = 2) {
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const canvasFactory = new NodeCanvasFactory()
  const { canvas, context } = canvasFactory.create(viewport.width, viewport.height)

  await page.render({
    canvasContext: context,
    viewport,
    canvas,
    canvasFactory
  }).promise

  const buffer = canvas.toBuffer('image/png')
  canvasFactory.destroy({ canvas, context })
  page.cleanup()
  return buffer
}

export async function firstAndLastPageToPng(pdfPath) {
  const data = new Uint8Array(await fs.readFile(pdfPath))
  const loadingTask = getDocument({
    data,
    canvasFactory: new NodeCanvasFactory(),
    isEvalSupported: false,
    disableFontFace: true,
    cMapUrl: path.join(pdfjsRoot, 'cmaps') + path.sep,
    cMapPacked: true,
    standardFontDataUrl: path.join(pdfjsRoot, 'standard_fonts') + path.sep
  })
  const pdf = await loadingTask.promise
  const lastPage = pdf.numPages
  const cover = await renderPageToPng(pdf, 1)
  const back = lastPage === 1 ? cover : await renderPageToPng(pdf, lastPage)
  await pdf.destroy()
  return { cover, back }
}
