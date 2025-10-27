import domtoimage from 'dom-to-image-more'

export interface CaptureOptions {
  element: HTMLElement
  scale?: number
  backgroundColor?: string
  timeoutMs?: number
}

const captureCache = new Map<HTMLElement, string>()

export const clearCaptureCache = () => captureCache.clear()

export const captureElementAsPng = async ({
  element,
  scale = 2,
  backgroundColor = '#ffffff',
  timeoutMs = 12000
}: CaptureOptions): Promise<string> => {
  if (!element) throw new Error('Elemento inválido para captura')

  if (captureCache.has(element)) {
    return captureCache.get(element) as string
  }

	// Compute target size (avoid double-scaling by not applying CSS transform)
	const rect = element.getBoundingClientRect()
	const width = Math.max(element.scrollWidth, Math.ceil(rect.width))
	const height = Math.max(element.scrollHeight, Math.ceil(rect.height))

	const capturePromise = domtoimage.toPng(element, {
		quality: 1,
		bgcolor: backgroundColor,
		width: width * scale,
		height: height * scale
	}) as Promise<string>

  const timeoutPromise = new Promise<string>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id)
      reject(new Error('Tempo esgotado ao capturar gráfico'))
    }, timeoutMs)
  })

  const dataUrl = await Promise.race([capturePromise, timeoutPromise])
  captureCache.set(element, dataUrl)
  return dataUrl
}



