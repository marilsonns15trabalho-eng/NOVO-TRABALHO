import sqlite3
import os
import logging

log_dir = os.path.join(os.path.expanduser("~"), "Lioness Personal Estudio", "logs")
os.makedirs(log_dir, exist_ok=True)
log_file_path = os.path.join(log_dir, "lpe_errors.log")

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file_path),
        logging.StreamHandler()
    ]
)

class DatabaseManager:
    def __init__(self, db_name="lpe_database.db", db_path=None):
        if db_path is None:
            # Define o caminho do banco de dados no diretório 'database' do projeto PRIME
            self.db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "database", db_name)
        else:
            self.db_path = db_path
        self._create_tables()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Permite acessar colunas por nome
        return conn

    def _create_tables(self):
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                # Tabela Alunos
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS alunos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nome TEXT NOT NULL,
                        data_nascimento TEXT,
                        genero TEXT,
                        telefone TEXT,
                        email TEXT,
                        endereco TEXT,
                        data_cadastro TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                # Tabela Planos
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS planos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nome TEXT NOT NULL UNIQUE,
                        descricao TEXT,
                        valor REAL NOT NULL,
                        duracao_meses INTEGER
                    )
                """)
                # Tabela Pagamentos
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS pagamentos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        aluno_id INTEGER NOT NULL,
                        plano_id INTEGER NOT NULL,
                        data_pagamento TEXT DEFAULT CURRENT_TIMESTAMP,
                        valor_pago REAL NOT NULL,
                        data_vencimento TEXT,
                        status TEXT, -- Pago, Pendente, Atrasado
                        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
                        FOREIGN KEY (plano_id) REFERENCES planos(id)
                    )
                """)
                # Tabela Despesas
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS despesas (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        descricao TEXT NOT NULL,
                        valor REAL NOT NULL,
                        data TEXT DEFAULT CURRENT_TIMESTAMP,
                        categoria TEXT
                    )
                """)
                # Tabela Anamnese Nutricional
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS anamnese_nutricional (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        aluno_id INTEGER NOT NULL,
                        data TEXT DEFAULT CURRENT_TIMESTAMP,
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
                        FOREIGN KEY (aluno_id) REFERENCES alunos(id)
                    )
                """)
                # Migração para adicionar colunas à tabela anamnese (caso ela já exista com o nome antigo)
                colunas_adicionais = [
                    ("peso", "REAL"),
                    ("altura", "REAL"),
                    ("objetivo_nutricional", "TEXT"),
                    ("historico_familiar", "TEXT"),
                    ("habitos_alimentares", "TEXT"),
                    ("consumo_agua", "TEXT"),
                    ("atividade_fisica", "TEXT"),
                    ("observacoes", "TEXT"),
                    ("circunferencia_abdominal", "TEXT"),
                    ("circunferencia_quadril", "TEXT"),
                    ("medidas_corpo", "TEXT"),
                    ("doencas_cronicas", "TEXT"),
                    ("problemas_saude", "TEXT"),
                    ("condicoes_hormonais", "TEXT"),
                    ("acompanhamento_psicologico", "TEXT"),
                    ("disturbios_alimentares", "TEXT"),
                    ("gravida_amamentando", "TEXT"),
                    ("acompanhamento_previo", "TEXT"),
                    ("frequencia_refeicoes", "TEXT"),
                    ("horarios_refeicoes", "TEXT"),
                    ("consumo_fastfood", "TEXT"),
                    ("consumo_doces", "TEXT"),
                    ("consumo_bebidas_acucaradas", "TEXT"),
                    ("consumo_alcool", "TEXT"),
                    ("gosta_cozinhar", "TEXT"),
                    ("preferencia_alimentos", "TEXT"),
                    ("consumo_cafe", "TEXT"),
                    ("uso_suplementos", "TEXT"),
                    ("frequencia_atividade_fisica", "TEXT"),
                    ("objetivos_treino", "TEXT"),
                    ("rotina_sono", "TEXT"),
                    ("nivel_estresse", "TEXT"),
                    ("tempo_sentado", "TEXT"),
                    ("dificuldade_dietas", "TEXT"),
                    ("lanches_fora", "TEXT"),
                    ("come_emocional", "TEXT"),
                    ("beliscar", "TEXT"),
                    ("compulsao_alimentar", "TEXT"),
                    ("fome_fora_horario", "TEXT"),
                    ("estrategias_controle_peso", "TEXT"),
                    ("alimentos_preferidos", "TEXT"),
                    ("alimentos_evitados", "TEXT"),
                    ("meta_peso_medidas", "TEXT"),
                    ("disposicao_mudancas", "TEXT"),
                    ("preferencia_dietas", "TEXT"),
                    ("expectativas", "TEXT")
                ]
                for coluna, tipo in colunas_adicionais:
                    try:
                        cursor.execute(f"ALTER TABLE anamnese ADD COLUMN {coluna} {tipo}")
                        logging.info(f"Coluna {coluna} adicionada à tabela anamnese.")
                    except sqlite3.OperationalError as e:
                        if "duplicate column name" not in str(e):
                            logging.error(f"Erro ao adicionar coluna {coluna} à tabela anamnese: {e}")
                # Tabela Avaliacao_Fisica
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS avaliacao_fisica (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        aluno_id INTEGER NOT NULL,
                        data TEXT DEFAULT CURRENT_TIMESTAMP,
                        peso REAL,
                        altura REAL,
                        imc REAL,
                        percentual_gordura REAL,
                        circunferencia_braco REAL,
                        circunferencia_cintura REAL,
                        circunferencia_quadril REAL,
                        FOREIGN KEY (aluno_id) REFERENCES alunos(id)
                    )
                """)
                # Tabela Treinos
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS treinos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        aluno_id INTEGER NOT NULL,
                        nome_treino TEXT NOT NULL,
                        data_inicio TEXT DEFAULT CURRENT_TIMESTAMP,
                        data_fim TEXT,
                        objetivo TEXT,
                        FOREIGN KEY (aluno_id) REFERENCES alunos(id)
                    )
                """)
                # Tabela Exercicios (para treinos)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS exercicios (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        treino_id INTEGER NOT NULL,
                        nome_exercicio TEXT NOT NULL,
                        series INTEGER,
                        repeticoes INTEGER,
                        carga REAL,
                        observacoes TEXT,
                        FOREIGN KEY (treino_id) REFERENCES treinos(id)
                    )
                """)
                # Tabela Assinaturas
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS assinaturas (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        aluno_id INTEGER NOT NULL,
                        plano_id INTEGER NOT NULL,
                        plano_nome TEXT,
                        plano_valor REAL,
                        plano_duracao_dias INTEGER,
                        plano_descricao TEXT,
                        data_inicio TEXT NOT NULL,
                        data_fim TEXT NOT NULL,
                        valor_pago REAL,
                        ativo BOOLEAN DEFAULT 1,
                        data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
                        FOREIGN KEY (plano_id) REFERENCES planos(id)
                    )
                """)
                # Migração para adicionar colunas à tabela assinaturas (caso ela já exista sem essas colunas)
                colunas_assinaturas = [
                    ("plano_nome", "TEXT"),
                    ("plano_valor", "REAL"),
                    ("plano_duracao_dias", "INTEGER"),
                    ("plano_descricao", "TEXT")
                ]
                for coluna, tipo in colunas_assinaturas:
                    try:
                        cursor.execute(f"ALTER TABLE assinaturas ADD COLUMN {coluna} {tipo}")
                        logging.info(f"Coluna {coluna} adicionada à tabela assinaturas.")
                    except sqlite3.OperationalError as e:
                        if "duplicate column name" not in str(e):
                            logging.error(f"Erro ao adicionar coluna {coluna} à tabela assinaturas: {e}")
                conn.commit()
                logging.info("Tabelas do banco de dados verificadas/criadas com sucesso.")
        except sqlite3.Error as e:
            logging.error(f"Erro ao criar tabelas do banco de dados: {e}")
            raise

db_manager = DatabaseManager()