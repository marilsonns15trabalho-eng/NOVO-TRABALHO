#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Módulo de Banco de Dados

Este módulo gerencia a conexão e operações com o banco de dados SQLite
para armazenar informações do sistema, incluindo alunos, treinos, planos, 
pagamentos, despesas e avaliações físicas.
"""

import sqlite3
import os
import sys
from datetime import datetime
from typing import List, Optional, Tuple, Any
from contextlib import contextmanager
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Gerenciador do banco de dados SQLite.
    
    Responsável por criar, conectar e executar operações no banco de dados,
    incluindo CRUD, backup e restauração.
    """
    
    def __init__(self, db_path: str = None):
        """
        Inicializa o gerenciador do banco de dados.
        
        Args:
            db_path: Caminho para o arquivo do banco de dados. Se None, usa o padrão.
        """
        if db_path is None:
            # Para executável PyInstaller
            if getattr(sys, 'frozen', False):
                application_path = os.path.dirname(sys.executable)
            else:
                application_path = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            
            db_dir = os.path.join(application_path, 'data')
            os.makedirs(db_dir, exist_ok=True)
            db_path = os.path.join(db_dir, 'lpe_database.db')
        
        self.db_path = db_path
        try:
            self.init_database()
            logger.info(f"Banco de dados inicializado em: {db_path}")
        except sqlite3.Error as e:
            logger.error(f"Erro ao inicializar o banco de dados: {e}")
            raise
    
    @contextmanager
    def get_connection(self):
        """
        Context manager para conexões com o banco de dados.
        
        Yields:
            Conexão SQLite com row_factory configurado para acessar colunas por nome.
        """
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            yield conn
        except sqlite3.Error as e:
            logger.error(f"Erro na conexão com o banco de dados: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def init_database(self):
        """Inicializa o banco de dados criando as tabelas necessárias e índices."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Tabela de alunos
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS alunos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    cpf TEXT UNIQUE,
                    data_nascimento DATE,
                    telefone TEXT,
                    email TEXT,
                    endereco TEXT,
                    cidade TEXT,
                    cep TEXT,
                    profissao TEXT,
                    contato_emergencia TEXT,
                    telefone_emergencia TEXT,
                    observacoes TEXT,
                    ativo BOOLEAN DEFAULT 1,
                    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    data_ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    genero TEXT,
                    grupo TEXT,
                    modalidade TEXT,
                    plano_id INTEGER,
                    objetivos TEXT,
                    peso_desejado REAL,
                    FOREIGN KEY (plano_id) REFERENCES planos (id)
                )
            ''')
            
            # Tabela de planos
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS planos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    descricao TEXT,
                    valor REAL NOT NULL,
                    duracao_dias INTEGER NOT NULL,
                    ativo BOOLEAN DEFAULT 1,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Inserir planos padrão, se a tabela estiver vazia
            cursor.execute("SELECT COUNT(*) FROM planos")
            if cursor.fetchone()[0] == 0:
                planos_iniciais = [
                    ("Básico", "Plano básico com acesso limitado", 100.00, 30, 1),
                    ("Intermediário", "Plano intermediário com treinos personalizados", 200.00, 30, 1),
                    ("Avançado", "Plano avançado com acompanhamento completo", 300.00, 30, 1),
                    ("Personalizado", "Plano personalizado sob medida", 400.00, 30, 1)
                ]
                cursor.executemany(
                    "INSERT INTO planos (nome, descricao, valor, duracao_dias, ativo) VALUES (?, ?, ?, ?, ?)",
                    planos_iniciais
                )
                logger.info("Planos padrão inseridos com sucesso.")
            
            # Tabela de assinaturas
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS assinaturas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    aluno_id INTEGER NOT NULL,
                    plano_id INTEGER NOT NULL,
                    plano_nome TEXT NOT NULL,
                    plano_valor REAL NOT NULL,
                    plano_duracao_dias INTEGER NOT NULL,
                    plano_descricao TEXT,
                    data_inicio DATE NOT NULL,
                    data_fim DATE NOT NULL,
                    valor_pago REAL,
                    ativo BOOLEAN DEFAULT 1,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (aluno_id) REFERENCES alunos (id),
                    FOREIGN KEY (plano_id) REFERENCES planos (id)
                )
            ''')
            
            # Tabela de pagamentos
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS pagamentos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    aluno_id INTEGER NOT NULL,
                    assinatura_id INTEGER,
                    valor REAL NOT NULL,
                    data_pagamento DATE NOT NULL,
                    data_vencimento DATE,
                    metodo_pagamento TEXT,
                    status TEXT,
                    observacoes TEXT,
                    numero_boleto TEXT,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (aluno_id) REFERENCES alunos (id),
                    FOREIGN KEY (assinatura_id) REFERENCES assinaturas (id)
                )
            ''')
            
            # Tabela de log de alterações em pagamentos
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS pagamento_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pagamento_id INTEGER,
                    alteracao TEXT,
                    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (pagamento_id) REFERENCES pagamentos (id)
                )
            ''')
            
            # Tabela de despesas
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS despesas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    valor REAL NOT NULL,
                    data_despesa DATE NOT NULL,
                    categoria TEXT,
                    descricao TEXT,
                    metodo_pagamento TEXT,
                    numero_registro TEXT,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Tabela de treinos
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS treinos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    objetivo TEXT,
                    nivel TEXT,
                    duracao_minutos INTEGER,
                    descricao TEXT,
                    exercicios TEXT,
                    ativo BOOLEAN DEFAULT 1,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Tabela de relação aluno-treino
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS aluno_treinos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    aluno_id INTEGER NOT NULL,
                    treino_id INTEGER NOT NULL,
                    data_inicio DATE NOT NULL,
                    data_fim DATE,
                    ativo BOOLEAN DEFAULT 1,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (aluno_id) REFERENCES alunos (id),
                    FOREIGN KEY (treino_id) REFERENCES treinos (id)
                )
            ''')
            
            # Tabela de avaliações físicas (refatorada para usar apenas Faulkner)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS avaliacoes_fisicas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    aluno_id INTEGER NOT NULL,
                    data_avaliacao DATE NOT NULL,
                    peso REAL,
                    altura REAL,
                    percentual_gordura REAL,
                    massa_muscular REAL,
                    massa_gorda REAL,
                    massa_magra REAL,
                    imc REAL,
                    rcq REAL,
                    peso_ideal REAL,
                    peso_residual REAL,
                    protocolo TEXT DEFAULT 'Faulkner',
                    circunferencia_pescoco REAL,
                    circunferencia_ombro REAL,
                    circunferencia_peito REAL,
                    circunferencia_cintura REAL,
                    circunferencia_abdomen REAL,
                    circunferencia_quadril REAL,
                    circunferencia_braco_esq REAL,
                    circunferencia_braco_dir REAL,
                    circunferencia_coxa_esq REAL,
                    circunferencia_coxa_dir REAL,
                    circunferencia_panturrilha_esq REAL,
                    circunferencia_panturrilha_dir REAL,
                    dobra_triceps REAL,
                    dobra_subescapular REAL,
                    dobra_suprailiaca REAL,
                    dobra_abdominal REAL,
                    dobra_peitoral REAL,
                    dobra_axilar_media REAL,
                    dobra_coxa REAL,
                    pressao_arterial TEXT,
                    frequencia_cardiaca INTEGER,
                    observacoes TEXT,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (aluno_id) REFERENCES alunos (id)
                )
            ''')
            
            # Tabela de anamnese nutricional
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS anamnese_nutricional (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    aluno_id INTEGER NOT NULL,
                    data_anamnese DATE NOT NULL,
                    peso REAL,
                    altura REAL,
                    objetivo_nutricional TEXT,
                    restricoes_alimentares TEXT,
                    alergias TEXT,
                    medicamentos TEXT,
                    historico_familiar TEXT,
                    habitos_alimentares TEXT,
                    consumo_agua TEXT,
                    atividade_fisica TEXT,
                    observacoes TEXT,
                    circunferencia_abdominal TEXT,
                    circunferencia_quadril TEXT,
                    medidas_corpo TEXT,
                    doencas_cronicas TEXT,
                    problemas_saude TEXT,
                    cirurgias TEXT,
                    condicoes_hormonais TEXT,
                    acompanhamento_psicologico TEXT,
                    disturbios_alimentares TEXT,
                    gravida_amamentando TEXT,
                    acompanhamento_previo TEXT,
                    frequencia_refeicoes TEXT,
                    horarios_refeicoes TEXT,
                    consumo_fastfood TEXT,
                    consumo_doces TEXT,
                    consumo_bebidas_acucaradas TEXT,
                    consumo_alcool TEXT,
                    gosta_cozinhar TEXT,
                    preferencia_alimentos TEXT,
                    consumo_cafe TEXT,
                    uso_suplementos TEXT,
                    frequencia_atividade_fisica TEXT,
                    objetivos_treino TEXT,
                    rotina_sono TEXT,
                    nivel_estresse TEXT,
                    tempo_sentado TEXT,
                    dificuldade_dietas TEXT,
                    lanches_fora TEXT,
                    come_emocional TEXT,
                    beliscar TEXT,
                    compulsao_alimentar TEXT,
                    fome_fora_horario TEXT,
                    estrategias_controle_peso TEXT,
                    alimentos_preferidos TEXT,
                    alimentos_evitados TEXT,
                    meta_peso_medidas TEXT,
                    disposicao_mudancas TEXT,
                    preferencia_dietas TEXT,
                    expectativas TEXT,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (aluno_id) REFERENCES alunos (id)
                )
            ''')
            
            # Criar índices para melhorar desempenho
            indices = [
                'CREATE INDEX IF NOT EXISTS idx_alunos_cpf ON alunos (cpf)',
                'CREATE INDEX IF NOT EXISTS idx_alunos_nome ON alunos (nome)',
                'CREATE INDEX IF NOT EXISTS idx_alunos_ativo ON alunos (ativo)',
                'CREATE INDEX IF NOT EXISTS idx_aluno_treinos_aluno_id ON aluno_treinos (aluno_id)',
                'CREATE INDEX IF NOT EXISTS idx_aluno_treinos_treino_id ON aluno_treinos (treino_id)',
                'CREATE INDEX IF NOT EXISTS idx_assinaturas_aluno_id ON assinaturas (aluno_id)',
                'CREATE INDEX IF NOT EXISTS idx_assinaturas_ativo ON assinaturas (ativo)',
                'CREATE INDEX IF NOT EXISTS idx_pagamentos_aluno_id ON pagamentos (aluno_id)',
                'CREATE INDEX IF NOT EXISTS idx_pagamentos_data ON pagamentos (data_pagamento)',
                'CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas (data_despesa)',
                'CREATE INDEX IF NOT EXISTS idx_anamnese_aluno_id ON anamnese_nutricional (aluno_id)',
                'CREATE INDEX IF NOT EXISTS idx_avaliacoes_aluno_id ON avaliacoes_fisicas (aluno_id)',
                'CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes_fisicas (data_avaliacao)'
            ]
            
            for index in indices:
                cursor.execute(index)
            
            conn.commit()
            logger.info("Tabelas e índices criados/verificados com sucesso.")

    def execute_query(self, query: str, params: Tuple = ()) -> List[sqlite3.Row]:
        """
        Executa uma query SELECT e retorna os resultados.
        
        Args:
            query: Query SQL
            params: Parâmetros da query
            
        Returns:
            Lista de resultados como objetos sqlite3.Row
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, params)
                return cursor.fetchall()
        except sqlite3.Error as e:
            logger.error(f"Erro ao executar query: {query} - {e}")
            raise
    
    def execute_insert(self, query: str, params: Tuple = ()) -> Optional[int]:
        """
        Executa uma query INSERT e retorna o ID do registro inserido.
        
        Args:
            query: Query SQL
            params: Parâmetros da query
            
        Returns:
            ID do registro inserido ou None se erro
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, params)
                conn.commit()
                return cursor.lastrowid
        except sqlite3.Error as e:
            logger.error(f"Erro ao executar insert: {query} - {e}")
            return None
    
    def execute_update(self, query: str, params: Tuple = ()) -> int:
        """
        Executa uma query UPDATE e retorna o número de linhas afetadas.
        
        Args:
            query: Query SQL
            params: Parâmetros da query
            
        Returns:
            Número de linhas afetadas
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, params)
                conn.commit()
                return cursor.rowcount
        except sqlite3.Error as e:
            logger.error(f"Erro ao executar update: {query} - {e}")
            return 0
    
    def execute_delete(self, query: str, params: Tuple = ()) -> int:
        """
        Executa uma query DELETE e retorna o número de linhas afetadas.
        
        Args:
            query: Query SQL
            params: Parâmetros da query
            
        Returns:
            Número de linhas afetadas
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, params)
                conn.commit()
                return cursor.rowcount
        except sqlite3.Error as e:
            logger.error(f"Erro ao executar delete: {query} - {e}")
            return 0
    
    def backup_database(self, backup_path: str) -> bool:
        """
        Cria um backup do banco de dados.
        
        Args:
            backup_path: Caminho para o arquivo de backup
            
        Returns:
            True se o backup foi criado com sucesso, False caso contrário
        """
        try:
            if os.path.exists(backup_path):
                logger.warning(f"Arquivo de backup já existe: {backup_path}. Sobrescrevendo.")
            
            with self.get_connection() as source:
                with sqlite3.connect(backup_path) as backup:
                    source.backup(backup)
            logger.info(f"Backup criado com sucesso em: {backup_path}")
            return True
        except sqlite3.Error as e:
            logger.error(f"Erro ao criar backup: {e}")
            return False
    
    def restore_database(self, backup_path: str) -> bool:
        """
        Restaura o banco de dados a partir de um backup.
        
        Args:
            backup_path: Caminho para o arquivo de backup
            
        Returns:
            True se a restauração foi bem-sucedida, False caso contrário
        """
        try:
            if not os.path.exists(backup_path):
                logger.error(f"Arquivo de backup não encontrado: {backup_path}")
                return False
            
            with sqlite3.connect(backup_path) as backup:
                with self.get_connection() as target:
                    backup.backup(target)
            logger.info(f"Banco de dados restaurado com sucesso de: {backup_path}")
            return True
        except sqlite3.Error as e:
            logger.error(f"Erro ao restaurar backup: {e}")
            return False
    
    def vacuum(self) -> bool:
        """
        Executa o comando VACUUM para otimizar o banco de dados.
        
        Returns:
            True se a otimização foi bem-sucedida, False caso contrário
        """
        try:
            with self.get_connection() as conn:
                conn.execute("VACUUM")
            logger.info("Banco de dados otimizado com VACUUM")
            return True
        except sqlite3.Error as e:
            logger.error(f"Erro ao executar VACUUM: {e}")
            return False


# Instância global do gerenciador de banco de dados
db_manager = DatabaseManager()