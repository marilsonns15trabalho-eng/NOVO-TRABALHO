#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Gerador de Boletos

Este módulo é responsável por gerar boletos fictícios em PDF
para os pagamentos dos alunos.
"""

import os
from datetime import datetime, date, timedelta
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

class BoletoGenerator:
    """
    Classe responsável por gerar boletos bancários fictícios em PDF.
    
    Os boletos são gerados com todas as informações necessárias
    e formatação similar aos boletos bancários reais.
    """
    
    def __init__(self):
        """Inicializa o gerador de boletos."""
        self.styles = getSampleStyleSheet()
        self._criar_estilos_personalizados()
    
    def _criar_estilos_personalizados(self):
        """Cria estilos personalizados para o boleto."""
        # Estilo para título principal
        self.styles.add(ParagraphStyle(
            name='TituloBoleto',
            parent=self.styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#FFA500'),
            alignment=TA_CENTER,
            spaceAfter=20
        ))
        
        # Estilo para informações do banco
        self.styles.add(ParagraphStyle(
            name='InfoBanco',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.black,
            alignment=TA_LEFT,
            spaceAfter=10
        ))
        
        # Estilo para código de barras (simulado)
        self.styles.add(ParagraphStyle(
            name='CodigoBarras',
            parent=self.styles['Normal'],
            fontSize=10,
            fontName='Courier',
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=10
        ))
        
        # Estilo para instruções
        self.styles.add(ParagraphStyle(
            name='Instrucoes',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,
            spaceAfter=5
        ))
    
    def gerar_boleto(self, 
                    aluno: Aluno, 
                    pagamento: Pagamento, 
                    caminho_arquivo: str) -> bool:
        """
        Gera um boleto em PDF para o pagamento especificado.
        
        Args:
            aluno: Dados do aluno
            pagamento: Dados do pagamento
            caminho_arquivo: Caminho onde salvar o PDF
            
        Returns:
            True se o boleto foi gerado com sucesso
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
            
            # Conteúdo do boleto
            story = []
            
            # Cabeçalho
            self._adicionar_cabecalho(story, aluno, pagamento)
            
            # Linha separadora
            story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#FFA500')))
            story.append(Spacer(1, 10))
            
            # Informações do banco (fictício)
            self._adicionar_info_banco(story, pagamento)
            
            # Dados do pagador e beneficiário
            self._adicionar_dados_pagamento(story, aluno, pagamento)
            
            # Código de barras simulado
            self._adicionar_codigo_barras(story, pagamento)
            
            # Instruções
            self._adicionar_instrucoes(story)
            
            # Gerar o PDF
            doc.build(story)
            return True
            
        except Exception as e:
            print(f"Erro ao gerar boleto: {e}")
            return False
    
    def _adicionar_cabecalho(self, story, aluno: Aluno, pagamento: Pagamento):
        """Adiciona o cabeçalho do boleto."""
        # Título principal
        titulo = Paragraph("🦁 LIONESS PERSONAL ESTÚDIO", self.styles['TituloBoleto'])
        story.append(titulo)
        
        # Subtítulo
        subtitulo = Paragraph("BOLETO DE COBRANÇA", self.styles['Heading2'])
        story.append(subtitulo)
        story.append(Spacer(1, 20))
        
        # Informações básicas em tabela
        data_vencimento = pagamento.data_vencimento or (pagamento.data_pagamento + timedelta(days=30))
        
        dados_basicos = [
            ['Número do Documento:', pagamento.numero_boleto],
            ['Data de Vencimento:', data_vencimento.strftime('%d/%m/%Y')],
            ['Valor do Documento:', pagamento.valor_formatado],
            ['Pagador:', aluno.nome]
        ]
        
        tabela_basicos = Table(dados_basicos, colWidths=[4*cm, 8*cm])
        tabela_basicos.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0F0F0'))
        ]))
        
        story.append(tabela_basicos)
        story.append(Spacer(1, 20))
    
    def _adicionar_info_banco(self, story, pagamento: Pagamento):
        """Adiciona informações do banco fictício."""
        info_banco = """
        <b>BANCO FICTÍCIO LIONESS - 999</b><br/>
        Agência: 1234-5 | Conta Corrente: 98765-4<br/>
        CNPJ: 12.345.678/0001-90
        """
        
        para_banco = Paragraph(info_banco, self.styles['InfoBanco'])
        story.append(para_banco)
        story.append(Spacer(1, 15))
    
    def _adicionar_dados_pagamento(self, story, aluno: Aluno, pagamento: Pagamento):
        """Adiciona os dados detalhados do pagamento."""
        # Dados do beneficiário
        dados_beneficiario = [
            ['BENEFICIÁRIO'],
            ['Nome:', 'Lioness Personal Estúdio'],
            ['CNPJ:', '12.345.678/0001-90'],
            ['Endereço:', 'Rua dos Exercícios, 123 - Centro'],
            ['Cidade:', 'São Paulo - SP - CEP: 01234-567']
        ]
        
        tabela_beneficiario = Table(dados_beneficiario, colWidths=[3*cm, 9*cm])
        tabela_beneficiario.setStyle(TableStyle([
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
        
        story.append(tabela_beneficiario)
        story.append(Spacer(1, 10))
        
        # Dados do pagador
        dados_pagador = [
            ['PAGADOR'],
            ['Nome:', aluno.nome],
            ['CPF:', aluno.cpf or 'Não informado'],
            ['Telefone:', aluno.telefone or 'Não informado'],
            ['Endereço:', aluno.endereco or 'Não informado'],
            ['Cidade:', f"{aluno.cidade} - CEP: {aluno.cep}" if aluno.cidade else 'Não informado']
        ]
        
        tabela_pagador = Table(dados_pagador, colWidths=[3*cm, 9*cm])
        tabela_pagador.setStyle(TableStyle([
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
        
        story.append(tabela_pagador)
        story.append(Spacer(1, 20))
    
    def _adicionar_codigo_barras(self, story, pagamento: Pagamento):
        """Adiciona um código de barras simulado."""
        # Gerar código de barras fictício
        codigo_barras = f"99990000000{pagamento.numero_boleto[-10:]}123456789012345678901234567890"
        
        # Título
        titulo_codigo = Paragraph("<b>Código de Barras:</b>", self.styles['Normal'])
        story.append(titulo_codigo)
        
        # Código (simulado com caracteres)
        codigo_visual = "||||| || ||| | |||| || | ||| |||| | || ||| | |||| || ||| | |||| |||||"
        para_codigo = Paragraph(codigo_visual, self.styles['CodigoBarras'])
        story.append(para_codigo)
        
        # Números do código
        para_numeros = Paragraph(codigo_barras, self.styles['CodigoBarras'])
        story.append(para_numeros)
        story.append(Spacer(1, 20))
    
    def _adicionar_instrucoes(self, story):
        """Adiciona as instruções do boleto."""
        instrucoes_texto = """
        <b>INSTRUÇÕES:</b><br/>
        • Este é um boleto fictício gerado pelo sistema LPE<br/>
        • Não efetuar pagamento em banco real<br/>
        • Para pagamentos reais, procure a administração do estúdio<br/>
        • Pagamento pode ser realizado em dinheiro, PIX ou cartão<br/>
        • Em caso de dúvidas, entre em contato conosco<br/>
        • Mantenha este comprovante para seus registros<br/><br/>
        
        <b>CONTATO:</b><br/>
        📞 Telefone: (11) 99999-9999<br/>
        📧 Email: contato@lionesspe.com.br<br/>
        🌐 Site: www.lionesspe.com.br
        """
        
        para_instrucoes = Paragraph(instrucoes_texto, self.styles['Instrucoes'])
        story.append(para_instrucoes)
        
        # Rodapé
        story.append(Spacer(1, 30))
        rodape = Paragraph(
            f"Documento gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')} - Sistema LPE v1.0",
            self.styles['Normal']
        )
        story.append(rodape)


# Instância global do gerador de boletos
boleto_generator = BoletoGenerator()

