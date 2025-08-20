const posts = [
  {
    id 1,
    title Verre 9D vs Hydrogel — que choisir ,
    date 2025-07-01,
    excerpt On compare résistance, toucher, prix et pose.,
    url #
  },
  {
    id 2,
    title iPhone 1516  compatibilités croisées utiles,
    date 2025-07-05,
    excerpt Les séries PlusPro Max partagent des formats proches.,
    url #
  }
];

const el = document.getElementById('blog');
el.innerHTML = posts.map(p = `
  article class=card
    h3${p.title}h3
    div class=meta${p.date}div
    p${p.excerpt}p
  article
`).join('');
