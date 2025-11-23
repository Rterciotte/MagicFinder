/* script.js — versão avançada
   - API: https://api.magicthegathering.io/v1/cards
   - Símbolos: https://svgs.scryfall.io/sets/{set}.svg
   - Raridade: https://svgs.scryfall.io/rarity/{rarity}.svg
*/

const API_BASE = 'https://api.magicthegathering.io/v1/cards';
const SCRYFALL_SET_SVG = (setCode) => `https://svgs.scryfall.io/sets/${setCode.toLowerCase()}.svg`;
const SCRYFALL_RARITY_SVG = (rarity) => `https://svgs.scryfall.io/rarity/${rarity.toLowerCase()}.svg`;
const historyKey = 'mtg_search_history_v1';
const maxHistory = 20;

let currentPage = 1;
let lastPageSize = parseInt(document.getElementById('pageSizeSelect').value, 10) || 12;
let lastFetchCount = 0; // quantidade retornada na última fetch (para ativar/desativar Next)
let lastQueryParams = {}; // para refazer paginas

// elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyList = document.getElementById('historyList');
const cardsGrid = document.getElementById('cardsGrid');
const resultInfo = document.getElementById('resultInfo');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageLabel = document.getElementById('pageLabel');
const colorFilter = document.getElementById('colorFilter');
const typeFilter = document.getElementById('typeFilter');
const setFilter = document.getElementById('setFilter');
const pageSizeSelect = document.getElementById('pageSizeSelect');

searchBtn.addEventListener('click', () => startSearch(1));
clearHistoryBtn.addEventListener('click', clearHistory);
prevBtn.addEventListener('click', () => {
  if(currentPage > 1){ startSearch(currentPage - 1); }
});
nextBtn.addEventListener('click', () => {
  if(lastFetchCount > 0) { startSearch(currentPage + 1); }
});
pageSizeSelect.addEventListener('change', () => {
  lastPageSize = parseInt(pageSizeSelect.value, 10);
  startSearch(1);
});

// init
renderHistory();
loadInitialRandomIfNoHistory();

function saveToHistory(q){
  if(!q) return;
  let h = JSON.parse(localStorage.getItem(historyKey) || '[]');
  h = h.filter(x => x.toLowerCase() !== q.toLowerCase());
  h.unshift(q);
  if(h.length > maxHistory) h = h.slice(0, maxHistory);
  localStorage.setItem(historyKey, JSON.stringify(h));
  renderHistory();
}

function renderHistory(){
  const h = JSON.parse(localStorage.getItem(historyKey) || '[]');
  historyList.innerHTML = '';
  if(h.length === 0){
    const li = document.createElement('li');
    li.textContent = 'Nenhuma busca ainda';
    li.style.opacity = '0.6';
    historyList.appendChild(li);
    return;
  }
  h.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    li.title = 'Clicar para buscar: ' + item;
    li.addEventListener('click', () => {
      searchInput.value = item;
      startSearch(1);
    });
    historyList.appendChild(li);
  });
}

function clearHistory(){
  if(!confirm('Limpar histórico de buscas?')) return;
  localStorage.removeItem(historyKey);
  renderHistory();
}

/* Inicia a busca (page = número da página). Monta params a partir do UI. */
function startSearch(page = 1){
  const q = (searchInput.value || '').trim();
  const colorsSelected = Array.from(colorFilter.selectedOptions)
                              .map(o => o.value).filter(Boolean);
  const typeQ = (typeFilter.value || '').trim();
  const setQ = (setFilter.value || '').trim();

  const params = {};
  if(q) params.name = q; // tentamos por nome primeiro no endpoint
  // Além disso, para busca por texto, vamos usar text quando não houver hits por name
  // Mas aqui, para filtros, incluímos colors/type/set
  if(colorsSelected.length) params.colors = colorsSelected.join(',');
  if(typeQ) params.types = typeQ; // API supports 'types' param to match types
  if(setQ) params.set = setQ;

  // page + pageSize
  params.page = page;
  params.pageSize = lastPageSize;

  // salvar estado para paginação
  lastQueryParams = { ...params };
  currentPage = page;

  // se veio termo, salve no histórico (apenas quando há texto de busca)
  if(q) saveToHistory(q);

  // realizar busca com priorização: name -> text (if name returns 0)
  performSearchWithFallback(params, q);
}

/* Realiza a busca: primeiro por name se name presente; se não encontrar nada e q existia,
   tenta por text (descrição). Se não houver name, faz a busca direta com os params.
*/
async function performSearchWithFallback(params, rawQuery){
  try{
    resultInfo.textContent = 'Buscando...';
    cardsGrid.innerHTML = '';
    let cards = [];

    // if params includes name AND rawQuery non-empty -> try name first
    if(params.name){
      const byName = await fetchCards({ ...params });
      if(byName.length > 0){
        cards = byName;
      } else if(rawQuery){
        // try text search — override params.name with text param
        const textParams = { ...params };
        delete textParams.name;
        textParams.text = rawQuery;
        // reset to page 1 for text search if requested page >1? keep requested page.
        const byText = await fetchCards(textParams);
        cards = byText;
      }
    } else {
      // no name filter — direct query
      cards = await fetchCards(params);
    }

    lastFetchCount = cards.length;
    renderCards(cards);
    updatePaginationControls();
    const totalShown = cards.length;
    resultInfo.textContent = totalShown === 0 ? 'Nenhuma carta encontrada.' : `Mostrando ${totalShown} cartas (página ${currentPage})`;
  } catch(err){
    console.error(err);
    resultInfo.textContent = 'Erro ao buscar cartas — ver console.';
  }
}

/* fetchCards: constrói query string a partir do objeto params e chama a API */
async function fetchCards(params = {}){
  const qs = Object.entries(params)
    .filter(([,v]) => v !== undefined && v !== null && v !== '')
    .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `${API_BASE}${qs ? '?'+qs : ''}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('API error: ' + res.status);
  const data = await res.json();
  return data.cards || [];
}

/* Render de múltiplos cards */
function renderCards(cards){
  cardsGrid.innerHTML = '';
  if(!cards || cards.length === 0){
    cardsGrid.innerHTML = '<p>Nenhuma carta para mostrar.</p>';
    return;
  }
  for(const card of cards){
    const el = createCardElement(card);
    cardsGrid.appendChild(el);
  }
}

/* Cria o elemento .card: inclui set symbol (Scryfall), rarity icon (Scryfall), link para Gatherer ou Scryfall */
function createCardElement(card){
  const wrap = document.createElement('article');
  wrap.className = 'card ' + frameClassForCard(card);

  // art
  const art = document.createElement('div');
  art.className = 'art';
  const img = document.createElement('img');
  img.alt = card.name || 'card art';
  if(card.imageUrl){
    img.src = card.imageUrl;
  } else if(card.cardImage && card.cardImage.imageUrl){
    img.src = card.cardImage.imageUrl;
  } else {
    img.src = ''; // will be hidden on error
  }
  img.addEventListener('error', () => {
    img.style.display = 'none';
    if(!art.querySelector('.placeholder')){
      const p = document.createElement('div');
      p.className = 'placeholder';
      p.style.padding = '18px';
      p.style.color = '#ddd';
      p.style.fontSize = '0.95rem';
      p.style.textAlign = 'center';
      p.textContent = 'Imagem não disponível';
      art.appendChild(p);
    }
  });
  art.appendChild(img);

  // meta top (name + icons)
  const meta = document.createElement('div');
  meta.className = 'meta';
  const nameRow = document.createElement('div');
  nameRow.className = 'name-row';

  const nameBlock = document.createElement('div');
  nameBlock.innerHTML = `<div class="name">${escapeHtml(card.name || '—')}</div>
                         <div class="set">${escapeHtml(card.setName || 'Conjunto desconhecido')} ${card.number ? ' • #' + escapeHtml(card.number) : ''}</div>`;

  const icons = document.createElement('div');
  icons.className = 'icons';

  // set symbol (Scryfall) if card.set (set code present)
  if(card.set){
    const setImg = document.createElement('img');
    setImg.alt = card.set;
    setImg.className = 'set-icon';
    // use scryfall svg url; if fails, hide it quietly
    setImg.src = SCRYFALL_SET_SVG(card.set);
    setImg.addEventListener('error', () => setImg.style.display = 'none');
    setImg.title = card.set ? `Set: ${card.set.toUpperCase()}` : '';
    icons.appendChild(setImg);
  }

  // rarity icon
  if(card.rarity){
    const rarityImg = document.createElement('img');
    rarityImg.alt = card.rarity;
    rarityImg.className = 'rarity-icon';
    rarityImg.src = SCRYFALL_RARITY_SVG(card.rarity);
    rarityImg.addEventListener('error', () => rarityImg.style.display = 'none');
    rarityImg.title = card.rarity;
    icons.appendChild(rarityImg);
  }

  nameRow.appendChild(nameBlock);
  nameRow.appendChild(icons);

  // text
  const textEl = document.createElement('div');
  textEl.className = 'text';
  textEl.innerHTML = card.text ? escapeHtml(card.text) : '<i>Sem texto/resumo.</i>';

  // footer link: Gatherer if multiverseId present, else Scryfall search
  const linkRow = document.createElement('div');
  linkRow.className = 'link-row';
  const infoLeft = document.createElement('div');
  infoLeft.className = 'set';
  infoLeft.textContent = card.type || '';

  const linkA = document.createElement('a');
  linkA.className = 'card-link';
  linkA.target = '_blank';
  linkA.rel = 'noopener noreferrer';
  if(card.multiverseid || (card.multiverseids && card.multiverseids.length)){
    const mid = card.multiverseid || (card.multiverseids && card.multiverseids[0]);
    linkA.href = `https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=${mid}`;
    linkA.textContent = 'Abrir no Gatherer';
  } else if (card.name){
    // fallback: search on scryfall for card name + set (if available)
    const q = card.set ? `${card.name} set:${card.set}` : card.name;
    linkA.href = `https://scryfall.com/search?q=${encodeURIComponent(q)}`;
    linkA.textContent = 'Pesquisar no Scryfall';
  } else {
    linkA.href = '#';
    linkA.textContent = 'Ver detalhes';
    linkA.addEventListener('click', (e)=> e.preventDefault());
  }

  linkRow.appendChild(infoLeft);
  linkRow.appendChild(linkA);

  meta.appendChild(nameRow);

  wrap.appendChild(art);
  wrap.appendChild(meta);
  wrap.appendChild(textEl);
  wrap.appendChild(linkRow);

  return wrap;
}

/* Decide frame class com base nas cores */
function frameClassForCard(card){
  const colors = card.colors || [];
  if(colors.length === 0) return 'frame-colorless';
  if(colors.length === 1){
    const c = colors[0].toLowerCase();
    if(c === 'white') return 'frame-white';
    if(c === 'blue') return 'frame-blue';
    if(c === 'black') return 'frame-black';
    if(c === 'red') return 'frame-red';
    if(c === 'green') return 'frame-green';
  }
  return 'frame-multicolor';
}

/* Paginação controls update */
function updatePaginationControls(){
  pageLabel.textContent = `Página ${currentPage}`;
  prevBtn.disabled = currentPage <= 1;
  // Next enabled only if last fetch returned pageSize results (possible more pages)
  nextBtn.disabled = lastFetchCount < lastPageSize;
}

/* Ao carregar: se histórico vazio, mostra 3 cartas aleatórias */
async function loadInitialRandomIfNoHistory(){
  const h = JSON.parse(localStorage.getItem(historyKey) || '[]');
  if(h.length > 0){
    resultInfo.textContent = 'Use o campo acima para buscar cartas ou clique no histórico.';
    return;
  }
  resultInfo.textContent = 'Carregando 3 cartas aleatórias...';
  try{
    // pegar uma amostra grande
    const sample = await fetchCards({ pageSize: 200 });
    const pool = sample.length ? sample : [];
    if(pool.length === 0){
      resultInfo.textContent = 'Nenhuma carta disponível para mostrar agora.';
      return;
    }
    const picks = [];
    const used = new Set();
    while(picks.length < 3 && picks.length < pool.length){
      const i = Math.floor(Math.random() * pool.length);
      if(used.has(i)) continue;
      used.add(i);
      picks.push(pool[i]);
    }
    lastFetchCount = picks.length;
    currentPage = 1;
    renderCards(picks);
    updatePaginationControls();
    resultInfo.textContent = '3 cartas aleatórias';
  } catch(err){
    console.error(err);
    resultInfo.textContent = 'Erro ao carregar cartas iniciais.';
  }
}

/* util: escapeHtml */
function escapeHtml(str){
  if(!str) return '';
  return str
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
