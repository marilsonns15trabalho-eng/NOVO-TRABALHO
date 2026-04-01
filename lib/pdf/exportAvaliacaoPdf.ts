import { extractDateOnly, formatDatePtBr } from '@/lib/date';
import { calcularRcq, getAvaliacaoProtocolLabel } from '@/lib/biometrics';
import { downloadFile } from '@/lib/external-links';

type PdfAvaliacao = {
  data: string;
  peso?: number | null;
  altura?: number | null;
  imc?: number | null;
  percentual_gordura?: number | null;
  massa_gorda?: number | null;
  massa_magra?: number | null;
  protocolo?: string | null;
  observacoes?: string | null;
  pescoco?: number | null;
  ombro?: number | null;
  torax?: number | null;
  cintura?: number | null;
  abdome?: number | null;
  quadril?: number | null;
  braco_direito?: number | null;
  braco_esquerdo?: number | null;
  coxa_direita?: number | null;
  coxa_esquerda?: number | null;
  panturrilha_direita?: number | null;
  panturrilha_esquerda?: number | null;
  tricipital?: number | null;
  subescapular?: number | null;
  supra_iliaca?: number | null;
  abdominal?: number | null;
  students?: {
    nome?: string;
    gender?: string | null;
    birth_date?: string | null;
  };
};

function formatValue(value: unknown, suffix = '') {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  return `${value}${suffix}`;
}

async function savePdfDocument(doc: any, fileName: string) {
  const blob = doc.output('blob');
  const pdfFile = new File([blob], fileName, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });

  await downloadFile(pdfFile, fileName);
}

export async function exportAvaliacaoPdf(avaliacao: PdfAvaliacao) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const studentName = avaliacao.students?.nome || 'Aluno';

  doc.setFillColor(245, 158, 11);
  doc.rect(0, 0, pageWidth, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('RELATORIO DE AVALIACAO FISICA', 14, 22);
  doc.setFontSize(9);
  doc.text(formatDatePtBr(avaliacao.data), pageWidth - 14, 22, {
    align: 'right',
  });

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(12);
  doc.text(`Aluno: ${studentName}`, 14, 52);
  doc.text(`Protocolo: ${getAvaliacaoProtocolLabel(avaliacao.protocolo)}`, 14, 60);

  const infoRows = [
    ['Peso', formatValue(avaliacao.peso, ' kg')],
    ['Altura', formatValue(avaliacao.altura, ' m')],
    ['IMC', formatValue(avaliacao.imc)],
    ['RCQ', formatValue(calcularRcq(avaliacao.cintura, avaliacao.quadril))],
    ['% Gordura', formatValue(avaliacao.percentual_gordura, '%')],
    ['Massa gorda', formatValue(avaliacao.massa_gorda, ' kg')],
    ['Massa magra', formatValue(avaliacao.massa_magra, ' kg')],
  ];

  (autoTable as any)(doc, {
    startY: 72,
    head: [['Resumo corporal', 'Valor']],
    body: infoRows,
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
    tableWidth: 85,
  });

  const perimeterRows = [
    ['Pescoco', formatValue(avaliacao.pescoco, ' cm')],
    ['Ombro', formatValue(avaliacao.ombro, ' cm')],
    ['Torax', formatValue(avaliacao.torax, ' cm')],
    ['Cintura', formatValue(avaliacao.cintura, ' cm')],
    ['Abdome', formatValue(avaliacao.abdome, ' cm')],
    ['Quadril', formatValue(avaliacao.quadril, ' cm')],
    ['Braco direito', formatValue(avaliacao.braco_direito, ' cm')],
    ['Braco esquerdo', formatValue(avaliacao.braco_esquerdo, ' cm')],
    ['Coxa direita', formatValue(avaliacao.coxa_direita, ' cm')],
    ['Coxa esquerda', formatValue(avaliacao.coxa_esquerda, ' cm')],
    ['Panturrilha direita', formatValue(avaliacao.panturrilha_direita, ' cm')],
    ['Panturrilha esquerda', formatValue(avaliacao.panturrilha_esquerda, ' cm')],
  ];

  (autoTable as any)(doc, {
    startY: 72,
    head: [['Perimetros', 'Valor']],
    body: perimeterRows,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 110, right: 14 },
    tableWidth: 86,
  });

  const protocolLabel = getAvaliacaoProtocolLabel(avaliacao.protocolo);
  const protocolTableTitle =
    avaliacao.protocolo === 'navy'
      ? `Medidas do protocolo (${protocolLabel})`
      : `Dobras cutaneas (${protocolLabel})`;
  const protocolRows =
    avaliacao.protocolo === 'navy'
      ? [
          ['Pescoco', formatValue(avaliacao.pescoco, ' cm')],
          ['Cintura', formatValue(avaliacao.cintura, ' cm')],
          ['Quadril', formatValue(avaliacao.quadril, ' cm')],
          ['Altura', formatValue(avaliacao.altura, ' m')],
        ]
      : [
          ['Tricipital', formatValue(avaliacao.tricipital, ' mm')],
          ['Subescapular', formatValue(avaliacao.subescapular, ' mm')],
          ['Supra iliaca', formatValue(avaliacao.supra_iliaca, ' mm')],
          ['Abdominal', formatValue(avaliacao.abdominal, ' mm')],
        ];

  const afterFirstTables = Math.max(
    (doc as any).lastAutoTable?.finalY || 140,
    148,
  );

  (autoTable as any)(doc, {
    startY: afterFirstTables + 8,
    head: [[protocolTableTitle, 'Valor']],
    body: protocolRows,
    theme: 'grid',
    headStyles: { fillColor: [168, 85, 247], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 245, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  if (avaliacao.observacoes) {
    const notesY = ((doc as any).lastAutoTable?.finalY || afterFirstTables) + 12;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Observacoes', 14, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(avaliacao.observacoes, 14, notesY + 7, { maxWidth: 180 });
  }

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('Documento gerado pelo sistema Lioness.', pageWidth / 2, 286, { align: 'center' });

  const fileName = `Avaliacao_${studentName.replace(/\s+/g, '_')}_${extractDateOnly(avaliacao.data) || avaliacao.data}.pdf`;
  await savePdfDocument(doc, fileName);
}
