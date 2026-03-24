#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Módulo de Alunos

Este módulo contém a interface gráfica para gestão de alunos,
incluindo cadastro, listagem, edição, exclusão e visualização de detalhes.
"""

import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime, date, timedelta
import sys
import os
import re
import logging

# Configurar logging básico
logging.basicConfig(
    filename='lpe_errors.log',
    level=logging.ERROR,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Adicionar o diretório pai ao path para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.aluno import Aluno
from data.aluno_dao import aluno_dao
from data.plano_dao import plano_dao

class ModuloAlunos:
    """
    Classe responsável pela interface de gestão de alunos.
    
    Contém todas as funcionalidades para cadastrar, listar, editar, excluir
    e visualizar informações dos alunos.
    """
    
    def __init__(self, parent_frame):
        """
        Inicializa o módulo de alunos.
        
        Args:
            parent_frame: Frame pai onde será inserida a interface
        """
        self.parent_frame = parent_frame
        self.aluno_selecionado = None
        self.criar_interface()
    
    def criar_interface(self):
        """Cria a interface principal do módulo de alunos."""
        # Limpar o frame pai
        for widget in self.parent_frame.winfo_children():
            widget.destroy()
        
        # Frame principal
        self.main_frame = tk.Frame(self.parent_frame, bg='#FFFFFF')
        self.main_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Título do módulo
        titulo = tk.Label(self.main_frame,
                         text="Gestão de Alunos",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 18, 'bold'))
        titulo.pack(pady=(0, 20))
        
        # Frame para botões de ação
        self.frame_acoes = tk.Frame(self.main_frame, bg='#FFFFFF')
        self.frame_acoes.pack(fill='x', pady=(0, 20))
        
        # Botões de ação
        self.btn_novo = tk.Button(self.frame_acoes,
                                 text="➕ Novo Aluno",
                                 bg='#FFA500',
                                 fg='#000000',
                                 font=('Arial', 10, 'bold'),
                                 command=self.abrir_cadastro_aluno,
                                 relief='flat',
                                 padx=15,
                                 pady=8)
        self.btn_novo.pack(side='left', padx=(0, 10))
        
        self.btn_editar = tk.Button(self.frame_acoes,
                                   text="✏️ Editar",
                                   bg='#333333',
                                   fg='#FFFFFF',
                                   font=('Arial', 10, 'bold'),
                                   command=self.editar_aluno_selecionado,
                                   relief='flat',
                                   padx=15,
                                   pady=8,
                                   state='disabled')
        self.btn_editar.pack(side='left', padx=(0, 10))
        
        self.btn_desativar = tk.Button(self.frame_acoes,
                                      text="🚫 Desativar",
                                      bg='#FF6B6B',
                                      fg='#FFFFFF',
                                      font=('Arial', 10, 'bold'),
                                      command=self.desativar_aluno_selecionado,
                                      relief='flat',
                                      padx=15,
                                      pady=8,
                                      state='disabled')
        self.btn_desativar.pack(side='left', padx=(0, 10))
        
        self.btn_excluir = tk.Button(self.frame_acoes,
                                    text="🗑️ Excluir",
                                    bg='#D11A2A',
                                    fg='#FFFFFF',
                                    font=('Arial', 10, 'bold'),
                                    command=self.excluir_aluno_selecionado,
                                    relief='flat',
                                    padx=15,
                                    pady=8,
                                    state='disabled')
        self.btn_excluir.pack(side='left', padx=(0, 10))
        
        self.btn_atualizar = tk.Button(self.frame_acoes,
                                      text="🔄 Atualizar Lista",
                                      bg='#4ECDC4',
                                      fg='#000000',
                                      font=('Arial', 10, 'bold'),
                                      command=self.carregar_lista_alunos,
                                      relief='flat',
                                      padx=15,
                                      pady=8)
        self.btn_atualizar.pack(side='right')
        
        # Frame para busca
        self.frame_busca = tk.Frame(self.main_frame, bg='#FFFFFF')
        self.frame_busca.pack(fill='x', pady=(0, 20))
        
        tk.Label(self.frame_busca,
                text="Buscar:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).pack(side='left')
        
        self.entry_busca = tk.Entry(self.frame_busca,
                                   font=('Arial', 10),
                                   width=30)
        self.entry_busca.pack(side='left', padx=(10, 10))
        self.entry_busca.bind('<KeyRelease>', self.buscar_alunos)
        
        # Checkbox para mostrar inativos
        self.var_mostrar_inativos = tk.BooleanVar()
        self.check_inativos = tk.Checkbutton(self.frame_busca,
                                           text="Mostrar inativos",
                                           variable=self.var_mostrar_inativos,
                                           bg='#FFFFFF',
                                           fg='#333333',
                                           font=('Arial', 10),
                                           command=self.carregar_lista_alunos)
        self.check_inativos.pack(side='left', padx=(20, 0))
        
        # Frame para a lista de alunos
        self.frame_lista = tk.Frame(self.main_frame, bg='#FFFFFF')
        self.frame_lista.pack(fill='both', expand=True)
        
        # Criar a treeview para lista de alunos
        self.criar_lista_alunos()
        
        # Carregar a lista inicial
        self.carregar_lista_alunos()
    
    def criar_lista_alunos(self):
        """Cria a lista (TreeView) de alunos."""
        # Colunas da lista
        colunas = ('ID', 'Nome', 'Telefone', 'Email', 'Cidade', 'Status', 'Cadastro')
        
        self.tree_alunos = ttk.Treeview(self.frame_lista,
                                       columns=colunas,
                                       show='headings',
                                       height=15)
        
        # Configurar cabeçalhos
        self.tree_alunos.heading('ID', text='ID')
        self.tree_alunos.heading('Nome', text='Nome')
        self.tree_alunos.heading('Telefone', text='Telefone')
        self.tree_alunos.heading('Email', text='Email')
        self.tree_alunos.heading('Cidade', text='Cidade')
        self.tree_alunos.heading('Status', text='Status')
        self.tree_alunos.heading('Cadastro', text='Data Cadastro')
        
        # Configurar larguras das colunas
        self.tree_alunos.column('ID', width=50, anchor='center')
        self.tree_alunos.column('Nome', width=200, anchor='w')
        self.tree_alunos.column('Telefone', width=120, anchor='center')
        self.tree_alunos.column('Email', width=180, anchor='w')
        self.tree_alunos.column('Cidade', width=120, anchor='w')
        self.tree_alunos.column('Status', width=80, anchor='center')
        self.tree_alunos.column('Cadastro', width=100, anchor='center')
        
        # Scrollbars
        scrollbar_v = ttk.Scrollbar(self.frame_lista,
                                   orient='vertical',
                                   command=self.tree_alunos.yview)
        scrollbar_h = ttk.Scrollbar(self.frame_lista,
                                   orient='horizontal',
                                   command=self.tree_alunos.xview)
        
        self.tree_alunos.configure(yscrollcommand=scrollbar_v.set,
                                  xscrollcommand=scrollbar_h.set)
        
        # Posicionar elementos
        self.tree_alunos.pack(side='left', fill='both', expand=True)
        scrollbar_v.pack(side='right', fill='y')
        scrollbar_h.pack(side='bottom', fill='x')
        
        # Bind para seleção
        self.tree_alunos.bind('<<TreeviewSelect>>', self.on_aluno_selecionado)
        self.tree_alunos.bind('<Double-1>', self.visualizar_detalhes_aluno)
    
    def carregar_lista_alunos(self):
        """Carrega a lista de alunos na TreeView."""
        # Limpar lista atual
        for item in self.tree_alunos.get_children():
            self.tree_alunos.delete(item)
        
        # Buscar alunos
        mostrar_inativos = not self.var_mostrar_inativos.get()
        alunos = aluno_dao.listar_todos_alunos(apenas_ativos=mostrar_inativos)
        
        # Adicionar alunos à lista
        for aluno in alunos:
            status = "Ativo" if aluno.ativo else "Inativo"
            data_cadastro = aluno.data_cadastro.strftime("%d/%m/%Y")
            
            self.tree_alunos.insert('', 'end', values=(
                aluno.id,
                aluno.nome,
                aluno.telefone,
                aluno.email,
                aluno.cidade,
                status,
                data_cadastro
            ))
        
        # Atualizar contador
        total_alunos = len(alunos)
        self.atualizar_status_lista(f"Total: {total_alunos} alunos")
    
    def buscar_alunos(self, event=None):
        """Busca alunos conforme o texto digitado."""
        termo_busca = self.entry_busca.get().strip()
        
        if not termo_busca:
            self.carregar_lista_alunos()
            return
        
        # Limpar lista atual
        for item in self.tree_alunos.get_children():
            self.tree_alunos.delete(item)
        
        # Buscar alunos
        alunos = aluno_dao.buscar_alunos_por_nome(termo_busca)
        
        # Adicionar alunos à lista
        for aluno in alunos:
            if not self.var_mostrar_inativos.get() and not aluno.ativo:
                continue
            status = "Ativo" if aluno.ativo else "Inativo"
            data_cadastro = aluno.data_cadastro.strftime("%d/%m/%Y")
            
            self.tree_alunos.insert('', 'end', values=(
                aluno.id,
                aluno.nome,
                aluno.telefone,
                aluno.email,
                aluno.cidade,
                status,
                data_cadastro
            ))
        
        # Atualizar contador
        total_alunos = len(self.tree_alunos.get_children())
        self.atualizar_status_lista(f"Total: {total_alunos} alunos")
    
    def atualizar_status_lista(self, texto):
        """Atualiza o texto de status da lista de alunos."""
        if hasattr(self, 'label_status'):
            self.label_status.config(text=texto)
        else:
            self.label_status = tk.Label(self.main_frame,
                                       text=texto,
                                       bg='#FFFFFF',
                                       fg='#666666',
                                       font=('Arial', 10))
            self.label_status.pack(side='bottom', pady=(10, 0))
    
    def on_aluno_selecionado(self, event):
        """Evento disparado quando um aluno é selecionado na lista."""
        selecao = self.tree_alunos.selection()
        if not selecao:
            self.aluno_selecionado = None
            self.btn_editar.config(state='disabled')
            self.btn_desativar.config(state='disabled')
            self.btn_excluir.config(state='disabled')
            return
        
        item = self.tree_alunos.item(selecao[0])
        aluno_id = item['values'][0]
        self.aluno_selecionado = aluno_dao.buscar_aluno_por_id(aluno_id)
        
        if self.aluno_selecionado:
            self.btn_editar.config(state='normal')
            self.btn_desativar.config(state='normal')
            self.btn_excluir.config(state='normal')
            self.btn_desativar.config(text="🚫 Desativar" if self.aluno_selecionado.ativo else "✅ Reativar")
    
    def abrir_cadastro_aluno(self, aluno_existente=None):
        """Abre a janela de cadastro ou edição de aluno."""
        janela = tk.Toplevel(self.parent_frame)
        janela.title("Novo Aluno" if not aluno_existente else f"Editar Aluno - {aluno_existente.nome}")
        janela.geometry("600x700")
        janela.configure(bg='#FFFFFF')
        janela.transient(self.parent_frame)
        janela.grab_set()
        
        # Centralizar janela
        janela.update_idletasks()
        x = (janela.winfo_screenwidth() // 2) - (600 // 2)
        y = (janela.winfo_screenheight() // 2) - (700 // 2)
        janela.geometry(f"600x700+{x}+{y}")
        
        # Frame principal com Canvas e Scrollbar
        canvas = tk.Canvas(janela, bg='#FFFFFF')
        scrollbar = ttk.Scrollbar(janela, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#FFFFFF')
        
        # Configurar o scroll
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Posicionar canvas e scrollbar
        canvas.pack(side="left", fill="both", expand=True, padx=(10, 0), pady=10)
        scrollbar.pack(side="right", fill="y", pady=10)
        
        # Título
        tk.Label(scrollable_frame,
                 text="Cadastro de Aluno" if not aluno_existente else "Editar Aluno",
                 bg='#FFFFFF',
                 fg='#FFA500',
                 font=('Arial', 14, 'bold')).grid(row=0, column=0, columnspan=2, pady=(10, 20))
        
        # Campos do formulário
        campos = {}
        row = 1
        
        # Nome
        tk.Label(scrollable_frame, text="Nome *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['nome'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=40)
        campos['nome'].grid(row=row, column=1, sticky='ew', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['nome'].insert(0, aluno_existente.nome)
        row += 1
        
        # CPF
        tk.Label(scrollable_frame, text="CPF *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['cpf'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=20)
        campos['cpf'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['cpf'].insert(0, aluno_existente.cpf)
        row += 1
        
        # Data de Nascimento
        tk.Label(scrollable_frame, text="Data de Nascimento:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['data_nascimento'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=20)
        campos['data_nascimento'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        if aluno_existente and aluno_existente.data_nascimento:
            campos['data_nascimento'].insert(0, aluno_existente.data_nascimento.strftime("%d/%m/%Y"))
        row += 1
        
        # Gênero
        tk.Label(scrollable_frame, text="Gênero:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['genero'] = tk.StringVar(value=aluno_existente.genero if aluno_existente else "")
        generos = ["", "Masculino", "Feminino", "Outro"]
        genero_menu = tk.OptionMenu(scrollable_frame, campos['genero'], *generos)
        genero_menu.config(width=15)
        genero_menu.grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        row += 1
        
        # Telefone
        tk.Label(scrollable_frame, text="Telefone:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['telefone'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=20)
        campos['telefone'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['telefone'].insert(0, aluno_existente.telefone)
        row += 1
        
        # Email
        tk.Label(scrollable_frame, text="Email:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['email'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=40)
        campos['email'].grid(row=row, column=1, sticky='ew', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['email'].insert(0, aluno_existente.email)
        row += 1
        
        # Endereço
        tk.Label(scrollable_frame, text="Endereço:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['endereco'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=40)
        campos['endereco'].grid(row=row, column=1, sticky='ew', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['endereco'].insert(0, aluno_existente.endereco)
        row += 1
        
        # Cidade
        tk.Label(scrollable_frame, text="Cidade:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['cidade'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=25)
        campos['cidade'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['cidade'].insert(0, aluno_existente.cidade)
        row += 1
        
        # CEP
        tk.Label(scrollable_frame, text="CEP:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['cep'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=15)
        campos['cep'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['cep'].insert(0, aluno_existente.cep)
        row += 1
        
        # Profissão
        tk.Label(scrollable_frame, text="Profissão:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['profissao'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=25)
        campos['profissao'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['profissao'].insert(0, aluno_existente.profissao)
        row += 1
        
        # Contato de Emergência
        tk.Label(scrollable_frame, text="Contato de Emergência:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['contato_emergencia'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=25)
        campos['contato_emergencia'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['contato_emergencia'].insert(0, aluno_existente.contato_emergencia)
        row += 1
        
        # Telefone de Emergência
        tk.Label(scrollable_frame, text="Telefone de Emergência:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['telefone_emergencia'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=20)
        campos['telefone_emergencia'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['telefone_emergencia'].insert(0, aluno_existente.telefone_emergencia)
        row += 1
        
        # Grupo
        tk.Label(scrollable_frame, text="Grupo:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['grupo'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=25)
        campos['grupo'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['grupo'].insert(0, aluno_existente.grupo)
        row += 1
        
        # Modalidade
        tk.Label(scrollable_frame, text="Modalidade:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['modalidade'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=25)
        campos['modalidade'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['modalidade'].insert(0, aluno_existente.modalidade)
        row += 1
        
        # Objetivos
        tk.Label(scrollable_frame, text="Objetivos:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='nw', pady=5, padx=(10, 5))
        campos['objetivos'] = {}
        objetivos = ["Hipertrofia", "Emagrecimento", "Condicionamento Físico", "Saúde", "Resistência"]
        frame_objetivos = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_objetivos.grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        for i, obj in enumerate(objetivos):
            campos['objetivos'][obj] = tk.BooleanVar(value=obj in aluno_existente.objetivos if aluno_existente else False)
            tk.Checkbutton(frame_objetivos, text=obj, variable=campos['objetivos'][obj], bg='#FFFFFF', fg='#666666', font=('Arial', 9)).grid(row=i, column=0, sticky='w')
        row += 1
        
        # Peso Desejado
        tk.Label(scrollable_frame, text="Peso Desejado (kg):", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['peso_desejado'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=15)
        campos['peso_desejado'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        if aluno_existente and aluno_existente.peso_desejado:
            campos['peso_desejado'].insert(0, str(aluno_existente.peso_desejado).replace('.', ','))
        row += 1
        
        # Plano
        tk.Label(scrollable_frame, text="Plano:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        planos = ["Nenhum"] + [p['nome'] for p in aluno_dao.listar_planos()]
        campos['plano'] = tk.StringVar(value="Nenhum")
        if aluno_existente and aluno_existente.plano_id:
            plano = plano_dao.buscar_plano_por_id(aluno_existente.plano_id)
            if plano:
                campos['plano'].set(plano.nome)
        plano_menu = tk.OptionMenu(scrollable_frame, campos['plano'], *planos)
        plano_menu.config(width=20)
        plano_menu.grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        row += 1
        
        # Data de Início do Plano
        tk.Label(scrollable_frame, text="Data de Início:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['data_inicio'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=20)
        campos['data_inicio'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        row += 1
        
        # Valor Pago
        tk.Label(scrollable_frame, text="Valor Pago (R$):", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', pady=5, padx=(10, 5))
        campos['valor_pago'] = tk.Entry(scrollable_frame, font=('Arial', 10), width=15)
        campos['valor_pago'].grid(row=row, column=1, sticky='w', pady=5, padx=(5, 10))
        row += 1
        
        # Observações
        tk.Label(scrollable_frame, text="Observações:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='nw', pady=5, padx=(10, 5))
        campos['observacoes'] = tk.Text(scrollable_frame, font=('Arial', 10), height=4, width=40)
        campos['observacoes'].grid(row=row, column=1, sticky='ew', pady=5, padx=(5, 10))
        if aluno_existente:
            campos['observacoes'].insert('1.0', aluno_existente.observacoes)
        row += 1
        
        # Frame para botões (fixo na parte inferior)
        frame_botoes = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_botoes.grid(row=row, column=0, columnspan=2, pady=20, padx=10, sticky='ew')
        
        btn_salvar = tk.Button(frame_botoes,
                              text="💾 Salvar",
                              bg='#FFA500',
                              fg='#000000',
                              font=('Arial', 10, 'bold'),
                              command=lambda: self.salvar_aluno(janela, campos, aluno_existente),
                              relief='flat',
                              padx=20,
                              pady=8)
        btn_salvar.pack(side='left', padx=(0, 10))
        
        btn_cancelar = tk.Button(frame_botoes,
                                text="❌ Cancelar",
                                bg='#666666',
                                fg='#FFFFFF',
                                font=('Arial', 10, 'bold'),
                                command=janela.destroy,
                                relief='flat',
                                padx=20,
                                pady=8)
        btn_cancelar.pack(side='left')
        
        # Configurar peso das colunas
        scrollable_frame.columnconfigure(1, weight=1)
        
        # Focar no campo nome
        campos['nome'].focus()
        
        # Configurar scroll com mouse wheel
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        
        # Bind do scroll para diferentes sistemas operacionais
        canvas.bind("<MouseWheel>", _on_mousewheel)  # Windows
        canvas.bind("<Button-4>", lambda e: canvas.yview_scroll(-1, "units"))  # Linux
        canvas.bind("<Button-5>", lambda e: canvas.yview_scroll(1, "units"))   # Linux
        
        # Garantir que o canvas tenha foco para receber eventos de scroll
        canvas.focus_set()
    
    def salvar_aluno(self, janela, campos, aluno_existente=None):
        """Salva ou atualiza os dados do aluno."""
        # Validar campos obrigatórios
        nome = campos['nome'].get().strip()
        if not nome:
            messagebox.showerror("Erro", "O nome é obrigatório!")
            return
        
        cpf = campos['cpf'].get().strip()
        # Remover formatação do CPF para validação
        cpf_numeros = re.sub(r'\D', '', cpf)
        if cpf_numeros and len(cpf_numeros) != 11:
            messagebox.showerror("Erro", "CPF deve ter 11 dígitos!")
            return
        
        # Validar se CPF já existe (exceto para aluno existente)
        if cpf_numeros and (not aluno_existente or aluno_existente.cpf != cpf_numeros):
            aluno_cpf = aluno_dao.buscar_aluno_por_cpf(cpf_numeros)
            if aluno_cpf:
                messagebox.showerror("Erro", "CPF já cadastrado para outro aluno!")
                return
        
        # Validar data de nascimento
        data_nascimento = None
        data_nasc_str = campos['data_nascimento'].get().strip()
        if data_nasc_str:
            try:
                data_nascimento = datetime.strptime(data_nasc_str, "%d/%m/%Y").date()
                if data_nascimento > date.today():
                    messagebox.showerror("Erro", "Data de nascimento não pode ser futura!")
                    return
            except ValueError:
                messagebox.showerror("Erro", "Data de nascimento inválida! Use o formato DD/MM/AAAA")
                return
        
        # Validar data de início do plano
        data_inicio = None
        data_inicio_str = campos['data_inicio'].get().strip()
        if data_inicio_str:
            try:
                data_inicio = datetime.strptime(data_inicio_str, "%d/%m/%Y").date()
            except ValueError:
                messagebox.showerror("Erro", "Data de início inválida! Use o formato DD/MM/AAAA")
                return
        
        # Validar valor pago
        valor_pago = None
        valor_pago_str = campos['valor_pago'].get().strip().replace(',', '.')
        if valor_pago_str:
            try:
                valor_pago = float(valor_pago_str)
                if valor_pago < 0:
                    raise ValueError
            except ValueError:
                messagebox.showerror("Erro", "Valor pago inválido! Use um número positivo.")
                return
        
        # Validar peso desejado
        peso_desejado = None
        peso_desejado_str = campos['peso_desejado'].get().strip().replace(',', '.')
        if peso_desejado_str:
            try:
                peso_desejado = float(peso_desejado_str)
                if peso_desejado <= 0:
                    raise ValueError
            except ValueError:
                messagebox.showerror("Erro", "Peso desejado inválido! Use um número positivo.")
                return
        
        # Coleta de objetivos
        objetivos = [opcao for opcao, var in campos['objetivos'].items() if var.get()]
        
        # Coleta do plano
        plano_nome = campos['plano'].get()
        plano_id = None
        if plano_nome != "Nenhum":
            planos = aluno_dao.listar_planos()
            for plano in planos:
                if plano['nome'] == plano_nome:
                    plano_id = plano['id']
                    break
        else:
            if data_inicio or valor_pago:
                messagebox.showerror("Erro", "Selecione um plano para informar data de início ou valor pago!")
                return
        
        # Validação de assinatura
        if plano_id and (not data_inicio or not valor_pago):
            messagebox.showerror("Erro", "Data de início e valor pago são obrigatórios quando um plano é selecionado!")
            return
        
        # Criar ou atualizar aluno
        aluno = Aluno(
            nome=nome,
            cpf=cpf_numeros,
            data_nascimento=data_nascimento,
            telefone=campos['telefone'].get().strip(),
            email=campos['email'].get().strip(),
            endereco=campos['endereco'].get().strip(),
            cidade=campos['cidade'].get().strip(),
            cep=campos['cep'].get().strip(),
            profissao=campos['profissao'].get().strip(),
            contato_emergencia=campos['contato_emergencia'].get().strip(),
            telefone_emergencia=campos['telefone_emergencia'].get().strip(),
            observacoes=campos['observacoes'].get("1.0", tk.END).strip(),
            ativo=True,
            genero=campos['genero'].get(),
            grupo=campos['grupo'].get().strip(),
            modalidade=campos['modalidade'].get().strip(),
            plano_id=plano_id,
            objetivos=objetivos,
            peso_desejado=peso_desejado
        )
        
        try:
            if aluno_existente:
                aluno.id = aluno_existente.id
                sucesso = aluno_dao.atualizar_aluno(aluno)
                msg = "Aluno atualizado com sucesso!"
            else:
                aluno_id = aluno_dao.criar_aluno(aluno)
                aluno.id = aluno_id
                sucesso = aluno_id is not None
                msg = "Aluno cadastrado com sucesso!"
            
            if not sucesso:
                messagebox.showerror("Erro", "Erro ao salvar aluno no banco de dados!")
                return
            
            # Criar assinatura, se necessário
            if plano_id and data_inicio and valor_pago:
                try:
                    plano = plano_dao.buscar_plano_por_id(plano_id)
                    if plano:
                        data_fim = data_inicio + timedelta(days=plano.duracao_dias)
                        plano_dao.criar_assinatura(aluno.id, plano, data_inicio, data_fim, valor_pago)
                    else:
                        messagebox.showerror("Erro", "Plano selecionado não encontrado!")
                        return
                except Exception as e:
                    logging.error(f"Erro ao criar assinatura: {str(e)}")
                    messagebox.showerror("Erro", f"Erro ao criar assinatura: {str(e)}")
                    return
            
            messagebox.showinfo("Sucesso", msg)
            self.carregar_lista_alunos()
            janela.destroy()
        except Exception as e:
            logging.error(f"Erro ao salvar aluno: {str(e)}")
            messagebox.showerror("Erro", f"Erro ao salvar aluno: {str(e)}")
    
    def editar_aluno_selecionado(self):
        """Abre a janela de edição do aluno selecionado."""
        if self.aluno_selecionado:
            self.abrir_cadastro_aluno(self.aluno_selecionado)
    
    def excluir_aluno_selecionado(self):
        """Exclui o aluno selecionado."""
        if not self.aluno_selecionado:
            return
        
        resposta = messagebox.askyesno("Confirmar", 
                                     f"Deseja excluir o aluno '{self.aluno_selecionado.nome}'?")
        if resposta:
            if aluno_dao.excluir_aluno(self.aluno_selecionado.id):
                messagebox.showinfo("Sucesso", "Aluno excluído com sucesso!")
                self.carregar_lista_alunos()
                self.aluno_selecionado = None
                self.btn_editar.config(state='disabled')
                self.btn_desativar.config(state='disabled')
                self.btn_excluir.config(state='disabled')
            else:
                messagebox.showerror("Erro", "Erro ao excluir aluno!")
    
    def desativar_aluno_selecionado(self):
        """Desativa ou reativa o aluno selecionado."""
        if not self.aluno_selecionado:
            return
        
        if self.aluno_selecionado.ativo:
            resposta = messagebox.askyesno("Confirmar", 
                                         f"Deseja desativar o aluno '{self.aluno_selecionado.nome}'?")
            if resposta:
                if aluno_dao.desativar_aluno(self.aluno_selecionado.id):
                    messagebox.showinfo("Sucesso", "Aluno desativado com sucesso!")
                    self.carregar_lista_alunos()
                else:
                    messagebox.showerror("Erro", "Erro ao desativar aluno!")
        else:
            resposta = messagebox.askyesno("Confirmar", 
                                         f"Deseja reativar o aluno '{self.aluno_selecionado.nome}'?")
            if resposta:
                if aluno_dao.reativar_aluno(self.aluno_selecionado.id):
                    messagebox.showinfo("Sucesso", "Aluno reativado com sucesso!")
                    self.carregar_lista_alunos()
                else:
                    messagebox.showerror("Erro", "Erro ao reativar aluno!")
    
    def visualizar_detalhes_aluno(self, event=None):
        """Visualiza os detalhes completos do aluno selecionado."""
        if not self.aluno_selecionado:
            return
        
        # Recarregar os dados do aluno do banco de dados para garantir que estejam atualizados
        aluno = aluno_dao.buscar_aluno_por_id(self.aluno_selecionado.id)
        if not aluno:
            messagebox.showerror("Erro", "Não foi possível carregar os dados do aluno!")
            return
        
        # Criar janela de detalhes
        janela = tk.Toplevel(self.parent_frame)
        janela.title(f"Detalhes do Aluno - {aluno.nome}")
        janela.geometry("600x700")
        janela.configure(bg='#FFFFFF')
        janela.transient(self.parent_frame)
        
        # Centralizar janela
        janela.update_idletasks()
        x = (janela.winfo_screenwidth() // 2) - (600 // 2)
        y = (janela.winfo_screenheight() // 2) - (700 // 2)
        janela.geometry(f"600x700+{x}+{y}")
        
        # Frame principal com scroll
        canvas = tk.Canvas(janela, bg='#FFFFFF')
        scrollbar = ttk.Scrollbar(janela, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#FFFFFF')
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True, padx=(10, 0), pady=10)
        scrollbar.pack(side="right", fill="y", pady=10)
        
        # Título
        titulo = tk.Label(scrollable_frame,
                         text="Detalhes do Aluno",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 14, 'bold'))
        titulo.pack(pady=(10, 20))
        
        # Informações do aluno
        def criar_campo_info(label, valor):
            frame = tk.Frame(scrollable_frame, bg='#FFFFFF')
            frame.pack(fill='x', padx=10, pady=2)
            tk.Label(frame, text=f"{label}:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
            tk.Label(frame, text=str(valor) if valor else "-", bg='#FFFFFF', fg='#666666', font=('Arial', 10)).pack(anchor='w', padx=(20, 0))
        
        criar_campo_info("ID", aluno.id)
        criar_campo_info("Nome", aluno.nome)
        criar_campo_info("CPF", aluno.cpf)
        criar_campo_info("Data de Nascimento", aluno.data_nascimento.strftime("%d/%m/%Y") if aluno.data_nascimento else "-")
        criar_campo_info("Gênero", aluno.genero)
        criar_campo_info("Telefone", aluno.telefone)
        criar_campo_info("Email", aluno.email)
        criar_campo_info("Grupo", aluno.grupo)
        criar_campo_info("Modalidade", aluno.modalidade)
        
        # Informações do plano
        assinatura = plano_dao.buscar_assinatura_ativa_por_aluno(aluno.id)
        if assinatura:
            criar_campo_info("Plano", assinatura['plano_nome'])
            criar_campo_info("Valor do Plano", f"R$ {assinatura['plano_valor']:.2f}".replace('.', ','))
            criar_campo_info("Duração do Plano", f"{assinatura['plano_duracao_dias']} dias")
            criar_campo_info("Descrição do Plano", assinatura['plano_descricao'] if assinatura['plano_descricao'] else "-")
            criar_campo_info("Data de Início", datetime.strptime(assinatura['data_inicio'], "%Y-%m-%d").strftime("%d/%m/%Y"))
            criar_campo_info("Data de Término", datetime.strptime(assinatura['data_fim'], "%Y-%m-%d").strftime("%d/%m/%Y"))
            criar_campo_info("Valor Pago", f"R$ {assinatura['valor_pago']:.2f}".replace('.', ','))
        else:
            criar_campo_info("Plano", "Nenhum plano ativo")
        
        criar_campo_info("Objetivos", ", ".join(aluno.objetivos) if aluno.objetivos else "-")
        criar_campo_info("Peso Desejado", f"{aluno.peso_desejado} kg" if aluno.peso_desejado else "-")
        criar_campo_info("Endereço", aluno.endereco)
        criar_campo_info("Cidade", aluno.cidade)
        criar_campo_info("CEP", aluno.cep)
        criar_campo_info("Profissão", aluno.profissao)
        criar_campo_info("Contato de Emergência", aluno.contato_emergencia)
        criar_campo_info("Telefone de Emergência", aluno.telefone_emergencia)
        
        # Observações
        if aluno.observacoes:
            frame_observ = tk.Frame(scrollable_frame, bg='#FFFFFF')
            frame_observ.pack(fill='x', padx=10, pady=2)
            tk.Label(frame_observ, text="Observações:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
            text_observ = tk.Text(frame_observ, font=('Arial', 10), height=3, wrap='word', state='disabled')
            text_observ.pack(fill='x', pady=(5, 0))
            text_observ.config(state='normal')
            text_observ.insert('1.0', aluno.observacoes)
            text_observ.config(state='disabled')
        
        # Status e datas
        criar_campo_info("Status", "Ativo" if aluno.ativo else "Inativo")
        criar_campo_info("Data de Cadastro", aluno.data_cadastro.strftime("%d/%m/%Y às %H:%M"))
        criar_campo_info("Última Atualização", aluno.data_ultima_atualizacao.strftime("%d/%m/%Y às %H:%M"))
        
        # Botão fechar
        btn_fechar = tk.Button(scrollable_frame,
                              text="Fechar",
                              bg='#666666',
                              fg='#FFFFFF',
                              font=('Arial', 10, 'bold'),
                              command=janela.destroy,
                              relief='flat',
                              padx=15,
                              pady=5)
        btn_fechar.pack(pady=20)
        
        # Configurar scroll com mouse wheel
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        
        # Bind do scroll para diferentes sistemas operacionais
        canvas.bind("<MouseWheel>", _on_mousewheel)  # Windows
        canvas.bind("<Button-4>", lambda e: canvas.yview_scroll(-1, "units"))  # Linux
        canvas.bind("<Button-5>", lambda e: canvas.yview_scroll(1, "units"))   # Linux
        
        # Garantir que o canvas tenha foco para receber eventos de scroll
        canvas.focus_set()

