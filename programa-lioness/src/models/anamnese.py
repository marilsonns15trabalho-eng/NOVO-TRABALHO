#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lioness Personal Estúdio (LPE) - Modelo Anamnese Nutricional

Este módulo contém a classe AnamneseNutricional que representa
uma anamnese nutricional completa de um aluno.
"""

from datetime import datetime, date
from typing import Optional, Dict, Any

class AnamneseNutricional:
    """
    Classe que representa uma anamnese nutricional completa.
    
    Contém informações detalhadas sobre hábitos alimentares,
    histórico de saúde, objetivos nutricionais e outras
    informações relevantes para acompanhamento nutricional.
    """
    
    def __init__(self,
                 aluno_id: int,
                 data_anamnese: date = None,
                 peso: float = None,
                 altura: float = None,
                 objetivo_nutricional: str = "",
                 restricoes_alimentares: str = "",
                 alergias: str = "",
                 medicamentos: str = "",
                 historico_familiar: str = "",
                 habitos_alimentares: str = "",
                 consumo_agua: str = "",
                 atividade_fisica: str = "",
                 observacoes: str = "",
                 circunferencia_abdominal: str = "",
                 circunferencia_quadril: str = "",
                 medidas_corpo: str = "",
                 doencas_cronicas: str = "",
                 problemas_saude: str = "",
                 cirurgias: str = "",
                 condicoes_hormonais: str = "",
                 acompanhamento_psicologico: str = "",
                 disturbios_alimentares: str = "",
                 gravida_amamentando: str = "",
                 acompanhamento_previo: str = "",
                 frequencia_refeicoes: str = "",
                 horarios_refeicoes: str = "",
                 consumo_fastfood: str = "",
                 consumo_doces: str = "",
                 consumo_bebidas_acucaradas: str = "",
                 consumo_alcool: str = "",
                 gosta_cozinhar: str = "",
                 preferencia_alimentos: str = "",
                 consumo_cafe: str = "",
                 uso_suplementos: str = "",
                 frequencia_atividade_fisica: str = "",
                 objetivos_treino: str = "",
                 rotina_sono: str = "",
                 nivel_estresse: str = "",
                 tempo_sentado: str = "",
                 dificuldade_dietas: str = "",
                 lanches_fora: str = "",
                 come_emocional: str = "",
                 beliscar: str = "",
                 compulsao_alimentar: str = "",
                 fome_fora_horario: str = "",
                 estrategias_controle_peso: str = "",
                 alimentos_preferidos: str = "",
                 alimentos_evitados: str = "",
                 meta_peso_medidas: str = "",
                 disposicao_mudancas: str = "",
                 preferencia_dietas: str = "",
                 expectativas: str = ""):
        """
        Inicializa uma nova anamnese nutricional.
        
        Args:
            aluno_id: ID do aluno (obrigatório)
            data_anamnese: Data da anamnese
            peso: Peso atual em kg
            altura: Altura em metros
            objetivo_nutricional: Objetivo nutricional do aluno
            restricoes_alimentares: Restrições alimentares
            alergias: Alergias alimentares ou medicamentosas
            medicamentos: Medicamentos em uso
            historico_familiar: Histórico familiar de doenças
            habitos_alimentares: Descrição dos hábitos alimentares
            consumo_agua: Informações sobre consumo de água
            atividade_fisica: Nível de atividade física
            observacoes: Observações gerais
            circunferencia_abdominal: Circunferência abdominal
            circunferencia_quadril: Circunferência do quadril
            medidas_corpo: Outras medidas corporais
            doencas_cronicas: Doenças crônicas
            problemas_saude: Problemas de saúde
            cirurgias: Histórico de cirurgias
            condicoes_hormonais: Condições hormonais
            acompanhamento_psicologico: Acompanhamento psicológico
            disturbios_alimentares: Distúrbios alimentares
            gravida_amamentando: Se está grávida ou amamentando
            acompanhamento_previo: Acompanhamento nutricional prévio
            frequencia_refeicoes: Frequência de refeições
            horarios_refeicoes: Horários das refeições
            consumo_fastfood: Consumo de fast food
            consumo_doces: Consumo de doces
            consumo_bebidas_acucaradas: Consumo de bebidas açucaradas
            consumo_alcool: Consumo de álcool
            gosta_cozinhar: Se gosta de cozinhar
            preferencia_alimentos: Preferências alimentares
            consumo_cafe: Consumo de café
            uso_suplementos: Uso de suplementos
            frequencia_atividade_fisica: Frequência de atividade física
            objetivos_treino: Objetivos de treino
            rotina_sono: Rotina de sono
            nivel_estresse: Nível de estresse
            tempo_sentado: Tempo sentado
            dificuldade_dietas: Dificuldade com dietas
            lanches_fora: Lanches fora de casa
            come_emocional: Alimentação emocional
            beliscar: Hábito de beliscar
            compulsao_alimentar: Compulsão alimentar
            fome_fora_horario: Fome fora de horário
            estrategias_controle_peso: Estratégias de controle de peso
            alimentos_preferidos: Alimentos preferidos
            alimentos_evitados: Alimentos evitados
            meta_peso_medidas: Meta de peso ou medidas
            disposicao_mudancas: Disposição para mudanças
            preferencia_dietas: Preferência de dietas
            expectativas: Expectativas do aluno
        """
        self.id: Optional[int] = None  # Será definido pelo banco de dados
        self.aluno_id = aluno_id
        self.data_anamnese = data_anamnese or date.today()
        self.peso = peso
        self.altura = altura
        self.objetivo_nutricional = objetivo_nutricional
        self.restricoes_alimentares = restricoes_alimentares
        self.alergias = alergias
        self.medicamentos = medicamentos
        self.historico_familiar = historico_familiar
        self.habitos_alimentares = habitos_alimentares
        self.consumo_agua = consumo_agua
        self.atividade_fisica = atividade_fisica
        self.observacoes = observacoes
        self.circunferencia_abdominal = circunferencia_abdominal
        self.circunferencia_quadril = circunferencia_quadril
        self.medidas_corpo = medidas_corpo
        self.doencas_cronicas = doencas_cronicas
        self.problemas_saude = problemas_saude
        self.cirurgias = cirurgias
        self.condicoes_hormonais = condicoes_hormonais
        self.acompanhamento_psicologico = acompanhamento_psicologico
        self.disturbios_alimentares = disturbios_alimentares
        self.gravida_amamentando = gravida_amamentando
        self.acompanhamento_previo = acompanhamento_previo
        self.frequencia_refeicoes = frequencia_refeicoes
        self.horarios_refeicoes = horarios_refeicoes
        self.consumo_fastfood = consumo_fastfood
        self.consumo_doces = consumo_doces
        self.consumo_bebidas_acucaradas = consumo_bebidas_acucaradas
        self.consumo_alcool = consumo_alcool
        self.gosta_cozinhar = gosta_cozinhar
        self.preferencia_alimentos = preferencia_alimentos
        self.consumo_cafe = consumo_cafe
        self.uso_suplementos = uso_suplementos
        self.frequencia_atividade_fisica = frequencia_atividade_fisica
        self.objetivos_treino = objetivos_treino
        self.rotina_sono = rotina_sono
        self.nivel_estresse = nivel_estresse
        self.tempo_sentado = tempo_sentado
        self.dificuldade_dietas = dificuldade_dietas
        self.lanches_fora = lanches_fora
        self.come_emocional = come_emocional
        self.beliscar = beliscar
        self.compulsao_alimentar = compulsao_alimentar
        self.fome_fora_horario = fome_fora_horario
        self.estrategias_controle_peso = estrategias_controle_peso
        self.alimentos_preferidos = alimentos_preferidos
        self.alimentos_evitados = alimentos_evitados
        self.meta_peso_medidas = meta_peso_medidas
        self.disposicao_mudancas = disposicao_mudancas
        self.preferencia_dietas = preferencia_dietas
        self.expectativas = expectativas
        self.data_criacao = datetime.now()
    
    @property
    def imc(self) -> Optional[float]:
        """Calcula o IMC se peso e altura estiverem disponíveis."""
        if self.peso and self.altura and self.altura > 0:
            return round(self.peso / (self.altura ** 2), 2)
        return None
    
    @property
    def classificacao_imc(self) -> str:
        """Retorna a classificação do IMC."""
        imc = self.imc
        if imc is None:
            return "Não calculado"
        
        if imc < 18.5:
            return "Abaixo do peso"
        elif imc < 25:
            return "Peso normal"
        elif imc < 30:
            return "Sobrepeso"
        elif imc < 35:
            return "Obesidade grau I"
        elif imc < 40:
            return "Obesidade grau II"
        else:
            return "Obesidade grau III"
    
    @property
    def peso_formatado(self) -> str:
        """Retorna o peso formatado."""
        if self.peso:
            return f"{self.peso:.1f} kg"
        return "Não informado"
    
    @property
    def altura_formatada(self) -> str:
        """Retorna a altura formatada."""
        if self.altura:
            return f"{self.altura:.2f} m"
        return "Não informado"
    
    @property
    def imc_formatado(self) -> str:
        """Retorna o IMC formatado com classificação."""
        imc = self.imc
        if imc:
            return f"{imc:.2f} ({self.classificacao_imc})"
        return "Não calculado"
    
    def calcular_peso_ideal_robinson(self) -> Optional[float]:
        """
        Calcula o peso ideal usando a fórmula de Robinson.
        
        Returns:
            Peso ideal em kg ou None se altura não disponível
        """
        if not self.altura:
            return None
        
        altura_cm = self.altura * 100
        
        # Fórmula de Robinson (assumindo sexo masculino como padrão)
        # Para mulheres: 49 + 1.7 * (altura_cm - 152.4)
        # Para homens: 52 + 1.9 * (altura_cm - 152.4)
        # Usando média entre os dois
        peso_ideal = 50.5 + 1.8 * (altura_cm - 152.4)
        return round(peso_ideal, 1)
    
    def calcular_gasto_energetico_basal(self, sexo: str = "M", idade: int = 30) -> Optional[float]:
        """
        Calcula o gasto energético basal usando a equação de Harris-Benedict.
        
        Args:
            sexo: "M" para masculino, "F" para feminino
            idade: Idade em anos
            
        Returns:
            Gasto energético basal em kcal/dia
        """
        if not self.peso or not self.altura:
            return None
        
        altura_cm = self.altura * 100
        
        if sexo.upper() == "M":
            # Homens: 88.362 + (13.397 × peso) + (4.799 × altura) - (5.677 × idade)
            geb = 88.362 + (13.397 * self.peso) + (4.799 * altura_cm) - (5.677 * idade)
        else:
            # Mulheres: 447.593 + (9.247 × peso) + (3.098 × altura) - (4.330 × idade)
            geb = 447.593 + (9.247 * self.peso) + (3.098 * altura_cm) - (4.330 * idade)
        
        return round(geb, 0)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Converte a anamnese para um dicionário.
        
        Returns:
            Dicionário com todos os dados da anamnese
        """
        return {
            'id': self.id,
            'aluno_id': self.aluno_id,
            'data_anamnese': self.data_anamnese.isoformat() if self.data_anamnese else None,
            'peso': self.peso,
            'altura': self.altura,
            'objetivo_nutricional': self.objetivo_nutricional,
            'restricoes_alimentares': self.restricoes_alimentares,
            'alergias': self.alergias,
            'medicamentos': self.medicamentos,
            'historico_familiar': self.historico_familiar,
            'habitos_alimentares': self.habitos_alimentares,
            'consumo_agua': self.consumo_agua,
            'atividade_fisica': self.atividade_fisica,
            'observacoes': self.observacoes,
            'circunferencia_abdominal': self.circunferencia_abdominal,
            'circunferencia_quadril': self.circunferencia_quadril,
            'medidas_corpo': self.medidas_corpo,
            'doencas_cronicas': self.doencas_cronicas,
            'problemas_saude': self.problemas_saude,
            'cirurgias': self.cirurgias,
            'condicoes_hormonais': self.condicoes_hormonais,
            'acompanhamento_psicologico': self.acompanhamento_psicologico,
            'disturbios_alimentares': self.disturbios_alimentares,
            'gravida_amamentando': self.gravida_amamentando,
            'acompanhamento_previo': self.acompanhamento_previo,
            'frequencia_refeicoes': self.frequencia_refeicoes,
            'horarios_refeicoes': self.horarios_refeicoes,
            'consumo_fastfood': self.consumo_fastfood,
            'consumo_doces': self.consumo_doces,
            'consumo_bebidas_acucaradas': self.consumo_bebidas_acucaradas,
            'consumo_alcool': self.consumo_alcool,
            'gosta_cozinhar': self.gosta_cozinhar,
            'preferencia_alimentos': self.preferencia_alimentos,
            'consumo_cafe': self.consumo_cafe,
            'uso_suplementos': self.uso_suplementos,
            'frequencia_atividade_fisica': self.frequencia_atividade_fisica,
            'objetivos_treino': self.objetivos_treino,
            'rotina_sono': self.rotina_sono,
            'nivel_estresse': self.nivel_estresse,
            'tempo_sentado': self.tempo_sentado,
            'dificuldade_dietas': self.dificuldade_dietas,
            'lanches_fora': self.lanches_fora,
            'come_emocional': self.come_emocional,
            'beliscar': self.beliscar,
            'compulsao_alimentar': self.compulsao_alimentar,
            'fome_fora_horario': self.fome_fora_horario,
            'estrategias_controle_peso': self.estrategias_controle_peso,
            'alimentos_preferidos': self.alimentos_preferidos,
            'alimentos_evitados': self.alimentos_evitados,
            'meta_peso_medidas': self.meta_peso_medidas,
            'disposicao_mudancas': self.disposicao_mudancas,
            'preferencia_dietas': self.preferencia_dietas,
            'expectativas': self.expectativas,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'imc': self.imc,
            'classificacao_imc': self.classificacao_imc,
            'peso_formatado': self.peso_formatado,
            'altura_formatada': self.altura_formatada,
            'imc_formatado': self.imc_formatado
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AnamneseNutricional':
        """
        Cria uma anamnese a partir de um dicionário.
        
        Args:
            data: Dicionário com os dados da anamnese
            
        Returns:
            Instância de AnamneseNutricional
        """
        anamnese = cls(
            aluno_id=data.get("aluno_id"),
            data_anamnese=date.fromisoformat(data["data_anamnese"]) if data.get("data_anamnese") else None,
            peso=data.get("peso"),
            altura=data.get("altura"),
            objetivo_nutricional=data.get("objetivo_nutricional", ""),
            restricoes_alimentares=data.get("restricoes_alimentares", ""),
            alergias=data.get("alergias", ""),
            medicamentos=data.get("medicamentos", ""),
            historico_familiar=data.get("historico_familiar", ""),
            habitos_alimentares=data.get("habitos_alimentares", ""),
            consumo_agua=data.get("consumo_agua", ""),
            atividade_fisica=data.get("atividade_fisica", ""),
            observacoes=data.get("observacoes", ""),
            circunferencia_abdominal=data.get("circunferencia_abdominal", ""),
            circunferencia_quadril=data.get("circunferencia_quadril", ""),
            medidas_corpo=data.get("medidas_corpo", ""),
            doencas_cronicas=data.get("doencas_cronicas", ""),
            problemas_saude=data.get("problemas_saude", ""),
            cirurgias=data.get("cirurgias", ""),
            condicoes_hormonais=data.get("condicoes_hormonais", ""),
            acompanhamento_psicologico=data.get("acompanhamento_psicologico", ""),
            disturbios_alimentares=data.get("disturbios_alimentares", ""),
            gravida_amamentando=data.get("gravida_amamentando", ""),
            acompanhamento_previo=data.get("acompanhamento_previo", ""),
            frequencia_refeicoes=data.get("frequencia_refeicoes", ""),
            horarios_refeicoes=data.get("horarios_refeicoes", ""),
            consumo_fastfood=data.get("consumo_fastfood", ""),
            consumo_doces=data.get("consumo_doces", ""),
            consumo_bebidas_acucaradas=data.get("consumo_bebidas_acucaradas", ""),
            consumo_alcool=data.get("consumo_alcool", ""),
            gosta_cozinhar=data.get("gosta_cozinhar", ""),
            preferencia_alimentos=data.get("preferencia_alimentos", ""),
            consumo_cafe=data.get("consumo_cafe", ""),
            uso_suplementos=data.get("uso_suplementos", ""),
            frequencia_atividade_fisica=data.get("frequencia_atividade_fisica", ""),
            objetivos_treino=data.get("objetivos_treino", ""),
            rotina_sono=data.get("rotina_sono", ""),
            nivel_estresse=data.get("nivel_estresse", ""),
            tempo_sentado=data.get("tempo_sentado", ""),
            dificuldade_dietas=data.get("dificuldade_dietas", ""),
            lanches_fora=data.get("lanches_fora", ""),
            come_emocional=data.get("come_emocional", ""),
            beliscar=data.get("beliscar", ""),
            compulsao_alimentar=data.get("compulsao_alimentar", ""),
            fome_fora_horario=data.get("fome_fora_horario", ""),
            estrategias_controle_peso=data.get("estrategias_controle_peso", ""),
            alimentos_preferidos=data.get("alimentos_preferidos", ""),
            alimentos_evitados=data.get("alimentos_evitados", ""),
            meta_peso_medidas=data.get("meta_peso_medidas", ""),
            disposicao_mudancas=data.get("disposicao_mudancas", ""),
            preferencia_dietas=data.get("preferencia_dietas", ""),
            expectativas=data.get("expectativas", "")
        )
        
        anamnese.id = data.get("id")
        
        if data.get("data_criacao"):
            anamnese.data_criacao = datetime.fromisoformat(data["data_criacao"])
            
        return anamnese
    
    def __str__(self) -> str:
        """Representação em string da anamnese."""
        return f"AnamneseNutricional(id={self.id}, aluno_id={self.aluno_id}, data={self.data_anamnese})"
    
    def __repr__(self) -> str:
        """Representação detalhada da anamnese."""
        return self.__str__()

