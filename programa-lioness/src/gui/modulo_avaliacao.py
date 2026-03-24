#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Módulo de Avaliação Física

Este módulo contém a interface gráfica para avaliação física,
incluindo criação, edição e visualização de avaliações completas.
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime, date
import sys
import os

# Adicionar o diretório pai ao path para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.avaliacao_fisica import AvaliacaoFisica
from data.avaliacao_dao import avaliacao_dao
from data.aluno_dao import aluno_dao
from .exportar_avaliacao import exportar_avaliacao_pdf


class ModuloAvaliacao:
    """
    Classe responsável pela interface de avaliação física.
    
    Contém todas as funcionalidades para criar, editar e gerenciar
    avaliações físicas completas dos alunos.
    """
    
    # Constantes
    PERCENTUAL_GORDURA_IDEAL = 22.5  # Para mulheres
    
    def __init__(self, parent_frame):
        """
        Inicializa o módulo de avaliação.
        
        Args:
            parent_frame: Frame pai onde será inserida a interface
        """
        self.parent_frame = parent_frame
        self.avaliacao_selecionada = None
        self.criar_interface()
    
    def _formatar_valor(self, valor, formato="{:.1f}", unidade="", default="N/A"):
        """
        Formata um valor tratando casos None.
        
        Args:
            valor: Valor a ser formatado
            formato: String de formato (ex: "{:.1f}")
            unidade: Unidade a ser adicionada (ex: " kg", " cm", "%")
            default: Valor padrão se for None
            
        Returns:
            String formatada
        """
        if valor is None:
            return default
        try:
            return f"{formato.format(valor)}{unidade}"
        except (ValueError, TypeError):
            return default
    
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
        
        # Frame de botões
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
        
        self.btn_exportar = tk.Button(frame_acoes,
                                      text="📄 Exportar PDF",
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
        
        # Frame de filtros
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
        
        # Lista de avaliações
        frame_lista = tk.Frame(self.frame_avaliacoes, bg='#FFFFFF')
        frame_lista.pack(fill='both', expand=True, padx=10, pady=(0, 10))
        
        self.criar_lista_avaliacoes(frame_lista)
        self.carregar_combo_alunos_filtro()
    
    def criar_lista_avaliacoes(self, frame):
        """Cria a treeview para exibir a lista de avaliações."""
        colunas = ('ID', 'Aluno', 'Data', 'Peso', 'IMC', '% Gordura', 'Pressão')
        self.tree_avaliacoes = ttk.Treeview(frame, columns=colunas, show='headings')
        
        self.tree_avaliacoes.heading('ID', text='ID')
        self.tree_avaliacoes.heading('Aluno', text='Aluno')
        self.tree_avaliacoes.heading('Data', text='Data')
        self.tree_avaliacoes.heading('Peso', text='Peso')
        self.tree_avaliacoes.heading('IMC', text='IMC')
        self.tree_avaliacoes.heading('% Gordura', text='% Gordura')
        self.tree_avaliacoes.heading('Pressão', text='Pressão')
        
        self.tree_avaliacoes.column('ID', width=50, anchor='center')
        self.tree_avaliacoes.column('Aluno', width=200, anchor='w')
        self.tree_avaliacoes.column('Data', width=100, anchor='center')
        self.tree_avaliacoes.column('Peso', width=80, anchor='center')
        self.tree_avaliacoes.column('IMC', width=80, anchor='center')
        self.tree_avaliacoes.column('% Gordura', width=80, anchor='center')
        self.tree_avaliacoes.column('Pressão', width=100, anchor='center')
        
        self.tree_avaliacoes.pack(fill='both', expand=True)
        self.tree_avaliacoes.bind('<<TreeviewSelect>>', self.selecionar_avaliacao)
        
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
        
        def on_mouse_wheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        
        canvas.bind_all("<MouseWheel>", on_mouse_wheel)
        
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
                text="Data Nascimento:",
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
        
        medidas = [
            ("Pescoço", "circunferencia_pescoco", 0, 0),
            ("Ombro", "circunferencia_ombro", 0, 1),
            ("Peito", "circunferencia_peito", 0, 2),
            ("Cintura", "circunferencia_cintura", 1, 0),
            ("Abdômen", "circunferencia_abdomen", 1, 1),
            ("Quadril", "circunferencia_quadril", 1, 2),
            ("Braço Esq.", "circunferencia_braco_esq", 2, 0),
            ("Braço Dir.", "circunferencia_braco_dir", 2, 1),
            ("RCQ", "rcq", 2, 2),
            ("Coxa Esq.", "circunferencia_coxa_esq", 3, 0),
            ("Coxa Dir.", "circunferencia_coxa_dir", 3, 1),
            ("Panturrilha Esq.", "circunferencia_panturrilha_esq", 4, 0),
            ("Panturrilha Dir.", "circunferencia_panturrilha_dir", 4, 1)
        ]
        
        for label, campo, row, col in medidas:
            tk.Label(frame_perimetricas,
                    text=f"{label}:",
                    bg='#FFFFFF',
                    fg='#333333',
                    font=('Arial', 10, 'bold')).grid(row=row, column=col*2, padx=5, pady=5, sticky='w')
            
            if campo == "rcq":
                entry = tk.Entry(frame_perimetricas, width=10, state='readonly')
            else:
                entry = tk.Entry(frame_perimetricas, width=10)
                # CORREÇÃO: Adicionar binding para calcular RCQ quando cintura ou quadril mudar
                if campo in ["circunferencia_cintura", "circunferencia_quadril"]:
                    entry.bind('<KeyRelease>', self.calcular_rcq)
                else:
                    entry.bind('<KeyRelease>', self.calcular_resultados)
            
            entry.grid(row=row, column=col*2+1, padx=5, pady=5, sticky='w')
            self.campos_avaliacao[campo] = entry
        
        # Seção Dobras Cutâneas (Faulkner)
        frame_dobras = tk.LabelFrame(self.form_frame,
                                    text="Dobras Cutâneas - Protocolo Faulkner (mm)",
                                    bg='#FFFFFF',
                                    fg='#333333',
                                    font=('Arial', 12, 'bold'))
        frame_dobras.pack(fill='x', padx=10, pady=10)
        
        dobras = [
            ("Tricipital", "dobra_triceps", 0),
            ("Subescapular", "dobra_subescapular", 1),
            ("Supra-ilíaca", "dobra_suprailiaca", 2),
            ("Abdominal", "dobra_abdominal", 3)
        ]
        
        for label, campo, col in dobras:
            tk.Label(frame_dobras,
                    text=f"{label}:",
                    bg='#FFFFFF',
                    fg='#333333',
                    font=('Arial', 10, 'bold')).grid(row=0, column=col*2, padx=5, pady=5, sticky='w')
            
            entry = tk.Entry(frame_dobras, width=10)
            entry.grid(row=0, column=col*2+1, padx=5, pady=5, sticky='w')
            entry.bind('<KeyRelease>', self.calcular_resultados)
            self.campos_avaliacao[campo] = entry
        
        tk.Label(frame_dobras,
                text="Soma das Dobras:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).grid(row=1, column=0, padx=5, pady=5, sticky='w')
        self.campos_avaliacao['soma_dobras'] = tk.Entry(frame_dobras, width=10, state='readonly')
        self.campos_avaliacao['soma_dobras'].grid(row=1, column=1, padx=5, pady=5, sticky='w')
        
        # Seção Resultados
        frame_resultados = tk.LabelFrame(self.form_frame,
                                        text="Resultados Calculados",
                                        bg='#FFFFFF',
                                        fg='#333333',
                                        font=('Arial', 12, 'bold'))
        frame_resultados.pack(fill='x', padx=10, pady=10)
        
        resultados = [
            ("% Gordura (Faulkner)", "percentual_gordura", 0, 0),
            ("Massa Gorda (kg)", "massa_gorda", 0, 2),
            ("Massa Magra (kg)", "massa_magra", 1, 0),
            ("Peso Ideal (kg)", "peso_ideal", 1, 2)
        ]
        
        for label, campo, row, col in resultados:
            tk.Label(frame_resultados,
                    text=f"{label}:",
                    bg='#FFFFFF',
                    fg='#333333',
                    font=('Arial', 10, 'bold')).grid(row=row, column=col, padx=5, pady=5, sticky='w')
            
            entry = tk.Entry(frame_resultados, width=12, state='readonly')
            entry.grid(row=row, column=col+1, padx=5, pady=5, sticky='w')
            self.campos_avaliacao[campo] = entry
        
        # Botão Calcular
        btn_calcular = tk.Button(frame_resultados,
                               text="🧮 Calcular",
                               bg='#FFA500',
                               fg='#000000',
                               font=('Arial', 12, 'bold'),
                               command=self.calcular_resultados,
                               relief='flat',
                               padx=20,
                               pady=10)
        btn_calcular.grid(row=2, column=0, columnspan=4, pady=10)
        
        # Seção Observações
        frame_observacoes = tk.LabelFrame(self.form_frame,
                                        text="Observações",
                                        bg='#FFFFFF',
                                        fg='#333333',
                                        font=('Arial', 12, 'bold'))
        frame_observacoes.pack(fill='x', padx=10, pady=10)
        
        self.campos_avaliacao['observacoes'] = tk.Text(frame_observacoes, height=4, width=70)
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
    
    def calcular_soma_dobras(self):
        """Calcula a soma das 4 dobras do protocolo Faulkner."""
        try:
            dobras = ['dobra_triceps', 'dobra_subescapular', 'dobra_suprailiaca', 'dobra_abdominal']
            soma = 0
            for dobra in dobras:
                valor = self.campos_avaliacao[dobra].get()
                if valor:
                    soma += float(valor)
            
            self.campos_avaliacao['soma_dobras'].config(state='normal')
            self.campos_avaliacao['soma_dobras'].delete(0, tk.END)
            self.campos_avaliacao['soma_dobras'].insert(0, f"{soma:.1f}" if soma > 0 else "")
            self.campos_avaliacao['soma_dobras'].config(state='readonly')
            return soma
        except ValueError:
            return 0
    
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
            else:
                # Se não tiver os valores, limpar o campo RCQ
                self.campos_avaliacao['rcq'].config(state='normal')
                self.campos_avaliacao['rcq'].delete(0, tk.END)
                self.campos_avaliacao['rcq'].config(state='readonly')
        except (ValueError, ZeroDivisionError):
            # Em caso de erro, limpar o campo RCQ
            self.campos_avaliacao['rcq'].config(state='normal')
            self.campos_avaliacao['rcq'].delete(0, tk.END)
            self.campos_avaliacao['rcq'].config(state='readonly')
    
    def calcular_percentual_gordura_faulkner(self, soma_dobras):
        """
        Calcula o percentual de gordura usando o protocolo Faulkner.
        
        Fórmula: %G = (TR + SB + SI + AB) * 0.153 + 5.783
        """
        if soma_dobras and soma_dobras > 0:
            percentual = (soma_dobras * 0.153) + 5.783
            return max(5, min(50, percentual))
        return None
    
    def calcular_resultados(self, event=None):
        """Calcula IMC, percentual de gordura, massa gorda, massa magra, peso ideal e RCQ."""
        try:
            # Calcular RCQ primeiro
            self.calcular_rcq()
            
            altura_text = self.campos_avaliacao['altura'].get().strip().replace(',', '.')
            peso_text = self.campos_avaliacao['peso'].get().strip().replace(',', '.')
            
            if altura_text and peso_text:
                altura = float(altura_text)
                peso = float(peso_text)
                
                if altura <= 0 or peso <= 0:
                    return
                
                # Converter altura de cm para m se necessário
                if altura > 10:
                    altura = altura / 100
                
                # Calcular IMC
                imc = peso / (altura ** 2)
                self.campos_avaliacao['imc'].config(state='normal')
                self.campos_avaliacao['imc'].delete(0, tk.END)
                self.campos_avaliacao['imc'].insert(0, f"{imc:.1f}")
                self.campos_avaliacao['imc'].config(state='readonly')
                
                # Calcular soma das dobras e percentual de gordura (Faulkner)
                soma_dobras = self.calcular_soma_dobras()
                percentual = self.calcular_percentual_gordura_faulkner(soma_dobras)
                
                if percentual:
                    self.campos_avaliacao['percentual_gordura'].config(state='normal')
                    self.campos_avaliacao['percentual_gordura'].delete(0, tk.END)
                    self.campos_avaliacao['percentual_gordura'].insert(0, f"{percentual:.1f}")
                    self.campos_avaliacao['percentual_gordura'].config(state='readonly')
                    
                    # Calcular massa gorda
                    massa_gorda = peso * (percentual / 100)
                    self.campos_avaliacao['massa_gorda'].config(state='normal')
                    self.campos_avaliacao['massa_gorda'].delete(0, tk.END)
                    self.campos_avaliacao['massa_gorda'].insert(0, f"{massa_gorda:.1f}")
                    self.campos_avaliacao['massa_gorda'].config(state='readonly')
                    
                    # Calcular massa magra
                    massa_magra = peso - massa_gorda
                    self.campos_avaliacao['massa_magra'].config(state='normal')
                    self.campos_avaliacao['massa_magra'].delete(0, tk.END)
                    self.campos_avaliacao['massa_magra'].insert(0, f"{massa_magra:.1f}")
                    self.campos_avaliacao['massa_magra'].config(state='readonly')
                    
                    # Calcular peso ideal (para mulheres: 22.5% de gordura ideal)
                    percentual_ideal = self.PERCENTUAL_GORDURA_IDEAL
                    peso_ideal = massa_magra / (1 - percentual_ideal / 100)
                    
                    self.campos_avaliacao['peso_ideal'].config(state='normal')
                    self.campos_avaliacao['peso_ideal'].delete(0, tk.END)
                    self.campos_avaliacao['peso_ideal'].insert(0, f"{peso_ideal:.1f}")
                    self.campos_avaliacao['peso_ideal'].config(state='readonly')
                    
        except Exception as e:
            print(f"Erro no cálculo: {str(e)}")
    
    def carregar_combo_alunos(self):
        """Carrega a lista de alunos no combobox."""
        try:
            alunos = aluno_dao.listar_todos_alunos()
            valores = [f"{aluno.id} - {aluno.nome}" for aluno in alunos if aluno.ativo]
            self.combo_aluno['values'] = valores
        except Exception as e:
            print(f"Erro ao carregar alunos: {str(e)}")
    
    def carregar_combo_alunos_filtro(self):
        """Carrega a lista de alunos no combobox de filtro."""
        try:
            alunos = aluno_dao.listar_todos_alunos()
            valores = ["TODOS"] + [f"{aluno.id} - {aluno.nome}" for aluno in alunos if aluno.ativo]
            self.combo_aluno_filtro['values'] = valores
            self.combo_aluno_filtro.set("TODOS")
        except Exception as e:
            print(f"Erro ao carregar alunos para filtro: {str(e)}")
    
    def atualizar_dados_aluno(self, event=None):
        """Atualiza os dados do aluno selecionado."""
        try:
            for campo in ['nome', 'sexo', 'idade', 'data_nascimento']:
                self.campos_avaliacao[campo].config(state='normal')
                self.campos_avaliacao[campo].delete(0, tk.END)
                self.campos_avaliacao[campo].config(state='readonly')
            
            selecao = self.combo_aluno.get()
            if not selecao:
                return
            
            aluno_id = int(selecao.split(' - ')[0])
            aluno = aluno_dao.buscar_aluno_por_id(aluno_id)
            
            if not aluno:
                return
            
            self._atualizar_campo('nome', aluno.nome)
            self._atualizar_campo('sexo', 'Feminino')
            
            if aluno.data_nascimento:
                hoje = date.today()
                idade = hoje.year - aluno.data_nascimento.year
                if (hoje.month, hoje.day) < (aluno.data_nascimento.month, aluno.data_nascimento.day):
                    idade -= 1
                self._atualizar_campo('idade', f"{idade} anos")
                self._atualizar_campo('data_nascimento', aluno.data_nascimento.strftime('%d/%m/%Y'))
            else:
                self._atualizar_campo('idade', "N/A")
                self._atualizar_campo('data_nascimento', "N/A")
                
        except Exception as e:
            print(f"Erro ao atualizar dados do aluno: {str(e)}")
    
    def _atualizar_campo(self, campo, valor):
        """Método auxiliar para atualizar um campo de forma segura."""
        try:
            self.campos_avaliacao[campo].config(state='normal')
            self.campos_avaliacao[campo].delete(0, tk.END)
            self.campos_avaliacao[campo].insert(0, str(valor) if valor is not None else "")
            self.campos_avaliacao[campo].config(state='readonly')
        except Exception as e:
            print(f"Erro ao atualizar campo {campo}: {str(e)}")
    
    def salvar_avaliacao(self):
        """Salva a avaliação no banco de dados."""
        try:
            if not self.combo_aluno.get():
                messagebox.showerror("Erro", "Selecione um aluno!")
                return
            
            if not self.campos_avaliacao['altura'].get():
                messagebox.showerror("Erro", "Preencha a altura!")
                return
            
            if not self.campos_avaliacao['peso'].get():
                messagebox.showerror("Erro", "Preencha o peso!")
                return
            
            aluno_id = int(self.combo_aluno.get().split(' - ')[0])
            
            altura_text = self.campos_avaliacao['altura'].get().strip().replace(',', '.')
            altura = float(altura_text)
            if altura > 10:
                altura = altura / 100
            
            def get_float(campo):
                valor = self.campos_avaliacao[campo].get().strip()
                return float(valor) if valor else None
            
            def get_int(campo):
                valor = self.campos_avaliacao[campo].get().strip()
                return int(valor) if valor else None
            
            avaliacao = AvaliacaoFisica(
                aluno_id=aluno_id,
                data_avaliacao=date.today(),
                altura=altura,
                peso=float(self.campos_avaliacao['peso'].get().strip().replace(',', '.') or 0),
                percentual_gordura=get_float('percentual_gordura'),
                massa_gorda=get_float('massa_gorda'),
                pressao_arterial=self.campos_avaliacao['pressao_arterial'].get() or None,
                frequencia_cardiaca=get_int('frequencia_cardiaca'),
                circunferencia_pescoco=get_float('circunferencia_pescoco'),
                circunferencia_ombro=get_float('circunferencia_ombro'),
                circunferencia_peito=get_float('circunferencia_peito'),
                circunferencia_cintura=get_float('circunferencia_cintura'),
                circunferencia_abdomen=get_float('circunferencia_abdomen'),
                circunferencia_quadril=get_float('circunferencia_quadril'),
                circunferencia_braco_esq=get_float('circunferencia_braco_esq'),
                circunferencia_braco_dir=get_float('circunferencia_braco_dir'),
                circunferencia_coxa_esq=get_float('circunferencia_coxa_esq'),
                circunferencia_coxa_dir=get_float('circunferencia_coxa_dir'),
                circunferencia_panturrilha_esq=get_float('circunferencia_panturrilha_esq'),
                circunferencia_panturrilha_dir=get_float('circunferencia_panturrilha_dir'),
                dobra_triceps=get_float('dobra_triceps'),
                dobra_subescapular=get_float('dobra_subescapular'),
                dobra_suprailiaca=get_float('dobra_suprailiaca'),
                dobra_abdominal=get_float('dobra_abdominal'),
                observacoes=self.campos_avaliacao['observacoes'].get('1.0', tk.END).strip() or None,
                protocolo="Faulkner"
            )
            
            avaliacao_dao.salvar_avaliacao(avaliacao)
            
            messagebox.showinfo("Sucesso", "Avaliação salva com sucesso!")
            self.limpar_campos()
            self.carregar_lista_avaliacoes()
            self.notebook.select(0)
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao salvar avaliação: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def limpar_campos(self):
        """Limpa todos os campos do formulário."""
        self.combo_aluno.set('')
        
        for campo, widget in self.campos_avaliacao.items():
            if isinstance(widget, tk.Entry):
                widget.config(state='normal')
                widget.delete(0, tk.END)
                if campo in ['imc', 'rcq', 'soma_dobras', 'percentual_gordura', 
                            'massa_gorda', 'massa_magra', 'peso_ideal', 'nome', 
                            'sexo', 'idade', 'data_nascimento']:
                    widget.config(state='readonly')
            elif isinstance(widget, tk.Text):
                widget.delete('1.0', tk.END)
    
    def carregar_lista_avaliacoes(self):
        """Carrega a lista de avaliações na treeview."""
        try:
            for item in self.tree_avaliacoes.get_children():
                self.tree_avaliacoes.delete(item)
            
            avaliacoes = avaliacao_dao.listar_todas_avaliacoes()
            
            for avaliacao in avaliacoes:
                aluno = aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id)
                nome_aluno = aluno.nome if aluno else "Desconhecido"
                
                self.tree_avaliacoes.insert('', 'end', values=(
                    avaliacao.id,
                    nome_aluno,
                    avaliacao.data_avaliacao.strftime('%d/%m/%Y') if avaliacao.data_avaliacao else "N/A",
                    self._formatar_valor(avaliacao.peso, "{:.1f}", " kg"),
                    self._formatar_valor(avaliacao.imc, "{:.1f}", ""),
                    self._formatar_valor(avaliacao.percentual_gordura, "{:.1f}", "%"),
                    avaliacao.pressao_arterial or "N/A"
                ))
        except Exception as e:
            print(f"Erro ao carregar lista: {str(e)}")
    
    def selecionar_avaliacao(self, event=None):
        """Seleciona uma avaliação na lista."""
        selecionado = self.tree_avaliacoes.focus()
        if selecionado:
            item = self.tree_avaliacoes.item(selecionado)
            avaliacao_id = item['values'][0]
            self.avaliacao_selecionada = avaliacao_dao.buscar_avaliacao_por_id(avaliacao_id)
            
            self.btn_visualizar['state'] = 'normal'
            self.btn_editar['state'] = 'normal'
            self.btn_excluir['state'] = 'normal'
            self.btn_evolucao['state'] = 'normal'
            self.btn_exportar['state'] = 'normal'
        else:
            self.avaliacao_selecionada = None
            self.btn_visualizar['state'] = 'disabled'
            self.btn_editar['state'] = 'disabled'
            self.btn_excluir['state'] = 'disabled'
            self.btn_evolucao['state'] = 'disabled'
            self.btn_exportar['state'] = 'disabled'
    
    def visualizar_avaliacao_selecionada(self):
        """Visualiza a avaliação selecionada."""
        if not self.avaliacao_selecionada:
            return
        
        janela = tk.Toplevel(self.parent_frame)
        janela.title("Visualizar Avaliação")
        janela.geometry("800x600")
        
        # Scroll
        canvas = tk.Canvas(janela)
        scrollbar = ttk.Scrollbar(janela, orient='vertical', command=canvas.yview)
        scrollable_frame = tk.Frame(canvas)
        
        scrollable_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        avaliacao = self.avaliacao_selecionada
        aluno = aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id)
        
        if not aluno:
            messagebox.showerror("Erro", "Aluno não encontrado!")
            janela.destroy()
            return
        
        # Cabeçalho
        tk.Label(scrollable_frame, text=f"Avaliação Física - {aluno.nome.upper()}",
                font=('Arial', 16, 'bold')).pack(pady=10)
        
        # Informações Básicas
        frame_info = tk.LabelFrame(scrollable_frame, text="Informações Básicas", padx=10, pady=10)
        frame_info.pack(fill='x', padx=10, pady=5)
        
        # Recalcular peso ideal
        massa_magra = avaliacao.peso * (1 - avaliacao.percentual_gordura/100) if avaliacao.peso and avaliacao.percentual_gordura else None
        peso_ideal_calc = massa_magra / (1 - self.PERCENTUAL_GORDURA_IDEAL/100) if massa_magra else None
        
        dados = [
            ("Data", avaliacao.data_avaliacao.strftime('%d/%m/%Y')),
            ("Protocolo", "Faulkner"),
            ("Nome", aluno.nome),
            ("Sexo", "Feminino"),
            ("Idade", f"{self.calcular_idade(aluno.data_nascimento)} anos"),
            ("Peso", self._formatar_valor(avaliacao.peso, "{:.1f}", " kg")),
            ("Altura", self._formatar_valor(avaliacao.altura*100, "{:.1f}", " cm")),
            ("IMC", self._formatar_valor(avaliacao.imc, "{:.1f}", "")),
            ("Classificação IMC", self.classificar_imc(avaliacao.imc)),
            ("% Gordura", self._formatar_valor(avaliacao.percentual_gordura, "{:.1f}", "%")),
            ("Massa Gorda", self._formatar_valor(avaliacao.massa_gorda, "{:.1f}", " kg")),
            ("Massa Magra", self._formatar_valor(massa_magra, "{:.1f}", " kg")),
            ("Peso Ideal", self._formatar_valor(peso_ideal_calc, "{:.1f}", " kg")),
            ("RCQ", self._formatar_valor(avaliacao.relacao_cintura_quadril, "{:.2f}", "")),
            ("Classificação RCQ", self.classificar_rcq(avaliacao.relacao_cintura_quadril)),
            ("Pressão Arterial", avaliacao.pressao_arterial or "N/A"),
            ("Frequência Cardíaca", str(avaliacao.frequencia_cardiaca) if avaliacao.frequencia_cardiaca else "N/A")
        ]
        
        for i, (label, valor) in enumerate(dados):
            tk.Label(frame_info, text=f"{label}:", font=('Arial', 10, 'bold')).grid(row=i, column=0, sticky='w', padx=5, pady=2)
            tk.Label(frame_info, text=valor).grid(row=i, column=1, sticky='w', padx=5, pady=2)
        
        # Medidas
        frame_medidas = tk.LabelFrame(scrollable_frame, text="Medidas Perimétricas (cm)", padx=10, pady=10)
        frame_medidas.pack(fill='x', padx=10, pady=5)
        
        medidas = [
            ("Pescoço", avaliacao.circunferencia_pescoco),
            ("Ombro", avaliacao.circunferencia_ombro),
            ("Peito", avaliacao.circunferencia_peito),
            ("Cintura", avaliacao.circunferencia_cintura),
            ("Abdômen", avaliacao.circunferencia_abdomen),
            ("Quadril", avaliacao.circunferencia_quadril),
            ("Braço Esq.", avaliacao.circunferencia_braco_esq),
            ("Braço Dir.", avaliacao.circunferencia_braco_dir),
            ("Coxa Esq.", avaliacao.circunferencia_coxa_esq),
            ("Coxa Dir.", avaliacao.circunferencia_coxa_dir),
            ("Panturrilha Esq.", avaliacao.circunferencia_panturrilha_esq),
            ("Panturrilha Dir.", avaliacao.circunferencia_panturrilha_dir)
        ]
        
        for i, (label, valor) in enumerate(medidas):
            tk.Label(frame_medidas, text=f"{label}:", font=('Arial', 10, 'bold')).grid(row=i//3, column=(i%3)*2, sticky='w', padx=5, pady=2)
            tk.Label(frame_medidas, text=self._formatar_valor(valor, "{:.1f}", "")).grid(row=i//3, column=(i%3)*2+1, sticky='w', padx=5, pady=2)
        
        # Dobras Faulkner
        frame_dobras = tk.LabelFrame(scrollable_frame, text="Dobras Cutâneas - Faulkner (mm)", padx=10, pady=10)
        frame_dobras.pack(fill='x', padx=10, pady=5)
        
        dobras = [
            ("Tricipital", avaliacao.dobra_triceps),
            ("Subescapular", avaliacao.dobra_subescapular),
            ("Supra-ilíaca", avaliacao.dobra_suprailiaca),
            ("Abdominal", avaliacao.dobra_abdominal)
        ]
        
        soma = sum([v for v in [avaliacao.dobra_triceps, avaliacao.dobra_subescapular, 
                                 avaliacao.dobra_suprailiaca, avaliacao.dobra_abdominal] if v])
        
        for i, (label, valor) in enumerate(dobras):
            tk.Label(frame_dobras, text=f"{label}:", font=('Arial', 10, 'bold')).grid(row=0, column=i*2, sticky='w', padx=5, pady=2)
            tk.Label(frame_dobras, text=self._formatar_valor(valor, "{:.1f}", "")).grid(row=0, column=i*2+1, sticky='w', padx=5, pady=2)
        
        tk.Label(frame_dobras, text="Soma:", font=('Arial', 10, 'bold')).grid(row=1, column=0, sticky='w', padx=5, pady=2)
        tk.Label(frame_dobras, text=self._formatar_valor(soma if soma > 0 else None, "{:.1f}", "")).grid(row=1, column=1, sticky='w', padx=5, pady=2)
        
        # Observações
        if avaliacao.observacoes:
            frame_obs = tk.LabelFrame(scrollable_frame, text="Observações", padx=10, pady=10)
            frame_obs.pack(fill='x', padx=10, pady=5)
            tk.Label(frame_obs, text=avaliacao.observacoes, wraplength=750, justify='left').pack(anchor='w')
        
        btn_fechar = tk.Button(scrollable_frame, text="Fechar", bg='#E74C3C', fg='#FFFFFF',
                              font=('Arial', 10, 'bold'), command=janela.destroy, padx=20, pady=5)
        btn_fechar.pack(pady=10)
    
    def classificar_imc(self, imc):
        """Classifica o IMC."""
        if imc is None:
            return "N/A"
        if imc < 18.5:
            return "Abaixo do peso"
        elif imc < 25:
            return "Peso normal"
        elif imc < 30:
            return "Sobrepeso"
        return "Obesidade"
    
    def classificar_rcq(self, rcq):
        """Classifica a RCQ para mulheres."""
        if rcq is None:
            return "N/A"
        if rcq < 0.71:
            return "Risco Baixo"
        elif rcq < 0.78:
            return "Risco Moderado"
        elif rcq < 0.82:
            return "Risco Alto"
        return "Risco Muito Alto"
    
    def calcular_idade(self, data_nascimento):
        """Calcula a idade."""
        if not data_nascimento:
            return 0
        hoje = date.today()
        idade = hoje.year - data_nascimento.year
        if (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day):
            idade -= 1
        return idade
    
    def exportar_avaliacao_selecionada(self):
        """Exporta a avaliação para PDF."""
        if not self.avaliacao_selecionada:
            return
        filepath = filedialog.asksaveasfilename(defaultextension=".pdf", filetypes=[("PDF Files", "*.pdf")])
        if filepath:
            try:
                exportar_avaliacao_pdf(self.avaliacao_selecionada.id, filepath)
                messagebox.showinfo("Sucesso", "Avaliação exportada com sucesso!")
            except Exception as e:
                messagebox.showerror("Erro", f"Falha ao exportar: {str(e)}")
    
    def mostrar_evolucao(self):
        """Mostra evolução das avaliações."""
        if not self.avaliacao_selecionada:
            return
        messagebox.showinfo("Em desenvolvimento", "Funcionalidade em desenvolvimento")
    
    def editar_avaliacao_selecionada(self):
        """Edita avaliação selecionada."""
        if not self.avaliacao_selecionada:
            return
        self.notebook.select(1)
        avaliacao = self.avaliacao_selecionada
        aluno = aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id)
        if aluno:
            self.combo_aluno.set(f"{aluno.id} - {aluno.nome}")
            self.atualizar_dados_aluno()
        
        self.campos_avaliacao['altura'].delete(0, tk.END)
        self.campos_avaliacao['altura'].insert(0, f"{avaliacao.altura:.2f}" if avaliacao.altura < 10 else f"{avaliacao.altura/100:.2f}")
        
        self.campos_avaliacao['peso'].delete(0, tk.END)
        self.campos_avaliacao['peso'].insert(0, str(avaliacao.peso))
        
        self.campos_avaliacao['pressao_arterial'].delete(0, tk.END)
        if avaliacao.pressao_arterial:
            self.campos_avaliacao['pressao_arterial'].insert(0, avaliacao.pressao_arterial)
        
        self.campos_avaliacao['frequencia_cardiaca'].delete(0, tk.END)
        if avaliacao.frequencia_cardiaca:
            self.campos_avaliacao['frequencia_cardiaca'].insert(0, str(avaliacao.frequencia_cardiaca))
        
        for campo in ['circunferencia_pescoco', 'circunferencia_ombro', 'circunferencia_peito',
                      'circunferencia_cintura', 'circunferencia_abdomen', 'circunferencia_quadril',
                      'circunferencia_braco_esq', 'circunferencia_braco_dir', 'circunferencia_coxa_esq',
                      'circunferencia_coxa_dir', 'circunferencia_panturrilha_esq', 'circunferencia_panturrilha_dir']:
            self.campos_avaliacao[campo].delete(0, tk.END)
            valor = getattr(avaliacao, campo, None)
            if valor:
                self.campos_avaliacao[campo].insert(0, str(valor))
        
        for campo in ['dobra_triceps', 'dobra_subescapular', 'dobra_suprailiaca', 'dobra_abdominal']:
            self.campos_avaliacao[campo].delete(0, tk.END)
            valor = getattr(avaliacao, campo, None)
            if valor:
                self.campos_avaliacao[campo].insert(0, str(valor))
        
        self.campos_avaliacao['observacoes'].delete('1.0', tk.END)
        if avaliacao.observacoes:
            self.campos_avaliacao['observacoes'].insert('1.0', avaliacao.observacoes)
        
        self.calcular_resultados()
    
    def excluir_avaliacao_selecionada(self):
        """Exclui avaliação selecionada."""
        if not self.avaliacao_selecionada:
            return
        if messagebox.askyesno("Confirmar", "Deseja excluir esta avaliação?"):
            try:
                avaliacao_dao.excluir_avaliacao(self.avaliacao_selecionada.id)
                messagebox.showinfo("Sucesso", "Avaliação excluída!")
                self.carregar_lista_avaliacoes()
                self.avaliacao_selecionada = None
                self.btn_visualizar['state'] = 'disabled'
                self.btn_editar['state'] = 'disabled'
                self.btn_excluir['state'] = 'disabled'
                self.btn_evolucao['state'] = 'disabled'
                self.btn_exportar['state'] = 'disabled'
            except Exception as e:
                messagebox.showerror("Erro", f"Erro ao excluir: {str(e)}")
    
    def abrir_nova_avaliacao(self):
        """Abre aba de nova avaliação."""
        self.notebook.select(1)
        self.limpar_campos()
        self.avaliacao_selecionada = None
        self.btn_visualizar['state'] = 'disabled'
        self.btn_editar['state'] = 'disabled'
        self.btn_excluir['state'] = 'disabled'
        self.btn_evolucao['state'] = 'disabled'
        self.btn_exportar['state'] = 'disabled'
    
    def filtrar_por_aluno(self, event=None):
        """Filtra avaliações por aluno."""
        selecao = self.combo_aluno_filtro.get()
        if not selecao or selecao.upper() == "TODOS":
            self.carregar_lista_avaliacoes()
            return
        try:
            aluno_id = int(selecao.split(' - ')[0])
            avaliacoes = avaliacao_dao.buscar_avaliacoes_por_aluno(aluno_id)
            
            for item in self.tree_avaliacoes.get_children():
                self.tree_avaliacoes.delete(item)
            
            for avaliacao in avaliacoes:
                aluno = aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id)
                nome_aluno = aluno.nome if aluno else "Desconhecido"
                self.tree_avaliacoes.insert('', 'end', values=(
                    avaliacao.id, nome_aluno,
                    avaliacao.data_avaliacao.strftime('%d/%m/%Y'),
                    self._formatar_valor(avaliacao.peso, "{:.1f}", " kg"),
                    self._formatar_valor(avaliacao.imc, "{:.1f}", ""),
                    self._formatar_valor(avaliacao.percentual_gordura, "{:.1f}", "%"),
                    avaliacao.pressao_arterial or "N/A"
                ))
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao filtrar: {str(e)}")
    
    def limpar_filtro(self):
        """Limpa filtro."""
        self.combo_aluno_filtro.set("TODOS")
        self.carregar_lista_avaliacoes()