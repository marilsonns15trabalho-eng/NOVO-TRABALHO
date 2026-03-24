# models/despesa.py
from datetime import date, datetime
from typing import Optional

class Despesa:
    def __init__(self, valor: float, data_despesa: date, categoria: str = None,
                 descricao: str = None, metodo_pagamento: str = None,
                 numero_registro: str = None):
        self.id: Optional[int] = None
        self.valor: float = valor
        self.data_despesa: date = data_despesa
        self.categoria: str = categoria or ""
        self.descricao: str = descricao or ""
        self.metodo_pagamento: str = metodo_pagamento or ""
        self.numero_registro: str = numero_registro or ""
        self.data_criacao: datetime = datetime.now()