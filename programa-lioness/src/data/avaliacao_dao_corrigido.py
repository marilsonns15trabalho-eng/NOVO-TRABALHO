#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - DAO Avaliação Física

Este módulo contém o Data Access Object (DAO) para operações
com avaliação física no banco de dados SQLite.
"""

from typing import List, Optional
from datetime import datetime, date
import sys
import os

# Adicionar o diretório pai ao path para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.avaliacao_fisica import AvaliacaoFisica
from data.database import db_manager

class AvaliacaoDAO:
    """
    Data Access Object para operações com avaliação física.
    
    Responsável por todas as operações de CRUD (Create, Read, Update, Delete)
    relacionadas às avaliações físicas no banco de dados, além de cálculos de evolução e estatísticas.
    """
    
    def __init__(self):
        """Inicializa o DAO de avaliação física."""
        self.db = db_manager
    
    def salvar_avaliacao(self, avaliacao: AvaliacaoFisica) -> bool:
        """
        Salva uma avaliação no banco de dados.
        
        Se a avaliação já tiver um ID, atualiza; caso contrário, cria uma nova.
        Antes de salvar, executa os cálculos necessários.
        
        Args:
            avaliacao: Instância de AvaliacaoFisica a ser salva
            
        Returns:
            True se a operação foi bem-sucedida, False em caso de erro
        """
        # Executar cálculos antes de salvar
        avaliacao.calcular_resultados()
        
        if avaliacao.id:
            # Atualizar avaliação existente
            return self.atualizar_avaliacao(avaliacao)
        else:
            # Criar nova avaliação
            avaliacao_id = self.criar_avaliacao(avaliacao)
            return avaliacao_id is not None
    
    def criar_avaliacao(self, avaliacao: AvaliacaoFisica) -> int:
        """
        Cria uma nova avaliação física no banco de dados.
        
        Args:
            avaliacao: Instância de AvaliacaoFisica a ser criada
            
        Returns:
            ID da avaliação criada
        """
        query = '''
            INSERT INTO avaliacoes_fisicas (
                aluno_id, data_avaliacao, peso, altura, percentual_gordura, massa_muscular,
                massa_gorda, imc, rcq, peso_ideal, peso_residual, protocolo,
                circunferencia_pescoco, circunferencia_ombro, circunferencia_peito,
                circunferencia_cintura, circunferencia_abdomen, circunferencia_quadril,
                circunferencia_braco_esq, circunferencia_braco_dir, circunferencia_coxa_esq,
                circunferencia_coxa_dir, circunferencia_panturrilha_esq, circunferencia_panturrilha_dir,
                dobra_triceps, dobra_subescapular, dobra_suprailiaca, dobra_abdominal,
                dobra_peitoral, dobra_axilar_media, dobra_coxa, pressao_arterial,
                frequencia_cardiaca, observacoes, data_criacao
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        
        params = (
            avaliacao.aluno_id,
            avaliacao.data_avaliacao.isoformat(),
            avaliacao.peso,
            avaliacao.altura,
            avaliacao.percentual_gordura,
            avaliacao.massa_muscular,
            avaliacao.massa_gorda,
            avaliacao.imc,
            avaliacao.relacao_cintura_quadril,  # Corrigido de 'rcq' para 'relacao_cintura_quadril'
            avaliacao.peso_ideal,
            avaliacao.peso_residual,
            avaliacao.protocolo,
            avaliacao.circunferencia_pescoco,
            avaliacao.circunferencia_ombro,
            avaliacao.circunferencia_peito,
            avaliacao.circunferencia_cintura,
            avaliacao.circunferencia_abdomen,
            avaliacao.circunferencia_quadril,
            avaliacao.circunferencia_braco_esq,
            avaliacao.circunferencia_braco_dir,
            avaliacao.circunferencia_coxa_esq,
            avaliacao.circunferencia_coxa_dir,
            avaliacao.circunferencia_panturrilha_esq,
            avaliacao.circunferencia_panturrilha_dir,
            avaliacao.dobra_triceps,
            avaliacao.dobra_subescapular,
            avaliacao.dobra_suprailiaca,
            avaliacao.dobra_abdominal,
            avaliacao.dobra_peitoral,
            avaliacao.dobra_axilar_media,
            avaliacao.dobra_coxa,
            avaliacao.pressao_arterial,
            avaliacao.frequencia_cardiaca,
            avaliacao.observacoes,
            avaliacao.data_criacao.isoformat()
        )
        
        avaliacao_id = self.db.execute_insert(query, params)
        avaliacao.id = avaliacao_id
        return avaliacao_id
    
    def buscar_avaliacao_por_id(self, avaliacao_id: int) -> Optional[AvaliacaoFisica]:
        """
        Busca uma avaliação pelo ID.
        
        Args:
            avaliacao_id: ID da avaliação
            
        Returns:
            Instância de AvaliacaoFisica ou None se não encontrada
        """
        query = "SELECT * FROM avaliacoes_fisicas WHERE id = ?"
        resultados = self.db.execute_query(query, (avaliacao_id,))
        
        if resultados:
            avaliacao = self._row_to_avaliacao(resultados[0])
            avaliacao.calcular_resultados()
            return avaliacao
        return None
    
    def buscar_avaliacoes_por_aluno(self, aluno_id: int) -> List[AvaliacaoFisica]:
        """
        Busca todas as avaliações de um aluno.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Lista de avaliações do aluno
        """
        query = '''
            SELECT * FROM avaliacoes_fisicas 
            WHERE aluno_id = ? 
            ORDER BY data_avaliacao DESC
        '''
        resultados = self.db.execute_query(query, (aluno_id,))
        
        return [self._row_to_avaliacao(row) for row in resultados]
    
    def buscar_avaliacao_mais_recente(self, aluno_id: int) -> Optional[AvaliacaoFisica]:
        """
        Busca a avaliação mais recente de um aluno.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Avaliação mais recente ou None se não encontrada
        """
        query = '''
            SELECT * FROM avaliacoes_fisicas 
            WHERE aluno_id = ? 
            ORDER BY data_avaliacao DESC 
            LIMIT 1
        '''
        resultados = self.db.execute_query(query, (aluno_id,))
        
        if resultados:
            return self._row_to_avaliacao(resultados[0])
        return None
    
    def listar_todas_avaliacoes(self, limite: int = 100) -> List[AvaliacaoFisica]:
        """
        Lista todas as avaliações físicas.
        
        Args:
            limite: Número máximo de registros a retornar
            
        Returns:
            Lista de todas as avaliações
        """
        query = '''
            SELECT * FROM avaliacoes_fisicas 
            ORDER BY data_avaliacao DESC 
            LIMIT ?
        '''
        resultados = self.db.execute_query(query, (limite,))
        
        return [self._row_to_avaliacao(row) for row in resultados]
    
    def atualizar_avaliacao(self, avaliacao: AvaliacaoFisica) -> bool:
        """
        Atualiza uma avaliação no banco de dados.
        
        Args:
            avaliacao: Instância de AvaliacaoFisica com dados atualizados
            
        Returns:
            True se a atualização foi bem-sucedida
        """
        query = '''
            UPDATE avaliacoes_fisicas SET
                data_avaliacao = ?, peso = ?, altura = ?, percentual_gordura = ?,
                massa_muscular = ?, massa_gorda = ?, imc = ?, rcq = ?, peso_ideal = ?,
                peso_residual = ?, protocolo = ?, circunferencia_pescoco = ?,
                circunferencia_ombro = ?, circunferencia_peito = ?, circunferencia_cintura = ?,
                circunferencia_abdomen = ?, circunferencia_quadril = ?,
                circunferencia_braco_esq = ?, circunferencia_braco_dir = ?,
                circunferencia_coxa_esq = ?, circunferencia_coxa_dir = ?,
                circunferencia_panturrilha_esq = ?, circunferencia_panturrilha_dir = ?,
                dobra_triceps = ?, dobra_subescapular = ?, dobra_suprailiaca = ?,
                dobra_abdominal = ?, dobra_peitoral = ?, dobra_axilar_media = ?,
                dobra_coxa = ?, pressao_arterial = ?, frequencia_cardiaca = ?, observacoes = ?
            WHERE id = ?
        '''
        
        params = (
            avaliacao.data_avaliacao.isoformat(),
            avaliacao.peso,
            avaliacao.altura,
            avaliacao.percentual_gordura,
            avaliacao.massa_muscular,
            avaliacao.massa_gorda,
            avaliacao.imc,
            avaliacao.relacao_cintura_quadril,  # Corrigido de 'rcq' para 'relacao_cintura_quadril'
            avaliacao.peso_ideal,
            avaliacao.peso_residual,
            avaliacao.protocolo,
            avaliacao.circunferencia_pescoco,
            avaliacao.circunferencia_ombro,
            avaliacao.circunferencia_peito,
            avaliacao.circunferencia_cintura,
            avaliacao.circunferencia_abdomen,
            avaliacao.circunferencia_quadril,
            avaliacao.circunferencia_braco_esq,
            avaliacao.circunferencia_braco_dir,
            avaliacao.circunferencia_coxa_esq,
            avaliacao.circunferencia_coxa_dir,
            avaliacao.circunferencia_panturrilha_esq,
            avaliacao.circunferencia_panturrilha_dir,
            avaliacao.dobra_triceps,
            avaliacao.dobra_subescapular,
            avaliacao.dobra_suprailiaca,
            avaliacao.dobra_abdominal,
            avaliacao.dobra_peitoral,
            avaliacao.dobra_axilar_media,
            avaliacao.dobra_coxa,
            avaliacao.pressao_arterial,
            avaliacao.frequencia_cardiaca,
            avaliacao.observacoes,
            avaliacao.id
        )
        
        return self.db.execute_update(query, params) > 0
    
    def excluir_avaliacao(self, avaliacao_id: int) -> bool:
        """
        Exclui uma avaliação do banco de dados.
        
        Args:
            avaliacao_id: ID da avaliação a ser excluída
            
        Returns:
            True se a exclusão foi bem-sucedida
        """
        query = "DELETE FROM avaliacoes_fisicas WHERE id = ?"
        return self.db.execute_delete(query, (avaliacao_id,)) > 0
    
    def obter_evolucao_peso(self, aluno_id: int) -> List[dict]:
        """
        Obtém a evolução do peso de um aluno.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Lista de dicionários com data e peso
        """
        query = '''
            SELECT data_avaliacao, peso FROM avaliacoes_fisicas 
            WHERE aluno_id = ? AND peso IS NOT NULL
            ORDER BY data_avaliacao ASC
        '''
        
        resultados = self.db.execute_query(query, (aluno_id,))
        
        evolucao = []
        for row in resultados:
            evolucao.append({
                'data': row['data_avaliacao'],
                'peso': row['peso']
            })
        
        return evolucao
    
    def obter_evolucao_imc(self, aluno_id: int) -> List[dict]:
        """
        Obtém a evolução do IMC de um aluno.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Lista de dicionários com data e IMC
        """
        query = '''
            SELECT data_avaliacao, imc FROM avaliacoes_fisicas 
            WHERE aluno_id = ? AND imc IS NOT NULL
            ORDER BY data_avaliacao ASC
        '''
        
        resultados = self.db.execute_query(query, (aluno_id,))
        
        evolucao = []
        for row in resultados:
            evolucao.append({
                'data': row['data_avaliacao'],
                'imc': row['imc']
            })
        
        return evolucao
    
    def obter_evolucao_gordura(self, aluno_id: int) -> List[dict]:
        """
        Obtém a evolução do percentual de gordura de um aluno.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Lista de dicionários com data e percentual de gordura
        """
        query = '''
            SELECT data_avaliacao, percentual_gordura FROM avaliacoes_fisicas 
            WHERE aluno_id = ? AND percentual_gordura IS NOT NULL
            ORDER BY data_avaliacao ASC
        '''
        
        resultados = self.db.execute_query(query, (aluno_id,))
        
        evolucao = []
        for row in resultados:
            evolucao.append({
                'data': row['data_avaliacao'],
                'percentual_gordura': row['percentual_gordura']
            })
        
        return evolucao
    
    def calcular_estatisticas_gerais(self) -> dict:
        """
        Calcula estatísticas gerais das avaliações.
        
        Returns:
            Dicionário com estatísticas gerais
        """
        query_imc = '''
            SELECT peso, altura FROM avaliacoes_fisicas 
            WHERE peso IS NOT NULL AND altura IS NOT NULL AND altura > 0
        '''
        resultados_imc = self.db.execute_query(query_imc)
        
        query_gordura = '''
            SELECT percentual_gordura FROM avaliacoes_fisicas 
            WHERE percentual_gordura IS NOT NULL
        '''
        resultados_gordura = self.db.execute_query(query_gordura)
        
        query_pressao = '''
            SELECT pressao_arterial FROM avaliacoes_fisicas 
            WHERE pressao_arterial IS NOT NULL AND pressao_arterial != ''
        '''
        resultados_pressao = self.db.execute_query(query_pressao)
        
        estatisticas = {
            'total_avaliacoes': self.contar_avaliacoes(),
            'imc': {'total': 0, 'medio': 0, 'distribuicao': {}},
            'gordura': {'total': 0, 'media': 0},
            'pressao': {'total': 0, 'normal': 0, 'alterada': 0}
        }
        
        if resultados_imc:
            imcs = []
            distribuicao_imc = {
                'Abaixo do peso': 0,
                'Peso normal': 0,
                'Sobrepeso': 0,
                'Obesidade': 0
            }
            
            for row in resultados_imc:
                peso, altura = row['peso'], row['altura']
                imc = peso / (altura ** 2)
                imcs.append(imc)
                
                if imc < 18.5:
                    distribuicao_imc['Abaixo do peso'] += 1
                elif imc < 25:
                    distribuicao_imc['Peso normal'] += 1
                elif imc < 30:
                    distribuicao_imc['Sobrepeso'] += 1
                else:
                    distribuicao_imc['Obesidade'] += 1
            
            estatisticas['imc'] = {
                'total': len(imcs),
                'medio': round(sum(imcs) / len(imcs), 2),
                'distribuicao': distribuicao_imc
            }
        
        if resultados_gordura:
            gorduras = [row['percentual_gordura'] for row in resultados_gordura]
            estatisticas['gordura'] = {
                'total': len(gorduras),
                'media': round(sum(gorduras) / len(gorduras), 2)
            }
        
        if resultados_pressao:
            normal = 0
            alterada = 0
            
            for row in resultados_pressao:
                pressao = row['pressao_arterial']
                if "/" in pressao:
                    try:
                        sistolica, diastolica = map(int, pressao.split("/"))
                        if sistolica < 140 and diastolica < 90:
                            normal += 1
                        else:
                            alterada += 1
                    except ValueError:
                        pass
            
            estatisticas['pressao'] = {
                'total': len(resultados_pressao),
                'normal': normal,
                'alterada': alterada
            }
        
        return estatisticas
    
    def contar_avaliacoes(self) -> int:
        """
        Conta o número total de avaliações físicas.
        
        Returns:
            Número total de avaliações
        """
        query = "SELECT COUNT(*) FROM avaliacoes_fisicas"
        resultado = self.db.execute_query(query)
        return resultado[0][0]
    
    def _row_to_avaliacao(self, row) -> AvaliacaoFisica:
        """
        Converte uma linha do banco de dados em uma instância de AvaliacaoFisica.
        
        Args:
            row: Linha do resultado da query
            
        Returns:
            Instância de AvaliacaoFisica
        """
        avaliacao = AvaliacaoFisica(
            aluno_id=row['aluno_id'],
            peso=row['peso'],
            altura=row["altura"] / 100 if row["altura"] and row["altura"] > 100 else row["altura"],
            percentual_gordura=row['percentual_gordura'],
            massa_muscular=row['massa_muscular'],
            massa_gorda=row['massa_gorda'],
            circunferencia_pescoco=row['circunferencia_pescoco'],
            circunferencia_ombro=row['circunferencia_ombro'],
            circunferencia_peito=row['circunferencia_peito'],
            circunferencia_cintura=row['circunferencia_cintura'],
            circunferencia_abdomen=row['circunferencia_abdomen'],
            circunferencia_quadril=row['circunferencia_quadril'],
            circunferencia_braco_esq=row['circunferencia_braco_esq'],
            circunferencia_braco_dir=row['circunferencia_braco_dir'],
            circunferencia_coxa_esq=row['circunferencia_coxa_esq'],
            circunferencia_coxa_dir=row['circunferencia_coxa_dir'],
            circunferencia_panturrilha_esq=row['circunferencia_panturrilha_esq'],
            circunferencia_panturrilha_dir=row['circunferencia_panturrilha_dir'],
            dobra_triceps=row['dobra_triceps'],
            dobra_subescapular=row['dobra_subescapular'],
            dobra_suprailiaca=row['dobra_suprailiaca'],
            dobra_abdominal=row['dobra_abdominal'],
            dobra_peitoral=row['dobra_peitoral'],
            dobra_axilar_media=row['dobra_axilar_media'],
            dobra_coxa=row['dobra_coxa'],
            pressao_arterial=row['pressao_arterial'],
            frequencia_cardiaca=row['frequencia_cardiaca'],
            observacoes=row['observacoes'],
            protocolo=row['protocolo'],
            data_avaliacao=date.fromisoformat(row['data_avaliacao']) if row['data_avaliacao'] else None
        )
        
        # Definir atributos adicionais
        avaliacao.id = row['id']
        avaliacao.data_criacao = datetime.fromisoformat(row['data_criacao']) if row['data_criacao'] else None
        avaliacao.imc = row['imc']
        avaliacao.relacao_cintura_quadril = row['rcq']
        avaliacao.peso_ideal = row['peso_ideal']
        avaliacao.peso_residual = row['peso_residual']
        
        return avaliacao

# Instância global do DAO
avaliacao_dao = AvaliacaoDAO()

