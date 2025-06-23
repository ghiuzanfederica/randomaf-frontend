// Functia principala pentru incarcarea detaliilor imobilului
async function initializeDetalii(id) {
  // Incarca datele imobilului
  const card = await obtineImobil(id);

  if (!card) return;

  // Incarca imaginile imobilului
  const imagini = await obtineImagini(id);

  // Genereaza si afiseaza continutul
  afiseazaDetaliiImobil(card, imagini);
  configureazaGalerieModal();

  // Incarca si afiseaza anunturile relevante
  await incarcaAnunturiRelevante(id, card);
}

// Obtine datele imobilului dupa ID
async function obtineImobil(id) {
  const res = await fetch(`${API_BASE_URL}/api/imobile`);
  const anunturi = await res.json();
  return anunturi.find(c => c.id == id);
}

// Obtine imaginile pentru imobil
async function obtineImagini(id) {
  let imagini = [];
  try {
    const resImg = await fetch(`${API_BASE_URL}/api/imagini/${id}`);
    imagini = await resImg.json();
  } catch {}
  return imagini;
}

// Genereaza HTML-ul pentru galeria de imagini
function genereazaGalerie(imagini, currentSlide = 0) {
  if (!imagini.length) return '';
  return `
    <div class="slider-container" style="display:flex;justify-content:center;align-items:center;position:relative;">
      <button class="slider-arrow" id="slider-prev" ${currentSlide === 0 ? 'disabled' : ''} style="position:absolute;left:0;top:50%;transform:translateY(-50%);z-index:2;">
        <svg viewBox="0 0 48 48" width="40" height="40"><path d="M31.5 39.1 17.4 24l14.1-15.1-2.8-2.8L11.6 24l17.5 19.9z"/></svg>
      </button>
      <img class="slider-img" src="${imagini[currentSlide].url}" alt="imagine imobil" style="max-width:340px;max-height:220px;width:100%;height:auto;border-radius:12px;object-fit:cover;box-shadow:0 2px 16px #4311642d;cursor:pointer;" data-idx="${currentSlide}">
      <button class="slider-arrow" id="slider-next" ${currentSlide === imagini.length-1 ? 'disabled' : ''} style="position:absolute;right:0;top:50%;transform:translateY(-50%);z-index:2;">
        <svg viewBox="0 0 48 48" width="40" height="40"><path d="M16.5 8.9 30.6 24l-14.1 15.1 2.8 2.8L36.4 24 18.9 4.1z"/></svg>
      </button>
      <div class="slider-indicator" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:#fff8;padding:2px 12px;border-radius:12px;font-size:1rem;">
        ${currentSlide+1} / ${imagini.length}
      </div>
    </div>
    <div id="galerie-modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.92);align-items:center;justify-content:center;z-index:9999;">
      <button id="modal-prev" title="Imaginea anterioara" style="position:absolute;left:3vw;top:50%;transform:translateY(-50%);background:none;border:none;">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="#fff"><path d="M31.5 39.1 17.4 24l14.1-15.1-2.8-2.8L11.6 24l17.5 19.9z"/></svg>
      </button>
      <img id="modal-img" src="" alt="imagine mare" style="max-width:90vw;max-height:80vh;border-radius:12px;box-shadow:0 4px 32px #0008;">
      <button id="modal-next" title="Imaginea urmatoare" style="position:absolute;right:3vw;top:50%;transform:translateY(-50%);background:none;border:none;">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="#fff"><path d="M16.5 8.9 30.6 24l-14.1 15.1 2.8 2.8L36.4 24 18.9 4.1z"/></svg>
      </button>
      <button id="modal-close" title="Inchide" style="position:absolute;top:3vh;right:3vw;background:#fff8;border:none;font-size:2.2rem;color:#444;border-radius:50%;width:40px;height:40px;cursor:pointer;z-index:10002;">&times;</button>
    </div>
  `;
}

// Genereaza HTML-ul pentru detaliile de baza ale imobilului
function genereazaDetaliiDeBaza(card) {
  const locatie = card.localizare || card.locatie || '-';
  const tranzactie = card.tip_oferta || card.tranzactie || '';
  return `
    <h2 class="detalii-titlu">${card.titlu}</h2>
    <p><strong>Tip:</strong> ${card.tip_imobil || card.tip || '-'}</p>
    <p><strong>Tranzactie:</strong> ${tranzactie === 'vanzare' ? 'De vanzare' : tranzactie === 'inchiriat' ? 'De inchiriat' : ''}</p>
    <p><strong>Locatie:</strong> ${locatie}</p>
    <p><strong>Suprafata:</strong> ${card.detalii_specifice?.suprafata_utila ? card.detalii_specifice.suprafata_utila + ' mp' : (card.suprafata ? card.suprafata + ' mp' : '-')}</p>
    <p><strong>Descriere:</strong> ${card.descriere}</p>
  `;
}

// Genereaza HTML-ul pentru detaliile specifice dupa tipul imobilului
function genereazaDetaliiSpecifice(card) {
  let detaliiSpecifice = '';
  const detalii = card.detalii_specifice || {};
  if ((card.tip_imobil || card.tip) === 'apartament') {
    detaliiSpecifice = `
      <p><strong>Nr. camere:</strong> ${detalii.nr_camere || card.nr_camere || card.nrCamere || '-'}</p>
      <p><strong>Nr. bai:</strong> ${detalii.nr_bai || card.nr_bai || card.nrBai || '-'}</p>
      <p><strong>Compartimentare:</strong> ${detalii.compartimentare || card.compartimentare || '-'}</p>
      <p><strong>Confort:</strong> ${detalii.confort || card.confort || '-'}</p>
      <p><strong>Etaj:</strong> ${detalii.etaj || card.etaj || '-'}</p>
      <p><strong>An constructie:</strong> ${detalii.an_constructie || card.an_constructie || card.anConstructie || '-'}</p>
    `;
  } else if ((card.tip_imobil || card.tip) === 'casa' || (card.tip_imobil || card.tip) === 'casee') {
    detaliiSpecifice = `
      <p><strong>Suprafata teren:</strong> ${detalii.suprafata_teren || card.suprafata_teren || card.suprafataTeren || '-'}</p>
      <p><strong>Nr. camere:</strong> ${detalii.nr_camere || card.nr_camere || card.nrCamere || '-'}</p>
      <p><strong>Nr. bai:</strong> ${detalii.nr_bai || card.nr_bai || card.nrBai || '-'}</p>
      <p><strong>An constructie:</strong> ${detalii.an_constructie || card.an_constructie || card.anConstructie || '-'}</p>
      <p><strong>Alte dotari:</strong> ${detalii.alte_dotari || card.alte_dotari || card.alteDotari || '-'}</p>
    `;
  } else if ((card.tip_imobil || card.tip) === 'teren') {
    detaliiSpecifice = `
      <p><strong>Tip teren:</strong> ${detalii.tip_teren || card.tip_teren || card.tipTeren || '-'}</p>
      <p><strong>Clasificare:</strong> ${detalii.clasificare || card.clasificare || '-'}</p>
      <p><strong>Front stradal:</strong> ${detalii.front_stradal || card.front_stradal || card.frontStradal || '-'}</p>
    `;
  } else if ((card.tip_imobil || card.tip) === 'spatiu-comercial' || (card.tip_imobil || card.tip) === 'spatiu_comercial') {
    detaliiSpecifice = `
      <p><strong>Alte dotari:</strong> ${detalii.alte_dotari || card.alte_dotari || card.alteDotari || '-'}</p>
    `;
  }
  return detaliiSpecifice;
}

// Afiseaza detaliile complete ale imobilului
function afiseazaDetaliiImobil(card, imagini) {
  let currentSlide = 0;
  function renderSlider() {
    document.getElementById('galerie-slider-area').innerHTML = genereazaGalerie(imagini, currentSlide);

    document.getElementById('slider-prev')?.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentSlide > 0) {
        currentSlide--;
        renderSlider();
      }
    });
    document.getElementById('slider-next')?.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentSlide < imagini.length - 1) {
        currentSlide++;
        renderSlider();
      }
    });

    // Modal logic
    document.querySelector('.slider-img')?.addEventListener('click', function() {
      openModal(currentSlide);
    });
  }

  function openModal(idx) {
    const modal = document.getElementById('galerie-modal');
    const modalImg = document.getElementById('modal-img');
    let current = idx;

    function showImg(i) {
      modalImg.src = `${API_BASE_URL}/${imagini[i].url}`;
      console.log("Modal: " + modalImg.src);
      modalImg.dataset.idx = i;
    }

    showImg(current);
    modal.style.display = 'flex';

    document.getElementById('modal-prev').onclick = (e) => {
      e.stopPropagation();
      current = (current - 1 + imagini.length) % imagini.length;
      showImg(current);
    };
    document.getElementById('modal-next').onclick = (e) => {
      e.stopPropagation();
      current = (current + 1) % imagini.length;
      showImg(current);
    };
    document.getElementById('modal-close').onclick = (e) => {
      e.stopPropagation();
      modal.style.display = 'none';
    };
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = 'none';
    };
    document.onkeydown = function(e) {
      if (modal.style.display !== 'flex') return;
      if (e.key === 'ArrowLeft') document.getElementById('modal-prev').click();
      if (e.key === 'ArrowRight') document.getElementById('modal-next').click();
      if (e.key === 'Escape') document.getElementById('modal-close').click();
    };
  }

  const detaliiDeBaza = genereazaDetaliiDeBaza(card);
  const detaliiSpecifice = genereazaDetaliiSpecifice(card);

  const detaliiComplete = `
    <div class="detalii-card">
      <div id="galerie-slider-area"></div>
      <div class="detalii-info">
        ${detaliiDeBaza}
        ${detaliiSpecifice}
      </div>
    </div>
  `;

  document.getElementById('detalii-container').innerHTML = detaliiComplete;
  renderSlider();
}

// Configureaza functionalitatea modalului pentru galeria de imagini
function configureazaGalerieModal() {
  document.querySelectorAll('.galerie-img').forEach(img => {
    img.onclick = function() {
      document.getElementById('modal-img').src = this.src;
      document.getElementById('galerie-modal').style.display = 'flex';
    };
  });
  document.getElementById('galerie-modal')?.addEventListener('click', function() {
    this.style.display = 'none';
  });
}

// Incarca si afiseaza anunturile relevante
async function incarcaAnunturiRelevante(idCurent, cardCurent) {
  const res = await fetch(`${API_BASE_URL}/api/imobile`);
  const anunturi = await res.json();

  const locatieCurenta = cardCurent.localizare || cardCurent.locatie || '';
  const relevante = anunturi.filter(a =>
    a.id != idCurent && ((a.localizare || a.locatie) === locatieCurenta || a.titlu.toLowerCase().includes(cardCurent.titlu.toLowerCase()))
  ).slice(0, 4);

  const htmlRelevante = relevante.map(r => {
    const imagePath = r.imagine
      ? `${API_BASE_URL}/${r.imagine}`
      : `${API_BASE_URL}/images/casa1.jpg`;
    const price = r.pret ? `${r.pret} €` : 'Pret la cerere';
    const transactionType = r.tip_oferta === 'vanzare'
      ? 'De vanzare'
      : r.tip_oferta === 'inchiriat'
        ? 'De inchiriat'
        : (r.tranzactie === 'vanzare'
          ? 'De vanzare'
          : r.tranzactie === 'inchiriat'
            ? 'De inchiriat'
            : '');
    const surface = r.detalii_specifice?.suprafata_utila || r.suprafata || '-';
    return `
      <div class="imobil-card">
        <div class="imobil-card-img" style="background-image:url('${imagePath}');">
          <button class="imobil-like-btn" title="Favorite">&#10084;</button>
          <div class="imobil-card-labels">
            <div class="imobil-pret">${price}</div>
            <div class="imobil-tip">${transactionType}</div>
          </div>
        </div>
        <div class="imobil-card-body">
          <div class="imobil-titlu">${r.titlu}</div>
          <div class="imobil-locatie">
            <span class="icon-locatie">📍</span>
            ${r.localizare || r.locatie || ''}
          </div>
          <div class="imobil-info">
            <span class="imobil-mp">${surface} mp</span>
            <span class="imobil-id">ID: ${r.id}</span>
          </div>
          <button class="imobil-detalii-btn" data-id="${r.id}">Vezi detalii</button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('relevante-container').innerHTML = htmlRelevante;

  // Adauga event listeners pentru butoanele de detalii (SPA)
  document.querySelectorAll('.imobil-detalii-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const cardId = this.getAttribute('data-id');
      loadContent(`html/detalii.html?id=${cardId}`);
      initializeDetalii(cardId);
    });
  });
}

// Export global pentru SPA
window.initializeDetalii = initializeDetalii;