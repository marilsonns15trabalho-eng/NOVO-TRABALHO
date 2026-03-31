export interface AppReleaseNotes {
  title: string;
  highlights: string[];
}

const RELEASE_NOTES: Record<string, AppReleaseNotes> = {
  '1.06': {
    title: 'Melhorias desta versao',
    highlights: [
      'O app agora pede as permissoes essenciais para salvar imagens, usar camera e receber avisos com mais clareza.',
      'O aviso de atualizacao passou a mostrar um resumo simples do que melhorou na versao nova.',
      'A seguranca e a estabilidade do Android receberam um reforco para deixar o beta mais profissional.',
    ],
  },
  '1.05': {
    title: 'Melhorias desta versao',
    highlights: [
      'Agora voce pode compartilhar o treino finalizado com arte pronta para WhatsApp, Instagram ou salvar no aparelho.',
      'A foto de perfil ficou mais consistente entre app, menus e modulos da equipe.',
      'O app recebeu ajustes de estabilidade e visual para deixar o uso no celular mais fluido.',
    ],
  },
};

export function getReleaseNotes(versionName: string) {
  return RELEASE_NOTES[versionName] ?? null;
}
