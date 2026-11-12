<div align="center">

<img src="icon-512.png" width="88" alt="Watchr logo" />

# Watchr

**Transmita sua tela em tempo real, direto e sem servidor intermediário.**

[Acessar o app](https://mcoelho-dev.github.io/watchr/) ·
[Reportar um problema](https://github.com/mcoelho-dev/watchr/issues)

</div>

---

## Motivação

A ANPD suspendeu o Go Live (streaming) do Discord no Brasil. Este projeto substitui essa função com uma solução própria, direta e sem dependência de terceiros.

## O que é

Watchr é um app de watch party estilo "compartilhamento de tela do Discord": uma pessoa transmite uma aba do navegador (com áudio) e a outra assiste em tempo real, de qualquer dispositivo — PC ou celular, sem instalar nada.

Foi feito pra resolver um problema simples: assistir algo junto com alguém à distância, com controle total sobre qualidade, sem depender de um app de terceiros.

## Funcionalidades

- **Conexão direta (P2P)** via WebRTC — o vídeo nunca passa por um servidor, só o pareamento inicial
- **Áudio isolado da aba** compartilhada, sem vazar som de outras janelas
- **Chat de texto** e **microfone** para conversar durante a transmissão
- **Qualidade ajustável em tempo real** — resolução (480p–1080p), FPS (10–60) e bitrate, sem precisar parar a transmissão
- **Tela cheia** com um clique, com fallback nativo para iOS Safari
- **Instalável como app (PWA)** — tanto no desktop quanto no celular, com ícone próprio
- **Leve** por padrão, pensado pra rodar bem em hardware modesto

## Como usar

1. Acesse [mcoelho-dev.github.io/watchr](https://mcoelho-dev.github.io/watchr/) em dois dispositivos
2. Um dos lados copia o **ID de conexão** e envia pro outro (WhatsApp, o que for)
3. O outro lado cola o ID no campo de conexão e clica em **Conectar**
4. Quem for transmitir clica em **Compartilhar tela** e escolhe **"Guia do Chrome"** no seletor (importante: isso isola o áudio daquela aba e trava a transmissão nela — "Tela inteira" ou "Janela" não isolam áudio)

## Como funciona por baixo dos panos

- **PeerJS** (sobre WebRTC) cuida da sinalização e da conexão ponto a ponto usando o broker público gratuito
- **STUN + TURN** (OpenRelay) na configuração de ICE — o TURN entra como retaguarda quando a conexão direta não se estabelece (comum atrás de CGNAT), melhorando a estabilidade da transmissão
- `getDisplayMedia()` captura a tela/aba; `getUserMedia()` captura o microfone
- O bitrate é controlado via `RTCRtpSender.setParameters()`, permitindo trocar a qualidade sem reiniciar a chamada
- Sem back-end próprio — o app inteiro é estático (HTML/CSS/JS) e roda no GitHub Pages

## Estrutura do projeto

```
watchr/
├── index.html        # marcação e estrutura da página
├── stylesheets.css    # estilos
├── script.js          # lógica (WebRTC, chat, controles)
├── manifest.json       # configuração do PWA
├── sw.js               # service worker (instalação offline)
└── icon-192.png, icon-512.png
```

## Rodando localmente

```bash
git clone https://github.com/mcoelho-dev/watchr.git
cd watchr
```

Importante: recursos como captura de tela e microfone exigem um contexto seguro (`https://`). Abrir o `index.html` direto como `file://` **não funciona** — sirva os arquivos com um servidor local, por exemplo:

```bash
python3 -m http.server 8000
```

e acesse `http://localhost:8000`.

## Limitações conhecidas

- Isolar o áudio de uma janela que não seja aba do navegador não é suportado por nenhum navegador atualmente — pra capturar um app nativo (jogo, player, etc.), a alternativa é compartilhar "Tela inteira" com áudio do sistema, mas aí todos os sons do PC são transmitidos, não só os do app
- O broker do PeerJS e o servidor TURN usados são públicos, gratuitos e sem garantia de disponibilidade ou capacidade; para uso em maior escala, o ideal é rodar servidores próprios
- A qualidade da transmissão depende principalmente da banda de **upload** de quem compartilha a tela, que costuma ser bem mais limitada que a de download
- Compatibilidade de captura de áudio de aba varia entre navegadores — funciona de forma mais confiável no Chrome/Edge

## Stack

`HTML` · `CSS` · `JavaScript` · `WebRTC` · `PeerJS` · `TURN (OpenRelay)` · `GitHub Pages`

## Contribuidores

- [nanaluvsu](https://github.com/nanaluvsu) — refatoração de CSS/JS em arquivos separados

## Licença

MIT — use, copie e modifique à vontade.

---

<div align="center">
<sub>Feito por <a href="https://github.com/mcoelho-dev">mcoelho-dev</a></sub>
</div>
