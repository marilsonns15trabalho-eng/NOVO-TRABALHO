#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - DAO Pagamento

Este módulo contém o Data Access Object (DAO) para operações
com pagamentos no banco de dados.
"""

import logging
from typing import List, Optional
from datetime import datetime, date
import sys
import os

# Adicionar o diretório pai ao path para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.pagamento import Pagamento
from data.database import db_manager

class PagamentoDAO:
    """
    Data Access Object para operações com pagamentos.
    
    Responsável por todas as operações de CRUD (Create, Read, Update, Delete)
    relacionadas aos pagamentos no banco de dados.
    """
    
    def __init__(self):
        """Inicializa o DAO de pagamentos."""
        self.db = db_manager
    
    def criar_pagamento(self, pagamento: Pagamento) -> int:
        """
        Cria um novo pagamento no banco de dados.
        
        Args:
            pagamento: Instância de Pagamento a ser criada
            
        Returns:
            ID do pagamento criado
            
        Raises:
            ValueError: Se o status não for válido
        """
        status_validos = ['pago', 'pendente', 'vencido', 'cancelado']
        if pagamento.status.lower() not in status_validos:
            raise ValueError(f"Status inválido: {pagamento.status}. Status válidos: {status_validos}")
        
        query = '''
            INSERT INTO pagamentos (
                aluno_id, assinatura_id, valor, data_pagamento, data_vencimento,
                metodo_pagamento, status, observacoes, numero_boleto, data_criacao
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        
        params = (
            pagamento.aluno_id,
            pagamento.assinatura_id,
            pagamento.valor,
            pagamento.data_pagamento.isoformat(),
            pagamento.data_vencimento.isoformat() if pagamento.data_vencimento else None,
            pagamento.metodo_pagamento,
            pagamento.status.lower(),  # Armazenar em lowercase
            pagamento.observacoes,
            pagamento.numero_boleto,
            pagamento.data_criacao.isoformat()
        )
        
        pagamento_id = self.db.execute_insert(query, params)
        pagamento.id = pagamento_id
        return pagamento_id
    
    def buscar_pagamento_por_id(self, pagamento_id: int) -> Optional[Pagamento]:
        """
        Busca um pagamento pelo ID.
        
        Args:
            pagamento_id: ID do pagamento
            
        Returns:
            Instância de Pagamento ou None se não encontrado
        """
        query = "SELECT * FROM pagamentos WHERE id = ?"
        resultados = self.db.execute_query(query, (pagamento_id,))
        
        if resultados:
            return self._row_to_pagamento(resultados[0])
        return None
    
    def buscar_pagamentos_por_aluno(self, aluno_id: int) -> List[Pagamento]:
        """
        Busca todos os pagamentos de um aluno.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Lista de pagamentos do aluno
        """
        query = "SELECT * FROM pagamentos WHERE aluno_id = ? ORDER BY data_pagamento DESC"
        resultados = self.db.execute_query(query, (aluno_id,))
        
        return [self._row_to_pagamento(row) for row in resultados]
    
    def buscar_pagamento_por_numero_boleto(self, numero_boleto: str) -> Optional[Pagamento]:
        """
        Busca um pagamento pelo número do boleto.
        
        Args:
            numero_boleto: Número do boleto
            
        Returns:
            Instância de Pagamento ou None se não encontrado
        """
        query = "SELECT * FROM pagamentos WHERE numero_boleto = ?"
        resultados = self.db.execute_query(query, (numero_boleto,))
        
        if resultados:
            return self._row_to_pagamento(resultados[0])
        return None
    
    def listar_todos_pagamentos(self, limite: Optional[int] = None) -> List[Pagamento]:
        """
        Lista todos os pagamentos.
        
        Args:
            limite: Número máximo de registros a retornar
            
        Returns:
            Lista de todos os pagamentos
        """
        query = "SELECT * FROM pagamentos ORDER BY data_pagamento DESC"
        if limite:
            query += f" LIMIT {limite}"
        
        resultados = self.db.execute_query(query)
        return [self._row_to_pagamento(row) for row in resultados]
    
    def buscar_pagamentos_por_periodo(self, 
                                     data_inicio: date, 
                                     data_fim: date) -> List[Pagamento]:
        """
        Busca pagamentos em um período específico.
        
        Args:
            data_inicio: Data de início do período
            data_fim: Data de fim do período
            
        Returns:
            Lista de pagamentos no período
        """
        query = '''
            SELECT * FROM pagamentos 
            WHERE data_pagamento BETWEEN ? AND ? 
            ORDER BY data_pagamento DESC
        '''
        
        params = (data_inicio.isoformat(), data_fim.isoformat())
        resultados = self.db.execute_query(query, params)
        
        return [self._row_to_pagamento(row) for row in resultados]
    
    def buscar_pagamentos_por_status(self, status: str) -> List[Pagamento]:
        """
        Busca pagamentos por status.
        
        Args:
            status: Status dos pagamentos (pago, pendente, vencido, cancelado)
            
        Returns:
            Lista de pagamentos com o status especificado
        """
        query = "SELECT * FROM pagamentos WHERE LOWER(status) = ? ORDER BY data_pagamento DESC"
        resultados = self.db.execute_query(query, (status.lower(),))
        
        return [self._row_to_pagamento(row) for row in resultados]
    
    def buscar_pagamentos_por_metodo(self, metodo_pagamento: str) -> List[Pagamento]:
        """
        Busca pagamentos por método de pagamento.
        
        Args:
            metodo_pagamento: Método de pagamento
            
        Returns:
            Lista de pagamentos com o método especificado
        """
        query = "SELECT * FROM pagamentos WHERE metodo_pagamento = ? ORDER BY data_pagamento DESC"
        resultados = self.db.execute_query(query, (metodo_pagamento,))
        
        return [self._row_to_pagamento(row) for row in resultados]
    
    def atualizar_pagamento(self, pagamento: Pagamento) -> bool:
        """
        Atualiza um pagamento no banco de dados.
        
        Args:
            pagamento: Instância de Pagamento com dados atualizados
            
        Returns:
            True se a atualização foi bem-sucedida
        """
        query = '''
            UPDATE pagamentos SET
                aluno_id = ?, assinatura_id = ?, valor = ?, data_pagamento = ?,
                data_vencimento = ?, metodo_pagamento = ?, status = ?,
                observacoes = ?, numero_boleto = ?
            WHERE id = ?
        '''
        
        params = (
            pagamento.aluno_id,
            pagamento.assinatura_id,
            pagamento.valor,
            pagamento.data_pagamento.isoformat(),
            pagamento.data_vencimento.isoformat() if pagamento.data_vencimento else None,
            pagamento.metodo_pagamento,
            pagamento.status,
            pagamento.observacoes,
            pagamento.numero_boleto,
            pagamento.id
        )
        
        linhas_afetadas = self.db.execute_update(query, params)
        return linhas_afetadas > 0
    
    def excluir_pagamento(self, pagamento_id: int) -> bool:
        """
        Exclui permanentemente um pagamento do banco de dados.
        
        ATENÇÃO: Esta operação é irreversível!
        
        Args:
            pagamento_id: ID do pagamento a ser excluído
            
        Returns:
            True se a exclusão foi bem-sucedida
        """
        query = "DELETE FROM pagamentos WHERE id = ?"
        linhas_afetadas = self.db.execute_delete(query, (pagamento_id,))
        return linhas_afetadas > 0
    
    def calcular_total_por_periodo(self, 
                                  data_inicio: date, 
                                  data_fim: date,
                                  status: str = 'pago') -> float:
        """
        Calcula o total de pagamentos em um período.
        
        Args:
            data_inicio: Data de início do período
            data_fim: Data de fim do período
            status: Status dos pagamentos a considerar
            
        Returns:
            Valor total dos pagamentos
        """
        query = '''
            SELECT SUM(valor) FROM pagamentos 
            WHERE data_pagamento BETWEEN ? AND ? AND status = ?
        '''
        
        params = (data_inicio.isoformat(), data_fim.isoformat(), status)
        resultado = self.db.execute_query(query, params)
        
        return resultado[0][0] if resultado and resultado[0][0] else 0.0
    
    def calcular_total_por_aluno(self, aluno_id: int, status: str = 'pago') -> float:
        """
        Calcula o total pago por um aluno.
        
        Args:
            aluno_id: ID do aluno
            status: Status dos pagamentos a considerar
            
        Returns:
            Valor total pago pelo aluno
        """
        query = "SELECT SUM(valor) FROM pagamentos WHERE aluno_id = ? AND status = ?"
        resultado = self.db.execute_query(query, (aluno_id, status))
        
        return resultado[0][0] if resultado and resultado[0][0] else 0.0
    
    def contar_pagamentos_por_status(self) -> dict:
        """
        Conta pagamentos agrupados por status.
        
        Returns:
            Dicionário com contagem por status
        """
        query = "SELECT status, COUNT(*) FROM pagamentos GROUP BY status"
        resultados = self.db.execute_query(query)
        
        return {row[0]: row[1] for row in resultados}
    
    def buscar_pagamentos_vencidos(self) -> List[Pagamento]:
        """
        Busca pagamentos vencidos (data de vencimento passou e status não é 'pago').
        
        Returns:
            Lista de pagamentos vencidos
        """
        hoje = date.today().isoformat()
        query = '''
            SELECT * FROM pagamentos 
            WHERE data_vencimento < ? AND status != 'pago'
            ORDER BY data_vencimento ASC
        '''
        
        resultados = self.db.execute_query(query, (hoje,))
        return [self._row_to_pagamento(row) for row in resultados]
    
    def _row_to_pagamento(self, row) -> Pagamento:
        """
        Converte uma linha do banco de dados em uma instância de Pagamento.
        
        Args:
            row: Linha do resultado da query
            
        Returns:
            Instância de Pagamento
        """
        pagamento = Pagamento(
            aluno_id=row["aluno_id"],
            valor=row["valor"],
            data_pagamento=datetime.fromisoformat(row["data_pagamento"]).date(),
            data_vencimento=datetime.fromisoformat(row["data_vencimento"]).date() 
                           if row["data_vencimento"] else None,
            metodo_pagamento=row["metodo_pagamento"] or "Dinheiro",
            status=row["status"].lower() if row["status"] else "pago",  # Garantir lowercase
            observacoes=row["observacoes"] or "",
            assinatura_id=row["assinatura_id"]
        )
        
        pagamento.id = row["id"]
        pagamento.numero_boleto = row["numero_boleto"]
        pagamento.data_criacao = datetime.fromisoformat(row["data_criacao"])
        
        return pagamento
    
    def atualizar_status_vencidos(self) -> int:
        """
        Atualiza o status de pagamentos pendentes com data de vencimento expirada para 'vencido'.
        
        Returns:
            Número de pagamentos atualizados
        """
        hoje = date.today().isoformat()
        query = '''
            UPDATE pagamentos 
            SET status = 'vencido'
            WHERE status = 'pendente' AND data_vencimento < ?
        '''
        try:
            linhas_afetadas = self.db.execute_update(query, (hoje,))
            return linhas_afetadas
        except Exception as e:
            logging.error(f"Erro ao atualizar status de pagamentos vencidos: {str(e)}")
            return 0

# Instância global do DAO de pagamentos
pagamento_dao = PagamentoDAO()