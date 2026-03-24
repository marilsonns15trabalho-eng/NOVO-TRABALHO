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
        
        # Seção Protocolo
        frame_protocolo = tk.LabelFrame(self.form_frame,
                                       text="Protocolo",
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
                text="Soma das Dobras (mm):",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=0, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['soma_dobras'] = tk.Entry(frame_protocolo, width=10, state='readonly')
        self.campos_avaliacao['soma_dobras'].grid(row=0, column=3, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_protocolo,
                text="% Gordura:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=1, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['percentual_gordura'] = tk.Entry(frame_protocolo, width=10, state='readonly')
        self.campos_avaliacao['percentual_gordura'].grid(row=1, column=3, padx=5, pady=5, sticky='w')
        
        tk.Label(frame_protocolo,
                text="Peso Ideal (kg):",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=2, column=2, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['peso_ideal'] = tk.Entry(frame_protocolo, width=10, state='readonly')
        self.campos_avaliacao['peso_ideal'].grid(row=2, column=3, padx=5, pady=5, sticky='w')
        
        # Seção Medidas
        frame_medidas = tk.LabelFrame(self.form_frame,
                                     text="Medidas Corporais",
                                     bg='#FFFFFF',
                                     fg='#333333',
                                     font=('Arial', 12, 'bold'))
        frame_medidas.pack(fill='x', padx=10, pady=10)
        
        # Peso e Altura
        tk.Label(frame_medidas, text="Peso (kg):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["peso"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["peso"].grid(row=0, column=1, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["peso"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Altura (m):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=0, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["altura"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["altura"].grid(row=0, column=3, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["altura"].bind("<KeyRelease>", self.calcular_resultados)

        # Circunferências
        tk.Label(frame_medidas, text="Pescoço (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_pescoco"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_pescoco"].grid(row=1, column=1, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_pescoco"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Ombro (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=1, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_ombro"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_ombro"].grid(row=1, column=3, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_ombro"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Tórax (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=2, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_torax"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_torax"].grid(row=2, column=1, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_torax"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Peito (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=2, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_peito"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_peito"].grid(row=2, column=3, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_peito"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Cintura (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=3, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_cintura"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_cintura"].grid(row=3, column=1, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_cintura"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Abdômen (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=3, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_abdomen"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_abdomen"].grid(row=3, column=3, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_abdomen"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Quadril (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=4, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_quadril"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_quadril"].grid(row=4, column=1, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_quadril"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Braço Esq. (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=5, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_braco_esq"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_braco_esq"].grid(row=5, column=1, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_braco_esq"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Braço Dir. (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=5, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_braco_dir"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_braco_dir"].grid(row=5, column=3, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_braco_dir"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Coxa Esq. (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=6, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_coxa_esq"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_coxa_esq"].grid(row=6, column=1, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_coxa_esq"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Coxa Dir. (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=6, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_coxa_dir"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_coxa_dir"].grid(row=6, column=3, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_coxa_dir"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Panturrilha Esq. (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=7, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_panturrilha_esq"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_panturrilha_esq"].grid(row=7, column=1, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_panturrilha_esq"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_medidas, text="Panturrilha Dir. (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=7, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_panturrilha_dir"] = tk.Entry(frame_medidas, width=10)
        self.campos_avaliacao["circunferencia_panturrilha_dir"].grid(row=7, column=3, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["circunferencia_panturrilha_dir"].bind("<KeyRelease>", self.calcular_resultados)

        # Seção Dobras Cutâneas
        frame_dobras = tk.LabelFrame(self.form_frame,
                                    text="Dobras Cutâneas (mm)",
                                    bg='#FFFFFF',
                                    fg='#333333',
                                    font=('Arial', 12, 'bold'))
        frame_dobras.pack(fill='x', padx=10, pady=10)

        tk.Label(frame_dobras, text="Tricipital (mm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_tricipital"] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao["dobra_tricipital"].grid(row=0, column=1, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_tricipital"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_dobras, text="Subescapular (mm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=0, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_subescapular"] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao["dobra_subescapular"].grid(row=0, column=3, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_subescapular"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_dobras, text="Supra-ilíaca (mm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_supra_iliaca"] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao["dobra_supra_iliaca"].grid(row=1, column=1, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_supra_iliaca"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_dobras, text="Abdominal (mm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=1, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_abdominal"] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao["dobra_abdominal"].grid(row=1, column=3, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_abdominal"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_dobras, text="Bicipital (mm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=2, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_bicipital"] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao["dobra_bicipital"].grid(row=2, column=1, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_bicipital"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_dobras, text="Axilar Média (mm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=2, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_axilar_media"] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao["dobra_axilar_media"].grid(row=2, column=3, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_axilar_media"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_dobras, text="Coxa (mm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=3, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_coxa"] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao["dobra_coxa"].grid(row=3, column=1, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_coxa"].bind("<KeyRelease>", self.calcular_resultados)

        tk.Label(frame_dobras, text="Panturrilha (mm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=3, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_panturrilha"] = tk.Entry(frame_dobras, width=10)
        self.campos_avaliacao["dobra_panturrilha"].grid(row=3, column=3, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["dobra_panturrilha"].bind("<KeyRelease>", self.calcular_resultados)

        # Seção Resultados
        frame_resultados = tk.LabelFrame(self.form_frame,
                                        text="Resultados",
                                        bg='#FFFFFF',
                                        fg='#333333',
                                        font=('Arial', 12, 'bold'))
        frame_resultados.pack(fill='x', padx=10, pady=10)

        tk.Label(frame_resultados, text="IMC:", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["imc"] = tk.Entry(frame_resultados, width=10, state='readonly')
        self.campos_avaliacao["imc"].grid(row=0, column=1, padx=5, pady=5, sticky="w")

        tk.Label(frame_resultados, text="Classificação IMC:", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=0, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["classificacao_imc"] = tk.Entry(frame_resultados, width=15, state='readonly')
        self.campos_avaliacao["classificacao_imc"].grid(row=0, column=3, padx=5, pady=5, sticky="w")

        tk.Label(frame_resultados, text="RCQ:", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["rcq"] = tk.Entry(frame_resultados, width=10, state='readonly')
        self.campos_avaliacao["rcq"].grid(row=1, column=1, padx=5, pady=5, sticky="w")

        tk.Label(frame_resultados, text="Classificação RCQ:", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=1, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["classificacao_rcq"] = tk.Entry(frame_resultados, width=15, state='readonly')
        self.campos_avaliacao["classificacao_rcq"].grid(row=1, column=3, padx=5, pady=5, sticky="w")

        tk.Label(frame_resultados, text="Massa Gorda (kg):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=2, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["massa_gorda"] = tk.Entry(frame_resultados, width=10, state='readonly')
        self.campos_avaliacao["massa_gorda"].grid(row=2, column=1, padx=5, pady=5, sticky="w")

        tk.Label(frame_resultados, text="Massa Magra (kg):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=2, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["massa_magra"] = tk.Entry(frame_resultados, width=10, state='readonly')
        self.campos_avaliacao["massa_magra"].grid(row=2, column=3, padx=5, pady=5, sticky="w")

        tk.Label(frame_resultados, text="Peso Residual (kg):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=3, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["peso_residual"] = tk.Entry(frame_resultados, width=10, state='readonly')
        self.campos_avaliacao["peso_residual"].grid(row=3, column=1, padx=5, pady=5, sticky="w")

        tk.Label(frame_resultados, text="Soma Perimetria (cm):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=3, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["soma_perimetria"] = tk.Entry(frame_resultados, width=10, state='readonly')
        self.campos_avaliacao["soma_perimetria"].grid(row=3, column=3, padx=5, pady=5, sticky="w")

        # Seção Pressão Arterial
        frame_pressao = tk.LabelFrame(self.form_frame,
                                     text="Pressão Arterial",
                                     bg='#FFFFFF',
                                     fg='#333333',
                                     font=('Arial', 12, 'bold'))
        frame_pressao.pack(fill='x', padx=10, pady=10)

        tk.Label(frame_pressao, text="Sistólica (mmHg):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["pressao_sistolica"] = tk.Entry(frame_pressao, width=10)
        self.campos_avaliacao["pressao_sistolica"].grid(row=0, column=1, padx=5, pady=5, sticky="w")

        tk.Label(frame_pressao, text="Diastólica (mmHg):", bg="#FFFFFF", fg="#333333", font=("Arial", 10, "bold")).grid(row=0, column=2, padx=5, pady=5, sticky="w")
        self.campos_avaliacao["pressao_diastolica"] = tk.Entry(frame_pressao, width=10)
        self.campos_avaliacao["pressao_diastolica"].grid(row=0, column=3, padx=5, pady=5, sticky="w")

        # Seção Observações
        frame_observacoes = tk.LabelFrame(self.form_frame,
                                         text="Observações",
                                         bg='#FFFFFF',
                                         fg='#333333',
                                         font=('Arial', 12, 'bold'))
        frame_observacoes.pack(fill='x', padx=10, pady=10)

        self.campos_avaliacao["observacoes"] = tk.Text(frame_observacoes, width=80, height=5)
        self.campos_avaliacao["observacoes"].pack(padx=10, pady=10)

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

    def _get_float(self, value):
        """Converte string para float, tratando vírgulas e valores vazios."""
        if not value or value.strip() == "":
            return 0.0
        try:
            # Substitui vírgula por ponto
            value = str(value).replace(',', '.')
            return float(value)
        except ValueError:
            return 0.0

    def calcular_resultados(self, event=None):
        """Calcula automaticamente os resultados da avaliação."""
        try:
            # Obter dados dos campos
            peso = self._get_float(self.campos_avaliacao["peso"].get())
            altura = self._get_float(self.campos_avaliacao["altura"].get())
            
            # Obter dados do aluno selecionado
            aluno_selecionado = self.combo_aluno.get()
            if not aluno_selecionado:
                return
            
            aluno_id = int(aluno_selecionado.split(' - ')[0])
            aluno = aluno_dao.buscar_aluno_por_id(aluno_id)
            
            if not aluno:
                return
            
            # Criar objeto de avaliação temporário para cálculos
            avaliacao = AvaliacaoFisica(
                aluno_id=aluno.id,
                peso=peso,
                altura=altura,
                dobra_tricipital=self._get_float(self.campos_avaliacao["dobra_tricipital"].get()),
                dobra_subescapular=self._get_float(self.campos_avaliacao["dobra_subescapular"].get()),
                dobra_supra_iliaca=self._get_float(self.campos_avaliacao["dobra_supra_iliaca"].get()),
                dobra_abdominal=self._get_float(self.campos_avaliacao["dobra_abdominal"].get()),
                dobra_bicipital=self._get_float(self.campos_avaliacao["dobra_bicipital"].get()),
                dobra_axilar_media=self._get_float(self.campos_avaliacao["dobra_axilar_media"].get()),
                dobra_coxa=self._get_float(self.campos_avaliacao["dobra_coxa"].get()),
                dobra_panturrilha=self._get_float(self.campos_avaliacao["dobra_panturrilha"].get()),
                circunferencia_pescoco=self._get_float(self.campos_avaliacao["circunferencia_pescoco"].get()),
                circunferencia_ombro=self._get_float(self.campos_avaliacao["circunferencia_ombro"].get()),
                circunferencia_torax=self._get_float(self.campos_avaliacao["circunferencia_torax"].get()),
                circunferencia_peito=self._get_float(self.campos_avaliacao["circunferencia_peito"].get()),
                circunferencia_cintura=self._get_float(self.campos_avaliacao["circunferencia_cintura"].get()),
                circunferencia_abdomen=self._get_float(self.campos_avaliacao["circunferencia_abdomen"].get()),
                circunferencia_quadril=self._get_float(self.campos_avaliacao["circunferencia_quadril"].get()),
                circunferencia_braco_esq=self._get_float(self.campos_avaliacao["circunferencia_braco_esq"].get()),
                circunferencia_braco_dir=self._get_float(self.campos_avaliacao["circunferencia_braco_dir"].get()),
                circunferencia_coxa_esq=self._get_float(self.campos_avaliacao["circunferencia_coxa_esq"].get()),
                circunferencia_coxa_dir=self._get_float(self.campos_avaliacao["circunferencia_coxa_dir"].get()),
                circunferencia_panturrilha_esq=self._get_float(self.campos_avaliacao["circunferencia_panturrilha_esq"].get()),
                circunferencia_panturrilha_dir=self._get_float(self.campos_avaliacao["circunferencia_panturrilha_dir"].get()),
                pressao_sistolica=self._get_float(self.campos_avaliacao["pressao_sistolica"].get()),
                pressao_diastolica=self._get_float(self.campos_avaliacao["pressao_diastolica"].get()),
                protocolo=self.combo_protocolo.get(),
                observacoes=self.campos_avaliacao["observacoes"].get("1.0", tk.END).strip()
            )
            
            # Definir dados do aluno
            avaliacao.aluno = aluno
            
            # Calcular resultados
            avaliacao.calcular_resultados()
            
            # Atualizar campos calculados
            self.campos_avaliacao["soma_dobras"].config(state='normal')
            self.campos_avaliacao["soma_dobras"].delete(0, tk.END)
            self.campos_avaliacao["soma_dobras"].insert(0, f"{avaliacao.soma_dobras:.1f}")
            self.campos_avaliacao["soma_dobras"].config(state='readonly')
            
            self.campos_avaliacao["percentual_gordura"].config(state='normal')
            self.campos_avaliacao["percentual_gordura"].delete(0, tk.END)
            self.campos_avaliacao["percentual_gordura"].insert(0, f"{avaliacao.percentual_gordura:.2f}")
            self.campos_avaliacao["percentual_gordura"].config(state='readonly')
            
            self.campos_avaliacao["peso_ideal"].config(state='normal')
            self.campos_avaliacao["peso_ideal"].delete(0, tk.END)
            self.campos_avaliacao["peso_ideal"].insert(0, f"{avaliacao.peso_ideal:.1f}")
            self.campos_avaliacao["peso_ideal"].config(state='readonly')
            
            self.campos_avaliacao["imc"].config(state='normal')
            self.campos_avaliacao["imc"].delete(0, tk.END)
            self.campos_avaliacao["imc"].insert(0, f"{avaliacao.imc:.2f}")
            self.campos_avaliacao["imc"].config(state='readonly')
            
            self.campos_avaliacao["classificacao_imc"].config(state='normal')
            self.campos_avaliacao["classificacao_imc"].delete(0, tk.END)
            self.campos_avaliacao["classificacao_imc"].insert(0, avaliacao.classificacao_imc)
            self.campos_avaliacao["classificacao_imc"].config(state='readonly')
            
            self.campos_avaliacao["rcq"].config(state='normal')
            self.campos_avaliacao["rcq"].delete(0, tk.END)
            self.campos_avaliacao["rcq"].insert(0, f"{avaliacao.rcq:.2f}")
            self.campos_avaliacao["rcq"].config(state='readonly')
            
            self.campos_avaliacao["classificacao_rcq"].config(state='normal')
            self.campos_avaliacao["classificacao_rcq"].delete(0, tk.END)
            self.campos_avaliacao["classificacao_rcq"].insert(0, avaliacao.classificacao_rcq)
            self.campos_avaliacao["classificacao_rcq"].config(state='readonly')
            
            self.campos_avaliacao["massa_gorda"].config(state='normal')
            self.campos_avaliacao["massa_gorda"].delete(0, tk.END)
            self.campos_avaliacao["massa_gorda"].insert(0, f"{avaliacao.massa_gorda:.2f}")
            self.campos_avaliacao["massa_gorda"].config(state='readonly')
            
            self.campos_avaliacao["massa_magra"].config(state='normal')
            self.campos_avaliacao["massa_magra"].delete(0, tk.END)
            self.campos_avaliacao["massa_magra"].insert(0, f"{avaliacao.massa_muscular:.2f}")
            self.campos_avaliacao["massa_magra"].config(state='readonly')
            
            self.campos_avaliacao["peso_residual"].config(state='normal')
            self.campos_avaliacao["peso_residual"].delete(0, tk.END)
            self.campos_avaliacao["peso_residual"].insert(0, f"{avaliacao.peso_residual:.2f}")
            self.campos_avaliacao["peso_residual"].config(state='readonly')
            
            self.campos_avaliacao["soma_perimetria"].config(state='normal')
            self.campos_avaliacao["soma_perimetria"].delete(0, tk.END)
            self.campos_avaliacao["soma_perimetria"].insert(0, f"{avaliacao.soma_perimetria:.1f}")
            self.campos_avaliacao["soma_perimetria"].config(state='readonly')
            
        except Exception as e:
            print(f"Erro ao calcular resultados: {e}")

    def carregar_combo_alunos(self):
        """Carrega a lista de alunos no combobox."""
        try:
            alunos = aluno_dao.listar_todos_alunos()
            valores = [f"{aluno.id} - {aluno.nome}" for aluno in alunos]
            self.combo_aluno['values'] = valores
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao carregar alunos: {e}")

    def carregar_combo_alunos_filtro(self):
        """Carrega a lista de alunos no combobox de filtro."""
        try:
            alunos = aluno_dao.listar_todos_alunos()
            valores = ["Todos"] + [f"{aluno.id} - {aluno.nome}" for aluno in alunos]
            self.combo_aluno_filtro['values'] = valores
            self.combo_aluno_filtro.set("Todos")
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao carregar alunos: {e}")

    def atualizar_dados_aluno(self, event=None):
        """Atualiza os dados do aluno selecionado."""
        try:
            aluno_selecionado = self.combo_aluno.get()
            if not aluno_selecionado:
                return
            
            aluno_id = int(aluno_selecionado.split(' - ')[0])
            aluno = aluno_dao.buscar_aluno_por_id(aluno_id)
            
            if aluno:
                # Atualizar campos readonly
                self.campos_avaliacao['nome'].config(state='normal')
                self.campos_avaliacao['sexo'].delete(0, tk.E                 self.campos_avaliacao['sexo'].delete(0, tk.END)
                self.campos_avaliacao['sexo'].insert(0, aluno.genero if aluno.genero else "N/A")
                self.campos_avaliacao['sexo'].config(state='readonly')

                self.campos_avaliacao['idade'].delete(0, tk.END)
                self.campos_avaliacao['idade'].insert(0, str(aluno.idade) if aluno.idade is not None else "N/A")
                self.campos_avaliacao['idade'].config(state='readonly')

                self.campos_avaliacao['data_nascimento'].delete(0, tk.END)
                self.campos_avaliacao['data_nascimento'].insert(0, aluno.data_nascimento.strftime('%d/%m/%Y') if aluno.data_nascimento else "N/A")
                self.campos_avaliacao['data_nascimento'].config(state='readonly')ata_nascimento else "N/A")
                self.campos_avaliacao["data_nascimento"].config(state=\'readonly\')           self.campos_avaliacao["idade"].config(state=\u0027readonly\u0027)

            self.campos_avaliacao["data_nascimento"].config(state=\u0027normal\u0027)
            self.campos_avaliacao["data_nascimento"].delete(0, tk.END)
            self.campos_avaliacao["data_nascimento"].insert(0, aluno.data_nascimento.strftime("%d/%m/%Y") if aluno.data_nascimento else "N/A")
            self.campos_avaliacao["data_nascimento"].config(state=\u0027readonly\u0027)if aluno.data_nascimento else "N/A")'%d/%m/%Y'))
                self.campos_avaliacao['data_nascimento'].config(state='readonly')
                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao carregar dados do aluno: {e}")

    def salvar_avaliacao(self):
        """Salva a avaliação no banco de dados."""
        try:
            # Validar campos obrigatórios
            if not self.combo_aluno.get():
                messagebox.showerror("Erro", "Selecione um aluno!")
                return
            
            if not self.combo_protocolo.get():
                messagebox.showerror("Erro", "Selecione um protocolo!")
                return
            
            peso = self._get_float(self.campos_avaliacao["peso"].get())
            altura = self._get_float(self.campos_avaliacao["altura"].get())
            
            if peso <= 0:
                messagebox.showerror("Erro", "Informe o peso!")
                return
            
            if altura <= 0:
                messagebox.showerror("Erro", "Informe a altura!")
                return
            
            # Obter ID do aluno
            aluno_selecionado = self.combo_aluno.get()
            aluno_id = int(aluno_selecionado.split(' - ')[0])
            
            # Criar objeto de avaliação
            avaliacao = AvaliacaoFisica(
                aluno_id=aluno_id,
                peso=peso,
                altura=altura,
                dobra_tricipital=self._get_float(self.campos_avaliacao["dobra_tricipital"].get()),
                dobra_subescapular=self._get_float(self.campos_avaliacao["dobra_subescapular"].get()),
                dobra_supra_iliaca=self._get_float(self.campos_avaliacao["dobra_supra_iliaca"].get()),
                dobra_abdominal=self._get_float(self.campos_avaliacao["dobra_abdominal"].get()),
                dobra_bicipital=self._get_float(self.campos_avaliacao["dobra_bicipital"].get()),
                dobra_axilar_media=self._get_float(self.campos_avaliacao["dobra_axilar_media"].get()),
                dobra_coxa=self._get_float(self.campos_avaliacao["dobra_coxa"].get()),
                dobra_panturrilha=self._get_float(self.campos_avaliacao["dobra_panturrilha"].get()),
                circunferencia_pescoco=self._get_float(self.campos_avaliacao["circunferencia_pescoco"].get()),
                circunferencia_ombro=self._get_float(self.campos_avaliacao["circunferencia_ombro"].get()),
                circunferencia_torax=self._get_float(self.campos_avaliacao["circunferencia_torax"].get()),
                circunferencia_peito=self._get_float(self.campos_avaliacao["circunferencia_peito"].get()),
                circunferencia_cintura=self._get_float(self.campos_avaliacao["circunferencia_cintura"].get()),
                circunferencia_abdomen=self._get_float(self.campos_avaliacao["circunferencia_abdomen"].get()),
                circunferencia_quadril=self._get_float(self.campos_avaliacao["circunferencia_quadril"].get()),
                circunferencia_braco_esq=self._get_float(self.campos_avaliacao["circunferencia_braco_esq"].get()),
                circunferencia_braco_dir=self._get_float(self.campos_avaliacao["circunferencia_braco_dir"].get()),
                circunferencia_coxa_esq=self._get_float(self.campos_avaliacao["circunferencia_coxa_esq"].get()),
                circunferencia_coxa_dir=self._get_float(self.campos_avaliacao["circunferencia_coxa_dir"].get()),
                circunferencia_panturrilha_esq=self._get_float(self.campos_avaliacao["circunferencia_panturrilha_esq"].get()),
                circunferencia_panturrilha_dir=self._get_float(self.campos_avaliacao["circunferencia_panturrilha_dir"].get()),
                pressao_sistolica=self._get_float(self.campos_avaliacao["pressao_sistolica"].get()),
                pressao_diastolica=self._get_float(self.campos_avaliacao["pressao_diastolica"].get()),
                protocolo=self.combo_protocolo.get(),
                observacoes=self.campos_avaliacao["observacoes"].get("1.0", tk.END).strip()
            )
            
            # Salvar no banco
            avaliacao_dao.salvar(avaliacao)
            
            messagebox.showinfo("Sucesso", "Avaliação salva com sucesso!")
            self.limpar_campos()
            self.carregar_lista_avaliacoes()
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao salvar avaliação: {e}")

    def limpar_campos(self):
        """Limpa todos os campos do formulário."""
        # Limpar comboboxes
        self.combo_aluno.set("")
        self.combo_protocolo.set("")
        
        # Limpar campos de entrada
        for campo_nome, campo_widget in self.campos_avaliacao.items():
            if isinstance(campo_widget, tk.Entry):
                if campo_widget['state'] == 'readonly':
                    campo_widget.config(state='normal')
                    campo_widget.delete(0, tk.END)
                    campo_widget.config(state='readonly')
                else:
                    campo_widget.delete(0, tk.END)
            elif isinstance(campo_widget, tk.Text):
                campo_widget.delete("1.0", tk.END)

    def carregar_lista_avaliacoes(self):
        """Carrega a lista de avaliações na treeview."""
        try:
            # Limpar lista atual
            for item in self.tree_avaliacoes.get_children():
                self.tree_avaliacoes.delete(item)
            
            # Carregar avaliações
            avaliacoes = avaliacao_dao.listar_todas_avaliacoes()
            
            for avaliacao in avaliacoes:
                # Formatar pressão arterial
                pressao = avaliacao.classificacao_pressao
                
                self.tree_avaliacoes.insert('', 'end', values=(
                    avaliacao.id,
                    aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id).nome if aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id) else "N/A",
                    avaliacao.data_avaliacao.strftime('%d/%m/%Y'),
                    f"{avaliacao.peso:.1f} kg" if avaliacao.peso is not None else "N/A",
                    f"{avaliacao.imc:.2f}" if avaliacao.imc is not None else "N/A",
                    f"{avaliacao.percentual_gordura:.1f}%" if avaliacao.percentual_gordura is not None else "N/A",
                    pressao
                ))
                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao carregar avaliações: {e}")

    def selecionar_avaliacao(self, event=None):
        """Habilita botões quando uma avaliação é selecionada."""
        selecionado = self.tree_avaliacoes.selection()
        if selecionado:
            item = self.tree_avaliacoes.item(selecionado[0])
            avaliacao_id = item['values'][0]
            self.avaliacao_selecionada = avaliacao_dao.buscar_por_id(avaliacao_id)
            
            # Habilitar botões
            self.btn_visualizar.config(state='normal')
            self.btn_exportar.config(state='normal')
            self.btn_evolucao.config(state='normal')
            self.btn_editar.config(state='normal')
            self.btn_excluir.config(state='normal')
        else:
            # Desabilitar botões
            self.btn_visualizar.config(state='disabled')
            self.btn_exportar.config(state='disabled')
            self.btn_evolucao.config(state='disabled')
            self.btn_editar.config(state='disabled')
            self.btn_excluir.config(state='disabled')

    def filtrar_por_aluno(self, event=None):
        """Filtra avaliações por aluno."""
        try:
            filtro = self.combo_aluno_filtro.get()
            
            # Limpar lista atual
            for item in self.tree_avaliacoes.get_children():
                self.tree_avaliacoes.delete(item)
            if filtro == "Todos":
                avaliacoes = avaliacao_dao.listar_todas_avaliacoes()
            else:
                aluno_id = int(filtro.split(' - ')[0])
                avaliacoes = avaliacao_dao.buscar_avaliacoes_por_aluno(aluno_id)
            
            for avaliacao in avaliacoes:
                # Formatar pressão arterial
                pressao = avaliacao.classificacao_pressao
                
                self.tree_avaliacoes.insert('', 'end', values=(
                    avaliacao.id,
                    aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id).nome if aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id) else "N/A",
                    avaliacao.data_avaliacao.strftime('%d/%m/%Y'),
                    f"{avaliacao.peso:.1f} kg" if avaliacao.peso is not None else "N/A",
                    f"{avaliacao.imc:.2f}" if avaliacao.imc is not None else "N/A",
                    f"{avaliacao.percentual_gordura:.1f}%" if avaliacao.percentual_gordura is not None else "N/A",
                    pressao
                ))
                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao filtrar avaliações: {e}")

    def limpar_filtro(self):
        """Limpa o filtro e recarrega todas as avaliações."""
        self.combo_aluno_filtro.set("Todos")
        self.carregar_lista_avaliacoes()

    def abrir_nova_avaliacao(self):
        """Abre a aba de nova avaliação."""
        self.notebook.select(1)  # Seleciona a segunda aba (Nova Avaliação)

    def visualizar_avaliacao_selecionada(self):
        """Visualiza a avaliação selecionada."""
        if not self.avaliacao_selecionada:
            messagebox.showwarning("Aviso", "Selecione uma avaliação!")
            return
        
        # Implementar visualização detalhada
        messagebox.showinfo("Info", "Funcionalidade de visualização em desenvolvimento")

    def exportar_avaliacao_selecionada(self):
        """Exporta a avaliação selecionada para PDF."""
        if not self.avaliacao_selecionada:
            messagebox.showwarning("Aviso", "Selecione uma avaliação!")
            return
        
        try:
            from gui.exportar_avaliacao import exportar_avaliacao_pdf
            exportar_avaliacao_pdf(self.avaliacao_selecionada)
            messagebox.showinfo("Sucesso", "Avaliação exportada com sucesso!")
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao exportar avaliação: {e}")

    def mostrar_evolucao(self):
        """Mostra a evolução do aluno."""
        if not self.avaliacao_selecionada:
            messagebox.showwarning("Aviso", "Selecione uma avaliação!")
            return
        
        # Implementar gráfico de evolução
        messagebox.showinfo("Info", "Funcionalidade de evolução em desenvolvimento")

    def editar_avaliacao_selecionada(self):
        """Edita a avaliação selecionada."""
        if not self.avaliacao_selecionada:
            messagebox.showwarning("Aviso", "Selecione uma avaliação!")
            return
        
        # Implementar edição
        messagebox.showinfo("Info", "Funcionalidade de edição em desenvolvimento")

    def excluir_avaliacao_selecionada(self):
        """Exclui a avaliação selecionada."""
        if not self.avaliacao_selecionada:
            messagebox.showwarning("Aviso", "Selecione uma avaliação!")
            return
        
        resposta = messagebox.askyesno("Confirmação", 
                                      f"Deseja realmente excluir a avaliação de {self.avaliacao_selecionada.aluno.nome}?")
        
        if resposta:
            try:
                avaliacao_dao.excluir(self.avaliacao_selecionada.id)
                messagebox.showinfo("Sucesso", "Avaliação excluída com sucesso!")
                self.carregar_lista_avaliacoes()
                self.avaliacao_selecionada = None
            except Exception as e:
                messagebox.showerror("Erro", f"Erro ao excluir avaliação: {e}")

