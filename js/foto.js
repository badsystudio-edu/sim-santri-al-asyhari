// Foto profil: dikompres di browser, disimpan di sheet "Foto" (bukan Google Drive),
// lalu dimuat belakangan (lazy) setelah halaman tampil dan di-cache di localStorage
// sehingga kunjungan berikutnya langsung muncul tanpa menunggu server.

// Kompres foto jadi persegi kecil (default 160px, JPEG). Turunkan kualitas bertahap
// sampai ukurannya cukup kecil untuk disimpan di satu sel Google Sheets.
function kompresFoto(file, sisiMaks = 160, kualitasAwal = 0.75, batasKarakter = 38000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file foto."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("File bukan gambar yang valid."));
      img.onload = () => {
        const sisi = Math.min(img.width, img.height);
        const sx = (img.width - sisi) / 2;
        // Foto potret: potong sedikit lebih ke atas supaya wajah tidak terpotong.
        const sy = img.height > img.width ? (img.height - sisi) * 0.15 : (img.height - sisi) / 2;
        const target = Math.min(sisiMaks, sisi);
        const canvas = document.createElement("canvas");
        canvas.width = target; canvas.height = target;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, target, target);
        ctx.drawImage(img, sx, sy, sisi, sisi, 0, 0, target, target);
        let q = kualitasAwal;
        let out = canvas.toDataURL("image/jpeg", q);
        while (out.length > batasKarakter && q > 0.3) {
          q -= 0.1;
          out = canvas.toDataURL("image/jpeg", q);
        }
        if (out.length > batasKarakter) return reject(new Error("Foto terlalu kompleks untuk dikompres. Coba foto lain."));
        resolve(out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const FotoStore = {
  _mem: {},
  _key: "simsantri_foto_v1",
  muat() {
    try { this._mem = JSON.parse(localStorage.getItem(this._key) || "{}") || {}; }
    catch (e) { this._mem = {}; }
  },
  simpan() {
    try { localStorage.setItem(this._key, JSON.stringify(this._mem)); }
    catch (e) { // penyimpanan penuh: kosongkan saja, nanti diunduh ulang bila perlu
      this._mem = {};
      try { localStorage.removeItem(this._key); } catch (_) { /* abaikan */ }
    }
  },
  get(id, versi) {
    const e = this._mem[id];
    return e && e.v === versi ? e.d : null;
  },
  set(id, versi, data) { this._mem[id] = { v: versi, d: data }; },
  hapusSemua() { this._mem = {}; try { localStorage.removeItem(this._key); } catch (e) { /* abaikan */ } }
};
FotoStore.muat();

function terapkanFoto(el, data) {
  el.setAttribute("data-foto-ok", "1");
  el.style.backgroundImage = 'url("' + data + '")';
  el.style.backgroundSize = "cover";
  el.style.backgroundPosition = "center";
  el.textContent = "";
}

let _hidrasiTimer = null;
function jadwalkanHidrasiFoto() {
  clearTimeout(_hidrasiTimer);
  _hidrasiTimer = setTimeout(hidrasiFoto, 60);
}

async function hidrasiFoto() {
  if (!Auth.isLoggedIn()) return;
  const els = Array.from(document.querySelectorAll("[data-foto-id]:not([data-foto-ok])"));
  if (els.length === 0) return;

  const perlu = {};
  els.forEach(el => {
    const id = el.dataset.fotoId, v = el.dataset.fotoV;
    const d = FotoStore.get(id, v);
    if (d) terapkanFoto(el, d); else perlu[id] = v;
  });

  const ids = Object.keys(perlu);
  for (let i = 0; i < ids.length; i += 40) {
    const potong = ids.slice(i, i + 40);
    try {
      const res = await Api.call("foto.ambil", { ids: potong });
      Object.keys(res.fotos || {}).forEach(id => FotoStore.set(id, perlu[id], res.fotos[id]));
      FotoStore.simpan();
      document.querySelectorAll("[data-foto-id]:not([data-foto-ok])").forEach(el => {
        const d = FotoStore.get(el.dataset.fotoId, el.dataset.fotoV);
        if (d) terapkanFoto(el, d);
      });
    } catch (e) {
      console.warn("Foto gagal dimuat:", e.message);
      break; // tampilan inisial tetap dipakai; coba lagi pada render berikutnya
    }
  }
}

// Setiap kali isi halaman berubah (pindah menu, dsb), pasang foto pada avatar yang baru muncul.
(function pasangPengamatFoto() {
  const target = document.getElementById("app");
  if (!target) return;
  new MutationObserver(jadwalkanHidrasiFoto).observe(target, { childList: true, subtree: true });
})();
