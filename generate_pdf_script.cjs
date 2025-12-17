
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Output path in artifacts directory
const outputPath = 'C:\\Users\\Dell Inspiron\\.gemini\\antigravity\\brain\\275ec519-f593-4a44-84c8-72fece1c2d33\\Proposta_Senturi_SaaS.pdf';

const doc = new PDFDocument({ margin: 50, size: 'A4' });

// Pipe to file
doc.pipe(fs.createWriteStream(outputPath));

// -- Header --
doc.fontSize(24).font('Helvetica-Bold').text('Proposta Comercial & Técnica', { align: 'center' });
doc.fontSize(14).font('Helvetica').text('Consolidação SaaS - Senturi 4.0', { align: 'center' });
doc.moveDown(2);

// -- Introduction --
doc.fontSize(12).font('Helvetica-Bold').text('1. Resumo Executivo');
doc.fontSize(10).font('Helvetica').text(
    'Esta proposta visa transformar a plataforma Senturi 4.0 em um sistema SaaS (Software as a Service) robusto, escalável e seguro. ' +
    'O foco será na implementação de multi-tenancy real, segurança avançada, automação de assinaturas e ' +
    'ferramentas de alto valor agregado (Gerador de Formulários e Relatórios Executivos).',
    { align: 'justify' }
);
doc.moveDown(1);

// -- Scope --
doc.fontSize(12).font('Helvetica-Bold').text('2. Escopo do Projeto');
doc.moveDown(0.5);

const items = [
    {
        title: 'A. Segurança e Multi-tenancy (Core)',
        desc: 'Implementação de Row Level Security (RLS) no Supabase para isolamento total de dados entre empresas. Sistema de permissões avançado (RBAC) e Logs de Auditoria.'
    },
    {
        title: 'B. Motor de Assinaturas (SaaS)',
        desc: 'Integração com Gateway de Pagamento (Stripe/Asaas) para gestão automática de assinaturas, cobrança recorrente e bloqueio automático de inadimplentes.'
    },
    {
        title: 'C. Gerador de Formulários (Form Builder)',
        desc: 'Desenvolvimento de interface "arrastar e soltar" para criação dinâmica de questionários de saúde ocupacional, eliminando a necessidade de código para novos forms.'
    },
    {
        title: 'D. Relatórios Executivos Premium (PDF e Web)',
        desc: 'Geração de PDFs visuais de alta qualidade com gráficos, mapas de calor e análise detalhada, substituindo o modelo tabular atual. Dashboards com KPIs em tempo real.'
    }
];

items.forEach(item => {
    doc.fontSize(11).font('Helvetica-Bold').text(item.title);
    doc.fontSize(10).font('Helvetica').text(item.desc, { align: 'justify' });
    doc.moveDown(0.6);
});

doc.moveDown(1);

// -- Investment --
doc.fontSize(12).font('Helvetica-Bold').text('3. Investimento e Prazos');
doc.moveDown(0.5);

doc.fontSize(10).font('Helvetica').text('O investimento total para a execução completa do escopo acima é de:');
doc.moveDown(1);

// Price Box
const startX = 50;
const startY = doc.y;
doc.rect(startX, startY, 495, 60).fillAndStroke('#f9f9f9', '#000000');
doc.fillColor('#000000');

doc.fontSize(22).font('Helvetica-Bold').text('R$ 20.000,00', startX, startY + 15, { width: 495, align: 'center' });
doc.fontSize(10).font('Helvetica').text('(Vinte mil reais)', startX, startY + 40, { width: 495, align: 'center' });

doc.moveDown(3);

doc.fontSize(10).font('Helvetica-Bold').text('Condições de Pagamento:');
doc.font('Helvetica').text('A combinar (Sugestão: 40% Entrada, 30% Entrega Parcial, 30% Final).');
doc.moveDown(0.5);
doc.font('Helvetica-Bold').text('Prazo Estimado de Execução:');
doc.font('Helvetica').text('8 a 10 semanas.');

doc.moveDown(4);
doc.font('Helvetica-Oblique').fontSize(8).text('Documento gerado automaticamente por Senturi AI Agent.', { align: 'center' });

doc.end();

console.log('PDF Generated Successfully at: ' + outputPath);
