#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - DAO Aluno

Este módulo contém o Data Access Object (DAO) para operações
com alunos no banco de dados, incluindo dados pessoais, objetivos e planos.
"""

import sqlite3
from typing import List, Optional, Dict
from datetime import datetime, date, timedelta
import sys
import os
import json
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
from data.database import db_manager

class AlunoDAO:
    """
    Data Access Object para operações com alunos.
    
    Responsável por todas as operações de CRUD (Create, Read, Update, Delete)
    relacionadas aos alunos no banco de dados, além de gerenciar planos.
    """
    
    def __init__(self):
        """Inicializa o DAO de alunos."""
        self.db = db_manager
    
    def criar_aluno(self, aluno: Aluno) -> Optional[int]:
        """
        Cria um novo aluno no banco de dados.
        
        Args:
            aluno: Instância de Aluno a ser criada
            
        Returns:
            ID do aluno criado ou None em caso de erro
        """
        query = '''
            INSERT INTO alunos (
                nome, cpf, data_nascimento, telefone, email, endereco,
                cidade, cep, profissao, contato_emergencia, telefone_emergencia,
                observacoes, ativo, data_cadastro, data_ultima_atualizacao,
                genero, grupo, modalidade, plano_id, objetivos, peso_desejado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        
        params = (
            aluno.nome,
            aluno.cpf,
            aluno.data_nascimento.isoformat() if aluno.data_nascimento else None,
            aluno.telefone,
            aluno.email,
            aluno.endereco,
            aluno.cidade,
            aluno.cep,
            aluno.profissao,
            aluno.contato_emergencia,
            aluno.telefone_emergencia,
            aluno.observacoes,
            aluno.ativo,
            aluno.data_cadastro.isoformat(),
            aluno.data_ultima_atualizacao.isoformat(),
            aluno.genero,
            aluno.grupo,
            aluno.modalidade,
            aluno.plano_id,
            json.dumps(aluno.objetivos) if aluno.objetivos else '[]',
            aluno.peso_desejado
        )
        
        try:
            aluno_id = self.db.execute_insert(query, params)
            aluno.id = aluno_id
            return aluno_id
        except sqlite3.Error as e:
            logging.error(f"Erro ao criar aluno: {str(e)}")
            return None
        except Exception as e:
            logging.error(f"Erro inesperado ao criar aluno: {str(e)}")
            return None
    
    def buscar_aluno_por_id(self, aluno_id: int) -> Optional[Aluno]:
        """
        Busca um aluno pelo ID.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Instância de Aluno ou None se não encontrado ou em caso de erro
        """
        query = "SELECT * FROM alunos WHERE id = ?"
        try:
            resultados = self.db.execute_query(query, (aluno_id,))
            if resultados:
                return self._row_to_aluno(resultados[0])
            return None
        except sqlite3.Error as e:
            logging.error(f"Erro ao buscar aluno por ID {aluno_id}: {str(e)}")
            return None
        except Exception as e:
            logging.error(f"Erro inesperado ao buscar aluno por ID {aluno_id}: {str(e)}")
            return None
    
    def buscar_alunos_por_nome(self, nome: str) -> List[Aluno]:
        """
        Busca alunos pelo nome (busca parcial).
        
        Args:
            nome: Nome ou parte do nome do aluno
            
        Returns:
            Lista de alunos encontrados ou lista vazia em caso de erro
        """
        query = "SELECT * FROM alunos WHERE nome LIKE ? ORDER BY nome"
        try:
            resultados = self.db.execute_query(query, (f"%{nome}%",))
            return [self._row_to_aluno(row) for row in resultados]
        except sqlite3.Error as e:
            logging.error(f"Erro ao buscar alunos por nome '{nome}': {str(e)}")
            return []
        except Exception as e:
            logging.error(f"Erro inesperado ao buscar alunos por nome '{nome}': {str(e)}")
            return []
    
    def listar_alunos_ativos(self) -> List[Aluno]:
        """
        Lista todos os alunos ativos.
        
        Returns:
            Lista de instâncias de Aluno que estão ativas.
        """
        query = "SELECT * FROM alunos WHERE ativo = 1 ORDER BY nome"
        try:
            resultados = self.db.execute_query(query)
            return [self._row_to_aluno(row) for row in resultados]
        except sqlite3.Error as e:
            logging.error(f"Erro ao listar alunos ativos: {str(e)}")
            return []
        except Exception as e:
            logging.error(f"Erro inesperado ao listar alunos ativos: {str(e)}")
            return []
    
    def buscar_aluno_por_cpf(self, cpf: str) -> Optional[Aluno]:
        """
        Busca um aluno pelo CPF.
        
        Args:
            cpf: CPF do aluno
            
        Returns:
            Instância de Aluno ou None se não encontrado ou em caso de erro
        """
        query = "SELECT * FROM alunos WHERE cpf = ?"
        try:
            resultados = self.db.execute_query(query, (cpf,))
            if resultados:
                return self._row_to_aluno(resultados[0])
            return None
        except sqlite3.Error as e:
            logging.error(f"Erro ao buscar aluno por CPF '{cpf}': {str(e)}")
            return None
        except Exception as e:
            logging.error(f"Erro inesperado ao buscar aluno por CPF '{cpf}': {str(e)}")
            return None
    
    def listar_todos_alunos(self, apenas_ativos: bool = True) -> List[Aluno]:
        """
        Lista todos os alunos.
        
        Args:
            apenas_ativos: Se True, lista apenas alunos ativos
            
        Returns:
            Lista de todos os alunos ou lista vazia em caso de erro
        """
        if apenas_ativos:
            query = "SELECT * FROM alunos WHERE ativo = 1 ORDER BY nome"
        else:
            query = "SELECT * FROM alunos ORDER BY nome"
        
        try:
            resultados = self.db.execute_query(query)
            return [self._row_to_aluno(row) for row in resultados]
        except sqlite3.Error as e:
            logging.error(f"Erro ao listar alunos (ativos={apenas_ativos}): {str(e)}")
            return []
        except Exception as e:
            logging.error(f"Erro inesperado ao listar alunos (ativos={apenas_ativos}): {str(e)}")
            return []
    
    def atualizar_aluno(self, aluno: Aluno) -> bool:
        """
        Atualiza um aluno no banco de dados.
        
        Args:
            aluno: Instância de Aluno com dados atualizados
            
        Returns:
            True se a atualização foi bem-sucedida, False em caso de erro
        """
        aluno.data_ultima_atualizacao = datetime.now()
        
        query = '''
            UPDATE alunos SET
                nome = ?, cpf = ?, data_nascimento = ?, telefone = ?, email = ?,
                endereco = ?, cidade = ?, cep = ?, profissao = ?,
                contato_emergencia = ?, telefone_emergencia = ?, observacoes = ?,
                ativo = ?, data_ultima_atualizacao = ?, genero = ?, grupo = ?,
                modalidade = ?, plano_id = ?, objetivos = ?, peso_desejado = ?
            WHERE id = ?
        '''
        
        params = (
            aluno.nome,
            aluno.cpf,
            aluno.data_nascimento.isoformat() if aluno.data_nascimento else None,
            aluno.telefone,
            aluno.email,
            aluno.endereco,
            aluno.cidade,
            aluno.cep,
            aluno.profissao,
            aluno.contato_emergencia,
            aluno.telefone_emergencia,
            aluno.observacoes,
            aluno.ativo,
            aluno.data_ultima_atualizacao.isoformat(),
            aluno.genero,
            aluno.grupo,
            aluno.modalidade,
            aluno.plano_id,
            json.dumps(aluno.objetivos) if aluno.objetivos else '[]',
            aluno.peso_desejado,
            aluno.id
        )
        
        try:
            linhas_afetadas = self.db.execute_update(query, params)
            return linhas_afetadas > 0
        except sqlite3.Error as e:
            logging.error(f"Erro ao atualizar aluno ID {aluno.id}: {str(e)}")
            return False
        except Exception as e:
            logging.error(f"Erro inesperado ao atualizar aluno ID {aluno.id}: {str(e)}")
            return False
    
    def desativar_aluno(self, aluno_id: int) -> bool:
        """
        Desativa um aluno no banco de dados e suas assinaturas ativas.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            True se a desativação foi bem-sucedida, False em caso de erro
        """
        try:
            # Desativar assinaturas ativas
            query_assinatura = "UPDATE assinaturas SET ativo = 0 WHERE aluno_id = ? AND ativo = 1"
            self.db.execute_update(query_assinatura, (aluno_id,))
            
            # Desativar aluno
            query_aluno = "UPDATE alunos SET ativo = 0, data_ultima_atualizacao = ? WHERE id = ?"
            params = (datetime.now().isoformat(), aluno_id)
            linhas_afetadas = self.db.execute_update(query_aluno, params)
            return linhas_afetadas > 0
        except sqlite3.Error as e:
            logging.error(f"Erro ao desativar aluno ID {aluno_id}: {str(e)}")
            return False
        except Exception as e:
            logging.error(f"Erro inesperado ao desativar aluno ID {aluno_id}: {str(e)}")
            return False
    
    def reativar_aluno(self, aluno_id: int) -> bool:
        """
        Reativa um aluno no banco de dados.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            True se a reativação foi bem-sucedida, False em caso de erro
        """
        query = "UPDATE alunos SET ativo = 1, data_ultima_atualizacao = ? WHERE id = ?"
        params = (datetime.now().isoformat(), aluno_id)
        
        try:
            linhas_afetadas = self.db.execute_update(query, params)
            return linhas_afetadas > 0
        except sqlite3.Error as e:
            logging.error(f"Erro ao reativar aluno ID {aluno_id}: {str(e)}")
            return False
        except Exception as e:
            logging.error(f"Erro inesperado ao reativar aluno ID {aluno_id}: {str(e)}")
            return False
    
    def excluir_aluno(self, aluno_id: int) -> tuple[bool, str]:
        """
        Exclui um aluno do banco de dados e todos os dados relacionados (exclusão em cascata).
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Tupla (True, "") se a exclusão foi bem-sucedida, ou (False, "Mensagem de erro") em caso de erro
        """
        try:
            # Verificar se existem avaliações físicas vinculadas
            query_check_avaliacoes = "SELECT COUNT(*) FROM avaliacoes_fisicas WHERE aluno_id = ?"
            if self.db.execute_query(query_check_avaliacoes, (aluno_id,))[0][0] > 0:
                return False, "Não é possível excluir o aluno. Existem avaliações físicas vinculadas a ele. Por favor, exclua as avaliações primeiro."

            # Verificar se existem anamneses vinculadas
            query_check_anamneses = "SELECT COUNT(*) FROM anamnese_nutricional WHERE aluno_id = ?"
            if self.db.execute_query(query_check_anamneses, (aluno_id,))[0][0] > 0:
                return False, "Não é possível excluir o aluno. Existem anamneses vinculadas a ele. Por favor, exclua as anamneses primeiro."

            # Verificar se existem pagamentos vinculados
            query_check_pagamentos = "SELECT COUNT(*) FROM pagamentos WHERE aluno_id = ?"
            if self.db.execute_query(query_check_pagamentos, (aluno_id,))[0][0] > 0:
                return False, "Não é possível excluir o aluno. Existem pagamentos vinculados a ele. Por favor, exclua os pagamentos primeiro."

            # Verificar se existem treinos vinculados
            query_check_treinos = "SELECT COUNT(*) FROM aluno_treinos WHERE aluno_id = ?"
            if self.db.execute_query(query_check_treinos, (aluno_id,))[0][0] > 0:
                return False, "Não é possível excluir o aluno. Existem treinos vinculados a ele. Por favor, exclua os treinos primeiro."

            # Finalmente, excluir o aluno
            query_aluno = "DELETE FROM alunos WHERE id = ?"
            linhas_afetadas = self.db.execute_delete(query_aluno, (aluno_id,))
            
            if linhas_afetadas > 0:
                return True, ""
            else:
                return False, "Aluno não encontrado ou já excluído."
        except sqlite3.Error as e:
            logging.error(f"Erro ao excluir aluno ID {aluno_id}: {str(e)}")
            return False, f"Erro no banco de dados ao tentar excluir o aluno: {str(e)}"
        except Exception as e:
            logging.error(f"Erro inesperado ao excluir aluno ID {aluno_id}: {str(e)}")
            return False, f"Ocorreu um erro inesperado ao tentar excluir o aluno: {str(e)}"
    
    def contar_alunos(self, apenas_ativos: bool = True) -> int:
        """
        Conta o número total de alunos.
        
        Args:
            apenas_ativos: Se True, conta apenas alunos ativos
            
        Returns:
            Número total de alunos ou 0 em caso de erro
        """
        if apenas_ativos:
            query = "SELECT COUNT(*) FROM alunos WHERE ativo = 1"
        else:
            query = "SELECT COUNT(*) FROM alunos"
        
        try:
            resultado = self.db.execute_query(query)
            return resultado[0][0] if resultado else 0
        except sqlite3.Error as e:
            logging.error(f"Erro ao contar alunos (ativos={apenas_ativos}): {str(e)}")
            return 0
        except Exception as e:
            logging.error(f"Erro inesperado ao contar alunos (ativos={apenas_ativos}): {str(e)}")
            return 0
    
    def buscar_alunos_por_filtro(self, 
                                nome: str = "",
                                cidade: str = "",
                                ativo: Optional[bool] = None) -> List[Aluno]:
        """
        Busca alunos aplicando múltiplos filtros.
        
        Args:
            nome: Filtro por nome (busca parcial)
            cidade: Filtro por cidade (busca parcial)
            ativo: Filtro por status ativo
            
        Returns:
            Lista de alunos que atendem aos filtros ou lista vazia em caso de erro
        """
        conditions = []
        params = []
        
        if nome:
            conditions.append("nome LIKE ?")
            params.append(f"%{nome}%")
        
        if cidade:
            conditions.append("cidade LIKE ?")
            params.append(f"%{cidade}%")
        
        if ativo is not None:
            conditions.append("ativo = ?")
            params.append(ativo)
        
        query = "SELECT * FROM alunos"
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY nome"
        
        try:
            resultados = self.db.execute_query(query, tuple(params))
            return [self._row_to_aluno(row) for row in resultados]
        except sqlite3.Error as e:
            logging.error(f"Erro ao buscar alunos por filtro (nome={nome}, cidade={cidade}, ativo={ativo}): {str(e)}")
            return []
        except Exception as e:
            logging.error(f"Erro inesperado ao buscar alunos por filtro (nome={nome}, cidade={cidade}, ativo={ativo}): {str(e)}")
            return []
    
    def listar_planos(self) -> List[Dict]:
        """
        Lista todos os planos disponíveis no banco de dados.
        
        Returns:
            Lista de dicionários com id e nome dos planos ou lista vazia em caso de erro
        """
        query = "SELECT id, nome FROM planos WHERE ativo = 1 ORDER BY nome"
        try:
            resultados = self.db.execute_query(query)
            return [{"id": row["id"], "nome": row["nome"]} for row in resultados]
        except sqlite3.Error as e:
            logging.error(f"Erro ao listar planos: {str(e)}")
            return []
        except Exception as e:
            logging.error(f"Erro inesperado ao listar planos: {str(e)}")
            return []
    
    def buscar_plano_por_id(self, plano_id: int) -> Optional[Dict]:
        """
        Busca um plano pelo ID.
        
        Args:
            plano_id: ID do plano
            
        Returns:
            Dicionário com id, nome, valor e duracao_dias do plano ou None se não encontrado ou em caso de erro
        """
        query = "SELECT id, nome, valor, duracao_dias FROM planos WHERE id = ?"
        try:
            resultados = self.db.execute_query(query, (plano_id,))
            return resultados[0] if resultados else None
        except sqlite3.Error as e:
            logging.error(f"Erro ao buscar plano por ID {plano_id}: {str(e)}")
            return None
        except Exception as e:
            logging.error(f"Erro inesperado ao buscar plano por ID {plano_id}: {str(e)}")
            return None
    
    def criar_assinatura(self, aluno_id: int, plano_id: int) -> Optional[int]:
        """
        Cria uma assinatura vinculada ao aluno com os dados do plano no momento atual.

        Args:
            aluno_id: ID do aluno
            plano_id: ID do plano

        Returns:
            ID da assinatura criada ou None em caso de erro
        """
        try:
            plano = self.buscar_plano_por_id(plano_id)
            if not plano:
                logging.error(f"Plano ID {plano_id} não encontrado ao criar assinatura para aluno ID {aluno_id}.")
                return None

            data_inicio = date.today()
            data_fim = data_inicio + timedelta(days=plano["duracao_dias"])
            valor_pago = plano["valor"]

            query = '''
                INSERT INTO assinaturas (aluno_id, plano_id, data_inicio, data_fim, valor_pago, ativo)
                VALUES (?, ?, ?, ?, ?, ?)
            '''
            params = (aluno_id, plano_id, data_inicio.isoformat(), data_fim.isoformat(), valor_pago, 1)

            assinatura_id = self.db.execute_insert(query, params)
            return assinatura_id

        except sqlite3.Error as e:
            logging.error(f"Erro ao criar assinatura para aluno ID {aluno_id}, plano ID {plano_id}: {str(e)}")
            return None
        except Exception as e:
            logging.error(f"Erro inesperado ao criar assinatura para aluno ID {aluno_id}, plano ID {plano_id}: {str(e)}")
            return None
    
    def buscar_assinatura_ativa_por_aluno(self, aluno_id: int) -> Optional[Dict]:
        """
        Busca a assinatura ativa de um aluno.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Dicionário com dados da assinatura ativa ou None se não encontrada
        """
        query = '''
            SELECT a.*, p.nome as plano_nome, p.descricao as plano_descricao
            FROM assinaturas a
            JOIN planos p ON a.plano_id = p.id
            WHERE a.aluno_id = ? AND a.ativo = 1
            ORDER BY a.data_inicio DESC
            LIMIT 1
        '''
        try:
            resultados = self.db.execute_query(query, (aluno_id,))
            if resultados:
                row = resultados[0]
                return {
                    'id': row['id'],
                    'aluno_id': row['aluno_id'],
                    'plano_id': row['plano_id'],
                    'plano_nome': row['plano_nome'],
                    'plano_valor': row['valor_pago'],
                    'plano_duracao_dias': (datetime.strptime(row['data_fim'], "%Y-%m-%d") - 
                                         datetime.strptime(row['data_inicio'], "%Y-%m-%d")).days,
                    'plano_descricao': row['plano_descricao'],
                    'data_inicio': row['data_inicio'],
                    'data_fim': row['data_fim'],
                    'valor_pago': row['valor_pago'],
                    'ativo': row['ativo']
                }
            return None
        except sqlite3.Error as e:
            logging.error(f"Erro ao buscar assinatura ativa para aluno ID {aluno_id}: {str(e)}")
            return None
        except Exception as e:
            logging.error(f"Erro inesperado ao buscar assinatura ativa para aluno ID {aluno_id}: {str(e)}")
            return None
    
    def _row_to_aluno(self, row: sqlite3.Row) -> Aluno:
        """
        Converte uma linha do banco de dados em um objeto Aluno.
        
        Args:
            row: Linha do banco de dados
            
        Returns:
            Instância de Aluno
            
        Raises:
            sqlite3.Error: Em caso de erro na conversão
        """
        try:
            aluno = Aluno(
                nome=row['nome'],
                cpf=row['cpf'] or "",
                data_nascimento=datetime.fromisoformat(row['data_nascimento']).date() 
                               if row['data_nascimento'] else None,
                telefone=row['telefone'] or "",
                email=row['email'] or "",
                endereco=row['endereco'] or "",
                cidade=row['cidade'] or "",
                cep=row['cep'] or "",
                profissao=row['profissao'] or "",
                contato_emergencia=row['contato_emergencia'] or "",
                telefone_emergencia=row['telefone_emergencia'] or "",
                observacoes=row['observacoes'] or "",
                ativo=bool(row['ativo']),
                genero=row['genero'] or "",
                grupo=row['grupo'] or "",
                modalidade=row['modalidade'] or "",
                plano_id=row['plano_id'],
                objetivos=json.loads(row['objetivos']) if row['objetivos'] else [],
                peso_desejado=row['peso_desejado']
            )
            
            aluno.id = row['id']
            aluno.data_cadastro = datetime.fromisoformat(row['data_cadastro'])
            aluno.data_ultima_atualizacao = datetime.fromisoformat(row['data_ultima_atualizacao'])
            return aluno
        except sqlite3.Error as e:
            logging.error(f"Erro ao converter linha para Aluno: {str(e)}")
            raise
        except Exception as e:
            logging.error(f"Erro inesperado ao converter linha para Aluno: {str(e)}")
            raise

# Instância global do DAO de alunos
aluno_dao = AlunoDAO()