#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Modelo Pagamento

Este módulo contém a classe Pagamento que representa um pagamento
realizado por um aluno.
"""

from datetime import datetime, date
from typing import Optional, Dict, Any
import uuid

class Pagamento:
    """
    Classe que representa um pagamento realizado por um aluno.
    
    Contém informações sobre valores, datas, métodos de pagamento
    e status dos pagamentos.
    """
    
    def __init__(self,
                 aluno_id: int,
                 valor: float,
                 data_pagamento: date,
                 data_vencimento: Optional[date] = None,
                 metodo_pagamento: str = "Dinheiro",
                 status: str = "pago",
                 observacoes: str = "",
                 assinatura_id: Optional[int] = None):
        """
        Inicializa um novo pagamento.
        
        Args:
            aluno_id: ID do aluno que realizou o pagamento
            valor: Valor do pagamento em reais
            data_pagamento: Data em que o pagamento foi realizado
            data_vencimento: Data de vencimento (para boletos)
            metodo_pagamento: Método utilizado (Dinheiro, PIX, Cartão, etc.)
            status: Status do pagamento (pago, pendente, vencido)
            observacoes: Observações sobre o pagamento
            assinatura_id: ID da assinatura relacionada (se houver)
        """
        self.id: Optional[int] = None  # Será definido pelo banco de dados
        self.aluno_id = aluno_id
        self.valor = valor
        self.data_pagamento = data_pagamento
        self.data_vencimento = data_vencimento
        self.metodo_pagamento = metodo_pagamento
        self.status = status
        self.observacoes = observacoes
        self.assinatura_id = assinatura_id
        self.numero_boleto = self._gerar_numero_boleto()
        self.data_criacao = datetime.now()
    
    def _gerar_numero_boleto(self) -> str:
        """Gera um número único para o boleto."""
        # Formato: LPE + ano + mês + dia + 6 dígitos aleatórios
        hoje = datetime.now()
        prefixo = f"LPE{hoje.strftime('%Y%m%d')}"
        sufixo = str(uuid.uuid4().int)[:6]
        return f"{prefixo}{sufixo}"
    
    @property
    def valor_formatado(self) -> str:
        """Retorna o valor formatado em reais."""
        return f"R$ {self.valor:.2f}".replace('.', ',')
    
    @property
    def status_formatado(self) -> str:
        """Retorna o status formatado."""
        status_map = {
            'pago': 'Pago',
            'pendente': 'Pendente',
            'vencido': 'Vencido',
            'cancelado': 'Cancelado'
        }
        return status_map.get(self.status, self.status.title())
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Converte o pagamento para um dicionário.
        
        Returns:
            Dicionário com todos os dados do pagamento
        """
        return {
            'id': self.id,
            'aluno_id': self.aluno_id,
            'valor': self.valor,
            'data_pagamento': self.data_pagamento.isoformat(),
            'data_vencimento': self.data_vencimento.isoformat() if self.data_vencimento else None,
            'metodo_pagamento': self.metodo_pagamento,
            'status': self.status,
            'observacoes': self.observacoes,
            'assinatura_id': self.assinatura_id,
            'numero_boleto': self.numero_boleto,
            'data_criacao': self.data_criacao.isoformat(),
            'valor_formatado': self.valor_formatado,
            'status_formatado': self.status_formatado
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Pagamento':
        """
        Cria um pagamento a partir de um dicionário.
        
        Args:
            data: Dicionário com os dados do pagamento
            
        Returns:
            Instância de Pagamento
        """
        pagamento = cls(
            aluno_id=data.get('aluno_id', 0),
            valor=data.get('valor', 0.0),
            data_pagamento=datetime.fromisoformat(data['data_pagamento']).date(),
            data_vencimento=datetime.fromisoformat(data['data_vencimento']).date() 
                           if data.get('data_vencimento') else None,
            metodo_pagamento=data.get('metodo_pagamento', 'Dinheiro'),
            status=data.get('status', 'pago'),
            observacoes=data.get('observacoes', ''),
            assinatura_id=data.get('assinatura_id')
        )
        
        pagamento.id = data.get('id')
        pagamento.numero_boleto = data.get('numero_boleto', pagamento.numero_boleto)
        if data.get('data_criacao'):
            pagamento.data_criacao = datetime.fromisoformat(data['data_criacao'])
            
        return pagamento
    
    def __str__(self) -> str:
        """Representação em string do pagamento."""
        return f"Pagamento(id={self.id}, aluno_id={self.aluno_id}, valor={self.valor_formatado})"
    
    def __repr__(self) -> str:
        """Representação detalhada do pagamento."""
        return self.__str__()

