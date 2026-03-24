import sys
import os
from datetime import date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from models.avaliacao_fisica import AvaliacaoFisica
from data.aluno_dao import aluno_dao

# Mocking aluno_dao for simulation purposes
class MockAluno:
    def __init__(self, nome, genero, data_nascimento, idade):
        self.nome = nome
        self.genero = genero
        self.data_nascimento = data_nascimento
        self.idade = idade

class MockAlunoDAO:
    def buscar_aluno_por_id(self, aluno_id):
        # Using a fixed mock student for this simulation
        return MockAluno("Cristiane Silva dos Santos", "F", date(1989, 11, 20), 35)

aluno_dao = MockAlunoDAO()

# Dados do MFIT Personal cris.pdf
# Perimetria (Circunferências em cm)
# Pescoço: 35.5
# Ombro: 111.0
# Tórax: 99.0
# Braço Esquerdo: 32.0
# Braço Direito: 32.5
# Cintura: 85.0
# Abdômen: 90.0
# Quadril: 110.0
# Coxa Esquerda: 64.5
# Coxa Direita: 66.5
# Panturrilha Esquerda: 41.0
# Panturrilha Direita: 41.0

# Antropometria (Dobras Cutâneas em mm)
# Tricipital: 31
# Subescapular: 30
# Supra-ilíaca: 23
# Abdominal: 37

# Dados Pessoais
peso = 82.1 # kg
altura = 1.65 # m (assumindo que 1.65cm é erro de digitação e deveria ser 1.65m ou 165cm)

# Criar uma instância de AvaliacaoFisica com os dados do MFIT
avaliacao = AvaliacaoFisica(
    aluno_id=1, # ID fictício para o mock
    data_avaliacao=date(2025, 8, 14),
    peso=peso,
    altura=altura, # Altura em metros
    dobra_triceps=31,
    dobra_subescapular=30,
    dobra_suprailiaca=23,
    dobra_abdominal=37,
    circunferencia_pescoco=35.5,
    circunferencia_ombro=111.0,
    circunferencia_peito=99.0,
    circunferencia_cintura=85.0,
    circunferencia_abdomen=90.0,
    circunferencia_quadril=110.0,
    circunferencia_braco_esq=32.0,
    circunferencia_braco_dir=32.5,
    circunferencia_coxa_esq=64.5,
    circunferencia_coxa_dir=66.5,
    circunferencia_panturrilha_esq=41.0,
    circunferencia_panturrilha_dir=41.0,
    protocolo="Faulkner"
)

# Executar os cálculos
avaliacao.calcular_resultados()

# Imprimir os resultados
print(f"\n--- Resultados Calculados (Lógica Corrigida) ---")
print(f"Peso: {avaliacao.peso} kg")
print(f"Altura: {avaliacao.altura_cm} cm")
print(f"IMC: {avaliacao.imc:.2f} ({avaliacao.classificacao_imc})")
print(f"Percentual de Gordura (Faulkner): {avaliacao.percentual_gordura:.2f}%")
print(f"Massa Gorda: {avaliacao.massa_gorda:.2f} kg")
print(f"Massa Muscular: {avaliacao.massa_muscular:.2f} kg")
print(f"Peso Ideal: {avaliacao.peso_ideal:.2f} kg")
print(f"Peso Residual: {avaliacao.peso_residual:.2f} kg")
print(f"RCQ: {avaliacao.relacao_cintura_quadril:.2f} ({avaliacao.classificacao_rcq})")
print(f"Soma das Dobras: {avaliacao.soma_dobras:.2f} mm")

print(f"\n--- Dados do MFIT Personal (para comparação) ---")
print(f"IMC: 30.20 Obesidade grau I")
print(f"RCQ: 0.77 Baixo")
print(f"% de Gordura: 24.3%")
print(f"Massa Magra: 62.15 kg")
print(f"Massa Gorda: 19.95 kg")
print(f"Peso Ideal Proposto: 70 kg")
print(f"Soma antropometria: 121mm")


