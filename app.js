// --- PWA SW register
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}

// --- Install Prompt
let deferredPrompt = null;
const btnInstall = document.getElementById('btn-install');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.style.display = 'inline-block';
});
btnInstall?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  btnInstall.style.display = 'none';
});

// --- i18n minimal
const i18n = {
  fr: {
    't-only-exact': 'Compatibilité stricte',
    't-cross-brand': 'Inclure multi-marques',
    't-how-title': 'Comment ça marche ?',
    't-how-1': 'Tape un modèle (marque + modèle) et valide.',
    't-how-2': 'On trouve les glaces compatibles (mêmes dimensions/forme).',
    't-how-3': 'Compatibilités croisées entre marques.',
    't-store': 'Magasin'
  },
  ar: {
    't-only-exact': 'توافق صارم',
    't-cross-brand': 'تضمين عدة علامات',
    't-how-title': 'كيف يعمل؟',
    't-how-1': 'اكتب الموديل (العلامة + الموديل).',
    't-how-2': 'نعرض الزجاج المتوافق.',
    't-how-3': 'توافق بين العلامات.',
    't-store': 'المتجر'
  },
  en: {
    't-only-exact': 'Strict compatibility',
    't-cross-brand': 'Include cross-brand',
    't-how-title': 'How it works',
    't-how-1': 'Type brand + model.',
    't-how-2': 'We match compatible glasses.',
    't-how-3': 'Cross-brand compatibility.',
    't-store': 'Store'
  },
  kab: {
    't-only-exact': 'Amṣadaḥ uḍris',
    't-cross-brand': 'Rnu yiwen n yisallen',
    't-how-title': 'Amek iteddu?',
    't-how-1': 'aru tansa (tasnawit + tbadlit).',
    't-how-2': 'nfru azgaɣ imṣadan.',
    't-how-3': 'amṣadaḥ gar yisallen.',
    't-store': 'Aḥanut'
  }
};
const langSel = document.getElementById('lang-select');
function applyLang(lang='fr'){
  const dict = i18n[lang] || i18n.fr;
  Object.entries(dict).forEach(([id, text])=>{
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });
}
langSel?.addEventListener('change', e => applyLang(e.target.value));
applyLang('fr');

// --- Data loader (multi-fichiers, jusqu’à 3000+)
const dataFiles = [
  'data/phones-1.json',
  'data/phones-2.json',
  'data/phones-3.json',
  'data/phones-4.json',
  'data/phones-5.json',
  'data/phones-6.json'
];

let PHONES = [];
(async function loadAll(){
  const chunks = await Promise.allSettled(dataFiles.map(p=>fetch(p).then(r=> r.ok ? r.json() : [])));
  PHONES = chunks.flatMap(ch => Array.isArray(ch.value) ? ch.value : []);
})();

// --- Compatibilité croisée (sans doublons)
function normalize(s){ return s.trim().toLowerCase().replace(/\s+/g,' '); }
function keyOf(p){ return normalize(`${p.brand} ${p.model}`); }

function findByQuery(q){
  if (!q) return [];
  q = normalize(q);
  // match brand+model ou model seul
  return PHONES.filter(p =>
    keyOf(p).includes(q) || normalize(p.model) === q
  );
}

function buildCompatibleSet(target, {crossBrand=true, strict=false}){
  // target.compatibleWith contient déjà des libellés "Brand Model"
  const set = new Map();
  const add = (p) => { set.set(keyOf(p), p); };

  // 1) Le modèle lui-même
  add(target);

  // 2) Compatibles directs
  const direct = new Set((target.compatibleWith||[]).map(normalize));

  // 3) Parcours de toute la base pour:
  //   - récupérer objets équivalents aux noms déclarés
  //   - inclure compatibilités inverses (si quelqu’un te pointe)
  PHONES.forEach(p=>{
    const k = keyOf(p);
    const name = `${p.brand} ${p.model}`;

    // inclus si dans la liste directe du target
    if (direct.has(k)) add(p);

    // compatibilité inverse
    const theirs = (p.compatibleWith||[]).map(normalize);
    if (theirs.includes(keyOf(target))) add(p);

    // élargissement non strict: si p partage un "clusterId" (optionnel)
    if (!strict && target.clusterId && p.clusterId === target.clusterId) add(p);

    // filtrage cross-brand
    if (!crossBrand){
      // ne garder que même marque que target
      if (set.has(k) && p.brand !== target.brand) set.delete(k);
    }
  });

  return Array.from(set.values());
}

// --- UI
const search = document.getElementById('search');
const results = document.getElementById('results');
const onlyExact = document.getElementById('only-exact');
const crossBrand = document.getElementById('cross-brand');

function render(cards){
  results.innerHTML = cards.map(p => {
    const compat = (p.compatibleWith||[]).join(', ');
    return `
      <article class="card-phone">
        <div class="meta">${p.brand}</div>
        <div class="phone-title">${p.brand} ${p.model}</div>
        <div class="tags">
          ${compat ? `<span class="tag">Compatibles: ${compat}</span>` : `<span class="tag">Pas de liste (encore)</span>`}
        </div>
      </article>
    `;
  }).join('');
}

search.addEventListener('input', () => {
  const q = search.value.trim();
  if (!q){ results.innerHTML=''; return; }

  const hits = findByQuery(q);
  if (!hits.length){ results.innerHTML = `<div class="card">Aucun résultat pour “${q}”.</div>`; return; }

  // prendre le meilleur match (exact en priorité)
  let target = hits.find(p => keyOf(p) === normalize(q)) || hits[0];
  const compatible = findCompatible(target);
  render(compatible);

  function findCompatible(t){
    const bundle = buildCompatibleSet(t, {
      crossBrand: crossBrand.checked,
      strict: onlyExact.checked
    });
    // Ordonner: même marque d’abord, puis alpha
    return bundle.sort((a,b)=>{
      if (a.brand === t.brand && b.brand !== t.brand) return -1;
      if (a.brand !== t.brand && b.brand === t.brand) return 1;
      return keyOf(a).localeCompare(keyOf(b));
    });
  }
});
