# gui/modulo_relatorios.py
import tkinter as tk
from tkinter import ttk
from datetime import datetime, date
from data.aluno_dao import aluno_dao
from data.anamnese_dao import anamnese_dao
from data.avaliacao_dao import avaliacao_dao
from data.pagamento_dao import pagamento_dao
from data.plano_dao import plano_dao
from data.despesa_dao import despesa_dao

class ModuloRelatorios:
    def __init__(self, master):
        self.master = master
        self.frame = ttk.Frame(master)
        self.frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        self.criar_interface()
        self.carregar_dados()
        
    def criar_interface(self):
        # Frame principal com scrollbar
        self.canvas = tk.Canvas(self.frame, bg='white')
        self.scrollbar = ttk.Scrollbar(self.frame, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = ttk.Frame(self.canvas)
        
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(
                scrollregion=self.canvas.bbox("all")
            )
        )
        
        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        
        self.canvas.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")
        
        # Título
        ttk.Label(self.scrollable_frame, 
                 text="📊 RELATÓRIOS MENSAL - RESUMO",
                 font=('Arial', 16, 'bold')).pack(pady=(0, 20))
        
        # Frame para os cards
        self.cards_frame = ttk.Frame(self.scrollable_frame)
        self.cards_frame.pack(fill='x', padx=5, pady=5)
        
        # Seções
        self.criar_secao_financeira()
        self.criar_secao_alunos()
        self.criar_secao_documentos()
        self.criar_secao_planos()
        
    def criar_secao_financeira(self):
        frame = ttk.LabelFrame(self.scrollable_frame, text="💰 FINANCEIRO", padding=10)
        frame.pack(fill='x', pady=5, padx=5)
        
        # Grid para métricas financeiras
        ttk.Label(frame, text="Receitas do mês:").grid(row=0, column=0, sticky='w')
        self.receita_label = ttk.Label(frame, text="R$ 0,00", font=('Arial', 10, 'bold'))
        self.receita_label.grid(row=0, column=1, sticky='e')
        
        ttk.Label(frame, text="Despesas do mês:").grid(row=1, column=0, sticky='w')
        self.despesa_label = ttk.Label(frame, text="R$ 0,00", font=('Arial', 10, 'bold'))
        self.despesa_label.grid(row=1, column=1, sticky='e')
        
        ttk.Label(frame, text="Saldo líquido:").grid(row=2, column=0, sticky='w')
        self.saldo_label = ttk.Label(frame, text="R$ 0,00", font=('Arial', 10, 'bold'))
        self.saldo_label.grid(row=2, column=1, sticky='e')
        
        ttk.Label(frame, text="Alunos inadimplentes:").grid(row=3, column=0, sticky='w')
        self.inadimplentes_label = ttk.Label(frame, text="0", font=('Arial', 10, 'bold'))
        self.inadimplentes_label.grid(row=3, column=1, sticky='e')
    
    def criar_secao_alunos(self):
        frame = ttk.LabelFrame(self.scrollable_frame, text="👥 ALUNOS", padding=10)
        frame.pack(fill='x', pady=5, padx=5)
        
        ttk.Label(frame, text="Total de alunos:").grid(row=0, column=0, sticky='w')
        self.total_alunos_label = ttk.Label(frame, text="0", font=('Arial', 10, 'bold'))
        self.total_alunos_label.grid(row=0, column=1, sticky='e')
        
        ttk.Label(frame, text="Alunos ativos:").grid(row=1, column=0, sticky='w')
        self.ativos_label = ttk.Label(frame, text="0", font=('Arial', 10, 'bold'))
        self.ativos_label.grid(row=1, column=1, sticky='e')
        
        ttk.Label(frame, text="Alunos inativos:").grid(row=2, column=0, sticky='w')
        self.inativos_label = ttk.Label(frame, text="0", font=('Arial', 10, 'bold'))
        self.inativos_label.grid(row=2, column=1, sticky='e')
        
        ttk.Label(frame, text="Novos alunos este mês:").grid(row=3, column=0, sticky='w')
        self.novos_alunos_label = ttk.Label(frame, text="0", font=('Arial', 10, 'bold'))
        self.novos_alunos_label.grid(row=3, column=1, sticky='e')
    
    def criar_secao_documentos(self):
        frame = ttk.LabelFrame(self.scrollable_frame, text="📄 DOCUMENTAÇÕES", padding=10)
        frame.pack(fill='x', pady=5, padx=5)
        
        ttk.Label(frame, text="Anamneses pendentes:").grid(row=0, column=0, sticky='w')
        self.anamnese_pendente_label = ttk.Label(frame, text="0", font=('Arial', 10, 'bold'))
        self.anamnese_pendente_label.grid(row=0, column=1, sticky='e')
        
        ttk.Label(frame, text="Avaliações pendentes:").grid(row=1, column=0, sticky='w')
        self.avaliacao_pendente_label = ttk.Label(frame, text="0", font=('Arial', 10, 'bold'))
        self.avaliacao_pendente_label.grid(row=1, column=1, sticky='e')
        
        ttk.Label(frame, text="Documentos vencidos:").grid(row=2, column=0, sticky='w')
        self.docs_vencidos_label = ttk.Label(frame, text="0", font=('Arial', 10, 'bold'))
        self.docs_vencidos_label.grid(row=2, column=1, sticky='e')
    
    def criar_secao_planos(self):
        frame = ttk.LabelFrame(self.scrollable_frame, text="🔄 MUDANÇAS DE PLANOS", padding=10)
        frame.pack(fill='x', pady=5, padx=5)
        
        ttk.Label(frame, text="Mudanças este mês:").grid(row=0, column=0, sticky='w')
        self.mudancas_plano_label = ttk.Label(frame, text="0", font=('Arial', 10, 'bold'))
        self.mudancas_plano_label.grid(row=0, column=1, sticky='e')
        
        ttk.Label(frame, text="Plano mais popular:").grid(row=1, column=0, sticky='w')
        self.plano_popular_label = ttk.Label(frame, text="Nenhum", font=('Arial', 10, 'bold'))
        self.plano_popular_label.grid(row=1, column=1, sticky='e')
    
    def carregar_dados(self):
        """Carrega os dados dos relatórios usando os métodos existentes nos DAOs"""
        hoje = datetime.now()
        mes_atual = hoje.month
        ano_atual = hoje.year
        
        try:
            # Definir período do mês atual
            data_inicio = date(ano_atual, mes_atual, 1)
            if mes_atual == 12:
                data_fim = date(ano_atual + 1, 1, 1)
            else:
                data_fim = date(ano_atual, mes_atual + 1, 1)
            
            # Dados financeiros
            pagamentos = pagamento_dao.buscar_pagamentos_por_periodo(data_inicio, data_fim)
            receita = sum(p.valor for p in pagamentos if p.status.lower() == 'pago')
            
            despesas = despesa_dao.buscar_por_periodo(data_inicio, data_fim)
            despesa = sum(d.valor for d in despesas)
            
            saldo = receita - despesa
            
            self.receita_label.config(text=f"R$ {receita:,.2f}")
            self.despesa_label.config(text=f"R$ {despesa:,.2f}")
            self.saldo_label.config(text=f"R$ {saldo:,.2f}")
            
            # Alunos inadimplentes (pagamentos vencidos)
            inadimplentes = len(pagamento_dao.buscar_pagamentos_vencidos())
            self.inadimplentes_label.config(text=str(inadimplentes))
            
            # Dados de alunos
            alunos = aluno_dao.listar_todos_alunos(apenas_ativos=False)
            alunos_ativos = [a for a in alunos if a.ativo]
            alunos_inativos = [a for a in alunos if not a.ativo]
            
            # Novos alunos (cadastrados este mês)
            novos_alunos = [a for a in alunos 
                          if a.data_cadastro.month == mes_atual 
                          and a.data_cadastro.year == ano_atual]
            
            self.total_alunos_label.config(text=str(len(alunos)))
            self.ativos_label.config(text=str(len(alunos_ativos)))
            self.inativos_label.config(text=str(len(alunos_inativos)))
            self.novos_alunos_label.config(text=str(len(novos_alunos)))
            
            # Documentações pendentes
            sem_anamnese = []
            sem_avaliacao = []
            
            for aluno in alunos_ativos:
                if not anamnese_dao.buscar_anamnese_mais_recente(aluno.id):
                    sem_anamnese.append(aluno)
                if not avaliacao_dao.buscar_avaliacao_mais_recente(aluno.id):
                    sem_avaliacao.append(aluno)
            
            self.anamnese_pendente_label.config(text=str(len(sem_anamnese)))
            self.avaliacao_pendente_label.config(text=str(len(sem_avaliacao)))
            
            # Planos
            # Plano mais popular entre alunos ativos
            if alunos_ativos:
                try:
                    planos_count = {}
                    for aluno in alunos_ativos:
                        if aluno.plano_id:
                            planos_count[aluno.plano_id] = planos_count.get(aluno.plano_id, 0) + 1
                    
                    if planos_count:
                        plano_mais_comum_id = max(planos_count, key=planos_count.get)
                        plano = plano_dao.buscar_plano_por_id(plano_mais_comum_id)
                        if plano and hasattr(plano, 'nome'):
                            self.plano_popular_label.config(text=plano.nome)
                        else:
                            self.plano_popular_label.config(text="Nenhum")
                except Exception as e:
                    print(f"Erro ao determinar plano mais popular: {e}")
                    self.plano_popular_label.config(text="Erro")
            
        except Exception as e:
            print(f"Erro ao carregar dados para relatório: {e}")