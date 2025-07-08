export interface PdfContactAttempt {
  name: string
  address?: string
  date: string
  time: string
  waitingTime: string
}

export const usePdfGenerator = () => {
  const generateKontaktprotokollPdf = async (contactAttempts: PdfContactAttempt[], userPlz?: string) => {
    if (!process.client) return
    
    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf')
      
      const pdf = new jsPDF()
          
      // Title
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Kontaktprotokoll für Psychotherapieplätze', 105, 25, { align: 'center' })
      
      // Subtitle
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text('(Nachweis der Kontaktaufnahme nach § 13 Abs. 3 der Psychotherapie-Richtlinie)', 105, 35, { align: 'center' })
      
      // Patient info
      pdf.setFontSize(11)
      pdf.text(`PLZ: ${userPlz || '_____'}`, 20, 55)
      
      // Format date with leading zeroes
      const today = new Date()
      const day = today.getDate().toString().padStart(2, '0')
      const month = (today.getMonth() + 1).toString().padStart(2, '0')
      const year = today.getFullYear()
      pdf.text(`Datum: ${day}.${month}.${year}`, 150, 55)
      
      // Table setup
      const columnWidths = [70, 50, 50]
      const startX = 20
      const startY = 75
      let yPosition = startY
      
      // Table headers
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      
      // Header background
      pdf.setFillColor(240, 240, 240)
      pdf.rect(startX, yPosition, 170, 20, 'F')
      
      // Header borders
      pdf.setLineWidth(0.5)
      pdf.rect(startX, yPosition, columnWidths[0], 20)
      pdf.rect(startX + columnWidths[0], yPosition, columnWidths[1], 20)
      pdf.rect(startX + columnWidths[0] + columnWidths[1], yPosition, columnWidths[2], 20)
      
      // Header text
      pdf.text('Name des kassenzugelassenen', startX + 2, yPosition + 8)
      pdf.text('Psychotherapeuten, Ort', startX + 2, yPosition + 13)
      
      pdf.text('Datum und Uhrzeit der', startX + columnWidths[0] + 2, yPosition + 8)
      pdf.text('Kontaktaufnahme', startX + columnWidths[0] + 2, yPosition + 13)
      
      pdf.text('Auskunft über Wartezeit auf', startX + columnWidths[0] + columnWidths[1] + 2, yPosition + 8)
      pdf.text('Behandlungsplatz', startX + columnWidths[0] + columnWidths[1] + 2, yPosition + 13)
      
      yPosition += 20
      
      // Table rows
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      
      contactAttempts.forEach((entry) => {
        // Calculate row height based on content
        const nameLines = pdf.splitTextToSize(entry.name, columnWidths[0] - 4)
        const addressLines = entry.address ? pdf.splitTextToSize(entry.address, columnWidths[0] - 4) : []
        const waitingTimeLines = pdf.splitTextToSize(entry.waitingTime, columnWidths[2] - 4)
        
        const maxLines = Math.max(
          nameLines.length + addressLines.length,
          2, // date + time
          waitingTimeLines.length
        )
        const rowHeight = Math.max(15, maxLines * 4 + 6)
        
        // Check if we need a new page
        if (yPosition + rowHeight > 250) {
          pdf.addPage()
          yPosition = 20
        }
        
        // Row borders
        pdf.rect(startX, yPosition, columnWidths[0], rowHeight)
        pdf.rect(startX + columnWidths[0], yPosition, columnWidths[1], rowHeight)
        pdf.rect(startX + columnWidths[0] + columnWidths[1], yPosition, columnWidths[2], rowHeight)
        
        // Therapist info (name + address)
        let textY = yPosition + 6
        nameLines.forEach(line => {
          pdf.text(line, startX + 2, textY)
          textY += 4
        })
        addressLines.forEach(line => {
          pdf.text(line, startX + 2, textY)
          textY += 4
        })
        
        // Contact date and time
        pdf.text(entry.date, startX + columnWidths[0] + 2, yPosition + 6)
        pdf.text(entry.time, startX + columnWidths[0] + 2, yPosition + 11)
        
        // Waiting time info with proper wrapping
        textY = yPosition + 6
        waitingTimeLines.forEach(line => {
          pdf.text(line, startX + columnWidths[0] + columnWidths[1] + 2, textY)
          textY += 4
        })
        
        yPosition += rowHeight
      })
      
      // Footer note
      yPosition += 10
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.text('* „Aktuell keine Behandlungsplätze verfügbar" = Es wird gar keine Warteliste aus', 20, yPosition)
      pdf.text('Mangel an Plätzen geführt oder die Wartezeit beträgt über sechs Monate.', 20, yPosition + 8)
      
      return pdf
      
    } catch (error) {
      console.error('PDF generation failed:', error)
      throw new Error('Fehler beim Erstellen des PDFs. Bitte versuche es erneut.')
    }
  }

  const previewPdf = async (contactAttempts: PdfContactAttempt[], userPlz?: string) => {
    const pdf = await generateKontaktprotokollPdf(contactAttempts, userPlz)
    
    // Open PDF in new tab
    const pdfBlob = pdf.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
  }

  const exportPdf = async (contactAttempts: PdfContactAttempt[], userPlz?: string) => {
    const pdf = await generateKontaktprotokollPdf(contactAttempts, userPlz)
    
    // Save the PDF
    const fileName = `Kontaktprotokoll_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)
  }

  return {
    generateKontaktprotokollPdf,
    previewPdf,
    exportPdf
  }
}