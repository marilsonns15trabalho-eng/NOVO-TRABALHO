#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para limpar o banco de dados do LPE
Remove todos os dados das tabelas principais
"""

import os
import sys
import sqlite3

# Adicionar o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from data.database import db_manager

def limpar_banco_dados():
    """
    Limpa todas as tabelas do banco de dados.
    """
    try:
        print("Iniciando limpeza do banco de dados...")
        
        # Lista de tabelas para limpar (em ordem para evitar problemas de chave estrangeira)
        tabelas = [
            'avaliacoes_fisicas',
            'anamneses', 
            'treinos',
            'pagamentos',
            'assinaturas',
            'despesas',
            'alunos',
            'planos'
        ]
        
        for tabela in tabelas:
            try:
                query = f"DELETE FROM {tabela}"
                db_manager.execute_delete(query)
                print(f"✓ Tabela {tabela} limpa")
            except Exception as e:
                print(f"⚠ Erro ao limpar tabela {tabela}: {e}")
        
        # Resetar os contadores de ID (AUTOINCREMENT)
        try:
            db_manager.execute_delete("DELETE FROM sqlite_sequence")
            print("✓ Contadores de ID resetados")
        except Exception as e:
            print(f"⚠ Erro ao resetar contadores: {e}")
        
        print("\n✅ Limpeza do banco de dados concluída!")
        print("Todos os dados foram removidos e os IDs foram resetados.")
        
    except Exception as e:
        print(f"❌ Erro durante a limpeza: {e}")

if __name__ == "__main__":
    resposta = input("⚠️  ATENÇÃO: Esta operação irá APAGAR TODOS OS DADOS do banco!\nDeseja continuar? (digite 'SIM' para confirmar): ")
    
    if resposta.upper() == 'SIM':
        limpar_banco_dados()
    else:
        print("Operação cancelada.")

