// Cache data referensi di sisi frontend (prinsip gas-instant-ux #1 & #3, versi client).
// Data seperti daftar Kelas/Kelompok/Kamar/Wali dan daftar Santri jarang berubah dalam
// satu sesi kerja, jadi kita simpan di memori tab ini dan pakai ulang tanpa memanggil
// server lagi setiap kali pindah menu. Kedaluwarsa otomatis via TTL, dan dibersihkan
// paksa (invalidate) begitu ada data yang ditambah/diubah lewat form terkait.

const RefCache = {
  _store: {},

  async get(key, fetcher, ttlMs = 5 * 60 * 1000) {
    const entry = this._store[key];
    const fresh = entry && (Date.now() - entry.waktu) < ttlMs;
    if (fresh) return entry.data;

    const data = await fetcher();
    this._store[key] = { data, waktu: Date.now() };
    return data;
  },

  invalidate(key) {
    delete this._store[key];
  },

  invalidateAll() {
    this._store = {};
  }
};

// Pembungkus siap pakai untuk data referensi yang paling sering dipakai lintas halaman.
const Ref = {
  kelas: () => RefCache.get("kelas", () => Api.call("master.list", { entity: "kelas" })),
  kelompok: () => RefCache.get("kelompok", () => Api.call("master.list", { entity: "kelompok" })),
  kamar: () => RefCache.get("kamar", () => Api.call("master.list", { entity: "kamar" })),
  wali: () => RefCache.get("wali", () => Api.call("master.list", { entity: "wali" })),
  santriSemua: () => RefCache.get("santri_semua", () => Api.call("santri.search", {}), 60 * 1000)
};
