
📘 MTG Card Finder — README

Bem-vindo ao MTG Card Finder, um projeto que permite pesquisar cartas do Magic: The Gathering utilizando a API pública api.magicthegathering.io, exibindo também símbolos de coleção (set symbols) e raridade via Scryfall SVGs.

O objetivo é entregar uma ferramenta simples, moderna e poderosa para explorar cartas de MTG, com estilo inspirado nas molduras do jogo, filtros avançados, histórico e paginação.
🚀 Funcionalidades
🔍 Busca avançada

    Pesquisa por nome (prioritária).

    Se não encontrar por nome, pesquisa automaticamente por texto (descrição/oráculo).

    Histórico automático de pesquisas com armazenamento em localStorage.

🎨 Interface responsiva e estilizada

    Molduras com gradientes que imitam o estilo de cores das cartas.

    Layout moderno com sombras e profundidade.

    Cards responsivos para desktop e mobile.

🖼️ Ícones oficiais

    Símbolos de coleção (set symbols) carregados via SVG oficial do Scryfall.

    Ícones de raridade também via SVG da Scryfall.

    Fallback automático caso o SVG não exista.

📚 Links para detalhes da carta

    Se houver multiverseid: abre o Gatherer.

    Se não houver: busca diretamente no Scryfall.

🧭 Paginação

    Botões Anterior e Próxima.

    Funciona com base no pageSize selecionado.

    Navegação reativa — desabilita botões conforme necessário.

🧪 Filtros completos

    Por cor (W/U/B/R/G) — multi seleção.

    Por tipo (Creature, Instant, Artifact, etc.).

    Por conjunto (código do set: khm, eld, neo…).

    Seleção de tamanho de página.

🎲 Tela inicial com cartas aleatórias

    Mostra 3 cartas aleatórias se não houver histórico.

📁 Estrutura do Projeto

/
├── index.html          # Estrutura da página
├── style.css           # Estilos visuais e molduras
├── script.js           # Lógica principal
└── data.json           # Configuração (opcional)

🧱 Arquitetura e decisões de design
1. HTML — Estrutura semântica e modular

O HTML foi estruturado para:

    ser fácil de navegar (head → controls → content);

    permitir que CSS e JS manipulem áreas sem conflito;

    deixar clara a separação entre:

        filtros e busca

        histórico

        grade de cartas

        paginação

A divisão aside (history) + section (cards) segue boas práticas de acessibilidade.
2. CSS — Escolhas de estilo e design system
🎨 Inspiração visual

O estilo foi inspirado nos frames de cartas de MTG:

    cores suaves e brilhantes nos frames,

    fundo escuro com contraste moderado,

    uso de sombras para simular profundidade de carta física,

    gradientes leves para dar sensação de materialidade.

💡 Molduras por cor

Cada carta recebe uma classe:

frame-white
frame-blue
frame-black
frame-red
frame-green
frame-colorless
frame-multicolor

Essas classes criam um degradê que lembra a borda das suas respectivas cores de mana.
📐 Responsividade

O layout usa:

    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))

    flex no painel principal

    breakpoints para telas menores

Isso permite que as cartas se redistribuam naturalmente.
3. JavaScript — Filosofia da implementação
✔ Simplicidade sem dependências

O projeto é 100% vanilla JS, sem frameworks.

Isso foi escolhido para:

    evitar peso desnecessário,

    permitir hospedagem estática (GitHub Pages),

    facilitar manutenção.

📚 API principal: api.magicthegathering.io

Documentação: https://magicthegathering.io

Essa API foi escolhida porque:

    é leve,

    simples,

    não requer token,

    retorna imagens sempre que disponíveis.

🎨 Ícones via Scryfall

Usando:

https://svgs.scryfall.io/sets/{set}.svg
https://svgs.scryfall.io/rarity/{rarity}.svg

Por que Scryfall?

    maior acervo,

    SVG nativo (qualidade perfeita),

    links estáveis.

🧠 Lógica de busca com fallback inteligente

Quando o usuário busca:

    tenta primeiro name=X

    se não achar nada, tenta text=X

Isso imita o comportamento do Gatherer e melhora a precisão.
📝 Histórico persistente

Armazenado em:

localStorage['mtg_search_history_v1']

Escolha baseada em:

    persistência entre sessões,

    não depende de backend,

    limitação de 20 itens para não “poluir” o painel.

📚 Paginação

Como a API não fornece total de resultados,
utilizamos esta regra:

    Se o número de resultados < pageSize → não existe próxima página.

Simples e confiável.
🔧 Como funciona cada parte
🔹 Carregamento inicial

    Busca 200 cartas aleatórias via API.

    Seleciona 3 delas.

    Renderiza.

🔹 Função startSearch(page)

Coleta os valores de todos os filtros → monta objeto de parâmetros → manda buscar.
🔹 Função fetchCards(params)

Serializa parâmetros → cria querystring → faz fetch.
🔹 Função renderCards(cards)

Cria elementos HTML com:

    imagem

    nome

    tipo

    set symbol

    raridade

    texto

    link externo

🔹 Função createCardElement(card)

Define toda a estrutura visual de um card.

É aqui que entram:

    molduras,

    fallback da imagem,

    ícones da Scryfall,

    links.

📦 Como rodar localmente

git clone https://github.com/SEU_USUARIO/SEU_REPO.git
cd SEU_REPO

Você pode abrir o index.html diretamente no navegador ou usar um servidor simples:
via VSCode

    Extensão “Live Server”.

via Node

npx http-server .

via Python

python -m http.server 5500

Depois, abra:

http://localhost:5500

🌐 Como publicar via GitHub Pages

    Vá em Settings → Pages

    Selecione:

        Source: Deploy from branch

        Branch: main / root

    Salve

URL ficará como:

https://seuusuario.github.io/seurepo/

📄 Licença

Este projeto é livre para uso educacional e pessoal.
Os dados e ícones pertencem às suas respectivas marcas:

    Magic: The Gathering — Wizards of the Coast

    Símbolos SVG — Scryfall

    API — api.magicthegathering.io
