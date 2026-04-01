import { diffDateOnlyInDays, formatDatePtBr, formatDateTimePtBr } from '@/lib/date';
import { calcularRcq, getAvaliacaoProtocolLabel } from '@/lib/biometrics';
import { downloadFile } from '@/lib/external-links';

type PdfAvaliacao = {
  id?: string;
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

type ChartSeries = {
  label: string;
  color: [number, number, number];
};

type ChartGroup = {
  label: string;
  values: Array<number | null>;
};

const BRAND_NAME = 'LIONESS PERSONAL STUDIO';
const REPORT_SUBTITLE = 'Relatorio de Evolucao Fisica';

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatMetric(
  value: number | null | undefined,
  unit = '',
  digits = 1,
) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  return `${formatNumber(value, digits)}${unit}`;
}

function formatVariation(
  current: number | null | undefined,
  previous: number | null | undefined,
  unit = '',
  digits = 1,
) {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    Number.isNaN(current) ||
    Number.isNaN(previous)
  ) {
    return '-';
  }

  const diff = current - previous;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${formatNumber(diff, digits)}${unit}`;
}

function difference(
  current: number | null | undefined,
  previous: number | null | undefined,
) {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    Number.isNaN(current) ||
    Number.isNaN(previous)
  ) {
    return null;
  }

  return current - previous;
}

function calculateSkinfoldSum(avaliacao: PdfAvaliacao) {
  const values = [
    asNumber(avaliacao.tricipital),
    asNumber(avaliacao.subescapular),
    asNumber(avaliacao.supra_iliaca),
    asNumber(avaliacao.abdominal),
  ].filter((value): value is number => value !== null);

  if (!values.length) {
    return null;
  }

  return Number(values.reduce((total, item) => total + item, 0).toFixed(1));
}

function genderLabel(value: string | null | undefined) {
  const normalized = (value || '').trim().toLowerCase();

  if (!normalized) {
    return '-';
  }

  if (['f', 'female', 'feminino', 'mulher'].includes(normalized)) {
    return 'Feminino';
  }

  if (['m', 'male', 'masculino', 'homem'].includes(normalized)) {
    return 'Masculino';
  }

  return value || '-';
}

function diffInDays(start: string | Date, end: string | Date) {
  const diff = diffDateOnlyInDays(start, end);
  if (diff === null) {
    return '-';
  }

  return String(diff);
}

function safeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

async function savePdfDocument(doc: any, fileName: string) {
  const blob = doc.output('blob');
  const pdfFile = new File([blob], fileName, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });

  await downloadFile(pdfFile, fileName);
}

function drawHeader(doc: any) {
  doc.setTextColor(18, 18, 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(BRAND_NAME, 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(108, 114, 127);
  doc.setFontSize(8);
  doc.text(REPORT_SUBTITLE, 14, 22);

  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.5);
  doc.line(14, 26, 196, 26);
}

function drawSectionTitle(doc: any, title: string, y: number) {
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, 14, y);
}

function drawInfoBlock(
  doc: any,
  previous: PdfAvaliacao,
  current: PdfAvaliacao,
  reportDate: Date,
) {
  drawSectionTitle(doc, 'RELATORIO DE EVOLUCAO FISICA', 42);

  const studentName = current.students?.nome || previous.students?.nome || 'Aluno';
  const infoRows = [
    ['Aluno', studentName],
    ['Data Nascimento', formatDatePtBr(current.students?.birth_date || previous.students?.birth_date)],
    ['Sexo', genderLabel(current.students?.gender || previous.students?.gender)],
    ['Periodo', `${formatDatePtBr(previous.data)} a ${formatDatePtBr(current.data)}`],
    ['Intervalo', `${diffInDays(previous.data, current.data)} dias`],
    ['Data Relatorio', formatDateTimePtBr(reportDate)],
  ];

  let y = 58;
  for (const [label, value] of infoRows) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(`${label}:`, 32, y);

    doc.setFont('helvetica', 'normal');
    doc.text(String(value || '-'), 78, y);
    y += 9;
  }
}

function buildRow(
  label: string,
  previous: number | null | undefined,
  current: number | null | undefined,
  unit = '',
  digits = 1,
) {
  return [
    label,
    formatMetric(previous, unit, digits),
    formatMetric(current, unit, digits),
    formatVariation(current, previous, unit, digits),
  ];
}

function drawGridTable(
  renderTable: (options: Record<string, unknown>) => void,
  doc: any,
  title: string,
  startY: number,
  dateA: string,
  dateB: string,
  body: string[][],
) {
  drawSectionTitle(doc, title, startY);

  renderTable({
    startY: startY + 8,
    head: [['Parametro', dateA, dateB, 'Variacao']],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [224, 224, 224],
      textColor: [16, 16, 16],
      fontStyle: 'bold',
      lineColor: [170, 170, 170],
      lineWidth: 0.2,
    },
    bodyStyles: {
      textColor: [30, 30, 30],
      lineColor: [185, 185, 185],
      lineWidth: 0.15,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });
}

function drawGroupedBarChart(
  doc: any,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  groups: ChartGroup[],
  series: ChartSeries[],
) {
  doc.setDrawColor(188, 188, 188);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 3, 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(25, 25, 25);
  doc.text(title, x + 5, y + 8);

  const legendY = y + 14;
  let legendX = x + 5;
  series.forEach((item) => {
    doc.setFillColor(...item.color);
    doc.rect(legendX, legendY, 4, 4, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(item.label, legendX + 6, legendY + 3.4);
    legendX += 28;
  });

  const values = groups
    .flatMap((group) => group.values)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (!values.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text('Sem dados suficientes para o grafico.', x + width / 2, y + height / 2, {
      align: 'center',
    });
    return;
  }

  const chartLeft = x + 12;
  const chartRight = x + width - 6;
  const chartTop = y + 24;
  const chartBottom = y + height - 14;
  const chartHeight = chartBottom - chartTop;
  const maxValue = Math.max(...values) * 1.15 || 1;

  for (let index = 0; index <= 4; index += 1) {
    const lineY = chartBottom - (chartHeight * index) / 4;
    const labelValue = (maxValue * index) / 4;

    doc.setDrawColor(230, 230, 230);
    doc.line(chartLeft, lineY, chartRight, lineY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(formatNumber(labelValue, 0), chartLeft - 2, lineY + 2, { align: 'right' });
  }

  const groupWidth = (chartRight - chartLeft) / groups.length;

  groups.forEach((group, groupIndex) => {
    const valuesInGroup = series.length || 1;
    const totalBarWidth = Math.min(groupWidth * 0.65, valuesInGroup * 10 + (valuesInGroup - 1) * 3);
    const barWidth = Math.max(8, (totalBarWidth - (valuesInGroup - 1) * 3) / valuesInGroup);
    let currentX = chartLeft + groupWidth * groupIndex + (groupWidth - totalBarWidth) / 2;

    group.values.forEach((value, valueIndex) => {
      if (value === null || value === undefined || Number.isNaN(value)) {
        currentX += barWidth + 3;
        return;
      }

      const barHeight = Math.max(2, (value / maxValue) * (chartHeight - 6));
      doc.setFillColor(...series[valueIndex].color);
      doc.rect(currentX, chartBottom - barHeight, barWidth, barHeight, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(55, 55, 55);
      doc.text(formatNumber(value, 1), currentX + barWidth / 2, chartBottom - barHeight - 2, {
        align: 'center',
      });

      currentX += barWidth + 3;
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(85, 85, 85);
    doc.text(group.label, chartLeft + groupWidth * groupIndex + groupWidth / 2, chartBottom + 7, {
      align: 'center',
      maxWidth: groupWidth - 2,
    });
  });
}

function buildAnalysis(previous: PdfAvaliacao, current: PdfAvaliacao) {
  const statements: string[] = [];
  const weightDiff = difference(asNumber(current.peso), asNumber(previous.peso));
  const fatDiff = difference(
    asNumber(current.percentual_gordura),
    asNumber(previous.percentual_gordura),
  );
  const leanDiff = difference(asNumber(current.massa_magra), asNumber(previous.massa_magra));
  const rcqDiff = difference(
    calcularRcq(current.cintura, current.quadril),
    calcularRcq(previous.cintura, previous.quadril),
  );
  const waistDiff = difference(asNumber(current.cintura), asNumber(previous.cintura));

  if (weightDiff !== null) {
    statements.push(
      weightDiff < 0
        ? `Houve reducao de ${formatMetric(Math.abs(weightDiff), ' kg')} no peso corporal no periodo analisado.`
        : weightDiff > 0
          ? `Houve aumento de ${formatMetric(weightDiff, ' kg')} no peso corporal no periodo analisado.`
          : 'O peso corporal permaneceu estavel no periodo analisado.',
    );
  }

  if (fatDiff !== null) {
    statements.push(
      fatDiff < 0
        ? `O percentual de gordura caiu ${formatMetric(Math.abs(fatDiff), ' p.p.')}, indicando melhora da composicao corporal.`
        : fatDiff > 0
          ? `O percentual de gordura subiu ${formatMetric(fatDiff, ' p.p.')}, o que pede revisao da estrategia atual.`
          : 'O percentual de gordura se manteve estavel entre as duas avaliacoes.',
    );
  }

  if (leanDiff !== null) {
    statements.push(
      leanDiff > 0
        ? `A massa magra aumentou ${formatMetric(leanDiff, ' kg')}, sinalizando boa resposta ao treino de forca.`
        : leanDiff < 0
          ? `A massa magra caiu ${formatMetric(Math.abs(leanDiff), ' kg')}, ponto de atencao para treino, proteina e recuperacao.`
          : 'A massa magra nao apresentou variacao relevante.',
    );
  }

  if (rcqDiff !== null) {
    statements.push(
      rcqDiff < 0
        ? `A relacao cintura-quadril melhorou ${formatMetric(Math.abs(rcqDiff), '')}.`
        : rcqDiff > 0
          ? `A relacao cintura-quadril aumentou ${formatMetric(rcqDiff, '')}.`
          : 'A relacao cintura-quadril permaneceu estavel.',
    );
  }

  if (waistDiff !== null) {
    statements.push(
      waistDiff < 0
        ? `A cintura reduziu ${formatMetric(Math.abs(waistDiff), ' cm')}.`
        : waistDiff > 0
          ? `A cintura aumentou ${formatMetric(waistDiff, ' cm')}.`
          : 'A medida de cintura nao variou.',
    );
  }

  if (!statements.length) {
    return 'Nao ha dados suficientes para descrever a evolucao entre as duas avaliacoes selecionadas.';
  }

  return statements.join(' ');
}

function buildRecommendations(previous: PdfAvaliacao, current: PdfAvaliacao) {
  const items: string[] = [];
  const fatDiff = difference(
    asNumber(current.percentual_gordura),
    asNumber(previous.percentual_gordura),
  );
  const leanDiff = difference(asNumber(current.massa_magra), asNumber(previous.massa_magra));
  const waistDiff = difference(asNumber(current.cintura), asNumber(previous.cintura));
  const skinfoldDiff = difference(calculateSkinfoldSum(current), calculateSkinfoldSum(previous));

  if (fatDiff !== null && fatDiff < 0) {
    items.push('Manter a estrategia atual de treino e alimentacao enquanto a reducao de gordura permanecer consistente.');
  }

  if (fatDiff !== null && fatDiff > 0) {
    items.push('Revisar frequencia de treino, adesao ao plano alimentar e rotina fora da academia para conter o aumento do percentual de gordura.');
  }

  if (leanDiff !== null && leanDiff > 0) {
    items.push('Preservar o foco em treino de forca progressivo e recuperacao, ja que houve ganho de massa magra.');
  }

  if (leanDiff !== null && leanDiff < 0) {
    items.push('Ajustar volume total, descanso e ingestao proteica para evitar nova perda de massa magra.');
  }

  if (waistDiff !== null && waistDiff < 0) {
    items.push('Seguir monitorando cintura e abdome nas proximas reavaliacoes para confirmar a tendencia de reducao central.');
  }

  if (skinfoldDiff !== null && skinfoldDiff > 0) {
    items.push('As dobras cutaneas subiram no periodo; vale reforcar aderencia ao plano e revisar a distribuicao semanal do treino.');
  }

  if (!items.length) {
    items.push('Manter a reavaliacao periodica para consolidar historico e orientar ajustes com base em dados reais.');
  }

  return items.slice(0, 5);
}

export async function exportAvaliacaoEvolutionPdf(
  previous: PdfAvaliacao,
  current: PdfAvaliacao,
) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const renderTable = (options: Record<string, unknown>) => (autoTable as any)(doc, options);

  const reportDate = new Date();
  const dateA = formatDatePtBr(previous.data);
  const dateB = formatDatePtBr(current.data);

  drawHeader(doc);
  drawInfoBlock(doc, previous, current, reportDate);

  drawGridTable(renderTable, doc, 'RESUMO DA EVOLUCAO', 122, dateA, dateB, [
    buildRow('Peso (kg)', asNumber(previous.peso), asNumber(current.peso), ' kg'),
    buildRow('IMC', asNumber(previous.imc), asNumber(current.imc)),
    buildRow('% Gordura', asNumber(previous.percentual_gordura), asNumber(current.percentual_gordura), '%'),
    buildRow('Massa Gorda (kg)', asNumber(previous.massa_gorda), asNumber(current.massa_gorda), ' kg'),
    buildRow('Massa Magra (kg)', asNumber(previous.massa_magra), asNumber(current.massa_magra), ' kg'),
    buildRow('RCQ', calcularRcq(previous.cintura, previous.quadril), calcularRcq(current.cintura, current.quadril), '', 2),
  ]);

  doc.addPage();
  drawHeader(doc);
  drawGridTable(renderTable, doc, 'COMPARACAO DETALHADA', 38, dateA, dateB, [
    buildRow('Peso (kg)', asNumber(previous.peso), asNumber(current.peso), ' kg'),
    buildRow('IMC', asNumber(previous.imc), asNumber(current.imc)),
    buildRow('% Gordura', asNumber(previous.percentual_gordura), asNumber(current.percentual_gordura), '%'),
    buildRow('Massa Gorda (kg)', asNumber(previous.massa_gorda), asNumber(current.massa_gorda), ' kg'),
    buildRow('Massa Magra (kg)', asNumber(previous.massa_magra), asNumber(current.massa_magra), ' kg'),
    buildRow('RCQ', calcularRcq(previous.cintura, previous.quadril), calcularRcq(current.cintura, current.quadril), '', 2),
    buildRow('Pescoco (cm)', asNumber(previous.pescoco), asNumber(current.pescoco), ' cm'),
    buildRow('Circ. Cintura (cm)', asNumber(previous.cintura), asNumber(current.cintura), ' cm'),
    buildRow('Circ. Quadril (cm)', asNumber(previous.quadril), asNumber(current.quadril), ' cm'),
    buildRow('Circ. Abdome (cm)', asNumber(previous.abdome), asNumber(current.abdome), ' cm'),
    buildRow('Circ. Torax (cm)', asNumber(previous.torax), asNumber(current.torax), ' cm'),
  ]);

  doc.addPage();
  drawHeader(doc);
  drawGridTable(renderTable, doc, 'MEDIDAS PERIMETRICAS (cm)', 38, dateA, dateB, [
    buildRow('Pescoco', asNumber(previous.pescoco), asNumber(current.pescoco), ' cm'),
    buildRow('Ombro', asNumber(previous.ombro), asNumber(current.ombro), ' cm'),
    buildRow('Torax', asNumber(previous.torax), asNumber(current.torax), ' cm'),
    buildRow('Cintura', asNumber(previous.cintura), asNumber(current.cintura), ' cm'),
    buildRow('Abdome', asNumber(previous.abdome), asNumber(current.abdome), ' cm'),
    buildRow('Quadril', asNumber(previous.quadril), asNumber(current.quadril), ' cm'),
    buildRow('Braco Esquerdo', asNumber(previous.braco_esquerdo), asNumber(current.braco_esquerdo), ' cm'),
    buildRow('Braco Direito', asNumber(previous.braco_direito), asNumber(current.braco_direito), ' cm'),
    buildRow('Coxa Esquerda', asNumber(previous.coxa_esquerda), asNumber(current.coxa_esquerda), ' cm'),
    buildRow('Coxa Direita', asNumber(previous.coxa_direita), asNumber(current.coxa_direita), ' cm'),
    buildRow('Panturrilha Esquerda', asNumber(previous.panturrilha_esquerda), asNumber(current.panturrilha_esquerda), ' cm'),
    buildRow('Panturrilha Direita', asNumber(previous.panturrilha_direita), asNumber(current.panturrilha_direita), ' cm'),
  ]);

  doc.addPage();
  drawHeader(doc);
  const protocolLabel = getAvaliacaoProtocolLabel(current.protocolo);
  const protocolTableTitle =
    current.protocolo === 'navy'
      ? `MEDIDAS DO PROTOCOLO (${protocolLabel})`
      : `DOBRAS CUTANEAS (${protocolLabel})`;
  const protocolRows =
    current.protocolo === 'navy'
      ? [
          buildRow('Pescoco (cm)', asNumber(previous.pescoco), asNumber(current.pescoco), ' cm'),
          buildRow('Cintura (cm)', asNumber(previous.cintura), asNumber(current.cintura), ' cm'),
          buildRow('Quadril (cm)', asNumber(previous.quadril), asNumber(current.quadril), ' cm'),
          buildRow('Altura', asNumber(previous.altura), asNumber(current.altura)),
        ]
      : [
          buildRow('Tricipital (mm)', asNumber(previous.tricipital), asNumber(current.tricipital), ' mm'),
          buildRow('Subescapular (mm)', asNumber(previous.subescapular), asNumber(current.subescapular), ' mm'),
          buildRow('Supra-iliaca (mm)', asNumber(previous.supra_iliaca), asNumber(current.supra_iliaca), ' mm'),
          buildRow('Abdominal (mm)', asNumber(previous.abdominal), asNumber(current.abdominal), ' mm'),
          buildRow('Soma Total', calculateSkinfoldSum(previous), calculateSkinfoldSum(current), ' mm'),
        ];
  drawGridTable(
    renderTable,
    doc,
    protocolTableTitle,
    38,
    dateA,
    dateB,
    protocolRows,
  );

  doc.addPage();
  drawHeader(doc);
  drawSectionTitle(doc, 'GRAFICOS COMPARATIVOS', 38);
  drawGroupedBarChart(
    doc,
    14,
    48,
    88,
    74,
    'Peso x Massa Magra',
    [
      { label: dateA, values: [asNumber(previous.peso), asNumber(previous.massa_magra)] },
      { label: dateB, values: [asNumber(current.peso), asNumber(current.massa_magra)] },
    ],
    [
      { label: 'Peso', color: [59, 130, 246] },
      { label: 'Massa Magra', color: [34, 197, 94] },
    ],
  );
  drawGroupedBarChart(
    doc,
    108,
    48,
    88,
    74,
    'Percentual de Gordura',
    [
      { label: dateA, values: [asNumber(previous.percentual_gordura)] },
      { label: dateB, values: [asNumber(current.percentual_gordura)] },
    ],
    [{ label: '% Gordura', color: [220, 38, 38] }],
  );
  drawGroupedBarChart(
    doc,
    14,
    132,
    88,
    74,
    'Relacao Cintura-Quadril',
    [
      { label: dateA, values: [calcularRcq(previous.cintura, previous.quadril) ?? null] },
      { label: dateB, values: [calcularRcq(current.cintura, current.quadril) ?? null] },
    ],
    [{ label: 'RCQ', color: [245, 158, 11] }],
  );
  drawGroupedBarChart(
    doc,
    108,
    132,
    88,
    74,
    'Cintura x Quadril',
    [
      { label: 'Cintura', values: [asNumber(previous.cintura), asNumber(current.cintura)] },
      { label: 'Quadril', values: [asNumber(previous.quadril), asNumber(current.quadril)] },
    ],
    [
      { label: dateA, color: [37, 99, 235] },
      { label: dateB, color: [239, 68, 68] },
    ],
  );

  doc.addPage();
  drawHeader(doc);
  drawSectionTitle(doc, 'ANALISE DA EVOLUCAO', 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(28, 28, 28);
  doc.text(buildAnalysis(previous, current), 14, 52, { maxWidth: 182, lineHeightFactor: 1.5 });

  drawSectionTitle(doc, 'RECOMENDACOES', 96);
  const recommendations = buildRecommendations(previous, current);
  let bulletY = 110;
  recommendations.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`- ${item}`, 14, bulletY, { maxWidth: 182, lineHeightFactor: 1.5 });
    bulletY += 14;
  });

  if (current.observacoes) {
    drawSectionTitle(doc, 'OBSERVACOES DA AVALIACAO ATUAL', Math.max(184, bulletY + 8));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(current.observacoes, 14, Math.max(198, bulletY + 22), {
      maxWidth: 182,
      lineHeightFactor: 1.45,
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `Documento gerado em ${formatDateTimePtBr(reportDate)}.`,
    105,
    286,
    { align: 'center' },
  );

  const studentName = safeFileName(current.students?.nome || previous.students?.nome || 'aluno');
  const fileName = `Evolucao_${studentName}_${dateA.replace(/\//g, '-')}_${dateB.replace(/\//g, '-')}.pdf`;
  await savePdfDocument(doc, fileName);
}
