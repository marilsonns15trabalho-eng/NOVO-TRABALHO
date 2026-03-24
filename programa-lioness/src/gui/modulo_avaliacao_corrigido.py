#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Módulo de Avaliação Física

Este módulo contém a interface gráfica para avaliação física,
incluindo criação, edição e visualização de avaliações completas.
"""

import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime, date
import sys
import os
import re

# Adicionar o diretório pai ao path para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.avaliacao_fisica import AvaliacaoFisica
from models.aluno import Aluno
from data.avaliacao_dao import avaliacao_dao
from data.aluno_dao import aluno_dao

class ModuloAvaliacao:
    """
    Classe responsável pela interface de avaliação física.
    
    Contém todas as funcionalidades para criar, editar e gerenciar
    avaliações físicas completas dos alunos.
    """
    
    def __init__(self, parent_frame):
        """
        Inicializa o módulo de avaliação.
        
        Args:
            parent_frame: Frame pai onde será inserida a interface
        """
        self.parent_frame = parent_frame
        self.avaliacao_selecionada = None
        self.criar_interface()
    
    def criar_interface(self):
        """Cria a interface principal do módulo de avaliação."""
        for widget in self.parent_frame.winfo_children():
            widget.destroy()
        
        self.main_frame = tk.Frame(self.parent_frame, bg='#FFFFFF')
        self.main_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        titulo = tk.Label(self.main_frame,
                         text="Avaliação Física",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 18, 'bold'))
        titulo.pack(pady=(0, 20))
        
        self.notebook = ttk.Notebook(self.main_frame)
        self.notebook.pack(fill='both', expand=True)
        
        self.criar_aba_avaliacoes()
        self.criar_aba_nova_avaliacao()
        
        self.carregar_lista_avaliacoes()
    
    def criar_aba_avaliacoes(self):
        """Cria a aba de listagem de avaliações."""
        self.frame_avaliacoes = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_avaliacoes, text="📊 Avaliações")
        
        frame_acoes = tk.Frame(self.frame_avaliacoes, bg='#FFFFFF')
        frame_acoes.pack(fill='x', pady=(10, 20), padx=10)
        
        btn_nova = tk.Button(frame_acoes,
                            text="➕ Nova Avaliação",
                            bg='#FFA500',
                            fg='#000000',
                            font=('Arial', 10, 'bold'),
                            command=self.abrir_nova_avaliacao,
                            relief='flat',
                            padx=15,
                            pady=8)
        btn_nova.pack(side='left', padx=(0, 10))
        
        self.btn_visualizar = tk.Button(frame_acoes,
                                       text="👁️ Visualizar",
                                       bg='#3498DB',
                                       fg='#FFFFFF',
                                       font=('Arial', 10, 'bold'),
                                       command=self.visualizar_avaliacao_selecionada,
                                       relief='flat',
                                       padx=15,
                                       pady=8,
                                       state='disabled')
        self.btn_visualizar.pack(side='left', padx=(0, 10))

        # 📄 Botão Exportar Avaliação
        self.btn_exportar = tk.Button(frame_acoes,
                                      text="📄 Exportar Avaliação",
                                      bg='#27AE60',
                                      fg='#FFFFFF',
                                      font=('Arial', 10, 'bold'),
                                      command=self.exportar_avaliacao_selecionada,
                                      relief='flat',
                                      padx=15,
                                      pady=8,
                                      state='disabled')
        self.btn_exportar.pack(side='left', padx=(0, 10))

        
        self.btn_evolucao = tk.Button(frame_acoes,
                                     text="📈 Evolução",
                                     bg='#9B59B6',
                                     fg='#FFFFFF',
                                     font=('Arial', 10, 'bold'),
                                     command=self.mostrar_evolucao,
                                     relief='flat',
                                     padx=15,
                                     pady=8,
                                     state='disabled')
        self.btn_evolucao.pack(side='left', padx=(0, 10))
        
        self.btn_editar = tk.Button(frame_acoes,
                                   text="✏️ Editar",
                                   bg='#333333',
                                   fg='#FFFFFF',
                                   font=('Arial', 10, 'bold'),
                                   command=self.editar_avaliacao_selecionada,
                                   relief='flat',
                                   padx=15,
                                   pady=8,
                                   state='disabled')
        self.btn_editar.pack(side='left', padx=(0, 10))
        
        self.btn_excluir = tk.Button(frame_acoes,
                                    text="🗑️ Excluir",
                                    bg='#FF6B6B',
                                    fg='#FFFFFF',
                                    font=('Arial', 10, 'bold'),
                                    command=self.excluir_avaliacao_selecionada,
                                    relief='flat',
                                    padx=15,
                                    pady=8,
                                    state='disabled')
        self.btn_excluir.pack(side='left', padx=(0, 10))
        
        btn_atualizar = tk.Button(frame_acoes,
                                 text="🔄 Atualizar",
                                 bg='#95A5A6',
                                 fg='#FFFFFF',
                                 font=('Arial', 10, 'bold'),
                                 command=self.carregar_lista_avaliacoes,
                                 relief='flat',
                                 padx=15,
                                 pady=8)
        btn_atualizar.pack(side='right')
        
        frame_filtros = tk.Frame(self.frame_avaliacoes, bg='#FFFFFF')
        frame_filtros.pack(fill='x', pady=(0, 20), padx=10)
        
        tk.Label(frame_filtros,
                text="Filtrar por aluno:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).pack(side='left')
        
        self.combo_aluno_filtro = ttk.Combobox(frame_filtros,
                                              state='readonly',
                                              width=30)
        self.combo_aluno_filtro.pack(side='left', padx=(10, 10))
        self.combo_aluno_filtro.bind('<<ComboboxSelected>>', self.filtrar_por_aluno)
        
        btn_limpar_filtro = tk.Button(frame_filtros,
                                     text="Limpar",
                                     bg='#E8E8E8',
                                     fg='#333333',
                                     font=('Arial', 9),
                                     command=self.limpar_filtro,
                                     relief='flat',
                                     padx=10,
                                     pady=5)
        btn_limpar_filtro.pack(side='left')
        
        frame_lista = tk.Frame(self.frame_avaliacoes, bg='#FFFFFF')
        frame_lista.pack(fill='both', expand=True, padx=10, pady=(0, 10))
        
        self.criar_lista_avaliacoes(frame_lista)
        self.carregar_combo_alunos_filtro()
    
    def criar_lista_avaliacoes(self, frame):
        """Cria a treeview para exibir a lista de avaliações."""
        colunas = ('ID', 'Aluno', 'Data', 'Peso', 'IMC', '% Gordura', 'Pressão Arterial')
        self.tree_avaliacoes = ttk.Treeview(frame, columns=colunas, show='headings')
        
        self.tree_avaliacoes.heading('ID', text='ID')
        self.tree_avaliacoes.heading('Aluno', text='Aluno')
        self.tree_avaliacoes.heading('Data', text='Data')
        self.tree_avaliacoes.heading('Peso', text='Peso')
        self.tree_avaliacoes.heading('IMC', text='IMC')
        self.tree_avaliacoes.heading('% Gordura', text='% Gordura')
        self.tree_avaliacoes.heading('Pressão Arterial', text='Pressão Arterial')
        
        self.tree_avaliacoes.column('ID', width=50, anchor='center')
        self.tree_avaliacoes.column('Aluno', width=200, anchor='w')
        self.tree_avaliacoes.column('Data', width=100, anchor='center')
        self.tree_avaliacoes.column('Peso', width=80, anchor='center')
        self.tree_avaliacoes.column('IMC', width=80, anchor='center')
        self.tree_avaliacoes.column('% Gordura', width=80, anchor='center')
        self.tree_avaliacoes.column('Pressão Arterial', width=120, anchor='center')
        
        self.tree_avaliacoes.pack(fill='both', expand=True)
        self.tree_avaliacoes.bind('<<TreeviewSelect>>', self.selecionar_avaliacao)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(frame, orient='vertical', command=self.tree_avaliacoes.yview)
        scrollbar.pack(side='right', fill='y')
        self.tree_avaliacoes.configure(yscrollcommand=scrollbar.set)
    
    def criar_aba_nova_avaliacao(self):
        """Cria a aba para nova avaliação."""
        self.frame_nova_avaliacao = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_nova_avaliacao, text="➕ Nova Avaliação")
        
        # Frame principal com scroll
        canvas = tk.Canvas(self.frame_nova_avaliacao, bg='#FFFFFF')
        scrollbar = ttk.Scrollbar(self.frame_nova_avaliacao, orient='vertical', command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#FFFFFF')
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # Adicionar suporte ao scroll do mouse
        def on_mouse_wheel(event):
            if event.delta > 0:
                canvas.yview_scroll(-1, "units")  # Rolar para cima
            else:
                canvas.yview_scroll(1, "units")   # Rolar para baixo

        # Bindings para Windows e Linux
        canvas.bind("<MouseWheel>", on_mouse_wheel)  # Windows
        canvas.bind("<Button-4>", lambda e: canvas.yview_scroll(-1, "units"))  # Linux (scroll para cima)
        canvas.bind("<Button-5>", lambda e: canvas.yview_scroll(1, "units"))   # Linux (scroll para baixo)
        
        self.form_frame = scrollable_frame
        self.campos_avaliacao = {}
        
        # Seção Identificação
        frame_identificacao = tk.LabelFrame(self.form_frame,
                                          text="Identificação",
                                          bg='#FFFFFF',
                                          fg='#333333',
                                          font=('Arial', 12, 'bold'))
        frame_identificacao.pack(fill='x', padx=10, pady=10)
        
        tk.Label(frame_identificacao,
                text="Aluno:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=0, padx=5, pady=5, sticky='w')
        
        self.combo_aluno = ttk.Combobox(frame_identificacao,
                                       state='readonly',
                                       width=30)
        self.combo_aluno.grid(row=0, column=1, padx=5, pady=5, sticky='w')
        self.combo_aluno.bind('<<ComboboxSelected>>', self.atualizar_dados_aluno)
        self.carregar_combo_alunos()
        
        tk.Label(frame_identificacao,
                text="Nome:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=1, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['nome'] = tk.Entry(frame_identificacao, width=33, state='readonly')
        self.campos_avaliacao['nome'].grid(row=1, column=1, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_identificacao,
                text="Sexo:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=2, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['sexo'] = tk.Entry(frame_identificacao, width=33, state='readonly')
        self.campos_avaliacao['sexo'].grid(row=2, column=1, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_identificacao,
                text="Idade:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=3, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['idade'] = tk.Entry(frame_identificacao, width=33, state='readonly')
        self.campos_avaliacao['idade'].grid(row=3, column=1, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_identificacao,
                text="Data de Nascimento:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=4, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['data_nascimento'] = tk.Entry(frame_identificacao, width=33, state='readonly')
        self.campos_avaliacao['data_nascimento'].grid(row=4, column=1, padx=5, pady=5, sticky='w')
        
        # Seção Medidas Básicas
        frame_medidas_basicas = tk.LabelFrame(self.form_frame,
                                            text="Medidas Básicas",
                                            bg='#FFFFFF',
                                            fg='#333333',
                                            font=('Arial', 12, 'bold'))
        frame_medidas_basicas.pack(fill='x', padx=10, pady=10)
        
        # Primeira linha de medidas básicas
        tk.Label(frame_medidas_basicas,
                text="Altura (m):",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['altura'] = tk.Entry(frame_medidas_basicas, width=10)
        self.campos_avaliacao['altura'].grid(row=0, column=1, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['altura'].bind('<KeyRelease>', self.calcular_resultados)
        
        tk.Label(frame_medidas_basicas,
                text="Peso (kg):",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['peso'] = tk.Entry(frame_medidas_basicas, width=10)
        self.campos_avaliacao['peso'].grid(row=0, column=3, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['peso'].bind('<KeyRelease>', self.calcular_resultados)
        
        tk.Label(frame_medidas_basicas,
                text="IMC:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=4, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['imc'] = tk.Entry(frame_medidas_basicas, width=10, state='readonly')
        self.campos_avaliacao['imc'].grid(row=0, column=5, padx=5, pady=5, sticky='w')
        
        # Segunda linha de medidas básicas
        tk.Label(frame_medidas_basicas,
                text="Pressão Arterial:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=1, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['pressao_arterial'] = tk.Entry(frame_medidas_basicas, width=15)
        self.campos_avaliacao['pressao_arterial'].grid(row=1, column=1, columnspan=2, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_medidas_basicas,
                text="Frequência Cardíaca:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=1, column=3, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['frequencia_cardiaca'] = tk.Entry(frame_medidas_basicas, width=10)
        self.campos_avaliacao['frequencia_cardiaca'].grid(row=1, column=4, padx=5, pady=5, sticky='w')
        
        # Seção Medidas Perimétricas
        frame_perimetricas = tk.LabelFrame(self.form_frame,
                                         text="Medidas Perimétricas (cm)",
                                         bg='#FFFFFF',
                                         fg='#333333',
                                         font=('Arial', 12, 'bold'))
        frame_perimetricas.pack(fill='x', padx=10, pady=10)
        
        # Medidas únicas (não laterais)
        tk.Label(frame_perimetricas,
                text="Pescoço:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_pescoco'] = tk.Entry(frame_perimetricas, width=10)
        self.campos_avaliacao['circunferencia_pescoco'].grid(row=0, column=1, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_perimetricas,
                text="Ombro:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_ombro'] = tk.Entry(frame_perimetricas, width=10)
        self.campos_avaliacao['circunferencia_ombro'].grid(row=0, column=3, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_perimetricas,
                text="Tórax:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=4, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_peito'] = tk.Entry(frame_perimetricas, width=10)
        self.campos_avaliacao['circunferencia_peito'].grid(row=0, column=5, padx=5, pady=5, sticky='w')
        
        # Segunda linha de medidas únicas
        tk.Label(frame_perimetricas,
                text="Cintura:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=1, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_cintura'] = tk.Entry(frame_perimetricas, width=10)
        self.campos_avaliacao['circunferencia_cintura'].grid(row=1, column=1, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_cintura'].bind('<KeyRelease>', self.calcular_rcq)
        
        tk.Label(frame_perimetricas,
                text="Abdômen:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=1, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_abdomen'] = tk.Entry(frame_perimetricas, width=10)
        self.campos_avaliacao['circunferencia_abdomen'].grid(row=1, column=3, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_perimetricas,
                text="Quadril:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=1, column=4, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_quadril'] = tk.Entry(frame_perimetricas, width=10)
        self.campos_avaliacao['circunferencia_quadril'].grid(row=1, column=5, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_quadril'].bind('<KeyRelease>', self.calcular_rcq)
        
        # Medidas laterais (esquerdo e direito)
        tk.Label(frame_perimetricas,
                text="Braço Esquerdo:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=2, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_braco_esq'] = tk.Entry(frame_perimetricas, width=10)
        self.campos_avaliacao['circunferencia_braco_esq'].grid(row=2, column=1, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_perimetricas,
                text="Braço Direito:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=2, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_braco_dir'] = tk.Entry(frame_perimetricas, width=10)
        self.campos_avaliacao['circunferencia_braco_dir'].grid(row=2, column=3, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_perimetricas,
                text="RCQ:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=2, column=4, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['rcq'] = tk.Entry(frame_perimetricas, width=10, state='readonly')
        self.campos_avaliacao['rcq'].grid(row=2, column=5, padx=5, pady=5, sticky='w')
        
        # Terceira linha de medidas laterais
        tk.Label(frame_perimetricas,
                text="Coxa Esquerda:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=3, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_coxa_esq'] = tk.Entry(frame_perimetricas, width=10)
        self.campos_avaliacao['circunferencia_coxa_esq'].grid(row=3, column=1, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_perimetricas,
                text="Coxa Direita:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=3, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_coxa_dir'] = tk.Entry(frame_perimetricas, width=10)
        self.campos_avaliacao['circunferencia_coxa_dir'].grid(row=3, column=3, padx=5, pady=5, sticky='w')
        
        # Quarta linha de medidas laterais
        tk.Label(frame_perimetricas,
                text="Panturrilha Esquerda:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=4, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_panturrilha_esq'] = tk.Entry(frame_perimetricas, width=10)
        self.campos_avaliacao['circunferencia_panturrilha_esq'].grid(row=4, column=1, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_perimetricas,
                text="Panturrilha Direita:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=4, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['circunferencia_panturrilha_dir'] = tk.Entry(frame_perimetricas, width=10)
        self.campos_avaliacao['circunferencia_panturrilha_dir'].grid(row=4, column=3, padx=5, pady=5, sticky='w')
        
        # Seção Dobras Cutâneas
        frame_dobras = tk.LabelFrame(self.form_frame,
                                    text="Dobras Cutâneas (mm)",
                                    bg='#FFFFFF',
                                    fg='#333333',
                                    font=('Arial', 12, 'bold'))
        frame_dobras.pack(fill='x', padx=10, pady=10)
        
        # Primeira linha de dobras
        tk.Label(frame_dobras,
                text="Tricipital:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_triceps'] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao['dobra_triceps'].grid(row=0, column=1, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_triceps'].bind('<KeyRelease>', self.calcular_dobras)
        
        tk.Label(frame_dobras,
                text="Subescapular:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_subescapular'] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao['dobra_subescapular'].grid(row=0, column=3, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_subescapular'].bind('<KeyRelease>', self.calcular_dobras)
        
        tk.Label(frame_dobras,
                text="Supra-ilíaca:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=4, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_suprailiaca'] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao['dobra_suprailiaca'].grid(row=0, column=5, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_suprailiaca'].bind('<KeyRelease>', self.calcular_dobras)
        
        # Segunda linha de dobras
        tk.Label(frame_dobras,
                text="Abdominal:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=1, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_abdominal'] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao['dobra_abdominal'].grid(row=1, column=1, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_abdominal'].bind('<KeyRelease>', self.calcular_dobras)
        
        tk.Label(frame_dobras,
                text="Peitoral:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=1, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_peitoral'] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao['dobra_peitoral'].grid(row=1, column=3, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_peitoral'].bind('<KeyRelease>', self.calcular_dobras)
        
        tk.Label(frame_dobras,
                text="Axilar Média:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=1, column=4, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_axilar_media'] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao['dobra_axilar_media'].grid(row=1, column=5, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_axilar_media'].bind('<KeyRelease>', self.calcular_dobras)
        
        # Terceira linha de dobras
        tk.Label(frame_dobras,
                text="Coxa:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=2, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_coxa'] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao['dobra_coxa'].grid(row=2, column=1, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['dobra_coxa'].bind('<KeyRelease>', self.calcular_dobras)
        
        tk.Label(frame_dobras,
                text="Soma das Dobras:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=2, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['soma_dobras'] = tk.Entry(frame_dobras, width=10, state='readonly')
        self.campos_avaliacao['soma_dobras'].grid(row=2, column=3, padx=5, pady=5, sticky='w')
        
        # Seção Protocolo e Resultados
        frame_protocolo = tk.LabelFrame(self.form_frame,
                                       text="Protocolo e Resultados Calculados",
                                       bg='#FFFFFF',
                                       fg='#333333',
                                       font=('Arial', 12, 'bold'))
        frame_protocolo.pack(fill='x', padx=10, pady=10)
        
        tk.Label(frame_protocolo,
                text="Protocolo:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=0, padx=5, pady=5, sticky='w')
        self.combo_protocolo = ttk.Combobox(frame_protocolo,
                                          values=["Pollock", "Faulkner", "Guedes"],
                                          state='readonly',
                                          width=15)
        self.combo_protocolo.grid(row=0, column=1, padx=5, pady=5, sticky='w')
        self.combo_protocolo.bind('<<ComboboxSelected>>', self.calcular_resultados)
        
        tk.Label(frame_protocolo,
                text="% Gordura:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['percentual_gordura'] = tk.Entry(frame_protocolo, width=10, state='readonly')
        self.campos_avaliacao['percentual_gordura'].grid(row=0, column=3, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_protocolo,
                text="Peso Ideal (kg):",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=4, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['peso_ideal'] = tk.Entry(frame_protocolo, width=10, state='readonly')
        self.campos_avaliacao['peso_ideal'].grid(row=0, column=5, padx=5, pady=5, sticky='w')
        
        # Botão Calcular
        btn_calcular = tk.Button(frame_protocolo,
                               text="🧮 Calcular",
                               bg='#FFA500',
                               fg='#000000',
                               font=('Arial', 12, 'bold'),
                               command=self.calcular_resultados,
                               relief='flat',
                               padx=20,
                               pady=10)
        btn_calcular.grid(row=1, column=0, columnspan=6, pady=20)
        
        # Seção Observações
        frame_observacoes = tk.LabelFrame(self.form_frame,
                                        text="Observações",
                                        bg='#FFFFFF',
                                        fg='#333333',
                                        font=('Arial', 12, 'bold'))
        frame_observacoes.pack(fill='x', padx=10, pady=10)
        
        self.campos_avaliacao['observacoes'] = tk.Text(frame_observacoes, height=4, width=80)
        self.campos_avaliacao['observacoes'].pack(padx=10, pady=10, fill='x')
        
        # Botões de ação
        frame_botoes = tk.Frame(self.form_frame, bg='#FFFFFF')
        frame_botoes.pack(fill='x', padx=10, pady=20)
        
        btn_salvar = tk.Button(frame_botoes,
                              text="💾 Salvar Avaliação",
                              bg='#27AE60',
                              fg='#FFFFFF',
                              font=('Arial', 12, 'bold'),
                              command=self.salvar_avaliacao,
                              relief='flat',
                              padx=20,
                              pady=10)
        btn_salvar.pack(side='left', padx=(0, 10))
        
        btn_limpar = tk.Button(frame_botoes,
                              text="🗑️ Limpar Campos",
                              bg='#E74C3C',
                              fg='#FFFFFF',
                              font=('Arial', 12, 'bold'),
                              command=self.limpar_campos,
                              relief='flat',
                              padx=20,
                              pady=10)
        btn_limpar.pack(side='left')
    
    def calcular_dobras(self, event=None):
        """Calcula a soma das dobras cutâneas."""
        try:
            dobras = [
                'dobra_triceps', 'dobra_subescapular', 'dobra_suprailiaca',
                'dobra_abdominal', 'dobra_peitoral', 'dobra_axilar_media', 'dobra_coxa'
            ]
            
            soma = 0
            for dobra in dobras:
                valor = self.campos_avaliacao[dobra].get()
                if valor:
                    soma += float(valor)
            
            self.campos_avaliacao['soma_dobras'].config(state='normal')
            self.campos_avaliacao['soma_dobras'].delete(0, tk.END)
            self.campos_avaliacao['soma_dobras'].insert(0, str(soma))
            self.campos_avaliacao['soma_dobras'].config(state='readonly')
            
            # Calcular percentual de gordura se protocolo estiver selecionado
            self.calcular_resultados()
            
        except ValueError:
            pass
    
    def calcular_rcq(self, event=None):
        """Calcula a Relação Cintura-Quadril (RCQ)."""
        try:
            cintura = self.campos_avaliacao['circunferencia_cintura'].get()
            quadril = self.campos_avaliacao['circunferencia_quadril'].get()
            
            if cintura and quadril:
                rcq = float(cintura) / float(quadril)
                self.campos_avaliacao['rcq'].config(state='normal')
                self.campos_avaliacao['rcq'].delete(0, tk.END)
                self.campos_avaliacao['rcq'].insert(0, f"{rcq:.2f}")
                self.campos_avaliacao['rcq'].config(state='readonly')
        except ValueError:
            pass
    
    def calcular_resultados(self, event=None):
        """Calcula IMC, percentual de gordura e peso ideal."""
        try:
            # Calcular IMC
            altura = self.campos_avaliacao['altura'].get()
            peso = self.campos_avaliacao['peso'].get()
            
            if altura and peso:
                altura_m = float(altura)
                peso_kg = float(peso)
                imc = peso_kg / (altura_m ** 2)
                
                self.campos_avaliacao['imc'].config(state='normal')
                self.campos_avaliacao['imc'].delete(0, tk.END)
                self.campos_avaliacao['imc'].insert(0, f"{imc:.1f}")
                self.campos_avaliacao['imc'].config(state='readonly')
            
            # Calcular percentual de gordura baseado no protocolo
            protocolo = self.combo_protocolo.get()
            soma_dobras = self.campos_avaliacao['soma_dobras'].get()
            sexo = self.campos_avaliacao['sexo'].get()
            idade = self.campos_avaliacao['idade'].get()
            
            if protocolo and soma_dobras and sexo and idade:
                soma = float(soma_dobras)
                idade_num = int(idade.split()[0]) if ' ' in idade else int(idade)
                
                # Fórmulas simplificadas para demonstração
                if protocolo == "Pollock":
                    if sexo.lower() in ['m', 'masculino', 'homem']:
                        # Pollock 7 dobras masculino
                        densidade = 1.112 - (0.00043499 * soma) + (0.00000055 * soma**2) - (0.00028826 * idade_num)
                    else:
                        # Pollock 7 dobras feminino
                        densidade = 1.097 - (0.00046971 * soma) + (0.00000056 * soma**2) - (0.00012828 * idade_num)
                    
                    # Fórmula de Siri
                    percentual_gordura = ((4.95 / densidade) - 4.5) * 100
                
                elif protocolo == "Faulkner":
                    # Fórmula simplificada de Faulkner
                    percentual_gordura = soma * 0.153 + 5.783
                
                else:  # Guedes
                    if sexo.lower() in ['m', 'masculino', 'homem']:
                        percentual_gordura = 1.17 * soma - 0.06 * idade_num + 3.28
                    else:
                        percentual_gordura = 1.51 * soma - 0.70 * idade_num + 1.4
                
                self.campos_avaliacao['percentual_gordura'].config(state='normal')
                self.campos_avaliacao['percentual_gordura'].delete(0, tk.END)
                self.campos_avaliacao['percentual_gordura'].insert(0, f"{percentual_gordura:.1f}")
                self.campos_avaliacao['percentual_gordura'].config(state='readonly')
                
                # Calcular peso ideal (fórmula simplificada)
                if altura and percentual_gordura:
                    peso_ideal = peso_kg * (1 - (percentual_gordura - 15) / 100)  # Assumindo 15% como ideal
                    self.campos_avaliacao['peso_ideal'].config(state='normal')
                    self.campos_avaliacao['peso_ideal'].delete(0, tk.END)
                    self.campos_avaliacao['peso_ideal'].insert(0, f"{peso_ideal:.1f}")
                    self.campos_avaliacao['peso_ideal'].config(state='readonly')
            
        except (ValueError, ZeroDivisionError):
            pass
    
    def carregar_combo_alunos(self):
        """Carrega a lista de alunos no combobox."""
        try:
            alunos = aluno_dao.listar_todos_alunos()
            valores = [f"{aluno.id} - {aluno.nome}" for aluno in alunos]
            self.combo_aluno['values'] = valores
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao carregar alunos: {str(e)}")
    
    def carregar_combo_alunos_filtro(self):
        """Carrega a lista de alunos no combobox de filtro."""
        try:
            alunos = aluno_dao.listar_todos_alunos()
            valores = ["Todos os alunos"] + [f"{aluno.id} - {aluno.nome}" for aluno in alunos]
            self.combo_aluno_filtro['values'] = valores
            self.combo_aluno_filtro.set("Todos os alunos")
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao carregar alunos: {str(e)}")
    
    def atualizar_dados_aluno(self, event=None):
        """Atualiza os dados do aluno selecionado."""
        try:
            selecao = self.combo_aluno.get()
            if selecao:
                aluno_id = int(selecao.split(' - ')[0])
                aluno = aluno_dao.buscar_aluno_por_id(aluno_id)
                
                if aluno:
                    # Atualizar campos readonly
                    self.campos_avaliacao['nome'].config(state='normal')
                    self.campos_avaliacao['nome'].delete(0, tk.END)
                    self.campos_avaliacao['nome'].insert(0, aluno.nome)
                    self.campos_avaliacao['nome'].config(state='readonly')
                    
                    self.campos_avaliacao['sexo'].config(state='normal')
                    self.campos_avaliacao['sexo'].delete(0, tk.END)
                    self.campos_avaliacao['sexo'].insert(0, aluno.genero or '')
                    self.campos_avaliacao['sexo'].config(state='readonly')
                    
                    # Calcular idade
                    if aluno.data_nascimento:
                        hoje = date.today()
                        idade = hoje.year - aluno.data_nascimento.year
                        if hoje.month < aluno.data_nascimento.month or (hoje.month == aluno.data_nascimento.month and hoje.day < aluno.data_nascimento.day):
                            idade -= 1
                        
                        self.campos_avaliacao['idade'].config(state='normal')
                        self.campos_avaliacao['idade'].delete(0, tk.END)
                        self.campos_avaliacao['idade'].insert(0, f"{idade} anos")
                        self.campos_avaliacao['idade'].config(state='readonly')
                        
                        self.campos_avaliacao['data_nascimento'].config(state='normal')
                        self.campos_avaliacao['data_nascimento'].delete(0, tk.END)
                        self.campos_avaliacao['data_nascimento'].insert(0, aluno.data_nascimento.strftime('%d/%m/%Y'))
                        self.campos_avaliacao['data_nascimento'].config(state='readonly')
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao carregar dados do aluno: {str(e)}")
    
    def limpar_campos(self):
        """Limpa todos os campos do formulário."""
        for campo in self.campos_avaliacao.values():
            if isinstance(campo, tk.Entry):
                campo.config(state='normal')
                campo.delete(0, tk.END)
                if campo in [self.campos_avaliacao.get('nome'), self.campos_avaliacao.get('sexo'), 
                           self.campos_avaliacao.get('idade'), self.campos_avaliacao.get('data_nascimento'),
                           self.campos_avaliacao.get('imc'), self.campos_avaliacao.get('rcq'),
                           self.campos_avaliacao.get('soma_dobras'), self.campos_avaliacao.get('percentual_gordura'),
                           self.campos_avaliacao.get('peso_ideal')]:
                    campo.config(state='readonly')
            elif isinstance(campo, tk.Text):
                campo.delete('1.0', tk.END)
        
        self.combo_aluno.set('')
        self.combo_protocolo.set('')
    
    def salvar_avaliacao(self):
        """Salva a avaliação no banco de dados."""
        try:
            # Validar campos obrigatórios
            if not self.combo_aluno.get():
                messagebox.showerror("Erro", "Selecione um aluno.")
                return
            
            if not self.campos_avaliacao['altura'].get() or not self.campos_avaliacao['peso'].get():
                messagebox.showerror("Erro", "Altura e peso são obrigatórios.")
                return
            
            # Criar objeto de avaliação
            aluno_id = int(self.combo_aluno.get().split(' - ')[0])
            
            avaliacao = AvaliacaoFisica(
                aluno_id=aluno_id,
                data_avaliacao=date.today(),
                altura=float(self.campos_avaliacao['altura'].get()),
                peso=float(self.campos_avaliacao['peso'].get()),
                pressao_arterial=self.campos_avaliacao['pressao_arterial'].get(),
                frequencia_cardiaca=int(self.campos_avaliacao['frequencia_cardiaca'].get()) if self.campos_avaliacao['frequencia_cardiaca'].get() else None,
                protocolo=self.combo_protocolo.get(),
                observacoes=self.campos_avaliacao['observacoes'].get('1.0', tk.END).strip()
            )
            
            # Adicionar medidas perimétricas
            if self.campos_avaliacao['circunferencia_pescoco'].get():
                avaliacao.circunferencia_pescoco = float(self.campos_avaliacao['circunferencia_pescoco'].get())
            if self.campos_avaliacao['circunferencia_ombro'].get():
                avaliacao.circunferencia_ombro = float(self.campos_avaliacao['circunferencia_ombro'].get())
            if self.campos_avaliacao['circunferencia_peito'].get():
                avaliacao.circunferencia_peito = float(self.campos_avaliacao['circunferencia_peito'].get())
            if self.campos_avaliacao['circunferencia_cintura'].get():
                avaliacao.circunferencia_cintura = float(self.campos_avaliacao['circunferencia_cintura'].get())
            if self.campos_avaliacao['circunferencia_abdomen'].get():
                avaliacao.circunferencia_abdomen = float(self.campos_avaliacao['circunferencia_abdomen'].get())
            if self.campos_avaliacao['circunferencia_quadril'].get():
                avaliacao.circunferencia_quadril = float(self.campos_avaliacao['circunferencia_quadril'].get())
            if self.campos_avaliacao['circunferencia_braco_esq'].get():
                avaliacao.circunferencia_braco_esq = float(self.campos_avaliacao['circunferencia_braco_esq'].get())
            if self.campos_avaliacao['circunferencia_braco_dir'].get():
                avaliacao.circunferencia_braco_dir = float(self.campos_avaliacao['circunferencia_braco_dir'].get())
            if self.campos_avaliacao['circunferencia_coxa_esq'].get():
                avaliacao.circunferencia_coxa_esq = float(self.campos_avaliacao['circunferencia_coxa_esq'].get())
            if self.campos_avaliacao['circunferencia_coxa_dir'].get():
                avaliacao.circunferencia_coxa_dir = float(self.campos_avaliacao['circunferencia_coxa_dir'].get())
            if self.campos_avaliacao['circunferencia_panturrilha_esq'].get():
                avaliacao.circunferencia_panturrilha_esq = float(self.campos_avaliacao['circunferencia_panturrilha_esq'].get())
            if self.campos_avaliacao['circunferencia_panturrilha_dir'].get():
                avaliacao.circunferencia_panturrilha_dir = float(self.campos_avaliacao['circunferencia_panturrilha_dir'].get())
            
            # Adicionar dobras cutâneas
            if self.campos_avaliacao['dobra_triceps'].get():
                avaliacao.dobra_triceps = float(self.campos_avaliacao['dobra_triceps'].get())
            if self.campos_avaliacao['dobra_subescapular'].get():
                avaliacao.dobra_subescapular = float(self.campos_avaliacao['dobra_subescapular'].get())
            if self.campos_avaliacao['dobra_suprailiaca'].get():
                avaliacao.dobra_suprailiaca = float(self.campos_avaliacao['dobra_suprailiaca'].get())
            if self.campos_avaliacao['dobra_abdominal'].get():
                avaliacao.dobra_abdominal = float(self.campos_avaliacao['dobra_abdominal'].get())
            if self.campos_avaliacao['dobra_peitoral'].get():
                avaliacao.dobra_peitoral = float(self.campos_avaliacao['dobra_peitoral'].get())
            if self.campos_avaliacao['dobra_axilar_media'].get():
                avaliacao.dobra_axilar_media = float(self.campos_avaliacao['dobra_axilar_media'].get())
            if self.campos_avaliacao['dobra_coxa'].get():
                avaliacao.dobra_coxa = float(self.campos_avaliacao['dobra_coxa'].get())
            
            # Salvar no banco de dados
            if avaliacao_dao.salvar_avaliacao(avaliacao):
                messagebox.showinfo("Sucesso", "Avaliação salva com sucesso!")
                self.limpar_campos()
                self.carregar_lista_avaliacoes()
            else:
                messagebox.showerror("Erro", "Erro ao salvar avaliação.")
                
        except ValueError as e:
            messagebox.showerror("Erro", f"Erro nos dados inseridos: {str(e)}")
        except Exception as e:
            messagebox.showerror("Erro", f"Erro inesperado: {str(e)}")
    
    def carregar_lista_avaliacoes(self):
        """Carrega a lista de avaliações na treeview."""
        try:
            # Limpar lista atual
            for item in self.tree_avaliacoes.get_children():
                self.tree_avaliacoes.delete(item)
            
            # Carregar avaliações
            avaliacoes = avaliacao_dao.listar_todas_avaliacoes()
            
            for avaliacao in avaliacoes:
                # Buscar nome do aluno
                aluno = aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id)
                nome_aluno = aluno.nome if aluno else "Aluno não encontrado"
                
                # Formatar dados
                data_formatada = avaliacao.data_avaliacao.strftime('%d/%m/%Y') if avaliacao.data_avaliacao else ''
                peso_formatado = f"{avaliacao.peso:.1f} kg" if avaliacao.peso else ''
                imc_formatado = f"{avaliacao.imc:.1f}" if avaliacao.imc else ''
                gordura_formatada = f"{avaliacao.percentual_gordura:.1f}%" if avaliacao.percentual_gordura else ''
                pressao_formatada = avaliacao.pressao_arterial or ''
                
                self.tree_avaliacoes.insert('', 'end', values=(
                    avaliacao.id,
                    nome_aluno,
                    data_formatada,
                    peso_formatado,
                    imc_formatado,
                    gordura_formatada,
                    pressao_formatada
                ))
                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao carregar avaliações: {str(e)}")
    
    def selecionar_avaliacao(self, event=None):
        """Habilita botões quando uma avaliação é selecionada."""
        selecao = self.tree_avaliacoes.selection()
        if selecao:
            self.btn_visualizar.config(state='normal')
            self.btn_exportar.config(state='normal')
            self.btn_evolucao.config(state='normal')
            self.btn_editar.config(state='normal')
            self.btn_excluir.config(state='normal')
            
            # Armazenar avaliação selecionada
            item = self.tree_avaliacoes.item(selecao[0])
            self.avaliacao_selecionada = item['values'][0]  # ID da avaliação
        else:
            self.btn_visualizar.config(state='disabled')
            self.btn_exportar.config(state='disabled')
            self.btn_evolucao.config(state='disabled')
            self.btn_editar.config(state='disabled')
            self.btn_excluir.config(state='disabled')
            self.avaliacao_selecionada = None
    
    def abrir_nova_avaliacao(self):
        """Abre a aba de nova avaliação."""
        self.notebook.select(1)  # Seleciona a segunda aba (Nova Avaliação)
    
    def filtrar_por_aluno(self, event=None):
        """Filtra avaliações por aluno selecionado."""
        try:
            selecao = self.combo_aluno_filtro.get()
            
            # Limpar lista atual
            for item in self.tree_avaliacoes.get_children():
                self.tree_avaliacoes.delete(item)
            
            if selecao == "Todos os alunos":
                avaliacoes = avaliacao_dao.listar_todas_avaliacoes()
            else:
                aluno_id = int(selecao.split(' - ')[0])
                avaliacoes = avaliacao_dao.buscar_avaliacoes_por_aluno(aluno_id)
            
            for avaliacao in avaliacoes:
                # Buscar nome do aluno
                aluno = aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id)
                nome_aluno = aluno.nome if aluno else "Aluno não encontrado"
                
                # Formatar dados
                data_formatada = avaliacao.data_avaliacao.strftime('%d/%m/%Y') if avaliacao.data_avaliacao else ''
                peso_formatado = f"{avaliacao.peso:.1f} kg" if avaliacao.peso else ''
                imc_formatado = f"{avaliacao.imc:.1f}" if avaliacao.imc else ''
                gordura_formatada = f"{avaliacao.percentual_gordura:.1f}%" if avaliacao.percentual_gordura else ''
                pressao_formatada = avaliacao.pressao_arterial or ''
                
                self.tree_avaliacoes.insert('', 'end', values=(
                    avaliacao.id,
                    nome_aluno,
                    data_formatada,
                    peso_formatado,
                    imc_formatado,
                    gordura_formatada,
                    pressao_formatada
                ))
                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao filtrar avaliações: {str(e)}")
    
    def limpar_filtro(self):
        """Limpa o filtro e mostra todas as avaliações."""
        self.combo_aluno_filtro.set("Todos os alunos")
        self.carregar_lista_avaliacoes()
    
    # Métodos placeholder para funcionalidades futuras
    def visualizar_avaliacao_selecionada(self):
        """Visualiza a avaliação selecionada."""
        if self.avaliacao_selecionada:
            messagebox.showinfo("Info", f"Visualizar avaliação ID: {self.avaliacao_selecionada}")
    
    def exportar_avaliacao_selecionada(self):
        """Exporta a avaliação selecionada."""
        if self.avaliacao_selecionada:
            messagebox.showinfo("Info", f"Exportar avaliação ID: {self.avaliacao_selecionada}")
    
    def mostrar_evolucao(self):
        """Mostra a evolução do aluno."""
        if self.avaliacao_selecionada:
            messagebox.showinfo("Info", f"Mostrar evolução da avaliação ID: {self.avaliacao_selecionada}")
    
    def editar_avaliacao_selecionada(self):
        """Edita a avaliação selecionada."""
        if self.avaliacao_selecionada:
            messagebox.showinfo("Info", f"Editar avaliação ID: {self.avaliacao_selecionada}")
    
    def excluir_avaliacao_selecionada(self):
        """Exclui a avaliação selecionada."""
        if self.avaliacao_selecionada:
            if messagebox.askyesno("Confirmar", "Deseja realmente excluir esta avaliação?"):
                try:
                    if avaliacao_dao.excluir_avaliacao(self.avaliacao_selecionada):
                        messagebox.showinfo("Sucesso", "Avaliação excluída com sucesso!")
                        self.carregar_lista_avaliacoes()
                    else:
                        messagebox.showerror("Erro", "Erro ao excluir avaliação.")
                except Exception as e:
                    messagebox.showerror("Erro", f"Erro ao excluir avaliação: {str(e)}")

