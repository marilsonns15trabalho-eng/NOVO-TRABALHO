#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Modelo Avaliação Física

Este módulo contém a classe AvaliacaoFisica que representa
uma avaliação física completa de um aluno.
"""

from datetime import datetime, date
from typing import Optional


class AvaliacaoFisica:
    """
    Classe que representa uma avaliação física.
    
    Contém todos os dados antropométricos, medidas perimétricas,
    dobras cutâneas e cálculos de composição corporal.
    """
    
    # Constantes para classificação
    CLASSIFICACAO_IMC = {
        (0, 18.5): "Abaixo do peso",
        (18.5, 25): "Peso normal",
        (25, 30): "Sobrepeso",
        (30, float('inf')): "Obesidade"
    }
    
    # Percentual de gordura ideal para mulheres (Faulkner)
    PERCENTUAL_GORDURA_IDEAL_MULHER = 22.5  # Média entre 21-24%
    
    def __init__(self,
                 aluno_id: int,
                 data_avaliacao: date = None,
                 peso: float = None,
                 altura: float = None,
                 percentual_gordura: float = None,
                 massa_muscular: float = None,
                 massa_gorda: float = None,
                 circunferencia_pescoco: float = None,
                 circunferencia_ombro: float = None,
                 circunferencia_peito: float = None,
                 circunferencia_cintura: float = None,
                 circunferencia_abdomen: float = None,
                 circunferencia_quadril: float = None,
                 circunferencia_braco_esq: float = None,
                 circunferencia_braco_dir: float = None,
                 circunferencia_coxa_esq: float = None,
                 circunferencia_coxa_dir: float = None,
                 circunferencia_panturrilha_esq: float = None,
                 circunferencia_panturrilha_dir: float = None,
                 dobra_triceps: float = None,
                 dobra_subescapular: float = None,
                 dobra_suprailiaca: float = None,
                 dobra_abdominal: float = None,
                 dobra_peitoral: float = None,
                 dobra_axilar_media: float = None,
                 dobra_coxa: float = None,
                 pressao_arterial: str = None,
                 frequencia_cardiaca: int = None,
                 observacoes: str = None,
                 protocolo: str = "Faulkner"):
        """
        Inicializa uma nova avaliação física.
        
        Args:
            aluno_id: ID do aluno avaliado
            data_avaliacao: Data da avaliação (padrão: hoje)
            peso: Peso em kg
            altura: Altura em metros
            percentual_gordura: Percentual de gordura corporal
            massa_muscular: Massa muscular em kg
            massa_gorda: Massa gorda em kg
            circunferencia_pescoco: Circunferência do pescoço em cm
            circunferencia_ombro: Circunferência do ombro em cm
            circunferencia_peito: Circunferência do peito em cm
            circunferencia_cintura: Circunferência da cintura em cm
            circunferencia_abdomen: Circunferência do abdômen em cm
            circunferencia_quadril: Circunferência do quadril em cm
            circunferencia_braco_esq: Circunferência do braço esquerdo em cm
            circunferencia_braco_dir: Circunferência do braço direito em cm
            circunferencia_coxa_esq: Circunferência da coxa esquerda em cm
            circunferencia_coxa_dir: Circunferência da coxa direita em cm
            circunferencia_panturrilha_esq: Circunferência da panturrilha esquerda em cm
            circunferencia_panturrilha_dir: Circunferência da panturrilha direita em cm
            dobra_triceps: Dobra cutânea tricipital em mm
            dobra_subescapular: Dobra cutânea subescapular em mm
            dobra_suprailiaca: Dobra cutânea supra-ilíaca em mm
            dobra_abdominal: Dobra cutânea abdominal em mm
            dobra_peitoral: Dobra cutânea peitoral em mm
            dobra_axilar_media: Dobra cutânea axilar média em mm
            dobra_coxa: Dobra cutânea da coxa em mm
            pressao_arterial: Pressão arterial (ex: "120/80")
            frequencia_cardiaca: Frequência cardíaca em bpm
            observacoes: Observações adicionais
            protocolo: Protocolo utilizado (apenas Faulkner)
        """
        self.id = None
        self.aluno_id = aluno_id
        self.data_avaliacao = data_avaliacao or date.today()
        self.data_criacao = datetime.now()
        
        # Dados básicos
        self.peso = peso
        self.altura = altura
        self.percentual_gordura = percentual_gordura
        self.massa_muscular = massa_muscular
        self.massa_gorda = massa_gorda
        self.protocolo = protocolo or "Faulkner"
        
        # Medidas perimétricas
        self.circunferencia_pescoco = circunferencia_pescoco
        self.circunferencia_ombro = circunferencia_ombro
        self.circunferencia_peito = circunferencia_peito
        self.circunferencia_cintura = circunferencia_cintura
        self.circunferencia_abdomen = circunferencia_abdomen
        self.circunferencia_quadril = circunferencia_quadril
        self.circunferencia_braco_esq = circunferencia_braco_esq
        self.circunferencia_braco_dir = circunferencia_braco_dir
        self.circunferencia_coxa_esq = circunferencia_coxa_esq
        self.circunferencia_coxa_dir = circunferencia_coxa_dir
        self.circunferencia_panturrilha_esq = circunferencia_panturrilha_esq
        self.circunferencia_panturrilha_dir = circunferencia_panturrilha_dir
        
        # Dobras cutâneas
        self.dobra_triceps = dobra_triceps
        self.dobra_subescapular = dobra_subescapular
        self.dobra_suprailiaca = dobra_suprailiaca
        self.dobra_abdominal = dobra_abdominal
        self.dobra_peitoral = dobra_peitoral
        self.dobra_axilar_media = dobra_axilar_media
        self.dobra_coxa = dobra_coxa
        
        # Saúde
        self.pressao_arterial = pressao_arterial
        self.frequencia_cardiaca = frequencia_cardiaca
        self.observacoes = observacoes
        
        # Campos calculados
        self.imc = None
        self.relacao_cintura_quadril = None
        self.peso_ideal = None
        self.peso_residual = None
        self.classificacao_imc = None
        self.classificacao_rcq = None
    
    @property
    def soma_dobras(self) -> Optional[float]:
        """
        Calcula a soma das 7 dobras cutâneas.
        
        Returns:
            Soma das dobras cutâneas em mm ou None se não houver dados
        """
        dobras = [
            self.dobra_triceps,
            self.dobra_subescapular,
            self.dobra_suprailiaca,
            self.dobra_abdominal,
            self.dobra_peitoral,
            self.dobra_axilar_media,
            self.dobra_coxa
        ]
        
        valores_validos = [d for d in dobras if d is not None]
        if valores_validos:
            return sum(valores_validos)
        return None
    
    @property
    def soma_dobras_faulkner(self) -> Optional[float]:
        """
        Calcula a soma das 4 dobras do protocolo Faulkner.
        
        Protocolo Faulkner utiliza: Tricipital, Subescapular, Supra-ilíaca e Abdominal.
        
        Returns:
            Soma das dobras para Faulkner em mm ou None se não houver dados
        """
        dobras = [
            self.dobra_triceps,
            self.dobra_subescapular,
            self.dobra_suprailiaca,
            self.dobra_abdominal
        ]
        
        valores_validos = [d for d in dobras if d is not None]
        if len(valores_validos) == 4:
            return sum(valores_validos)
        return None
    
    @property
    def massa_magra(self) -> Optional[float]:
        """
        Calcula a massa magra (peso - massa gorda).
        
        Returns:
            Massa magra em kg ou None se não houver dados
        """
        if self.peso is not None and self.massa_gorda is not None:
            return self.peso - self.massa_gorda
        return None
    
    def calcular_percentual_gordura_faulkner(self) -> Optional[float]:
        """
        Calcula o percentual de gordura usando o protocolo Faulkner.
        
        Fórmula: %G = (TR + SB + SI + AB) * 0.153 + 5.783
        
        Returns:
            Percentual de gordura ou None se não houver dados suficientes
        """
        soma = self.soma_dobras_faulkner
        if soma is not None and soma > 0:
            percentual = (soma * 0.153) + 5.783
            # Limitar a valores realistas
            return max(5, min(50, percentual))
        return None
    
    def calcular_imc(self) -> Optional[float]:
        """
        Calcula o Índice de Massa Corporal (IMC).
        
        Fórmula: IMC = peso / (altura²)
        
        Returns:
            IMC calculado ou None se não houver dados suficientes
        """
        if self.peso is not None and self.altura is not None and self.altura > 0:
            return self.peso / (self.altura ** 2)
        return None
    
    def classificar_imc(self) -> str:
        """
        Classifica o IMC de acordo com a OMS.
        
        Returns:
            Classificação do IMC
        """
        if self.imc is None:
            return "Não calculado"
        
        if self.imc < 18.5:
            return "Abaixo do peso"
        elif self.imc < 25:
            return "Peso normal"
        elif self.imc < 30:
            return "Sobrepeso"
        else:
            return "Obesidade"
    
    def calcular_rcq(self) -> Optional[float]:
        """
        Calcula a Relação Cintura-Quadril (RCQ).
        
        Returns:
            RCQ calculado ou None se não houver dados suficientes
        """
        if (self.circunferencia_cintura is not None and 
            self.circunferencia_quadril is not None and 
            self.circunferencia_quadril > 0):
            return self.circunferencia_cintura / self.circunferencia_quadril
        return None
    
    def classificar_rcq(self) -> str:
        """
        Classifica a RCQ para mulheres.
        
        Returns:
            Classificação do risco cardiovascular
        """
        if self.relacao_cintura_quadril is None:
            return "Não calculado"
        
        rcq = self.relacao_cintura_quadril
        
        if rcq < 0.71:
            return "Risco Baixo"
        elif rcq < 0.78:
            return "Risco Moderado"
        elif rcq < 0.82:
            return "Risco Alto"
        else:
            return "Risco Muito Alto"
    
    def calcular_peso_ideal(self) -> Optional[float]:
        """
        Calcula o peso ideal baseado na composição corporal.
        
        Fórmula: Peso Ideal = Massa Magra / (1 - % gordura ideal/100)
        % gordura ideal para mulheres: 22.5%
        
        Returns:
            Peso ideal em kg ou None se não houver dados suficientes
        """
        if self.peso is not None and self.percentual_gordura is not None:
            massa_magra = self.peso * (1 - self.percentual_gordura / 100)
            percentual_ideal = self.PERCENTUAL_GORDURA_IDEAL_MULHER
            return massa_magra / (1 - percentual_ideal / 100)
        return None
    
    def calcular_massa_gorda(self) -> Optional[float]:
        """
        Calcula a massa gorda a partir do peso e percentual de gordura.
        
        Returns:
            Massa gorda em kg ou None se não houver dados suficientes
        """
        if self.peso is not None and self.percentual_gordura is not None:
            return self.peso * (self.percentual_gordura / 100)
        return None
    
    def calcular_massa_magra(self) -> Optional[float]:
        """
        Calcula a massa magra a partir do peso e percentual de gordura.
        
        Returns:
            Massa magra em kg ou None se não houver dados suficientes
        """
        if self.peso is not None and self.percentual_gordura is not None:
            return self.peso * (1 - self.percentual_gordura / 100)
        return None
    
    def calcular_resultados(self):
        """
        Calcula todos os resultados da avaliação.
        
        Este método deve ser chamado antes de salvar a avaliação
        para garantir que todos os campos calculados estejam atualizados.
        """
        # Calcular IMC
        self.imc = self.calcular_imc()
        
        # Calcular RCQ
        self.relacao_cintura_quadril = self.calcular_rcq()
        
        # Calcular percentual de gordura (Faulkner) se não tiver
        if self.percentual_gordura is None:
            self.percentual_gordura = self.calcular_percentual_gordura_faulkner()
        
        # Calcular massa gorda
        if self.massa_gorda is None and self.percentual_gordura is not None:
            self.massa_gorda = self.calcular_massa_gorda()
        
        # Calcular peso ideal
        self.peso_ideal = self.calcular_peso_ideal()
        
        # Calcular classificações
        self.classificacao_imc = self.classificar_imc()
        self.classificacao_rcq = self.classificar_rcq()
        
        # Calcular peso residual (estimativa de 20% da massa magra)
        if self.massa_magra:
            self.peso_residual = self.massa_magra * 0.2
    
    def to_dict(self) -> dict:
        """
        Converte a avaliação para um dicionário.
        
        Returns:
            Dicionário com todos os dados da avaliação
        """
        return {
            'id': self.id,
            'aluno_id': self.aluno_id,
            'data_avaliacao': self.data_avaliacao.isoformat() if self.data_avaliacao else None,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'peso': self.peso,
            'altura': self.altura,
            'percentual_gordura': self.percentual_gordura,
            'massa_muscular': self.massa_muscular,
            'massa_gorda': self.massa_gorda,
            'imc': self.imc,
            'rcq': self.relacao_cintura_quadril,
            'peso_ideal': self.peso_ideal,
            'peso_residual': self.peso_residual,
            'protocolo': self.protocolo,
            'classificacao_imc': self.classificacao_imc,
            'classificacao_rcq': self.classificacao_rcq,
            'circunferencia_pescoco': self.circunferencia_pescoco,
            'circunferencia_ombro': self.circunferencia_ombro,
            'circunferencia_peito': self.circunferencia_peito,
            'circunferencia_cintura': self.circunferencia_cintura,
            'circunferencia_abdomen': self.circunferencia_abdomen,
            'circunferencia_quadril': self.circunferencia_quadril,
            'circunferencia_braco_esq': self.circunferencia_braco_esq,
            'circunferencia_braco_dir': self.circunferencia_braco_dir,
            'circunferencia_coxa_esq': self.circunferencia_coxa_esq,
            'circunferencia_coxa_dir': self.circunferencia_coxa_dir,
            'circunferencia_panturrilha_esq': self.circunferencia_panturrilha_esq,
            'circunferencia_panturrilha_dir': self.circunferencia_panturrilha_dir,
            'dobra_triceps': self.dobra_triceps,
            'dobra_subescapular': self.dobra_subescapular,
            'dobra_suprailiaca': self.dobra_suprailiaca,
            'dobra_abdominal': self.dobra_abdominal,
            'dobra_peitoral': self.dobra_peitoral,
            'dobra_axilar_media': self.dobra_axilar_media,
            'dobra_coxa': self.dobra_coxa,
            'soma_dobras': self.soma_dobras,
            'pressao_arterial': self.pressao_arterial,
            'frequencia_cardiaca': self.frequencia_cardiaca,
            'observacoes': self.observacoes
        }
    
    def __repr__(self) -> str:
        """Representação textual da avaliação."""
        return (f"AvaliacaoFisica(id={self.id}, aluno_id={self.aluno_id}, "
                f"data={self.data_avaliacao}, peso={self.peso}, imc={self.imc})")