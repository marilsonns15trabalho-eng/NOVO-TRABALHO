#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Módulo Financeiro
Versão Completa com Filtro Dinâmico, Geração em Lote, Ordenação e Validações
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime, date, timedelta
import os
import sys
import csv
from typing import Optional, List
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import matplotlib.pyplot as plt
import uuid
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.aluno import Aluno
from models.pagamento import Pagamento
from data.aluno_dao import aluno_dao
from data.pagamento_dao import pagamento_dao
from financial.boleto_generator import boleto_generator
from financial.comprovante_generator import comprovante_generator
from data.database import db_manager


class Despesa:
    """
    Classe que representa uma despesa realizada pelo estúdio.
    """
    def __init__(self,
                 valor: float,
                 data_despesa: date,
                 categoria: str = "Outros",
                 descricao: str = "",
                 metodo_pagamento: str = "Dinheiro"):
        self.id: Optional[int] = None
        self.valor = valor
        self.data_despesa = data_despesa
        self.categoria = categoria
        self.descricao = descricao
        self.metodo_pagamento = metodo_pagamento
        self.data_criacao = datetime.now()
        self.numero_registro = self._gerar_numero_registro()

    def _gerar_numero_registro(self) -> str:
        """Gera um número único para a despesa."""
        hoje = datetime.now()
        prefixo = f"DESP{hoje.strftime('%Y%m%d')}"
        sufixo = str(uuid.uuid4().int)[:6]
        return f"{prefixo}{sufixo}"

    @property
    def valor_formatado(self) -> str:
        """Retorna o valor formatado em reais."""
        return f"R$ {self.valor:.2f}".replace('.', ',')

    def to_dict(self) -> dict:
        """Converte a despesa para um dicionário."""
        return {
            'id': self.id,
            'valor': self.valor,
            'data_despesa': self.data_despesa.isoformat(),
            'categoria': self.categoria,
            'descricao': self.descricao,
            'metodo_pagamento': self.metodo_pagamento,
            'numero_registro': self.numero_registro,
            'data_criacao': self.data_criacao.isoformat(),
            'valor_formatado': self.valor_formatado
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Despesa':
        """Cria uma despesa a partir de um dicionário."""
        despesa = cls(
            valor=data.get('valor', 0.0),
            data_despesa=datetime.fromisoformat(data['data_despesa']).date(),
            categoria=data.get('categoria', 'Outros'),
            descricao=data.get('descricao', ''),
            metodo_pagamento=data.get('metodo_pagamento', 'Dinheiro')
        )
        despesa.id = data.get('id')
        despesa.numero_registro = data.get('numero_registro', despesa.numero_registro)
        if data.get('data_criacao'):
            despesa.data_criacao = datetime.fromisoformat(data['data_criacao'])
        return despesa


class DespesaDAO:
    """Data Access Object para operações com despesas."""
    def __init__(self):
        self.db = db_manager

    def criar_despesa(self, despesa: Despesa) -> int:
        """Cria uma nova despesa no banco de dados."""
        query = '''
            INSERT INTO despesas (
                valor, data_despesa, categoria, descricao, 
                metodo_pagamento, numero_registro, data_criacao
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        '''
        params = (
            despesa.valor,
            despesa.data_despesa.isoformat(),
            despesa.categoria,
            despesa.descricao,
            despesa.metodo_pagamento,
            despesa.numero_registro,
            despesa.data_criacao.isoformat()
        )
        despesa_id = self.db.execute_insert(query, params)
        despesa.id = despesa_id
        return despesa_id

    def listar_todas_despesas(self, limite: Optional[int] = None) -> List[Despesa]:
        """Lista todas as despesas."""
        query = "SELECT * FROM despesas ORDER BY data_despesa DESC"
        if limite:
            query += f" LIMIT {limite}"
        resultados = self.db.execute_query(query)
        return [self._row_to_despesa(row) for row in resultados]

    def buscar_despesa_por_id(self, despesa_id: int) -> Optional[Despesa]:
        """Busca uma despesa pelo ID."""
        query = "SELECT * FROM despesas WHERE id = ?"
        resultados = self.db.execute_query(query, (despesa_id,))
        if resultados:
            return self._row_to_despesa(resultados[0])
        return None

    def buscar_despesas_por_periodo(self, data_inicio: date, data_fim: date) -> List[Despesa]:
        """Busca despesas em um período específico."""
        query = '''
            SELECT * FROM despesas 
            WHERE data_despesa BETWEEN ? AND ? 
            ORDER BY data_despesa DESC
        '''
        params = (data_inicio.isoformat(), data_fim.isoformat())
        resultados = self.db.execute_query(query, params)
        return [self._row_to_despesa(row) for row in resultados]

    def calcular_total_por_periodo(self, data_inicio: date, data_fim: date) -> float:
        """Calcula o total de despesas em um período."""
        query = '''
            SELECT SUM(valor) FROM despesas 
            WHERE data_despesa BETWEEN ? AND ?
        '''
        params = (data_inicio.isoformat(), data_fim.isoformat())
        resultado = self.db.execute_query(query, params)
        return resultado[0][0] if resultado and resultado[0][0] else 0.0

    def atualizar_despesa(self, despesa: Despesa) -> bool:
        """Atualiza uma despesa no banco de dados."""
        query = '''
            UPDATE despesas SET
                valor = ?, data_despesa = ?, categoria = ?, 
                descricao = ?, metodo_pagamento = ?
            WHERE id = ?
        '''
        params = (
            despesa.valor,
            despesa.data_despesa.isoformat(),
            despesa.categoria,
            despesa.descricao,
            despesa.metodo_pagamento,
            despesa.id
        )
        linhas_afetadas = self.db.execute_update(query, params)
        return linhas_afetadas > 0

    def _row_to_despesa(self, row) -> Despesa:
        """Converte uma linha do banco de dados em uma instância de Despesa."""
        despesa = Despesa(
            valor=row["valor"],
            data_despesa=datetime.fromisoformat(row["data_despesa"]).date(),
            categoria=row["categoria"] or "Outros",
            descricao=row["descricao"] or "",
            metodo_pagamento=row["metodo_pagamento"] or "Dinheiro"
        )
        despesa.id = row["id"]
        despesa.numero_registro = row["numero_registro"]
        despesa.data_criacao = datetime.fromisoformat(row["data_criacao"])
        return despesa


despesa_dao = DespesaDAO()


class ModuloFinanceiro:
    def __init__(self, parent_frame):
        self.parent_frame = parent_frame
        self.pagamento_selecionado = None
        self.despesa_selecionada = None
        self.todos_alunos = []
        self.boletos_selecionados = {}
        self.criar_interface()

    def verificar_boletos_pendentes(self):
        """Verifica se há boletos pendentes e exibe aviso."""
        try:
            pagamentos = pagamento_dao.listar_todos_pagamentos()
            pendentes = [p for p in pagamentos if p.status.lower() in ['pendente', 'vencido']]
            if pendentes:
                vencidos = len([p for p in pendentes if p.status.lower() == 'vencido'])
                msg = f"⚠️ Atenção!\n\nVocê tem {len(pendentes)} boleto(s) pendente(s)!\n"
                if vencidos > 0:
                    msg += f"{vencidos} deles estão VENCIDOS!\n\n"
                msg += "Vá até a aba '📄 BOLETOS' para gerenciar."
                messagebox.showwarning("Boletos Pendentes", msg)
        except:
            pass

    def validar_data_futura(self, data_verificar: date) -> bool:
        """Valida se a data não é absurdamente futura (mais de 100 anos)."""
        if data_verificar.year > datetime.now().year + 100:
            return False
        return True

    def criar_interface(self):
        """Cria a interface principal do módulo financeiro."""
        for widget in self.parent_frame.winfo_children():
            widget.destroy()
        
        self.main_frame = tk.Frame(self.parent_frame, bg='#FFFFFF')
        self.main_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        titulo = tk.Label(self.main_frame,
                         text="Gestão Financeira",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 18, 'bold'))
        titulo.pack(pady=(0, 20))
        
        self.notebook = ttk.Notebook(self.main_frame)
        self.notebook.pack(fill='both', expand=True)
        
        self.criar_aba_pagamentos()
        self.criar_aba_novo_pagamento()
        self.criar_aba_nova_despesa()
        self.criar_aba_boletos()
        self.criar_aba_relatorios()
        self.criar_aba_edicao()
        
        self.carregar_lista_pagamentos()
        self.carregar_combo_alunos()
        self.verificar_boletos_pendentes()

    def criar_aba_pagamentos(self):
        """Cria a aba de fluxo de caixa (pagamentos e despesas)."""
        self.frame_pagamentos = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_pagamentos, text="💰 Fluxo de Caixa")
        
        frame_acoes = tk.Frame(self.frame_pagamentos, bg='#FFFFFF')
        frame_acoes.pack(fill='x', pady=(10, 20), padx=10)
        
        self.btn_gerar_boleto = tk.Button(frame_acoes,
                                         text="📄 Gerar Boleto",
                                         bg='#FFA500',
                                         fg='#000000',
                                         font=('Arial', 10, 'bold'),
                                         command=self.gerar_boleto_selecionado,
                                         relief='flat',
                                         padx=15,
                                         pady=8,
                                         state='disabled')
        self.btn_gerar_boleto.pack(side='left', padx=(0, 10))
        
        self.btn_gerar_comprovante = tk.Button(frame_acoes,
                                              text="📋 Gerar Comprovante",
                                              bg='#4ECDC4',
                                              fg='#000000',
                                              font=('Arial', 10, 'bold'),
                                              command=self.gerar_comprovante_selecionado,
                                              relief='flat',
                                              padx=15,
                                              pady=8,
                                              state='disabled')
        self.btn_gerar_comprovante.pack(side='left', padx=(0, 10))
        
        self.btn_editar = tk.Button(frame_acoes,
                                   text="✏️ Editar",
                                   bg='#333333',
                                   fg='#FFFFFF',
                                   font=('Arial', 10, 'bold'),
                                   command=self.editar_item_selecionado,
                                   relief='flat',
                                   padx=15,
                                   pady=8,
                                   state='disabled')
        self.btn_editar.pack(side='left', padx=(0, 10))
        
        btn_atualizar = tk.Button(frame_acoes,
                                 text="🔄 Atualizar",
                                 bg='#95A5A6',
                                 fg='#FFFFFF',
                                 font=('Arial', 10, 'bold'),
                                 command=self.carregar_lista_pagamentos,
                                 relief='flat',
                                 padx=15,
                                 pady=8)
        btn_atualizar.pack(side='right')
        
        frame_filtros = tk.Frame(self.frame_pagamentos, bg='#FFFFFF')
        frame_filtros.pack(fill='x', pady=(0, 20), padx=10)
        
        tk.Label(frame_filtros,
                text="Filtros:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).pack(side='left')
        
        tk.Label(frame_filtros,
                text="Status:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 9)).pack(side='left', padx=(20, 5))
        
        self.combo_status = ttk.Combobox(frame_filtros,
                                        values=['Todos', 'Pago', 'Pendente', 'Vencido'],
                                        state='readonly',
                                        width=10)
        self.combo_status.set('Todos')
        self.combo_status.pack(side='left', padx=(0, 20))
        self.combo_status.bind('<<ComboboxSelected>>', self.filtrar_pagamentos)
        
        tk.Label(frame_filtros,
                text="Período:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 9)).pack(side='left', padx=(0, 5))
        
        self.combo_periodo = ttk.Combobox(frame_filtros,
                                         values=['Todos', 'Hoje', 'Esta Semana', 'Este Mês', 'Últimos 30 dias'],
                                         state='readonly',
                                         width=15)
        self.combo_periodo.set('Este Mês')
        self.combo_periodo.pack(side='left')
        self.combo_periodo.bind('<<ComboboxSelected>>', self.filtrar_pagamentos)
        
        frame_lista = tk.Frame(self.frame_pagamentos, bg='#FFFFFF')
        frame_lista.pack(fill='both', expand=True, padx=10, pady=(0, 10))
        
        self.criar_lista_pagamentos(frame_lista)
        self.criar_lista_despesas(frame_lista)

    def criar_lista_pagamentos(self, parent_frame):
        """Cria a treeview para listar pagamentos."""
        frame = tk.Frame(parent_frame, bg='#FFFFFF')
        frame.pack(fill='both', expand=True, pady=(0, 10))
        
        tk.Label(frame, text="Entradas (Pagamentos)", bg='#FFFFFF', fg='#333333', font=('Arial', 12, 'bold')).pack(anchor='w')
        
        columns = ('ID', 'Aluno', 'Valor', 'Data Pagamento', 'Método', 'Status', 'Nº Boleto')
        self.tree_pagamentos = ttk.Treeview(frame,
                                           columns=columns,
                                           show='headings',
                                           height=8)
        
        for col in columns:
            self.tree_pagamentos.heading(col, text=col, command=lambda _col=col: self.ordenar_treeview(self.tree_pagamentos, _col, False))
            self.tree_pagamentos.column(col, anchor='center')
        
        self.tree_pagamentos.column('ID', width=50)
        self.tree_pagamentos.column('Aluno', width=200)
        self.tree_pagamentos.column('Valor', width=100)
        self.tree_pagamentos.column('Data Pagamento', width=120)
        self.tree_pagamentos.column('Método', width=120)
        self.tree_pagamentos.column('Status', width=100)
        self.tree_pagamentos.column('Nº Boleto', width=150)
        
        self.tree_pagamentos.pack(fill='both', expand=True, pady=(5, 0))
        
        scrollbar = ttk.Scrollbar(frame, orient='vertical', command=self.tree_pagamentos.yview)
        scrollbar.pack(side='right', fill='y')
        self.tree_pagamentos.configure(yscrollcommand=scrollbar.set)
        
        self.tree_pagamentos.bind('<<TreeviewSelect>>', self.selecionar_pagamento)

    def criar_lista_despesas(self, parent_frame):
        """Cria a treeview para listar despesas."""
        frame = tk.Frame(parent_frame, bg='#FFFFFF')
        frame.pack(fill='both', expand=True, pady=(10, 0))
        
        tk.Label(frame, text="Saídas (Despesas)", bg='#FFFFFF', fg='#333333', font=('Arial', 12, 'bold')).pack(anchor='w')
        
        columns = ('ID', 'Valor', 'Data Despesa', 'Categoria', 'Descrição', 'Método', 'Nº Registro')
        self.tree_despesas = ttk.Treeview(frame,
                                         columns=columns,
                                         show='headings',
                                         height=8)
        
        for col in columns:
            self.tree_despesas.heading(col, text=col, command=lambda _col=col: self.ordenar_treeview(self.tree_despesas, _col, False))
            self.tree_despesas.column(col, anchor='center')
        
        self.tree_despesas.column('ID', width=50)
        self.tree_despesas.column('Valor', width=100)
        self.tree_despesas.column('Data Despesa', width=120)
        self.tree_despesas.column('Categoria', width=150)
        self.tree_despesas.column('Descrição', width=200)
        self.tree_despesas.column('Método', width=120)
        self.tree_despesas.column('Nº Registro', width=150)
        
        self.tree_despesas.pack(fill='both', expand=True, pady=(5, 0))
        
        scrollbar = ttk.Scrollbar(frame, orient='vertical', command=self.tree_despesas.yview)
        scrollbar.pack(side='right', fill='y')
        self.tree_despesas.configure(yscrollcommand=scrollbar.set)
        
        self.tree_despesas.bind('<<TreeviewSelect>>', self.selecionar_despesa)

    def ordenar_treeview(self, tree, col, reverse):
        """Ordena as colunas da treeview ao clicar no cabeçalho."""
        l = [(tree.set(k, col), k) for k in tree.get_children('')]
        
        try:
            if col in ['Valor', 'ID']:
                # Trata valores numéricos
                l.sort(key=lambda t: float(t[0].replace('R$ ', '').replace('.', '').replace(',', '.')), reverse=reverse)
            elif col == 'Data Pagamento' or col == 'Data Despesa' or col == 'Vencimento':
                # Trata datas
                l.sort(key=lambda t: datetime.strptime(t[0], '%d/%m/%Y') if t[0] else datetime.min, reverse=reverse)
            else:
                # Ordenação padrão (string)
                l.sort(reverse=reverse)
        except:
            # Fallback para ordenação simples
            l.sort(reverse=reverse)

        for index, (val, k) in enumerate(l):
            tree.move(k, '', index)

        tree.heading(col, command=lambda: self.ordenar_treeview(tree, col, not reverse))

    def criar_aba_novo_pagamento(self):
        """Cria a aba para registrar novo pagamento."""
        self.frame_novo_pagamento = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_novo_pagamento, text="➕ Novo Pagamento")
        
        canvas = tk.Canvas(self.frame_novo_pagamento, bg='#FFFFFF')
        scrollbar = ttk.Scrollbar(self.frame_novo_pagamento, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#FFFFFF')
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        titulo = tk.Label(scrollable_frame,
                         text="Registrar Novo Pagamento",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 16, 'bold'))
        titulo.pack(pady=(20, 30))
        
        self.campos_pagamento = {}
        
        frame_aluno = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_aluno.pack(fill='x', padx=20, pady=10)
        tk.Label(frame_aluno, text="Aluno *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        
        frame_aluno_select = tk.Frame(frame_aluno, bg='#FFFFFF')
        frame_aluno_select.pack(fill='x', pady=(5, 0))
        
        self.combo_aluno = ttk.Combobox(frame_aluno_select, state='readonly', width=40)
        self.combo_aluno.pack(side='left', fill='x', expand=True)
        
        btn_carregar_alunos = tk.Button(frame_aluno_select,
                                       text="🔄",
                                       bg='#95A5A6',
                                       fg='#FFFFFF',
                                       font=('Arial', 8, 'bold'),
                                       command=self.carregar_combo_alunos,
                                       relief='flat',
                                       width=3)
        btn_carregar_alunos.pack(side='right', padx=(5, 0))
        
        frame_valor = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_valor.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_valor, text="Valor (R$) *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_pagamento['valor'] = tk.Entry(frame_valor, font=('Arial', 10), width=20)
        self.campos_pagamento['valor'].pack(anchor='w', pady=(5, 0))
        
        frame_data_pag = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_data_pag.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_data_pag, text="Data do Pagamento (DD/MM/AAAA) *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_pagamento['data_pagamento'] = tk.Entry(frame_data_pag, font=('Arial', 10), width=15)
        self.campos_pagamento['data_pagamento'].pack(anchor='w', pady=(5, 0))
        self.campos_pagamento['data_pagamento'].insert(0, date.today().strftime("%d/%m/%Y"))
        
        frame_data_venc = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_data_venc.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_data_venc, text="Data de Vencimento (DD/MM/AAAA):", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_pagamento['data_vencimento'] = tk.Entry(frame_data_venc, font=('Arial', 10), width=15)
        self.campos_pagamento['data_vencimento'].pack(anchor='w', pady=(5, 0))
        
        frame_metodo = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_metodo.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_metodo, text="Método de Pagamento:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.combo_metodo = ttk.Combobox(frame_metodo,
                                        values=['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Transferência'],
                                        state='readonly',
                                        width=20)
        self.combo_metodo.set('Dinheiro')
        self.combo_metodo.pack(anchor='w', pady=(5, 0))
        
        frame_status = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_status.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_status, text="Status:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.combo_status_novo = ttk.Combobox(frame_status,
                                             values=['pago', 'pendente'],
                                             state='readonly',
                                             width=15)
        self.combo_status_novo.set('pago')
        self.combo_status_novo.pack(anchor='w', pady=(5, 0))
        
        frame_obs = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_obs.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_obs, text="Observações:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_pagamento['observacoes'] = tk.Text(frame_obs, font=('Arial', 10), width=50, height=4)
        self.campos_pagamento['observacoes'].pack(fill='x', pady=(5, 0))
        
        frame_botoes = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_botoes.pack(fill='x', padx=20, pady=30)
        
        tk.Button(frame_botoes,
                 text="💾 Salvar Pagamento",
                 bg='#FFA500',
                 fg='#000000',
                 font=('Arial', 12, 'bold'),
                 command=self.salvar_novo_pagamento,
                 relief='flat',
                 padx=20,
                 pady=10).pack(side='left', padx=(0, 10))
        
        tk.Button(frame_botoes,
                 text="❌ Cancelar",
                 bg='#666666',
                 fg='#FFFFFF',
                 font=('Arial', 12, 'bold'),
                 command=self.limpar_formulario_pagamento,
                 relief='flat',
                 padx=20,
                 pady=10).pack(side='left')

    def criar_aba_nova_despesa(self):
        """Cria a aba para registrar nova despesa."""
        self.frame_nova_despesa = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_nova_despesa, text="➖ Nova Despesa")
        
        canvas = tk.Canvas(self.frame_nova_despesa, bg='#FFFFFF')
        scrollbar = ttk.Scrollbar(self.frame_nova_despesa, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#FFFFFF')
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        titulo = tk.Label(scrollable_frame,
                         text="Registrar Nova Despesa",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 16, 'bold'))
        titulo.pack(pady=(20, 30))
        
        self.campos_despesa = {}
        
        frame_valor = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_valor.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_valor, text="Valor (R$) *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_despesa['valor'] = tk.Entry(frame_valor, font=('Arial', 10), width=20)
        self.campos_despesa['valor'].pack(anchor='w', pady=(5, 0))
        
        frame_data = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_data.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_data, text="Data da Despesa (DD/MM/AAAA) *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_despesa['data_despesa'] = tk.Entry(frame_data, font=('Arial', 10), width=15)
        self.campos_despesa['data_despesa'].pack(anchor='w', pady=(5, 0))
        self.campos_despesa['data_despesa'].insert(0, date.today().strftime("%d/%m/%Y"))
        
        frame_categoria = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_categoria.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_categoria, text="Categoria:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.combo_categoria = ttk.Combobox(frame_categoria,
                                           values=['Aluguel', 'Contas', 'Equipamentos', 'Salários', 'Manutenção', 'Outros'],
                                           state='readonly',
                                           width=20)
        self.combo_categoria.set('Outros')
        self.combo_categoria.pack(anchor='w', pady=(5, 0))
        
        frame_metodo = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_metodo.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_metodo, text="Método de Pagamento:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.combo_metodo_despesa = ttk.Combobox(frame_metodo,
                                                values=['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Transferência'],
                                                state='readonly',
                                                width=20)
        self.combo_metodo_despesa.set('Dinheiro')
        self.combo_metodo_despesa.pack(anchor='w', pady=(5, 0))
        
        frame_descricao = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_descricao.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_descricao, text="Descrição:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_despesa['descricao'] = tk.Text(frame_descricao, font=('Arial', 10), width=50, height=4)
        self.campos_despesa['descricao'].pack(fill='x', pady=(5, 0))
        
        frame_botoes = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_botoes.pack(fill='x', padx=20, pady=30)
        
        tk.Button(frame_botoes,
                 text="💾 Salvar Despesa",
                 bg='#FFA500',
                 fg='#000000',
                 font=('Arial', 12, 'bold'),
                 command=self.salvar_nova_despesa,
                 relief='flat',
                 padx=20,
                 pady=10).pack(side='left', padx=(0, 10))
        
        tk.Button(frame_botoes,
                 text="❌ Cancelar",
                 bg='#666666',
                 fg='#FFFFFF',
                 font=('Arial', 12, 'bold'),
                 command=self.limpar_formulario_despesa,
                 relief='flat',
                 padx=20,
                 pady=10).pack(side='left')

    def criar_aba_boletos(self):
        """Cria a aba de gerenciamento de boletos."""
        self.frame_visualizar_boletos = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_visualizar_boletos, text="📄 BOLETOS")
        
        frame_filtros = tk.Frame(self.frame_visualizar_boletos, bg='#FFFFFF')
        frame_filtros.pack(fill='x', pady=10, padx=10)
        
        tk.Label(frame_filtros, text="Filtrar Aluno:", bg='#FFFFFF', font=('Arial', 10, 'bold')).pack(side='left', padx=5)
        
        self.combo_aluno_boleto = ttk.Combobox(frame_filtros, state='normal', width=45)
        self.combo_aluno_boleto.pack(side='left', fill='x', expand=True, padx=(0,10))
        self.combo_aluno_boleto.bind('<KeyRelease>', self.filtrar_alunos_boletos_dinamicamente)
        self.combo_aluno_boleto.bind('<<ComboboxSelected>>', self.carregar_boletos_aluno)
        self.combo_aluno_boleto.bind('<Return>', self.carregar_boletos_aluno)
        
        btn_atualizar = tk.Button(frame_filtros,
                                 text="🔄 Atualizar Lista",
                                 bg='#95A5A6',
                                 fg='#FFFFFF',
                                 command=self.carregar_combo_alunos_boletos,
                                 relief='flat',
                                 padx=10)
        btn_atualizar.pack(side='left', padx=5)
        
        btn_gerar_lote = tk.Button(frame_filtros,
                                  text="📄 Gerar Boletos em Lote",
                                  bg='#FFA500',
                                  fg='#000000',
                                  font=('Arial', 10, 'bold'),
                                  command=self.gerar_boletos_lote,
                                  relief='flat',
                                  padx=15)
        btn_gerar_lote.pack(side='right', padx=5)
        
        btn_marcar_pago = tk.Button(frame_filtros,
                                   text="✅ Marcar como Pago",
                                   bg='#27AE60',
                                   fg='#FFFFFF',
                                   font=('Arial', 10, 'bold'),
                                   command=self.marcar_boleto_pago,
                                   relief='flat',
                                   padx=15)
        btn_marcar_pago.pack(side='right', padx=5)
        
        btn_editar_boleto = tk.Button(frame_filtros,
                                     text="✏️ Editar",
                                     bg='#3498DB',
                                     fg='#FFFFFF',
                                     font=('Arial', 10, 'bold'),
                                     command=self.editar_boleto_selecionado,
                                     relief='flat',
                                     padx=15)
        btn_editar_boleto.pack(side='right', padx=5)
        
        frame_lista = tk.Frame(self.frame_visualizar_boletos, bg='#FFFFFF')
        frame_lista.pack(fill='both', expand=True, padx=10, pady=10)
        
        columns = ('Selecionar', 'ID', 'Aluno', 'Valor', 'Vencimento', 'Status', 'Nº Boleto')
        self.tree_boletos = ttk.Treeview(frame_lista,
                                        columns=columns,
                                        show='headings',
                                        selectmode='none')
        
        for col in columns:
            self.tree_boletos.heading(col, text=col, command=lambda _col=col: self.ordenar_treeview(self.tree_boletos, _col, False))
            if col != 'Aluno':
                self.tree_boletos.column(col, anchor='center')
        
        self.tree_boletos.column('Aluno', width=200, anchor='w')
        self.tree_boletos.column('Selecionar', width=80)
        
        self.tree_boletos.pack(side='left', fill='both', expand=True)
        
        scrollbar = ttk.Scrollbar(frame_lista, orient='vertical', command=self.tree_boletos.yview)
        scrollbar.pack(side='right', fill='y')
        self.tree_boletos.configure(yscrollcommand=scrollbar.set)
        
        self.boletos_selecionados = {}
        self.tree_boletos.bind('<ButtonRelease-1>', self.alternar_selecao_boleto)
        
        self.tree_boletos.tag_configure('selecionado', background='#FFF3E0')
        self.tree_boletos.tag_configure('vencido', foreground='red')
        self.tree_boletos.tag_configure('pendente', foreground='black')
        
        # Inicializa com TODOS e carrega todos os boletos
        self.carregar_combo_alunos_boletos()
        self.carregar_todos_boletos()

    def carregar_combo_alunos_boletos(self):
        """Carrega a lista de alunos para o combo de filtro de boletos."""
        alunos = aluno_dao.listar_todos_alunos()
        self.todos_alunos = sorted([aluno.nome for aluno in alunos if aluno.nome])
        valores = ["TODOS"] + self.todos_alunos
        self.combo_aluno_boleto['values'] = valores
        self.combo_aluno_boleto.set("TODOS")

    def filtrar_alunos_boletos_dinamicamente(self, event):
        """Filtra dinamicamente os alunos no combo conforme digitação."""
        digitado = self.combo_aluno_boleto.get().strip().lower()
        
        if not digitado or digitado == "todos":
            self.combo_aluno_boleto['values'] = ["TODOS"] + self.todos_alunos
            return
        
        filtrados = [nome for nome in self.todos_alunos if digitado in nome.lower()]
        self.combo_aluno_boleto['values'] = ["TODOS"] + filtrados

    def carregar_todos_boletos(self):
        """Carrega todos os boletos pendentes/vencidos na treeview."""
        self.tree_boletos.delete(*self.tree_boletos.get_children())
        self.boletos_selecionados.clear()
        
        pagamentos = pagamento_dao.listar_todos_pagamentos()
        for p in pagamentos:
            if p.status.lower() not in ['pendente', 'vencido']:
                continue
                
            aluno = aluno_dao.buscar_aluno_por_id(p.aluno_id)
            nome = aluno.nome if aluno else f"ID {p.aluno_id}"
            venc = p.data_vencimento.strftime('%d/%m/%Y') if p.data_vencimento else "—"
            
            iid = self.tree_boletos.insert('', 'end', values=(
                "☐", p.id, nome, p.valor_formatado, venc, p.status.upper(), p.numero_boleto or "—"
            ))
            
            if p.status.lower() == 'vencido':
                self.tree_boletos.item(iid, tags=('vencido',))
            
            self.boletos_selecionados[iid] = False

    def carregar_boletos_aluno(self, event=None):
        """Carrega os boletos de um aluno específico."""
        selecao = self.combo_aluno_boleto.get().strip()
        
        self.tree_boletos.delete(*self.tree_boletos.get_children())
        self.boletos_selecionados.clear()
        
        if selecao == "TODOS" or not selecao:
            self.carregar_todos_boletos()
            return
        
        # Busca alunos por nome parcial
        alunos_encontrados = aluno_dao.buscar_alunos_por_nome(selecao)
        
        if not alunos_encontrados:
            messagebox.showinfo("Aviso", f"Nenhum aluno encontrado com '{selecao}'.")
            self.carregar_todos_boletos()
            return
        
        if len(alunos_encontrados) > 1:
            messagebox.showinfo("Aviso", f"Encontrados {len(alunos_encontrados)} alunos com '{selecao}'.\nMostrando todos os boletos pendentes.")
            self.carregar_todos_boletos()
            return
        
        # Encontrou exatamente 1 aluno → carrega só os boletos dele
        aluno = alunos_encontrados[0]
        pagamentos = pagamento_dao.listar_todos_pagamentos()
        for p in pagamentos:
            if p.aluno_id != aluno.id or p.status.lower() not in ['pendente', 'vencido']:
                continue
                
            venc = p.data_vencimento.strftime('%d/%m/%Y') if p.data_vencimento else "—"
            
            iid = self.tree_boletos.insert('', 'end', values=(
                "☐", p.id, aluno.nome, p.valor_formatado, venc, p.status.upper(), p.numero_boleto or "—"
            ))
            
            if p.status.lower() == 'vencido':
                self.tree_boletos.item(iid, tags=('vencido',))
            
            self.boletos_selecionados[iid] = False

    def alternar_selecao_boleto(self, event):
        """Alterna a seleção de um boleto na treeview."""
        item_id = self.tree_boletos.identify_row(event.y)
        if not item_id:
            return
            
        col = self.tree_boletos.identify_column(event.x)
        if col == '#1':
            atual = self.boletos_selecionados.get(item_id, False)
            nova = not atual
            self.boletos_selecionados[item_id] = nova
            
            valores = list(self.tree_boletos.item(item_id, 'values'))
            valores[0] = "☑" if nova else "☐"
            self.tree_boletos.item(item_id, values=valores, tags=('selecionado' if nova else ''))

    def gerar_boletos_lote(self):
        """Gera boletos em lote para os selecionados."""
        selecionados = [iid for iid, sel in self.boletos_selecionados.items() if sel]
        if not selecionados:
            messagebox.showwarning("Aviso", "Selecione pelo menos um boleto para gerar.")
            return
        
        if messagebox.askyesno("Confirmar", f"Deseja gerar {len(selecionados)} boleto(s)?"):
            sucesso = 0
            for iid in selecionados:
                valores = self.tree_boletos.item(iid)['values']
                pag_id = int(valores[1])
                pag = pagamento_dao.buscar_pagamento_por_id(pag_id)
                
                if pag:
                    aluno = aluno_dao.buscar_aluno_por_id(pag.aluno_id)
                    if aluno:
                        nome_arquivo = f"boleto_{pag.numero_boleto or pag_id}.pdf"
                        caminho = filedialog.asksaveasfilename(
                            title=f"Salvar Boleto - {aluno.nome}",
                            defaultextension=".pdf",
                            filetypes=[("PDF files", "*.pdf")],
                            initialfile=nome_arquivo
                        )
                        if caminho:
                            if boleto_generator.gerar_boleto(aluno, pag, caminho):
                                sucesso += 1
            
            messagebox.showinfo("Sucesso", f"{sucesso} boleto(s) gerado(s) com sucesso!")

    def marcar_boleto_pago(self):
        """Marca os boletos selecionados como pagos."""
        selecionados = [iid for iid, sel in self.boletos_selecionados.items() if sel]
        if not selecionados:
            messagebox.showwarning("Aviso", "Nenhum boleto selecionado.")
            return
            
        if messagebox.askyesno("Confirmar", f"Marcar {len(selecionados)} boleto(s) como pago(s)?"):
            sucesso = 0
            for iid in selecionados:
                valores = self.tree_boletos.item(iid)['values']
                pag_id = int(valores[1])
                pag = pagamento_dao.buscar_pagamento_por_id(pag_id)
                if pag:
                    pag.status = 'pago'
                    pag.data_pagamento = date.today()
                    if pagamento_dao.atualizar_pagamento(pag):
                        sucesso += 1
            
            messagebox.showinfo("Sucesso", f"{sucesso} boleto(s) marcado(s) como pago(s).")
            self.carregar_todos_boletos()
            self.carregar_lista_pagamentos()

    def editar_boleto_selecionado(self):
        """Edita o boleto selecionado."""
        iid = self.tree_boletos.focus()
        if not iid:
            messagebox.showwarning("Aviso", "Selecione um boleto para editar.")
            return
            
        valores = self.tree_boletos.item(iid)['values']
        pag_id = int(valores[1])
        pag = pagamento_dao.buscar_pagamento_por_id(pag_id)
        if pag:
            self.pagamento_selecionado = pag
            self.despesa_selecionada = None
            self.notebook.select(self.frame_edicao_container)
            self.editar_item_selecionado()

    def criar_aba_relatorios(self):
        """Cria a aba de relatórios."""
        self.frame_relatorios = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_relatorios, text="📊 Relatórios")
        
        frame_filtros = tk.Frame(self.frame_relatorios, bg='#FFFFFF')
        frame_filtros.pack(fill='x', pady=(10, 20), padx=10)
        
        tk.Label(frame_filtros,
                text="Período:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).pack(side='left')
        
        self.combo_periodo_relatorio = ttk.Combobox(frame_filtros,
                                                  values=['Este Mês', 'Últimos 30 dias', 'Este Ano', 'Personalizado'],
                                                  state='readonly',
                                                  width=15)
        self.combo_periodo_relatorio.set('Este Mês')
        self.combo_periodo_relatorio.pack(side='left', padx=(10, 20))
        self.combo_periodo_relatorio.bind('<<ComboboxSelected>>', self.atualizar_relatorio)
        
        frame_data_personalizada = tk.Frame(frame_filtros, bg='#FFFFFF')
        frame_data_personalizada.pack(side='left')
        
        tk.Label(frame_data_personalizada,
                text="Data Início (DD/MM/AAAA):",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 9)).pack(side='left', padx=(0, 5))
        self.entry_data_inicio = tk.Entry(frame_data_personalizada, font=('Arial', 9), width=12)
        self.entry_data_inicio.pack(side='left', padx=(0, 10))
        
        tk.Label(frame_data_personalizada,
                text="Data Fim (DD/MM/AAAA):",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 9)).pack(side='left', padx=(0, 5))
        self.entry_data_fim = tk.Entry(frame_data_personalizada, font=('Arial', 9), width=12)
        self.entry_data_fim.pack(side='left')
        
        btn_atualizar = tk.Button(frame_filtros,
                                 text="🔄 Atualizar",
                                 bg='#95A5A6',
                                 fg='#FFFFFF',
                                 font=('Arial', 10, 'bold'),
                                 command=self.atualizar_relatorio,
                                 relief='flat',
                                 padx=15,
                                 pady=8)
        btn_atualizar.pack(side='right')
        
        btn_exportar = tk.Button(frame_filtros,
                                text="📤 Exportar CSV/PDF",
                                bg='#4ECDC4',
                                fg='#000000',
                                font=('Arial', 10, 'bold'),
                                command=self.exportar_dados_financeiros,
                                relief='flat',
                                padx=15,
                                pady=8)
        btn_exportar.pack(side='right', padx=(0, 10))
        
        self.frame_relatorio_conteudo = tk.Frame(self.frame_relatorios, bg='#FFFFFF')
        self.frame_relatorio_conteudo.pack(fill='both', expand=True, padx=10, pady=10)
        
        self.atualizar_relatorio()

    def criar_aba_edicao(self):
        """Cria a aba de edição (inicialmente oculta)."""
        self.frame_edicao_container = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_edicao_container, text="✏️ Edição")
        
        self.canvas_edicao = tk.Canvas(self.frame_edicao_container, bg='#FFFFFF', highlightthickness=0)
        self.scrollbar_edicao = ttk.Scrollbar(self.frame_edicao_container, orient="vertical", command=self.canvas_edicao.yview)
        self.frame_edicao = tk.Frame(self.canvas_edicao, bg='#FFFFFF')
        
        self.frame_edicao.bind(
            "<Configure>",
            lambda e: self.canvas_edicao.configure(scrollregion=self.canvas_edicao.bbox("all"))
        )
        
        self.canvas_edicao.create_window((0, 0), window=self.frame_edicao, anchor="nw")
        self.canvas_edicao.configure(yscrollcommand=self.scrollbar_edicao.set)
        
        self.scrollbar_edicao.pack(side="right", fill="y")
        self.canvas_edicao.pack(side="left", fill="both", expand=True)
        
        def _on_canvas_configure(event):
            self.canvas_edicao.itemconfig(self.canvas_edicao.find_withtag("all")[0], width=event.width)
        self.canvas_edicao.bind('<Configure>', _on_canvas_configure)
        
        self.notebook.tab(self.frame_edicao_container, state='hidden')

    def carregar_lista_pagamentos(self):
        """Carrega a lista de pagamentos e despesas com os filtros atuais."""
        for item in self.tree_pagamentos.get_children():
            self.tree_pagamentos.delete(item)
        for item in self.tree_despesas.get_children():
            self.tree_despesas.delete(item)
        
        status = self.combo_status.get().lower() if self.combo_status.get() != 'Todos' else None
        periodo = self.combo_periodo.get()
        
        hoje = date.today()
        data_inicio = None
        data_fim = hoje
        
        if periodo == 'Hoje':
            data_inicio = hoje
        elif periodo == 'Esta Semana':
            data_inicio = hoje - timedelta(days=hoje.weekday())
        elif periodo == 'Este Mês':
            data_inicio = hoje.replace(day=1)
        elif periodo == 'Últimos 30 dias':
            data_inicio = hoje - timedelta(days=30)
        
        if status and data_inicio:
            pagamentos = pagamento_dao.buscar_pagamentos_por_periodo(data_inicio, data_fim)
            pagamentos = [p for p in pagamentos if p.status.lower() == status]
        elif status:
            pagamentos = pagamento_dao.buscar_pagamentos_por_status(status)
        elif data_inicio:
            pagamentos = pagamento_dao.buscar_pagamentos_por_periodo(data_inicio, data_fim)
        else:
            pagamentos = pagamento_dao.listar_todos_pagamentos(limite=100)
        
        for pagamento in pagamentos:
            aluno = aluno_dao.buscar_aluno_por_id(pagamento.aluno_id)
            nome_aluno = aluno.nome if aluno else f"ID: {pagamento.aluno_id}"
            self.tree_pagamentos.insert('', 'end', values=(
                pagamento.id,
                nome_aluno,
                pagamento.valor_formatado,
                pagamento.data_pagamento.strftime("%d/%m/%Y") if pagamento.data_pagamento else "",
                pagamento.metodo_pagamento,
                pagamento.status.capitalize(),
                pagamento.numero_boleto or ""
            ))
        
        despesas = despesa_dao.listar_todas_despesas(limite=100) if not data_inicio else despesa_dao.buscar_despesas_por_periodo(data_inicio, data_fim)
        for despesa in despesas:
            self.tree_despesas.insert('', 'end', values=(
                despesa.id,
                despesa.valor_formatado,
                despesa.data_despesa.strftime("%d/%m/%Y"),
                despesa.categoria,
                despesa.descricao,
                despesa.metodo_pagamento,
                despesa.numero_registro
            ))

    def filtrar_pagamentos(self, event=None):
        """Aplica os filtros de pagamentos."""
        self.carregar_lista_pagamentos()

    def carregar_combo_alunos(self):
        """Carrega a lista de alunos no combo de novo pagamento."""
        alunos = aluno_dao.listar_todos_alunos()
        nomes = [aluno.nome for aluno in alunos]
        self.combo_aluno['values'] = nomes
        self.alunos_dict = {aluno.nome: aluno.id for aluno in alunos}
        if nomes:
            self.combo_aluno.set(nomes[0])

    def selecionar_pagamento(self, event):
        """Seleciona um pagamento na treeview."""
        selected = self.tree_pagamentos.selection()
        self.despesa_selecionada = None
        if selected:
            values = self.tree_pagamentos.item(selected)['values']
            pagamento_id = int(values[0])
            self.pagamento_selecionado = pagamento_dao.buscar_pagamento_por_id(pagamento_id)
            self.btn_gerar_boleto.config(state='normal' if self.pagamento_selecionado.status != 'pago' else 'disabled')
            self.btn_gerar_comprovante.config(state='normal' if self.pagamento_selecionado.status == 'pago' else 'disabled')
            self.btn_editar.config(state='normal')
        else:
            self.pagamento_selecionado = None
            self.btn_gerar_boleto.config(state='disabled')
            self.btn_gerar_comprovante.config(state='disabled')
            self.btn_editar.config(state='disabled')

    def selecionar_despesa(self, event):
        """Seleciona uma despesa na treeview."""
        selected = self.tree_despesas.selection()
        self.pagamento_selecionado = None
        if selected:
            values = self.tree_despesas.item(selected)['values']
            despesa_id = int(values[0])
            self.despesa_selecionada = despesa_dao.buscar_despesa_por_id(despesa_id)
            self.btn_gerar_boleto.config(state='disabled')
            self.btn_gerar_comprovante.config(state='disabled')
            self.btn_editar.config(state='normal')
        else:
            self.despesa_selecionada = None
            self.btn_editar.config(state='disabled')

    def salvar_novo_pagamento(self):
        """Salva um novo pagamento no banco de dados."""
        try:
            if not self.combo_aluno.get():
                messagebox.showerror("Erro", "Selecione um aluno!")
                return
            
            valor_str = self.campos_pagamento['valor'].get().strip()
            data_pag_str = self.campos_pagamento['data_pagamento'].get().strip()
            data_venc_str = self.campos_pagamento['data_vencimento'].get().strip()
            
            if not valor_str:
                messagebox.showerror("Erro", "Informe o valor do pagamento!")
                return
            
            try:
                valor = float(valor_str.replace(',', '.'))
                if valor <= 0:
                    raise ValueError("Valor deve ser maior que zero")
            except ValueError:
                messagebox.showerror("Erro", "Valor inválido! Use formato numérico (ex.: 100,00)")
                return
            
            try:
                data_pagamento = datetime.strptime(data_pag_str, "%d/%m/%Y").date()
                if not self.validar_data_futura(data_pagamento):
                    messagebox.showerror("Erro", "Data de pagamento muito distante no futuro!")
                    return
            except ValueError:
                messagebox.showerror("Erro", "Data de pagamento inválida! Use o formato DD/MM/AAAA")
                return
            
            data_vencimento = None
            if data_venc_str:
                try:
                    data_vencimento = datetime.strptime(data_venc_str, "%d/%m/%Y").date()
                    if not self.validar_data_futura(data_vencimento):
                        messagebox.showerror("Erro", "Data de vencimento muito distante no futuro!")
                        return
                except ValueError:
                    messagebox.showerror("Erro", "Data de vencimento inválida! Use o formato DD/MM/AAAA")
                    return
            
            aluno_id = self.alunos_dict.get(self.combo_aluno.get())
            if not aluno_id:
                messagebox.showerror("Erro", "Aluno não encontrado!")
                return
            
            pagamento = Pagamento(
                aluno_id=aluno_id,
                valor=valor,
                data_pagamento=data_pagamento,
                data_vencimento=data_vencimento,
                metodo_pagamento=self.combo_metodo.get(),
                status=self.combo_status_novo.get(),
                observacoes=self.campos_pagamento['observacoes'].get('1.0', 'end-1c').strip()
            )
            
            pagamento_dao.criar_pagamento(pagamento)
            messagebox.showinfo("Sucesso", "Pagamento registrado com sucesso!")
            self.limpar_formulario_pagamento()
            self.carregar_lista_pagamentos()
            self.notebook.select(0)
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao salvar pagamento:\n{str(e)}")

    def salvar_nova_despesa(self):
        """Salva uma nova despesa no banco de dados."""
        try:
            valor_str = self.campos_despesa['valor'].get().strip()
            data_str = self.campos_despesa['data_despesa'].get().strip()
            
            if not valor_str:
                messagebox.showerror("Erro", "Informe o valor da despesa!")
                return
            
            try:
                valor = float(valor_str.replace(',', '.'))
                if valor <= 0:
                    raise ValueError("Valor deve ser maior que zero")
            except ValueError:
                messagebox.showerror("Erro", "Valor inválido! Use formato numérico (ex.: 100,00)")
                return
            
            try:
                data_despesa = datetime.strptime(data_str, "%d/%m/%Y").date()
                if not self.validar_data_futura(data_despesa):
                    messagebox.showerror("Erro", "Data da despesa muito distante no futuro!")
                    return
            except ValueError:
                messagebox.showerror("Erro", "Data inválida! Use DD/MM/AAAA")
                return
            
            despesa = Despesa(
                valor=valor,
                data_despesa=data_despesa,
                categoria=self.combo_categoria.get(),
                descricao=self.campos_despesa['descricao'].get('1.0', 'end-1c').strip(),
                metodo_pagamento=self.combo_metodo_despesa.get()
            )
            
            despesa_dao.criar_despesa(despesa)
            messagebox.showinfo("Sucesso", "Despesa registrada com sucesso!")
            self.limpar_formulario_despesa()
            self.carregar_lista_pagamentos()
            self.notebook.select(0)
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao salvar despesa:\n{str(e)}")

    def limpar_formulario_pagamento(self):
        """Limpa o formulário de novo pagamento."""
        self.campos_pagamento['valor'].delete(0, 'end')
        self.campos_pagamento['data_pagamento'].delete(0, 'end')
        self.campos_pagamento['data_pagamento'].insert(0, date.today().strftime("%d/%m/%Y"))
        self.campos_pagamento['data_vencimento'].delete(0, 'end')
        self.campos_pagamento['observacoes'].delete('1.0', 'end')
        self.combo_metodo.set('Dinheiro')
        self.combo_status_novo.set('pago')
        if self.combo_aluno['values']:
            self.combo_aluno.set(self.combo_aluno['values'][0])

    def limpar_formulario_despesa(self):
        """Limpa o formulário de nova despesa."""
        self.campos_despesa['valor'].delete(0, 'end')
        self.campos_despesa['data_despesa'].delete(0, 'end')
        self.campos_despesa['data_despesa'].insert(0, date.today().strftime("%d/%m/%Y"))
        self.campos_despesa['descricao'].delete('1.0', 'end')
        self.combo_categoria.set('Outros')
        self.combo_metodo_despesa.set('Dinheiro')

    def gerar_boleto_selecionado(self):
        """Gera um boleto para o pagamento selecionado."""
        if not self.pagamento_selecionado:
            return
        
        try:
            aluno = aluno_dao.buscar_aluno_por_id(self.pagamento_selecionado.aluno_id)
            if not aluno:
                messagebox.showerror("Erro", "Aluno não encontrado!")
                return
            
            nome_arquivo = f"boleto_{self.pagamento_selecionado.numero_boleto or 'sem_numero'}.pdf"
            caminho = filedialog.asksaveasfilename(
                title="Salvar Boleto",
                defaultextension=".pdf",
                filetypes=[("PDF files", "*.pdf")],
                initialfile=nome_arquivo
            )
            
            if caminho:
                if boleto_generator.gerar_boleto(aluno, self.pagamento_selecionado, caminho):
                    messagebox.showinfo("Sucesso", f"Boleto gerado!\nSalvo em:\n{caminho}")
                else:
                    messagebox.showerror("Erro", "Falha ao gerar o boleto.")
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao gerar boleto:\n{str(e)}")

    def gerar_comprovante_selecionado(self):
        """Gera um comprovante para o pagamento selecionado."""
        if not self.pagamento_selecionado or self.pagamento_selecionado.status.lower() != 'pago':
            return
        
        try:
            aluno = aluno_dao.buscar_aluno_por_id(self.pagamento_selecionado.aluno_id)
            if not aluno:
                messagebox.showerror("Erro", "Aluno não encontrado!")
                return
            
            nome_arquivo = f"comprovante_{self.pagamento_selecionado.numero_boleto or 'sem_numero'}.pdf"
            caminho = filedialog.asksaveasfilename(
                title="Salvar Comprovante",
                defaultextension=".pdf",
                filetypes=[("PDF files", "*.pdf")],
                initialfile=nome_arquivo
            )
            
            if caminho:
                if comprovante_generator.gerar_comprovante(aluno, self.pagamento_selecionado, caminho):
                    messagebox.showinfo("Sucesso", f"Comprovante gerado!\nSalvo em:\n{caminho}")
                else:
                    messagebox.showerror("Erro", "Falha ao gerar o comprovante.")
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao gerar comprovante:\n{str(e)}")

    def editar_item_selecionado(self):
        """Abre o formulário de edição para o item selecionado."""
        if not (self.pagamento_selecionado or self.despesa_selecionada):
            return
        
        for widget in self.frame_edicao.winfo_children():
            widget.destroy()
        
        self.notebook.tab(self.frame_edicao_container, state='normal')
        self.notebook.select(self.frame_edicao_container)
        
        if self.pagamento_selecionado:
            self._criar_formulario_edicao_pagamento()
        elif self.despesa_selecionada:
            self._criar_formulario_edicao_despesa()

    def _criar_formulario_edicao_pagamento(self):
        """Cria o formulário de edição de pagamento."""
        tk.Label(self.frame_edicao, text="Editar Pagamento", bg='#FFFFFF', fg='#FFA500',
                 font=('Arial', 16, 'bold')).pack(pady=(20, 30))
        
        frame = tk.Frame(self.frame_edicao, bg='#FFFFFF')
        frame.pack(fill='both', expand=True, padx=20, pady=10)
        
        tk.Label(frame, text="Aluno:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        aluno = aluno_dao.buscar_aluno_por_id(self.pagamento_selecionado.aluno_id)
        nome_aluno = aluno.nome if aluno else f"ID: {self.pagamento_selecionado.aluno_id}"
        tk.Label(frame, text=nome_aluno, bg='#FFFFFF', fg='#333333',
                 font=('Arial', 10)).pack(anchor='w', pady=(5, 15))
        
        tk.Label(frame, text="Valor (R$):", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        valor_entry = tk.Entry(frame, font=('Arial', 10), width=20)
        valor_entry.insert(0, str(self.pagamento_selecionado.valor))
        valor_entry.pack(anchor='w', pady=(5, 15))
        
        tk.Label(frame, text="Data Pagamento (DD/MM/AAAA):", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        data_pag_entry = tk.Entry(frame, font=('Arial', 10), width=15)
        data_pag_entry.insert(0, self.pagamento_selecionado.data_pagamento.strftime("%d/%m/%Y"))
        data_pag_entry.pack(anchor='w', pady=(5, 15))
        
        tk.Label(frame, text="Data Vencimento (DD/MM/AAAA):", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        data_venc_entry = tk.Entry(frame, font=('Arial', 10), width=15)
        if self.pagamento_selecionado.data_vencimento:
            data_venc_entry.insert(0, self.pagamento_selecionado.data_vencimento.strftime("%d/%m/%Y"))
        data_venc_entry.pack(anchor='w', pady=(5, 15))
        
        tk.Label(frame, text="Método:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        combo_metodo = ttk.Combobox(frame,
                                  values=['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Transferência'],
                                  state='readonly',
                                  width=20)
        combo_metodo.set(self.pagamento_selecionado.metodo_pagamento)
        combo_metodo.pack(anchor='w', pady=(5, 15))
        
        tk.Label(frame, text="Status:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        combo_status = ttk.Combobox(frame,
                                  values=['pago', 'pendente', 'vencido'],
                                  state='readonly',
                                  width=15)
        combo_status.set(self.pagamento_selecionado.status)
        combo_status.pack(anchor='w', pady=(5, 15))
        
        tk.Label(frame, text="Observações:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        obs_text = tk.Text(frame, font=('Arial', 10), width=50, height=4)
        obs_text.insert('1.0', self.pagamento_selecionado.observacoes or "")
        obs_text.pack(fill='x', pady=(5, 20))
        
        frame_botoes = tk.Frame(self.frame_edicao, bg='#FFFFFF')
        frame_botoes.pack(fill='x', padx=20, pady=20)
        
        tk.Button(frame_botoes, text="💾 Salvar Alterações", bg='#FFA500', fg='#000000',
                  font=('Arial', 12, 'bold'), relief='flat', padx=20, pady=10,
                  command=lambda: self.salvar_edicao_pagamento(
                      valor_entry.get(), data_pag_entry.get(), data_venc_entry.get(),
                      combo_metodo.get(), combo_status.get(), obs_text.get('1.0', 'end-1c')
                  )).pack(side='left', padx=(0, 10))
        
        tk.Button(frame_botoes, text="❌ Cancelar", bg='#666666', fg='#FFFFFF',
                  font=('Arial', 12, 'bold'), relief='flat', padx=20, pady=10,
                  command=self.cancelar_edicao).pack(side='left')

    def _criar_formulario_edicao_despesa(self):
        """Cria o formulário de edição de despesa."""
        tk.Label(self.frame_edicao, text="Editar Despesa", bg='#FFFFFF', fg='#FFA500',
                 font=('Arial', 16, 'bold')).pack(pady=(20, 30))
        
        frame = tk.Frame(self.frame_edicao, bg='#FFFFFF')
        frame.pack(fill='both', expand=True, padx=20, pady=10)
        
        tk.Label(frame, text="Valor (R$):", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        valor_entry = tk.Entry(frame, font=('Arial', 10), width=20)
        valor_entry.insert(0, str(self.despesa_selecionada.valor))
        valor_entry.pack(anchor='w', pady=(5, 15))
        
        tk.Label(frame, text="Data Despesa (DD/MM/AAAA):", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        data_entry = tk.Entry(frame, font=('Arial', 10), width=15)
        data_entry.insert(0, self.despesa_selecionada.data_despesa.strftime("%d/%m/%Y"))
        data_entry.pack(anchor='w', pady=(5, 15))
        
        tk.Label(frame, text="Categoria:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        combo_cat = ttk.Combobox(frame,
                                values=['Aluguel', 'Contas', 'Equipamentos', 'Salários', 'Manutenção', 'Outros'],
                                state='readonly',
                                width=20)
        combo_cat.set(self.despesa_selecionada.categoria)
        combo_cat.pack(anchor='w', pady=(5, 15))
        
        tk.Label(frame, text="Método:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        combo_met = ttk.Combobox(frame,
                                values=['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Transferência'],
                                state='readonly',
                                width=20)
        combo_met.set(self.despesa_selecionada.metodo_pagamento)
        combo_met.pack(anchor='w', pady=(5, 15))
        
        tk.Label(frame, text="Descrição:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        desc_text = tk.Text(frame, font=('Arial', 10), width=50, height=4)
        desc_text.insert('1.0', self.despesa_selecionada.descricao or "")
        desc_text.pack(fill='x', pady=(5, 20))
        
        frame_botoes = tk.Frame(self.frame_edicao, bg='#FFFFFF')
        frame_botoes.pack(fill='x', padx=20, pady=20)
        
        tk.Button(frame_botoes, text="💾 Salvar Alterações", bg='#FFA500', fg='#000000',
                  font=('Arial', 12, 'bold'), relief='flat', padx=20, pady=10,
                  command=lambda: self.salvar_edicao_despesa(
                      valor_entry.get(), data_entry.get(), combo_cat.get(),
                      desc_text.get('1.0', 'end-1c'), combo_met.get()
                  )).pack(side='left', padx=(0, 10))
        
        tk.Button(frame_botoes, text="❌ Cancelar", bg='#666666', fg='#FFFFFF',
                  font=('Arial', 12, 'bold'), relief='flat', padx=20, pady=10,
                  command=self.cancelar_edicao).pack(side='left')

    def salvar_edicao_pagamento(self, valor_str, data_pag_str, data_venc_str, metodo, status, obs):
        """Salva as alterações de um pagamento."""
        try:
            valor = float(valor_str.replace(',', '.'))
            if valor <= 0:
                raise ValueError("Valor inválido")
            
            data_pagamento = datetime.strptime(data_pag_str, "%d/%m/%Y").date()
            if not self.validar_data_futura(data_pagamento):
                messagebox.showerror("Erro", "Data de pagamento muito distante no futuro!")
                return
            
            data_vencimento = None
            if data_venc_str.strip():
                data_vencimento = datetime.strptime(data_venc_str, "%d/%m/%Y").date()
                if not self.validar_data_futura(data_vencimento):
                    messagebox.showerror("Erro", "Data de vencimento muito distante no futuro!")
                    return
            
            self.pagamento_selecionado.valor = valor
            self.pagamento_selecionado.data_pagamento = data_pagamento
            self.pagamento_selecionado.data_vencimento = data_vencimento
            self.pagamento_selecionado.metodo_pagamento = metodo
            self.pagamento_selecionado.status = status.lower()
            self.pagamento_selecionado.observacoes = obs.strip()
            
            if pagamento_dao.atualizar_pagamento(self.pagamento_selecionado):
                messagebox.showinfo("Sucesso", "Pagamento atualizado!")
                self.carregar_lista_pagamentos()
                self.notebook.select(0)
                self.notebook.tab(self.frame_edicao_container, state='hidden')
            else:
                messagebox.showerror("Erro", "Não foi possível atualizar o pagamento.")
        except Exception as e:
            messagebox.showerror("Erro", f"Falha ao salvar alterações:\n{str(e)}")

    def salvar_edicao_despesa(self, valor_str, data_str, categoria, descricao, metodo):
        """Salva as alterações de uma despesa."""
        try:
            valor = float(valor_str.replace(',', '.'))
            if valor <= 0:
                raise ValueError("Valor inválido")
            
            data_despesa = datetime.strptime(data_str, "%d/%m/%Y").date()
            if not self.validar_data_futura(data_despesa):
                messagebox.showerror("Erro", "Data da despesa muito distante no futuro!")
                return
            
            self.despesa_selecionada.valor = valor
            self.despesa_selecionada.data_despesa = data_despesa
            self.despesa_selecionada.categoria = categoria
            self.despesa_selecionada.descricao = descricao.strip()
            self.despesa_selecionada.metodo_pagamento = metodo
            
            if despesa_dao.atualizar_despesa(self.despesa_selecionada):
                messagebox.showinfo("Sucesso", "Despesa atualizada!")
                self.carregar_lista_pagamentos()
                self.notebook.select(0)
                self.notebook.tab(self.frame_edicao_container, state='hidden')
            else:
                messagebox.showerror("Erro", "Não foi possível atualizar a despesa.")
        except Exception as e:
            messagebox.showerror("Erro", f"Falha ao salvar alterações:\n{str(e)}")

    def cancelar_edicao(self):
        """Cancela a edição e volta para a aba principal."""
        self.notebook.select(0)
        self.notebook.tab(self.frame_edicao_container, state='hidden')

    def atualizar_relatorio(self, event=None):
        """Atualiza o relatório com base nos filtros selecionados."""
        for widget in self.frame_relatorio_conteudo.winfo_children():
            widget.destroy()
        
        periodo = self.combo_periodo_relatorio.get()
        hoje = date.today()
        data_inicio = hoje.replace(day=1)
        data_fim = hoje
        
        if periodo == 'Últimos 30 dias':
            data_inicio = hoje - timedelta(days=30)
        elif periodo == 'Este Ano':
            data_inicio = hoje.replace(month=1, day=1)
        elif periodo == 'Personalizado':
            try:
                data_inicio = datetime.strptime(self.entry_data_inicio.get(), "%d/%m/%Y").date()
                data_fim = datetime.strptime(self.entry_data_fim.get(), "%d/%m/%Y").date()
                
                if not self.validar_data_futura(data_inicio) or not self.validar_data_futura(data_fim):
                    messagebox.showerror("Erro", "Datas personalizadas muito distantes no futuro!")
                    return
            except ValueError:
                messagebox.showerror("Erro", "Datas personalizadas inválidas! Use o formato DD/MM/AAAA")
                return
        
        pagamentos = pagamento_dao.buscar_pagamentos_por_periodo(data_inicio, data_fim)
        despesas = despesa_dao.buscar_despesas_por_periodo(data_inicio, data_fim)
        
        total_entradas = sum(p.valor for p in pagamentos if p.status.lower() == 'pago')
        total_saidas = despesa_dao.calcular_total_por_periodo(data_inicio, data_fim)
        saldo = total_entradas - total_saidas
        
        frame_resumo = tk.Frame(self.frame_relatorio_conteudo, bg='#FFFFFF')
        frame_resumo.pack(fill='x', pady=(0, 20))
        
        tk.Label(frame_resumo,
                text=f"Resumo ({data_inicio.strftime('%d/%m/%Y')} - {data_fim.strftime('%d/%m/%Y')})",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 14, 'bold')).pack(anchor='w')
        
        tk.Label(frame_resumo,
                text=f"Entradas: R$ {total_entradas:,.2f}".replace('.', ','),
                bg='#FFFFFF',
                fg='#2ECC71',
                font=('Arial', 12)).pack(anchor='w')
        
        tk.Label(frame_resumo,
                text=f"Saídas: R$ {total_saidas:,.2f}".replace('.', ','),
                bg='#FFFFFF',
                fg='#E74C3C',
                font=('Arial', 12)).pack(anchor='w')
        
        tk.Label(frame_resumo,
                text=f"Saldo: R$ {saldo:,.2f}".replace('.', ','),
                bg='#FFFFFF',
                fg='#333333' if saldo >= 0 else '#E74C3C',
                font=('Arial', 12, 'bold')).pack(anchor='w')
        
        if total_entradas == 0 and total_saidas == 0:
            tk.Label(self.frame_relatorio_conteudo,
                    text="Nenhum dado financeiro no período selecionado.",
                    bg='#FFFFFF',
                    fg='#E74C3C',
                    font=('Arial', 12, 'italic')).pack(pady=20)
        else:
            frame_grafico = tk.Frame(self.frame_relatorio_conteudo, bg='#FFFFFF')
            frame_grafico.pack(fill='x', pady=(20, 0))
            
            fig, ax = plt.subplots(figsize=(6, 4))
            ax.pie([total_entradas, total_saidas], labels=['Entradas', 'Saídas'],
                   colors=['#2ECC71', '#E74C3C'], autopct='%1.1f%%', startangle=90)
            ax.axis('equal')
            ax.set_title('Distribuição Financeira')
            
            canvas = FigureCanvasTkAgg(fig, master=frame_grafico)
            canvas.draw()
            canvas.get_tk_widget().pack(fill='x')
            plt.close(fig)

    def exportar_dados_financeiros(self):
        """Exporta os dados financeiros para CSV ou PDF."""
        caminho = filedialog.asksaveasfilename(
            title="Exportar dados financeiros",
            defaultextension=".csv",
            filetypes=[("CSV", "*.csv"), ("PDF", "*.pdf")],
            initialfile="relatorio_financeiro"
        )
        if not caminho:
            return
        
        periodo = self.combo_periodo_relatorio.get()
        hoje = date.today()
        data_inicio = hoje.replace(day=1)
        data_fim = hoje
        
        if periodo == 'Últimos 30 dias':
            data_inicio = hoje - timedelta(days=30)
        elif periodo == 'Este Ano':
            data_inicio = hoje.replace(month=1, day=1)
        elif periodo == 'Personalizado':
            try:
                data_inicio = datetime.strptime(self.entry_data_inicio.get(), "%d/%m/%Y").date()
                data_fim = datetime.strptime(self.entry_data_fim.get(), "%d/%m/%Y").date()
                
                if not self.validar_data_futura(data_inicio) or not self.validar_data_futura(data_fim):
                    messagebox.showerror("Erro", "Datas personalizadas muito distantes no futuro!")
                    return
            except:
                messagebox.showerror("Erro", "Datas personalizadas inválidas!")
                return
        
        pagamentos = pagamento_dao.buscar_pagamentos_por_periodo(data_inicio, data_fim)
        despesas = despesa_dao.buscar_despesas_por_periodo(data_inicio, data_fim)
        
        if caminho.lower().endswith('.pdf'):
            self.gerar_relatorio_pdf(caminho, pagamentos, despesas, data_inicio, data_fim)
        else:
            with open(caminho, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f, delimiter=';')
                writer.writerow(['Relatório Financeiro'])
                writer.writerow([f"Período: {data_inicio.strftime('%d/%m/%Y')} - {data_fim.strftime('%d/%m/%Y')}"])
                writer.writerow([])
                writer.writerow(['Entradas (Pagamentos)'])
                writer.writerow(['ID', 'Aluno', 'Valor', 'Data Pagamento', 'Data Vencimento', 'Método', 'Status', 'Nº Boleto', 'Observações', 'Data Criação'])
                for p in pagamentos:
                    aluno = aluno_dao.buscar_aluno_por_id(p.aluno_id)
                    nome = aluno.nome if aluno else f"ID {p.aluno_id}"
                    writer.writerow([p.id, nome, p.valor, p.data_pagamento, p.data_vencimento, p.metodo_pagamento, p.status, p.numero_boleto, p.observacoes, p.data_criacao])
                writer.writerow([])
                writer.writerow(['Saídas (Despesas)'])
                writer.writerow(['ID', 'Valor', 'Data Despesa', 'Categoria', 'Descrição', 'Método', 'Nº Registro', 'Data Criação'])
                for d in despesas:
                    writer.writerow([d.id, d.valor, d.data_despesa, d.categoria, d.descricao, d.metodo_pagamento, d.numero_registro, d.data_criacao])
        
        messagebox.showinfo("Sucesso", f"Exportado com sucesso!\n{caminho}")

    def gerar_relatorio_pdf(self, caminho, pagamentos, despesas, data_inicio, data_fim):
        """Gera um relatório em PDF."""
        doc = SimpleDocTemplate(caminho, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        story.append(Paragraph("Relatório Financeiro", styles['Title']))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Período: {data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}", styles['Heading2']))
        story.append(Spacer(1, 24))
        
        # Tabela de pagamentos
        story.append(Paragraph("Entradas (Pagamentos)", styles['Heading3']))
        story.append(Spacer(1, 12))
        
        data = [["ID", "Aluno", "Valor", "Data Pagto", "Vencimento", "Método", "Status"]]
        for p in pagamentos:
            aluno = aluno_dao.buscar_aluno_por_id(p.aluno_id)
            nome = aluno.nome if aluno else "?"
            data.append([p.id, nome, f"R$ {p.valor:,.2f}", 
                        p.data_pagamento.strftime('%d/%m/%Y') if p.data_pagamento else "",
                        p.data_vencimento.strftime('%d/%m/%Y') if p.data_vencimento else "-", 
                        p.metodo_pagamento, p.status])
        
        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND',(0,1),(-1,-1),colors.beige),
            ('GRID',(0,0),(-1,-1),1,colors.black)
        ]))
        story.append(t)
        story.append(Spacer(1, 24))
        
        # Tabela de despesas
        story.append(Paragraph("Saídas (Despesas)", styles['Heading3']))
        story.append(Spacer(1, 12))
        
        data = [["ID", "Valor", "Data", "Categoria", "Descrição", "Método"]]
        for d in despesas:
            data.append([d.id, f"R$ {d.valor:,.2f}", 
                        d.data_despesa.strftime('%d/%m/%Y'),
                        d.categoria, d.descricao, d.metodo_pagamento])
        
        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND',(0,1),(-1,-1),colors.beige),
            ('GRID',(0,0),(-1,-1),1,colors.black)
        ]))
        story.append(t)
        
        # Resumo
        story.append(Spacer(1, 24))
        total_entradas = sum(p.valor for p in pagamentos if p.status.lower() == 'pago')
        total_saidas = sum(d.valor for d in despesas)
        saldo = total_entradas - total_saidas
        
        story.append(Paragraph(f"Total de Entradas: R$ {total_entradas:,.2f}".replace('.', ','), styles['Normal']))
        story.append(Paragraph(f"Total de Saídas: R$ {total_saidas:,.2f}".replace('.', ','), styles['Normal']))
        story.append(Paragraph(f"Saldo do Período: R$ {saldo:,.2f}".replace('.', ','), styles['Normal']))
        
        doc.build(story)


if __name__ == "__main__":
    root = tk.Tk()
    root.title("Módulo Financeiro - Versão Completa")
    root.geometry("1200x800")
    frame = tk.Frame(root)
    frame.pack(fill="both", expand=True)
    ModuloFinanceiro(frame)
    root.mainloop()