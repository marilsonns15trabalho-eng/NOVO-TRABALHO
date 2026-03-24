# data/despesa_dao.py
from typing import List, Optional
from datetime import datetime, date
from models.despesa import Despesa
from data.database import db_manager

class DespesaDAO:
    def __init__(self):
        self.db = db_manager
    
    def criar_despesa(self, despesa: Despesa) -> int:
        query = '''
            INSERT INTO despesas (
                valor, data_despesa, categoria, descricao, 
                metodo_pagamento, numero_registro, data_criacao
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        '''
        params = (
            despesa.valor,
            despesa.data_despesa.isoformat(),
            despesa.categoria,
            despesa.descricao,
            despesa.metodo_pagamento,
            despesa.numero_registro,
            despesa.data_criacao.isoformat()
        )
        despesa_id = self.db.execute_insert(query, params)
        despesa.id = despesa_id
        return despesa_id
    
    def buscar_por_id(self, despesa_id: int) -> Optional[Despesa]:
        query = "SELECT * FROM despesas WHERE id = ?"
        resultados = self.db.execute_query(query, (despesa_id,))
        if resultados:
            return self._row_to_despesa(resultados[0])
        return None
    
    def buscar_por_periodo(self, data_inicio: date, data_fim: date) -> List[Despesa]:
        query = '''
            SELECT * FROM despesas 
            WHERE data_despesa BETWEEN ? AND ?
            ORDER BY data_despesa DESC
        '''
        params = (data_inicio.isoformat(), data_fim.isoformat())
        resultados = self.db.execute_query(query, params)
        return [self._row_to_despesa(row) for row in resultados]
    
    def listar_todas(self, limite: int = 100) -> List[Despesa]:
        query = "SELECT * FROM despesas ORDER BY data_despesa DESC LIMIT ?"
        resultados = self.db.execute_query(query, (limite,))
        return [self._row_to_despesa(row) for row in resultados]
    
    def atualizar_despesa(self, despesa: Despesa) -> bool:
        query = '''
            UPDATE despesas SET
                valor = ?, data_despesa = ?, categoria = ?,
                descricao = ?, metodo_pagamento = ?, numero_registro = ?
            WHERE id = ?
        '''
        params = (
            despesa.valor,
            despesa.data_despesa.isoformat(),
            despesa.categoria,
            despesa.descricao,
            despesa.metodo_pagamento,
            despesa.numero_registro,
            despesa.id
        )
        linhas_afetadas = self.db.execute_update(query, params)
        return linhas_afetadas > 0
    
    def excluir_despesa(self, despesa_id: int) -> bool:
        query = "DELETE FROM despesas WHERE id = ?"
        linhas_afetadas = self.db.execute_delete(query, (despesa_id,))
        return linhas_afetadas > 0
    
    def calcular_total_por_periodo(self, data_inicio: date, data_fim: date) -> float:
        query = '''
            SELECT SUM(valor) FROM despesas 
            WHERE data_despesa BETWEEN ? AND ?
        '''
        params = (data_inicio.isoformat(), data_fim.isoformat())
        resultado = self.db.execute_query(query, params)
        return resultado[0][0] if resultado and resultado[0][0] else 0.0
    
    def _row_to_despesa(self, row) -> Despesa:
        despesa = Despesa(
            valor=row['valor'],
            data_despesa=date.fromisoformat(row['data_despesa']),
            categoria=row['categoria'],
            descricao=row['descricao'],
            metodo_pagamento=row['metodo_pagamento'],
            numero_registro=row['numero_registro']
        )
        despesa.id = row['id']
        despesa.data_criacao = datetime.fromisoformat(row['data_criacao'])
        return despesa

# Instância global do DAO de despesas
despesa_dao = DespesaDAO()