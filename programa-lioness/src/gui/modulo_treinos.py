#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Módulo de Treinos

Este módulo contém a interface gráfica para gestão de treinos,
incluindo criação, edição, atribuição e impressão de treinos aos alunos.
"""

import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
import sys
import os
import json
import subprocess

# Adicionar o diretório pai ao path para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.treino import Treino
from data.treino_dao import treino_dao
from data.database import db_manager
from data.aluno_dao import aluno_dao
from financial.impressao import Impressao

class ModuloTreinos:
    """
    Classe responsável pela interface de gestão de treinos.
    
    Contém todas as funcionalidades para criar, editar, gerenciar
    e imprimir os treinos oferecidos pelo estúdio.
    """
    
    # Lista de exercícios predefinidos
    EXERCICIOS_PREDEFINIDOS = [
        {
            "categoria": "Cross Training",
            "subcategoria": "Levantamento e Força",
            "exercicios": [
                {"nome": "Levantamento Terra (Deadlift)", "grupo_muscular": "Costas/Pernas", "series": 3, "repeticoes": "8-12", "carga": "Variável", "descanso": "90s", "observacoes": "Manter coluna neutra"},
                {"nome": "Agachamento Frontal", "grupo_muscular": "Pernas", "series": 3, "repeticoes": "8-12", "carga": "Variável", "descanso": "90s", "observacoes": "Manter cotovelos elevados"},
                {"nome": "Agachamento Overhead", "grupo_muscular": "Pernas/Ombros", "series": 3, "repeticoes": "8-12", "carga": "Leve", "descanso": "90s", "observacoes": "Braços esticados"},
                {"nome": "Peso Morto Romeno", "grupo_muscular": "Posterior da Coxa", "series": 3, "repeticoes": "10-12", "carga": "Variável", "descanso": "90s", "observacoes": "Manter pernas levemente flexionadas"},
                {"nome": "Carga e Transporte (Farmer Walk)", "grupo_muscular": "Corpo Todo", "series": 3, "repeticoes": "30s", "carga": "Pesada", "descanso": "60s", "observacoes": "Manter postura ereta"},
                {"nome": "High Pull", "grupo_muscular": "Costas/Ombros", "series": 3, "repeticoes": "8-12", "carga": "Moderada", "descanso": "90s", "observacoes": "Movimento explosivo"}
            ]
        },
        {
            "categoria": "Cross Training",
            "subcategoria": "Pliometria / Potência",
            "exercicios": [
                {"nome": "Box Jump (Salto na Caixa)", "grupo_muscular": "Pernas", "series": 3, "repeticoes": "10-15", "carga": "Peso corporal", "descanso": "60s", "observacoes": "Aterrissagem suave"},
                {"nome": "Burpee com Salto", "grupo_muscular": "Corpo Todo", "series": 3, "repeticoes": "10-12", "carga": "Peso corporal", "descanso": "60s", "observacoes": "Máxima intensidade"},
                {"nome": "Salto com Joelhos ao Peito", "grupo_muscular": "Pernas", "series": 3, "repeticoes": "12-15", "carga": "Peso corporal", "descanso": "60s", "observacoes": "Elevação máxima"},
                {"nome": "Lançamento de Medicine Ball", "grupo_muscular": "Corpo Todo", "series": 3, "repeticoes": "10-12", "carga": "6-10kg", "descanso": "60s", "observacoes": "Movimento explosivo"}
            ]
        },
        {
            "categoria": "Cross Training",
            "subcategoria": "Cardio / Condicionamento",
            "exercicios": [
                {"nome": "Corrida Intervalada", "grupo_muscular": "Cardio", "series": 4, "repeticoes": "30s", "carga": "Peso corporal", "descanso": "30s", "observacoes": "Alta intensidade"},
                {"nome": "Remada no Remo Ergômetro", "grupo_muscular": "Corpo Todo", "series": 3, "repeticoes": "500m", "carga": "Moderada", "descanso": "90s", "observacoes": "Ritmo constante"},
                {"nome": "Air Bike (Bicicleta de Ar)", "grupo_muscular": "Cardio", "series": 3, "repeticoes": "1min", "carga": "Moderada", "descanso": "60s", "observacoes": "Manter ritmo"},
                {"nome": "Sprints Curtos", "grupo_muscular": "Pernas/Cardio", "series": 4, "repeticoes": "20s", "carga": "Peso corporal", "descanso": "40s", "observacoes": "Máxima velocidade"}
            ]
        },
        {
            "categoria": "Cross Training",
            "subcategoria": "Movimentos Combinados",
            "exercicios": [
                {"nome": "Thruster", "grupo_muscular": "Corpo Todo", "series": 3, "repeticoes": "8-12", "carga": "Moderada", "descanso": "90s", "observacoes": "Movimento fluido"},
                {"nome": "Devil’s Press", "grupo_muscular": "Corpo Todo", "series": 3, "repeticoes": "8-12", "carga": "Leve", "descanso": "90s", "observacoes": "Controle nos halteres"},
                {"nome": "Clean & Press com Kettlebell", "grupo_muscular": "Corpo Todo", "series": 3, "repeticoes": "8-12", "carga": "Moderada", "descanso": "90s", "observacoes": "Movimento explosivo"},
                {"nome": "Turkish Get Up", "grupo_muscular": "Corpo Todo", "series": 3, "repeticoes": "5 por lado", "carga": "Leve", "descanso": "60s", "observacoes": "Movimento controlado"}
            ]
        },
        {
            "categoria": "Cross Training",
            "subcategoria": "Core",
            "exercicios": [
                {"nome": "Prancha Frontal", "grupo_muscular": "Core", "series": 3, "repeticoes": "30-60s", "carga": "Peso corporal", "descanso": "30s", "observacoes": "Manter corpo alinhado"},
                {"nome": "Prancha Lateral", "grupo_muscular": "Core", "series": 3, "repeticoes": "30s por lado", "carga": "Peso corporal", "descanso": "30s", "observacoes": "Manter alinhamento"},
                {"nome": "Abmat Sit-up", "grupo_muscular": "Abdômen", "series": 3, "repeticoes": "15-20", "carga": "Peso corporal", "descanso": "45s", "observacoes": "Movimento completo"},
                {"nome": "Hollow Hold", "grupo_muscular": "Core", "series": 3, "repeticoes": "30s", "carga": "Peso corporal", "descanso": "30s", "observacoes": "Manter posição"},
                {"nome": "Russian Twist", "grupo_muscular": "Abdômen", "series": 3, "repeticoes": "20 por lado", "carga": "Leve", "descanso": "45s", "observacoes": "Rotação controlada"}
            ]
        },
        {
            "categoria": "Musculação",
            "subcategoria": "Peito",
            "exercicios": [
                {"nome": "Supino Reto com Barra", "grupo_muscular": "Peito", "series": 3, "repeticoes": "8-12", "carga": "Variável", "descanso": "90s", "observacoes": "Controlar a descida"},
                {"nome": "Supino Inclinado com Halteres", "grupo_muscular": "Peito", "series": 3, "repeticoes": "8-12", "carga": "Moderada", "descanso": "90s", "observacoes": "Manter cotovelos alinhados"},
                {"nome": "Crucifixo com Halteres", "grupo_muscular": "Peito", "series": 3, "repeticoes": "10-12", "carga": "Leve", "descanso": "60s", "observacoes": "Movimento controlado"},
                {"nome": "Peck Deck", "grupo_muscular": "Peito", "series": 3, "repeticoes": "10-12", "carga": "Moderada", "descanso": "60s", "observacoes": "Evitar hiperextensão"}
            ]
        },
        {
            "categoria": "Musculação",
            "subcategoria": "Costas",
            "exercicios": [
                {"nome": "Puxada Frontal na Polia", "grupo_muscular": "Costas", "series": 3, "repeticoes": "8-12", "carga": "Variável", "descanso": "90s", "observacoes": "Manter tronco estável"},
                {"nome": "Remada Curvada com Barra", "grupo_muscular": "Costas", "series": 3, "repeticoes": "8-12", "carga": "Moderada", "descanso": "90s", "observacoes": "Coluna neutra"},
                {"nome": "Remada Unilateral com Halter", "grupo_muscular": "Costas", "series": 3, "repeticoes": "10-12 por lado", "carga": "Moderada", "descanso": "60s", "observacoes": "Evitar rotação do tronco"}
            ]
        },
        {
            "categoria": "Musculação",
            "subcategoria": "Pernas",
            "exercicios": [
                {"nome": "Agachamento Livre", "grupo_muscular": "Pernas", "series": 3, "repeticoes": "8-12", "carga": "Variável", "descanso": "90s", "observacoes": "Joelhos alinhados com pés"},
                {"nome": "Leg Press 45°", "grupo_muscular": "Pernas", "series": 3, "repeticoes": "8-12", "carga": "Variável", "descanso": "90s", "observacoes": "Controlar a descida"},
                {"nome": "Extensora", "grupo_muscular": "Quadríceps", "series": 3, "repeticoes": "10-12", "carga": "Moderada", "descanso": "60s", "observacoes": "Movimento completo"},
                {"nome": "Flexora", "grupo_muscular": "Posterior da Coxa", "series": 3, "repeticoes": "10-12", "carga": "Moderada", "descanso": "60s", "observacoes": "Evitar impulsos"}
            ]
        },
        {
            "categoria": "Musculação",
            "subcategoria": "Braços",
            "exercicios": [
                {"nome": "Rosca Direta com Barra", "grupo_muscular": "Bíceps", "series": 3, "repeticoes": "8-12", "carga": "Moderada", "descanso": "60s", "observacoes": "Manter cotovelos fixos"},
                {"nome": "Tríceps Testa com Halteres", "grupo_muscular": "Tríceps", "series": 3, "repeticoes": "8-12", "carga": "Moderada", "descanso": "60s", "observacoes": "Controlar a descida"},
                {"nome": "Rosca Martelo", "grupo_muscular": "Bíceps", "series": 3, "repeticoes": "10-12", "carga": "Leve", "descanso": "60s", "observacoes": "Movimento controlado"}
            ]
        },
        {
            "categoria": "Musculação",
            "subcategoria": "Ombros",
            "exercicios": [
                {"nome": "Desenvolvimento com Barra", "grupo_muscular": "Ombros", "series": 3, "repeticoes": "8-12", "carga": "Moderada", "descanso": "90s", "observacoes": "Evitar arquear as costas"},
                {"nome": "Elevação Lateral", "grupo_muscular": "Ombros", "series": 3, "repeticoes": "10-12", "carga": "Leve", "descanso": "60s", "observacoes": "Subir até a linha dos ombros"},
                {"nome": "Elevação Frontal", "grupo_muscular": "Ombros", "series": 3, "repeticoes": "10-12", "carga": "Leve", "descanso": "60s", "observacoes": "Movimento controlado"}
            ]
        },
        {
            "categoria": "Musculação",
            "subcategoria": "Abdômen",
            "exercicios": [
                {"nome": "Abdominal Infra", "grupo_muscular": "Abdômen", "series": 3, "repeticoes": "15-20", "carga": "Peso corporal", "descanso": "45s", "observacoes": "Manter movimento lento"},
                {"nome": "Abdominal Oblíquo", "grupo_muscular": "Abdômen", "series": 3, "repeticoes": "15-20 por lado", "carga": "Peso corporal", "descanso": "45s", "observacoes": "Rotação controlada"},
                {"nome": "Elevação de Pernas", "grupo_muscular": "Abdômen", "series": 3, "repeticoes": "12-15", "carga": "Peso corporal", "descanso": "45s", "observacoes": "Evitar balanço"}
            ]
        },
        {
            "categoria": "CrossFit",
            "subcategoria": "Ginásticos",
            "exercicios": [
                {"nome": "Pull-up (Barra Fixa)", "grupo_muscular": "Costas/Braços", "series": 3, "repeticoes": "8-12", "carga": "Peso corporal", "descanso": "60s", "observacoes": "Movimento controlado"},
                {"nome": "Chest to Bar Pull-up", "grupo_muscular": "Costas/Braços", "series": 3, "repeticoes": "8-12", "carga": "Peso corporal", "descanso": "60s", "observacoes": "Peito na barra"}
            ]
        },
        {
            "categoria": "CrossFit",
            "subcategoria": "Metcon",
            "exercicios": [
                {"nome": "AMRAP 10min", "grupo_muscular": "Corpo Todo", "series": 1, "repeticoes": "Máximo", "carga": "Variável", "descanso": "0s", "observacoes": "Alta intensidade"},
                {"nome": "EMOM 12min", "grupo_muscular": "Corpo Todo", "series": 12, "repeticoes": "Variável", "carga": "Moderada", "descanso": "0s", "observacoes": "Manter ritmo"}
            ]
        },
        {
            "categoria": "Pilates",
            "subcategoria": "Solo",
            "exercicios": [
                {"nome": "The Hundred", "grupo_muscular": "Core", "series": 3, "repeticoes": "100 respirações", "carga": "Peso corporal", "descanso": "30s", "observacoes": "Manter respiração controlada"},
                {"nome": "Roll Up", "grupo_muscular": "Core", "series": 3, "repeticoes": "8-12", "carga": "Peso corporal", "descanso": "30s", "observacoes": "Movimento fluido"},
                {"nome": "Single Leg Stretch", "grupo_muscular": "Core", "series": 3, "repeticoes": "10 por lado", "carga": "Peso corporal", "descanso": "30s", "observacoes": "Manter coluna alinhada"}
            ]
        },
        {
            "categoria": "Pilates",
            "subcategoria": "Aparelhos",
            "exercicios": [
                {"nome": "Footwork no Reformer", "grupo_muscular": "Pernas/Core", "series": 3, "repeticoes": "10-12", "carga": "Leve", "descanso": "30s", "observacoes": "Controlar molas"},
                {"nome": "Long Stretch no Reformer", "grupo_muscular": "Core", "series": 3, "repeticoes": "8-12", "carga": "Leve", "descanso": "30s", "observacoes": "Manter prancha estável"},
                {"nome": "Chest Expansion no Cadillac", "grupo_muscular": "Peito/Costas", "series": 3, "repeticoes": "10-12", "carga": "Leve", "descanso": "30s", "observacoes": "Respiração controlada"}
            ]
        }
    ]

    def __init__(self, parent_frame):
        """
        Inicializa o módulo de treinos.
        
        Args:
            parent_frame: Frame pai onde será inserida a interface
        """
        self.parent_frame = parent_frame
        self.treino_selecionado = None
        self.criar_interface()
    
    def criar_interface(self):
        """Cria a interface principal do módulo de treinos."""
        # Limpar o frame pai
        for widget in self.parent_frame.winfo_children():
            widget.destroy()
        
        # Frame principal
        self.main_frame = tk.Frame(self.parent_frame, bg='#FFFFFF')
        self.main_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Título do módulo
        tk.Label(self.main_frame,
                text="Gestão de Treinos",
                bg='#FFFFFF',
                fg='#FFA500',
                font=('Arial', 18, 'bold')).pack(pady=(0, 20))
        
        # Frame para botões de ação
        self.frame_acoes = tk.Frame(self.main_frame, bg='#FFFFFF')
        self.frame_acoes.pack(fill='x', pady=(0, 20))
        
        # Botões de ação
        tk.Button(self.frame_acoes,
                 text="➕ Novo Treino",
                 bg='#FFA500',
                 fg='#000000',
                 font=('Arial', 10, 'bold'),
                 command=self.abrir_cadastro_treino,
                 relief='flat',
                 padx=15,
                 pady=8).pack(side='left', padx=(0, 10))
        
        self.btn_editar = tk.Button(self.frame_acoes,
                                   text="✏️ Editar",
                                   bg='#333333',
                                   fg='#FFFFFF',
                                   font=('Arial', 10, 'bold'),
                                   command=self.editar_treino_selecionado,
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
                                      command=self.desativar_treino_selecionado,
                                      relief='flat',
                                      padx=15,
                                      pady=8,
                                      state='disabled')
        self.btn_desativar.pack(side='left', padx=(0, 10))
        
        tk.Button(self.frame_acoes,
                 text="🔄 Atualizar Lista",
                 bg='#4ECDC4',
                 fg='#000000',
                 font=('Arial', 10, 'bold'),
                 command=self.carregar_lista_treinos,
                 relief='flat',
                 padx=15,
                 pady=8).pack(side='right')
        
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
        self.entry_busca.bind('<KeyRelease>', self.buscar_treinos)
        
        self.var_mostrar_inativos = tk.BooleanVar()
        tk.Checkbutton(self.frame_busca,
                      text="Mostrar inativos",
                      variable=self.var_mostrar_inativos,
                      bg='#FFFFFF',
                      fg='#333333',
                      font=('Arial', 10),
                      command=self.carregar_lista_treinos).pack(side='left', padx=(20, 0))
        
        # Frame para a lista de treinos
        self.frame_lista = tk.Frame(self.main_frame, bg='#FFFFFF')
        self.frame_lista.pack(fill='both', expand=True)
        
        # Criar a treeview para lista de treinos
        self.criar_lista_treinos()
        
        # Carregar a lista inicial
        self.carregar_lista_treinos()
    
    def criar_lista_treinos(self):
        """Cria a lista (TreeView) de treinos."""
        colunas = ('ID', 'Nome', 'Objetivo', 'Nível', 'Duração', 'Status')
        
        self.tree_treinos = ttk.Treeview(self.frame_lista,
                                        columns=colunas,
                                        show='headings',
                                        height=15)
        
        self.tree_treinos.heading('ID', text='ID')
        self.tree_treinos.heading('Nome', text='Nome')
        self.tree_treinos.heading('Objetivo', text='Objetivo')
        self.tree_treinos.heading('Nível', text='Nível')
        self.tree_treinos.heading('Duração', text='Duração')
        self.tree_treinos.heading('Status', text='Status')
        
        self.tree_treinos.column('ID', width=50, anchor='center')
        self.tree_treinos.column('Nome', width=200)
        self.tree_treinos.column('Objetivo', width=150)
        self.tree_treinos.column('Nível', width=100)
        self.tree_treinos.column('Duração', width=80)
        self.tree_treinos.column('Status', width=80)
        
        self.tree_treinos.pack(fill='both', expand=True)
        
        self.tree_treinos.bind('<<TreeviewSelect>>', self.selecionar_treino)
        self.tree_treinos.bind('<Double-1>', self.visualizar_treino)
        
        # Botão para atribuir treino
        self.btn_atribuir = tk.Button(self.frame_lista,
                                     text="Atribuir Treino",
                                     bg='#2ECC71',
                                     fg='#FFFFFF',
                                     font=('Arial', 10, 'bold'),
                                     command=self.atribuir_treino_a_aluno,
                                     relief='flat',
                                     padx=15,
                                     pady=8,
                                     state='disabled')
        self.btn_atribuir.pack(pady=10)
    
    def carregar_lista_treinos(self):
        """Carrega a lista de treinos na TreeView."""
        for item in self.tree_treinos.get_children():
            self.tree_treinos.delete(item)
        
        treinos = treino_dao.listar_todos_treinos(apenas_ativos=not self.var_mostrar_inativos.get())
        for treino in treinos:
            self.tree_treinos.insert('', 'end', values=(
                treino.id,
                treino.nome,
                treino.objetivo or '-',
                treino.nivel,
                treino.duracao_formatada,
                'Ativo' if treino.ativo else 'Inativo'
            ))
    
    def buscar_treinos(self, event=None):
        """Busca treinos com base no texto inserido."""
        termo = self.entry_busca.get().strip()
        for item in self.tree_treinos.get_children():
            self.tree_treinos.delete(item)
        
        treinos = treino_dao.buscar_treinos_por_nome(termo, apenas_ativos=not self.var_mostrar_inativos.get())
        for treino in treinos:
            self.tree_treinos.insert('', 'end', values=(
                treino.id,
                treino.nome,
                treino.objetivo or '-',
                treino.nivel,
                treino.duracao_formatada,
                'Ativo' if treino.ativo else 'Inativo'
            ))
    
    def selecionar_treino(self, event=None):
        """Seleciona um treino da lista."""
        selecionados = self.tree_treinos.selection()
        if selecionados:
            item = self.tree_treinos.item(selecionados[0])
            treino_id = item['values'][0]
            self.treino_selecionado = treino_dao.buscar_treino_por_id(treino_id)
            self.btn_editar['state'] = 'normal'
            self.btn_desativar['state'] = 'normal'
            self.btn_atribuir['state'] = 'normal'
            self.btn_desativar['text'] = "🚫 Desativar" if self.treino_selecionado.ativo else "✅ Reativar"
        else:
            self.treino_selecionado = None
            self.btn_editar['state'] = 'disabled'
            self.btn_desativar['state'] = 'disabled'
            self.btn_atribuir['state'] = 'disabled'
    
    def abrir_cadastro_treino(self, treino=None):
        """Abre a janela de cadastro/edição de treino."""
        janela = tk.Toplevel(self.parent_frame)
        janela.title("Novo Treino" if not treino else f"Editar Treino - {treino.nome}")
        janela.geometry("600x700")
        janela.configure(bg='#FFFFFF')
        janela.transient(self.parent_frame)
        
        x = (janela.winfo_screenwidth() - 600) // 2
        y = (janela.winfo_screenheight() - 700) // 2
        janela.geometry(f"600x700+{x}+{y}")
        
        canvas = tk.Canvas(janela, bg='#FFFFFF')
        scrollbar = ttk.Scrollbar(janela, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#FFFFFF')
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        tk.Label(scrollable_frame,
                text="Novo Treino" if not treino else "Editar Treino",
                bg='#FFFFFF',
                fg='#FFA500',
                font=('Arial', 16, 'bold')).pack(pady=(20, 20))
        
        frame_form = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_form.pack(fill='x', padx=20)
        
        def criar_campo(label, default_value="", tipo="entry"):
            frame = tk.Frame(frame_form, bg='#FFFFFF')
            frame.pack(fill='x', pady=5)
            tk.Label(frame, text=label, bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
            if tipo == "entry":
                entry = tk.Entry(frame, font=('Arial', 10), width=50)
                entry.pack(fill='x', pady=(5, 0))
                entry.insert(0, default_value)
                return entry
            elif tipo == "text":
                text = tk.Text(frame, font=('Arial', 10), height=4, wrap='word')
                text.pack(fill='x', pady=(5, 0))
                text.insert('1.0', default_value)
                return text
            elif tipo == "combobox":
                combo = ttk.Combobox(frame, values=["Iniciante", "Intermediário", "Avançado"], state='readonly', font=('Arial', 10))
                combo.pack(fill='x', pady=(5, 0))
                combo.set(default_value or "Iniciante")
                return combo
        
        entry_nome = criar_campo("Nome do Treino", treino.nome if treino else "")
        entry_objetivo = criar_campo("Objetivo", treino.objetivo if treino else "")
        combo_nivel = criar_campo("Nível", treino.nivel if treino else "Iniciante", tipo="combobox")
        entry_duracao = criar_campo("Duração (minutos)", str(treino.duracao_minutos) if treino else "60")
        entry_descricao = criar_campo("Descrição", treino.descricao if treino else "", tipo="text")
        
        frame_exercicios = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_exercicios.pack(fill='both', padx=20, pady=10)
        
        tk.Label(frame_exercicios,
                text="Exercícios",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 12, 'bold')).pack(anchor='w')
        
        tree_exercicios = ttk.Treeview(frame_exercicios,
                                      columns=('Nome', 'Grupo', 'Series', 'Reps', 'Carga', 'Descanso', 'Obs'),
                                      show='headings',
                                      height=5)
        tree_exercicios.heading('Nome', text='Exercício')
        tree_exercicios.heading('Grupo', text='Grupo Muscular')
        tree_exercicios.heading('Series', text='Séries')
        tree_exercicios.heading('Reps', text='Repetições')
        tree_exercicios.heading('Carga', text='Carga')
        tree_exercicios.heading('Descanso', text='Descanso')
        tree_exercicios.heading('Obs', text='Observações')
        
        tree_exercicios.column('Nome', width=150)
        tree_exercicios.column('Grupo', width=100)
        tree_exercicios.column('Series', width=60)
        tree_exercicios.column('Reps', width=80)
        tree_exercicios.column('Carga', width=80)
        tree_exercicios.column('Descanso', width=80)
        tree_exercicios.column('Obs', width=150)
        
        exercicios = treino.exercicios if treino else []
        for ex in exercicios:
            tree_exercicios.insert('', 'end', values=(
                ex['nome'],
                ex['grupo_muscular'],
                ex['series'],
                ex['repeticoes'],
                ex['carga'],
                ex['descanso'],
                ex['observacoes']
            ))
        
        tree_exercicios.pack(fill='both', expand=True)
        
        frame_botoes_ex = tk.Frame(frame_exercicios, bg='#FFFFFF')
        frame_botoes_ex.pack(fill='x', pady=5)
        
        def adicionar_exercicio():
            janela_ex = tk.Toplevel(janela)
            janela_ex.title("Adicionar Exercício")
            janela_ex.geometry("400x500")
            janela_ex.configure(bg='#FFFFFF')
            janela_ex.transient(janela)
            
            x = (janela_ex.winfo_screenwidth() - 400) // 2
            y = (janela_ex.winfo_screenheight() - 500) // 2
            janela_ex.geometry(f"400x500+{x}+{y}")
            
            # Criar um canvas com rolagem
            canvas = tk.Canvas(janela_ex, bg='#FFFFFF')
            scrollbar = ttk.Scrollbar(janela_ex, orient="vertical", command=canvas.yview)
            scrollable_frame = tk.Frame(canvas, bg='#FFFFFF')
            
            scrollable_frame.bind(
                "<Configure>",
                lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
            )
            
            canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
            canvas.configure(yscrollcommand=scrollbar.set)
            canvas.pack(side="left", fill="both", expand=True)
            scrollbar.pack(side="right", fill="y")
            
            frame_ex_form = tk.Frame(scrollable_frame, bg='#FFFFFF')
            frame_ex_form.pack(fill='x', padx=20, pady=10)
            
            def criar_campo_ex(label, default_value="", tipo="entry"):
                frame = tk.Frame(frame_ex_form, bg='#FFFFFF')
                frame.pack(fill='x', pady=2)
                tk.Label(frame, text=label, bg='#FFFFFF', fg='#333333', font=('Arial', 10, 'bold')).pack(anchor='w')
                if tipo == "entry":
                    entry = tk.Entry(frame, font=('Arial', 10), width=40)
                    entry.pack(fill='x', pady=(2, 0))
                    entry.insert(0, default_value)
                    return entry
                elif tipo == "text":
                    text = tk.Text(frame, font=('Arial', 10), height=3, wrap='word')
                    text.pack(fill='x', pady=(2, 0))
                    text.insert('1.0', default_value)
                    return text
                elif tipo == "combobox":
                    combo = ttk.Combobox(frame, state='readonly', font=('Arial', 10))
                    combo.pack(fill='x', pady=(2, 0))
                    combo.set(default_value)
                    return combo
            
            combo_categoria = criar_campo_ex("Categoria", "Cross Training", tipo="combobox")
            combo_categoria['values'] = ["Cross Training", "Musculação", "CrossFit", "Pilates"]
            
            combo_subcategoria = criar_campo_ex("Subcategoria", "", tipo="combobox")
            combo_exercicio = criar_campo_ex("Exercício", "", tipo="combobox")
            
            # Frame para botões, colocado logo após os comboboxes
            frame_botoes = tk.Frame(scrollable_frame, bg='#FFFFFF')
            frame_botoes.pack(fill='x', padx=20, pady=5)
            
            # Criar widgets de entrada antes das funções internas
            entry_grupo = criar_campo_ex("Grupo Muscular")
            entry_series = criar_campo_ex("Séries")
            entry_reps = criar_campo_ex("Repetições")
            entry_carga = criar_campo_ex("Carga")
            entry_descanso = criar_campo_ex("Descanso")
            text_observ = criar_campo_ex("Observações", tipo="text")
            
            def confirmar_adicao():
                if not combo_exercicio.get():
                    messagebox.showerror("Erro", "Nenhum exercício selecionado!")
                    return
                try:
                    tree_exercicios.insert('', 'end', values=(
                        combo_exercicio.get(),
                        entry_grupo.get(),
                        entry_series.get(),
                        entry_reps.get(),
                        entry_carga.get(),
                        entry_descanso.get(),
                        text_observ.get('1.0', tk.END).strip()
                    ))
                    messagebox.showinfo("Sucesso", "Exercício adicionado com sucesso!")
                    # Limpar campos para facilitar adição de outro exercício
                    combo_categoria.set("Cross Training")
                    combo_subcategoria.set("")
                    combo_exercicio.set("")
                    entry_grupo.delete(0, tk.END)
                    entry_series.delete(0, tk.END)
                    entry_reps.delete(0, tk.END)
                    entry_carga.delete(0, tk.END)
                    entry_descanso.delete(0, tk.END)
                    text_observ.delete('1.0', tk.END)
                    atualizar_subcategorias()
                except Exception as e:
                    messagebox.showerror("Erro", f"Falha ao adicionar exercício: {str(e)}")
            
            tk.Button(frame_botoes,
                     text="Adicionar",
                     bg='#2ECC71',
                     fg='#FFFFFF',
                     font=('Arial', 10, 'bold'),
                     command=confirmar_adicao,
                     relief='flat',
                     padx=15,
                     pady=8).pack(side='left', padx=(0, 10))
            
            tk.Button(frame_botoes,
                     text="Cancelar",
                     bg='#FF6B6B',
                     fg='#FFFFFF',
                     font=('Arial', 10, 'bold'),
                     command=janela_ex.destroy,
                     relief='flat',
                     padx=15,
                     pady=8).pack(side='left')
            
            def atualizar_subcategorias(event=None):
                categoria = combo_categoria.get()
                subcategorias = [cat["subcategoria"] for cat in self.EXERCICIOS_PREDEFINIDOS if cat["categoria"] == categoria]
                combo_subcategoria['values'] = subcategorias
                combo_subcategoria.set("")
                if subcategorias:
                    combo_subcategoria.current(0)
                    atualizar_exercicios()
                else:
                    combo_subcategoria.set("")
                    combo_exercicio.set("")
                    combo_exercicio['values'] = []
            
            def atualizar_exercicios(event=None):
                categoria = combo_categoria.get()
                subcategoria = combo_subcategoria.get()
                if subcategoria:
                    for cat in self.EXERCICIOS_PREDEFINIDOS:
                        if cat["categoria"] == categoria and cat["subcategoria"] == subcategoria:
                            combo_exercicio['values'] = [ex["nome"] for ex in cat["exercicios"]]
                            combo_exercicio.set("")
                            if cat["exercicios"]:
                                combo_exercicio.current(0)
                                preencher_detalhes_exercicio()
                            else:
                                combo_exercicio.set("")
                else:
                    combo_exercicio.set("")
                    combo_exercicio['values'] = []
            
            def preencher_detalhes_exercicio(event=None):
                categoria = combo_categoria.get()
                subcategoria = combo_subcategoria.get()
                exercicio_nome = combo_exercicio.get()
                if exercicio_nome:
                    for cat in self.EXERCICIOS_PREDEFINIDOS:
                        if cat["categoria"] == categoria and cat["subcategoria"] == subcategoria:
                            for ex in cat["exercicios"]:
                                if ex["nome"] == exercicio_nome:
                                    entry_grupo.delete(0, tk.END)
                                    entry_grupo.insert(0, ex["grupo_muscular"])
                                    entry_series.delete(0, tk.END)
                                    entry_series.insert(0, str(ex["series"]))
                                    entry_reps.delete(0, tk.END)
                                    entry_reps.insert(0, ex["repeticoes"])
                                    entry_carga.delete(0, tk.END)
                                    entry_carga.insert(0, ex["carga"])
                                    entry_descanso.delete(0, tk.END)
                                    entry_descanso.insert(0, ex["descanso"])
                                    text_observ.delete('1.0', tk.END)
                                    text_observ.insert('1.0', ex["observacoes"])
            
            combo_categoria.bind('<<ComboboxSelected>>', atualizar_subcategorias)
            combo_subcategoria.bind('<<ComboboxSelected>>', atualizar_exercicios)
            combo_exercicio.bind('<<ComboboxSelected>>', preencher_detalhes_exercicio)
            atualizar_subcategorias()
            
            # Forçar atualização da interface
            janela_ex.update_idletasks()
        
        tk.Button(frame_exercicios,
                 text="Adicionar Exercício",
                 bg='#2ECC71',
                 fg='#FFFFFF',
                 font=('Arial', 10, 'bold'),
                 command=adicionar_exercicio,
                 relief='flat',
                 padx=15,
                 pady=8).pack(pady=5)
        
        frame_botoes = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_botoes.pack(fill='x', pady=20)
        
        def salvar_treino():
            nome = entry_nome.get().strip()
            objetivo = entry_objetivo.get().strip()
            nivel = combo_nivel.get()
            duracao = entry_duracao.get().strip()
            descricao = entry_descricao.get('1.0', tk.END).strip()
            
            if not nome:
                messagebox.showwarning("Aviso", "O nome do treino é obrigatório!")
                return
            
            try:
                duracao = int(duracao)
                if duracao <= 0:
                    raise ValueError
            except ValueError:
                messagebox.showwarning("Aviso", "A duração deve ser um número positivo!")
                return
            
            exercicios = []
            for item in tree_exercicios.get_children():
                valores = tree_exercicios.item(item)['values']
                exercicios.append({
                    'nome': valores[0],
                    'grupo_muscular': valores[1],
                    'series': valores[2],
                    'repeticoes': valores[3],
                    'carga': valores[4],
                    'descanso': valores[5],
                    'observacoes': valores[6]
                })
            
            treino_novo = Treino(
                nome=nome,
                objetivo=objetivo or None,
                nivel=nivel,
                duracao_minutos=duracao,
                descricao=descricao or None,
                exercicios=exercicios
            )
            
            if treino:
                treino_novo.id = treino.id
                sucesso = treino_dao.atualizar_treino(treino_novo)
                msg = "Treino atualizado com sucesso!"
            else:
                sucesso = treino_dao.criar_treino(treino_novo)
                msg = "Treino criado com sucesso!"
            
            if sucesso:
                messagebox.showinfo("Sucesso", msg)
                self.carregar_lista_treinos()
                janela.destroy()
            else:
                messagebox.showerror("Erro", "Erro ao salvar treino!")
        
        tk.Button(frame_botoes,
                 text="Salvar",
                 bg='#2ECC71',
                 fg='#FFFFFF',
                 font=('Arial', 10, 'bold'),
                 command=salvar_treino,
                 relief='flat',
                 padx=15,
                 pady=8).pack(side='left', padx=(0, 10))
        
        tk.Button(frame_botoes,
                 text="Cancelar",
                 bg='#FF6B6B',
                 fg='#FFFFFF',
                 font=('Arial', 10, 'bold'),
                 command=janela.destroy,
                 relief='flat',
                 padx=15,
                 pady=8).pack(side='left')
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
    
    def editar_treino_selecionado(self):
        """Abre o formulário de edição para o treino selecionado."""
        if self.treino_selecionado:
            self.abrir_cadastro_treino(self.treino_selecionado)
    
    def visualizar_treino(self, event=None):
        """Visualiza os detalhes do treino selecionado."""
        if not self.treino_selecionado:
            return
        
        janela = tk.Toplevel(self.parent_frame)
        janela.title(f"Detalhes do Treino - {self.treino_selecionado.nome}")
        janela.geometry("600x700")
        janela.configure(bg='#FFFFFF')
        janela.transient(self.parent_frame)
        
        x = (janela.winfo_screenwidth() - 600) // 2
        y = (janela.winfo_screenheight() - 700) // 2
        janela.geometry(f"600x700+{x}+{y}")
        
        canvas = tk.Canvas(janela, bg='#FFFFFF')
        scrollbar = ttk.Scrollbar(janela, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#FFFFFF')
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        tk.Label(scrollable_frame,
                text=f"Treino: {self.treino_selecionado.nome}",
                bg='#FFFFFF',
                fg='#FFA500',
                font=('Arial', 16, 'bold')).pack(pady=(20, 10))
        
        tk.Label(scrollable_frame,
                text=f"Objetivo: {self.treino_selecionado.objetivo or '-'}",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10)).pack(anchor='w', padx=20)
        
        tk.Label(scrollable_frame,
                text=f"Nível: {self.treino_selecionado.nivel}",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10)).pack(anchor='w', padx=20)
        
        tk.Label(scrollable_frame,
                text=f"Duração: {self.treino_selecionado.duracao_formatada}",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10)).pack(anchor='w', padx=20)
        
        tk.Label(scrollable_frame,
                text=f"Descrição: {self.treino_selecionado.descricao or '-'}",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10)).pack(anchor='w', padx=20)
        
        tk.Label(scrollable_frame,
                text=f"Data de Criação: {self.treino_selecionado.data_criacao}",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10)).pack(anchor='w', padx=20, pady=(0, 20))
        
        tk.Label(scrollable_frame,
                text="Exercícios:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 12, 'bold')).pack(anchor='w', padx=20, pady=(10, 5))
        
        tree = ttk.Treeview(scrollable_frame,
                           columns=('Nome', 'Grupo', 'Series', 'Reps', 'Carga', 'Descanso', 'Obs'),
                           show='headings',
                           height=10)
        
        tree.heading('Nome', text='Exercício')
        tree.heading('Grupo', text='Grupo Muscular')
        tree.heading('Series', text='Séries')
        tree.heading('Reps', text='Repetições')
        tree.heading('Carga', text='Carga')
        tree.heading('Descanso', text='Descanso')
        tree.heading('Obs', text='Observações')
        
        tree.column('Nome', width=150)
        tree.column('Grupo', width=100)
        tree.column('Series', width=60)
        tree.column('Reps', width=80)
        tree.column('Carga', width=80)
        tree.column('Descanso', width=80)
        tree.column('Obs', width=150)
        
        for exercicio in self.treino_selecionado.exercicios:
            tree.insert('', 'end', values=(
                exercicio['nome'],
                exercicio['grupo_muscular'],
                exercicio['series'],
                exercicio['repeticoes'],
                exercicio['carga'],
                exercicio['descanso'],
                exercicio['observacoes']
            ))
        
        tree.pack(fill='both', expand=True, padx=20, pady=(0, 20))
        
        # Frame para botões
        frame_botoes = tk.Frame(scrollable_frame, bg='#FFFFFF')
        frame_botoes.pack(fill='x', pady=10)
        
        tk.Button(frame_botoes,
                 text="Imprimir Treino",
                 bg='#4ECDC4',
                 fg='#FFFFFF',
                 font=('Arial', 10, 'bold'),
                 command=lambda: self.abrir_selecao_aluno_impressao(self.treino_selecionado),
                 relief='flat',
                 padx=15,
                 pady=8).pack(side='left', padx=(0, 10))
        
        tk.Button(frame_botoes,
                 text="Fechar",
                 bg='#FF6B6B',
                 fg='#FFFFFF',
                 font=('Arial', 10, 'bold'),
                 command=janela.destroy,
                 relief='flat',
                 padx=15,
                 pady=8).pack(side='left')
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
    
    def desativar_treino_selecionado(self):
        """Ativa ou desativa o treino selecionado."""
        if not self.treino_selecionado:
            return
        
        acao = "desativar" if self.treino_selecionado.ativo else "reativar"
        resposta = messagebox.askyesno("Confirmar", f"Deseja {acao} o treino '{self.treino_selecionado.nome}'?")
        if resposta:
            sucesso = treino_dao.alterar_status_treino(self.treino_selecionado.id, not self.treino_selecionado.ativo)
            if sucesso:
                self.treino_selecionado.ativo = not self.treino_selecionado.ativo
                messagebox.showinfo("Sucesso", f"Treino {acao}d{'o' if acao == 'desativar' else 'o'} com sucesso!")
                self.carregar_lista_treinos()
                self.btn_desativar['text'] = "🚫 Desativar" if self.treino_selecionado.ativo else "✅ Reativar"
            else:
                messagebox.showerror("Erro", f"Erro ao {acao} treino!")
    
    def atribuir_treino_a_aluno(self):
        """Abre uma janela para atribuir o treino selecionado a um aluno."""
        if not self.treino_selecionado:
            return
        
        janela = tk.Toplevel(self.parent_frame)
        janela.title("Atribuir Treino a Aluno")
        janela.geometry("400x300")
        janela.configure(bg='#FFFFFF')
        janela.transient(self.parent_frame)
        
        x = (janela.winfo_screenwidth() - 400) // 2
        y = (janela.winfo_screenheight() - 300) // 2
        janela.geometry(f"400x300+{x}+{y}")
        
        tk.Label(janela,
                text=f"Atribuir Treino: {self.treino_selecionado.nome}",
                bg='#FFFFFF',
                fg='#FFA500',
                font=('Arial', 14, 'bold')).pack(pady=(20, 10))
        
        frame_aluno = tk.Frame(janela, bg='#FFFFFF')
        frame_aluno.pack(fill='x', padx=20, pady=10)
        tk.Label(frame_aluno,
                text="Selecione o Aluno:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).pack(anchor='w')
        
        combo_aluno = ttk.Combobox(frame_aluno,
                                  state='readonly',
                                  width=30)
        combo_aluno.pack(fill='x', pady=(5, 0))
        
        query = "SELECT id, nome FROM alunos WHERE ativo = 1 ORDER BY nome"
        resultados = db_manager.execute_query(query)
        alunos = [f"{row['id']} - {row['nome']}" for row in resultados]
        combo_aluno['values'] = alunos
        if alunos:
            combo_aluno.current(0)
        
        frame_botoes = tk.Frame(janela, bg='#FFFFFF')
        frame_botoes.pack(fill='x', pady=20)
        
        tk.Button(frame_botoes,
                 text="Atribuir",
                 bg='#2ECC71',
                 fg='#FFFFFF',
                 font=('Arial', 10, 'bold'),
                 command=lambda: self.confirmar_atribuicao_treino(janela, combo_aluno.get()),
                 relief='flat',
                 padx=15,
                 pady=8).pack(side='left', padx=(0, 10))
        
        tk.Button(frame_botoes,
                 text="Cancelar",
                 bg='#FF6B6B',
                 fg='#FFFFFF',
                 font=('Arial', 10, 'bold'),
                 command=janela.destroy,
                 relief='flat',
                 padx=15,
                 pady=8).pack(side='left')
    
    def confirmar_atribuicao_treino(self, janela, aluno_selecionado):
        """Confirma a atribuição do treino a um aluno."""
        if not aluno_selecionado:
            messagebox.showwarning("Aviso", "Selecione um aluno!")
            return
        
        aluno_id = int(aluno_selecionado.split(' - ')[0])
        sucesso = treino_dao.atribuir_treino_a_aluno(self.treino_selecionado.id, aluno_id)
        if sucesso:
            messagebox.showinfo("Sucesso", "Treino atribuído com sucesso!")
            janela.destroy()
            self.carregar_lista_treinos()
        else:
            messagebox.showerror("Erro", "Erro ao atribuir treino!")
    
    def abrir_selecao_aluno_impressao(self, treino):
        """Abre uma janela para selecionar um aluno e o formato para impressão do treino."""
        janela = tk.Toplevel(self.parent_frame)
        janela.title("Imprimir Treino")
        janela.geometry("400x400")
        janela.configure(bg='#FFFFFF')
        janela.transient(self.parent_frame)
        
        x = (janela.winfo_screenwidth() - 400) // 2
        y = (janela.winfo_screenheight() - 400) // 2
        janela.geometry(f"400x400+{x}+{y}")
        
        tk.Label(janela,
                text=f"Imprimir Treino: {treino.nome}",
                bg='#FFFFFF',
                fg='#FFA500',
                font=('Arial', 14, 'bold')).pack(pady=(20, 10))
        
        frame_aluno = tk.Frame(janela, bg='#FFFFFF')
        frame_aluno.pack(fill='x', padx=20, pady=10)
        tk.Label(frame_aluno,
                text="Selecione o Aluno:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).pack(anchor='w')
        
        combo_aluno = ttk.Combobox(frame_aluno,
                                  state='readonly',
                                  width=30)
        combo_aluno.pack(fill='x', pady=(5, 0))
        
        query = "SELECT id, nome FROM alunos WHERE ativo = 1 ORDER BY nome"
        resultados = db_manager.execute_query(query)
        alunos = [f"{row['id']} - {row['nome']}" for row in resultados]
        combo_aluno['values'] = alunos
        if alunos:
            combo_aluno.current(0)
        
        frame_formato = tk.Frame(janela, bg='#FFFFFF')
        frame_formato.pack(fill='x', padx=20, pady=10)
        tk.Label(frame_formato,
                text="Formato de Saída:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).pack(anchor='w')
        
        combo_formato = ttk.Combobox(frame_formato,
                                    values=["Texto (.txt)", "PDF (.pdf)"],
                                    state='readonly',
                                    width=30)
        combo_formato.pack(fill='x', pady=(5, 0))
        combo_formato.current(0)
        
        frame_largura = tk.Frame(janela, bg='#FFFFFF')
        frame_largura.pack(fill='x', padx=20, pady=10)
        tk.Label(frame_largura,
                text="Largura da Impressora:",
                bg='#FFFFFF',
                fg='#333333',
                font=('Arial', 10, 'bold')).pack(anchor='w')
        
        combo_largura = ttk.Combobox(frame_largura,
                                    values=["58mm", "80mm"],
                                    state='readonly',
                                    width=30)
        combo_largura.pack(fill='x', pady=(5, 0))
        combo_largura.current(1)  # Padrão: 80mm
        
        frame_botoes = tk.Frame(janela, bg='#FFFFFF')
        frame_botoes.pack(fill='x', pady=20)
        
        tk.Button(frame_botoes,
                 text="Imprimir",
                 bg='#2ECC71',
                 fg='#FFFFFF',
                 font=('Arial', 10, 'bold'),
                 command=lambda: self.imprimir_treino(treino, combo_aluno.get(), combo_formato.get(), combo_largura.get(), janela),
                 relief='flat',
                 padx=15,
                 pady=8).pack(side='left', padx=(0, 10))
        
        tk.Button(frame_botoes,
                 text="Cancelar",
                 bg='#FF6B6B',
                 fg='#FFFFFF',
                 font=('Arial', 10, 'bold'),
                 command=janela.destroy,
                 relief='flat',
                 padx=15,
                 pady=8).pack(side='left')
    
    def imprimir_treino(self, treino, aluno_selecionado, formato, largura, janela):
        """Gera o arquivo de impressão e abre para visualização."""
        if not aluno_selecionado:
            messagebox.showwarning("Aviso", "Selecione um aluno!")
            return
        
        aluno_id = int(aluno_selecionado.split(' - ')[0])
        aluno = aluno_dao.buscar_aluno_por_id(aluno_id)
        if not aluno:
            messagebox.showerror("Erro", "Aluno não encontrado!")
            return
        
        try:
            # Determinar o formato
            formato_arquivo = "pdf" if formato == "PDF (.pdf)" else "txt"
            
            # Gerar o arquivo
            caminho_arquivo = Impressao.salvar_para_impressao(aluno, treino, formato_arquivo, largura)
            messagebox.showinfo("Sucesso", f"Arquivo de impressão gerado: {caminho_arquivo}")
            
            # Tentar abrir o arquivo para visualização (depende do sistema operacional)
            if os.name == 'nt':  # Windows
                os.startfile(caminho_arquivo)
            else:  # Linux/Mac
                subprocess.call(['xdg-open', caminho_arquivo])
                
            janela.destroy()
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao gerar impressão: {str(e)}")