#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - DAO Plano

Este módulo contém o Data Access Object (DAO) para operações
com planos no banco de dados.
"""

from typing import List, Optional
from datetime import datetime, date
import sys
import os
import logging

# Configurar logging básico
logging.basicConfig(
    filename='lpe_errors.log',
    level=logging.ERROR,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Adicionar o diretório pai ao path para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.plano import Plano
from data.database import db_manager

class PlanoDAO:
    """
    Data Access Object para operações com planos.
    
    Responsável por todas as operações de CRUD (Create, Read, Update, Delete)
    relacionadas aos planos no banco de dados.
    """
    
    def __init__(self):
        """Inicializa o DAO de planos."""
        self.db = db_manager
    
    def criar_plano(self, plano: Plano) -> int:
        """
        Cria um novo plano no banco de dados.
        
        Args:
            plano: Instância de Plano a ser criada
            
        Returns:
            ID do plano criado
        """
        query = '''
            INSERT INTO planos (
                nome, descricao, valor, duracao_dias, ativo, data_criacao
            ) VALUES (?, ?, ?, ?, ?, ?)
        '''
        
        params = (
            plano.nome,
            plano.descricao,
            plano.valor,
            plano.duracao_dias,
            plano.ativo,
            plano.data_criacao.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        try:
            plano_id = self.db.execute_insert(query, params)
            plano.id = plano_id
            return plano_id
        except Exception as e:
            logging.error(f"Erro ao criar plano: {str(e)}")
            raise
    
    def buscar_plano_por_id(self, plano_id: int) -> Optional[Plano]:
        """
        Busca um plano pelo ID.
        
        Args:
            plano_id: ID do plano
            
        Returns:
            Instância de Plano ou None se não encontrado
        """
        query = "SELECT * FROM planos WHERE id = ?"
        try:
            resultados = self.db.execute_query(query, (plano_id,))
            if resultados:
                return self._row_to_plano(resultados[0])
            return None
        except Exception as e:
            logging.error(f"Erro ao buscar plano por ID {plano_id}: {str(e)}")
            return None
    
    def buscar_planos_por_nome(self, nome: str) -> List[Plano]:
        """
        Busca planos pelo nome (busca parcial).
        
        Args:
            nome: Nome ou parte do nome do plano
            
        Returns:
            Lista de planos encontrados
        """
        query = "SELECT * FROM planos WHERE nome LIKE ? AND ativo = 1 ORDER BY nome"
        try:
            resultados = self.db.execute_query(query, (f"%{nome}%",))
            return [self._row_to_plano(row) for row in resultados]
        except Exception as e:
            logging.error(f"Erro ao buscar planos por nome '{nome}': {str(e)}")
            return []
    
    def listar_todos_planos(self, apenas_ativos: bool = True) -> List[Plano]:
        """
        Lista todos os planos do banco de dados.
        
        Args:
            apenas_ativos: Se True, retorna apenas planos ativos
            
        Returns:
            Lista de instâncias de Plano
        """
        query = "SELECT * FROM planos WHERE ativo = 1" if apenas_ativos else "SELECT * FROM planos"
        query += " ORDER BY nome"
        try:
            resultados = self.db.execute_query(query)
            return [self._row_to_plano(row) for row in resultados]
        except Exception as e:
            logging.error(f"Erro ao listar planos (ativos={apenas_ativos}): {str(e)}")
            return []
    
    def atualizar_plano(self, plano: Plano) -> bool:
        """
        Atualiza os dados de um plano existente.
        
        Args:
            plano: Instância de Plano com os dados atualizados
            
        Returns:
            True se atualizado com sucesso, False caso contrário
        """
        query = '''
            UPDATE planos
            SET nome = ?, descricao = ?, valor = ?, duracao_dias = ?, ativo = ?
            WHERE id = ?
        '''
        
        params = (
            plano.nome,
            plano.descricao,
            plano.valor,
            plano.duracao_dias,
            plano.ativo,
            plano.id
        )
        
        try:
            return self.db.execute_update(query, params) > 0
        except Exception as e:
            logging.error(f"Erro ao atualizar plano ID {plano.id}: {str(e)}")
            return False
    
    def desativar_plano(self, plano_id: int) -> bool:
        """
        Desativa um plano no banco de dados.
        
        Args:
            plano_id: ID do plano a ser desativado
            
        Returns:
            True se desativado com sucesso, False caso contrário
        """
        query = "UPDATE planos SET ativo = 0 WHERE id = ?"
        try:
            return self.db.execute_update(query, (plano_id,)) > 0
        except Exception as e:
            logging.error(f"Erro ao desativar plano ID {plano_id}: {str(e)}")
            return False
    
    def reativar_plano(self, plano_id: int) -> bool:
        """
        Reativa um plano no banco de dados.
        
        Args:
            plano_id: ID do plano a ser reativado
            
        Returns:
            True se reativado com sucesso, False caso contrário
        """
        query = "UPDATE planos SET ativo = 1 WHERE id = ?"
        try:
            return self.db.execute_update(query, (plano_id,)) > 0
        except Exception as e:
            logging.error(f"Erro ao reativar plano ID {plano_id}: {str(e)}")
            return False
    
    def excluir_plano(self, plano_id: int) -> bool:
        """
        Exclui um plano do banco de dados.
        
        Args:
            plano_id: ID do plano a ser excluído
            
        Returns:
            True se excluído com sucesso, False caso contrário
        """
        query = "DELETE FROM planos WHERE id = ?"
        try:
            return self.db.execute_delete(query, (plano_id,)) > 0
        except Exception as e:
            logging.error(f"Erro ao excluir plano ID {plano_id}: {str(e)}")
            return False
    
    def buscar_planos_por_valor(self, valor: float) -> List[Plano]:
        """
        Busca planos pelo valor exato.
        
        Args:
            valor: Valor do plano
            
        Returns:
            Lista de planos encontrados
        """
        query = "SELECT * FROM planos WHERE valor = ? AND ativo = 1 ORDER BY nome"
        try:
            resultados = self.db.execute_query(query, (valor,))
            return [self._row_to_plano(row) for row in resultados]
        except Exception as e:
            logging.error(f"Erro ao buscar planos por valor {valor}: {str(e)}")
            return []
    
    def buscar_planos_por_duracao(self, duracao_dias: int) -> List[Plano]:
        """
        Busca planos pela duração em dias.
        
        Args:
            duracao_dias: Duração do plano em dias
            
        Returns:
            Lista de planos encontrados
        """
        query = "SELECT * FROM planos WHERE duracao_dias = ? AND ativo = 1 ORDER BY valor ASC"
        try:
            resultados = self.db.execute_query(query, (duracao_dias,))
            return [self._row_to_plano(row) for row in resultados]
        except Exception as e:
            logging.error(f"Erro ao buscar planos por duração {duracao_dias}: {str(e)}")
            return []
    
    def contar_planos(self, apenas_ativos: bool = True) -> int:
        """
        Conta o número de planos no banco de dados.
        
        Args:
            apenas_ativos: Se True, conta apenas planos ativos
            
        Returns:
            Número de planos
        """
        query = "SELECT COUNT(*) as count FROM planos WHERE ativo = 1" if apenas_ativos else "SELECT COUNT(*) as count FROM planos"
        try:
            resultado = self.db.execute_query(query)
            return resultado[0]['count'] if resultado else 0
        except Exception as e:
            logging.error(f"Erro ao contar planos (ativos={apenas_ativos}): {str(e)}")
            return 0
    
    def criar_planos_padrao(self):
        """Cria planos padrão se não existirem."""
        if self.contar_planos(apenas_ativos=False) > 0:
            return
        
        planos_padrao = [
            Plano(
                nome="Três Semanas",
                valor=100.00,
                duracao_dias=21,
                descricao="Plano de 3 semanas com treinos intensivos."
            ),
            Plano(
                nome="Cinco Semanas",
                valor=150.00,
                duracao_dias=35,
                descricao="Plano de 5 semanas com acompanhamento completo."
            ),
            Plano(
                nome="Avançado",
                valor=200.00,
                duracao_dias=30,
                descricao="Plano avançado para alunos experientes."
            ),
            Plano(
                nome="Básico",
                valor=120.00,
                duracao_dias=30,
                descricao="Plano básico para iniciantes."
            ),
            Plano(
                nome="Intermediário",
                valor=160.00,
                duracao_dias=30,
                descricao="Plano intermediário com treinos moderados."
            ),
            Plano(
                nome="Personalizado",
                valor=250.00,
                duracao_dias=30,
                descricao="Plano personalizado conforme objetivos do aluno."
            )
        ]
        
        for plano in planos_padrao:
            self.criar_plano(plano)
    
    def criar_assinatura(self, aluno_id: int, plano: Plano, data_inicio: date, data_fim: date, valor_pago: float) -> Optional[int]:
        """
        Cria uma nova assinatura para um aluno.
        
        Args:
            aluno_id: ID do aluno
            plano: Instância de Plano
            data_inicio: Data de início da assinatura
            data_fim: Data de término da assinatura
            valor_pago: Valor pago pela assinatura
            
        Returns:
            ID da assinatura criada ou None em caso de erro
        """
        if not plano.id or aluno_id <= 0:
            logging.error(f"Dados inválidos para criar assinatura: aluno_id={aluno_id}, plano_id={plano.id}")
            return None
        
        if data_fim < data_inicio:
            logging.error(f"Data de fim {data_fim} anterior à data de início {data_inicio}")
            return None
        
        query = '''
            INSERT INTO assinaturas (
                aluno_id, plano_id, plano_nome, plano_valor, plano_duracao_dias,
                plano_descricao, data_inicio, data_fim, valor_pago, ativo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        
        params = (
            aluno_id,
            plano.id,
            plano.nome,
            plano.valor,
            plano.duracao_dias,
            plano.descricao,
            data_inicio.isoformat(),
            data_fim.isoformat(),
            valor_pago,
            1
        )
        
        try:
            assinatura_id = self.db.execute_insert(query, params)
            return assinatura_id
        except Exception as e:
            logging.error(f"Erro ao criar assinatura para aluno_id={aluno_id}, plano_id={plano.id}: {str(e)}")
            return None
    
    def buscar_assinatura_ativa_por_aluno(self, aluno_id: int) -> Optional[dict]:
        """
        Busca a assinatura ativa de um aluno.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Dicionário com dados da assinatura ou None se não encontrada
        """
        query = '''
            SELECT * FROM assinaturas
            WHERE aluno_id = ? AND ativo = 1
            ORDER BY data_inicio DESC
            LIMIT 1
        '''
        try:
            resultados = self.db.execute_query(query, (aluno_id,))
            return resultados[0] if resultados else None
        except Exception as e:
            logging.error(f"Erro ao buscar assinatura ativa para aluno_id={aluno_id}: {str(e)}")
            return None
    
    def _row_to_plano(self, row) -> Plano:
        """
        Converte uma linha do banco de dados em uma instância de Plano.
        
        Args:
            row: Linha do resultado da query
            
        Returns:
            Instância de Plano
        """
        try:
            plano = Plano(
                nome=row['nome'],
                valor=row['valor'],
                duracao_dias=row['duracao_dias'],
                descricao=row['descricao'] or "",
                ativo=bool(row['ativo'])
            )
            
            plano.id = row['id']
            try:
                plano.data_criacao = datetime.strptime(row['data_criacao'], "%Y-%m-%d %H:%M:%S")
            except ValueError:
                plano.data_criacao = datetime.now()
            
            return plano
        except Exception as e:
            logging.error(f"Erro ao converter linha para Plano: {str(e)}")
            raise

# Instância global do DAO de planos
plano_dao = PlanoDAO()