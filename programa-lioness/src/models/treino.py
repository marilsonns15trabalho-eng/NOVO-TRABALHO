#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Modelo Treino

Este módulo contém a classe Treino, que representa um treino
no sistema de gerenciamento do estúdio.
"""

from datetime import datetime
import json
from typing import List, Dict, Optional

class Treino:
    """
    Classe que representa um treino no sistema.
    
    Atributos:
        id: Identificador único do treino
        nome: Nome do treino
        objetivo: Objetivo principal do treino
        nivel: Nível de dificuldade (Iniciante, Intermediário, Avançado)
        duracao_minutos: Duração do treino em minutos
        descricao: Descrição detalhada do treino
        exercicios: Lista de exercícios do treino
        ativo: Status do treino (ativo ou inativo)
        data_criacao: Data e hora de criação do treino
    """
    
    def __init__(
        self,
        nome: str,
        objetivo: Optional[str] = None,
        nivel: str = "Iniciante",
        duracao_minutos: int = 60,
        descricao: Optional[str] = None,
        exercicios: List[Dict] = None,
        ativo: bool = True,
        data_criacao: Optional[datetime] = None
    ):
        """
        Inicializa uma instância de Treino.
        
        Args:
            nome: Nome do treino
            objetivo: Objetivo do treino
            nivel: Nível de dificuldade
            duracao_minutos: Duração em minutos
            descricao: Descrição do treino
            exercicios: Lista de dicionários com exercícios
            ativo: Status do treino
            data_criacao: Data de criação
        """
        self.id = None
        self.nome = nome
        self.objetivo = objetivo
        self.nivel = nivel
        self.duracao_minutos = duracao_minutos
        self.descricao = descricao
        self.exercicios = exercicios if exercicios is not None else []
        self.ativo = ativo
        self.data_criacao = data_criacao or datetime.now()
    
    @property
    def duracao_formatada(self) -> str:
        """
        Retorna a duração do treino formatada.
        
        Returns:
            String com a duração em minutos (ex: '60 min')
        """
        return f"{self.duracao_minutos} min"
    
    @property
    def total_exercicios(self) -> int:
        """
        Retorna o número total de exercícios no treino.
        
        Returns:
            Quantidade de exercícios
        """
        return len(self.exercicios)
    
    def adicionar_exercicio(
        self,
        nome: str,
        grupo_muscular: str,
        series: int,
        repeticoes: str,
        carga: Optional[str] = None,
        descanso: Optional[str] = None,
        observacoes: Optional[str] = None
    ):
        """
        Adiciona um exercício ao treino.
        
        Args:
            nome: Nome do exercício
            grupo_muscular: Grupo muscular trabalhado
            series: Número de séries
            repeticoes: Faixa de repetições
            carga: Carga utilizada
            descanso: Tempo de descanso entre séries
            observacoes: Observações sobre o exercício
        """
        exercicio = {
            'nome': nome,
            'grupo_muscular': grupo_muscular,
            'series': series,
            'repeticoes': repeticoes,
            'carga': carga or '',
            'descanso': descanso or '',
            'observacoes': observacoes or ''
        }
        self.exercicios.append(exercicio)
    
    def remover_exercicio(self, indice: int) -> bool:
        """
        Remove um exercício do treino pelo índice.
        
        Args:
            indice: Índice do exercício na lista
            
        Returns:
            True se removido com sucesso, False se índice inválido
        """
        if 0 <= indice < len(self.exercicios):
            self.exercicios.pop(indice)
            return True
        return False
    
    def editar_exercicio(self, indice: int, exercicio: Dict) -> bool:
        """
        Edita um exercício existente.
        
        Args:
            indice: Índice do exercício na lista
            exercicio: Dicionário com os novos dados do exercício
            
        Returns:
            True se editado com sucesso, False se índice inválido
        """
        if 0 <= indice < len(self.exercicios):
            self.exercicios[indice] = exercicio
            return True
        return False
    
    def exercicios_to_json(self) -> str:
        """
        Converte a lista de exercícios para JSON.
        
        Returns:
            String JSON com a lista de exercícios
        """
        return json.dumps(self.exercicios, ensure_ascii=False)
    
    def exercicios_from_json(self, json_str: str):
        """
        Carrega exercícios a partir de uma string JSON.
        
        Args:
            json_str: String JSON contendo os exercícios
        """
        try:
            self.exercicios = json.loads(json_str) if json_str else []
        except json.JSONDecodeError:
            self.exercicios = []
    
    def to_dict(self) -> Dict:
        """
        Converte o treino para um dicionário.
        
        Returns:
            Dicionário com todos os atributos do treino
        """
        return {
            'id': self.id,
            'nome': self.nome,
            'objetivo': self.objetivo,
            'nivel': self.nivel,
            'duracao_minutos': self.duracao_minutos,
            'descricao': self.descricao,
            'exercicios': self.exercicios,
            'ativo': self.ativo,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Treino':
        """
        Cria uma instância de Treino a partir de um dicionário.
        
        Args:
            data: Dicionário com os dados do treino
            
        Returns:
            Instância de Treino
        """
        treino = cls(
            nome=data.get('nome', ''),
            objetivo=data.get('objetivo'),
            nivel=data.get('nivel', 'Iniciante'),
            duracao_minutos=data.get('duracao_minutos', 60),
            descricao=data.get('descricao'),
            exercicios=data.get('exercicios', []),
            ativo=data.get('ativo', True)
        )
        treino.id = data.get('id')
        if data.get('data_criacao'):
            treino.data_criacao = datetime.fromisoformat(data['data_criacao'])
        return treino