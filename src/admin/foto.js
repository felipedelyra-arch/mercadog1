/**
 * Prepara a foto do produto antes de subir: foto de celular tem 3–12 MB e
 * 4000 px; na loja ela aparece com no máximo ~600 px. Reduz para 1600 px no
 * lado maior e comprime (WebP, ou JPEG se o aparelho não souber gerar WebP),
 * o que deixa o arquivo com 100–400 KB e o envio rápido mesmo no 4G.
 */
const LADO_MAX = 1600
const QUALIDADE = 0.82

export class FotoInvalida extends Error {}

async function decodificar(file) {
  // createImageBitmap já respeita a rotação da câmera (EXIF)
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // cai para o <img> abaixo (Safari antigo, formatos que só o <img> abre)
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

const gerar = (canvas, tipo) => new Promise((resolve) => canvas.toBlob(resolve, tipo, QUALIDADE))

/** Devolve um File pronto para o bucket, ou lança FotoInvalida. */
export async function prepararFoto(file) {
  if (!file || (file.type && !file.type.startsWith('image/'))) {
    throw new FotoInvalida('Escolha um arquivo de imagem.')
  }

  let imagem
  try {
    imagem = await decodificar(file)
  } catch {
    throw new FotoInvalida('Não foi possível abrir essa foto. Tente tirar de novo ou escolha outra.')
  }

  const largura = imagem.width
  const altura = imagem.height
  const escala = Math.min(1, LADO_MAX / Math.max(largura, altura))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(largura * escala)
  canvas.height = Math.round(altura * escala)
  const ctx = canvas.getContext('2d')
  // fundo branco: PNG transparente não vira preto no JPEG
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height)
  imagem.close?.()

  let blob = await gerar(canvas, 'image/webp')
  // navegador que não gera WebP devolve PNG — nesse caso usa JPEG
  if (!blob || blob.type !== 'image/webp') blob = await gerar(canvas, 'image/jpeg')
  if (!blob) throw new FotoInvalida('Não foi possível preparar essa foto. Tente outra.')

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  return new File([blob], `foto.${ext}`, { type: blob.type })
}
