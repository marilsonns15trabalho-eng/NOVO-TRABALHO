#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para criar um aluno de teste
"""

import sys
import os
from datetime import date

# Adicionar o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from models.aluno import Aluno
from data.aluno_dao import aluno_dao

def criar_aluno_teste():
    """Cria um aluno de teste."""
    try:
        # Verificar se já existe algum aluno
        alunos = aluno_dao.listar_todos_alunos()
        if alunos:
            print(f"Já existem {len(alunos)} alunos no banco de dados.")
            for aluno in alunos:
                print(f"- {aluno.nome}")
            return True
        
        # Criar aluno de teste
        aluno_teste = Aluno(
            nome="Marilson Nascimento",
            email="marilson@teste.com",
            telefone="(11) 99999-9999",
            data_nascimento=date(1990, 5, 15),
            endereco="Rua Teste, 123",
            profissao="Desenvolvedor"
        )
        
        # Salvar aluno
        aluno_id = aluno_dao.criar_aluno(aluno_teste)
        print(f"Aluno de teste criado com ID: {aluno_id}")
        print(f"Nome: {aluno_teste.nome}")
        
        return True
        
    except Exception as e:
        print(f"Erro ao criar aluno de teste: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Criando aluno de teste...")
    sucesso = criar_aluno_teste()
    if sucesso:
        print("✅ Aluno de teste criado com sucesso!")
    else:
        print("❌ Erro ao criar aluno de teste!")

