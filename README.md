# WhatsApp Fotos + Legendas

Aplicação web que extrai fotos (e vídeos/áudios) de uma conversa exportada do WhatsApp e organiza tudo com a **legenda, data, hora e remetente** de cada mídia.

**100% client-side** — roda inteiramente no navegador. Nenhum dado é enviado para servidor.

## Como usar

1. No WhatsApp Android: abra a conversa → 3 pontinhos → Mais → **Exportar conversa** → **Incluir mídia**
2. Abra `index.html` (ou a versão publicada)
3. Arraste o `.zip` exportado
4. Baixe o `.zip` processado com:
   - Pasta `fotos/`, `videos/`, `audios/` com arquivos renomeados (`AAAA-MM-DD_HHhMM_legenda.jpg`)
   - Planilha `legendas.csv` com `arquivo, legenda, data, hora, remetente, tipo`

## Formatos suportados

Parser robusto cobrindo as variações conhecidas do export do WhatsApp:

- Android PT-BR com e sem vírgula: `28/04/2026 14:32 - Fulano:` / `28/04/2026, 14:32 - Fulano:`
- iOS com colchetes: `[28/04/2026, 14:32:45] Fulano:`
- Inglês 12h (AM/PM)
- Marcadores de anexo: `(arquivo anexado)`, `(file attached)`, `<anexado: ...>`, `<attached: ...>`
- Remoção de caracteres invisíveis Unicode (LRM/RLM/BOM)

## Deploy

É um único `index.html` estático — funciona em qualquer hospedagem:

- **Netlify Drop**: arraste a pasta em https://app.netlify.com/drop
- **Vercel / Cloudflare Pages**: conecte o repo, deploy automático
- **GitHub Pages**: ative Pages no repo

## Stack

- HTML/CSS/JS puro
- [JSZip](https://stuk.github.io/jszip/) (CDN) para ler/gerar `.zip`

## Privacidade

Nenhum dado sai do navegador do usuário. Não há analytics, tracking ou backend.
