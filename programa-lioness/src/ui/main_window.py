import tkinter as tk
from tkinter import ttk, messagebox
import traceback
import os
import sys

# Adicionar o diretório src ao path para importações
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# Importar módulos de GUI do LPE
from src.gui.modulo_alunos import ModuloAlunos
from src.gui.modulo_anamnese import ModuloAnamnese
from src.gui.modulo_avaliacao import ModuloAvaliacao
from src.gui.modulo_edicao import ModuloEdicao
from src.gui.modulo_financeiro import ModuloFinanceiro
from src.gui.modulo_planos import ModuloPlanos
from src.gui.modulo_relatorios import ModuloRelatorios
from src.gui.modulo_treinos import ModuloTreinos

# Importar gerenciador de ícones
from src.utils.icon_manager import get_icon_manager

class MainWindow(tk.Tk):
    """
    Classe principal da aplicação que gerencia a janela principal
    e o sistema de navegação entre os módulos, utilizando a interface do LPE.
    Versão com suporte a ícones.
    """
    
    def __init__(self):
        super().__init__()
        
        # Inicializar gerenciador de ícones
        self.icon_manager = get_icon_manager()
        
        # 👇 LINHA 34: ADICIONAR AQUI (com 8 espaços de indentação)
        self.after_id = None  # Armazenar o ID do after para cancelamento
        
        # Configurações da janela
        self.title("Lioness Personal Estúdio - PRIME")
        self.geometry("1400x900")
        self.state("zoomed")  # Maximizar a janela
        self.configure(bg="#000000")
        
        # Configurar ícone da janela
        self._configurar_icone_janela()
        
        # Configurar o estilo
        self.configurar_estilo()
        
        # Criar a interface
        self.criar_interface()
        
        self.modulo_atual = None
        
        # 👇 LINHA 53: MODIFICAR ESTA LINHA (substituir a linha existente)
        # ANTES: self.after(2000, self.verificar_notificacoes_boletos)
        # DEPOIS:
        self.after_id = self.after(2000, self.verificar_notificacoes_boletos)
        
    def _configurar_icone_janela(self):
        """Configura o ícone da janela principal."""
        try:
            self.icon_manager.set_window_icon(self, 'program_top')
        except Exception as e:
            print(f"Aviso: Não foi possível definir o ícone da janela: {e}")
    
    # 👇 LINHA 64: ADICIONAR ESTE MÉTODO NOVO AQUI
    def cancelar_agendamentos(self):
        """Cancela todos os agendamentos pendentes."""
        if hasattr(self, 'after_id') and self.after_id:
            try:
                self.after_cancel(self.after_id)
                self.after_id = None
            except Exception:
                pass
    
    def configurar_estilo(self):
        """Configura o estilo visual da aplicação com as cores especificadas do LPE."""
        self.style = ttk.Style()
        self.style.theme_use("clam")
        
        # Configurações de cores (Preto: #000000, Branco: #FFFFFF, Laranja: #FFA500)
        self.style.configure("Principal.TFrame", background="#000000")
        self.style.configure("Menu.TFrame", background="#1a1a1a", relief="raised", borderwidth=2)
        self.style.configure("Menu.TButton", background="#333333", foreground="#FFFFFF",
                           font=("Arial", 11, "bold"), padding=(10, 8), relief="flat")
        self.style.map("Menu.TButton", background=[("active", "#FFA500"), ("pressed", "#FF8C00")],
                      foreground=[("active", "#000000"), ("pressed", "#000000")])
        self.style.configure("MenuAtivo.TButton", background="#FFA500", foreground="#000000",
                           font=("Arial", 11, "bold"), padding=(10, 8), relief="flat")
        self.style.configure("Titulo.TLabel", background="#000000", foreground="#FFA500",
                           font=("Arial", 20, "bold"))
        self.style.configure("Subtitulo.TLabel", background="#000000", foreground="#FFFFFF",
                           font=("Arial", 14))
        self.style.configure("Conteudo.TFrame", background="#FFFFFF", relief="sunken", borderwidth=2)
        
    def criar_interface(self):
        """Cria a interface principal da aplicação."""
        self.frame_principal = ttk.Frame(self, style="Principal.TFrame")
        self.frame_principal.pack(fill="both", expand=True, padx=5, pady=5)
        
        self.criar_cabecalho()
        self.frame_conteudo = ttk.Frame(self.frame_principal, style="Principal.TFrame")
        self.frame_conteudo.pack(fill="both", expand=True, pady=(10, 0))
        
        self.criar_menu_lateral()
        self.criar_area_conteudo()
        self.criar_rodape()
        
    def criar_cabecalho(self):
        """Cria o cabeçalho da aplicação."""
        frame_cabecalho = ttk.Frame(self.frame_principal, style="Principal.TFrame")
        frame_cabecalho.pack(fill="x", pady=(0, 10))
        
        titulo = ttk.Label(frame_cabecalho, text="🦁 LIONESS PERSONAL ESTÚDIO - PRIME", style="Titulo.TLabel")
        titulo.pack(side="left")
        
        subtitulo = ttk.Label(frame_cabecalho, text="Sistema de Gestão Completo", style="Subtitulo.TLabel")
        subtitulo.pack(side="left", padx=(20, 0))
        
        btn_config = ttk.Button(frame_cabecalho, text="⚙️ Configurações", style="Menu.TButton",
                               command=self.abrir_configuracoes)
        btn_config.pack(side="right")
        
    def criar_menu_lateral(self):
        """Cria o menu lateral de navegação."""
        self.frame_menu = ttk.Frame(self.frame_conteudo, style="Menu.TFrame")
        self.frame_menu.pack(side="left", fill="y", padx=(0, 10))
        
        titulo_menu = ttk.Label(self.frame_menu, text="MENU PRINCIPAL",
                               background="#1a1a1a", foreground="#FFA500", font=("Arial", 12, "bold"))
        titulo_menu.pack(pady=(10, 20), padx=10)
        
        opcoes_menu = [
            ("👥 Alunos", self.abrir_modulo_alunos),
            ("💰 Financeiro", self.abrir_modulo_financeiro),
            ("📋 Planos", self.abrir_modulo_planos),
            ("🏋️ Treinos", self.abrir_modulo_treinos),
            ("🥗 Anamnese Nutricional", self.abrir_modulo_anamnese),
            ("📊 Avaliação Física", self.abrir_modulo_avaliacao),
            ("📈 Relatórios", self.abrir_modulo_relatorios),
            ("🔧 Edição Geral", self.abrir_modulo_edicao)
        ]
        
        self.botoes_menu = {}
        for texto, comando in opcoes_menu:
            btn = ttk.Button(self.frame_menu, text=texto, style="Menu.TButton",
                           command=comando, width=25)
            btn.pack(pady=5, padx=10, fill="x")
            self.botoes_menu[texto] = btn
            
    def criar_area_conteudo(self):
        """Cria a área principal de conteúdo."""
        self.frame_area_conteudo = ttk.Frame(self.frame_conteudo, style="Conteudo.TFrame")
        self.frame_area_conteudo.pack(side="right", fill="both", expand=True)
        
        self.mostrar_tela_inicial()
        
    def criar_rodape(self):
        """Cria o rodapé da aplicação."""
        frame_rodape = ttk.Frame(self.frame_principal, style="Principal.TFrame")
        frame_rodape.pack(fill="x", pady=(10, 0))
        
        info_rodape = ttk.Label(frame_rodape, text="© 2024 Lioness Personal Estúdio - Versão PRIME",
                               background="#000000", foreground="#888888", font=("Arial", 9))
        info_rodape.pack(side="left")
        
        self.status_label = ttk.Label(frame_rodape, text="Sistema Pronto",
                                     background="#000000", foreground="#00FF00", font=("Arial", 9, "bold"))
        self.status_label.pack(side="right")

    def limpar_area_conteudo(self):
        """Remove todos os widgets da área de conteúdo."""
        for widget in self.frame_area_conteudo.winfo_children():
            widget.destroy()
        
    def mostrar_tela_inicial(self):
        """Mostra a tela inicial de boas-vindas."""
        self.limpar_area_conteudo()
            
        frame_central = tk.Frame(self.frame_area_conteudo, bg="#FFFFFF")
        frame_central.pack(expand=True, fill="both")
        
        titulo_boas_vindas = tk.Label(frame_central,
                                     text="Bem-vindo ao Lioness Personal Estúdio - PRIME!",
                                     bg="#FFFFFF", fg="#000000", font=("Arial", 24, "bold"))
        titulo_boas_vindas.pack(pady=(100, 30))
        
        descricao = tk.Label(frame_central,
                           text="Sistema completo de gestão para seu estúdio de personal training.\n"
                                "Utilize o menu lateral para navegar entre os módulos.",
                           bg="#FFFFFF", fg="#333333", font=("Arial", 14), justify="center")
        descricao.pack(pady=(0, 50))
        
        logo_placeholder = tk.Label(frame_central, text="🦁",
                                   bg="#FFFFFF", fg="#FFA500", font=("Arial", 72))
        logo_placeholder.pack(pady=30)
        
    def marcar_botao_ativo(self, texto_botao):
        """Marca um botão do menu como ativo."""
        for botao in self.botoes_menu.values():
            botao.configure(style="Menu.TButton")
            
        if texto_botao in self.botoes_menu:
            self.botoes_menu[texto_botao].configure(style="MenuAtivo.TButton")
            
    def atualizar_status(self, mensagem):
        """Atualiza a mensagem de status no rodapé."""
        self.status_label.configure(text=mensagem)
        
    def abrir_modulo_alunos(self):
        """Abre o módulo de gestão de alunos."""
        # 👇 LINHA 186: ADICIONAR ESTA LINHA
        self.cancelar_agendamentos()
        
        self.marcar_botao_ativo("👥 Alunos")
        self.atualizar_status("Módulo: Gestão de Alunos")
        self.limpar_area_conteudo()
        try:
            self.modulo_atual = ModuloAlunos(self.frame_area_conteudo)
        except Exception as e:
            messagebox.showerror("Erro", f"Não foi possível carregar o módulo de alunos: {str(e)}")
            self.mostrar_tela_inicial()
        
    def abrir_modulo_financeiro(self, aba_inicial=None):
        """Abre o módulo financeiro."""
        # 👇 LINHA 199: ADICIONAR ESTA LINHA
        self.cancelar_agendamentos()
        
        self.marcar_botao_ativo("💰 Financeiro")
        self.atualizar_status("Módulo: Financeiro")
        self.limpar_area_conteudo()
        try:
            # Criar o módulo primeiro
            self.modulo_atual = ModuloFinanceiro(self.frame_area_conteudo)
            
            # Se houver uma aba inicial, selecionar após um pequeno delay para garantir que o widget exista
            if aba_inicial is not None:
                def selecionar_aba():
                    try:
                        # Verificar se o módulo atual ainda é o financeiro e se o notebook existe
                        if self.modulo_atual and hasattr(self.modulo_atual, 'notebook'):
                            # Forçar atualização do layout para garantir que o widget foi criado internamente
                            self.modulo_atual.notebook.update_idletasks()
                            if self.modulo_atual.notebook.winfo_exists():
                                self.modulo_atual.notebook.select(aba_inicial)
                    except Exception as e:
                        print(f"Erro ao selecionar aba: {e}")
                
                # Aumentar um pouco o delay para garantir a criação no Windows
                self.after(200, selecionar_aba)
                
        except Exception as e:
            messagebox.showerror("Erro", f"Não foi possível carregar o módulo financeiro: {str(e)}")
            self.mostrar_tela_inicial()

    def verificar_notificacoes_boletos(self):
        """Verifica se há boletos vencendo ou vencidos e exibe notificação."""
        try:
            from src.data.pagamento_dao import pagamento_dao
            from datetime import date, timedelta
            
            hoje = date.today()
            proximos_dias = hoje + timedelta(days=5)
            
            pagamentos = pagamento_dao.listar_todos_pagamentos()
            vencidos = []
            vencendo = []
            
            for p in pagamentos:
                if p.status.lower() in ['pendente', 'vencido']:
                    if p.data_vencimento < hoje:
                        vencidos.append(p)
                    elif hoje <= p.data_vencimento <= proximos_dias:
                        vencendo.append(p)
            
            if vencidos or vencendo:
                msg = ""
                if vencidos:
                    msg += f"⚠️ {len(vencidos)} boleto(s) VENCIDO(S)!\n"
                if vencendo:
                    msg += f"📅 {len(vencendo)} boleto(s) vencendo nos próximos 5 dias."
                
                # Criar um frame de notificação no topo ou usar messagebox
                if messagebox.askyesno("Notificação de Boletos", f"{msg}\n\nDeseja visualizar os boletos agora?"):
                    self.abrir_modulo_financeiro(aba_inicial=3) # Abre na aba BOLETOS
                    
        except Exception as e:
            print(f"Erro ao verificar notificações: {e}")
        
        # 👇 LINHA 262: ADICIONAR ESTA LINHA (resetar o after_id)
        self.after_id = None
        
    def abrir_modulo_planos(self):
        """Abre o módulo de gestão de planos."""
        # 👇 LINHA 267: ADICIONAR ESTA LINHA
        self.cancelar_agendamentos()
        
        self.marcar_botao_ativo("📋 Planos")
        self.atualizar_status("Módulo: Gestão de Planos")
        self.limpar_area_conteudo()
        try:
            self.modulo_atual = ModuloPlanos(self.frame_area_conteudo)
        except Exception as e:
            messagebox.showerror("Erro", f"Não foi possível carregar o módulo de planos: {str(e)}")
            self.mostrar_tela_inicial()
        
    def abrir_modulo_treinos(self):
        """Abre o módulo de gestão de treinos."""
        # 👇 LINHA 280: ADICIONAR ESTA LINHA
        self.cancelar_agendamentos()
        
        self.marcar_botao_ativo("🏋️ Treinos")
        self.atualizar_status("Módulo: Gestão de Treinos")
        self.limpar_area_conteudo()
        try:
            self.modulo_atual = ModuloTreinos(self.frame_area_conteudo)
        except Exception as e:
            messagebox.showerror("Erro", f"Não foi possível carregar o módulo de treinos: {str(e)}")
            self.mostrar_tela_inicial()
        
    def abrir_modulo_anamnese(self):
        """Abre o módulo de anamnese nutricional."""
        # 👇 LINHA 293: ADICIONAR ESTA LINHA
        self.cancelar_agendamentos()
        
        self.marcar_botao_ativo("🥗 Anamnese Nutricional")
        self.atualizar_status("Módulo: Anamnese Nutricional")
        self.limpar_area_conteudo()
        try:
            self.modulo_atual = ModuloAnamnese(self.frame_area_conteudo)
        except Exception as e:
            messagebox.showerror("Erro", f"Não foi possível carregar o módulo de anamnese: {str(e)}")
            self.mostrar_tela_inicial()
        
    def abrir_modulo_avaliacao(self):
        """Abre o módulo de avaliação física."""
        # 👇 LINHA 306: ADICIONAR ESTA LINHA
        self.cancelar_agendamentos()
        
        self.marcar_botao_ativo("📊 Avaliação Física")
        self.atualizar_status("Módulo: Avaliação Física")
        self.limpar_area_conteudo()
        try:
            self.modulo_atual = ModuloAvaliacao(self.frame_area_conteudo)
        except Exception as e:
            messagebox.showerror("Erro", f"Não foi possível carregar o módulo de avaliação: {str(e)}")
            self.mostrar_tela_inicial()
        
    def abrir_modulo_relatorios(self):
        """Abre o módulo de relatórios."""
        # 👇 LINHA 319: ADICIONAR ESTA LINHA
        self.cancelar_agendamentos()
        
        self.marcar_botao_ativo("📈 Relatórios")
        self.atualizar_status("Módulo: Relatórios")
        self.limpar_area_conteudo()
        try:
            self.modulo_atual = ModuloRelatorios(self.frame_area_conteudo)
        except Exception as e:
            traceback.print_exc()  # Isso vai mostrar o erro completo no console
            messagebox.showerror("Erro", f"Não foi possível carregar o módulo de relatórios: {str(e)}")
            self.mostrar_tela_inicial()
        
    def abrir_modulo_edicao(self):
        """Abre o módulo de edição geral."""
        # 👇 LINHA 333: ADICIONAR ESTA LINHA
        self.cancelar_agendamentos()
        
        self.marcar_botao_ativo("🔧 Edição Geral")
        self.atualizar_status("Módulo: Edição Geral")
        self.limpar_area_conteudo()
        try:
            self.modulo_atual = ModuloEdicao(self.frame_area_conteudo)
        except Exception as e:
            messagebox.showerror("Erro", f"Não foi possível carregar o módulo de edição: {str(e)}")
            self.mostrar_tela_inicial()
        
    def abrir_configuracoes(self):
        """Abre a janela de configurações."""
        # 👇 LINHA 346: ADICIONAR ESTA LINHA
        self.cancelar_agendamentos()
        
        self.atualizar_status("Configurações")
        messagebox.showinfo("Informação", "O módulo de configurações ainda não está implementado.")
        
    def voltar_tela_inicial(self):
        """Volta para a tela inicial."""
        # 👇 LINHA 354: ADICIONAR ESTA LINHA
        self.cancelar_agendamentos()
        
        for botao in self.botoes_menu.values():
            botao.configure(style="Menu.TButton")
        self.atualizar_status("Sistema Pronto")
        self.mostrar_tela_inicial()