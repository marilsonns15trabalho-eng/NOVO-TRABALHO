#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Módulo de Edição Geral

Este módulo contém a interface para edição e configuração
de todas as informações do sistema.
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog, simpledialog, colorchooser
import json
import os
import sys
import csv
from datetime import datetime

# Adicionar o diretório pai ao path para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from data.database import db_manager
from data.aluno_dao import aluno_dao
from data.pagamento_dao import pagamento_dao
from data.plano_dao import plano_dao
from data.treino_dao import treino_dao
from data.anamnese_dao import anamnese_dao
from data.avaliacao_dao import avaliacao_dao

class ModuloEdicao:
    """
    Classe responsável pela interface de edição geral do sistema.
    
    Permite editar configurações, fazer backup/restore,
    gerenciar dados e personalizar o sistema.
    """
    
    def __init__(self, parent_frame):
        """
        Inicializa o módulo de edição.
        
        Args:
            parent_frame: Frame pai onde será inserida a interface
        """
        self.parent_frame = parent_frame
        self.config_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'config.json')
        self.configuracoes = self.carregar_configuracoes()
        self.criar_interface()
    
    def criar_interface(self):
        """Cria a interface principal do módulo de edição."""
        # Limpar o frame pai
        for widget in self.parent_frame.winfo_children():
            widget.destroy()
        
        # Frame principal
        self.main_frame = tk.Frame(self.parent_frame, bg='#FFFFFF')
        self.main_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Título do módulo
        titulo = tk.Label(self.main_frame,
                         text="Edição e Configurações Gerais",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 18, 'bold'))
        titulo.pack(pady=(0, 20))
        
        # Notebook para abas
        self.notebook = ttk.Notebook(self.main_frame)
        self.notebook.pack(fill='both', expand=True)
        
        # Criar abas
        self.criar_aba_configuracoes()
        self.criar_aba_backup()
        self.criar_aba_dados()
        self.criar_aba_personalizacao()
        self.criar_aba_sistema()
    
    def criar_aba_configuracoes(self):
        """Cria a aba de configurações gerais."""
        # Frame da aba
        self.frame_config = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_config, text="⚙️ Configurações")
        
        # Frame principal com scroll
        canvas = tk.Canvas(self.frame_config, bg='#FFFFFF')
        scrollbar = ttk.Scrollbar(self.frame_config, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#FFFFFF')
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Título
        titulo = tk.Label(scrollable_frame,
                         text="Configurações do Sistema",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 16, 'bold'))
        titulo.pack(pady=(20, 30))
        
        # Configurações da empresa
        frame_empresa = tk.LabelFrame(scrollable_frame, text="Informações da Empresa", bg='#FFFFFF', fg='#333333', font=('Arial', 11, 'bold'))
        frame_empresa.pack(fill='x', padx=20, pady=10)
        
        self.campos_config = {}
        
        # Nome da empresa
        frame_nome = tk.Frame(frame_empresa, bg='#FFFFFF')
        frame_nome.pack(fill='x', padx=10, pady=5)
        tk.Label(frame_nome, text="Nome da Empresa:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_config['nome_empresa'] = tk.Entry(frame_nome, font=('Arial', 10), width=50)
        self.campos_config['nome_empresa'].pack(fill='x', pady=(5, 0))
        self.campos_config['nome_empresa'].insert(0, self.configuracoes.get('nome_empresa', 'Lioness Personal Estúdio'))
        
        # CNPJ
        frame_cnpj = tk.Frame(frame_empresa, bg='#FFFFFF')
        frame_cnpj.pack(fill='x', padx=10, pady=5)
        tk.Label(frame_cnpj, text="CNPJ:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_config['cnpj'] = tk.Entry(frame_cnpj, font=('Arial', 10), width=30)
        self.campos_config['cnpj'].pack(anchor='w', pady=(5, 0))
        self.campos_config['cnpj'].insert(0, self.configuracoes.get('cnpj', ''))
        
        # Endereço
        frame_endereco = tk.Frame(frame_empresa, bg='#FFFFFF')
        frame_endereco.pack(fill='x', padx=10, pady=5)
        tk.Label(frame_endereco, text="Endereço:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_config['endereco'] = tk.Entry(frame_endereco, font=('Arial', 10), width=60)
        self.campos_config['endereco'].pack(fill='x', pady=(5, 0))
        self.campos_config['endereco'].insert(0, self.configuracoes.get('endereco', ''))
        
        # Telefone e Email
        frame_contato = tk.Frame(frame_empresa, bg='#FFFFFF')
        frame_contato.pack(fill='x', padx=10, pady=5)
        
        frame_tel = tk.Frame(frame_contato, bg='#FFFFFF')
        frame_tel.pack(side='left', fill='x', expand=True, padx=(0, 10))
        tk.Label(frame_tel, text="Telefone:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_config['telefone'] = tk.Entry(frame_tel, font=('Arial', 10), width=20)
        self.campos_config['telefone'].pack(fill='x', pady=(5, 0))
        self.campos_config['telefone'].insert(0, self.configuracoes.get('telefone', ''))
        
        frame_email = tk.Frame(frame_contato, bg='#FFFFFF')
        frame_email.pack(side='left', fill='x', expand=True)
        tk.Label(frame_email, text="Email:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_config['email'] = tk.Entry(frame_email, font=('Arial', 10), width=30)
        self.campos_config['email'].pack(fill='x', pady=(5, 0))
        self.campos_config['email'].insert(0, self.configuracoes.get('email', ''))
        
        # Configurações do sistema
        frame_sistema = tk.LabelFrame(scrollable_frame, text="Configurações do Sistema", bg='#FFFFFF', fg='#333333', font=('Arial', 11, 'bold'))
        frame_sistema.pack(fill='x', padx=20, pady=10)
        
        # Backup automático
        frame_backup_auto = tk.Frame(frame_sistema, bg='#FFFFFF')
        frame_backup_auto.pack(fill='x', padx=10, pady=5)
        self.var_backup_auto = tk.BooleanVar(value=self.configuracoes.get('backup_automatico', True))
        tk.Checkbutton(frame_backup_auto,
                      text="Backup automático diário",
                      variable=self.var_backup_auto,
                      bg='#FFFFFF',
                      fg='#333333',
                      font=('Arial', 10)).pack(anchor='w')
        
        # Notificações
        frame_notif = tk.Frame(frame_sistema, bg='#FFFFFF')
        frame_notif.pack(fill='x', padx=10, pady=5)
        self.var_notificacoes = tk.BooleanVar(value=self.configuracoes.get('notificacoes', True))
        tk.Checkbutton(frame_notif,
                      text="Exibir notificações do sistema",
                      variable=self.var_notificacoes,
                      bg='#FFFFFF',
                      fg='#333333',
                      font=('Arial', 10)).pack(anchor='w')
        
        # Configurações de pagamento
        frame_pagamento = tk.LabelFrame(scrollable_frame, text="Configurações de Pagamento", bg='#FFFFFF', fg='#333333', font=('Arial', 11, 'bold'))
        frame_pagamento.pack(fill='x', padx=20, pady=10)
        
        # Dias de vencimento padrão
        frame_venc = tk.Frame(frame_pagamento, bg='#FFFFFF')
        frame_venc.pack(fill='x', padx=10, pady=5)
        tk.Label(frame_venc, text="Dias para vencimento padrão:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_config['dias_vencimento'] = tk.Entry(frame_venc, font=('Arial', 10), width=10)
        self.campos_config['dias_vencimento'].pack(anchor='w', pady=(5, 0))
        self.campos_config['dias_vencimento'].insert(0, str(self.configuracoes.get('dias_vencimento', 30)))
        
        # Juros de atraso
        frame_juros = tk.Frame(frame_pagamento, bg='#FFFFFF')
        frame_juros.pack(fill='x', padx=10, pady=5)
        tk.Label(frame_juros, text="Juros de atraso (% ao mês):", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_config['juros_atraso'] = tk.Entry(frame_juros, font=('Arial', 10), width=10)
        self.campos_config['juros_atraso'].pack(anchor='w', pady=(5, 0))
        self.campos_config['juros_atraso'].insert(0, str(self.configuracoes.get('juros_atraso', 2.0)))
        
        # Botões
        frame_botoes = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_botoes.pack(fill='x', padx=20, pady=30)
        
        btn_salvar = tk.Button(frame_botoes,
                              text="💾 Salvar Configurações",
                              bg='#FFA500',
                              fg='#000000',
                              font=('Arial', 12, 'bold'),
                              command=self.salvar_configuracoes,
                              relief='flat',
                              padx=20,
                              pady=10)
        btn_salvar.pack(side='left', padx=(0, 10))
        
        btn_restaurar = tk.Button(frame_botoes,
                                 text="🔄 Restaurar Padrões",
                                 bg='#666666',
                                 fg='#FFFFFF',
                                 font=('Arial', 12, 'bold'),
                                 command=self.restaurar_configuracoes_padrao,
                                 relief='flat',
                                 padx=20,
                                 pady=10)
        btn_restaurar.pack(side='left')
        
        # Configurar scroll
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
    
    def criar_aba_backup(self):
        """Cria a aba de backup e restore."""
        # Frame da aba
        self.frame_backup = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_backup, text="💾 Backup")
        
        # Título
        titulo = tk.Label(self.frame_backup,
                         text="Backup e Restauração",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 16, 'bold'))
        titulo.pack(pady=(20, 30))
        
        # Seção de backup
        frame_backup_section = tk.LabelFrame(self.frame_backup, text="Criar Backup", bg='#FFFFFF', fg='#333333', font=('Arial', 11, 'bold'))
        frame_backup_section.pack(fill='x', padx=20, pady=10)
        
        tk.Label(frame_backup_section,
                text="Crie um backup completo de todos os dados do sistema.",
                bg='#FFFFFF',
                fg='#666666',
                font=('Arial', 10)).pack(pady=10, padx=10)
        
        btn_backup = tk.Button(frame_backup_section,
                              text="📦 Criar Backup Completo",
                              bg='#3498DB',
                              fg='#FFFFFF',
                              font=('Arial', 12, 'bold'),
                              command=self.criar_backup,
                              relief='flat',
                              padx=20,
                              pady=10)
        btn_backup.pack(pady=10)
        
        # Seção de restauração
        frame_restore_section = tk.LabelFrame(self.frame_backup, text="Restaurar Backup", bg='#FFFFFF', fg='#333333', font=('Arial', 11, 'bold'))
        frame_restore_section.pack(fill='x', padx=20, pady=10)
        
        tk.Label(frame_restore_section,
                text="Restaure o sistema a partir de um arquivo de backup.\nATENÇÃO: Todos os dados atuais serão substituídos!",
                bg='#FFFFFF',
                fg='#666666',
                font=('Arial', 10),
                justify='center').pack(pady=10, padx=10)
        
        btn_restore = tk.Button(frame_restore_section,
                               text="📥 Restaurar Backup",
                               bg='#E74C3C',
                               fg='#FFFFFF',
                               font=('Arial', 12, 'bold'),
                               command=self.restaurar_backup,
                               relief='flat',
                               padx=20,
                               pady=10)
        btn_restore.pack(pady=10)
        
        # Seção de estatísticas
        frame_stats = tk.LabelFrame(self.frame_backup, text="Estatísticas do Sistema", bg='#FFFFFF', fg='#333333', font=('Arial', 11, 'bold'))
        frame_stats.pack(fill='x', padx=20, pady=10)
        
        self.label_stats = tk.Label(frame_stats,
                                   text="Carregando estatísticas...",
                                   bg='#FFFFFF',
                                   fg='#666666',
                                   font=('Arial', 10),
                                   justify='left')
        self.label_stats.pack(pady=10, padx=10, anchor='w')
        
        btn_atualizar_stats = tk.Button(frame_stats,
                                       text="🔄 Atualizar Estatísticas",
                                       bg='#95A5A6',
                                       fg='#FFFFFF',
                                       font=('Arial', 10, 'bold'),
                                       command=self.atualizar_estatisticas,
                                       relief='flat',
                                       padx=15,
                                       pady=8)
        btn_atualizar_stats.pack(pady=5)
        
        # Carregar estatísticas iniciais
        self.atualizar_estatisticas()
    
    def criar_aba_dados(self):
        """Cria a aba de gerenciamento de dados."""
        # Frame da aba
        self.frame_dados = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_dados, text="🗃️ Dados")
        
        # Título
        titulo = tk.Label(self.frame_dados,
                         text="Gerenciamento de Dados",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 16, 'bold'))
        titulo.pack(pady=(20, 30))
        
        # Seção de limpeza
        frame_limpeza = tk.LabelFrame(self.frame_dados, text="Limpeza de Dados", bg='#FFFFFF', fg='#333333', font=('Arial', 11, 'bold'))
        frame_limpeza.pack(fill='x', padx=20, pady=10)
        
        # Botões de limpeza
        frame_botoes_limpeza = tk.Frame(frame_limpeza, bg='#FFFFFF')
        frame_botoes_limpeza.pack(pady=10)
        
        btn_limpar_logs = tk.Button(frame_botoes_limpeza,
                                   text="🧹 Limpar Logs Antigos",
                                   bg='#F39C12',
                                   fg='#FFFFFF',
                                   font=('Arial', 10, 'bold'),
                                   command=self.limpar_logs,
                                   relief='flat',
                                   padx=15,
                                   pady=8)
        btn_limpar_logs.pack(side='left', padx=5)
        
        btn_otimizar_db = tk.Button(frame_botoes_limpeza,
                                   text="⚡ Otimizar Banco",
                                   bg='#9B59B6',
                                   fg='#FFFFFF',
                                   font=('Arial', 10, 'bold'),
                                   command=self.otimizar_banco,
                                   relief='flat',
                                   padx=15,
                                   pady=8)
        btn_otimizar_db.pack(side='left', padx=5)
        
        # Seção de exportação
        frame_export = tk.LabelFrame(self.frame_dados, text="Exportação de Dados", bg='#FFFFFF', fg='#333333', font=('Arial', 11, 'bold'))
        frame_export.pack(fill='x', padx=20, pady=10)
        
        tk.Label(frame_export,
                text="Exporte dados específicos para análise externa.",
                bg='#FFFFFF',
                fg='#666666',
                font=('Arial', 10)).pack(pady=5, padx=10)
        
        frame_botoes_export = tk.Frame(frame_export, bg='#FFFFFF')
        frame_botoes_export.pack(pady=10)
        
        btn_export_alunos = tk.Button(frame_botoes_export,
                                     text="👥 Exportar Alunos",
                                     bg='#27AE60',
                                     fg='#FFFFFF',
                                     font=('Arial', 10, 'bold'),
                                     command=lambda: self.exportar_dados('alunos'),
                                     relief='flat',
                                     padx=15,
                                     pady=8)
        btn_export_alunos.pack(side='left', padx=5)
        
        btn_export_financeiro = tk.Button(frame_botoes_export,
                                         text="💰 Exportar Financeiro",
                                         bg='#27AE60',
                                         fg='#FFFFFF',
                                         font=('Arial', 10, 'bold'),
                                         command=lambda: self.exportar_dados('financeiro'),
                                         relief='flat',
                                         padx=15,
                                         pady=8)
        btn_export_financeiro.pack(side='left', padx=5)
        
        btn_export_avaliacoes = tk.Button(frame_botoes_export,
                                         text="📊 Exportar Avaliações",
                                         bg='#27AE60',
                                         fg='#FFFFFF',
                                         font=('Arial', 10, 'bold'),
                                         command=lambda: self.exportar_dados('avaliacoes'),
                                         relief='flat',
                                         padx=15,
                                         pady=8)
        btn_export_avaliacoes.pack(side='left', padx=5)
        
        # Seção de importação
        frame_import = tk.LabelFrame(self.frame_dados, text="Importação de Dados", bg='#FFFFFF', fg='#333333', font=('Arial', 11, 'bold'))
        frame_import.pack(fill='x', padx=20, pady=10)
        
        tk.Label(frame_import,
                text="Importe dados de outros sistemas (CSV, Excel).",
                bg='#FFFFFF',
                fg='#666666',
                font=('Arial', 10)).pack(pady=5, padx=10)
        
        btn_import = tk.Button(frame_import,
                              text="📥 Importar Dados",
                              bg='#3498DB',
                              fg='#FFFFFF',
                              font=('Arial', 12, 'bold'),
                              command=self.importar_dados,
                              relief='flat',
                              padx=20,
                              pady=10)
        btn_import.pack(pady=10)
    
    def criar_aba_personalizacao(self):
        """Cria a aba de personalização."""
        # Frame da aba
        self.frame_personalizacao = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_personalizacao, text="🎨 Personalização")
        
        # Frame principal com scroll
        canvas = tk.Canvas(self.frame_personalizacao, bg='#FFFFFF')
        scrollbar = ttk.Scrollbar(self.frame_personalizacao, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#FFFFFF')
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Título
        titulo = tk.Label(
            scrollable_frame,
            text="Personalização da Interface",
            bg='#FFFFFF',
            fg='#FFA500',
            font=('Arial', 16, 'bold')
        )
        titulo.pack(pady=(20, 30))
        
        # Seção de cores
        frame_cores = tk.LabelFrame(
            self.frame_personalizacao, 
            text="Esquema de Cores", 
            bg='#FFFFFF', 
            fg='#333333', 
            font=('Arial', 11, 'bold')
        )
        frame_cores.pack(fill='x', padx=20, pady=10)
        
        tk.Label(
            frame_cores,
            text="Personalize as cores da interface do sistema.",
            bg='#FFFFFF',
            fg='#666666',
            font=('Arial', 10)
        ).pack(pady=5, padx=10)
        
        # Cores atuais
        frame_cores_atuais = tk.Frame(frame_cores, bg='#FFFFFF')
        frame_cores_atuais.pack(pady=10)
        
        # Cor primária
        frame_cor_primaria = tk.Frame(frame_cores_atuais, bg='#FFFFFF')
        frame_cor_primaria.pack(side='left', padx=10)
        tk.Label(
            frame_cor_primaria, 
            text="Cor Primária:", 
            bg='#FFFFFF', 
            fg='#333333', 
            font=('Arial', 10, 'bold')
        ).pack()
        self.cor_primaria_sample = tk.Label(
            frame_cor_primaria, 
            text="  ", 
            bg=self.configuracoes.get('cor_primaria', '#FFA500'),
            width=10, 
            height=2, 
            relief='solid'
        )
        self.cor_primaria_sample.pack(pady=5)
        
        # Cor secundária
        frame_cor_secundaria = tk.Frame(frame_cores_atuais, bg='#FFFFFF')
        frame_cor_secundaria.pack(side='left', padx=10)
        tk.Label(
            frame_cor_secundaria, 
            text="Cor Secundária:", 
            bg='#FFFFFF', 
            fg='#333333', 
            font=('Arial', 10, 'bold')
        ).pack()
        self.cor_secundaria_sample = tk.Label(
            frame_cor_secundaria, 
            text="  ", 
            bg=self.configuracoes.get('cor_secundaria', '#333333'),
            width=10, 
            height=2, 
            relief='solid'
        )
        self.cor_secundaria_sample.pack(pady=5)
        
        # Cor de fundo
        frame_cor_fundo = tk.Frame(frame_cores_atuais, bg='#FFFFFF')
        frame_cor_fundo.pack(side='left', padx=10)
        tk.Label(
            frame_cor_fundo, 
            text="Cor de Fundo:", 
            bg='#FFFFFF', 
            fg='#333333', 
            font=('Arial', 10, 'bold')
        ).pack()
        self.cor_fundo_sample = tk.Label(
            frame_cor_fundo, 
            text="  ", 
            bg=self.configuracoes.get('cor_fundo', '#FFFFFF'),
            width=10, 
            height=2, 
            relief='solid'
        )
        self.cor_fundo_sample.pack(pady=5)
        
        # Botões para selecionar cores
        frame_botoes_cores = tk.Frame(frame_cores, bg='#FFFFFF')
        frame_botoes_cores.pack(pady=10)
        
        btn_cor_primaria = tk.Button(
            frame_botoes_cores,
            text="Alterar Primária",
            command=lambda: self.selecionar_cor('primaria'),
            bg=self.configuracoes.get('cor_primaria', '#FFA500'),
            fg='#000000',
            font=('Arial', 9),
            relief='flat'
        )
        btn_cor_primaria.pack(side='left', padx=5)
        
        btn_cor_secundaria = tk.Button(
            frame_botoes_cores,
            text="Alterar Secundária",
            command=lambda: self.selecionar_cor('secundaria'),
            bg=self.configuracoes.get('cor_secundaria', '#333333'),
            fg='#FFFFFF',
            font=('Arial', 9),
            relief='flat'
        )
        btn_cor_secundaria.pack(side='left', padx=5)
        
        btn_cor_fundo = tk.Button(
            frame_botoes_cores,
            text="Alterar Fundo",
            command=lambda: self.selecionar_cor('fundo'),
            bg=self.configuracoes.get('cor_fundo', '#FFFFFF'),
            fg='#000000',
            font=('Arial', 9),
            relief='flat'
        )
        btn_cor_fundo.pack(side='left', padx=5)
        
        # Seção de paletas prontas
        frame_paletas = tk.LabelFrame(
            frame_cores, 
            text="Paletas Prontas", 
            bg='#FFFFFF',
            fg='#333333',
            font=('Arial', 11, 'bold')
        )
        frame_paletas.pack(fill='x', pady=10, padx=5)
        
        paletas = [
            {"nome": "Profissional", "primaria": "#3498DB", "secundaria": "#2C3E50", "fundo": "#ECF0F1"},
            {"nome": "Energético", "primaria": "#E74C3C", "secundaria": "#C0392B", "fundo": "#F9EBEA"},
            {"nome": "Natureza", "primaria": "#27AE60", "secundaria": "#16A085", "fundo": "#E8F8F5"},
            {"nome": "Premium", "primaria": "#9B59B6", "secundaria": "#8E44AD", "fundo": "#F5EEF8"},
            {"nome": "Escuro", "primaria": "#F39C12", "secundaria": "#34495E", "fundo": "#2C3E50"}
        ]
        
        frame_paletas_btns = tk.Frame(frame_paletas, bg='#FFFFFF')
        frame_paletas_btns.pack()
        
        for paleta in paletas:
            btn = tk.Button(
                frame_paletas_btns,
                text=paleta["nome"],
                command=lambda p=paleta: self.aplicar_paleta(p),
                bg=paleta["primaria"],
                fg="white",
                font=('Arial', 9),
                relief='flat',
                padx=10,
                pady=5
            )
            btn.pack(side='left', padx=5, pady=5)
            btn.bind("<Enter>", lambda e, b=btn: b.config(bg='#555555'))
            btn.bind("<Leave>", lambda e, b=btn, p=paleta: b.config(bg=p["primaria"]))
        
        # Seção de fonte
        frame_fonte = tk.LabelFrame(
            self.frame_personalizacao, 
            text="Configurações de Fonte", 
            bg='#FFFFFF', 
            fg='#333333', 
            font=('Arial', 11, 'bold')
        )
        frame_fonte.pack(fill='x', padx=20, pady=10)
        
        # Tamanho da fonte
        frame_tamanho_fonte = tk.Frame(frame_fonte, bg='#FFFFFF')
        frame_tamanho_fonte.pack(pady=10, padx=10)
        
        tk.Label(
            frame_tamanho_fonte, 
            text="Tamanho da Fonte:", 
            bg='#FFFFFF', 
            fg='#333333', 
            font=('Arial', 10, 'bold')
        ).pack(side='left')
        
        self.var_tamanho_fonte = tk.StringVar(value=str(self.configuracoes.get('tamanho_fonte', 10)))
        combo_tamanho = ttk.Combobox(
            frame_tamanho_fonte,
            textvariable=self.var_tamanho_fonte,
            values=['8', '9', '10', '11', '12', '14', '16'],
            state='readonly',
            width=10
        )
        combo_tamanho.pack(side='left', padx=(10, 0))
        
        # Seção de layout
        frame_layout = tk.LabelFrame(
            self.frame_personalizacao, 
            text="Layout da Interface", 
            bg='#FFFFFF', 
            fg='#333333', 
            font=('Arial', 11, 'bold')
        )
        frame_layout.pack(fill='x', padx=20, pady=10)
        
        # Modo compacto
        frame_compacto = tk.Frame(frame_layout, bg='#FFFFFF')
        frame_compacto.pack(fill='x', padx=10, pady=5)
        self.var_modo_compacto = tk.BooleanVar(value=self.configuracoes.get('modo_compacto', False))
        tk.Checkbutton(
            frame_compacto,
            text="Modo compacto (menos espaçamento)",
            variable=self.var_modo_compacto,
            bg='#FFFFFF',
            fg='#333333',
            font=('Arial', 10)
        ).pack(anchor='w')
        
        # Botão aplicar personalização - MODIFICADO
        frame_botao = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_botao.pack(fill='x', pady=20)
        
        btn_aplicar_personalizacao = tk.Button(
            frame_botao,
            text="🎨 Aplicar Personalização",
            bg='#9B59B6',
            fg='#FFFFFF',
            font=('Arial', 12, 'bold'),
            command=self.aplicar_personalizacao,
            relief='flat',
            padx=20,
            pady=10
        )
        btn_aplicar_personalizacao.pack()
        
        # Configurar scroll
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
        
        # Forçar atualização da interface
        self.frame_personalizacao.update_idletasks()

    def aplicar_paleta(self, paleta):
        """Aplica uma paleta de cores pré-definida"""
        self.cor_primaria_sample.config(bg=paleta["primaria"])
        self.cor_secundaria_sample.config(bg=paleta["secundaria"])
        self.cor_fundo_sample.config(bg=paleta["fundo"])
        
        # Atualiza configurações temporárias
        self.configuracoes.update({
            'cor_primaria': paleta["primaria"],
            'cor_secundaria': paleta["secundaria"],
            'cor_fundo': paleta["fundo"]
        })
    
    def criar_aba_sistema(self):
        """Cria a aba de informações do sistema."""
        # Frame da aba
        self.frame_sistema = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_sistema, text="ℹ️ Sistema")
        
        # Título
        titulo = tk.Label(self.frame_sistema,
                         text="Informações do Sistema",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 16, 'bold'))
        titulo.pack(pady=(20, 30))
        
        # Informações do sistema
        frame_info = tk.LabelFrame(self.frame_sistema, text="Detalhes do Sistema", bg='#FFFFFF', fg='#333333', font=('Arial', 11, 'bold'))
        frame_info.pack(fill='x', padx=20, pady=10)
        
        info_text = f"""
Sistema: Lioness Personal Estúdio (LPE)
Versão: 1.0.0
Desenvolvido em: Python 3.11
Interface: Tkinter
Banco de Dados: SQLite
Data de Criação: {datetime.now().strftime('%d/%m/%Y')}

Módulos Disponíveis:
• Gestão de Alunos
• Sistema Financeiro
• Gestão de Planos
• Criação de Treinos
• Anamnese Nutricional
• Avaliação Física
• Relatórios e Estatísticas
• Edição e Configurações

Funcionalidades:
• Cadastro completo de alunos
• Controle financeiro com boletos
• Planos personalizáveis
• Treinos com exercícios detalhados
• Anamnese nutricional científica
• Avaliação física com cálculos automáticos
• Backup e restauração
• Interface elegante e intuitiva
        """
        
        text_widget = tk.Text(frame_info,
                             font=('Arial', 10),
                             height=20,
                             wrap='word',
                             state='disabled',
                             bg='#F8F8F8',
                             fg='#333333')
        text_widget.pack(fill='both', expand=True, padx=10, pady=10)
        
        text_widget.config(state='normal')
        text_widget.insert('1.0', info_text.strip())
        text_widget.config(state='disabled')
        
        # Botões de ação
        frame_acoes_sistema = tk.Frame(self.frame_sistema, bg='#FFFFFF')
        frame_acoes_sistema.pack(pady=20)
        
        btn_sobre = tk.Button(frame_acoes_sistema,
                             text="ℹ️ Sobre o Sistema",
                             bg='#3498DB',
                             fg='#FFFFFF',
                             font=('Arial', 10, 'bold'),
                             command=self.mostrar_sobre,
                             relief='flat',
                             padx=15,
                             pady=8)
        btn_sobre.pack(side='left', padx=5)
        
        btn_licenca = tk.Button(frame_acoes_sistema,
                               text="📄 Licença",
                               bg='#95A5A6',
                               fg='#FFFFFF',
                               font=('Arial', 10, 'bold'),
                               command=self.mostrar_licenca,
                               relief='flat',
                               padx=15,
                               pady=8)
        btn_licenca.pack(side='left', padx=5)
        
        btn_suporte = tk.Button(frame_acoes_sistema,
                               text="🆘 Suporte",
                               bg='#E67E22',
                               fg='#FFFFFF',
                               font=('Arial', 10, 'bold'),
                               command=self.mostrar_suporte,
                               relief='flat',
                               padx=15,
                               pady=8)
        btn_suporte.pack(side='left', padx=5)
    
    def carregar_configuracoes(self):
        """Carrega as configurações do arquivo JSON."""
        configuracoes_padrao = {
            'nome_empresa': 'Lioness Personal Estúdio',
            'cnpj': '',
            'endereco': '',
            'telefone': '',
            'email': '',
            'backup_automatico': True,
            'notificacoes': True,
            'dias_vencimento': 30,
            'juros_atraso': 2.0,
            'tamanho_fonte': 10,
            'modo_compacto': False,
            'cor_primaria': '#FFA500',
            'cor_secundaria': '#333333',
            'cor_fundo': '#FFFFFF'
        }
        
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    configuracoes = json.load(f)
                    # Mesclar com configurações padrão
                    configuracoes_padrao.update(configuracoes)
            return configuracoes_padrao
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao carregar configurações: {str(e)}")
            return configuracoes_padrao
    
    def salvar_configuracoes(self):
        """Salva as configurações no arquivo JSON."""
        try:
            configuracoes = {
                'nome_empresa': self.campos_config['nome_empresa'].get(),
                'cnpj': self.campos_config['cnpj'].get(),
                'endereco': self.campos_config['endereco'].get(),
                'telefone': self.campos_config['telefone'].get(),
                'email': self.campos_config['email'].get(),
                'backup_automatico': self.var_backup_auto.get(),
                'notificacoes': self.var_notificacoes.get(),
                'dias_vencimento': int(self.campos_config['dias_vencimento'].get() or 30),
                'juros_atraso': float(self.campos_config['juros_atraso'].get() or 2.0),
                'tamanho_fonte': int(self.var_tamanho_fonte.get()),
                'modo_compacto': self.var_modo_compacto.get(),
                'cor_primaria': self.configuracoes.get('cor_primaria', '#FFA500'),
                'cor_secundaria': self.configuracoes.get('cor_secundaria', '#333333'),
                'cor_fundo': self.configuracoes.get('cor_fundo', '#FFFFFF')
            }
            
            # Criar diretório se não existir
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(configuracoes, f, indent=4, ensure_ascii=False)
            
            self.configuracoes = configuracoes
            messagebox.showinfo("Sucesso", "Configurações salvas com sucesso!")
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao salvar configurações: {str(e)}")
    
    def restaurar_configuracoes_padrao(self):
        """Restaura as configurações padrão."""
        resposta = messagebox.askyesno("Confirmar", "Deseja restaurar todas as configurações para os valores padrão?")
        if resposta:
            # Limpar campos
            self.campos_config['nome_empresa'].delete(0, 'end')
            self.campos_config['nome_empresa'].insert(0, 'Lioness Personal Estúdio')
            self.campos_config['cnpj'].delete(0, 'end')
            self.campos_config['endereco'].delete(0, 'end')
            self.campos_config['telefone'].delete(0, 'end')
            self.campos_config['email'].delete(0, 'end')
            self.campos_config['dias_vencimento'].delete(0, 'end')
            self.campos_config['dias_vencimento'].insert(0, '30')
            self.campos_config['juros_atraso'].delete(0, 'end')
            self.campos_config['juros_atraso'].insert(0, '2.0')
            
            self.var_backup_auto.set(True)
            self.var_notificacoes.set(True)
            self.var_tamanho_fonte.set('10')
            self.var_modo_compacto.set(False)
            
            # Restaurar cores padrão
            self.configuracoes['cor_primaria'] = '#FFA500'
            self.configuracoes['cor_secundaria'] = '#333333'
            self.configuracoes['cor_fundo'] = '#FFFFFF'
            
            # Atualizar amostras de cores
            self.cor_primaria_sample.config(bg='#FFA500')
            self.cor_secundaria_sample.config(bg='#333333')
            self.cor_fundo_sample.config(bg='#FFFFFF')
            
            messagebox.showinfo("Sucesso", "Configurações restauradas para os valores padrão!")
    
    def criar_backup(self):
        """Cria um backup completo do sistema."""
        try:
            # Escolher local para salvar
            arquivo_backup = filedialog.asksaveasfilename(
                title="Salvar Backup",
                defaultextension=".db",
                filetypes=[("Arquivo de Backup", "*.db"), ("Todos os arquivos", "*.*")],
                initialfile=f"lpe_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
            )
            
            if arquivo_backup:
                db_manager.backup_database(arquivo_backup)
                messagebox.showinfo("Sucesso", f"Backup criado com sucesso!\nLocal: {arquivo_backup}")
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao criar backup: {str(e)}")
    
    def restaurar_backup(self):
        """Restaura o sistema a partir de um backup."""
        resposta = messagebox.askyesno("ATENÇÃO", 
                                     "Restaurar um backup substituirá TODOS os dados atuais!\n\n"
                                     "Esta operação é irreversível!\n\n"
                                     "Deseja continuar?")
        if resposta:
            try:
                # Escolher arquivo de backup
                arquivo_backup = filedialog.askopenfilename(
                    title="Selecionar Backup",
                    filetypes=[("Arquivo de Backup", "*.db"), ("Todos os arquivos", "*.*")]
                )
                
                if arquivo_backup:
                    db_manager.restore_database(arquivo_backup)
                    messagebox.showinfo("Sucesso", "Backup restaurado com sucesso!\nReinicie o sistema para aplicar as mudanças.")
            except Exception as e:
                messagebox.showerror("Erro", f"Erro ao restaurar backup: {str(e)}")
    
    def atualizar_estatisticas(self):
        """Atualiza as estatísticas do sistema."""
        try:
            # Contar registros
            total_alunos = aluno_dao.contar_alunos()
            total_pagamentos = pagamento_dao.contar_pagamentos()
            total_planos = plano_dao.contar_planos()
            total_treinos = treino_dao.contar_treinos()
            total_anamneses = anamnese_dao.contar_anamneses()
            total_avaliacoes = avaliacao_dao.contar_avaliacoes()
            
            # Calcular tamanho do banco
            db_path = db_manager.db_path
            tamanho_db = os.path.getsize(db_path) / (1024 * 1024)  # MB
            
            stats_text = f"""Estatísticas do Sistema:

📊 Registros:
• Alunos: {total_alunos}
• Pagamentos: {total_pagamentos}
• Planos: {total_planos}
• Treinos: {total_treinos}
• Anamneses: {total_anamneses}
• Avaliações: {total_avaliacoes}

💾 Banco de Dados:
• Tamanho: {tamanho_db:.2f} MB
• Local: {db_path}

🕒 Última atualização: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}"""
            
            self.label_stats.config(text=stats_text)
            
        except Exception as e:
            self.label_stats.config(text=f"Erro ao carregar estatísticas: {str(e)}")
    
    def limpar_logs(self):
        """Limpa logs antigos do sistema."""
        try:
            # Definir o diretório de logs (ajuste conforme sua estrutura)
            log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'logs')
            
            if not os.path.exists(log_dir):
                messagebox.showinfo("Informação", "Nenhum log encontrado para limpar.")
                return
                
            # Contar arquivos de log antes
            logs_antes = len([f for f in os.listdir(log_dir) if f.endswith('.log')])
            
            # Limpar logs com mais de 30 dias
            cutoff = datetime.now().timestamp() - (30 * 24 * 60 * 60)
            removidos = 0
            
            for filename in os.listdir(log_dir):
                if filename.endswith('.log'):
                    filepath = os.path.join(log_dir, filename)
                    if os.path.getmtime(filepath) < cutoff:
                        os.remove(filepath)
                        removidos += 1
            
            messagebox.showinfo("Sucesso", 
                             f"Limpeza de logs concluída!\n"
                             f"Logs antes: {logs_antes}\n"
                             f"Logs removidos: {removidos}\n"
                             f"Logs restantes: {logs_antes - removidos}")
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao limpar logs: {str(e)}")
    
    def otimizar_banco(self):
        """Otimiza o banco de dados."""
        try:
            # Executar VACUUM no SQLite
            with db_manager.get_connection() as conn:
                conn.execute("VACUUM")
            messagebox.showinfo("Sucesso", "Banco de dados otimizado com sucesso!")
            self.atualizar_estatisticas()
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao otimizar banco: {str(e)}")
    
    def exportar_dados(self, tipo):
        """Exporta dados específicos para CSV."""
        try:
            # Obter dados do banco de dados
            dados = []
            colunas = []
            
            if tipo == 'alunos':
                dados = aluno_dao.listar_todos_alunos(apenas_ativos=False)
                colunas = ['id', 'nome', 'cpf', 'data_nascimento', 'telefone', 'email', 
                          'endereco', 'observacoes', 'data_cadastro', 'ativo']
            elif tipo == 'financeiro':
                dados = pagamento_dao.listar_pagamentos(completo=True)
                colunas = ['id', 'id_aluno', 'valor', 'data_vencimento', 'data_pagamento', 
                           'status', 'metodo_pagamento', 'observacoes']
            elif tipo == 'avaliacoes':
                dados = avaliacao_dao.listar_todas_avaliacoes()
                colunas = ['id', 'id_aluno', 'data_avaliacao', 'peso', 'altura', 'imc', 
                          'percentual_gordura', 'massa_muscular', 'observacoes']
            else:
                messagebox.showerror("Erro", "Tipo de exportação não suportado!")
                return
            
            if not dados:
                messagebox.showinfo("Informação", f"Nenhum dado encontrado para exportar ({tipo}).")
                return
            
            # Pedir local para salvar
            arquivo = filedialog.asksaveasfilename(
                title=f"Exportar {tipo}",
                defaultextension=".csv",
                filetypes=[("CSV (Valores separados por vírgula)", "*.csv")],
                initialfile=f"lpe_export_{tipo}_{datetime.now().strftime('%Y%m%d')}.csv"
            )
            
            if arquivo:
                with open(arquivo, 'w', newline='', encoding='utf-8') as csvfile:
                    writer = csv.DictWriter(csvfile, fieldnames=colunas)
                    writer.writeheader()
                    writer.writerows(dados)
                
                messagebox.showinfo("Sucesso", f"Dados exportados com sucesso para:\n{arquivo}")
                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao exportar dados: {str(e)}")
    
    def importar_dados(self):
        """Importa dados de arquivos externos (CSV)."""
        try:
            # Pedir arquivo para importar
            arquivo = filedialog.askopenfilename(
                title="Selecionar arquivo para importar",
                filetypes=[("CSV (Valores separados por vírgula)", "*.csv"), ("Todos os arquivos", "*.*")]
            )
            
            if not arquivo:
                return
                
            # Detectar tipo de importação pelo nome do arquivo
            tipo = None
            if 'aluno' in arquivo.lower():
                tipo = 'alunos'
            elif 'financeiro' in arquivo.lower() or 'pagamento' in arquivo.lower():
                tipo = 'financeiro'
            elif 'avaliacao' in arquivo.lower():
                tipo = 'avaliacoes'
            else:
                # Se não detectar, perguntar ao usuário
                tipo = simpledialog.askstring("Tipo de Importação", 
                                             "Não foi possível detectar o tipo de dados.\n"
                                             "Digite o tipo (alunos, financeiro ou avaliacoes):")
                if not tipo:
                    return
            
            # Ler arquivo CSV
            with open(arquivo, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                dados = [row for row in reader]
            
            if not dados:
                messagebox.showinfo("Informação", "Nenhum dado encontrado no arquivo.")
                return
            
            # Processar importação
            registros_importados = 0
            erros = 0
            
            if tipo == 'alunos':
                for linha in dados:
                    try:
                        aluno = {
                            'nome': linha.get('nome', ''),
                            'cpf': linha.get('cpf', ''),
                            'data_nascimento': linha.get('data_nascimento', ''),
                            'telefone': linha.get('telefone', ''),
                            'email': linha.get('email', ''),
                            'endereco': linha.get('endereco', ''),
                            'observacoes': linha.get('observacoes', '')
                        }
                        aluno_dao.cadastrar_aluno(aluno)
                        registros_importados += 1
                    except Exception as e:
                        erros += 1
                        print(f"Erro ao importar aluno: {str(e)}")
            
            elif tipo == 'financeiro':
                for linha in dados:
                    try:
                        pagamento = {
                            'id_aluno': int(linha.get('id_aluno', 0)),
                            'valor': float(linha.get('valor', 0)),
                            'data_vencimento': linha.get('data_vencimento', ''),
                            'data_pagamento': linha.get('data_pagamento', ''),
                            'status': linha.get('status', 'pendente'),
                            'metodo_pagamento': linha.get('metodo_pagamento', ''),
                            'observacoes': linha.get('observacoes', '')
                        }
                        pagamento_dao.cadastrar_pagamento(pagamento)
                        registros_importados += 1
                    except Exception as e:
                        erros += 1
                        print(f"Erro ao importar pagamento: {str(e)}")
            
            elif tipo == 'avaliacoes':
                for linha in dados:
                    try:
                        avaliacao = {
                            'id_aluno': int(linha.get('id_aluno', 0)),
                            'data_avaliacao': linha.get('data_avaliacao', ''),
                            'peso': float(linha.get('peso', 0)),
                            'altura': float(linha.get('altura', 0)),
                            'imc': float(linha.get('imc', 0)),
                            'percentual_gordura': float(linha.get('percentual_gordura', 0)),
                            'massa_muscular': float(linha.get('massa_muscular', 0)),
                            'observacoes': linha.get('observacoes', '')
                        }
                        avaliacao_dao.cadastrar_avaliacao(avaliacao)
                        registros_importados += 1
                    except Exception as e:
                        erros += 1
                        print(f"Erro ao importar avaliação: {str(e)}")
            
            else:
                messagebox.showerror("Erro", "Tipo de importação não suportado!")
                return
            
            messagebox.showinfo("Resultado", 
                              f"Importação concluída!\n"
                              f"Registros importados: {registros_importados}\n"
                              f"Erros: {erros}")
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao importar dados: {str(e)}")
    
    def selecionar_cor(self, tipo):
        """Permite selecionar uma cor para personalização."""
        cor = colorchooser.askcolor(
            title=f"Selecionar Cor {tipo.capitalize()}",
            initialcolor=self.configuracoes.get(f'cor_{tipo}', '#FFFFFF')
        )
        
        if cor and cor[1]:  # cor[1] é o código hexadecimal
            # Atualizar amostra de cor
            if tipo == 'primaria':
                self.cor_primaria_sample.config(bg=cor[1])
                self.configuracoes['cor_primaria'] = cor[1]
            elif tipo == 'secundaria':
                self.cor_secundaria_sample.config(bg=cor[1])
                self.configuracoes['cor_secundaria'] = cor[1]
            elif tipo == 'fundo':
                self.cor_fundo_sample.config(bg=cor[1])
                self.configuracoes['cor_fundo'] = cor[1]
    
    def aplicar_personalizacao(self):
        """
        Aplica todas as personalizações da interface incluindo:
        - Cores (primária, secundária e fundo)
        - Tamanho da fonte
        - Modo compacto
        - Estilos globais
        """
        try:
            # Obter todas as configurações atuais
            config = {
                'tamanho_fonte': int(self.var_tamanho_fonte.get()),
                'modo_compacto': self.var_modo_compacto.get(),
                'cor_primaria': self.configuracoes.get('cor_primaria', '#FFA500'),
                'cor_secundaria': self.configuracoes.get('cor_secundaria', '#333333'),
                'cor_fundo': self.configuracoes.get('cor_fundo', '#FFFFFF')
            }

            # 1. Aplicar configurações de fonte
            estilo = ttk.Style()
            estilo.configure('.', 
                           font=('Arial', config['tamanho_fonte']),
                           background=config['cor_fundo'])
            
            # 2. Configurar espaçamento
            padding = 5 if config['modo_compacto'] else 10
            estilo.configure('TFrame', padding=padding)
            estilo.configure('TButton', padding=padding)
            estilo.configure('TEntry', padding=padding-2)
            estilo.configure('TCombobox', padding=padding-2)

            # 3. Aplicar esquema de cores
            self._aplicar_cores_interface(config)

            # 4. Atualizar e salvar configurações
            self.configuracoes.update(config)
            self.salvar_configuracoes()
            
            messagebox.showinfo("Sucesso", 
                              "Personalização aplicada com sucesso!\n"
                              "Algumas mudanças podem requerer reinicialização.")

        except ValueError as ve:
            messagebox.showerror("Erro", f"Valor inválido: {str(ve)}")
        except Exception as e:
            messagebox.showerror("Erro", f"Falha ao aplicar personalização:\n{str(e)}")

    def _aplicar_cores_interface(self, config):
        """
        Método interno para aplicar o esquema de cores na interface
        Args:
            config (dict): Dicionário com as configurações de cores
        """
        # Aplicar ao frame principal
        self.main_frame.config(bg=config['cor_fundo'])
        
        # Atualizar todos os widgets
        for widget in self.main_frame.winfo_children():
            self._aplicar_cores_widget(widget, config)

    def _aplicar_cores_widget(self, widget, config):
        """
        Aplica cores a um widget específico baseado nas configurações
        Args:
            widget: Widget tkinter a ser configurado
            config (dict): Configurações de cores
        """
        try:
            # Ignorar widgets de amostra de cor e botões de ação
            if hasattr(widget, '_no_style') or widget in [self.cor_primaria_sample, 
                                                       self.cor_secundaria_sample, 
                                                       self.cor_fundo_sample]:
                return
                
            if isinstance(widget, tk.Label):
                if widget['fg'] == '#FFA500':  # Títulos
                    widget.config(fg=config['cor_primaria'],
                                bg=config['cor_fundo'])
                elif widget['fg'] == '#333333':  # Labels normais
                    widget.config(bg=config['cor_fundo'])
                    
            elif isinstance(widget, tk.Button):
                # Não modificar botões de ação específicos
                if widget['text'] in ["🎨 Aplicar Personalização", "Alterar Primária", 
                                    "Alterar Secundária", "Alterar Fundo"]:
                    return
                elif 'primary' in str(widget['bg']).lower():
                    widget.config(bg=config['cor_primaria'])
                elif 'secondary' in str(widget['bg']).lower():
                    widget.config(bg=config['cor_secundaria'])
                    
            elif isinstance(widget, tk.Frame):
                widget.config(bg=config['cor_fundo'])
                # Aplicar recursivamente a widgets filhos
                for child in widget.winfo_children():
                    self._aplicar_cores_widget(child, config)
                    
        except tk.TclError:
            # Ignorar erros de widgets que não suportam certas propriedades
            pass
    
    def mostrar_sobre(self):
        """Mostra informações sobre o sistema."""
        sobre_text = """
SOBRE O SISTEMA

Sistema: Lioness Personal Estúdio (LPE)
Versão: 1.0.0
Desenvolvido em: Python 3.11
Interface: Tkinter
Banco de Dados: SQLite
Data de Criação: 15/08/2025

O Lioness Personal Estúdio é um sistema completo para gestão de academias, 
estúdios e personal trainers, oferecendo um conjunto de módulos integrados 
para otimizar o gerenciamento e facilitar o acompanhamento de alunos.

Módulos Disponíveis:
• Gestão de Alunos
• Sistema Financeiro
• Gestão de Planos
• Criação de Treinos
• Anamnese Nutricional
• Avaliação Física
• Relatórios e Estatísticas
• Edição e Configurações
• Exportação de Avaliações

Principais Funcionalidades:
• Cadastro completo de alunos
• Controle financeiro integrado
• Criação e gerenciamento de planos e treinos
• Anamnese nutricional detalhada
• Avaliação física com relatórios
• Geração e exportação de relatórios personalizados
• Backup e restauração de dados
• Interface intuitiva e fácil de usar

© 2025 - Todos os direitos reservados
"""
        messagebox.showinfo("Sobre o Sistema", sobre_text.strip())
    
    def mostrar_sobre(self):
        """Mostra informações sobre o sistema."""
        sobre_text = """
SOBRE O SISTEMA

Sistema: Lioness Personal Estúdio (LPE)
Versão: 1.0.0
Desenvolvido em: Python 3.11
Interface: Tkinter
Banco de Dados: SQLite
Data de Criação: 15/08/2025

O Lioness Personal Estúdio é um sistema completo para gestão de academias, 
estúdios e personal trainers, oferecendo um conjunto de módulos integrados 
para otimizar o gerenciamento e facilitar o acompanhamento de alunos.

Módulos Disponíveis:
• Gestão de Alunos
• Sistema Financeiro
• Gestão de Planos
• Criação de Treinos
• Anamnese Nutricional
• Avaliação Física
• Relatórios e Estatísticas
• Edição e Configurações
• Exportação de Avaliações

Principais Funcionalidades:
• Cadastro completo de alunos
• Controle financeiro integrado
• Criação e gerenciamento de planos e treinos
• Anamnese nutricional detalhada
• Avaliação física com relatórios
• Geração e exportação de relatórios personalizados
• Backup e restauração de dados
• Interface intuitiva e fácil de usar

© 2025 - Todos os direitos reservados
"""
        messagebox.showinfo("Sobre o Sistema", sobre_text.strip())
    
    def mostrar_licenca(self):
        """Mostra informações de licença."""
        licenca_text = """
LICENÇA DE USO

Este software é fornecido "como está", sem garantias de qualquer tipo.
O uso deste software é de responsabilidade exclusiva do usuário e somente
poderá ser utilizado, instalado ou distribuído mediante autorização expressa
e por escrito do desenvolvedor, Marilson Nascimento.

É proibida a reprodução, modificação, distribuição ou revenda deste software
sem autorização prévia.

Funcionalidades incluídas:
• Gestão completa de alunos
• Sistema financeiro integrado
• Criação e gerenciamento de planos e treinos
• Anamnese nutricional científica
• Avaliação física profissional
• Relatórios e exportações
• Backup e restauração de dados
• Interface amigável e personalizável

Para suporte técnico, consulte a seção de Suporte Técnico abaixo.
"""
        messagebox.showinfo("Licença", licenca_text.strip())
    
    def mostrar_suporte(self):
        """Mostra informações de suporte."""
        suporte_text = """
SUPORTE TÉCNICO

Desenvolvedor: Marilson Nascimento
E-mail: marilsonns15@gmail.com
Telefone: (71) 98810-8486 — (71) 99985-6956
Website: Instagram - Lioness Personal Estúdio

Horário de Atendimento:
Segunda a Sexta: 8h às 17h

Antes de entrar em contato:
• Verifique se possui a versão mais recente do sistema
• Tenha em mãos uma descrição detalhada do problema
• Faça backup dos seus dados

Tempo estimado de resposta: até 24 horas úteis
"""
        messagebox.showinfo("Suporte Técnico", suporte_text.strip())
    
    def mostrar_suporte(self):
        """Mostra informações de suporte."""
        suporte_text = """
SUPORTE TÉCNICO

Desenvolvedor: Marilson Nascimento
E-mail: marilsonns15@gmail.com
Telefone: (71) 98810-8486 — (71) 99985-6956
Website: Instagram - Lioness Personal Estúdio

Horário de Atendimento:
Segunda a Sexta: 8h às 17h

Antes de entrar em contato:
• Verifique se possui a versão mais recente do sistema
• Tenha em mãos uma descrição detalhada do problema
• Faça backup dos seus dados

Tempo estimado de resposta: até 24 horas úteis
"""
        messagebox.showinfo("Suporte Técnico", suporte_text.strip())