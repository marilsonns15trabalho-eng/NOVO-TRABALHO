#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - DAO Anamnese Nutricional

Este módulo contém o Data Access Object (DAO) para operações
com anamnese nutricional no banco de dados.
"""

from typing import List, Optional
from datetime import datetime, date
import sys
import os

# Adicionar o diretório pai ao path para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.anamnese import AnamneseNutricional
from data.database import db_manager

class AnamneseDAO:
    """
    Data Access Object para operações com anamnese nutricional.
    
    Responsável por todas as operações de CRUD (Create, Read, Update, Delete)
    relacionadas às anamneses nutricionais no banco de dados.
    """
    
    def __init__(self):
        """
        Inicializa o DAO de anamnese nutricional.
        """
        self.db = db_manager
    
    def criar_anamnese(self, anamnese: AnamneseNutricional) -> int:
        """
        Cria uma nova anamnese nutricional no banco de dados.
        
        Args:
            anamnese: Instância de AnamneseNutricional a ser criada
            
        Returns:
            ID da anamnese criada
        """
        query = '''
INSERT INTO anamnese_nutricional (
                aluno_id, data_anamnese, peso, altura, objetivo_nutricional,
                restricoes_alimentares, alergias, medicamentos, historico_familiar,
                habitos_alimentares, consumo_agua, atividade_fisica, observacoes,
                circunferencia_abdominal, circunferencia_quadril, medidas_corpo,
                doencas_cronicas, problemas_saude, cirurgias, condicoes_hormonais,
                acompanhamento_psicologico, disturbios_alimentares, gravida_amamentando,
                acompanhamento_previo, frequencia_refeicoes, horarios_refeicoes,
                consumo_fastfood, consumo_doces, consumo_bebidas_acucaradas, consumo_alcool,     
                gosta_cozinhar, preferencia_alimentos, consumo_cafe, uso_suplementos,
                frequencia_atividade_fisica, objetivos_treino, rotina_sono, nivel_estresse,      
                tempo_sentado, dificuldade_dietas, lanches_fora, come_emocional,
                beliscar, compulsao_alimentar, fome_fora_horario, estrategias_controle_peso,     
                alimentos_preferidos, alimentos_evitados, meta_peso_medidas, disposicao_mudancas,
                preferencia_dietas, expectativas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        
        params = (
            anamnese.aluno_id,
            anamnese.data_anamnese.isoformat(),
            anamnese.peso,
            anamnese.altura,
            anamnese.objetivo_nutricional,
            anamnese.restricoes_alimentares,
            anamnese.alergias,
            anamnese.medicamentos,
            anamnese.historico_familiar,
            anamnese.habitos_alimentares,
            anamnese.consumo_agua,
            anamnese.atividade_fisica,
            anamnese.observacoes,
            anamnese.circunferencia_abdominal,
            anamnese.circunferencia_quadril,
            anamnese.medidas_corpo,
            anamnese.doencas_cronicas,
            anamnese.problemas_saude,
            anamnese.cirurgias,
            anamnese.condicoes_hormonais,
            anamnese.acompanhamento_psicologico,
            anamnese.disturbios_alimentares,
            anamnese.gravida_amamentando,
            anamnese.acompanhamento_previo,
            anamnese.frequencia_refeicoes,
            anamnese.horarios_refeicoes,
            anamnese.consumo_fastfood,
            anamnese.consumo_doces,
            anamnese.consumo_bebidas_acucaradas,
            anamnese.consumo_alcool,
            anamnese.gosta_cozinhar,
            anamnese.preferencia_alimentos,
            anamnese.consumo_cafe,
            anamnese.uso_suplementos,
            anamnese.frequencia_atividade_fisica,
            anamnese.objetivos_treino,
            anamnese.rotina_sono,
            anamnese.nivel_estresse,
            anamnese.tempo_sentado,
            anamnese.dificuldade_dietas,
            anamnese.lanches_fora,
            anamnese.come_emocional,
            anamnese.beliscar,
            anamnese.compulsao_alimentar,
            anamnese.fome_fora_horario,
            anamnese.estrategias_controle_peso,
            anamnese.alimentos_preferidos,
            anamnese.alimentos_evitados,
            anamnese.meta_peso_medidas,
            anamnese.disposicao_mudancas,
            anamnese.preferencia_dietas,
            anamnese.expectativas
        )
        
        anamnese_id = self.db.execute_insert(query, params)
        anamnese.id = anamnese_id
        return anamnese_id
    
    def buscar_anamnese_por_id(self, anamnese_id: int) -> Optional[AnamneseNutricional]:
        """
        Busca uma anamnese pelo ID.
        
        Args:
            anamnese_id: ID da anamnese
            
        Returns:
            Instância de AnamneseNutricional ou None se não encontrada
        """
        query = "SELECT * FROM anamnese_nutricional WHERE id = ?"
        resultados = self.db.execute_query(query, (anamnese_id,))
        
        if resultados:
            return self._row_to_anamnese(resultados[0])
        return None
    
    def buscar_anamneses_por_aluno(self, aluno_id: int) -> List[AnamneseNutricional]:
        """
        Busca todas as anamneses de um aluno.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Lista de anamneses do aluno
        """
        query = '''
            SELECT * FROM anamnese_nutricional 
            WHERE aluno_id = ? 
            ORDER BY data_anamnese DESC
        '''
        resultados = self.db.execute_query(query, (aluno_id,))
        
        return [self._row_to_anamnese(row) for row in resultados]
    
    def buscar_anamnese_mais_recente(self, aluno_id: int) -> Optional[AnamneseNutricional]:
        """
        Busca a anamnese mais recente de um aluno.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Anamnese mais recente ou None se não encontrada
        """
        query = '''
            SELECT * FROM anamnese_nutricional 
            WHERE aluno_id = ? 
            ORDER BY data_anamnese DESC 
            LIMIT 1
        '''
        resultados = self.db.execute_query(query, (aluno_id,))
        
        if resultados:
            return self._row_to_anamnese(resultados[0])
        return None
    
    def listar_todas_anamneses(self, limite: int = 100) -> List[AnamneseNutricional]:
        """
        Lista todas as anamneses nutricionais.
        
        Args:
            limite: Número máximo de registros a retornar
            
        Returns:
            Lista de todas as anamneses
        """
        query = '''
            SELECT * FROM anamnese_nutricional 
            ORDER BY data_anamnese DESC 
            LIMIT ?
        '''
        resultados = self.db.execute_query(query, (limite,))
        
        return [self._row_to_anamnese(row) for row in resultados]
    
    def atualizar_anamnese(self, anamnese: AnamneseNutricional) -> bool:
        """
        Atualiza uma anamnese no banco de dados.
        
        Args:
            anamnese: Instância de AnamneseNutricional com dados atualizados
            
        Returns:
            True se a atualização foi bem-sucedida
        """
        query = '''
            UPDATE anamnese_nutricional SET
                data_anamnese = ?, peso = ?, altura = ?, objetivo_nutricional = ?,
                restricoes_alimentares = ?, alergias = ?, medicamentos = ?,
                historico_familiar = ?, habitos_alimentares = ?, consumo_agua = ?,
                atividade_fisica = ?, observacoes = ?,
                circunferencia_abdominal = ?, circunferencia_quadril = ?, medidas_corpo = ?,
                doencas_cronicas = ?, problemas_saude = ?, cirurgias = ?, condicoes_hormonais = ?,
                acompanhamento_psicologico = ?, disturbios_alimentares = ?, gravida_amamentando = ?,
                acompanhamento_previo = ?, frequencia_refeicoes = ?, horarios_refeicoes = ?,
                consumo_fastfood = ?, consumo_doces = ?, consumo_bebidas_acucaradas = ?, consumo_alcool = ?,
                gosta_cozinhar = ?, preferencia_alimentos = ?, consumo_cafe = ?, uso_suplementos = ?,
                frequencia_atividade_fisica = ?, objetivos_treino = ?, rotina_sono = ?, nivel_estresse = ?,
                tempo_sentado = ?, dificuldade_dietas = ?, lanches_fora = ?, come_emocional = ?,
                beliscar = ?, compulsao_alimentar = ?, fome_fora_horario = ?, estrategias_controle_peso = ?,
                alimentos_preferidos = ?, alimentos_evitados = ?, meta_peso_medidas = ?, disposicao_mudancas = ?,
                preferencia_dietas = ?, expectativas = ?
            WHERE id = ?
        '''
        
        params = (
            anamnese.data_anamnese.isoformat() if anamnese.data_anamnese else None,
            anamnese.peso,
            anamnese.altura,
            anamnese.objetivo_nutricional,
            anamnese.restricoes_alimentares,
            anamnese.alergias,
            anamnese.medicamentos,
            anamnese.historico_familiar,
            anamnese.habitos_alimentares,
            anamnese.consumo_agua,
            anamnese.atividade_fisica,
            anamnese.observacoes,
            anamnese.circunferencia_abdominal,
            anamnese.circunferencia_quadril,
            anamnese.medidas_corpo,
            anamnese.doencas_cronicas,
            anamnese.problemas_saude,
            anamnese.cirurgias,
            anamnese.condicoes_hormonais,
            anamnese.acompanhamento_psicologico,
            anamnese.disturbios_alimentares,
            anamnese.gravida_amamentando,
            anamnese.acompanhamento_previo,
            anamnese.frequencia_refeicoes,
            anamnese.horarios_refeicoes,
            anamnese.consumo_fastfood,
            anamnese.consumo_doces,
            anamnese.consumo_bebidas_acucaradas,
            anamnese.consumo_alcool,
            anamnese.gosta_cozinhar,
            anamnese.preferencia_alimentos,
            anamnese.consumo_cafe,
            anamnese.uso_suplementos,
            anamnese.frequencia_atividade_fisica,
            anamnese.objetivos_treino,
            anamnese.rotina_sono,
            anamnese.nivel_estresse,
            anamnese.tempo_sentado,
            anamnese.dificuldade_dietas,
            anamnese.lanches_fora,
            anamnese.come_emocional,
            anamnese.beliscar,
            anamnese.compulsao_alimentar,
            anamnese.fome_fora_horario,
            anamnese.estrategias_controle_peso,
            anamnese.alimentos_preferidos,
            anamnese.alimentos_evitados,
            anamnese.meta_peso_medidas,
            anamnese.disposicao_mudancas,
            anamnese.preferencia_dietas,
            anamnese.expectativas,
            anamnese.id
        )
        
        linhas_afetadas = self.db.execute_update(query, params)
        return linhas_afetadas > 0
    
    def excluir_anamnese(self, anamnese_id: int) -> bool:
        """
        Exclui permanentemente uma anamnese do banco de dados.
        
        ATENÇÃO: Esta operação é irreversível!
        
        Args:
            anamnese_id: ID da anamnese a ser excluída
            
        Returns:
            True se a exclusão foi bem-sucedida
        """
        query = "DELETE FROM anamnese_nutricional WHERE id = ?"
        linhas_afetadas = self.db.execute_delete(query, (anamnese_id,))
        return linhas_afetadas > 0
    
    def contar_anamneses(self) -> int:
        """
        Conta o número total de anamneses.
        
        Returns:
            Número total de anamneses
        """
        query = "SELECT COUNT(*) FROM anamnese_nutricional"
        resultado = self.db.execute_query(query)
        return resultado[0][0] if resultado else 0
    
    def contar_anamneses_por_aluno(self, aluno_id: int) -> int:
        """
        Conta o número de anamneses de um aluno específico.
        
        Args:
            aluno_id: ID do aluno
            
        Returns:
            Número de anamneses do aluno
        """
        query = "SELECT COUNT(*) FROM anamnese_nutricional WHERE aluno_id = ?"
        resultado = self.db.execute_query(query, (aluno_id,))
        return resultado[0][0] if resultado else 0
    
    def buscar_anamneses_por_periodo(self, data_inicio: date, data_fim: date) -> List[AnamneseNutricional]:
        """
        Busca anamneses por período.
        
        Args:
            data_inicio: Data de início do período
            data_fim: Data de fim do período
            
        Returns:
            Lista de anamneses no período
        """
        query = '''
            SELECT * FROM anamnese_nutricional 
            WHERE data_anamnese BETWEEN ? AND ?
            ORDER BY data_anamnese DESC
        '''
        
        resultados = self.db.execute_query(query, (data_inicio.isoformat(), data_fim.isoformat()))
        return [self._row_to_anamnese(row) for row in resultados]
    
    def buscar_anamneses_por_objetivo(self, objetivo: str) -> List[AnamneseNutricional]:
        """
        Busca anamneses por objetivo nutricional.
        
        Args:
            objetivo: Objetivo nutricional (busca parcial)
            
        Returns:
            Lista de anamneses com o objetivo especificado
        """
        query = '''
            SELECT * FROM anamnese_nutricional 
            WHERE objetivo_nutricional LIKE ?
            ORDER BY data_anamnese DESC
        '''
        
        resultados = self.db.execute_query(query, (f"%{objetivo}%",))
        return [self._row_to_anamnese(row) for row in resultados]
    
    def calcular_estatisticas_imc(self) -> dict:
        """
        Calcula estatísticas de IMC das anamneses.
        
        Returns:
            Dicionário com estatísticas de IMC
        """
        query = '''
            SELECT peso, altura FROM anamnese_nutricional 
            WHERE peso IS NOT NULL AND altura IS NOT NULL AND altura > 0
        '''
        
        resultados = self.db.execute_query(query)
        
        if not resultados:
            return {
                'total': 0,
                'imc_medio': 0,
                'imc_min': 0,
                'imc_max': 0,
                'distribuicao': {}
            }
        
        imcs = []
        distribuicao = {
            'Abaixo do peso': 0,
            'Peso normal': 0,
            'Sobrepeso': 0,
            'Obesidade': 0
        }
        
        for row in resultados:
            peso, altura = row['peso'], row['altura']
            imc = peso / (altura ** 2)
            imcs.append(imc)
            
            # Classificar IMC
            if imc < 18.5:
                distribuicao['Abaixo do peso'] += 1
            elif imc < 25:
                distribuicao['Peso normal'] += 1
            elif imc < 30:
                distribuicao['Sobrepeso'] += 1
            else:
                distribuicao['Obesidade'] += 1
        
        return {
            'total': len(imcs),
            'imc_medio': round(sum(imcs) / len(imcs), 2),
            'imc_min': round(min(imcs), 2),
            'imc_max': round(max(imcs), 2),
            'distribuicao': distribuicao
        }
    
    def _row_to_anamnese(self, row) -> AnamneseNutricional:
        """
        Converte uma linha do banco de dados em uma instância de AnamneseNutricional.
        """
        # Mapeamento de colunas para atributos da classe AnamneseNutricional
        # Garante que mesmo que uma coluna não exista na query, o valor padrão seja usado
        # e evita o erro 'sqlite3.Row' object has no attribute 'get'
        
        # Função auxiliar para obter valor da linha ou string vazia se a coluna não existir
        def get_value(column_name, default_value=""):
            return row[column_name] if column_name in row.keys() else default_value
        anamnese = AnamneseNutricional(
            aluno_id=get_value("aluno_id"),
            data_anamnese=date.fromisoformat(get_value("data_anamnese")) if get_value("data_anamnese") else None,
            peso=get_value("peso"),
            altura=get_value("altura"),
            objetivo_nutricional=get_value("objetivo_nutricional"),
            restricoes_alimentares=get_value("restricoes_alimentares"),
            alergias=get_value("alergias"),
            medicamentos=get_value("medicamentos"),
            historico_familiar=get_value("historico_familiar"),
            habitos_alimentares=get_value("habitos_alimentares"),
            consumo_agua=get_value("consumo_agua"),
            atividade_fisica=get_value("atividade_fisica"),
            observacoes=get_value("observacoes"),
            circunferencia_abdominal=get_value("circunferencia_abdominal"),
            circunferencia_quadril=get_value("circunferencia_quadril"),
            medidas_corpo=get_value("medidas_corpo"),
            doencas_cronicas=get_value("doencas_cronicas"),
            problemas_saude=get_value("problemas_saude"),
            cirurgias=get_value("cirurgias"),
            condicoes_hormonais=get_value("condicoes_hormonais"),
            acompanhamento_psicologico=get_value("acompanhamento_psicologico"),
            disturbios_alimentares=get_value("disturbios_alimentares"),
            gravida_amamentando=get_value("gravida_amamentando"),
            acompanhamento_previo=get_value("acompanhamento_previo"),
            frequencia_refeicoes=get_value("frequencia_refeicoes"),
            horarios_refeicoes=get_value("horarios_refeicoes"),
            consumo_fastfood=get_value("consumo_fastfood"),
            consumo_doces=get_value("consumo_doces"),
            consumo_bebidas_acucaradas=get_value("consumo_bebidas_acucaradas"),
            consumo_alcool=get_value("consumo_alcool"),
            gosta_cozinhar=get_value("gosta_cozinhar"),
            preferencia_alimentos=get_value("preferencia_alimentos"),
            consumo_cafe=get_value("consumo_cafe"),
            uso_suplementos=get_value("uso_suplementos"),
            frequencia_atividade_fisica=get_value("frequencia_atividade_fisica"),
            objetivos_treino=get_value("objetivos_treino"),
            rotina_sono=get_value("rotina_sono"),
            nivel_estresse=get_value("nivel_estresse"),
            tempo_sentado=get_value("tempo_sentado"),
            dificuldade_dietas=get_value("dificuldade_dietas"),
            lanches_fora=get_value("lanches_fora"),
            come_emocional=get_value("come_emocional"),
            beliscar=get_value("beliscar"),
            compulsao_alimentar=get_value("compulsao_alimentar"),
            fome_fora_horario=get_value("fome_fora_horario"),
            estrategias_controle_peso=get_value("estrategias_controle_peso"),
            alimentos_preferidos=get_value("alimentos_preferidos"),
            alimentos_evitados=get_value("alimentos_evitados"),
            meta_peso_medidas=get_value("meta_peso_medidas"),
            disposicao_mudancas=get_value("disposicao_mudancas"),
            preferencia_dietas=get_value("preferencia_dietas"),
            expectativas=get_value("expectativas")
        )
        
        anamnese.id = get_value("id")
        if get_value("data_criacao"):
            anamnese.data_criacao = datetime.fromisoformat(get_value("data_criacao"))
        return anamnese

anamnese_dao = AnamneseDAO()

