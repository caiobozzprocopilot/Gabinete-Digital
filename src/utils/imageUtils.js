function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
  })
}

export async function serializeImages(fileList, options = {}) {
  const maxFiles = options.maxFiles ?? 5
  const maxFileSizeMb = options.maxFileSizeMb ?? 5
  const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024

  const files = Array.from(fileList || [])

  if (files.length > maxFiles) {
    throw new Error(`Limite de ${maxFiles} fotos por demanda.`)
  }

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Envie apenas arquivos de imagem.')
    }

    if (file.size > maxFileSizeBytes) {
      throw new Error(`Cada foto pode ter no maximo ${maxFileSizeMb} MB.`)
    }
  }

  const serialized = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      base64: await fileToBase64(file),
    })),
  )

  return serialized
}
