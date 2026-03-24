# exportar_avaliacao.py
import os
from datetime import datetime
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image

from data.avaliacao_dao import avaliacao_dao
from data.aluno_dao import aluno_dao

def exportar_avaliacao_pdf(avaliacao_id: int, caminho_pdf: str):
    avaliacao = avaliacao_dao.buscar_avaliacao_por_id(avaliacao_id)
    if not avaliacao:
        raise ValueError("Avaliação não encontrada.")

    aluno_nome = aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id).nome if aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id) else "N/A"

    doc = SimpleDocTemplate(caminho_pdf, pagesize=A4)
    styles = getSampleStyleSheet()
    elementos = []

    # Cabeçalho
    titulo = f"Avaliação Física - {aluno_nome}"
    elementos.append(Paragraph(titulo, styles['Title']))
    elementos.append(Paragraph(f"Data: {avaliacao.data_avaliacao.strftime('%d/%m/%Y')}", styles['Normal']))
    elementos.append(Paragraph(f"Protocolo: {avaliacao.protocolo}", styles['Normal']))
    elementos.append(Spacer(1, 12))

    # Montar tabela de dados - CORRIGIDO: usar dobra_triceps em vez de dobra_tricipital
    dados_tabela = [
        ["Campo", "Valor"],
        ["Data", avaliacao.data_avaliacao.strftime("%d/%m/%Y")],
        ["Nome", aluno_nome],
        ["Sexo", aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id).genero if aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id) else "-"],
        ["Idade", aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id).idade if aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id) else "-"],
        ["Data de Nascimento", aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id).data_nascimento.strftime("%d/%m/%Y") if aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id) and aluno_dao.buscar_aluno_por_id(avaliacao.aluno_id).data_nascimento else "-"],
        ["Peso (kg)", f"{avaliacao.peso:.1f}" if avaliacao.peso else "-"],
        ["Altura (cm)", f"{avaliacao.altura*100:.1f}" if avaliacao.altura else "-"],
        ["IMC", f"{avaliacao.imc:.1f}" if avaliacao.imc else "-"],
        ["Classificação IMC", getattr(avaliacao, 'classificacao_imc', '-')],
        ["Peso Ideal (kg)", f"{avaliacao.peso_ideal:.1f}" if hasattr(avaliacao, 'peso_ideal') else "-"],
        ["Percentual de Gordura", f"{avaliacao.percentual_gordura:.1f}" if hasattr(avaliacao, 'percentual_gordura') else "-"],
        ["Massa Gorda (kg)", f"{avaliacao.massa_gorda:.1f}" if hasattr(avaliacao, 'massa_gorda') else "-"],
        ["Massa Muscular (kg)", f"{avaliacao.massa_muscular:.1f}" if hasattr(avaliacao, 'massa_muscular') else "-"],
        ["Peso Residual (kg)", f"{avaliacao.peso_residual:.1f}" if hasattr(avaliacao, 'peso_residual') else "-"],
        ["Circunferência Pescoço (cm)", f"{avaliacao.circunferencia_pescoco:.1f}" if hasattr(avaliacao, 'circunferencia_pescoco') else "-"],
        ["Circunferência Ombro (cm)", f"{avaliacao.circunferencia_ombro:.1f}" if hasattr(avaliacao, 'circunferencia_ombro') else "-"],
        ["Circunferência Peito (cm)", f"{avaliacao.circunferencia_peito:.1f}" if hasattr(avaliacao, 'circunferencia_peito') else "-"],
        ["Circunferência Cintura (cm)", f"{avaliacao.circunferencia_cintura:.1f}" if hasattr(avaliacao, 'circunferencia_cintura') else "-"],
        ["Circunferência Abdômen (cm)", f"{avaliacao.circunferencia_abdomen:.1f}" if hasattr(avaliacao, 'circunferencia_abdomen') else "-"],
        ["Circunferência Quadril (cm)", f"{avaliacao.circunferencia_quadril:.1f}" if hasattr(avaliacao, 'circunferencia_quadril') else "-"],
        ["Circunferência Braço Esq. (cm)", f"{avaliacao.circunferencia_braco_esq:.1f}" if hasattr(avaliacao, 'circunferencia_braco_esq') else "-"],
        ["Circunferência Braço Dir. (cm)", f"{avaliacao.circunferencia_braco_dir:.1f}" if hasattr(avaliacao, 'circunferencia_braco_dir') else "-"],
        ["Circunferência Coxa Esq. (cm)", f"{avaliacao.circunferencia_coxa_esq:.1f}" if hasattr(avaliacao, 'circunferencia_coxa_esq') else "-"],
        ["Circunferência Coxa Dir. (cm)", f"{avaliacao.circunferencia_coxa_dir:.1f}" if hasattr(avaliacao, 'circunferencia_coxa_dir') else "-"],
        ["Circunferência Panturrilha Esq. (cm)", f"{avaliacao.circunferencia_panturrilha_esq:.1f}" if hasattr(avaliacao, 'circunferencia_panturrilha_esq') else "-"],
        ["Circunferência Panturrilha Dir. (cm)", f"{avaliacao.circunferencia_panturrilha_dir:.1f}" if hasattr(avaliacao, 'circunferencia_panturrilha_dir') else "-"],
        ["Dobra Tricipital (mm)", f"{avaliacao.dobra_triceps:.1f}" if hasattr(avaliacao, 'dobra_triceps') else "-"],  # Corrigido para dobra_triceps
        ["Dobra Subescapular (mm)", f"{avaliacao.dobra_subescapular:.1f}" if hasattr(avaliacao, 'dobra_subescapular') else "-"],
        ["Dobra Supra-ilíaca (mm)", f"{avaliacao.dobra_suprailiaca:.1f}" if hasattr(avaliacao, 'dobra_suprailiaca') else "-"],
        ["Dobra Abdominal (mm)", f"{avaliacao.dobra_abdominal:.1f}" if hasattr(avaliacao, 'dobra_abdominal') else "-"],
        ["Dobra Bicipital (mm)", "-"],  # Campo não existe no modelo
        ["Dobra Axilar Média (mm)", f"{avaliacao.dobra_axilar_media:.1f}" if hasattr(avaliacao, 'dobra_axilar_media') else "-"],
        ["Dobra Coxa (mm)", f"{avaliacao.dobra_coxa:.1f}" if hasattr(avaliacao, 'dobra_coxa') else "-"],
        ["Dobra Panturrilha (mm)", "-"],  # Campo não existe no modelo
        ["Soma Perimetria (cm)", "-"],  # Campo não existe no modelo
        ["Soma Antropometria (mm)", f"{avaliacao.soma_dobras:.1f}" if hasattr(avaliacao, 'soma_dobras') else "-"],
        ["RCQ", f"{avaliacao.relacao_cintura_quadril:.2f}" if hasattr(avaliacao, 'relacao_cintura_quadril') else "-"],
        ["Classificação RCQ", getattr(avaliacao, 'classificacao_rcq', '-')],
        ["Pressão Arterial", avaliacao.pressao_arterial if hasattr(avaliacao, 'pressao_arterial') else "-"],
        ["Frequência Cardíaca (bpm)", str(avaliacao.frequencia_cardiaca) if hasattr(avaliacao, 'frequencia_cardiaca') else "-"],
        ["Observações", avaliacao.observacoes or "-"]
    ]

    tabela = Table(dados_tabela, colWidths=[200, 200])
    tabela.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.orange),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elementos.append(tabela)
    elementos.append(Spacer(1, 20))

    # Função para criar gráficos de linha (evolução)
    def criar_grafico_linha(titulo, dados, y_label):
        plt.figure(figsize=(4, 3))
        plt.plot([d["data"] for d in dados], [d[y_label] for d in dados], marker="o")
        plt.title(titulo)
        plt.xlabel("Data")
        plt.ylabel(y_label)
        plt.grid(True)
        caminho_img = f"{y_label}_grafico_linha.png"
        plt.savefig(caminho_img)
        plt.close()
        return caminho_img

    # Função para criar gráfico de pizza (composição corporal)
    def criar_grafico_pizza(titulo, labels, sizes):
        plt.figure(figsize=(4, 3))
        plt.pie(sizes, labels=labels, autopct="%1.1f%%", startangle=90, colors=["#FF6B6B", "#27AE60"])
        plt.title(titulo)
        plt.axis("equal")  # Equal aspect ratio ensures that pie is drawn as a circle.
        caminho_img = f"{titulo.replace(' ', '_')}_grafico_pizza.png"
        plt.savefig(caminho_img)
        plt.close()
        return caminho_img

    imagens_temp = []

    # Gráficos de evolução - CORRIGIDO: ordem dos gráficos
    # Peso
    dados_peso = avaliacao_dao.obter_evolucao_peso(avaliacao.aluno_id)
    if dados_peso:
        img_peso = criar_grafico_linha("Evolução do Peso", dados_peso, "peso")
        elementos.append(Paragraph("Evolução do Peso", styles["Heading2"]))
        elementos.append(Image(img_peso, width=300, height=200))
        imagens_temp.append(img_peso)

    # IMC
    dados_imc = avaliacao_dao.obter_evolucao_imc(avaliacao.aluno_id)
    if dados_imc:
        img_imc = criar_grafico_linha("Evolução do IMC", dados_imc, "imc")
        elementos.append(Paragraph("Evolução do IMC", styles["Heading2"]))
        elementos.append(Image(img_imc, width=300, height=200))
        imagens_temp.append(img_imc)

    # % Gordura
    dados_gordura = avaliacao_dao.obter_evolucao_gordura(avaliacao.aluno_id)
    if dados_gordura:
        img_gordura = criar_grafico_linha("Evolução do % Gordura", dados_gordura, "percentual_gordura")
        elementos.append(Paragraph("Evolução do % Gordura", styles["Heading2"]))
        elementos.append(Image(img_gordura, width=300, height=200))
        imagens_temp.append(img_gordura)

    # Composição Corporal (Massa Gorda e Massa Muscular) - Gráfico de Pizza
    if hasattr(avaliacao, 'massa_gorda') and hasattr(avaliacao, 'massa_muscular'):
        labels = ['Massa Gorda', 'Massa Muscular']
        sizes = [avaliacao.massa_gorda, avaliacao.massa_muscular]
        img_composicao = criar_grafico_pizza("Composição Corporal", labels, sizes)
        elementos.append(Paragraph("Composição Corporal", styles["Heading2"]))
        elementos.append(Image(img_composicao, width=300, height=200))
        imagens_temp.append(img_composicao)

    doc.build(elementos)

    # Remover imagens temporárias
    for img in imagens_temp:
        if os.path.exists(img):
            os.remove(img)