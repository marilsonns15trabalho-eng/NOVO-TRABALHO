#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Módulo de Planos

Este módulo contém a interface gráfica para gestão de planos,
incluindo criação, edição e atribuição de planos aos alunos.
"""

import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime, date
import sys
import os

# Adicionar o diretório pai ao path para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.plano import Plano
from data.plano_dao import plano_dao

class ModuloPlanos:
    """
    Classe responsável pela interface de gestão de planos.
    
    Contém todas as funcionalidades para criar, editar e gerenciar
    os planos oferecidos pelo estúdio.
    """
    
    def __init__(self, parent_frame):
        """
        Inicializa o módulo de planos.
        
        Args:
            parent_frame: Frame pai onde será inserida a interface
        """
        self.parent_frame = parent_frame
        self.plano_selecionado = None
        self.criar_interface()
    
    def criar_interface(self):
        """Cria a interface principal do módulo de planos."""
        # Limpar o frame pai
        for widget in self.parent_frame.winfo_children():
            widget.destroy()
        
        # Frame principal
        self.main_frame = tk.Frame(self.parent_frame, bg='#FFFFFF')
        self.main_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Título do módulo
        titulo = tk.Label(self.main_frame,
                         text="Gestão de Planos",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 18, 'bold'))
        titulo.pack(pady=(0, 20))
        
        # Notebook para abas
        self.notebook = ttk.Notebook(self.main_frame)
        self.notebook.pack(fill='both', expand=True)
        
        # Criar abas
        self.criar_aba_planos()
        self.criar_aba_novo_plano()
        
        # Carregar dados iniciais
        self.carregar_lista_planos()
        
        # Criar planos padrão se não existirem
        plano_dao.criar_planos_padrao()
    
    def criar_aba_planos(self):
        """Cria a aba de listagem de planos."""
        # Frame da aba
        self.frame_planos = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_planos, text="📋 Planos")
        
        # Frame para botões de ação
        frame_acoes = tk.Frame(self.frame_planos, bg='#FFFFFF')
        frame_acoes.pack(fill='x', pady=(10, 20), padx=10)
        
        # Botões de ação
        btn_novo = tk.Button(frame_acoes,
                            text="➕ Novo Plano",
                            bg='#FFA500',
                            fg='#000000',
                            font=('Arial', 10, 'bold'),
                            command=self.abrir_novo_plano,
                            relief='flat',
                            padx=15,
                            pady=8)
        btn_novo.pack(side='left', padx=(0, 10))
        
        self.btn_editar = tk.Button(frame_acoes,
                                   text="✏️ Editar",
                                   bg='#333333',
                                   fg='#FFFFFF',
                                   font=('Arial', 10, 'bold'),
                                   command=self.editar_plano_selecionado,
                                   relief='flat',
                                   padx=15,
                                   pady=8,
                                   state='disabled')
        self.btn_editar.pack(side='left', padx=(0, 10))
        
        self.btn_desativar = tk.Button(frame_acoes,
                                      text="🚫 Desativar",
                                      bg='#FF6B6B',
                                      fg='#FFFFFF',
                                      font=('Arial', 10, 'bold'),
                                      command=self.desativar_plano_selecionado,
                                      relief='flat',
                                      padx=15,
                                      pady=8,
                                      state='disabled')
        self.btn_desativar.pack(side='left', padx=(0, 10))
        
        btn_atualizar = tk.Button(frame_acoes,
                                 text="🔄 Atualizar",
                                 bg='#95A5A6',
                                 fg='#FFFFFF',
                                 font=('Arial', 10, 'bold'),
                                 command=self.carregar_lista_planos,
                                 relief='flat',
                                 padx=15,
                                 pady=8)
        btn_atualizar.pack(side='right')
        
        # Frame para filtros
        frame_filtros = tk.Frame(self.frame_planos, bg='#FFFFFF')
        frame_filtros.pack(fill='x', pady=(0, 20), padx=10)
        
        tk.Label(frame_filtros,
                text="Buscar:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).pack(side='left')
        
        self.entry_busca = tk.Entry(frame_filtros,
                                   font=('Arial', 10),
                                   width=30)
        self.entry_busca.pack(side='left', padx=(10, 10))
        self.entry_busca.bind('<KeyRelease>', self.buscar_planos)
        
        # Checkbox para mostrar inativos
        self.var_mostrar_inativos = tk.BooleanVar()
        self.check_inativos = tk.Checkbutton(frame_filtros,
                                           text="Mostrar inativos",
                                           variable=self.var_mostrar_inativos,
                                           bg='#FFFFFF',
                                           fg='#333333',
                                           font=('Arial', 10),
                                           command=self.carregar_lista_planos)
        self.check_inativos.pack(side='left', padx=(20, 0))
        
        # Frame para a lista de planos
        frame_lista = tk.Frame(self.frame_planos, bg='#FFFFFF')
        frame_lista.pack(fill='both', expand=True, padx=10, pady=(0, 10))
        
        # Criar a treeview para lista de planos
        self.criar_lista_planos(frame_lista)
    
    def criar_aba_novo_plano(self):
        """Cria a aba para criar novo plano."""
        # Frame da aba
        self.frame_novo_plano = tk.Frame(self.notebook, bg='#FFFFFF')
        self.notebook.add(self.frame_novo_plano, text="➕ Novo Plano")
        
        # Frame principal com scroll
        canvas = tk.Canvas(self.frame_novo_plano, bg='#FFFFFF')
        scrollbar = ttk.Scrollbar(self.frame_novo_plano, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#FFFFFF')
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Título
        titulo = tk.Label(scrollable_frame,
                         text="Criar Novo Plano",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 16, 'bold'))
        titulo.pack(pady=(20, 30))
        
        # Campos do formulário
        self.campos_plano = {}
        
        # Nome do plano
        frame_nome = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_nome.pack(fill='x', padx=20, pady=10)
        tk.Label(frame_nome, text="Nome do Plano *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_plano['nome'] = tk.Entry(frame_nome, font=('Arial', 10), width=50)
        self.campos_plano['nome'].pack(fill='x', pady=(5, 0))
        
        # Valor
        frame_valor = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_valor.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_valor, text="Valor (R$) *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_plano['valor'] = tk.Entry(frame_valor, font=('Arial', 10), width=20)
        self.campos_plano['valor'].pack(anchor='w', pady=(5, 0))
        
        # Duração
        frame_duracao = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_duracao.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_duracao, text="Duração *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        
        frame_duracao_input = tk.Frame(frame_duracao, bg='#FFFFFF')
        frame_duracao_input.pack(fill='x', pady=(5, 0))
        
        self.campos_plano['duracao_dias'] = tk.Entry(frame_duracao_input, font=('Arial', 10), width=10)
        self.campos_plano['duracao_dias'].pack(side='left')
        
        tk.Label(frame_duracao_input, text="dias", bg='#FFFFFF', fg='#666666', font=('Arial', 10)).pack(side='left', padx=(5, 20))
        
        # Botões de duração rápida
        btn_7dias = tk.Button(frame_duracao_input, text="7 dias", bg='#E8E8E8', fg='#333333', font=('Arial', 8), 
                             command=lambda: self.campos_plano['duracao_dias'].delete(0, 'end') or self.campos_plano['duracao_dias'].insert(0, '7'),
                             relief='flat', padx=8, pady=2)
        btn_7dias.pack(side='left', padx=(0, 5))
        
        btn_30dias = tk.Button(frame_duracao_input, text="30 dias", bg='#E8E8E8', fg='#333333', font=('Arial', 8),
                              command=lambda: self.campos_plano['duracao_dias'].delete(0, 'end') or self.campos_plano['duracao_dias'].insert(0, '30'),
                              relief='flat', padx=8, pady=2)
        btn_30dias.pack(side='left', padx=(0, 5))
        
        btn_90dias = tk.Button(frame_duracao_input, text="90 dias", bg='#E8E8E8', fg='#333333', font=('Arial', 8),
                              command=lambda: self.campos_plano['duracao_dias'].delete(0, 'end') or self.campos_plano['duracao_dias'].insert(0, '90'),
                              relief='flat', padx=8, pady=2)
        btn_90dias.pack(side='left', padx=(0, 5))
        
        btn_365dias = tk.Button(frame_duracao_input, text="365 dias", bg='#E8E8E8', fg='#333333', font=('Arial', 8),
                               command=lambda: self.campos_plano['duracao_dias'].delete(0, 'end') or self.campos_plano['duracao_dias'].insert(0, '365'),
                               relief='flat', padx=8, pady=2)
        btn_365dias.pack(side='left')
        
        # Descrição
        frame_desc = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_desc.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_desc, text="Descrição:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        self.campos_plano['descricao'] = tk.Text(frame_desc, font=('Arial', 10), width=50, height=6)
        self.campos_plano['descricao'].pack(fill='x', pady=(5, 0))
        
        # Botões
        frame_botoes = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_botoes.pack(fill='x', padx=20, pady=30)
        
        btn_salvar = tk.Button(frame_botoes,
                              text="💾 Salvar Plano",
                              bg='#FFA500',
                              fg='#000000',
                              font=('Arial', 12, 'bold'),
                              command=self.salvar_novo_plano,
                              relief='flat',
                              padx=20,
                              pady=10)
        btn_salvar.pack(side='left', padx=(0, 10))
        
        btn_limpar = tk.Button(frame_botoes,
                              text="🗑️ Limpar",
                              bg='#666666',
                              fg='#FFFFFF',
                              font=('Arial', 12, 'bold'),
                              command=self.limpar_formulario_plano,
                              relief='flat',
                              padx=20,
                              pady=10)
        btn_limpar.pack(side='left')
        
        # Configurar scroll
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
    
    def criar_lista_planos(self, parent):
        """Cria a lista (TreeView) de planos."""
        # Colunas da lista
        colunas = ('ID', 'Nome', 'Valor', 'Duração', 'Status', 'Criação')
        
        self.tree_planos = ttk.Treeview(parent,
                                       columns=colunas,
                                       show='headings',
                                       height=15)
        
        # Configurar cabeçalhos
        self.tree_planos.heading('ID', text='ID')
        self.tree_planos.heading('Nome', text='Nome')
        self.tree_planos.heading('Valor', text='Valor')
        self.tree_planos.heading('Duração', text='Duração')
        self.tree_planos.heading('Status', text='Status')
        self.tree_planos.heading('Criação', text='Data Criação')
        
        # Configurar larguras das colunas
        self.tree_planos.column('ID', width=50, anchor='center')
        self.tree_planos.column('Nome', width=250, anchor='w')
        self.tree_planos.column('Valor', width=100, anchor='center')
        self.tree_planos.column('Duração', width=120, anchor='center')  # Corrigido: text -> width
        self.tree_planos.column('Status', width=80, anchor='center')
        self.tree_planos.column('Criação', width=100, anchor='center')
        
        # Scrollbars
        scrollbar_v = ttk.Scrollbar(parent,
                                   orient='vertical',
                                   command=self.tree_planos.yview)
        scrollbar_h = ttk.Scrollbar(parent,
                                   orient='horizontal',
                                   command=self.tree_planos.xview)
        
        self.tree_planos.configure(yscrollcommand=scrollbar_v.set,
                                  xscrollcommand=scrollbar_h.set)
        
        # Posicionar elementos
        self.tree_planos.pack(side='left', fill='both', expand=True)
        scrollbar_v.pack(side='right', fill='y')
        scrollbar_h.pack(side='bottom', fill='x')
        
        # Bind para seleção
        self.tree_planos.bind('<<TreeviewSelect>>', self.on_plano_selecionado)
        self.tree_planos.bind('<Double-1>', self.visualizar_detalhes_plano)
    
    def carregar_lista_planos(self):
        """Carrega a lista de planos na TreeView."""
        # Limpar lista atual
        for item in self.tree_planos.get_children():
            self.tree_planos.delete(item)
        
        # Buscar planos
        mostrar_inativos = not self.var_mostrar_inativos.get()
        planos = plano_dao.listar_todos_planos(apenas_ativos=mostrar_inativos)
        
        # Adicionar planos à lista
        for plano in planos:
            status = "Ativo" if plano.ativo else "Inativo"
            data_criacao = plano.data_criacao.strftime("%d/%m/%Y")
            duracao_texto = f"{plano.duracao_dias} dias ({plano.duracao_meses} meses)"
            
            self.tree_planos.insert('', 'end', values=(
                plano.id,
                plano.nome,
                plano.valor_formatado,
                duracao_texto,
                status,
                data_criacao
            ))
    
    def buscar_planos(self, event=None):
        """Busca planos conforme o texto digitado."""
        termo_busca = self.entry_busca.get().strip()
        
        if not termo_busca:
            self.carregar_lista_planos()
            return
        
        # Limpar lista atual
        for item in self.tree_planos.get_children():
            self.tree_planos.delete(item)
        
        # Buscar planos
        planos = plano_dao.buscar_planos_por_nome(termo_busca)
        
        # Adicionar resultados à lista
        for plano in planos:
            if not self.var_mostrar_inativos.get() and not plano.ativo:
                continue
                
            status = "Ativo" if plano.ativo else "Inativo"
            data_criacao = plano.data_criacao.strftime("%d/%m/%Y")
            duracao_texto = f"{plano.duracao_dias} dias ({plano.duracao_meses} meses)"
            
            self.tree_planos.insert('', 'end', values=(
                plano.id,
                plano.nome,
                plano.valor_formatado,
                duracao_texto,
                status,
                data_criacao
            ))
    
    def on_plano_selecionado(self, event):
        """Callback quando um plano é selecionado na lista."""
        selection = self.tree_planos.selection()
        if selection:
            item = self.tree_planos.item(selection[0])
            plano_id = item['values'][0]
            self.plano_selecionado = plano_dao.buscar_plano_por_id(plano_id)
            
            # Habilitar botões
            self.btn_editar.config(state='normal')
            if self.plano_selecionado and self.plano_selecionado.ativo:
                self.btn_desativar.config(state='normal', text="🚫 Desativar")
            else:
                self.btn_desativar.config(state='normal', text="✅ Reativar")
        else:
            self.plano_selecionado = None
            self.btn_editar.config(state='disabled')
            self.btn_desativar.config(state='disabled')
    
    def abrir_novo_plano(self):
        """Muda para a aba de novo plano."""
        self.notebook.select(1)
        self.campos_plano['nome'].focus()
    
    def salvar_novo_plano(self):
        """Salva um novo plano."""
        try:
            # Validar campos obrigatórios
            nome = self.campos_plano['nome'].get().strip()
            if not nome:
                messagebox.showerror("Erro", "O nome do plano é obrigatório!")
                return
            
            valor_str = self.campos_plano['valor'].get().strip().replace(',', '.')
            if not valor_str:
                messagebox.showerror("Erro", "Informe o valor do plano!")
                return
            
            try:
                valor = float(valor_str)
                if valor <= 0:
                    raise ValueError("Valor deve ser maior que zero")
            except ValueError:
                messagebox.showerror("Erro", "Valor inválido!")
                return
            
            duracao_str = self.campos_plano['duracao_dias'].get().strip()
            if not duracao_str:
                messagebox.showerror("Erro", "Informe a duração do plano!")
                return
            
            try:
                duracao_dias = int(duracao_str)
                if duracao_dias <= 0:
                    raise ValueError("Duração deve ser maior que zero")
            except ValueError:
                messagebox.showerror("Erro", "Duração inválida!")
                return
            
            # Criar plano
            novo_plano = Plano(
                nome=nome,
                valor=valor,
                duracao_dias=duracao_dias,
                descricao=self.campos_plano['descricao'].get('1.0', 'end-1c').strip()
            )
            
            # Salvar no banco
            plano_id = plano_dao.criar_plano(novo_plano)
            if plano_id:
                messagebox.showinfo("Sucesso", f"Plano criado com sucesso! ID: {plano_id}")
                self.limpar_formulario_plano()
                self.carregar_lista_planos()
                # Voltar para a aba de planos
                self.notebook.select(0)
            else:
                messagebox.showerror("Erro", "Erro ao criar plano!")
                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro inesperado: {str(e)}")
    
    def limpar_formulario_plano(self):
        """Limpa o formulário de novo plano."""
        self.campos_plano['nome'].delete(0, 'end')
        self.campos_plano['valor'].delete(0, 'end')
        self.campos_plano['duracao_dias'].delete(0, 'end')
        self.campos_plano['descricao'].delete('1.0', 'end')
    
    def editar_plano_selecionado(self):
        """Abre a janela de edição do plano selecionado."""
        if not self.plano_selecionado:
            return
        
        self.abrir_formulario_plano(self.plano_selecionado)
    
    def abrir_formulario_plano(self, plano=None):
        """
        Abre o formulário de edição de plano.
        
        Args:
            plano: Plano a ser editado
        """
        # Criar janela modal
        janela = tk.Toplevel(self.parent_frame)
        janela.title(f"Editar Plano - {plano.nome}")
        janela.geometry("500x400")
        janela.configure(bg='#FFFFFF')
        janela.transient(self.parent_frame)
        janela.grab_set()
        
        # Centralizar janela
        janela.update_idletasks()
        x = (janela.winfo_screenwidth() // 2) - (500 // 2)
        y = (janela.winfo_screenheight() // 2) - (400 // 2)
        janela.geometry(f"500x400+{x}+{y}")
        
        # Título
        titulo = tk.Label(janela,
                         text="Editar Plano",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 16, 'bold'))
        titulo.pack(pady=(20, 30))
        
        # Campos do formulário
        campos = {}
        
        # Nome
        frame_nome = tk.Frame(janela, bg='#FFFFFF')
        frame_nome.pack(fill='x', padx=20, pady=10)
        tk.Label(frame_nome, text="Nome do Plano *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        campos['nome'] = tk.Entry(frame_nome, font=('Arial', 10), width=50)
        campos['nome'].pack(fill='x', pady=(5, 0))
        campos['nome'].insert(0, plano.nome)
        
        # Valor
        frame_valor = tk.Frame(janela, bg='#FFFFFF')
        frame_valor.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_valor, text="Valor (R$) *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        campos['valor'] = tk.Entry(frame_valor, font=('Arial', 10), width=20)
        campos['valor'].pack(anchor='w', pady=(5, 0))
        campos['valor'].insert(0, str(plano.valor).replace('.', ','))
        
        # Duração
        frame_duracao = tk.Frame(janela, bg='#FFFFFF')
        frame_duracao.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_duracao, text="Duração (dias) *:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        campos['duracao_dias'] = tk.Entry(frame_duracao, font=('Arial', 10), width=10)
        campos['duracao_dias'].pack(anchor='w', pady=(5, 0))
        campos['duracao_dias'].insert(0, str(plano.duracao_dias))
        
        # Descrição
        frame_desc = tk.Frame(janela, bg='#FFFFFF')
        frame_desc.pack(fill='x', padx=20, pady=5)
        tk.Label(frame_desc, text="Descrição:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
        campos['descricao'] = tk.Text(frame_desc, font=('Arial', 10), width=50, height=4)
        campos['descricao'].pack(fill='x', pady=(5, 0))
        campos['descricao'].insert('1.0', plano.descricao)
        
        # Botões
        frame_botoes = tk.Frame(janela, bg='#FFFFFF')
        frame_botoes.pack(fill='x', padx=20, pady=30)
        
        btn_salvar = tk.Button(frame_botoes,
                              text="💾 Salvar",
                              bg='#FFA500',
                              fg='#000000',
                              font=('Arial', 12, 'bold'),
                              command=lambda: self.salvar_edicao_plano(janela, campos, plano),
                              relief='flat',
                              padx=20,
                              pady=10)
        btn_salvar.pack(side='left', padx=(0, 10))
        
        btn_cancelar = tk.Button(frame_botoes,
                                text="❌ Cancelar",
                                bg='#666666',
                                fg='#FFFFFF',
                                font=('Arial', 12, 'bold'),
                                command=janela.destroy,
                                relief='flat',
                                padx=20,
                                pady=10)
        btn_cancelar.pack(side='left')
        
        # Focar no campo nome
        campos['nome'].focus()
    
    def salvar_edicao_plano(self, janela, campos, plano):
        """
        Salva as alterações do plano.
        
        Args:
            janela: Janela do formulário
            campos: Dicionário com os campos do formulário
            plano: Plano sendo editado
        """
        try:
            # Validar campos
            nome = campos['nome'].get().strip()
            if not nome:
                messagebox.showerror("Erro", "O nome do plano é obrigatório!")
                return
            
            valor_str = campos['valor'].get().strip().replace(',', '.')
            try:
                valor = float(valor_str)
                if valor <= 0:
                    raise ValueError("Valor deve ser maior que zero")
            except ValueError:
                messagebox.showerror("Erro", "Valor inválido!")
                return
            
            duracao_str = campos['duracao_dias'].get().strip()
            try:
                duracao_dias = int(duracao_str)
                if duracao_dias <= 0:
                    raise ValueError("Duração deve ser maior que zero")
            except ValueError:
                messagebox.showerror("Erro", "Duração inválida!")
                return
            
            # Atualizar plano
            plano.nome = nome
            plano.valor = valor
            plano.duracao_dias = duracao_dias
            plano.descricao = campos['descricao'].get('1.0', 'end-1c').strip()
            
            if plano_dao.atualizar_plano(plano):
                messagebox.showinfo("Sucesso", "Plano atualizado com sucesso!")
                janela.destroy()
                self.carregar_lista_planos()
            else:
                messagebox.showerror("Erro", "Erro ao atualizar plano!")
                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro inesperado: {str(e)}")
    
    def desativar_plano_selecionado(self):
        """Desativa ou reativa o plano selecionado."""
        if not self.plano_selecionado:
            return
        
        if self.plano_selecionado.ativo:
            # Desativar
            resposta = messagebox.askyesno("Confirmar", 
                                         f"Deseja desativar o plano '{self.plano_selecionado.nome}'?")
            if resposta:
                if plano_dao.desativar_plano(self.plano_selecionado.id):
                    messagebox.showinfo("Sucesso", "Plano desativado com sucesso!")
                    self.carregar_lista_planos()
                else:
                    messagebox.showerror("Erro", "Erro ao desativar plano!")
        else:
            # Reativar
            resposta = messagebox.askyesno("Confirmar", 
                                         f"Deseja reativar o plano '{self.plano_selecionado.nome}'?")
            if resposta:
                if plano_dao.reativar_plano(self.plano_selecionado.id):
                    messagebox.showinfo("Sucesso", "Plano reativado com sucesso!")
                    self.carregar_lista_planos()
                else:
                    messagebox.showerror("Erro", "Erro ao reativar plano!")
    
    def visualizar_detalhes_plano(self, event):
        """Visualiza os detalhes completos do plano selecionado."""
        if not self.plano_selecionado:
            return
        
        # Criar janela de detalhes
        janela = tk.Toplevel(self.parent_frame)
        janela.title(f"Detalhes do Plano - {self.plano_selecionado.nome}")
        janela.geometry("400x300")
        janela.configure(bg='#FFFFFF')
        janela.transient(self.parent_frame)
        
        # Centralizar janela
        janela.update_idletasks()
        x = (janela.winfo_screenwidth() // 2) - (400 // 2)
        y = (janela.winfo_screenheight() // 2) - (300 // 2)
        janela.geometry(f"400x300+{x}+{y}")
        
        # Título
        titulo = tk.Label(janela,
                         text="Detalhes do Plano",
                         bg='#FFFFFF',
                         fg='#FFA500',
                         font=('Arial', 16, 'bold'))
        titulo.pack(pady=(20, 30))
        
        # Informações do plano
        plano = self.plano_selecionado
        
        def criar_campo_info(label, valor):
            frame = tk.Frame(janela, bg='#FFFFFF')
            frame.pack(fill='x', padx=20, pady=5)
            tk.Label(frame, text=f"{label}:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
            tk.Label(frame, text=str(valor), bg='#FFFFFF', fg='#666666', font=('Arial', 10)).pack(anchor='w', padx=(20, 0))
        
        criar_campo_info("ID", plano.id)
        criar_campo_info("Nome", plano.nome)
        criar_campo_info("Valor", plano.valor_formatado)
        criar_campo_info("Duração", f"{plano.duracao_dias} dias ({plano.duracao_meses} meses)")
        criar_campo_info("Status", "Ativo" if plano.ativo else "Inativo")
        criar_campo_info("Data de Criação", plano.data_criacao.strftime("%d/%m/%Y às %H:%M"))
        
        if plano.descricao:
            frame_desc = tk.Frame(janela, bg='#FFFFFF')
            frame_desc.pack(fill='x', padx=20, pady=5)
            tk.Label(frame_desc, text="Descrição:", bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
            text_desc = tk.Text(frame_desc, font=('Arial', 10), height=3, wrap='word', state='disabled')
            text_desc.pack(fill='x', pady=(5, 0))
            text_desc.config(state='normal')
            text_desc.insert('1.0', plano.descricao)
            text_desc.config(state='disabled')
        
        # Botão fechar
        btn_fechar = tk.Button(janela,
                              text="Fechar",
                              bg='#666666',
                              fg='#FFFFFF',
                              font=('Arial', 12, 'bold'),
                              command=janela.destroy,
                              relief='flat',
                              padx=20,
                              pady=10)
        btn_fechar.pack(pady=20)