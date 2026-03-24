#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Módulo de Impressão

Este módulo contém funções para formatar e gerar saídas de impressão
para treinos atribuídos, otimizadas para impressoras térmicas de 58mm ou 80mm,
em formato de texto ou PDF.
"""

from datetime import datetime
from models.treino import Treino
from models.aluno import Aluno
import textwrap
import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

class Impressao:
    """
    Classe responsável por formatar e gerar saídas de impressão para treinos.
    """
    
    @staticmethod
    def formatar_treino_para_impressao(aluno: Aluno, treino: Treino, largura: int = 48) -> str:
        """
        Formata o treino para impressão em impressora térmica (texto puro).
        
        Args:
            aluno: Objeto Aluno com os dados do aluno
            treino: Objeto Treino com os dados do treino
            largura: Largura máxima da linha (em caracteres, padrão 48 para 80mm)
        
        Returns:
            String formatada para impressão
        """
        # Centralizar texto e criar linhas de separação
        def centralizar(texto, largura):
            return texto.center(largura, ' ')
        
        # Envolver texto para respeitar a largura
        def envolver_texto(texto, largura):
            return '\n'.join(textwrap.wrap(texto, largura))
        
        # Linha de separação
        linha_separacao = '-' * largura
        
        # Cabeçalho
        output = []
        output.append(centralizar("Lioness Personal Estúdio", largura))
        output.append(linha_separacao)
        output.append(f"ALUNO: {envolver_texto(aluno.nome, largura - 7)}")
        output.append(f"DATA: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        output.append(linha_separacao)
        
        # Informações do treino
        output.append(f"TREINO: {envolver_texto(treino.nome, largura - 8)}")
        output.append(f"OBJETIVO: {envolver_texto(treino.objetivo or '-', largura - 10)}")
        output.append(f"NÍVEL: {treino.nivel}")
        output.append(f"DURAÇÃO: {treino.duracao_formatada}")
        output.append(linha_separacao)
        
        # Exercícios
        output.append("EXERCÍCIOS:")
        for i, exercicio in enumerate(treino.exercicios, 1):
            # Formatar exercício
            exercicio_texto = f"{exercicio['nome']} - {exercicio['series']}x{exercicio['repeticoes']}"
            if exercicio['carga']:
                exercicio_texto += f", {exercicio['carga']}"
            output.append(f"{i}. {envolver_texto(exercicio_texto, largura - 4)}")
            if exercicio['descanso']:
                output.append(f"   Descanso: {exercicio['descanso']}")
            if exercicio['observacoes']:
                output.append(f"   Obs: {envolver_texto(exercicio['observacoes'], largura - 8)}")
        
        output.append(linha_separacao)
        output.append("Instruções: Realizar com intervalo indicado entre as séries.")
        output.append(centralizar("Boa sorte no treino!", largura))
        output.append(linha_separacao)
        
        return '\n'.join(output)
    
    @staticmethod
    def gerar_pdf(aluno: Aluno, treino: Treino, largura_impressora: str = "80mm") -> str:
        """
        Gera um arquivo PDF com o treino formatado para impressora térmica.
        
        Args:
            aluno: Objeto Aluno
            treino: Objeto Treino
            largura_impressora: "58mm" ou "80mm" para definir o tamanho da página
        
        Returns:
            Caminho do arquivo PDF gerado
        """
        # Configurações da página
        largura_pagina = 58 * mm if largura_impressora == "58mm" else 80 * mm
        altura_pagina = 200 * mm  # Altura suficiente para o conteúdo
        margem = 5 * mm
        fonte_tamanho = 8  # Reduzido de 10 para 8
        espacamento_linha = 10  # Reduzido de 12 para 10
        
        # Criar diretório de impressões, se não existir
        diretorio = "impressoes"
        os.makedirs(diretorio, exist_ok=True)
        
        # Nome do arquivo com timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nome_arquivo = f"treino_{aluno.id}_{treino.id}_{timestamp}.pdf"
        caminho_arquivo = os.path.join(diretorio, nome_arquivo)
        
        # Criar o PDF
        c = canvas.Canvas(caminho_arquivo, pagesize=(largura_pagina, altura_pagina))
        
        # Registrar fonte monoespaçada (Courier para compatibilidade)
        pdfmetrics.registerFont(TTFont('Courier', 'cour.ttf'))  # Ajustado para Windows
        c.setFont("Courier", fonte_tamanho)
        
        # Calcular largura máxima para texto (em pontos)
        largura_texto = largura_pagina - 2 * margem
        largura_caracteres = int(largura_texto / (fonte_tamanho * 0.6))  # Aproximar caracteres por linha
        
        # Função para envolver texto
        def envolver_texto(texto, largura):
            return textwrap.wrap(texto, largura)
        
        # Posição inicial
        y = altura_pagina - margem - espacamento_linha
        
        # Cabeçalho
        c.drawCentredString(largura_pagina / 2, y, "Lioness Personal Estúdio")
        y -= espacamento_linha
        c.drawString(margem, y, "-" * largura_caracteres)
        y -= espacamento_linha
        for linha in envolver_texto(f"ALUNO: {aluno.nome}", largura_caracteres - 7):
            c.drawString(margem, y, linha)
            y -= espacamento_linha
        c.drawString(margem, y, f"DATA: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        y -= espacamento_linha
        c.drawString(margem, y, "-" * largura_caracteres)
        y -= espacamento_linha
        
        # Informações do treino
        for linha in envolver_texto(f"TREINO: {treino.nome}", largura_caracteres - 8):
            c.drawString(margem, y, linha)
            y -= espacamento_linha
        for linha in envolver_texto(f"OBJETIVO: {treino.objetivo or '-'}", largura_caracteres - 10):
            c.drawString(margem, y, linha)
            y -= espacamento_linha
        c.drawString(margem, y, f"NÍVEL: {treino.nivel}")
        y -= espacamento_linha
        c.drawString(margem, y, f"DURAÇÃO: {treino.duracao_formatada}")
        y -= espacamento_linha
        c.drawString(margem, y, "-" * largura_caracteres)
        y -= espacamento_linha
        
        # Exercícios
        c.drawString(margem, y, "EXERCÍCIOS:")
        y -= espacamento_linha
        for i, exercicio in enumerate(treino.exercicios, 1):
            exercicio_texto = f"{exercicio['nome']} - {exercicio['series']}x{exercicio['repeticoes']}"
            if exercicio['carga']:
                exercicio_texto += f", {exercicio['carga']}"
            for linha in envolver_texto(f"{i}. {exercicio_texto}", largura_caracteres - 4):
                c.drawString(margem, y, linha)
                y -= espacamento_linha
            if exercicio['descanso']:
                c.drawString(margem + 10, y, f"Descanso: {exercicio['descanso']}")
                y -= espacamento_linha
            if exercicio['observacoes']:
                for linha in envolver_texto(f"Obs: {exercicio['observacoes']}", largura_caracteres - 8):
                    c.drawString(margem + 10, y, linha)
                    y -= espacamento_linha
        
        c.drawString(margem, y, "-" * largura_caracteres)
        y -= espacamento_linha
        for linha in envolver_texto("Instruções: Realizar com intervalo indicado entre as séries.", largura_caracteres):
            c.drawString(margem, y, linha)
            y -= espacamento_linha
        c.drawCentredString(largura_pagina / 2, y, "Boa sorte no treino!")
        y -= espacamento_linha
        c.drawString(margem, y, "-" * largura_caracteres)
        
        # Finalizar e salvar o PDF
        c.showPage()
        c.save()
        
        return caminho_arquivo
    
    @staticmethod
    def salvar_para_impressao(aluno: Aluno, treino: Treino, formato: str = "txt", largura_impressora: str = "80mm") -> str:
        """
        Salva o treino formatado em um arquivo de texto ou PDF.
        
        Args:
            aluno: Objeto Aluno
            treino: Objeto Treino
            formato: 'txt' para texto puro ou 'pdf' para PDF
            largura_impressora: '58mm' ou '80mm' para definir o tamanho
        
        Returns:
            Caminho do arquivo gerado
        """
        if formato == "pdf":
            return Impressao.gerar_pdf(aluno, treino, largura_impressora)
        
        # Para texto puro
        largura = 32 if largura_impressora == "58mm" else 48
        conteudo = Impressao.formatar_treino_para_impressao(aluno, treino, largura)
        
        # Criar diretório de impressões, se não existir
        diretorio = "impressoes"
        os.makedirs(diretorio, exist_ok=True)
        
        # Nome do arquivo com timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nome_arquivo = f"treino_{aluno.id}_{treino.id}_{timestamp}.txt"
        caminho_arquivo = os.path.join(diretorio, nome_arquivo)
        
        # Salvar arquivo
        with open(caminho_arquivo, 'w', encoding='utf-8') as f:
            f.write(conteudo)
        
        return caminho_arquivo