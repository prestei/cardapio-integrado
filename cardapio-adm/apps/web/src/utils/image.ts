/** Compress an image file to a JPEG data URL suitable for product photos. */
export async function fileToCompressedDataUrl(
  file: File,
  options: { maxEdge?: number; quality?: number } = {},
): Promise<string> {
  const maxEdge = options.maxEdge ?? 1200
  const quality = options.quality ?? 0.78

  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem (JPG, PNG ou WEBP).')
  }

  if (file.size > 12 * 1024 * 1024) {
    throw new Error('A imagem deve ter no máximo 12 MB.')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, maxEdge)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Não foi possível processar a imagem.')
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    img.src = src
  })
}

function fitWithin(w: number, h: number, maxEdge: number) {
  if (w <= maxEdge && h <= maxEdge) return { width: w, height: h }
  const ratio = Math.min(maxEdge / w, maxEdge / h)
  return {
    width: Math.max(1, Math.round(w * ratio)),
    height: Math.max(1, Math.round(h * ratio)),
  }
}
