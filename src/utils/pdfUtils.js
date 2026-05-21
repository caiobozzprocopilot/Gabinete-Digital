import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const date = value instanceof Date ? value : new Date(value)

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function drawHeader(doc, title) {
  doc.setFillColor(15, 76, 92)
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 24, 'F')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(title, 14, 15)
  doc.setTextColor(33, 36, 44)
}

function appendDemandBody(doc, demand, startY = 34) {
  autoTable(doc, {
    startY,
    head: [['Campo', 'Valor']],
    body: [
      ['ID', demand.id],
      ['Status', demand.status || '-'],
      ['Nome', demand.voterName || '-'],
      ['Telefone', demand.voterPhone || '-'],
      ['Endereco', demand.voterAddress || '-'],
      ['Criada em', formatDate(demand.createdAt)],
      ['Descricao', demand.description || '-'],
    ],
    styles: {
      fontSize: 10,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 76, 92],
    },
    columnStyles: {
      0: { cellWidth: 38 },
    },
  })

  return doc.lastAutoTable.finalY + 8
}

function imageTypeFromMime(mimeType) {
  if (mimeType?.includes('png')) {
    return 'PNG'
  }

  return 'JPEG'
}

function appendImages(doc, demand, startY) {
  const images = demand.attachments || []

  if (!images.length) {
    return
  }

  let cursorY = startY

  doc.setFontSize(12)
  doc.text('Anexos', 14, cursorY)
  cursorY += 6

  images.forEach((image, index) => {
    if (!image.base64) {
      return
    }

    if (cursorY > 240) {
      doc.addPage()
      cursorY = 20
    }

    doc.setFontSize(10)
    doc.text(`${index + 1}. ${image.name || 'Imagem'}`, 14, cursorY)
    cursorY += 4

    try {
      doc.addImage(image.base64, imageTypeFromMime(image.type), 14, cursorY, 52, 52)
      cursorY += 58
    } catch {
      doc.text('Não foi possível renderizar este anexo.', 14, cursorY)
      cursorY += 8
    }
  })
}

export function exportSingleDemandPdf(demand) {
  const doc = new jsPDF()
  drawHeader(doc, 'Demanda de Eleitor - Ortigueira')
  const nextY = appendDemandBody(doc, demand)
  appendImages(doc, demand, nextY)
  doc.save(`demanda-${demand.id}.pdf`)
}

export function exportBatchDemandPdf(demands) {
  if (!demands.length) {
    return
  }

  const doc = new jsPDF()

  demands.forEach((demand, index) => {
    if (index > 0) {
      doc.addPage()
    }

    drawHeader(doc, `Demanda ${index + 1} de ${demands.length}`)
    const nextY = appendDemandBody(doc, demand)
    appendImages(doc, demand, nextY)
  })

  doc.save(`demandas-lote-${Date.now()}.pdf`)
}
