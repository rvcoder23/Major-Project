const PDFDocument = require('pdfkit');
const fs = require('fs');

// PDF generation utility for reports और invoices
const generatePDF = (data, type = 'report') => {
    const doc = new PDFDocument();
    const filename = `${type}_${Date.now()}.pdf`;

    // PDF content generation logic यहाँ add करें
    doc.text(`Front Office Management - ${type.toUpperCase()}`, 50, 50);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);

    if (type === 'invoice') {
        doc.text(`Invoice #: ${data.invoiceNumber}`, 50, 120);
        doc.text(`Guest: ${data.guestName}`, 50, 150);
        doc.text(`Amount: ₹${data.totalAmount}`, 50, 180);
    }

    doc.end();
    return doc;
};

module.exports = {
    generatePDF
};
