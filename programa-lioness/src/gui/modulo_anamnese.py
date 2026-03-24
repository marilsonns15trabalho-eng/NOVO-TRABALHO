#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Módulo de Anamnese Nutricional CORRIGIDO

Este módulo contém a interface gráfica para anamnese nutricional,
incluindo criação, edição, visualização e exportação em PDF de anamneses completas.
VERSÃO CORRIGIDA - Agora salva todos os campos incluindo comboboxes.
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime, date
import sys
import os
from typing import Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

# Adicionar o diretório pai ao path para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.anamnese import AnamneseNutricional
from models.aluno import Aluno
from data.anamnese_dao import anamnese_dao
from data.aluno_dao import aluno_dao

class ModuloAnamnese:
    """
    Classe responsável pela interface de anamnese nutricional CORRIGIDA.
    
    Contém funcionalidades para criar, editar, visualizar e exportar
    anamneses nutricionais completas dos alunos.
    """
    
    def __init__(self, parent_frame):
        """
        Inicializa o módulo de anamnese.
        
        Args:
            parent_frame: Frame pai onde será inserida a interface
        """
        self.parent_frame = parent_frame
        self.anamnese_selecionada = None
        self.alunos_dict = {}
        self.criar_interface()
    
    def criar_interface(self):
        """Cria a interface principal do módulo de anamnese."""
        for widget in self.parent_frame.winfo_children():
            widget.destroy()
        
        self.main_frame = tk.Frame(self.parent_frame, bg='#FFFFFF')
        self.main_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        titulo = tk.Label(self.main_frame,
                         text='Anamnese Nutricional - VERSÃO CORRIGIDA',
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 18, 'bold'))
        titulo.pack(pady=(0, 20))
        
        self.notebook = ttk.Notebook(self.main_frame)
        self.notebook.pack(fill='both', expand=True)
        
        self.criar_aba_anamneses()
        self.criar_aba_nova_anamnese()
        
        self.carregar_lista_anamneses()
        self.carregar_combo_alunos()
    
    def criar_aba_anamneses(self):
        """Cria a aba de listagem de anamneses."""
        self.frame_anamneses = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_anamneses, text='📋 Anamneses')
        
        frame_acoes = tk.Frame(self.frame_anamneses, bg='#FFFFFF')
        frame_acoes.pack(fill='x', pady=(10, 20), padx=10)
        
        btn_nova = tk.Button(frame_acoes,
                            text='➕ Nova Anamnese',
                            bg='#FFA500',
                            fg='#000000',
                            font=('Arial', 10, 'bold'),
                            command=self.abrir_nova_anamnese,
                            relief='flat',
                            padx=15,
                            pady=8)
        btn_nova.pack(side='left', padx=(0, 10))
        
        self.btn_visualizar = tk.Button(frame_acoes,
                                       text='👁️ Visualizar',
                                       bg='#3498DB',
                                       fg='#FFFFFF',
                                       font=('Arial', 10, 'bold'),
                                       command=self.visualizar_anamnese_selecionada,
                                       relief='flat',
                                       padx=15,
                                       pady=8,
                                       state='disabled')
        self.btn_visualizar.pack(side='left', padx=(0, 10))
     
        self.btn_editar = tk.Button(frame_acoes,
                                   text='✏️ Editar',
                                   bg='#333333',
                                   fg='#FFFFFF',
                                   font=('Arial', 10, 'bold'),
                                   command=self.editar_anamnese_selecionada,
                                   relief='flat',
                                   padx=15,
                                   pady=8,
                                   state='disabled')
        self.btn_editar.pack(side='left', padx=(0, 10))
        
        self.btn_exportar = tk.Button(frame_acoes,
                                     text='📄 Exportar PDF',
                                     bg='#4ECDC4',
                                     fg='#000000',
                                     font=('Arial', 10, 'bold'),
                                     command=self.exportar_anamnese_pdf,
                                     relief='flat',
                                     padx=15,
                                     pady=8,
                                     state='disabled')
        self.btn_exportar.pack(side='left', padx=(0, 10))
        
        self.btn_excluir = tk.Button(frame_acoes,
                                    text='🗑️ Excluir',
                                    bg='#FF6B6B',
                                    fg='#FFFFFF',
                                    font=('Arial', 10, 'bold'),
                                    command=self.excluir_anamnese_selecionada,
                                    relief='flat',
                                    padx=15,
                                    pady=8,
                                    state='disabled')
        self.btn_excluir.pack(side='left', padx=(0, 10))
        
        btn_atualizar = tk.Button(frame_acoes,
                                 text='🔄 Atualizar',
                                 bg='#95A5A6',
                                 fg='#FFFFFF',
                                 font=('Arial', 10, 'bold'),
                                 command=self.carregar_lista_anamneses,
                                 relief='flat',
                                 padx=15,
                                 pady=8)
        btn_atualizar.pack(side='right')
        
        frame_filtros = tk.Frame(self.frame_anamneses, bg='#FFFFFF')
        frame_filtros.pack(fill='x', pady=(0, 20), padx=10)
        
        tk.Label(frame_filtros,
                text='Filtrar por aluno:',
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10)).pack(side='left', padx=(0, 10))
        
        self.combo_filtro_aluno = ttk.Combobox(frame_filtros,
                                              state='readonly',
                                              width=40)
        self.combo_filtro_aluno.pack(side='left')
        self.combo_filtro_aluno.bind('<<ComboboxSelected>>', self.filtrar_anamneses)
        
        frame_lista = tk.Frame(self.frame_anamneses, bg='#FFFFFF')
        frame_lista.pack(fill='both', expand=True, padx=10)
        
        columns = ('ID', 'Aluno', 'Data Anamnese', 'Peso', 'Altura', 'IMC')
        self.tree_anamneses = ttk.Treeview(frame_lista,
                                          columns=columns,
                                          show='headings',
                                          height=12)
        
        for col in columns:
            self.tree_anamneses.heading(col, text=col)
            self.tree_anamneses.column(col, anchor='center')
        
        self.tree_anamneses.column('ID', width=50)
        self.tree_anamneses.column('Aluno', width=200)
        self.tree_anamneses.column('Data Anamnese', width=120)
        self.tree_anamneses.column('Peso', width=80)
        self.tree_anamneses.column('Altura', width=80)
        self.tree_anamneses.column('IMC', width=100)
        
        self.tree_anamneses.pack(fill='both', expand=True)
        
        scrollbar = ttk.Scrollbar(frame_lista, orient='vertical', command=self.tree_anamneses.yview)
        scrollbar.pack(side='right', fill='y')
        self.tree_anamneses.configure(yscrollcommand=scrollbar.set)
        
        self.tree_anamneses.bind('<<TreeviewSelect>>', self.selecionar_anamnese)
    
    def criar_aba_nova_anamnese(self):
        """Cria a aba para registrar/editar anamnese nutricional."""
        self.frame_nova_anamnese = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_nova_anamnese, text='➕ Nova Anamnese')
        
        # Canvas com barra de rolagem
        canvas = tk.Canvas(self.frame_nova_anamnese, bg='#FFFFFF')
        scrollbar = ttk.Scrollbar(self.frame_nova_anamnese, orient='vertical', command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#FFFFFF')
        
        scrollable_frame.bind(
            '<Configure>',
            lambda e: canvas.configure(scrollregion=canvas.bbox('all'))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor='nw')
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side='left', fill='both', expand=True)
        scrollbar.pack(side='right', fill='y')
        
        # Adicionar suporte ao scroll do mouse
        def on_mouse_wheel(event):
            canvas.yview_scroll(-1 if event.delta > 0 else 1, 'units')

        # Bindings para Windows e Linux
        canvas.bind('<MouseWheel>', on_mouse_wheel)  # Windows
        canvas.bind('<Button-4>', lambda e: canvas.yview_scroll(-1, 'units'))  # Linux (scroll para cima)
        canvas.bind('<Button-5>', lambda e: canvas.yview_scroll(1, 'units'))   # Linux (scroll para baixo)

        # Título
        titulo = tk.Label(scrollable_frame,
                         text='Registrar Anamnese Nutricional',
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 16, 'bold'))
        titulo.pack(pady=(20, 30))
        
        self.campos_anamnese = {}
        
        # 1. Dados Pessoais
        tk.Label(scrollable_frame, text='1. Dados Pessoais', bg='#FFFFFF', fg='#FFA500', font=('Arial', 12, 'bold')).pack(anchor='w', padx=20, pady=(10, 5))
        
        frame_aluno = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_aluno.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_aluno, text='Aluno *:', bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.combo_aluno = ttk.Combobox(frame_aluno, state='readonly', width=40)
        self.combo_aluno.pack(anchor='w', pady=(5, 0))
        self.combo_aluno.bind('<<ComboboxSelected>>', self.carregar_dados_aluno)
        
        # 2. Dados Antropométricos
        tk.Label(scrollable_frame, text='2. Dados Antropométricos', bg='#FFFFFF', fg='#FFA500', font=('Arial', 12, 'bold')).pack(anchor='w', padx=20, pady=(20, 5))
        
        campos_antropometricos = [
            ('Altura (cm) *', 'entry', 10),
            ('Peso atual (kg) *', 'entry', 10),
            ('Peso habitual (kg)', 'entry', 10),
            ('Circunferência abdominal (cm)', 'entry', 10),
            ('Circunferência do quadril (cm)', 'entry', 10),
            ('Medidas de cintura, quadril, coxa', 'text', 4),
            ('Objetivo nutricional', 'text', 4)
        ]
        
        for label, tipo, tamanho in campos_antropometricos:
            frame = tk.Frame(scrollable_frame, bg='#FFFFFF')
            frame.pack(fill='x', padx=20, pady=5)
            tk.Label(frame, text=f'{label}:', bg='#FFFFFF', fg='#333333', font=('Arial', 10)).pack(anchor='w')
            if tipo == 'entry':
                self.campos_anamnese[label] = tk.Entry(frame, font=('Arial', 10), width=tamanho)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
            elif tipo == 'text':
                self.campos_anamnese[label] = tk.Text(frame, font=('Arial', 10), width=50, height=tamanho)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
        
        # 3. Histórico de Saúde
        tk.Label(scrollable_frame, text='3. Histórico de Saúde', bg='#FFFFFF', fg='#FFA500', font=('Arial', 12, 'bold')).pack(anchor='w', padx=20, pady=(20, 5))
        
        campos_saude = [
            ('Possui alguma doença crônica?', 'combobox', ['', 'Não', 'Sim']),
            ('Faz uso de medicação? Quais?', 'text', 4),
            ('Já teve algum problema cardíaco, renal, hepático, ou outro?', 'combobox', ['', 'Não', 'Sim']),
            ('Já realizou cirurgia? Qual e quando?', 'text', 4),
            ('Possui alergias ou intolerâncias alimentares? Quais?', 'text', 4),
            ('Sofre de alguma condição hormonal?', 'combobox', ['', 'Não', 'Sim']),
            ('Já fez ou faz acompanhamento psicológico?', 'combobox', ['', 'Não', 'Sim']),
            ('Apresenta distúrbios alimentares?', 'combobox', ['', 'Não', 'Sim']),
            ('Está grávida ou amamentando?', 'combobox', ['', 'Não', 'Sim', 'Não se aplica']),
            ('Já fez acompanhamento nutricional antes?', 'combobox', ['', 'Não', 'Sim']),
            ('Tem histórico familiar de doenças relacionadas à alimentação?', 'combobox', ['', 'Não', 'Sim'])
        ]
        
        for label, tipo, tamanho in campos_saude:
            frame = tk.Frame(scrollable_frame, bg='#FFFFFF')
            frame.pack(fill='x', padx=20, pady=5)
            tk.Label(frame, text=f'{label}:', bg='#FFFFFF', fg='#333333', font=('Arial', 10)).pack(anchor='w')
            if tipo == 'combobox':
                self.campos_anamnese[label] = ttk.Combobox(frame, values=tamanho, width=20)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
            elif tipo == 'text':
                self.campos_anamnese[label] = tk.Text(frame, font=('Arial', 10), width=50, height=tamanho)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
        
        # 4. Hábitos Alimentares
        tk.Label(scrollable_frame, text='4. Hábitos Alimentares', bg='#FFFFFF', fg='#FFA500', font=('Arial', 12, 'bold')).pack(anchor='w', padx=20, pady=(20, 5))
        
        campos_habitos = [
            ('Com que frequência faz as refeições por dia?', 'entry', 50),
            ('Horários habituais das refeições', 'text', 4),
            ('Descreva um dia típico de alimentação', 'text', 6),
            ('Costuma consumir fast-food?', 'combobox', ['', 'Nunca', 'Raramente', 'Às vezes', 'Frequentemente']),
            ('Consome doces?', 'combobox', ['', 'Nunca', 'Raramente', 'Às vezes', 'Frequentemente']),
            ('Consumo de refrigerantes e bebidas açucaradas?', 'combobox', ['', 'Nunca', 'Raramente', 'Às vezes', 'Frequentemente']),
            ('Costuma consumir bebidas alcoólicas?', 'combobox', ['', 'Nunca', 'Raramente', 'Às vezes', 'Frequentemente']),
            ('Gosta de cozinhar?', 'combobox', ['', 'Não', 'Sim']),
            ('Prefere alimentos frescos, processados ou industrializados?', 'combobox', ['', 'Frescos', 'Processados', 'Industrializados', 'Misto']),
            ('Consumo de café (xícaras/dia)', 'entry', 10),
            ('Faz uso de suplementos? Quais?', 'text', 4),
            ('Consumo de água (litros/dia)', 'entry', 10)
        ]
        
        for label, tipo, tamanho in campos_habitos:
            frame = tk.Frame(scrollable_frame, bg='#FFFFFF')
            frame.pack(fill='x', padx=20, pady=5)
            tk.Label(frame, text=f'{label}:', bg='#FFFFFF', fg='#333333', font=('Arial', 10)).pack(anchor='w')
            if tipo == 'entry':
                self.campos_anamnese[label] = tk.Entry(frame, font=('Arial', 10), width=tamanho)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
            elif tipo == 'text':
                self.campos_anamnese[label] = tk.Text(frame, font=('Arial', 10), width=50, height=tamanho)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
            elif tipo == 'combobox':
                self.campos_anamnese[label] = ttk.Combobox(frame, values=tamanho, width=20)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
        
        # 5. Atividade Física
        tk.Label(scrollable_frame, text='5. Atividade Física', bg='#FFFFFF', fg='#FFA500', font=('Arial', 12, 'bold')).pack(anchor='w', padx=20, pady=(20, 5))
        
        campos_atividade = [
            ('Frequência de atividade física', 'combobox', ['', 'Sedentário', '1-2x/semana', '3-4x/semana', '5-6x/semana', 'Diário']),
            ('Objetivos de treino', 'text', 4),
            ('Nível de atividade física', 'combobox', ['', 'Baixo', 'Moderado', 'Alto', 'Muito Alto'])
        ]
        
        for label, tipo, tamanho in campos_atividade:
            frame = tk.Frame(scrollable_frame, bg='#FFFFFF')
            frame.pack(fill='x', padx=20, pady=5)
            tk.Label(frame, text=f'{label}:', bg='#FFFFFF', fg='#333333', font=('Arial', 10)).pack(anchor='w')
            if tipo == 'combobox':
                self.campos_anamnese[label] = ttk.Combobox(frame, values=tamanho, width=20)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
            elif tipo == 'text':
                self.campos_anamnese[label] = tk.Text(frame, font=('Arial', 10), width=50, height=tamanho)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
        
        # 6. Estilo de Vida
        tk.Label(scrollable_frame, text='6. Estilo de Vida', bg='#FFFFFF', fg='#FFA500', font=('Arial', 12, 'bold')).pack(anchor='w', padx=20, pady=(20, 5))
        
        campos_estilo_vida = [
            ('Rotina de sono (horas/noite, qualidade)', 'text', 4),
            ('Nível de estresse', 'combobox', ['', 'Baixo', 'Moderado', 'Alto', 'Muito Alto']),
            ('Tempo sentado/dia', 'entry', 20)
        ]
        
        for label, tipo, tamanho in campos_estilo_vida:
            frame = tk.Frame(scrollable_frame, bg='#FFFFFF')
            frame.pack(fill='x', padx=20, pady=5)
            tk.Label(frame, text=f'{label}:', bg='#FFFFFF', fg='#333333', font=('Arial', 10)).pack(anchor='w')
            if tipo == 'entry':
                self.campos_anamnese[label] = tk.Entry(frame, font=('Arial', 10), width=tamanho)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
            elif tipo == 'text':
                self.campos_anamnese[label] = tk.Text(frame, font=('Arial', 10), width=50, height=tamanho)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
            elif tipo == 'combobox':
                self.campos_anamnese[label] = ttk.Combobox(frame, values=tamanho, width=20)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
        
        # 7. Comportamento Alimentar
        tk.Label(scrollable_frame, text='7. Comportamento Alimentar', bg='#FFFFFF', fg='#FFA500', font=('Arial', 12, 'bold')).pack(anchor='w', padx=20, pady=(20, 5))
        
        campos_comportamento = [
            ('Tem dificuldade em seguir dietas?', 'combobox', ['', 'Não', 'Sim']),
            ('Costuma fazer lanches fora de casa?', 'combobox', ['', 'Nunca', 'Raramente', 'Às vezes', 'Frequentemente']),
            ('Come por ansiedade ou emoção?', 'combobox', ['', 'Não', 'Sim']),
            ('Tem o hábito de beliscar entre as refeições?', 'combobox', ['', 'Não', 'Sim']),
            ('Apresenta episódios de compulsão alimentar?', 'combobox', ['', 'Não', 'Sim']),
            ('Sente fome fora de horário?', 'combobox', ['', 'Não', 'Sim'])
        ]
        
        for label, tipo, tamanho in campos_comportamento:
            frame = tk.Frame(scrollable_frame, bg='#FFFFFF')
            frame.pack(fill='x', padx=20, pady=5)
            tk.Label(frame, text=f'{label}:', bg='#FFFFFF', fg='#333333', font=('Arial', 10)).pack(anchor='w')
            if tipo == 'combobox':
                self.campos_anamnese[label] = ttk.Combobox(frame, values=tamanho, width=20)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
        
        # 8. Objetivos e Expectativas
        tk.Label(scrollable_frame, text='8. Objetivos e Expectativas', bg='#FFFFFF', fg='#FFA500', font=('Arial', 12, 'bold')).pack(anchor='w', padx=20, pady=(20, 5))
        
        campos_objetivos = [
            ('Quais estratégias já utilizou para controle de peso?', 'text', 4),
            ('Alimentos preferidos', 'text', 4),
            ('Alimentos evitados', 'text', 4),
            ('Qual sua meta de peso ou medidas?', 'text', 4),
            ('Qual sua disposição para mudanças?', 'combobox', ['', 'Baixa', 'Moderada', 'Alta', 'Muito Alta']),
            ('Tem preferência por algum tipo de dieta?', 'text', 4),
            ('Quais suas expectativas com o acompanhamento nutricional?', 'text', 4),
            ('Observações adicionais', 'text', 6)
        ]
        
        for label, tipo, tamanho in campos_objetivos:
            frame = tk.Frame(scrollable_frame, bg='#FFFFFF')
            frame.pack(fill='x', padx=20, pady=5)
            tk.Label(frame, text=f'{label}:', bg='#FFFFFF', fg='#333333', font=('Arial', 10)).pack(anchor='w')
            if tipo == 'text':
                self.campos_anamnese[label] = tk.Text(frame, font=('Arial', 10), width=50, height=tamanho)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
            elif tipo == 'combobox':
                self.campos_anamnese[label] = ttk.Combobox(frame, values=tamanho, width=20)
                self.campos_anamnese[label].pack(anchor='w', pady=(5, 0))
        
        # Botões de ação
        frame_botoes = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_botoes.pack(fill='x', padx=20, pady=30)
        
        btn_salvar = tk.Button(frame_botoes,
                              text='💾 Salvar Anamnese',
                              bg='#4ECDC4',
                              fg='#000000',
                              font=('Arial', 12, 'bold'),
                              command=self.salvar_anamnese,
                              relief='flat',
                              padx=20,
                              pady=10)
        btn_salvar.pack(side='left', padx=(0, 10))
        
        btn_limpar = tk.Button(frame_botoes,
                              text='🗑️ Limpar Formulário',
                              bg='#95A5A6',
                              fg='#FFFFFF',
                              font=('Arial', 12, 'bold'),
                              command=self.limpar_formulario,
                              relief='flat',
                              padx=20,
                              pady=10)
        btn_limpar.pack(side='left')
    
    def get_field_value(self, field_name):
        """Obtém o valor de um campo de forma segura."""
        if field_name not in self.campos_anamnese:
            return ""
        
        campo = self.campos_anamnese[field_name]
        
        if isinstance(campo, tk.Entry):
            return campo.get().strip()
        elif isinstance(campo, tk.Text):
            return campo.get("1.0", tk.END).strip()
        elif isinstance(campo, ttk.Combobox):
            return campo.get().strip()
        else:
            return ""
    
    def salvar_anamnese(self):
        """Salva a anamnese com todos os campos coletados corretamente."""
        try:
            aluno_selecionado = self.combo_aluno.get()
            if not aluno_selecionado:
                messagebox.showerror("Erro", "Por favor, selecione um aluno.")
                return
            
            aluno_id = self.alunos_dict[aluno_selecionado]
            
            # Coletar dados dos campos usando função auxiliar
            peso_str = self.get_field_value("Peso atual (kg) *")
            altura_str = self.get_field_value("Altura (cm) *")
            
            peso = float(peso_str) if peso_str else None
            altura = float(altura_str) / 100 if altura_str else None
            
            # Criar instância de AnamneseNutricional com todos os campos
            nova_anamnese = AnamneseNutricional(
                aluno_id=aluno_id,
                data_anamnese=date.today(),
                peso=peso,
                altura=altura,
                objetivo_nutricional=self.get_field_value("Objetivo nutricional"),
                restricoes_alimentares=self.get_field_value("Possui alergias ou intolerâncias alimentares? Quais?"),
                alergias=self.get_field_value("Possui alergias ou intolerâncias alimentares? Quais?"),
                medicamentos=self.get_field_value("Faz uso de medicação? Quais?"),
                historico_familiar=self.get_field_value("Tem histórico familiar de doenças relacionadas à alimentação?"),
                habitos_alimentares=self.get_field_value("Descreva um dia típico de alimentação"),
                consumo_agua=self.get_field_value("Consumo de água (litros/dia)"),
                atividade_fisica=self.get_field_value("Nível de atividade física"),
                observacoes=self.get_field_value("Observações adicionais"),
                circunferencia_abdominal=self.get_field_value("Circunferência abdominal (cm)"),
                circunferencia_quadril=self.get_field_value("Circunferência do quadril (cm)"),
                medidas_corpo=self.get_field_value("Medidas de cintura, quadril, coxa"),
                doencas_cronicas=self.get_field_value("Possui alguma doença crônica?"),
                problemas_saude=self.get_field_value("Já teve algum problema cardíaco, renal, hepático, ou outro?"),
                cirurgias=self.get_field_value("Já realizou cirurgia? Qual e quando?"),
                condicoes_hormonais=self.get_field_value("Sofre de alguma condição hormonal?"),
                acompanhamento_psicologico=self.get_field_value("Já fez ou faz acompanhamento psicológico?"),
                disturbios_alimentares=self.get_field_value("Apresenta distúrbios alimentares?"),
                gravida_amamentando=self.get_field_value("Está grávida ou amamentando?"),
                acompanhamento_previo=self.get_field_value("Já fez acompanhamento nutricional antes?"),
                frequencia_refeicoes=self.get_field_value("Com que frequência faz as refeições por dia?"),
                horarios_refeicoes=self.get_field_value("Horários habituais das refeições"),
                consumo_fastfood=self.get_field_value("Costuma consumir fast-food?"),
                consumo_doces=self.get_field_value("Consome doces?"),
                consumo_bebidas_acucaradas=self.get_field_value("Consumo de refrigerantes e bebidas açucaradas?"),
                consumo_alcool=self.get_field_value("Costuma consumir bebidas alcoólicas?"),
                gosta_cozinhar=self.get_field_value("Gosta de cozinhar?"),
                preferencia_alimentos=self.get_field_value("Prefere alimentos frescos, processados ou industrializados?"),
                consumo_cafe=self.get_field_value("Consumo de café (xícaras/dia)"),
                uso_suplementos=self.get_field_value("Faz uso de suplementos? Quais?"),
                frequencia_atividade_fisica=self.get_field_value("Frequência de atividade física"),
                objetivos_treino=self.get_field_value("Objetivos de treino"),
                rotina_sono=self.get_field_value("Rotina de sono (horas/noite, qualidade)"),
                nivel_estresse=self.get_field_value("Nível de estresse"),
                tempo_sentado=self.get_field_value("Tempo sentado/dia"),
                dificuldade_dietas=self.get_field_value("Tem dificuldade em seguir dietas?"),
                lanches_fora=self.get_field_value("Costuma fazer lanches fora de casa?"),
                come_emocional=self.get_field_value("Come por ansiedade ou emoção?"),
                beliscar=self.get_field_value("Tem o hábito de beliscar entre as refeições?"),
                compulsao_alimentar=self.get_field_value("Apresenta episódios de compulsão alimentar?"),
                fome_fora_horario=self.get_field_value("Sente fome fora de horário?"),
                estrategias_controle_peso=self.get_field_value("Quais estratégias já utilizou para controle de peso?"),
                alimentos_preferidos=self.get_field_value("Alimentos preferidos"),
                alimentos_evitados=self.get_field_value("Alimentos evitados"),
                meta_peso_medidas=self.get_field_value("Qual sua meta de peso ou medidas?"),
                disposicao_mudancas=self.get_field_value("Qual sua disposição para mudanças?"),
                preferencia_dietas=self.get_field_value("Tem preferência por algum tipo de dieta?"),
                expectativas=self.get_field_value("Quais suas expectativas com o acompanhamento nutricional?")
            )
            
            if self.anamnese_selecionada:  # Modo edição
                nova_anamnese.id = self.anamnese_selecionada.id
                anamnese_dao.atualizar_anamnese(nova_anamnese)
                messagebox.showinfo("Sucesso", "Anamnese atualizada com sucesso!")
            else:  # Modo criação
                anamnese_dao.criar_anamnese(nova_anamnese)
                messagebox.showinfo("Sucesso", "Anamnese salva com sucesso!")
            
            self.limpar_formulario()
            self.carregar_lista_anamneses()
            self.notebook.select(self.frame_anamneses)  # Voltar para a aba de listagem
            
        except ValueError as e:
            messagebox.showerror("Erro", f"Por favor, insira valores válidos para Peso e Altura. Erro: {str(e)}")
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao salvar anamnese: {str(e)}")
    
    def limpar_formulario(self):
        """Limpa todos os campos do formulário."""
        self.combo_aluno.set('')
        
        for campo in self.campos_anamnese.values():
            if isinstance(campo, tk.Entry):
                campo.delete(0, tk.END)
            elif isinstance(campo, tk.Text):
                campo.delete('1.0', tk.END)
            elif isinstance(campo, ttk.Combobox):
                campo.set('')
        
        self.anamnese_selecionada = None
    
    def carregar_lista_anamneses(self):
        """Carrega a lista de anamneses na TreeView."""
        try:
            # Limpar lista atual
            for item in self.tree_anamneses.get_children():
                self.tree_anamneses.delete(item)
            
            # Buscar anamneses
            anamneses = anamnese_dao.listar_todas_anamneses()
            
            for anamnese in anamneses:
                # Buscar nome do aluno
                aluno = aluno_dao.buscar_aluno_por_id(anamnese.aluno_id)
                nome_aluno = aluno.nome if aluno else "Aluno não encontrado"
                
                # Calcular IMC
                imc = ""
                if anamnese.peso and anamnese.altura:
                    imc_valor = anamnese.peso / (anamnese.altura ** 2)
                    imc = f"{imc_valor:.1f}"
                
                # Inserir na TreeView
                self.tree_anamneses.insert('', 'end', values=(
                    anamnese.id,
                    nome_aluno,
                    anamnese.data_anamnese.strftime('%d/%m/%Y') if anamnese.data_anamnese else '',
                    f"{anamnese.peso:.1f} kg" if anamnese.peso else '',
                    f"{anamnese.altura*100:.0f} cm" if anamnese.altura else '',
                    imc
                ))
                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao carregar anamneses: {str(e)}")
    
    def carregar_combo_alunos(self):
        """Carrega a lista de alunos nos comboboxes."""
        try:
            alunos = aluno_dao.listar_todos_alunos()
            nomes_alunos = []
            self.alunos_dict = {}
            
            for aluno in alunos:
                nome_completo = aluno.nome
                nomes_alunos.append(nome_completo)
                self.alunos_dict[nome_completo] = aluno.id
            
            # Atualizar comboboxes
            self.combo_aluno['values'] = nomes_alunos
            self.combo_filtro_aluno['values'] = ['Todos'] + nomes_alunos
            self.combo_filtro_aluno.set('Todos')
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao carregar alunos: {str(e)}")
    
    def selecionar_anamnese(self, event=None):
        """Habilita/desabilita botões baseado na seleção."""
        selecionado = self.tree_anamneses.selection()
        
        if selecionado:
            self.btn_visualizar.config(state='normal')
            self.btn_editar.config(state='normal')
            self.btn_exportar.config(state='normal')
            self.btn_excluir.config(state='normal')
            
            # Armazenar anamnese selecionada
            item = self.tree_anamneses.item(selecionado[0])
            anamnese_id = item['values'][0]
            self.anamnese_selecionada = anamnese_dao.buscar_anamnese_por_id(anamnese_id)
        else:
            self.btn_visualizar.config(state='disabled')
            self.btn_editar.config(state='disabled')
            self.btn_exportar.config(state='disabled')
            self.btn_excluir.config(state='disabled')
            self.anamnese_selecionada = None
    
    def filtrar_anamneses(self, event=None):
        """Filtra anamneses por aluno."""
        filtro = self.combo_filtro_aluno.get()
        
        # Limpar lista atual
        for item in self.tree_anamneses.get_children():
            self.tree_anamneses.delete(item)
        
        try:
            if filtro == 'Todos' or not filtro:
                anamneses = anamnese_dao.listar_todas_anamneses()
            else:
                aluno_id = self.alunos_dict[filtro]
                anamneses = anamnese_dao.buscar_anamneses_por_aluno(aluno_id)
            
            for anamnese in anamneses:
                # Buscar nome do aluno
                aluno = aluno_dao.buscar_aluno_por_id(anamnese.aluno_id)
                nome_aluno = aluno.nome if aluno else "Aluno não encontrado"
                
                # Calcular IMC
                imc = ""
                if anamnese.peso and anamnese.altura:
                    imc_valor = anamnese.peso / (anamnese.altura ** 2)
                    imc = f"{imc_valor:.1f}"
                
                # Inserir na TreeView
                self.tree_anamneses.insert('', 'end', values=(
                    anamnese.id,
                    nome_aluno,
                    anamnese.data_anamnese.strftime('%d/%m/%Y') if anamnese.data_anamnese else '',
                    f"{anamnese.peso:.1f} kg" if anamnese.peso else '',
                    f"{anamnese.altura*100:.0f} cm" if anamnese.altura else '',
                    imc
                ))
                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao filtrar anamneses: {str(e)}")
    
    def abrir_nova_anamnese(self):
        """Abre a aba para criar nova anamnese."""
        self.limpar_formulario()
        self.notebook.select(self.frame_nova_anamnese)
    
    def carregar_dados_aluno(self, event=None):
        """Carrega dados do aluno selecionado (se necessário)."""
        pass  # Implementar se necessário
    
    def visualizar_anamnese_selecionada(self):
        """Visualiza a anamnese selecionada em uma nova janela."""
        if not self.anamnese_selecionada:
            messagebox.showwarning("Aviso", "Nenhuma anamnese selecionada.")
            return
        
        # Criar janela de visualização
        janela_vis = tk.Toplevel(self.parent_frame)
        janela_vis.title("Visualizar Anamnese")
        janela_vis.geometry("800x600")
        janela_vis.configure(bg='#FFFFFF')
        
        # Canvas com scrollbar
        canvas = tk.Canvas(janela_vis, bg='#FFFFFF')
        scrollbar = ttk.Scrollbar(janela_vis, orient='vertical', command=canvas.yview)
        frame_conteudo = tk.Frame(canvas, bg='#FFFFFF')
        
        frame_conteudo.bind('<Configure>', lambda e: canvas.configure(scrollregion=canvas.bbox('all')))
        canvas.create_window((0, 0), window=frame_conteudo, anchor='nw')
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side='left', fill='both', expand=True)
        scrollbar.pack(side='right', fill='y')
        
        # Buscar dados do aluno
        aluno = aluno_dao.buscar_aluno_por_id(self.anamnese_selecionada.aluno_id)
        nome_aluno = aluno.nome if aluno else "Aluno não encontrado"
        
        # Título
        tk.Label(frame_conteudo, text=f"Anamnese Nutricional - {nome_aluno}", 
                bg='#FFFFFF', fg='#FFA500', font=('Arial', 16, 'bold')).pack(pady=20)
        
        # Dados da anamnese
        dados = [
            ("Data da Anamnese", self.anamnese_selecionada.data_anamnese.strftime('%d/%m/%Y') if self.anamnese_selecionada.data_anamnese else ''),
            ("Peso", f"{self.anamnese_selecionada.peso:.1f} kg" if self.anamnese_selecionada.peso else ''),
            ("Altura", f"{self.anamnese_selecionada.altura*100:.0f} cm" if self.anamnese_selecionada.altura else ''),
            ("IMC", self.anamnese_selecionada.imc_formatado),
            ("Objetivo Nutricional", self.anamnese_selecionada.objetivo_nutricional),
            ("Restrições Alimentares", self.anamnese_selecionada.restricoes_alimentares),
            ("Alergias", self.anamnese_selecionada.alergias),
            ("Medicamentos", self.anamnese_selecionada.medicamentos),
            ("Histórico Familiar", self.anamnese_selecionada.historico_familiar),
            ("Hábitos Alimentares", self.anamnese_selecionada.habitos_alimentares),
            ("Consumo de Água", self.anamnese_selecionada.consumo_agua),
            ("Atividade Física", self.anamnese_selecionada.atividade_fisica),
            ("Doenças Crônicas", self.anamnese_selecionada.doencas_cronicas),
            ("Problemas de Saúde", self.anamnese_selecionada.problemas_saude),
            ("Cirurgias", self.anamnese_selecionada.cirurgias),
            ("Condições Hormonais", self.anamnese_selecionada.condicoes_hormonais),
            ("Acompanhamento Psicológico", self.anamnese_selecionada.acompanhamento_psicologico),
            ("Distúrbios Alimentares", self.anamnese_selecionada.disturbios_alimentares),
            ("Grávida/Amamentando", self.anamnese_selecionada.gravida_amamentando),
            ("Acompanhamento Prévio", self.anamnese_selecionada.acompanhamento_previo),
            ("Frequência de Refeições", self.anamnese_selecionada.frequencia_refeicoes),
            ("Horários das Refeições", self.anamnese_selecionada.horarios_refeicoes),
            ("Consumo Fast-food", self.anamnese_selecionada.consumo_fastfood),
            ("Consumo de Doces", self.anamnese_selecionada.consumo_doces),
            ("Bebidas Açucaradas", self.anamnese_selecionada.consumo_bebidas_acucaradas),
            ("Consumo de Álcool", self.anamnese_selecionada.consumo_alcool),
            ("Gosta de Cozinhar", self.anamnese_selecionada.gosta_cozinhar),
            ("Preferência de Alimentos", self.anamnese_selecionada.preferencia_alimentos),
            ("Consumo de Café", self.anamnese_selecionada.consumo_cafe),
            ("Uso de Suplementos", self.anamnese_selecionada.uso_suplementos),
            ("Frequência Atividade Física", self.anamnese_selecionada.frequencia_atividade_fisica),
            ("Objetivos de Treino", self.anamnese_selecionada.objetivos_treino),
            ("Rotina de Sono", self.anamnese_selecionada.rotina_sono),
            ("Nível de Estresse", self.anamnese_selecionada.nivel_estresse),
            ("Tempo Sentado", self.anamnese_selecionada.tempo_sentado),
            ("Dificuldade com Dietas", self.anamnese_selecionada.dificuldade_dietas),
            ("Lanches Fora", self.anamnese_selecionada.lanches_fora),
            ("Come Emocional", self.anamnese_selecionada.come_emocional),
            ("Beliscar", self.anamnese_selecionada.beliscar),
            ("Compulsão Alimentar", self.anamnese_selecionada.compulsao_alimentar),
            ("Fome Fora de Horário", self.anamnese_selecionada.fome_fora_horario),
            ("Estratégias Controle Peso", self.anamnese_selecionada.estrategias_controle_peso),
            ("Alimentos Preferidos", self.anamnese_selecionada.alimentos_preferidos),
            ("Alimentos Evitados", self.anamnese_selecionada.alimentos_evitados),
            ("Meta Peso/Medidas", self.anamnese_selecionada.meta_peso_medidas),
            ("Disposição para Mudanças", self.anamnese_selecionada.disposicao_mudancas),
            ("Preferência de Dietas", self.anamnese_selecionada.preferencia_dietas),
            ("Expectativas", self.anamnese_selecionada.expectativas),
            ("Observações", self.anamnese_selecionada.observacoes)
        ]
        
        for label, valor in dados:
            if valor:  # Só mostra se tiver valor
                frame_item = tk.Frame(frame_conteudo, bg='#FFFFFF')
                frame_item.pack(fill='x', padx=20, pady=5)
                
                tk.Label(frame_item, text=f"{label}:", bg='#FFFFFF', fg='#333333', 
                        font=('Arial', 10, 'bold')).pack(anchor='w')
                tk.Label(frame_item, text=str(valor), bg='#FFFFFF', fg='#666666', 
                        font=('Arial', 10), wraplength=750, justify='left').pack(anchor='w', padx=20)
    
    def editar_anamnese_selecionada(self):
        """Edita a anamnese selecionada."""
        if not self.anamnese_selecionada:
            messagebox.showwarning("Aviso", "Nenhuma anamnese selecionada.")
            return
        
        # Carregar dados nos campos
        aluno = aluno_dao.buscar_aluno_por_id(self.anamnese_selecionada.aluno_id)
        if aluno:
            self.combo_aluno.set(aluno.nome)
        
        # Carregar dados nos campos
        campos_valores = {
            "Peso atual (kg) *": str(self.anamnese_selecionada.peso) if self.anamnese_selecionada.peso else "",
            "Altura (cm) *": str(int(self.anamnese_selecionada.altura * 100)) if self.anamnese_selecionada.altura else "",
            "Objetivo nutricional": self.anamnese_selecionada.objetivo_nutricional or "",
            "Possui alergias ou intolerâncias alimentares? Quais?": self.anamnese_selecionada.alergias or "",
            "Faz uso de medicação? Quais?": self.anamnese_selecionada.medicamentos or "",
            "Tem histórico familiar de doenças relacionadas à alimentação?": self.anamnese_selecionada.historico_familiar or "",
            "Descreva um dia típico de alimentação": self.anamnese_selecionada.habitos_alimentares or "",
            "Consumo de água (litros/dia)": self.anamnese_selecionada.consumo_agua or "",
            "Nível de atividade física": self.anamnese_selecionada.atividade_fisica or "",
            "Observações adicionais": self.anamnese_selecionada.observacoes or "",
            "Circunferência abdominal (cm)": self.anamnese_selecionada.circunferencia_abdominal or "",
            "Circunferência do quadril (cm)": self.anamnese_selecionada.circunferencia_quadril or "",
            "Medidas de cintura, quadril, coxa": self.anamnese_selecionada.medidas_corpo or "",
            "Possui alguma doença crônica?": self.anamnese_selecionada.doencas_cronicas or "",
            "Já teve algum problema cardíaco, renal, hepático, ou outro?": self.anamnese_selecionada.problemas_saude or "",
            "Já realizou cirurgia? Qual e quando?": self.anamnese_selecionada.cirurgias or "",
            "Sofre de alguma condição hormonal?": self.anamnese_selecionada.condicoes_hormonais or "",
            "Já fez ou faz acompanhamento psicológico?": self.anamnese_selecionada.acompanhamento_psicologico or "",
            "Apresenta distúrbios alimentares?": self.anamnese_selecionada.disturbios_alimentares or "",
            "Está grávida ou amamentando?": self.anamnese_selecionada.gravida_amamentando or "",
            "Já fez acompanhamento nutricional antes?": self.anamnese_selecionada.acompanhamento_previo or "",
            "Com que frequência faz as refeições por dia?": self.anamnese_selecionada.frequencia_refeicoes or "",
            "Horários habituais das refeições": self.anamnese_selecionada.horarios_refeicoes or "",
            "Costuma consumir fast-food?": self.anamnese_selecionada.consumo_fastfood or "",
            "Consome doces?": self.anamnese_selecionada.consumo_doces or "",
            "Consumo de refrigerantes e bebidas açucaradas?": self.anamnese_selecionada.consumo_bebidas_acucaradas or "",
            "Costuma consumir bebidas alcoólicas?": self.anamnese_selecionada.consumo_alcool or "",
            "Gosta de cozinhar?": self.anamnese_selecionada.gosta_cozinhar or "",
            "Prefere alimentos frescos, processados ou industrializados?": self.anamnese_selecionada.preferencia_alimentos or "",
            "Consumo de café (xícaras/dia)": self.anamnese_selecionada.consumo_cafe or "",
            "Faz uso de suplementos? Quais?": self.anamnese_selecionada.uso_suplementos or "",
            "Frequência de atividade física": self.anamnese_selecionada.frequencia_atividade_fisica or "",
            "Objetivos de treino": self.anamnese_selecionada.objetivos_treino or "",
            "Rotina de sono (horas/noite, qualidade)": self.anamnese_selecionada.rotina_sono or "",
            "Nível de estresse": self.anamnese_selecionada.nivel_estresse or "",
            "Tempo sentado/dia": self.anamnese_selecionada.tempo_sentado or "",
            "Tem dificuldade em seguir dietas?": self.anamnese_selecionada.dificuldade_dietas or "",
            "Costuma fazer lanches fora de casa?": self.anamnese_selecionada.lanches_fora or "",
            "Come por ansiedade ou emoção?": self.anamnese_selecionada.come_emocional or "",
            "Tem o hábito de beliscar entre as refeições?": self.anamnese_selecionada.beliscar or "",
            "Apresenta episódios de compulsão alimentar?": self.anamnese_selecionada.compulsao_alimentar or "",
            "Sente fome fora de horário?": self.anamnese_selecionada.fome_fora_horario or "",
            "Quais estratégias já utilizou para controle de peso?": self.anamnese_selecionada.estrategias_controle_peso or "",
            "Alimentos preferidos": self.anamnese_selecionada.alimentos_preferidos or "",
            "Alimentos evitados": self.anamnese_selecionada.alimentos_evitados or "",
            "Qual sua meta de peso ou medidas?": self.anamnese_selecionada.meta_peso_medidas or "",
            "Qual sua disposição para mudanças?": self.anamnese_selecionada.disposicao_mudancas or "",
            "Tem preferência por algum tipo de dieta?": self.anamnese_selecionada.preferencia_dietas or "",
            "Quais suas expectativas com o acompanhamento nutricional?": self.anamnese_selecionada.expectativas or ""
        }
        
        for campo_nome, valor in campos_valores.items():
            if campo_nome in self.campos_anamnese and valor:
                campo = self.campos_anamnese[campo_nome]
                if isinstance(campo, tk.Entry):
                    campo.delete(0, tk.END)
                    campo.insert(0, valor)
                elif isinstance(campo, tk.Text):
                    campo.delete('1.0', tk.END)
                    campo.insert('1.0', valor)
                elif isinstance(campo, ttk.Combobox):
                    campo.set(valor)
        
        # Ir para a aba de edição
        self.notebook.select(self.frame_nova_anamnese)
    
    def excluir_anamnese_selecionada(self):
        """Exclui a anamnese selecionada."""
        if not self.anamnese_selecionada:
            messagebox.showwarning("Aviso", "Nenhuma anamnese selecionada.")
            return
        
        resposta = messagebox.askyesno("Confirmar Exclusão", 
                                      "Tem certeza que deseja excluir esta anamnese?\n\nEsta ação não pode ser desfeita.")
        
        if resposta:
            try:
                anamnese_dao.excluir_anamnese(self.anamnese_selecionada.id)
                messagebox.showinfo("Sucesso", "Anamnese excluída com sucesso!")
                self.carregar_lista_anamneses()
                self.anamnese_selecionada = None
            except Exception as e:
                messagebox.showerror("Erro", f"Erro ao excluir anamnese: {str(e)}")
    
    def exportar_anamnese_pdf(self):
        """Exporta a anamnese selecionada para PDF."""
        if not self.anamnese_selecionada:
            messagebox.showwarning("Aviso", "Nenhuma anamnese selecionada.")
            return
        
        try:
            # Buscar dados do aluno
            aluno = aluno_dao.buscar_aluno_por_id(self.anamnese_selecionada.aluno_id)
            nome_aluno = aluno.nome if aluno else "Aluno não encontrado"
            
            # Escolher local para salvar
            nome_arquivo = f"anamnese_{nome_aluno.replace(' ', '')}_{datetime.now().strftime('%Y%m%d')}.pdf"
            arquivo = filedialog.asksaveasfilename(
                defaultextension=".pdf",
                filetypes=[("PDF files", "*.pdf")],
                initialfile=nome_arquivo
            )
            
            if not arquivo:
                return
            
            # Criar PDF
            doc = SimpleDocTemplate(arquivo, pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            
            # Título
            titulo_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
                alignment=1  # Centralizado
            )
            story.append(Paragraph("ANAMNESE NUTRICIONAL", titulo_style))
            story.append(Spacer(1, 12))
            
            # Dados do aluno
            story.append(Paragraph(f"<b>Aluno:</b> {nome_aluno}", styles['Normal']))
            story.append(Paragraph(f"<b>Data:</b> {self.anamnese_selecionada.data_anamnese.strftime('%d/%m/%Y') if self.anamnese_selecionada.data_anamnese else ''}", styles['Normal']))
            story.append(Spacer(1, 12))
            
            # Dados antropométricos
            story.append(Paragraph("<b>DADOS ANTROPOMÉTRICOS</b>", styles['Heading2']))
            dados_antro = [
                ['Peso', f"{self.anamnese_selecionada.peso:.1f} kg" if self.anamnese_selecionada.peso else ''],
                ['Altura', f"{self.anamnese_selecionada.altura*100:.0f} cm" if self.anamnese_selecionada.altura else ''],
                ['IMC', self.anamnese_selecionada.imc_formatado],
                ['Circunferência Abdominal', self.anamnese_selecionada.circunferencia_abdominal or ''],
                ['Circunferência Quadril', self.anamnese_selecionada.circunferencia_quadril or '']
            ]
            
            tabela_antro = Table(dados_antro)
            tabela_antro.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.grey),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('BACKGROUND', (1, 0), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(tabela_antro)
            story.append(Spacer(1, 12))
            
            # Adicionar todas as seções da anamnese
            secoes = [
                ("OBJETIVO NUTRICIONAL", self.anamnese_selecionada.objetivo_nutricional),
                ("HISTÓRICO DE SAÚDE", ""),
                ("Doenças Crônicas", self.anamnese_selecionada.doencas_cronicas),
                ("Medicamentos", self.anamnese_selecionada.medicamentos),
                ("Problemas de Saúde", self.anamnese_selecionada.problemas_saude),
                ("Cirurgias", self.anamnese_selecionada.cirurgias),
                ("Alergias", self.anamnese_selecionada.alergias),
                ("Condições Hormonais", self.anamnese_selecionada.condicoes_hormonais),
                ("Acompanhamento Psicológico", self.anamnese_selecionada.acompanhamento_psicologico),
                ("Distúrbios Alimentares", self.anamnese_selecionada.disturbios_alimentares),
                ("Grávida/Amamentando", self.anamnese_selecionada.gravida_amamentando),
                ("Histórico Familiar", self.anamnese_selecionada.historico_familiar),
                ("HÁBITOS ALIMENTARES", ""),
                ("Frequência de Refeições", self.anamnese_selecionada.frequencia_refeicoes),
                ("Horários das Refeições", self.anamnese_selecionada.horarios_refeicoes),
                ("Dia Típico de Alimentação", self.anamnese_selecionada.habitos_alimentares),
                ("Consumo Fast-food", self.anamnese_selecionada.consumo_fastfood),
                ("Consumo de Doces", self.anamnese_selecionada.consumo_doces),
                ("Bebidas Açucaradas", self.anamnese_selecionada.consumo_bebidas_acucaradas),
                ("Consumo de Álcool", self.anamnese_selecionada.consumo_alcool),
                ("Gosta de Cozinhar", self.anamnese_selecionada.gosta_cozinhar),
                ("Preferência de Alimentos", self.anamnese_selecionada.preferencia_alimentos),
                ("Consumo de Café", self.anamnese_selecionada.consumo_cafe),
                ("Consumo de Água", self.anamnese_selecionada.consumo_agua),
                ("Uso de Suplementos", self.anamnese_selecionada.uso_suplementos),
                ("ATIVIDADE FÍSICA", ""),
                ("Frequência", self.anamnese_selecionada.frequencia_atividade_fisica),
                ("Nível", self.anamnese_selecionada.atividade_fisica),
                ("Objetivos de Treino", self.anamnese_selecionada.objetivos_treino),
                ("ESTILO DE VIDA", ""),
                ("Rotina de Sono", self.anamnese_selecionada.rotina_sono),
                ("Nível de Estresse", self.anamnese_selecionada.nivel_estresse),
                ("Tempo Sentado", self.anamnese_selecionada.tempo_sentado),
                ("COMPORTAMENTO ALIMENTAR", ""),
                ("Dificuldade com Dietas", self.anamnese_selecionada.dificuldade_dietas),
                ("Lanches Fora", self.anamnese_selecionada.lanches_fora),
                ("Come Emocional", self.anamnese_selecionada.come_emocional),
                ("Beliscar", self.anamnese_selecionada.beliscar),
                ("Compulsão Alimentar", self.anamnese_selecionada.compulsao_alimentar),
                ("Fome Fora de Horário", self.anamnese_selecionada.fome_fora_horario),
                ("OBJETIVOS E EXPECTATIVAS", ""),
                ("Estratégias Controle Peso", self.anamnese_selecionada.estrategias_controle_peso),
                ("Alimentos Preferidos", self.anamnese_selecionada.alimentos_preferidos),
                ("Alimentos Evitados", self.anamnese_selecionada.alimentos_evitados),
                ("Meta Peso/Medidas", self.anamnese_selecionada.meta_peso_medidas),
                ("Disposição para Mudanças", self.anamnese_selecionada.disposicao_mudancas),
                ("Preferência de Dietas", self.anamnese_selecionada.preferencia_dietas),
                ("Expectativas", self.anamnese_selecionada.expectativas),
                ("OBSERVAÇÕES", self.anamnese_selecionada.observacoes)
            ]
            
            for titulo, conteudo in secoes:
                if titulo.isupper() and not conteudo:  # É um título de seção
                    story.append(Paragraph(f"<b>{titulo}</b>", styles['Heading2']))
                elif conteudo:  # Tem conteudo para mostrar
                    if titulo.isupper():  # É título de seção com conteúdo
                        story.append(Paragraph(f"<b>{titulo}</b>", styles['Heading2']))
                        story.append(Paragraph(str(conteudo), styles['Normal']))
                    else:  # É item normal
                        story.append(Paragraph(f"<b>{titulo}:</b> {str(conteudo)}", styles['Normal']))
                    story.append(Spacer(1, 6))
            
            # Construir PDF
            doc.build(story)
            messagebox.showinfo("Sucesso", f"PDF exportado com sucesso!\nArquivo: {arquivo}")
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao exportar PDF: {str(e)}")

