# Android Studio

## Estrutura usada

- App Android com Capacitor
- Webview apontando para `https://lioness-personal-estudio.vercel.app`
- Mesmo sistema web, com shell mobile ajustada para modo app
- Mesmo Supabase, mesmos dados e mesmas regras do site

## Scripts

```bash
npm run mobile:android:sync
npm run mobile:android:open
```

## Fluxo recomendado

1. Garanta que o deploy da Vercel esteja atualizado.
2. Rode:

```bash
npm run mobile:android:sync
```

3. Depois rode:

```bash
npm run mobile:android:open
```

4. No Android Studio:
- aguarde o Gradle sincronizar
- valide nome, icone e splash
- clique em `Build > Build Bundle(s) / APK(s) > Build APK(s)`

## Arquivos principais

- Projeto Android: [android](c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/android)
- Configuracao Capacitor: [capacitor.config.ts](c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/capacitor.config.ts)
- Shell mobile: [mobile.css](c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/app/mobile.css)

## Observacoes

- O app depende do site publicado na Vercel.
- Se o dominio publicado mudar, ajuste `server.url` em [capacitor.config.ts](c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/capacitor.config.ts).
- Sempre que mudar plugin, `appId`, `appName` ou configuracao do Capacitor, rode `npm run mobile:android:sync` antes de abrir o Android Studio.
