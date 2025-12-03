import React, { useRef } from 'react';
import { Download, X, Receipt, IndianRupee } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ReactToPrint from 'react-to-print';

const Invoice = ({ bill, onClose }) => {
    const invoiceRef = useRef();

    const downloadPDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Colors
        const primaryColor = [37, 99, 235]; // Blue-600
        const darkGray = [55, 65, 81]; // Gray-700
        const lightGray = [243, 244, 246]; // Gray-100

        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(bill.hotel_name || 'Front Office Management Hotel', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('TAX INVOICE', pageWidth / 2, 30, { align: 'center' });

        let yPos = 50;

        // Invoice Details
        doc.setTextColor(...darkGray);
        doc.setFontSize(10);
        doc.text(`Invoice Number: ${bill.invoice_number}`, 20, yPos);
        doc.text(`Date: ${new Date(bill.bill_date).toLocaleDateString('en-IN')}`, pageWidth - 20, yPos, { align: 'right' });
        yPos += 5;
        doc.text(`Time: ${bill.bill_time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 20, yPos, { align: 'right' });
        yPos += 10;

        // Guest Information
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', 20, yPos);
        yPos += 7;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(bill.guest_name, 20, yPos);
        yPos += 5;
        if (bill.guest_phone) {
            doc.text(`Phone: ${bill.guest_phone}`, 20, yPos);
            yPos += 5;
        }
        if (bill.room_number) {
            doc.text(`Room: ${bill.room_number} (${bill.room_type || ''})`, 20, yPos);
            yPos += 5;
        }
        if (bill.check_in_date && bill.check_out_date) {
            doc.text(`Stay: ${new Date(bill.check_in_date).toLocaleDateString('en-IN')} to ${new Date(bill.check_out_date).toLocaleDateString('en-IN')}`, 20, yPos);
            yPos += 5;
        }
        yPos += 10;

        // Items Table
        const tableData = [];
        bill.items?.forEach(item => {
            tableData.push([
                item.item_description,
                item.quantity.toString(),
                `₹${item.unit_price.toFixed(2)}`,
                `₹${item.base_amount.toFixed(2)}`,
                `${item.gst_rate.toFixed(2)}%`,
                `₹${item.gst_amount.toFixed(2)}`,
                `₹${item.total_amount.toFixed(2)}`
            ]);
        });

        doc.autoTable({
            startY: yPos,
            head: [['Description', 'Qty', 'Unit Price', 'Base Amount', 'GST %', 'GST Amount', 'Total']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8,
                textColor: darkGray
            },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' }
            }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Totals
        const totalsY = yPos;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        doc.text('Subtotal:', pageWidth - 70, totalsY);
        doc.text(`₹${bill.subtotal.toFixed(2)}`, pageWidth - 20, totalsY, { align: 'right' });
        totalsY += 7;
        
        doc.text(`GST (${bill.gst_rate.toFixed(2)}%):`, pageWidth - 70, totalsY);
        doc.text(`₹${bill.gst_amount.toFixed(2)}`, pageWidth - 20, totalsY, { align: 'right' });
        totalsY += 7;
        
        if (bill.discount > 0) {
            doc.text('Discount:', pageWidth - 70, totalsY);
            doc.text(`-₹${bill.discount.toFixed(2)}`, pageWidth - 20, totalsY, { align: 'right' });
            totalsY += 7;
        }

        // Total
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setFillColor(...lightGray);
        doc.rect(pageWidth - 70, totalsY - 5, 50, 8, 'F');
        doc.text('Total Amount:', pageWidth - 70, totalsY + 3);
        doc.text(`₹${bill.total_amount.toFixed(2)}`, pageWidth - 20, totalsY + 3, { align: 'right' });
        totalsY += 15;

        // Payment Information
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Payment Information:', 20, totalsY);
        totalsY += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Payment Method: ${bill.payment_method || 'Cash'}`, 20, totalsY);
        totalsY += 5;
        doc.text(`Payment Status: ${bill.payment_status || 'Pending'}`, 20, totalsY);
        if (bill.payment_reference) {
            totalsY += 5;
            doc.text(`Reference: ${bill.payment_reference}`, 20, totalsY);
        }

        // Footer
        const footerY = doc.internal.pageSize.getHeight() - 30;
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('Thank you for your stay!', pageWidth / 2, footerY, { align: 'center' });
        if (bill.hotel_address) {
            doc.text(bill.hotel_address, pageWidth / 2, footerY + 5, { align: 'center' });
        }
        if (bill.hotel_phone) {
            doc.text(`Phone: ${bill.hotel_phone}`, pageWidth / 2, footerY + 10, { align: 'center' });
        }

        doc.save(`Invoice-${bill.invoice_number}.pdf`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="bg-blue-600 text-white p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">{bill.hotel_name || 'Front Office Management Hotel'}</h2>
                            <p className="text-blue-100 text-sm mt-1">TAX INVOICE</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Invoice Content */}
                <div ref={invoiceRef} className="p-6">
                    {/* Invoice Details */}
                    <div className="flex justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Invoice Number</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{bill.invoice_number}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {new Date(bill.bill_date).toLocaleDateString('en-IN')}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {bill.bill_time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    {/* Guest Information */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bill To:</h3>
                            <p className="text-gray-900 dark:text-white font-medium">{bill.guest_name}</p>
                            {bill.guest_phone && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">Phone: {bill.guest_phone}</p>
                            )}
                            {bill.guest_aadhar && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">Aadhar: {bill.guest_aadhar}</p>
                            )}
                        </div>
                        {bill.room_number && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Room Details:</h3>
                                <p className="text-gray-900 dark:text-white">Room {bill.room_number} ({bill.room_type})</p>
                                {bill.check_in_date && bill.check_out_date && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(bill.check_in_date).toLocaleDateString('en-IN')} - {new Date(bill.check_out_date).toLocaleDateString('en-IN')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div className="mb-6 overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-blue-600 text-white">
                                    <th className="border border-blue-700 px-4 py-3 text-left text-sm font-semibold">Description</th>
                                    <th className="border border-blue-700 px-4 py-3 text-center text-sm font-semibold">Qty</th>
                                    <th className="border border-blue-700 px-4 py-3 text-right text-sm font-semibold">Unit Price</th>
                                    <th className="border border-blue-700 px-4 py-3 text-right text-sm font-semibold">Base Amount</th>
                                    <th className="border border-blue-700 px-4 py-3 text-right text-sm font-semibold">GST %</th>
                                    <th className="border border-blue-700 px-4 py-3 text-right text-sm font-semibold">GST Amount</th>
                                    <th className="border border-blue-700 px-4 py-3 text-right text-sm font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bill.items?.map((item, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}>
                                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {item.item_description}
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                                            {item.quantity}
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            ₹{item.unit_price.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            ₹{item.base_amount.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            {item.gst_rate.toFixed(2)}%
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            ₹{item.gst_amount.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                            ₹{item.total_amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-6">
                        <div className="w-full md:w-1/2">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">₹{bill.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">GST ({bill.gst_rate.toFixed(2)}%):</span>
                                    <span className="text-gray-900 dark:text-white font-medium">₹{bill.gst_amount.toFixed(2)}</span>
                                </div>
                                {bill.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                                        <span className="text-red-600 dark:text-red-400 font-medium">-₹{bill.discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-2 mt-2">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">Total Amount:</span>
                                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{bill.total_amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment Information:</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Payment Method: </span>
                                <span className="text-gray-900 dark:text-white font-medium">{bill.payment_method || 'Cash'}</span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Payment Status: </span>
                                <span className={`font-medium ${
                                    bill.payment_status === 'Paid' ? 'text-green-600 dark:text-green-400' : 
                                    bill.payment_status === 'Pending' ? 'text-yellow-600 dark:text-yellow-400' : 
                                    'text-red-600 dark:text-red-400'
                                }`}>
                                    {bill.payment_status || 'Pending'}
                                </span>
                            </div>
                            {bill.payment_reference && (
                                <div className="col-span-2">
                                    <span className="text-gray-600 dark:text-gray-400">Payment Reference: </span>
                                    <span className="text-gray-900 dark:text-white font-medium">{bill.payment_reference}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="font-semibold mb-1">Thank you for your stay!</p>
                        {bill.hotel_address && <p>{bill.hotel_address}</p>}
                        {bill.hotel_phone && <p>Phone: {bill.hotel_phone}</p>}
                        {bill.hotel_email && <p>Email: {bill.hotel_email}</p>}
                        {bill.hotel_gstin && <p>GSTIN: {bill.hotel_gstin}</p>}
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 flex justify-end space-x-3 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={downloadPDF}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Invoice;


