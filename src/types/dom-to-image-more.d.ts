declare module 'dom-to-image-more' {
  interface DomToImageOptions {
    quality?: number
    bgcolor?: string
    width?: number
    height?: number
    style?: {
      transform?: string
      transformOrigin?: string
    }
    filter?: (node: Node) => boolean
    imagePlaceholder?: string
    cacheBust?: boolean
    useCORS?: boolean
    allowTaint?: boolean
    foreignObjectRendering?: boolean
    removeContainer?: boolean
    scale?: number
    imageTimeout?: number
    canvasWidth?: number
    canvasHeight?: number
    skipAutoScale?: boolean
    scrollX?: number
    scrollY?: number
    width?: number
    height?: number
  }

  interface DomToImage {
    toPng(node: Node, options?: DomToImageOptions): Promise<string>
    toJpeg(node: Node, options?: DomToImageOptions): Promise<string>
    toSvg(node: Node, options?: DomToImageOptions): Promise<string>
    toBlob(node: Node, options?: DomToImageOptions): Promise<Blob>
    toPixelData(node: Node, options?: DomToImageOptions): Promise<Uint8ClampedArray>
    toCanvas(node: Node, options?: DomToImageOptions): Promise<HTMLCanvasElement>
  }

  const domtoimage: DomToImage
  export default domtoimage
}
