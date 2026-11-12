import ExcelJS from 'exceljs'
import { Readable } from 'stream'

export async function parseSpreadsheetRows(buffer, filename) {
  const workbook = new ExcelJS.Workbook()
  let worksheet

  const ext = filename.toLowerCase().split('.').pop()

  if (ext === 'csv') {
    worksheet = await workbook.csv.read(Readable.from(buffer))
  } else {
    await workbook.xlsx.load(buffer)
    worksheet = workbook.worksheets[0]
    if (!worksheet) {
      throw new Error('Planilha vazia ou em formato não suportado.')
    }
  }

  const rows = []
  let maxColumns = 0

  worksheet.eachRow((row, rowNumber) => {
    const rowValues = []
    let hasValue = false

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = cell.text ?? ''
      rowValues[colNumber - 1] = text
      if (text !== '') hasValue = true
    })

    if (hasValue) {
      rows.push({ rowNumber, values: rowValues })
      maxColumns = Math.max(maxColumns, rowValues.length)
    }
  })

  if (rows.length === 0) {
    return { headers: [], rows: [] }
  }

  const pad = (values) => {
    const padded = new Array(maxColumns).fill('')
    values.forEach((val, idx) => { padded[idx] = val ?? '' })
    return padded
  }

  const headers = pad(rows[0].values)
  const dataRows = rows.slice(1).map((r) => pad(r.values))

  return { headers, rows: dataRows }
}
