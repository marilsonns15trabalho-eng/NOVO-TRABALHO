#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Modelo Plano

Este módulo contém a classe Plano que representa um plano de treinamento
oferecido pelo estúdio.
"""

from datetime import datetime
from typing import Optional, Dict, Any

class Plano:
    """
    Classe que representa um plano de treinamento do estúdio.
    
    Contém informações sobre os diferentes tipos de planos oferecidos,
    como valores, duração e descrições.
    """
    
    def __init__(self,
                 nome: str,
                 valor: float,
                 duracao_dias: int,
                 descricao: str = "",
                 ativo: bool = True):
        """
        Inicializa um novo plano.
        
        Args:
            nome: Nome do plano (obrigatório)
            valor: Valor do plano em reais
            duracao_dias: Duração do plano em dias
            descricao: Descrição detalhada do plano
            ativo: Se o plano está ativo para venda
        """
        self.id: Optional[int] = None  # Será definido pelo banco de dados
        self.nome = nome
        self.valor = valor
        self.duracao_dias = duracao_dias
        self.descricao = descricao
        self.ativo = ativo
        self.data_criacao = datetime.now()
    
    @property
    def duracao_meses(self) -> float:
        """Retorna a duração do plano em meses (aproximado)."""
        return round(self.duracao_dias / 30, 1)
    
    @property
    def valor_formatado(self) -> str:
        """Retorna o valor formatado em reais."""
        return f"R$ {self.valor:.2f}".replace('.', ',')
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Converte o plano para um dicionário.
        
        Returns:
            Dicionário com todos os dados do plano
        """
        return {
            'id': self.id,
            'nome': self.nome,
            'valor': self.valor,
            'duracao_dias': self.duracao_dias,
            'descricao': self.descricao,
            'ativo': self.ativo,
            'data_criacao': self.data_criacao.isoformat(),
            'duracao_meses': self.duracao_meses,
            'valor_formatado': self.valor_formatado
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Plano':
        """
        Cria um plano a partir de um dicionário.
        
        Args:
            data: Dicionário com os dados do plano
            
        Returns:
            Instância de Plano
        """
        plano = cls(
            nome=data.get('nome', ''),
            valor=data.get('valor', 0.0),
            duracao_dias=data.get('duracao_dias', 30),
            descricao=data.get('descricao', ''),
            ativo=data.get('ativo', True)
        )
        
        plano.id = data.get('id')
        if data.get('data_criacao'):
            plano.data_criacao = datetime.fromisoformat(data['data_criacao'])
            
        return plano
    
    def __str__(self) -> str:
        """Representação em string do plano."""
        return f"Plano(id={self.id}, nome='{self.nome}', valor={self.valor_formatado})"
    
    def __repr__(self) -> str:
        """Representação detalhada do plano."""
        return self.__str__()