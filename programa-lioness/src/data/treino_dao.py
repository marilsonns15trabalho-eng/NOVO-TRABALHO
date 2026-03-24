#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - DAO de Treinos

Este módulo contém as funções para interação com o banco de dados
relativas aos treinos.
"""

import json
from datetime import datetime
from models.treino import Treino
from data.database import db_manager

class TreinoDAO:
    """Classe responsável pela manipulação de treinos no banco de dados."""
    
    def _row_to_treino(self, row):
        """
        Converte uma linha do banco de dados em um objeto Treino.
        
        Args:
            row: Linha do resultado da query (sqlite3.Row)
            
        Returns:
            Treino: Objeto Treino ou None se a linha for inválida
        """
        if not row:
            return None
            
        # Criar dicionário com os dados da linha
        data = {
            'id': row['id'],
            'nome': row['nome'],
            'objetivo': row['objetivo'],
            'nivel': row['nivel'],
            'duracao_minutos': row['duracao_minutos'],
            'descricao': row['descricao'],
            'exercicios': [],  # Inicialmente vazio, será preenchido abaixo
            'ativo': bool(row['ativo']),
            'data_criacao': row['data_criacao']
        }
        
        # Desserializar exercícios do JSON
        try:
            exercicios_json = row['exercicios']
            if exercicios_json:
                data['exercicios'] = json.loads(exercicios_json)
        except json.JSONDecodeError:
            data['exercicios'] = []
        
        # Criar objeto Treino usando from_dict
        treino = Treino.from_dict(data)
        return treino

    def criar_treino(self, treino: Treino) -> int:
        """
        Cria um novo treino no banco de dados.
        
        Args:
            treino: Objeto Treino com os dados do treino.
        
        Returns:
            int: ID do treino criado, ou None em caso de erro.
        """
        query = """
            INSERT INTO treinos (nome, objetivo, nivel, duracao_minutos, descricao, exercicios, data_criacao, ativo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        exercicios_json = treino.exercicios_to_json()
        params = (
            treino.nome,
            treino.objetivo,
            treino.nivel,
            treino.duracao_minutos,
            treino.descricao,
            exercicios_json,
            treino.data_criacao.strftime('%Y-%m-%d %H:%M:%S'),
            1 if treino.ativo else 0
        )
        
        try:
            treino_id = db_manager.execute_insert(query, params)
            return treino_id
        except Exception as e:
            print(f"Erro ao criar treino: {e}")
            return None
    
    def atualizar_treino(self, treino: Treino) -> bool:
        """
        Atualiza um treino existente no banco de dados.
        
        Args:
            treino: Objeto Treino com os dados atualizados.
        
        Returns:
            bool: True se atualizado com sucesso, False caso contrário.
        """
        query = """
            UPDATE treinos
            SET nome = ?, objetivo = ?, nivel = ?, duracao_minutos = ?, descricao = ?, exercicios = ?
            WHERE id = ?
        """
        exercicios_json = treino.exercicios_to_json()
        params = (
            treino.nome,
            treino.objetivo,
            treino.nivel,
            treino.duracao_minutos,
            treino.descricao,
            exercicios_json,
            treino.id
        )
        
        try:
            db_manager.execute_update(query, params)
            return True
        except Exception as e:
            print(f"Erro ao atualizar treino: {e}")
            return False
    
    def buscar_treino_por_id(self, treino_id: int) -> Treino:
        """
        Busca um treino pelo ID.
        
        Args:
            treino_id: ID do treino.
        
        Returns:
            Treino: Objeto Treino com os dados, ou None se não encontrado.
        """
        query = "SELECT * FROM treinos WHERE id = ?"
        result = db_manager.execute_query(query, (treino_id,))
        
        return self._row_to_treino(result[0]) if result else None
    
    def listar_todos_treinos(self, apenas_ativos=True) -> list[Treino]:
        """
        Lista todos os treinos.
        
        Args:
            apenas_ativos: Se True, retorna apenas treinos ativos.
        
        Returns:
            list: Lista de objetos Treino.
        """
        query = "SELECT * FROM treinos"
        if apenas_ativos:
            query += " WHERE ativo = 1"
        query += " ORDER BY nome"
        
        resultados = db_manager.execute_query(query)
        return [self._row_to_treino(row) for row in resultados]
    
    def buscar_treinos_por_nome(self, termo: str, apenas_ativos=True) -> list[Treino]:
        """
        Busca treinos pelo nome (parcial).
        
        Args:
            termo: Termo para busca.
            apenas_ativos: Se True, retorna apenas treinos ativos.
        
        Returns:
            list: Lista de objetos Treino.
        """
        query = "SELECT * FROM treinos WHERE nome LIKE ?"
        if apenas_ativos:
            query += " AND ativo = 1"
        query += " ORDER BY nome"
        termo = f"%{termo}%"
        
        resultados = db_manager.execute_query(query, (termo,))
        return [self._row_to_treino(row) for row in resultados]
    
    def buscar_treinos_por_aluno(self, aluno_id: int, termo="", apenas_ativos=True) -> list[Treino]:
        """
        Busca treinos associados a um aluno.
        
        Args:
            aluno_id: ID do aluno.
            termo: Termo para busca no nome (opcional).
            apenas_ativos: Se True, retorna apenas treinos ativos.
        
        Returns:
            list: Lista de objetos Treino.
        """
        query = """
            SELECT t.* FROM treinos t
            INNER JOIN aluno_treinos at ON t.id = at.treino_id
            WHERE at.aluno_id = ?
        """
        params = [aluno_id]
        if termo:
            query += " AND t.nome LIKE ?"
            params.append(f"%{termo}%")
        if apenas_ativos:
            query += " AND t.ativo = 1"
        query += " ORDER BY t.nome"
        
        resultados = db_manager.execute_query(query, tuple(params))
        return [self._row_to_treino(row) for row in resultados]
    
    def atribuir_treino_a_aluno(self, treino_id: int, aluno_id: int) -> bool:
        """
        Atribui um treino a um aluno.
        
        Args:
            treino_id: ID do treino.
            aluno_id: ID do aluno.
        
        Returns:
            bool: True se atribuído com sucesso, False caso contrário.
        """
        query = """
            INSERT INTO aluno_treinos (aluno_id, treino_id, data_inicio, ativo)
            VALUES (?, ?, ?, ?)
        """
        params = (aluno_id, treino_id, datetime.now().strftime('%Y-%m-%d'), 1)
        
        try:
            db_manager.execute_insert(query, params)
            return True
        except Exception as e:
            print(f"Erro ao atribuir treino: {e}")
            return False
    
    def alterar_status_treino(self, treino_id: int, ativo: bool) -> bool:
        """
        Altera o status (ativo/inativo) de um treino.
        
        Args:
            treino_id: ID do treino.
            ativo: Novo status (True/False).
        
        Returns:
            bool: True se atualizado com sucesso, False caso contrário.
        """
        query = "UPDATE treinos SET ativo = ? WHERE id = ?"
        params = (1 if ativo else 0, treino_id)
        
        try:
            db_manager.execute_update(query, params)
            return True
        except Exception as e:
            print(f"Erro ao alterar status do treino: {e}")
            return False
    
    def criar_treinos_padrao(self):
        """
        Cria treinos padrão caso não existam no banco de dados.
        """
        if not self.listar_todos_treinos(apenas_ativos=False):
            treinos_padrao = [
                Treino(
                    nome="Treino Iniciante A",
                    objetivo="Condicionamento Geral",
                    nivel="Iniciante",
                    duracao_minutos=45,
                    descricao="Treino inicial para condicionamento físico geral.",
                    exercicios=[
                        {"nome": "Agachamento Livre", "grupo_muscular": "Pernas", "series": 3, "repeticoes": "12-15", "carga": "Peso corporal", "descanso": "60s", "observacoes": "Manter coluna neutra"},
                        {"nome": "Abdominal Supra", "grupo_muscular": "Abdômen", "series": 3, "repeticoes": "15-20", "carga": "Peso corporal", "descanso": "45s", "observacoes": "Movimento controlado"},
                        {"nome": "Prancha", "grupo_muscular": "Core", "series": 3, "repeticoes": "30s", "carga": "Peso corporal", "descanso": "30s", "observacoes": "Manter alinhamento"}
                    ]
                ),
                Treino(
                    nome="Treino CrossFit AMRAP",
                    objetivo="Resistência e Força",
                    nivel="Intermediário",
                    duracao_minutos=30,
                    descricao="Treino AMRAP (As Many Rounds As Possible) para resistência.",
                    exercicios=[
                        {"nome": "Burpee com Salto", "grupo_muscular": "Corpo Todo", "series": 1, "repeticoes": "10", "carga": "Peso corporal", "descanso": "0s", "observacoes": "Máxima intensidade"},
                        {"nome": "Pull-up", "grupo_muscular": "Costas/Braços", "series": 1, "repeticoes": "8", "carga": "Peso corporal", "descanso": "0s", "observacoes": "Movimento controlado"},
                        {"nome": "Air Bike", "grupo_muscular": "Cardio", "series": 1, "repeticoes": "15 cal", "carga": "Moderada", "descanso": "0s", "observacoes": "Alta intensidade"}
                    ]
                )
            ]
            for treino in treinos_padrao:
                self.criar_treino(treino)

treino_dao = TreinoDAO()