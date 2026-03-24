#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Gerador de Comprovantes

Este módulo é responsável por gerar comprovantes de pagamento em PDF
para os pagamentos realizados pelos alunos.
"""

import os
from datetime import datetime
from typing import Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import sys

# Adicionar o diretório pai ao path para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.aluno import Aluno
from models.pagamento import Pagamento

class ComprovanteGenerator:
    """
    Classe responsável por gerar comprovantes de pagamento em PDF.
    
    Os comprovantes são gerados com todas as informações do pagamento
    e dados do aluno para controle financeiro.
    """
    
    def __init__(self):
        """Inicializa o gerador de comprovantes."""
        self.styles = getSampleStyleSheet()
        self._criar_estilos_personalizados()
    
    def _criar_estilos_personalizados(self):
        """Cria estilos personalizados para o comprovante."""
        # Estilo para título principal
        self.styles.add(ParagraphStyle(
            name='TituloComprovante',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#FFA500'),
            alignment=TA_CENTER,
            spaceAfter=20
        ))
        
        # Estilo para subtítulo
        self.styles.add(ParagraphStyle(
            name='SubtituloComprovante',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=15
        ))
        
        # Estilo para informações importantes
        self.styles.add(ParagraphStyle(
            name='InfoImportante',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#FF6B6B'),
            alignment=TA_CENTER,
            spaceAfter=10,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para dados do comprovante
        self.styles.add(ParagraphStyle(
            name='DadosComprovante',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.black,
            alignment=TA_LEFT,
            spaceAfter=5
        ))
    
    def gerar_comprovante(self, 
                         aluno: Aluno, 
                         pagamento: Pagamento, 
                         caminho_arquivo: str) -> bool:
        """
        Gera um comprovante de pagamento em PDF.
        
        Args:
            aluno: Dados do aluno
            pagamento: Dados do pagamento
            caminho_arquivo: Caminho onde salvar o PDF
            
        Returns:
            True se o comprovante foi gerado com sucesso
        """
        try:
            # Criar o documento PDF
            doc = SimpleDocTemplate(
                caminho_arquivo,
                pagesize=A4,
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2*cm,
                bottomMargin=2*cm
            )
            
            # Conteúdo do comprovante
            story = []
            
            # Cabeçalho
            self._adicionar_cabecalho(story)
            
            # Informações do pagamento
            self._adicionar_info_pagamento(story, aluno, pagamento)
            
            # Dados detalhados
            self._adicionar_dados_detalhados(story, aluno, pagamento)
            
            # Assinatura e observações
            self._adicionar_assinatura(story)
            
            # Rodapé
            self._adicionar_rodape(story)
            
            # Gerar o PDF
            doc.build(story)
            return True
            
        except Exception as e:
            print(f"Erro ao gerar comprovante: {e}")
            return False
    
    def _adicionar_cabecalho(self, story):
        """Adiciona o cabeçalho do comprovante."""
        # Logo e título
        titulo = Paragraph("🦁 LIONESS PERSONAL ESTÚDIO", self.styles['TituloComprovante'])
        story.append(titulo)
        
        # Subtítulo
        subtitulo = Paragraph("COMPROVANTE DE PAGAMENTO", self.styles['SubtituloComprovante'])
        story.append(subtitulo)
        
        # Linha separadora
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#FFA500')))
        story.append(Spacer(1, 20))
        
        # Informações da empresa
        info_empresa = """
        <b>Lioness Personal Estúdio</b><br/>
        CNPJ: 12.345.678/0001-90<br/>
        Endereço: Rua dos Exercícios, 123 - Centro<br/>
        São Paulo - SP - CEP: 01234-567<br/>
        Telefone: (11) 99999-9999 | Email: contato@lionesspe.com.br
        """
        
        para_empresa = Paragraph(info_empresa, self.styles['DadosComprovante'])
        story.append(para_empresa)
        story.append(Spacer(1, 20))
    
    def _adicionar_info_pagamento(self, story, aluno: Aluno, pagamento: Pagamento):
        """Adiciona as informações principais do pagamento."""
        # Status do pagamento
        if pagamento.status == 'pago':
            status_texto = "✅ PAGAMENTO CONFIRMADO"
            cor_status = colors.HexColor('#00AA00')
        else:
            status_texto = f"⚠️ STATUS: {pagamento.status_formatado.upper()}"
            cor_status = colors.HexColor('#FF6B6B')
        
        # Criar estilo para status
        estilo_status = ParagraphStyle(
            name='StatusPagamento',
            parent=self.styles['Normal'],
            fontSize=14,
            textColor=cor_status,
            alignment=TA_CENTER,
            spaceAfter=15,
            fontName='Helvetica-Bold'
        )
        
        para_status = Paragraph(status_texto, estilo_status)
        story.append(para_status)
        
        # Informações principais em tabela
        dados_principais = [
            ['Número do Comprovante:', pagamento.numero_boleto],
            ['Data do Pagamento:', pagamento.data_pagamento.strftime('%d/%m/%Y')],
            ['Valor Pago:', pagamento.valor_formatado],
            ['Método de Pagamento:', pagamento.metodo_pagamento],
            ['Cliente:', aluno.nome]
        ]
        
        tabela_principais = Table(dados_principais, colWidths=[4.5*cm, 7.5*cm])
        tabela_principais.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0F0F0')),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')])
        ]))
        
        story.append(tabela_principais)
        story.append(Spacer(1, 25))
    
    def _adicionar_dados_detalhados(self, story, aluno: Aluno, pagamento: Pagamento):
        """Adiciona dados detalhados do cliente e pagamento."""
        # Título da seção
        titulo_detalhes = Paragraph("<b>DADOS DETALHADOS</b>", self.styles['Heading3'])
        story.append(titulo_detalhes)
        story.append(Spacer(1, 10))
        
        # Dados do cliente
        dados_cliente = [
            ['DADOS DO CLIENTE'],
            ['Nome Completo:', aluno.nome],
            ['CPF:', aluno.cpf or 'Não informado'],
            ['Telefone:', aluno.telefone or 'Não informado'],
            ['Email:', aluno.email or 'Não informado'],
            ['Endereço:', aluno.endereco or 'Não informado'],
            ['Cidade:', f"{aluno.cidade} - CEP: {aluno.cep}" if aluno.cidade else 'Não informado']
        ]
        
        tabela_cliente = Table(dados_cliente, colWidths=[3.5*cm, 8.5*cm])
        tabela_cliente.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (1, 0), 10),
            ('SPAN', (0, 0), (1, 0)),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#FFA500'))
        ]))
        
        story.append(tabela_cliente)
        story.append(Spacer(1, 15))
        
        # Dados do pagamento
        dados_pagamento = [
            ['DETALHES DO PAGAMENTO'],
            ['ID do Pagamento:', str(pagamento.id) if pagamento.id else 'Novo'],
            ['Data de Criação:', pagamento.data_criacao.strftime('%d/%m/%Y às %H:%M')],
            ['Status:', pagamento.status_formatado],
            ['Observações:', pagamento.observacoes or 'Nenhuma observação']
        ]
        
        if pagamento.data_vencimento:
            dados_pagamento.insert(-1, ['Data de Vencimento:', pagamento.data_vencimento.strftime('%d/%m/%Y')])
        
        tabela_pagamento = Table(dados_pagamento, colWidths=[3.5*cm, 8.5*cm])
        tabela_pagamento.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (1, 0), 10),
            ('SPAN', (0, 0), (1, 0)),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#FFA500'))
        ]))
        
        story.append(tabela_pagamento)
        story.append(Spacer(1, 30))
    
    def _adicionar_assinatura(self, story):
        """Adiciona área de assinatura."""
        # Linha para assinatura
        story.append(Spacer(1, 20))
        
        assinatura_data = [
            ['Data: ___/___/______', 'Assinatura do Responsável: _________________________']
        ]
        
        tabela_assinatura = Table(assinatura_data, colWidths=[6*cm, 6*cm])
        tabela_assinatura.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 20)
        ]))
        
        story.append(tabela_assinatura)
        story.append(Spacer(1, 20))
    
    def _adicionar_rodape(self, story):
        """Adiciona o rodapé do comprovante."""
        # Observações importantes
        observacoes = """
        <b>OBSERVAÇÕES IMPORTANTES:</b><br/>
        • Este comprovante é válido como prova de pagamento<br/>
        • Guarde este documento para seus registros<br/>
        • Em caso de dúvidas, entre em contato conosco<br/>
        • Pagamentos em atraso podem gerar multa e juros<br/>
        • Para cancelamentos, consulte nosso regulamento
        """
        
        para_observacoes = Paragraph(observacoes, self.styles['DadosComprovante'])
        story.append(para_observacoes)
        story.append(Spacer(1, 20))
        
        # Linha separadora
        story.append(HRFlowable(width="100%", thickness=1, color=colors.gray))
        story.append(Spacer(1, 10))
        
        # Informações do sistema
        info_sistema = f"""
        Documento gerado automaticamente pelo Sistema LPE v1.0<br/>
        Data/Hora: {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}<br/>
        © 2024 Lioness Personal Estúdio - Todos os direitos reservados
        """
        
        estilo_rodape = ParagraphStyle(
            name='RodapeComprovante',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.gray,
            alignment=TA_CENTER
        )
        
        para_rodape = Paragraph(info_sistema, estilo_rodape)
        story.append(para_rodape)


# Instância global do gerador de comprovantes
comprovante_generator = ComprovanteGenerator()

