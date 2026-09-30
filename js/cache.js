// Cache data referensi di sisi frontend (prinsip gas-instant-ux #1 & #3, versi client).
// Data seperti daftar Kelas/Kelompok/Kamar/Wali dan daftar Santri jarang berubah dalam
// satu sesi kerja, jadi kita simpan di memori DAN sessionStorage (bertahan walau halaman
// di-reload, hilang otomatis saat tab ditutup) supaya pindah menu tidak menunggu server
// lagi untuk data yang sama. Kedaluwarsa otomatis via TTL, dan dibersihkan paksa
// (invalidate) begitu ada data yang ditambah/diubah lewat form terkait.

const RefCache = {
  _store: {},
  _storageKey: "simsantri_refcache",

  _muatDariStorage() {
    try {
      const raw = sessionStorage.getItem(this._storageKey);
      if (raw) this._store = JSON.parse(raw) || {};
    } catch (e) { /* abaikan, mulai dari kosong */ }
  },

  _simpanKeStorage() {
    try { sessionStorage.setItem(this._storageKey, JSON.stringify(this._store)); }
    catch (e) { /* abaikan, mis. storage penuh - cache memori tetap jalan */ }
  },

  async get(key, fetcher, ttlMs = 5 * 60 * 1000) {
    const entry = this._store[key];
    const fresh = entry && (Date.now() - entry.waktu) < ttlMs;
    if (fresh) return entry.data;

    const data = await fetcher();
    this._store[key] = { data, waktu: Date.now() };
    this._simpanKeStorage();
    return data;
  },

  // Ambil data yang tersimpan APA ADANYA (walau sudah lewat TTL), untuk tampilan instan
  // sambil data terbaru diminta ulang di latar belakang (stale-while-revalidate).
  peek(key) {
    return this._store[key] ? this._store[key].data : null;
  },

  invalidate(key) {
    delete this._store[key];
    this._simpanKeStorage();
  },

  invalidateAll() {
    this._store = {};
    this._simpanKeStorage();
  }
};
RefCache._muatDariStorage();

// Pembungkus siap pakai untuk data referensi yang paling sering dipakai lintas halaman.
// Menjamin bentuk { items: [...] } walau respons sukses tapi bentuknya tak terduga.
// Kegagalan jaringan/server TETAP dilempar sebagai error (tidak di-cache), supaya
// pesan galat asli tetap tampil ke pengguna alih-alih diam-diam menyembunyikannya.
async function amanItems(fetcher) {
  const res = await fetcher();
  return { items: (res && Array.isArray(res.items)) ? res.items : [] };
}

const Ref = {
  kelas: () => RefCache.get("kelas", () => amanItems(() => Api.call("master.list", { entity: "kelas" }))),
  kelompok: () => RefCache.get("kelompok", () => amanItems(() => Api.call("master.list", { entity: "kelompok" }))),
  kamar: () => RefCache.get("kamar", () => amanItems(() => Api.call("master.list", { entity: "kamar" }))),
  wali: () => RefCache.get("wali", () => amanItems(() => Api.call("master.list", { entity: "wali" }))),
  santriSemua: () => RefCache.get("santri_semua", () => amanItems(() => Api.call("santri.search", {})), 3 * 60 * 1000),
  dashboard: () => RefCache.get("dashboard", () => Api.call("dashboard", {}), 30 * 1000)
};

// Dipanggil sekali setelah login berhasil (dan saat aplikasi dibuka dengan sesi yang
// masih aktif) untuk "memanaskan" cache di latar belakang - supaya begitu pengguna
// mengklik menu Presensi/Santri/Hafalan/Beranda, datanya sudah siap, bukan baru mulai diminta.
function prefetchSemua() {
  Ref.kelas().catch(() => {});
  Ref.kelompok().catch(() => {});
  Ref.kamar().catch(() => {});
  Ref.santriSemua().catch(() => {});
  Ref.dashboard().catch(() => {});
}
