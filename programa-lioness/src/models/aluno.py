#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Modelo Aluno

Este módulo contém a classe Aluno que representa um aluno do estúdio,
incluindo todas as informações pessoais, de contato e objetivos.
"""

from datetime import datetime, date
from typing import Optional, Dict, Any, List
import re

class Aluno:
    """
    Classe que representa um aluno do estúdio.
    
    Contém todas as informações pessoais, de contato e dados relevantes
    para o acompanhamento do aluno no estúdio, incluindo objetivos e plano.
    """
    
    # Lista de objetivos possíveis
    OBJETIVOS_POSSIVEIS = [
        "Emagrecimento",
        "Hipertrofia",
        "Ganho de Massa Muscular",
        "Condicionamento Físico",
        "Melhora da Postura",
        "Preparação Física Específica",
        "Reabilitação",
        "Melhora da Flexibilidade",
        "Redução de Estresse",
        "Manutenção da Saúde"
    ]

    def __init__(self, 
                 nome: str,
                 cpf: str = "",
                 data_nascimento: Optional[date] = None,
                 telefone: str = "",
                 email: str = "",
                 endereco: str = "",
                 cidade: str = "",
                 cep: str = "",
                 profissao: str = "",
                 contato_emergencia: str = "",
                 telefone_emergencia: str = "",
                 observacoes: str = "",
                 ativo: bool = True,
                 genero: str = "",
                 grupo: str = "",
                 modalidade: str = "",
                 plano_id: Optional[int] = None,
                 objetivos: Optional[List[str]] = None,
                 peso_desejado: Optional[float] = None):
        """
        Inicializa um novo aluno.
        
        Args:
            nome: Nome completo do aluno (obrigatório)
            cpf: CPF do aluno (validação de 11 dígitos)
            data_nascimento: Data de nascimento
            telefone: Telefone principal
            email: Email do aluno
            endereco: Endereço completo
            cidade: Cidade
            cep: CEP
            profissao: Profissão do aluno
            contato_emergencia: Nome do contato de emergência
            telefone_emergencia: Telefone do contato de emergência
            observacoes: Observações gerais sobre o aluno
            ativo: Se o aluno está ativo no estúdio
            genero: Gênero do aluno
            grupo: Grupo de treino do aluno
            modalidade: Modalidade de treino
            plano_id: ID do plano associado
            objetivos: Lista de objetivos do aluno
            peso_desejado: Peso desejado em kg
        """
        self.id: Optional[int] = None  # Será definido pelo banco de dados
        self.nome = nome
        self._cpf = cpf
        self.data_nascimento = data_nascimento
        self.telefone = telefone
        self.email = email
        self.endereco = endereco
        self.cidade = cidade
        self.cep = cep
        self.profissao = profissao
        self.contato_emergencia = contato_emergencia
        self.telefone_emergencia = telefone_emergencia
        self.observacoes = observacoes
        self.ativo = ativo
        self.genero = genero
        self.grupo = grupo
        self.modalidade = modalidade
        self.plano_id = plano_id
        self.objetivos = objetivos if objetivos is not None else []
        self.peso_desejado = peso_desejado
        self.data_cadastro = datetime.now()
        self.data_ultima_atualizacao = datetime.now()
    
    @property
    def cpf(self) -> str:
        """Retorna o CPF do aluno."""
        return self._cpf
    
    @cpf.setter
    def cpf(self, value: str):
        """Valida e define o CPF do aluno."""
        if value:
            # Remover caracteres não numéricos
            cleaned_cpf = re.sub(r'\D', '', value)
            if len(cleaned_cpf) != 11:
                raise ValueError("O CPF deve conter exatamente 11 dígitos")
            if not self._validar_cpf(cleaned_cpf):
                raise ValueError("CPF inválido")
            self._cpf = cleaned_cpf
        else:
            self._cpf = ""

    @staticmethod
    def _validar_cpf(cpf: str) -> bool:
        """
        Valida se o CPF é válido usando o algoritmo de dígitos verificadores.
        
        Args:
            cpf: CPF a ser validado (somente números)
            
        Returns:
            bool: True se o CPF é válido, False caso contrário
        """
        if not cpf.isdigit() or len(cpf) != 11:
            return False
        
        # Verifica se todos os dígitos são iguais (ex.: 11111111111)
        if cpf == cpf[0] * 11:
            return False
        
        # Validação do primeiro dígito verificador
        soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
        resto = (soma * 10) % 11
        if resto == 10:
            resto = 0
        if resto != int(cpf[9]):
            return False
        
        # Validação do segundo dígito verificador
        soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
        resto = (soma * 10) % 11
        if resto == 10:
            resto = 0
        if resto != int(cpf[10]):
            return False
        
        return True

    @property
    def idade(self) -> Optional[int]:
        """Calcula e retorna a idade do aluno."""
        if self.data_nascimento:
            hoje = date.today()
            return hoje.year - self.data_nascimento.year - (
                (hoje.month, hoje.day) < (self.data_nascimento.month, self.data_nascimento.day)
            )
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Converte o aluno para um dicionário.
        
        Returns:
            Dicionário com todos os dados do aluno
        """
        return {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'data_nascimento': self.data_nascimento.isoformat() if self.data_nascimento else None,
            'telefone': self.telefone,
            'email': self.email,
            'endereco': self.endereco,
            'cidade': self.cidade,
            'cep': self.cep,
            'profissao': self.profissao,
            'contato_emergencia': self.contato_emergencia,
            'telefone_emergencia': self.telefone_emergencia,
            'observacoes': self.observacoes,
            'ativo': self.ativo,
            'genero': self.genero,
            'grupo': self.grupo,
            'modalidade': self.modalidade,
            'plano_id': self.plano_id,
            'objetivos': self.objetivos,
            'peso_desejado': self.peso_desejado,
            'data_cadastro': self.data_cadastro.isoformat(),
            'data_ultima_atualizacao': self.data_ultima_atualizacao.isoformat(),
            'idade': self.idade
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Aluno':
        """
        Cria um aluno a partir de um dicionário.
        
        Args:
            data: Dicionário com os dados do aluno
            
        Returns:
            Instância de Aluno
        """
        aluno = cls(
            nome=data.get('nome', ''),
            cpf=data.get('cpf', ''),
            data_nascimento=datetime.fromisoformat(data['data_nascimento']).date() 
                           if data.get('data_nascimento') else None,
            telefone=data.get('telefone', ''),
            email=data.get('email', ''),
            endereco=data.get('endereco', ''),
            cidade=data.get('cidade', ''),
            cep=data.get('cep', ''),
            profissao=data.get('profissao', ''),
            contato_emergencia=data.get('contato_emergencia', ''),
            telefone_emergencia=data.get('telefone_emergencia', ''),
            observacoes=data.get('observacoes', ''),
            ativo=data.get('ativo', True),
            genero=data.get('genero', ''),
            grupo=data.get('grupo', ''),
            modalidade=data.get('modalidade', ''),
            plano_id=data.get('plano_id'),
            objetivos=data.get('objetivos', []),
            peso_desejado=data.get('peso_desejado')
        )
        
        aluno.id = data.get('id')
        if data.get('data_cadastro'):
            aluno.data_cadastro = datetime.fromisoformat(data['data_cadastro'])
        if data.get('data_ultima_atualizacao'):
            aluno.data_ultima_atualizacao = datetime.fromisoformat(data['data_ultima_atualizacao'])
            
        return aluno
    
    def atualizar(self, **kwargs):
        """
        Atualiza os dados do aluno.
        
        Args:
            **kwargs: Campos a serem atualizados
        """
        for campo, valor in kwargs.items():
            if campo == 'cpf':
                self.cpf = valor  # Usa o setter para validação
            elif hasattr(self, campo):
                setattr(self, campo, valor)
        
        self.data_ultima_atualizacao = datetime.now()
    
    def __str__(self) -> str:
        """Representação em string do aluno."""
        return f"Aluno(id={self.id}, nome='{self.nome}', ativo={self.ativo})"
    
    def __repr__(self) -> str:
        """Representação detalhada do aluno."""
        return self.__str__()