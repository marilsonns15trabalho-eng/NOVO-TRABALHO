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
- confirme que `Gradle JDK` esta como `Embedded JDK`
- clique em `Build > Build Bundle(s) / APK(s) > Build APK(s)`

## Onde o APK fica

Como o projeto esta dentro do OneDrive, a build Android foi configurada para usar uma pasta temporaria local fora da sincronizacao. Isso evita travas de arquivo durante o build.

- Debug APK:
  `C:\Users\maril\AppData\Local\Temp\lioness-android-build\app\outputs\apk\debug\app-debug.apk`
- Release APK:
  `C:\Users\maril\AppData\Local\Temp\lioness-android-build\app\outputs\apk\release\app-release.apk`

## Teste rapido no celular

Para testar no seu proprio aparelho:

1. Gere o `debug APK`
2. Envie o arquivo para o celular
3. No Android, permita instalar apps de fonte desconhecida para o app que abriu o arquivo
4. Instale o APK

## Release assinado

Para mandar o app para outras pessoas de forma mais profissional, o ideal e gerar o `release APK` assinado.

1. Crie um keystore `.jks`
2. Copie [keystore.properties.example](c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/android/keystore.properties.example) para `android/keystore.properties`
3. Preencha:
   - `storeFile`
   - `storePassword`
   - `keyAlias`
   - `keyPassword`
4. Rode a build `release` no Android Studio

Se preferir, essas mesmas informacoes podem ser passadas por variaveis de ambiente:

- `LIONESS_UPLOAD_STORE_FILE`
- `LIONESS_UPLOAD_STORE_PASSWORD`
- `LIONESS_UPLOAD_KEY_ALIAS`
- `LIONESS_UPLOAD_KEY_PASSWORD`

## Arquivos principais

- Projeto Android: [android](c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/android)
- Configuracao Capacitor: [capacitor.config.ts](c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/capacitor.config.ts)
- Shell mobile: [mobile.css](c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/app/mobile.css)

## Observacoes

- O app depende do site publicado na Vercel.
- Se o dominio publicado mudar, ajuste `server.url` em [capacitor.config.ts](c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/capacitor.config.ts).
- Sempre que mudar plugin, `appId`, `appName` ou configuracao do Capacitor, rode `npm run mobile:android:sync` antes de abrir o Android Studio.
- Se o Android Studio insistir em usar Java antigo, reabra o projeto e confira novamente `Gradle JDK = Embedded JDK`.
