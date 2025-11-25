import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import PDFDocument from 'pdfkit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({ error: 'Supabase credentials not configured' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get query parameters
        const { companyId, sector, startDate, endDate } = req.query;

        console.log('Generating PDF report with filters:', { companyId, sector, startDate, endDate });

        let query = supabase
            .from('COPSQ_respostas')
            .select('*');

        // Apply filters
        if (companyId) {
            query = query.eq('empresa_id', companyId);
        }
        if (sector) {
            query = query.eq('area_setor', sector);
        }
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'No data found for the given filters' });
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-${new Date().toISOString().split('T')[0]}.pdf"`);

        // Pipe the PDF to the response
        doc.pipe(res);

        // Add header
        doc.fontSize(20)
            .font('Helvetica-Bold')
            .text('Relatório COPSQ', { align: 'center' });

        doc.moveDown(0.5);
        doc.fontSize(10)
            .font('Helvetica')
            .text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });

        doc.moveDown(1);

        // Add filter information
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('Filtros Aplicados:', { underline: true });

        doc.moveDown(0.5);
        doc.fontSize(10)
            .font('Helvetica');

        if (companyId) {
            doc.text(`Empresa ID: ${companyId}`);
        }
        if (sector) {
            doc.text(`Setor: ${sector}`);
        }
        if (startDate) {
            doc.text(`Data Início: ${new Date(startDate as string).toLocaleDateString('pt-BR')}`);
        }
        if (endDate) {
            doc.text(`Data Fim: ${new Date(endDate as string).toLocaleDateString('pt-BR')}`);
        }

        doc.moveDown(1);

        // Add summary statistics
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('Resumo:', { underline: true });

        doc.moveDown(0.5);
        doc.fontSize(10)
            .font('Helvetica')
            .text(`Total de Respostas: ${data.length}`);

        doc.moveDown(1);

        // Add data table header
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('Dados:', { underline: true });

        doc.moveDown(0.5);

        // Table configuration
        const tableTop = doc.y;
        const itemHeight = 25;
        const pageHeight = doc.page.height - doc.page.margins.bottom;

        // Define columns (adjust based on your data structure)
        const columns = [
            { key: 'id', label: 'ID', width: 50 },
            { key: 'nome_completo', label: 'Nome', width: 150 },
            { key: 'area_setor', label: 'Setor', width: 100 },
            { key: 'created_at', label: 'Data', width: 100 }
        ];

        // Draw table header
        let currentY = doc.y;
        let currentX = 50;

        doc.fontSize(9)
            .font('Helvetica-Bold');

        columns.forEach(col => {
            doc.text(col.label, currentX, currentY, { width: col.width, align: 'left' });
            currentX += col.width;
        });

        currentY += itemHeight;
        doc.moveTo(50, currentY - 5)
            .lineTo(550, currentY - 5)
            .stroke();

        // Draw table rows
        doc.font('Helvetica')
            .fontSize(8);

        data.forEach((row, index) => {
            // Check if we need a new page
            if (currentY + itemHeight > pageHeight) {
                doc.addPage();
                currentY = 50;

                // Redraw header on new page
                currentX = 50;
                doc.fontSize(9).font('Helvetica-Bold');
                columns.forEach(col => {
                    doc.text(col.label, currentX, currentY, { width: col.width, align: 'left' });
                    currentX += col.width;
                });
                currentY += itemHeight;
                doc.moveTo(50, currentY - 5)
                    .lineTo(550, currentY - 5)
                    .stroke();
                doc.font('Helvetica').fontSize(8);
            }

            currentX = 50;
            columns.forEach(col => {
                let value = row[col.key];

                // Format date if it's a date field
                if (col.key === 'created_at' && value) {
                    value = new Date(value).toLocaleDateString('pt-BR');
                }

                // Handle null/undefined values
                const displayValue = value !== null && value !== undefined ? String(value) : '-';

                doc.text(displayValue, currentX, currentY, {
                    width: col.width,
                    align: 'left',
                    ellipsis: true
                });
                currentX += col.width;
            });

            currentY += itemHeight;

            // Draw row separator
            if (index < data.length - 1) {
                doc.moveTo(50, currentY - 5)
                    .lineTo(550, currentY - 5)
                    .strokeOpacity(0.3)
                    .stroke()
                    .strokeOpacity(1);
            }
        });

        // Finalize PDF
        doc.end();

    } catch (error: any) {
        console.error('Handler error:', error);

        // If headers haven't been sent yet, send error response
        if (!res.headersSent) {
            return res.status(500).json({ error: error.message || 'Internal Server Error' });
        }
    }
}
