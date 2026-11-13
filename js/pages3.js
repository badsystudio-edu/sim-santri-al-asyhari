// Profil santri lengkap, Kartu Tanda Santri, Akun Saya (ganti sandi), Input Harian menyeluruh,
// reset sandi cepat (admin), dan latar belakang aplikasi.

// ======================= MODAL UMUM =======================

function bukaModal(judulHtml, isiHtml, aksiHtml) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true"><div class="modal-kepala">${judulHtml}</div><div class="modal-isi">${isiHtml}</div><div class="modal-aksi">${aksiHtml}</div></div>`;
  const tombol = (e) => { if (e.key === "Escape") tutup(); };
  const tutup = () => { overlay.remove(); document.removeEventListener("keydown", tombol); };
  overlay.addEventListener("click", (e) => { if (e.target === overlay || (e.target.dataset && e.target.dataset.tutup)) tutup(); });
  document.addEventListener("keydown", tombol);
  document.body.appendChild(overlay);
  return { overlay, tutup };
}

// ======================= PROFIL SANTRI LENGKAP =======================

function hitungUmur(tgl) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(tgl || ""));
  if (!m) return "";
  const lahir = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])), skrg = new Date();
  let u = skrg.getFullYear() - lahir.getFullYear();
  if (skrg.getMonth() < lahir.getMonth() || (skrg.getMonth() === lahir.getMonth() && skrg.getDate() < lahir.getDate())) u--;
  return u >= 0 && u < 100 ? ` (${u} tahun)` : "";
}

function linkKontak(kontak) {
  const digit = String(kontak || "").replace(/\D/g, "");
  if (!digit) return esc(kontak || "-");
  const wa = digit.indexOf("0") === 0 ? "62" + digit.slice(1) : digit;
  return `${esc(kontak)} &nbsp;<a href="tel:${esc(digit)}" style="color:var(--azure);">Telepon</a> · <a href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener" style="color:var(--emerald);">WhatsApp</a>`;
}

async function namaAkademik(s) {
  const [kelas, kelompok, kamar] = await Promise.all([Ref.kelas(), Ref.kelompok(), Ref.kamar()]);
  const cari = (res, id, f) => { const x = (res.items || []).find(i => String(i.id) === String(id)); return x ? x[f] : ""; };
  return { kelas: cari(kelas, s.id_kelas, "nama_kelas"), kelompok: cari(kelompok, s.id_kelompok, "nama_kelompok"), kamar: cari(kamar, s.id_kamar, "nama_kamar") };
}

// opsi.wali: tampilan untuk orang tua (tanpa tombol ubah/laporan)
async function profilSantriHtml(data, opsi) {
  opsi = opsi || {};
  const s = data.santri;
  const nama = await namaAkademik(s);
  const bulan = bulanIniStr();
  const presensiBulan = (data.riwayat_presensi_sekolah || []).filter(p => String(p.tanggal).indexOf(bulan) === 0);
  const hadir = presensiBulan.filter(p => p.status === "Hadir").length;
  const juzMaks = (data.riwayat_hafalan || []).reduce((m, h) => Math.max(m, Number(h.juz) || 0), 0);
  const isAdmin = Auth.boleh("admin"), adminPimpinan = Auth.boleh("admin", "pimpinan");
  const baris = (label, nilai) => `<div class="bio-label">${label}</div><div class="bio-nilai">${nilai || "-"}</div>`;

  return `
    <div class="card profil-hero">
      <div class="flex gap-2" style="align-items:center;flex-wrap:wrap;">
        ${avatarKecil({ id: s.id, nama: s.nama, url_foto: s.url_foto }, 88)}
        <div style="flex:1;min-width:180px;">
          <h2 class="profil-nama">${esc(s.nama)}</h2>
          <div class="text-muted text-sm">NIS ${esc(s.nis)}${s.nisn ? " · NISN " + esc(s.nisn) : ""}</div>
          <div class="mt-1">${chipTipe(s.tipe)} ${s.status === "aktif" ? `<span class="chip chip-hadir">Aktif</span>` : `<span class="chip chip-nonaktif">Nonaktif</span>`}</div>
        </div>
      </div>
      <div class="flex gap-1 mt-2" style="flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="bukaKartuSantri('${esc(s.id)}')">🪪 Kartu Tanda Santri</button>
        ${!opsi.wali && isAdmin ? `<button class="btn btn-secondary" onclick="Router.go('santri',{form:1, editId:'${esc(s.id)}'})">Edit Data</button>` : ""}
        ${!opsi.wali && adminPimpinan ? `<button class="btn btn-accent" onclick="Router.go('laporan',{id:'${esc(s.id)}'})">Cetak Laporan</button>` : ""}
      </div>
    </div>

    <div class="stat-grid mb-1">
      <div class="stat-card"><div class="num">${presensiBulan.length ? hadir + "/" + presensiBulan.length : "-"}</div><div class="label">Hadir bulan ini</div></div>
      <div class="stat-card"><div class="num">${juzMaks ? "Juz " + juzMaks : "-"}</div><div class="label">Juz tertinggi disetor</div></div>
      <div class="stat-card"><div class="num">${(data.riwayat_prestasi || []).length}</div><div class="label">Prestasi</div></div>
      <div class="stat-card"><div class="num">${(data.riwayat_pelanggaran || []).length}</div><div class="label">Catatan pelanggaran</div></div>
    </div>

    <div class="card">
      <h3>Biodata</h3>
      <div class="bio-grid">
        ${baris("Nama Lengkap", esc(s.nama))}
        ${baris("NIS", esc(s.nis))}
        ${baris("NISN", esc(s.nisn))}
        ${baris("Jenis Kelamin", s.jenis_kelamin === "L" ? "Laki-laki" : (s.jenis_kelamin === "P" ? "Perempuan" : ""))}
        ${baris("Tempat Lahir", esc(s.tempat_lahir))}
        ${baris("Tanggal Lahir", s.tgl_lahir ? fmtTanggal(s.tgl_lahir) + hitungUmur(s.tgl_lahir) : "")}
        ${baris("Alamat", esc(s.alamat))}
        ${baris("Tahun Masuk", esc(s.tahun_masuk))}
      </div>
    </div>

    <div class="card">
      <h3>Pendidikan &amp; Asrama</h3>
      <div class="bio-grid">
        ${baris("Kelas", esc(nama.kelas))}
        ${baris("Kelompok PTQ", esc(nama.kelompok))}
        ${baris("Tipe Santri", s.tipe === "Mukim" ? "Mukim (tinggal di asrama)" : "Non-Mukim")}
        ${baris("Kamar", s.tipe === "Mukim" ? esc(nama.kamar) : "-")}
      </div>
    </div>

    <div class="card">
      <h3>Wali / Orang Tua</h3>
      ${(s.nama_wali || s.kontak_wali) ? `<div class="bio-grid">
        ${baris("Nama Wali", esc(s.nama_wali))}
        ${baris("Hubungan", esc(s.hubungan_wali))}
        ${baris("Kontak", s.kontak_wali ? linkKontak(s.kontak_wali) : "")}
      </div>` : `<div class="empty-state">Data wali belum diisi.</div>`}
    </div>`;
}

async function renderSantriDetail(root, id) {
  root.innerHTML = Shell("santri", `<div class="loading">Memuat detail...</div>`);
  const main = document.querySelector("main.content");
  try {
    const data = await Api.call("santri.detail", { id });
    main.innerHTML = `
      <button class="btn btn-secondary btn-sm mb-1" onclick="Router.go('santri')">&larr; Kembali</button>
      ${await profilSantriHtml(data, {})}
      <div class="card">
        <h3>Riwayat Hafalan (${data.riwayat_hafalan.length})</h3>
        ${data.riwayat_hafalan.length === 0 ? `<div class="empty-state">Belum ada data.</div>` :
          data.riwayat_hafalan.slice(-5).reverse().map(h => `<div class="text-sm mb-1">${fmtTanggal(h.tanggal)} &mdash; Juz ${esc(h.juz)}, ${esc(h.surah)}, ${esc(teksHalaman(h))}</div>`).join("")}
      </div>
      <div class="card">
        <h3>Riwayat Presensi Sekolah (${data.riwayat_presensi_sekolah.length})</h3>
        ${data.riwayat_presensi_sekolah.length === 0 ? `<div class="empty-state">Belum ada data.</div>` :
          data.riwayat_presensi_sekolah.slice(-5).reverse().map(p => `<div class="text-sm mb-1">${fmtTanggal(p.tanggal)} ${chipStatus(p.status)}</div>`).join("")}
      </div>
      <div class="card">
        <h3>Riwayat Prestasi (${data.riwayat_prestasi.length})</h3>
        ${data.riwayat_prestasi.length === 0 ? `<div class="empty-state">Belum ada data.</div>` :
          data.riwayat_prestasi.map(p => `<div class="text-sm mb-1"><b>${esc(p.nama_prestasi)}</b> &mdash; ${esc(p.tingkat)} (${fmtTanggal(p.tanggal)})</div>`).join("")}
      </div>
      <div class="card">
        <h3>Riwayat Pelanggaran (${(data.riwayat_pelanggaran || []).length})</h3>
        ${(data.riwayat_pelanggaran || []).length === 0 ? `<div class="empty-state">Belum ada data.</div>` :
          data.riwayat_pelanggaran.map(p => `<div class="text-sm mb-1"><b>${esc(p.jenis_pelanggaran)}</b> (${fmtTanggal(p.tanggal)}) &mdash; ${esc(p.penanganan)} <span class="text-muted">oleh ${esc(p.penangan)}</span></div>`).join("")}
      </div>
      <div id="pesan-wrap"></div>`;
    await pasangPesanWidget(document.getElementById("pesan-wrap"), data.santri.id);
  } catch (err) { tampilkanGalat(main, err); }
}

// ======================= KARTU TANDA SANTRI =======================

function infoLembaga() {
  return (typeof APP_INFO !== "undefined") ? APP_INFO : { lembaga: "Pesantren Tahfidz Al Asyhari", lokasi: "Rogojampi, Banyuwangi" };
}

// Ambil foto (data-URL) beberapa santri sekaligus; memakai cache perangkat bila sudah pernah dimuat.
async function ambilFotoMap(daftar) {
  const hasil = {}, perlu = [];
  (daftar || []).forEach(s => {
    if (s.url_foto && String(s.url_foto).indexOf("db:") === 0) {
      const d = FotoStore.get(s.id, s.url_foto);
      if (d) hasil[s.id] = d; else perlu.push(s);
    }
  });
  for (let i = 0; i < perlu.length; i += 40) {
    const potong = perlu.slice(i, i + 40);
    try {
      const res = await Api.call("foto.ambil", { ids: potong.map(x => x.id) });
      potong.forEach(s => { const d = (res.fotos || {})[s.id]; if (d) { hasil[s.id] = d; FotoStore.set(s.id, s.url_foto, d); } });
      FotoStore.simpan();
    } catch (e) { /* kartu tetap dibuat tanpa foto */ }
  }
  return hasil;
}

function kartuSantriHtml(s, fotoUrl, nama) {
  const info = infoLembaga();
  const inisial = s.nama ? String(s.nama).trim().charAt(0).toUpperCase() : "?";
  const ttl = [s.tempat_lahir, s.tgl_lahir ? fmtTanggal(s.tgl_lahir) : ""].filter(Boolean).join(", ") || "-";
  return `
    <div class="kts-pasang">
      <div class="kts kts-depan">
        <div class="kts-kepala">
          <img class="kts-logo" src="assets/logo.png" alt="">
          <div><div class="kts-judul">KARTU TANDA SANTRI</div><div class="kts-lembaga">${esc(info.lembaga)}</div></div>
        </div>
        <div class="kts-badan">
          <div class="kts-foto">${fotoUrl ? `<img src="${fotoUrl}" alt="">` : `<span>${esc(inisial)}</span>`}</div>
          <div class="kts-data">
            <div class="kts-nama">${esc(s.nama)}</div>
            <div class="kts-baris"><span>NIS</span><b>${esc(s.nis)}</b></div>
            <div class="kts-baris"><span>TTL</span><em>${esc(ttl)}</em></div>
            <div class="kts-baris"><span>Kelas</span><em>${esc(nama.kelas || "-")}</em></div>
            <div class="kts-baris"><span>${s.tipe === "Mukim" ? "Kamar" : "Status"}</span><em>${s.tipe === "Mukim" ? esc(nama.kamar || "-") : "Non-Mukim"}</em></div>
          </div>
        </div>
        <div class="kts-garis"></div>
      </div>
      <div class="kts kts-belakang">
        <div class="kts-qr" data-qr="${esc(s.nis)}"></div>
        <div class="kts-ket">
          <div class="kts-nis">${esc(s.nis)}</div>
          <div>Kelompok PTQ: <b>${esc(nama.kelompok || "-")}</b></div>
          ${s.tahun_masuk ? `<div>Tahun masuk: <b>${esc(s.tahun_masuk)}</b></div>` : ""}
          <div class="kts-catatan">Kartu ini milik ${esc(info.lembaga)}. Jika ditemukan, mohon dikembalikan ke pesantren.</div>
          <div class="kts-alamat">${esc(info.lokasi || "")}</div>
        </div>
        <div class="kts-garis"></div>
      </div>
    </div>`;
}

// Gambar QR (berisi NIS) bila pustaka tersedia; jika tidak, tampilkan NIS sebagai teks.
function pasangQR(wadah) {
  wadah.querySelectorAll(".kts-qr[data-qr]").forEach(el => {
    const teks = el.dataset.qr;
    try {
      if (typeof QRCode !== "undefined") new QRCode(el, { text: teks, width: 96, height: 96, correctLevel: QRCode.CorrectLevel.M });
      else el.textContent = teks;
    } catch (e) { el.textContent = teks; }
  });
}

function cetakKartuHtml(html, opsi) {
  let gaya = null;
  if (opsi && opsi.landscape) { // mis. leger nilai: kertas A4 mendatar
    gaya = document.createElement("style");
    gaya.textContent = "@page { size: A4 landscape; margin: 10mm; }";
    (document.head || document.body).appendChild(gaya);
  }
  let area = document.getElementById("cetak-area");
  if (!area) { area = document.createElement("div"); area.id = "cetak-area"; document.body.appendChild(area); }
  area.innerHTML = html;
  pasangQR(area);
  document.body.classList.add("mode-cetak");
  const selesai = () => { document.body.classList.remove("mode-cetak"); area.innerHTML = ""; if (gaya) gaya.remove(); window.removeEventListener("afterprint", selesai); };
  window.addEventListener("afterprint", selesai);
  setTimeout(() => window.print(), 300); // beri waktu agar kode QR selesai digambar
}

async function bukaKartuSantri(id) {
  try {
    const data = await Api.call("santri.detail", { id });
    const s = data.santri;
    const [nama, fotoMap] = await Promise.all([namaAkademik(s), ambilFotoMap([s])]);
    const kartu = kartuSantriHtml(s, fotoMap[s.id], nama);
    const m = bukaModal(`<span>🪪</span> Kartu Tanda Santri`, `<div class="kts-skala">${kartu}</div>`,
      `<button type="button" class="btn btn-secondary" data-tutup="1">Tutup</button><button type="button" class="btn btn-primary" id="kts-cetak">Cetak Kartu</button>`);
    pasangQR(m.overlay);
    m.overlay.querySelector("#kts-cetak").addEventListener("click", () => { m.tutup(); cetakKartuHtml(`<div class="kts-cetak-grid">${kartu}</div>`); });
  } catch (err) { alert(err.message); }
}

// Halaman admin: pratinjau & cetak kartu satu kelas sekaligus
Router.add("kartu", async (root) => {
  root.innerHTML = Shell("kartu", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  try {
    const [kelasRes, santriRes] = await Promise.all([Ref.kelas(), Ref.santriSemua()]);
    const kelas = kelasRes.items || [];
    const santriAktif = (santriRes.items || []).filter(s => s.status === "aktif");
    main.innerHTML = `
      <div class="card">
        <h3>Cetak Kartu Tanda Santri</h3>
        <div class="text-muted text-sm mb-1">Pilih kelas untuk melihat dan mencetak kartu seluruh santrinya (depan &amp; belakang, ukuran kartu 85,6 × 54 mm, 2 kartu per baris di kertas A4). Di jendela cetak, aktifkan <b>"Grafik latar belakang"</b> bila warna tidak muncul.</div>
        <div class="field"><label>Kelas</label><select id="kt-kelas">${kelas.map(k => `<option value="${esc(k.id)}">${esc(k.nama_kelas)} (${santriAktif.filter(s => String(s.id_kelas) === String(k.id)).length})</option>`).join("")}</select></div>
        <button class="btn btn-primary btn-block" id="kt-cetak" disabled>Cetak Semua Kartu</button>
      </div>
      <div id="kt-hasil"></div>`;
    let kartuSemua = "";
    async function tampil() {
      const hasilEl = document.getElementById("kt-hasil");
      const id = document.getElementById("kt-kelas").value;
      const roster = santriAktif.filter(s => String(s.id_kelas) === String(id)).sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
      if (roster.length === 0) { hasilEl.innerHTML = `<div class="empty-state">Belum ada santri aktif pada kelas ini.</div>`; document.getElementById("kt-cetak").disabled = true; return; }
      hasilEl.innerHTML = `<div class="loading">Menyiapkan ${roster.length} kartu...</div>`;
      const [fotoMap, kelasN, kelompokN, kamarN] = await Promise.all([ambilFotoMap(roster), Ref.kelas(), Ref.kelompok(), Ref.kamar()]);
      const cari = (res, i, f) => { const x = (res.items || []).find(r => String(r.id) === String(i)); return x ? x[f] : ""; };
      kartuSemua = roster.map(s => kartuSantriHtml(s, fotoMap[s.id], {
        kelas: cari(kelasN, s.id_kelas, "nama_kelas"), kelompok: cari(kelompokN, s.id_kelompok, "nama_kelompok"), kamar: cari(kamarN, s.id_kamar, "nama_kamar")
      })).join("");
      hasilEl.innerHTML = `<div class="kts-daftar">${kartuSemua}</div>`;
      pasangQR(hasilEl);
      document.getElementById("kt-cetak").disabled = false;
    }
    document.getElementById("kt-kelas").addEventListener("change", tampil);
    document.getElementById("kt-cetak").addEventListener("click", () => cetakKartuHtml(`<div class="kts-cetak-grid">${kartuSemua.replace(/<div class="kts-pasang">/g, '<div class="kts-pasang-cetak">')}</div>`));
    if (kelas.length) await tampil();
  } catch (err) { tampilkanGalat(main, err); }
});

// ======================= AKUN SAYA (ganti sandi sendiri) =======================

Router.add("profil", async (root) => {
  root.innerHTML = Shell("profil", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const p = Auth.getProfil() || {};
  const wajib = !!p.wajib_ganti;
  main.innerHTML = `
    ${wajib ? `<div class="alert alert-error"><b>Sandi Anda masih sementara.</b> Demi keamanan, silakan ganti dengan sandi baru yang hanya Anda yang tahu.</div>` : ""}
    <div class="card">
      <div class="flex gap-2" style="align-items:center;">
        ${avatarKecil(p, 64)}
        <div><h3 style="margin:0;background:none;padding:0;">${esc(p.nama)}</h3>
          <div class="text-muted text-sm">${esc(labelPeran(p.peran))}${p.mapel ? " · " + esc(p.mapel) : ""}</div></div>
      </div>
    </div>
    <div class="card">
      <h3>Ganti Sandi</h3>
      <form id="form-sandi" autocomplete="off">
        <div class="field"><label>Sandi Saat Ini</label><input type="password" id="sd-lama" required autocomplete="current-password"></div>
        <div class="field"><label>Sandi Baru (minimal 6 karakter)</label><input type="password" id="sd-baru" required minlength="6" autocomplete="new-password"></div>
        <div class="field"><label>Ulangi Sandi Baru</label><input type="password" id="sd-ulang" required minlength="6" autocomplete="new-password"></div>
        <label style="display:flex;align-items:center;gap:8px;font-weight:500;margin-bottom:12px;"><input type="checkbox" id="sd-lihat"> Tampilkan sandi yang diketik</label>
        <button class="btn btn-primary btn-block" type="submit" id="sd-simpan">Simpan Sandi Baru</button>
        <div id="sd-pesan" class="mt-1"></div>
      </form>
      <div class="text-muted text-sm mt-2">Sandi tidak bisa dilihat siapa pun, termasuk admin. Jika lupa sandi, minta admin pesantren melakukan <b>Reset Sandi</b>, lalu ganti lagi di sini. Hindari memakai NIS, tanggal lahir, atau username sebagai sandi.</div>
    </div>`;
  document.getElementById("sd-lihat").addEventListener("change", (e) => {
    const tipe = e.target.checked ? "text" : "password";
    ["sd-lama", "sd-baru", "sd-ulang"].forEach(id => { document.getElementById(id).type = tipe; });
  });
  document.getElementById("form-sandi").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pesan = document.getElementById("sd-pesan"), btn = document.getElementById("sd-simpan");
    const lama = document.getElementById("sd-lama").value, baru = document.getElementById("sd-baru").value, ulang = document.getElementById("sd-ulang").value;
    if (baru !== ulang) { pesan.innerHTML = `<div class="alert alert-error">Ulangi sandi baru tidak sama.</div>`; return; }
    btn.disabled = true; btn.textContent = "Menyimpan...";
    try {
      await Api.call("password.ganti", { lama, baru });
      const profilBaru = Object.assign({}, Auth.getProfil(), { wajib_ganti: false });
      Auth.setSesi(Auth.getToken(), profilBaru);
      document.querySelectorAll(".banner-sandi").forEach(b => b.remove());
      ["sd-lama", "sd-baru", "sd-ulang"].forEach(id => { document.getElementById(id).value = ""; });
      pesan.innerHTML = `<div class="alert alert-success">Sandi berhasil diganti. Gunakan sandi baru saat login berikutnya.</div>`;
    } catch (err) { pesan.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; }
    btn.disabled = false; btn.textContent = "Simpan Sandi Baru";
  });
});

// ======================= RESET SANDI CEPAT (admin) =======================

window.resetSandiCepat = async function (id) {
  const a = (window.__akunDaftar || []).find(x => x.id === id);
  if (!a) return;
  if (!confirm(`Reset sandi untuk "${a.nama}"? Sandi lama tidak berlaku lagi.`)) return;
  try {
    const d = await Api.call("akun.resetPassword", { id });
    const m = bukaModal(`<span>🔑</span> Sandi Sementara`, `
      <div class="text-sm mb-1">Sampaikan data berikut kepada <b>${esc(a.nama)}</b>. Sandi ini <b>hanya tampil sekali</b>; pengguna akan diminta menggantinya sendiri setelah masuk.</div>
      <div class="kotak-sandi"><div class="text-muted text-sm">Username${a.peran === "wali_santri" ? " (NIS)" : ""}</div><div><b>${esc(a.username)}</b></div>
        <div class="text-muted text-sm mt-1">Sandi sementara</div><div><code id="sandi-tmp" style="font-size:20px;">${esc(d.sandi_baru)}</code></div></div>`,
      `<button type="button" class="btn btn-secondary" id="sandi-salin">Salin Sandi</button><button type="button" class="btn btn-primary" data-tutup="1">Selesai</button>`);
    m.overlay.querySelector("#sandi-salin").addEventListener("click", async (e) => {
      try { await navigator.clipboard.writeText(d.sandi_baru); e.target.textContent = "Tersalin ✓"; } catch (err) { e.target.textContent = "Salin manual"; }
    });
    if (window.__muatAkun) window.__muatAkun();
  } catch (err) { alert(err.message); }
};

// ======================= INPUT HARIAN MENYELURUH (guru) =======================

Router.add("harian", async (root) => {
  root.innerHTML = Shell("harian", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const profil = Auth.getProfil();
  const el = (id) => document.getElementById(id);
  const kunciPref = "simsantri_harian_" + profil.id;
  let pref = {};
  try { pref = JSON.parse(localStorage.getItem(kunciPref) || "{}") || {}; } catch (e) { pref = {}; }
  const st = { grup: [], libur: false };

  try {
    const [jamRes, mapelRes] = await Promise.all([Ref.jam(), Ref.mapel()]);
    const slotJam = (jamRes.items || []).filter(s => s.jenis === "jam");
    const mapelSaya = (profil.mapel || "").split(",").map(s => s.trim()).filter(Boolean);
    const semuaMapel = (mapelRes.items || []).map(m => m.nama_mapel);
    const namaGrup = "kelas/kelompok";
    const mapelAwal = mapelSaya.indexOf(pref.mapel) !== -1 ? pref.mapel : (mapelSaya[0] || pref.mapel || "");
    const jamAwal = slotJam.some(s => s.label === pref.jam) ? pref.jam : (slotJam[0] ? slotJam[0].label : "");

    main.innerHTML = `
      <div class="card">
        <h3>Input Harian Cepat</h3>
        <div class="text-muted text-sm mb-1">Absensi <b>semua ${namaGrup} Anda sekaligus</b> dan jurnal dalam satu kali simpan. Semua santri otomatis <b>Hadir</b>; ubah hanya yang tidak hadir. Jurnal tersimpan bila kolom Materi diisi.</div>
        <div class="grid-2">
          <div class="field"><label>Tanggal</label><input type="date" id="hr-tanggal" value="${tglHariIni()}"></div>
          <div class="field"><label>Jam ke-</label>
            ${slotJam.length === 0 ? `<input type="text" id="hr-jam" value="${esc(jamAwal)}" placeholder="mis. Jam ke-1">`
              : `<select id="hr-jam">${slotJam.map(s => `<option value="${esc(s.label)}" ${s.label === jamAwal ? "selected" : ""}>${esc(labelJamSlot(s))}</option>`).join("")}</select>`}
          </div>
        </div>
        <div class="field"><label>Mata Pelajaran / Materi Bidang</label>
          ${mapelSaya.length > 1 ? `<select id="hr-mapel">${mapelSaya.map(m => `<option ${m === mapelAwal ? "selected" : ""}>${esc(m)}</option>`).join("")}</select>`
            : `<input type="text" id="hr-mapel" list="hr-mapel-list" value="${esc(mapelAwal)}" placeholder="mis. Tahfidz"><datalist id="hr-mapel-list">${semuaMapel.map(m => `<option value="${esc(m)}"></option>`).join("")}</datalist>`}
        </div>
        <div class="field"><label>Materi yang Diajarkan (kosongkan jika hanya absensi)</label><textarea id="hr-materi" rows="2" placeholder="Pokok bahasan hari ini"></textarea></div>
        <div class="field"><label>Catatan (opsional)</label><input type="text" id="hr-catatan" placeholder="mis. tugas, kendala"></div>
        <div id="hr-libur"></div>
      </div>
      <div id="hr-grup"><div class="loading">Memuat daftar santri...</div></div>
      <div class="bar-simpan"><button class="btn btn-primary btn-block" id="hr-simpan" disabled>Simpan Absensi &amp; Jurnal</button><div id="hr-pesan" class="mt-1"></div></div>`;

    const ringkas = (g) => {
      const tdk = g.santri.filter(x => x.status !== "Hadir").length;
      return `Hadir ${g.santri.length - tdk} · Tidak hadir ${tdk}`;
    };
    function grupHtml(gi) {
      const g = st.grup[gi];
      return `
        <div class="flex-between">
          <label class="hr-ikut"><input type="checkbox" data-aksi="ikut" data-g="${gi}" ${g.ikut ? "checked" : ""}> <b>${esc(g.nama)}</b>${g.nama_lembaga ? ` <span class="chip chip-juz">${esc(g.nama_lembaga)}</span>` : ""} <span class="text-muted text-sm">(${g.santri.length} santri)</span></label>
          <div class="flex gap-1"><button type="button" class="btn btn-secondary btn-sm" data-aksi="semua" data-g="${gi}">Semua Hadir</button><button type="button" class="btn btn-secondary btn-sm" data-aksi="lipat" data-g="${gi}">${g.lipat ? "Buka" : "Tutup"}</button></div>
        </div>
        <div class="text-sm text-muted mt-1">${ringkas(g)}${g.sudah_disimpan ? " · <b>sudah ada data tanggal ini (akan diperbarui)</b>" : ""}</div>
        ${g.lipat ? "" : `<div class="hr-daftar">${g.santri.length === 0 ? `<div class="empty-state">Belum ada santri aktif.</div>` : g.santri.map((x, i) => `
          <div class="flex-between hr-baris">
            <div style="min-width:0;"><div style="font-weight:600;">${esc(x.nama)}</div><div class="text-muted text-sm">NIS ${esc(x.nis)}</div></div>
            <div class="segmented" style="width:200px;flex-shrink:0;">
              ${["Hadir", "Sakit", "Izin", "Alpa"].map(s => `<button type="button" data-aksi="status" data-g="${gi}" data-i="${i}" data-s="${s}" class="${x.status === s ? "active-" + s.toLowerCase() : ""}">${s}</button>`).join("")}
            </div>
          </div>`).join("")}</div>`}`;
    }
    function gambarGrup(gi) { el("hr-g-" + gi).innerHTML = grupHtml(gi); }

    async function muat() {
      const tanggal = el("hr-tanggal").value;
      el("hr-grup").innerHTML = `<div class="loading">Memuat daftar santri...</div>`;
      el("hr-simpan").disabled = true;
      try {
        const d = await Api.call("harian.muat", { tanggal });
        st.grup = d.grup.map(g => ({ ref_id: g.ref_id, nama: g.nama, nama_lembaga: g.nama_lembaga || "", jenis: g.jenis, santri: g.santri, sudah_disimpan: g.sudah_disimpan, ikut: true, lipat: false }));
        st.libur = !!(d.libur && d.libur.diblokir);
        el("hr-libur").innerHTML = pesanLiburHtml({ diblokir: st.libur, alasan: d.libur ? d.libur.alasan : "", admin_dikecualikan: false });
        if (d.jurnal && d.jurnal.length) {
          const j = d.jurnal[0];
          if (!el("hr-materi").value) el("hr-materi").value = j.materi || "";
          if (d.mapel_tersimpan && mapelSaya.length <= 1 && !el("hr-mapel").value) el("hr-mapel").value = d.mapel_tersimpan;
        }
        el("hr-grup").innerHTML = st.grup.length === 0
          ? `<div class="card"><div class="empty-state">Anda belum ditugaskan pada ${namaGrup} mana pun. Hubungi admin.</div></div>`
          : st.grup.map((g, gi) => `<div class="card hr-grup" id="hr-g-${gi}">${grupHtml(gi)}</div>`).join("");
        el("hr-simpan").disabled = st.libur || st.grup.length === 0;
      } catch (err) { tampilkanGalat(el("hr-grup"), err); }
    }

    el("hr-grup").addEventListener("click", (e) => {
      const t = e.target && e.target.closest ? e.target.closest("[data-aksi]") : null;
      if (!t || t.dataset.aksi === "ikut") return;
      const gi = Number(t.dataset.g), g = st.grup[gi];
      if (!g) return;
      if (t.dataset.aksi === "status") g.santri[Number(t.dataset.i)].status = t.dataset.s;
      else if (t.dataset.aksi === "semua") g.santri.forEach(x => { x.status = "Hadir"; });
      else if (t.dataset.aksi === "lipat") g.lipat = !g.lipat;
      gambarGrup(gi);
    });
    el("hr-grup").addEventListener("change", (e) => {
      const t = e.target;
      if (t && t.dataset && t.dataset.aksi === "ikut" && st.grup[Number(t.dataset.g)]) st.grup[Number(t.dataset.g)].ikut = !!t.checked;
    });
    el("hr-tanggal").addEventListener("change", muat);

    el("hr-simpan").addEventListener("click", async () => {
      const pesan = el("hr-pesan"), btn = el("hr-simpan");
      const terpilih = st.grup.filter(g => g.ikut);
      if (terpilih.length === 0) { pesan.innerHTML = `<div class="alert alert-error">Centang minimal satu ${namaGrup}.</div>`; return; }
      const materi = el("hr-materi").value.trim(), mapel = el("hr-mapel").value.trim(), jam = el("hr-jam").value.trim();
      if (materi && (!mapel || !jam)) { pesan.innerHTML = `<div class="alert alert-error">Untuk jurnal, isi Mata Pelajaran dan Jam ke-.</div>`; return; }
      btn.disabled = true; btn.textContent = "Menyimpan...";
      pesan.innerHTML = "";
      try {
        const d = await Api.call("harian.simpan", {
          tanggal: el("hr-tanggal").value, jam_ke: jam, mapel, materi, catatan: el("hr-catatan").value.trim(),
          grup: terpilih.map(g => ({ ref_id: g.ref_id, items: g.santri.map(x => ({ id_santri: x.id_santri, status: x.status })) }))
        });
        try { localStorage.setItem(kunciPref, JSON.stringify({ mapel, jam })); } catch (e) { /* abaikan */ }
        RefCache.invalidate("dashboard");
        pesan.innerHTML = `<div class="alert ${d.gagal ? "alert-error" : "alert-success"}">${d.berhasil} ${namaGrup} tersimpan${d.gagal ? `, ${d.gagal} gagal` : ""}.</div>` +
          d.hasil.map(h => `<div class="text-sm">${h.galat ? "✗" : "✓"} <b>${esc(h.nama)}</b>: ${h.galat ? esc(h.galat) : "absensi" + (h.jurnal ? " + jurnal" : "") + " tersimpan"}</div>`).join("");
        await muat();
      } catch (err) { pesan.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; }
      btn.textContent = "Simpan Absensi & Jurnal";
      btn.disabled = st.libur || st.grup.length === 0;
    });

    await muat();
  } catch (err) { tampilkanGalat(main, err); }
});

// ======================= LATAR BELAKANG APLIKASI (foto dari admin) =======================

function terapkanLatar(url) {
  document.body.classList.toggle("punya-latar", !!url);
  document.body.style.setProperty("--latar-gambar", url ? `url("${url}")` : "none");
}

async function muatLatarAplikasi() {
  try {
    let simpanan = null;
    try { simpanan = JSON.parse(localStorage.getItem("simsantri_latar") || "null"); } catch (e) { simpanan = null; }
    if (simpanan && simpanan.data_url) terapkanLatar(simpanan.data_url); // tampil cepat dari perangkat
    const d = await Api.call("publik.latar", { versi: simpanan ? simpanan.versi : "" });
    if (d.versi === "0") { localStorage.removeItem("simsantri_latar"); terapkanLatar(""); return; }
    if (d.data_url) {
      try { localStorage.setItem("simsantri_latar", JSON.stringify({ versi: d.versi, data_url: d.data_url })); } catch (e) { /* penyimpanan penuh */ }
      terapkanLatar(d.data_url);
    }
  } catch (e) { /* latar bersifat tambahan */ }
}

async function renderLatarAplikasi(container) {
  if (!Auth.boleh("admin")) { container.innerHTML = ""; return; }
  let ada = "";
  try { ada = (await Api.call("latar.get", {})).data_url || ""; } catch (e) { /* belum ada */ }
  container.innerHTML = `
    <div class="card">
      <h3>Latar Belakang Aplikasi (foto)</h3>
      <div class="text-muted text-sm mb-1">Foto ini menjadi latar belakang seluruh aplikasi dan halaman login (otomatis diberi lapisan pudar agar tulisan tetap jelas). Gunakan foto pesantren/kegiatan yang tidak terlalu ramai. Foto dikecilkan otomatis.</div>
      <div id="latar-lama">${ada ? `<img src="${ada}" alt="Latar saat ini" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;">` : `<div class="empty-state">Belum ada foto latar. Aplikasi memakai ornamen bawaan.</div>`}</div>
      <div class="field mt-1"><label>Pilih foto latar baru</label><input type="file" id="latar-file" accept="image/*"></div>
      <div id="latar-baru"></div>
      <div class="flex gap-1 mt-1"><button class="btn btn-primary btn-block" id="latar-simpan">Simpan Latar</button>${ada ? `<button class="btn btn-danger btn-block" id="latar-hapus">Hapus Latar</button>` : ""}</div>
      <div id="latar-pesan" class="mt-1"></div>
    </div>`;
  let baru = "";
  document.getElementById("latar-file").addEventListener("change", async (e) => {
    const f = e.target.files[0], prev = document.getElementById("latar-baru");
    baru = "";
    if (!f) { prev.innerHTML = ""; return; }
    try {
      baru = await kompresFoto(f, 720, 0.7, 48000, false);
      prev.innerHTML = `<div class="text-muted text-sm">Pratinjau (${Math.round(baru.length / 1024)} KB setelah dikecilkan):</div><img src="${baru}" alt="" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;">`;
    } catch (err) { prev.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; }
  });
  document.getElementById("latar-simpan").addEventListener("click", async (e) => {
    const pesan = document.getElementById("latar-pesan");
    if (!baru) { pesan.innerHTML = `<div class="alert alert-error">Pilih foto dulu.</div>`; return; }
    e.target.disabled = true;
    try {
      await Api.call("latar.simpan", { gambar_base64: baru });
      terapkanLatar(baru);
      try { localStorage.removeItem("simsantri_latar"); } catch (x) { /* abaikan */ }
      muatLatarAplikasi();
      renderLatarAplikasi(container);
    } catch (err) { pesan.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; e.target.disabled = false; }
  });
  const hapus = document.getElementById("latar-hapus");
  if (hapus) hapus.addEventListener("click", async () => {
    if (!confirm("Hapus foto latar? Aplikasi kembali memakai ornamen bawaan.")) return;
    try { await Api.call("latar.hapus", {}); terapkanLatar(""); localStorage.removeItem("simsantri_latar"); renderLatarAplikasi(container); } catch (err) { alert(err.message); }
  });
}

// ======================= PENGATURAN RAPORT (kop sekolah & yayasan, penandatangan, urutan mapel) =======================

async function renderPengaturanRaport(container) {
  if (!Auth.boleh("admin")) { container.innerHTML = ""; return; }
  container.innerHTML = `<div class="card"><div class="loading">Memuat pengaturan raport...</div></div>`;
  let set, mapelMaster, kop = { sekolah: "", yayasan: "" }, akunPilih = [];
  try {
    const hasil = await Promise.all([
      Api.call("raportset.get", {}), Ref.mapel(),
      Api.call("kop.get", { jenis: "sekolah" }).catch(() => ({ data_url: "" })),
      Api.call("kop.get", { jenis: "yayasan" }).catch(() => ({ data_url: "" })),
      Api.call("akun.list", {}).catch(() => ({ items: [] }))
    ]);
    akunPilih = (hasil[4].items || []).filter(a => a.peran !== "wali_santri" && a.status !== "nonaktif");
    set = hasil[0]; mapelMaster = (hasil[1].items || []).map(m => m.nama_mapel);
    kop.sekolah = hasil[2].data_url || ""; kop.yayasan = hasil[3].data_url || "";
  } catch (err) { tampilkanGalat(container, err); return; }

  // Urutan awal: yang sudah diatur admin lebih dulu, sisanya (mapel master lain) di bawahnya.
  const urut = set.urutan_mapel.slice();
  mapelMaster.forEach(m => { if (urut.indexOf(m) === -1) urut.push(m); });

  const blokKop = (jenis, judul) => `
    <div class="kop-blok">
      <div style="font-weight:700;margin-bottom:6px;">${judul}</div>
      <div id="kop-lama-${jenis}">${kop[jenis] ? `<img src="${kop[jenis]}" alt="Kop ${judul}" style="width:100%;border:1px dashed #CBD5E1;border-radius:10px;background:#fff;">` : `<div class="empty-state" style="padding:16px;">Belum ada gambar.</div>`}</div>
      <input type="file" id="kop-file-${jenis}" accept="image/*" style="margin-top:8px;">
      <div id="kop-baru-${jenis}"></div>
      <div class="flex gap-1 mt-1"><button type="button" class="btn btn-primary btn-sm" id="kop-simpan-${jenis}">Simpan Gambar</button>${kop[jenis] ? `<button type="button" class="btn btn-danger btn-sm" id="kop-hapus-${jenis}">Hapus</button>` : ""}</div>
    </div>`;

  container.innerHTML = `
    <div class="card">
      <h3>Raport &mdash; Kop (Sekolah &amp; Yayasan)</h3>
      <div class="text-muted text-sm mb-1">Unggah kop surat masing-masing (logo, nama, alamat) lalu pilih kop yang dipakai di raport. Gambar dikecilkan otomatis; proporsi lebar (mis. 6:1) paling pas dan gambar sederhana lebih aman.</div>
      <div class="grid-2" style="align-items:start;">${blokKop("sekolah", "Kop Sekolah")}${blokKop("yayasan", "Kop Yayasan")}</div>
      <div class="field mt-2"><label>Kop yang dipakai di raport</label>
        <select id="rs-kop-pakai">
          <option value="sekolah" ${set.kop_pakai === "sekolah" ? "selected" : ""}>Kop Sekolah</option>
          <option value="yayasan" ${set.kop_pakai === "yayasan" ? "selected" : ""}>Kop Yayasan</option>
          <option value="keduanya" ${set.kop_pakai === "keduanya" ? "selected" : ""}>Kop Yayasan + Kop Sekolah (bersusun)</option>
          <option value="teks" ${set.kop_pakai === "teks" ? "selected" : ""}>Kop teks (tanpa gambar)</option>
        </select>
        <div class="text-muted text-sm mt-1">Bila kop yang dipilih belum diunggah, raport otomatis memakai kop teks.</div>
      </div>
      <button type="button" class="btn btn-primary btn-block" id="rs-simpan-kop">Simpan Pilihan Kop</button>
      <div id="rs-pesan-kop" class="mt-1"></div>
    </div>

    <div class="card">
      <h3>Raport &mdash; Penandatangan</h3>
      <div class="text-muted text-sm mb-1">Urutan tanda tangan di raport (kiri ke kanan): <b>Pengasuh Pondok Pesantren, Kepala Sekolah, Wali Murid</b>. Nama terisi otomatis; nama <b>Wali Murid</b> diambil dari data wali santri (Edit Santri &rarr; Data Wali).</div>
      <div class="field"><label>Pengasuh (pilih akun &mdash; nama &amp; NIP tampil otomatis di raport)</label>
        <select id="rs-id-pengasuh"><option value="">(belum dipilih &mdash; pakai isian manual di bawah)</option>${akunPilih.map(a => `<option value="${esc(a.id)}" ${String(set.id_pengasuh) === String(a.id) ? "selected" : ""}>${esc(a.nama)} (${esc(a.peran)})</option>`).join("")}</select>
        <div class="text-muted text-sm mt-1">Kepala sekolah/TPQ dipilih per lembaga di <b>Data Master &rarr; Lembaga</b>; wali kelas otomatis dari penugasan akun; NIP diisi di <b>Kelola Akun</b>.</div></div>
      <div class="field"><label>Nama Pengasuh (manual, hanya dipakai bila akun belum dipilih)</label><input type="text" id="rs-pengasuh" value="${esc(set.nama_pengasuh)}" maxlength="120" placeholder="mis. KH. Ahmad Asyhari"></div>
      <div class="field"><label>Nama Kepala Sekolah</label><input type="text" id="rs-kepsek" value="${esc(set.nama_kepala_sekolah)}" maxlength="120" placeholder="mis. Ust. Budi Santoso, S.Pd"></div>
      <div class="grid-2">
        <div class="field"><label>NIP/NIY Kepala Sekolah (opsional)</label><input type="text" id="rs-nip" value="${esc(set.nip_kepala_sekolah)}" maxlength="120"></div>
        <div class="field"><label>Tempat penandatanganan</label><input type="text" id="rs-tempat" value="${esc(set.tempat_ttd)}" maxlength="120" placeholder="mis. Rogojampi"></div>
      </div>
      <div class="text-muted text-sm mb-1">Tanggal di raport otomatis memakai tanggal saat raport dicetak.</div>
      <button type="button" class="btn btn-primary btn-block" id="rs-simpan-ttd">Simpan Penandatangan</button>
      <div id="rs-pesan-ttd" class="mt-1"></div>
    </div>

    <div class="card">
      <h3>Raport &mdash; Urutan Mata Pelajaran</h3>
      <div class="text-muted text-sm mb-1">Atur posisi mapel pada tabel nilai raport dengan tombol ▲ ▼. Mapel yang belum tercantum di sini otomatis ditaruh di bawah, berurutan abjad.</div>
      ${urut.length === 0 ? `<div class="empty-state">Belum ada mata pelajaran. Tambahkan di Data Master &rarr; Mata Pelajaran.</div>` : `<ol class="urut-mapel" id="ur-list"></ol>
      <button type="button" class="btn btn-primary btn-block mt-1" id="rs-simpan-urut">Simpan Urutan</button>`}
      <div id="rs-pesan-urut" class="mt-1"></div>
    </div>`;

  const el = (id) => document.getElementById(id);
  const pesan = (id, ok, teks) => { el(id).innerHTML = `<div class="alert ${ok ? "alert-success" : "alert-error"}">${esc(teks)}</div>`; };

  // --- unggah / hapus kop (sekolah & yayasan)
  ["sekolah", "yayasan"].forEach(jenis => {
    let baru = "";
    el("kop-file-" + jenis).addEventListener("change", async (e) => {
      const f = e.target.files[0], prev = el("kop-baru-" + jenis);
      baru = "";
      if (!f) { prev.innerHTML = ""; return; }
      try {
        baru = await kompresFoto(f, 800, 0.85, 48000, false);
        prev.innerHTML = `<div class="text-muted text-sm mt-1">Pratinjau (${Math.round(baru.length / 1024)} KB):</div><img src="${baru}" alt="" style="width:100%;border:1px solid #A7F3D0;border-radius:10px;">`;
      } catch (err) { prev.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; }
    });
    el("kop-simpan-" + jenis).addEventListener("click", async (e) => {
      if (!baru) { pesan("rs-pesan-kop", false, "Pilih gambar kop " + jenis + " dulu."); return; }
      e.target.disabled = true;
      try { await Api.call("kop.simpan", { jenis, gambar_base64: baru }); renderPengaturanRaport(container); }
      catch (err) { pesan("rs-pesan-kop", false, err.message); e.target.disabled = false; }
    });
    const hapus = el("kop-hapus-" + jenis);
    if (hapus) hapus.addEventListener("click", async () => {
      if (!confirm("Hapus gambar kop " + jenis + "?")) return;
      try { await Api.call("kop.hapus", { jenis }); renderPengaturanRaport(container); } catch (err) { alert(err.message); }
    });
  });

  el("rs-simpan-kop").addEventListener("click", async () => {
    try { await Api.call("raportset.simpan", { data: { kop_pakai: el("rs-kop-pakai").value } }); pesan("rs-pesan-kop", true, "Pilihan kop disimpan."); }
    catch (err) { pesan("rs-pesan-kop", false, err.message); }
  });
  el("rs-simpan-ttd").addEventListener("click", async () => {
    try {
      await Api.call("raportset.simpan", { data: { id_pengasuh: el("rs-id-pengasuh").value, nama_pengasuh: el("rs-pengasuh").value, nama_kepala_sekolah: el("rs-kepsek").value, nip_kepala_sekolah: el("rs-nip").value, tempat_ttd: el("rs-tempat").value } });
      pesan("rs-pesan-ttd", true, "Data penandatangan disimpan.");
    } catch (err) { pesan("rs-pesan-ttd", false, err.message); }
  });

  // --- urutan mapel
  function gambarUrut() {
    const daftar = el("ur-list");
    if (!daftar) return;
    daftar.innerHTML = urut.map((m, i) => `
      <li><span class="urut-no">${i + 1}</span><span class="urut-nama">${esc(m)}</span>
        <span class="urut-aksi"><button type="button" class="btn btn-secondary btn-sm" data-n="${i}" data-arah="-1" ${i === 0 ? "disabled" : ""} aria-label="Naikkan">▲</button><button type="button" class="btn btn-secondary btn-sm" data-n="${i}" data-arah="1" ${i === urut.length - 1 ? "disabled" : ""} aria-label="Turunkan">▼</button></span></li>`).join("");
  }
  if (el("ur-list")) {
    gambarUrut();
    el("ur-list").addEventListener("click", (e) => {
      const t = e.target && e.target.closest ? e.target.closest("[data-n]") : null;
      if (!t) return;
      const i = Number(t.dataset.n), j = i + Number(t.dataset.arah);
      if (j < 0 || j >= urut.length) return;
      const x = urut[i]; urut[i] = urut[j]; urut[j] = x;
      gambarUrut();
    });
    el("rs-simpan-urut").addEventListener("click", async () => {
      try { await Api.call("raportset.simpan", { data: { urutan_mapel: urut } }); pesan("rs-pesan-urut", true, "Urutan mata pelajaran disimpan. Berlaku di tampilan dan PDF raport."); }
      catch (err) { pesan("rs-pesan-urut", false, err.message); }
    });
  }
}


// ======================= LEGER NILAI KELAS / KELOMPOK (unduh Excel & cetak/PDF) =======================

function namaBerkas(teks) { return String(teks).replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function judulLeger(d) { return "LEGER NILAI " + (d.jenis === "semester" ? "SEMESTER" : "PENILAIAN TENGAH SEMESTER (PTS)") + (d.nama_lembaga ? " — " + d.nama_lembaga : ""); }
function angkaId(n) { return n === null || n === undefined || n === "" ? "-" : String(n).replace(".", ","); }
function kolomPeringkatLeger(d) {
  const k = [];
  if (!d.tampil || d.tampil.kelas) k.push({ judul: "Peringkat " + d.grup_label, ambil: (b) => b.peringkat });
  if (d.tampil && d.tampil.paralel) k.push({ judul: "Peringkat Paralel", ambil: (b) => b.peringkat_paralel });
  return k;
}

function legerAoa(d) {
  const kp = kolomPeringkatLeger(d);
  const aoa = [
    [String(d.lembaga || "").toUpperCase()], [judulLeger(d)],
    [`${d.grup_label || "Kelas"}: ${d.kelas.nama}    Semester: ${d.semester}    Tahun Ajaran: ${d.tahun_ajaran}`], []
  ];
  aoa.push(["No", "Nama Santri", "NIS"].concat(d.mapel).concat(["Jumlah", "Rata-rata"]).concat(kp.map(k => k.judul)));
  d.baris.forEach((b, i) => {
    const v = (x) => (x === null || x === undefined) ? "" : x;
    aoa.push([i + 1, b.nama, b.nis].concat(d.mapel.map(m => v(b.nilai[m]))).concat([v(b.jumlah), v(b.rata_rata)]).concat(kp.map(k => v(k.ambil(b)))));
  });
  return aoa;
}

function unduhBerkas(blob, nama) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nama;
  a.click();
}

function unduhLegerExcel(d) {
  const aoa = legerAoa(d);
  const kp = kolomPeringkatLeger(d);
  const nama = `Leger_${namaBerkas(d.kelas.nama)}_${d.jenis === "semester" ? "Semester" : "PTS"}_${d.semester}_${namaBerkas(d.tahun_ajaran)}`;
  if (typeof XLSX !== "undefined" && XLSX.utils && XLSX.writeFile) {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 12 }].concat(d.mapel.map(() => ({ wch: 14 }))).concat([{ wch: 10 }, { wch: 11 }]).concat(kp.map(() => ({ wch: 16 })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leger");
    XLSX.writeFile(wb, nama + ".xlsx");
  } else { // cadangan bila pustaka Excel tidak termuat: CSV yang tetap bisa dibuka di Excel
    const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    const csv = "\ufeff" + aoa.map(r => r.map(q).join(",")).join("\n");
    unduhBerkas(new Blob([csv], { type: "text/csv;charset=utf-8" }), nama + ".csv");
  }
}

function legerHtml(d) {
  const kp = kolomPeringkatLeger(d);
  const kepala = ["No", "Nama Santri", "NIS"].concat(d.mapel).concat(["Jumlah", "Rata-rata"]).concat(kp.map(k => k.judul));
  return `
    <div class="leger-kepala">
      <div class="leger-lembaga">${esc(d.lembaga)}</div>
      <div class="leger-judul">${esc(judulLeger(d))}</div>
      <div class="leger-info">${esc(d.grup_label || "Kelas")} <b>${esc(d.kelas.nama)}</b> &nbsp;·&nbsp; Semester <b>${esc(d.semester)}</b> &nbsp;·&nbsp; Tahun Ajaran <b>${esc(d.tahun_ajaran)}</b>${d.kelas.wali_kelas ? ` &nbsp;·&nbsp; ${d.grup_label === "Kelompok" ? "Pengajar" : "Wali Kelas"} <b>${esc(d.kelas.wali_kelas)}</b>` : ""}</div>
    </div>
    <div class="table-wrap"><table class="leger-tabel">
      <tr>${kepala.map(k => `<th>${esc(k)}</th>`).join("")}</tr>
      ${d.baris.map((b, i) => `<tr><td>${i + 1}</td><td class="nama">${esc(b.nama)}</td><td>${esc(b.nis)}</td>
        ${d.mapel.map(m => `<td>${angkaId(b.nilai[m])}</td>`).join("")}
        <td><b>${angkaId(b.jumlah)}</b></td><td><b>${angkaId(b.rata_rata)}</b></td>
        ${kp.map(k => `<td><b>${angkaId(k.ambil(b))}</b></td>`).join("")}</tr>`).join("")}
    </table></div>
    <div class="leger-ket">Nilai = nilai akhir per mata pelajaran (bobot Harian ${d.bobot.harian}%, PTS ${d.bobot.pts}%${d.jenis === "semester" ? `, PAS ${d.bobot.pas}%` : ""}). Peringkat berdasarkan rata-rata nilai akhir${d.tampil && d.tampil.paralel ? "; peringkat paralel membandingkan seluruh " + (d.grup_label === "Kelompok" ? "kelompok" : "kelas") + " pada tingkat " + esc(d.kelas.tingkat) : ""}; tanda "-" = belum ada nilai.</div>`;
}

function pasangLeger(ambilParam) {
  const wadah = document.getElementById("leger-wrap");
  if (!wadah) return;
  wadah.innerHTML = `
    <div class="card">
      <h3>Leger Nilai</h3>
      <div class="text-muted text-sm mb-1">Rekap nilai akhir seluruh santri satu kelas/kelompok (jenis raport, kelas/kelompok, semester, dan tahun ajaran mengikuti pilihan di atas), lengkap dengan jumlah, rata-rata, dan peringkat (kelas dan paralel sesuai opsi jenis raport). Tidak tersedia untuk raport halaqah.</div>
      <div class="flex gap-1" style="flex-wrap:wrap;">
        <button type="button" class="btn btn-secondary" id="lg-lihat">Tampilkan</button>
        <button type="button" class="btn btn-primary" id="lg-excel">⬇ Unduh Excel</button>
        <button type="button" class="btn btn-accent" id="lg-cetak">🖨 Cetak / PDF</button>
      </div>
      <div id="lg-pesan" class="mt-1"></div>
      <div id="lg-hasil" class="mt-1"></div>
    </div>`;
  const el = (id) => document.getElementById(id);
  async function ambil() {
    const prm = ambilParam();
    if (!prm.kelas_id && !prm.kelompok_id) throw new Error("Pilih kelas/kelompok dulu.");
    return Api.call("leger.get", prm);
  }
  const jalankan = async (tombol, aksi) => {
    el("lg-pesan").innerHTML = "";
    tombol.disabled = true;
    try { await aksi(await ambil()); }
    catch (err) { el("lg-pesan").innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; }
    tombol.disabled = false;
  };
  el("lg-lihat").addEventListener("click", (e) => jalankan(e.target, (d) => {
    el("lg-hasil").innerHTML = d.baris.length === 0 ? `<div class="empty-state">Belum ada santri aktif.</div>` : legerHtml(d);
  }));
  el("lg-excel").addEventListener("click", (e) => jalankan(e.target, (d) => {
    if (d.baris.length === 0) throw new Error("Belum ada santri aktif.");
    unduhLegerExcel(d);
    el("lg-pesan").innerHTML = `<div class="alert alert-success">Leger ${esc(d.kelas.nama)} diunduh.</div>`;
  }));
  el("lg-cetak").addEventListener("click", (e) => jalankan(e.target, (d) => {
    if (d.baris.length === 0) throw new Error("Belum ada santri aktif.");
    cetakKartuHtml(`<div class="leger-cetak">${legerHtml(d)}</div>`, { landscape: true });
  }));
}

// ======================= PEMBANTU LEMBAGA =======================
// Data lama (tanpa lembaga) dianggap milik lembaga pertama yang sesuai jenisnya (kelas->sekolah, kelompok->tpq).

function lembagaDefaultFE(daftar, jenis) {
  const l = (daftar || []).filter(x => x.jenis === jenis && x.status !== "nonaktif")[0];
  return l ? String(l.id) : "";
}
function lembagaGrup(daftar, item, tipe) {
  return String(item && item.id_lembaga ? item.id_lembaga : lembagaDefaultFE(daftar, tipe === "kelompok" ? "tpq" : "sekolah"));
}

// ======================= JENIS RAPORT: format, teks, peringkat, template Google Docs =======================

const SUMBER_LABEL = { pts: "Nilai — PTS (harian + PTS)", semester: "Nilai — Semester (harian + PTS + PAS)", hafalan: "Hafalan — Raport Halaqah/Tahfidz" };

async function renderJenisRaport(container) {
  if (!Auth.boleh("admin")) { container.innerHTML = ""; return; }
  container.innerHTML = `<div class="card"><div class="loading">Memuat jenis raport...</div></div>`;
  let jenis, lembaga;
  try {
    RefCache.invalidate("jenis_raport");
    const [jr, lem] = await Promise.all([Api.call("jenisraport.list", {}), Ref.lembaga()]);
    jenis = jr.items || []; lembaga = lem.items || [];
  } catch (err) { tampilkanGalat(container, err); return; }
  window.__jenisRaport = jenis;
  container.innerHTML = `
    <div class="card">
      <h3>Jenis Raport &amp; Format</h3>
      <div class="text-muted text-sm mb-1">Setiap jenis raport (mis. PTS SMP, Semester TPQ, Halaqah) punya format, tulisan jabatan, penandatangan, dan opsi peringkatnya sendiri. Format dapat memakai tata letak bawaan aplikasi, atau <b>template Google Docs</b> yang Anda desain bebas seperti di Word &mdash; data tetap terisi otomatis lewat penanda <code>{{NAMA_SANTRI}}</code> dan sejenisnya.</div>
      ${jenis.map(j => `
        <div class="jr-baris">
          <div style="min-width:0;flex:1;">
            <div style="font-weight:700;">${esc(j.nama)} ${j.status === "nonaktif" ? `<span class="chip chip-nonaktif">Nonaktif</span>` : ""}</div>
            <div class="text-muted text-sm">${esc(j.nama_lembaga)} · ${esc(SUMBER_LABEL[j.sumber] || j.sumber)}</div>
            <div class="mt-1">
              <span class="chip ${j.engine === "docs" ? "chip-juz" : "chip-nonaktif"}">${j.engine === "docs" ? "Template Google Docs" : "Format bawaan"}</span>
              ${j.peringkat_kelas !== "tidak" ? `<span class="chip chip-hadir">Peringkat ${j.jenis_lembaga === "tpq" ? "kelompok" : "kelas"}</span>` : ""}
              ${j.peringkat_paralel !== "tidak" ? `<span class="chip chip-hadir">Peringkat paralel</span>` : ""}
            </div>
          </div>
          <div class="flex gap-1" style="flex-shrink:0;"><button class="btn btn-secondary btn-sm" data-ubah="${esc(j.id)}">Ubah</button><button class="btn btn-danger btn-sm" data-hapus="${esc(j.id)}">Hapus</button></div>
        </div>`).join("") || `<div class="empty-state">Belum ada jenis raport.</div>`}
      <button class="btn btn-primary btn-block mt-2" id="jr-tambah">+ Tambah Jenis Raport</button>
    </div>`;
  container.querySelectorAll("[data-ubah]").forEach(b => b.addEventListener("click", () => bukaEditorJenisRaport(jenis.find(j => j.id === b.dataset.ubah), lembaga, container)));
  container.querySelectorAll("[data-hapus]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Hapus jenis raport ini? Data nilai/hafalan tidak ikut terhapus.")) return;
    try { await Api.call("jenisraport.hapus", { id: b.dataset.hapus }); renderJenisRaport(container); } catch (err) { alert(err.message); }
  }));
  document.getElementById("jr-tambah").addEventListener("click", () => bukaEditorJenisRaport(null, lembaga, container));
}

const SKALA_BAWAAN = [{ min: 90, label: "A", ket: "Sangat Baik" }, { min: 80, label: "B", ket: "Baik" }, { min: 70, label: "C", ket: "Cukup" }, { min: 0, label: "D", ket: "Kurang" }];
const SKALA_ARAB = [{ min: 90, label: "ممتاز", ket: "Mumtaz" }, { min: 80, label: "جيد جدا", ket: "Jayyid Jiddan" }, { min: 70, label: "جيد", ket: "Jayyid" }, { min: 0, label: "مقبول", ket: "Maqbul" }];

function bacaJsonFE(teks, cadangan) {
  try { const v = JSON.parse(teks); return (v === null || v === undefined) ? cadangan : v; } catch (e) { return cadangan; }
}

function bukaEditorJenisRaport(jr, lembaga, container) {
  const baru = !jr;
  const d = jr || { nama: "", id_lembaga: (lembaga[0] || {}).id, sumber: "semester", judul: "", engine: "bawaan", template_url: "", peringkat_kelas: "ya", peringkat_paralel: "ya",
    jabatan_pengasuh: "", jabatan_kepsek: "", jabatan_wali: "", nama_pengasuh: "", nama_kepsek: "", nip_kepsek: "", status: "aktif",
    peringkat_kelas_maks: 0, peringkat_paralel_maks: 0, skala_predikat: "", tanggal_cetak_mode: "otomatis", tanggal_cetak: "", terbilang: "ringkasan", tampil_bab: "ya", tampil_kehadiran: "ya", tampil_catatan: "ya", bagian_tambahan: "" };
  const v = (k) => esc(d[k] === undefined || d[k] === null ? "" : d[k]);
  const teks = (id, label, nilai, ket) => `<div class="field"><label>${label}</label><input type="text" id="${id}" value="${nilai}" maxlength="160" placeholder="${esc(ket || "")}"></div>`;

  // ---- status lokal: skala predikat & pohon bagian tambahan
  let skala = (() => { const s = bacaJsonFE(d.skala_predikat, []); return (Array.isArray(s) && s.length ? s : SKALA_BAWAAN).map(x => Object.assign({}, x)); })();
  const salin = (n, level) => {
    const h = { judul: n.judul || "", anak: (n.anak || []).map(a => salin(a, level + 1)) };
    if (level === 1) { h.tipe = n.tipe || "kategori"; h._pil = (n.pilihan && n.pilihan.length ? n.pilihan : ["Baik", "Cukup", "Kurang"]).join(", "); }
    return h;
  };
  let bagian = (() => { const b = bacaJsonFE(d.bagian_tambahan, []); return Array.isArray(b) ? b.map(x => salin(x, 1)) : []; })();
  const petaKeServer = (n, level) => {
    const h = { judul: n.judul };
    if (level === 1) { h.tipe = n.tipe; if (n.tipe === "kategori") h.pilihan = String(n._pil || "").split(",").map(s => s.trim()).filter(Boolean); }
    if (n.anak && n.anak.length) h.anak = n.anak.map(a => petaKeServer(a, level + 1));
    return h;
  };
  const simpul = (jalur) => { const p = String(jalur).split(".").map(Number); let n = bagian[p[0]]; for (let i = 1; i < p.length && n; i++) n = (n.anak || [])[p[i]]; return { p, n }; };

  const m = bukaModal(`<span>🧾</span> ${baru ? "Tambah" : "Ubah"} Jenis Raport`, `
    <form id="jr-form" onsubmit="return false;">
      ${teks("jr-nama", "Nama jenis raport", v("nama"), "mis. Raport PTS SMP")}
      <div class="grid-2">
        <div class="field"><label>Lembaga</label><select id="jr-lembaga">${lembaga.filter(l => l.status !== "nonaktif").map(l => `<option value="${esc(l.id)}" ${String(d.id_lembaga) === String(l.id) ? "selected" : ""}>${esc(l.nama)}</option>`).join("")}</select></div>
        <div class="field"><label>Isi raport (sumber data)</label><select id="jr-sumber">${Object.keys(SUMBER_LABEL).map(k => `<option value="${k}" ${d.sumber === k ? "selected" : ""}>${esc(SUMBER_LABEL[k])}</option>`).join("")}</select></div>
      </div>
      ${teks("jr-judul", "Judul di raport", v("judul"), "kosongkan = judul bawaan")}
      <div class="grid-2">
        <div class="field"><label>Tanggal cetak raport</label><select id="jr-tgl-mode"><option value="otomatis" ${d.tanggal_cetak_mode !== "tetap" ? "selected" : ""}>Otomatis (hari saat dicetak)</option><option value="tetap" ${d.tanggal_cetak_mode === "tetap" ? "selected" : ""}>Tetap (tanggal pembagian raport)</option></select></div>
        <div class="field"><label>Tanggal tetap</label><input type="date" id="jr-tgl" value="${v("tanggal_cetak")}"></div>
      </div>
      <h4 class="jr-sub">Tulisan jabatan di tanda tangan (kiri → kanan)</h4>
      ${teks("jr-jab-pengasuh", "1. Jabatan pertama", v("jabatan_pengasuh"), "Pengasuh Pondok Pesantren")}
      ${teks("jr-jab-kepsek", "2. Jabatan kedua", v("jabatan_kepsek"), "Kepala Sekolah / Kepala TPQ")}
      ${teks("jr-jab-wali", "3. Jabatan ketiga", v("jabatan_wali"), "Wali Murid")}
      <h4 class="jr-sub">Nama penandatangan khusus raport ini</h4>
      <div class="text-muted text-sm mb-1">Nama otomatis diambil dari akun (pengasuh: Pengaturan Raport; kepala: Data Master &rarr; Lembaga; wali kelas: penugasan akun; wali murid: data wali santri). Isi di bawah hanya bila ingin menggantinya khusus untuk raport ini.</div>
      ${teks("jr-nama-pengasuh", "Nama Pengasuh (manual)", v("nama_pengasuh"), "")}
      <div class="grid-2">${teks("jr-nama-kepsek", "Nama Kepala (manual)", v("nama_kepsek"), "")}${teks("jr-nip-kepsek", "NIP/NIY Kepala (manual)", v("nip_kepsek"), "")}</div>
      <h4 class="jr-sub">Peringkat yang ditampilkan</h4>
      <label class="jr-cek"><input type="checkbox" id="jr-p-kelas" ${d.peringkat_kelas !== "tidak" ? "checked" : ""}> Peringkat kelas / kelompok</label>
      <label class="jr-cek"><input type="checkbox" id="jr-p-paralel" ${d.peringkat_paralel !== "tidak" ? "checked" : ""}> Peringkat paralel (antar kelas pada tingkat yang sama &mdash; isi "Tingkat" di Data Master)</label>
      <div class="grid-2">
        <div class="field"><label>Peringkat kelas: tampilkan hanya sampai ke-</label><input type="number" id="jr-maks-kelas" min="0" max="999" value="${esc(d.peringkat_kelas_maks || 0)}"><div class="text-muted text-sm">0 = semua. Mis. 3 = hanya peringkat 1, 2, 3 yang tercetak.</div></div>
        <div class="field"><label>Peringkat paralel: tampilkan hanya sampai ke-</label><input type="number" id="jr-maks-paralel" min="0" max="999" value="${esc(d.peringkat_paralel_maks || 0)}"><div class="text-muted text-sm">0 = semua.</div></div>
      </div>
      <h4 class="jr-sub">Predikat nilai (khusus raport ini)</h4>
      <div class="text-muted text-sm mb-1">Ketik sendiri isi predikatnya: huruf (A, B, C), kata, atau <b>istilah Arab</b> (mis. ممتاز). Nilai ≥ batas mendapat predikat itu. Tingkat terendah harus berbatas 0.</div>
      <div id="jr-skala"></div>
      <div class="flex gap-1" style="flex-wrap:wrap;"><button type="button" class="btn btn-secondary btn-sm" id="jr-skala-tambah">+ Tingkat</button><button type="button" class="btn btn-secondary btn-sm" id="jr-skala-bawaan">Skala A–D</button><button type="button" class="btn btn-secondary btn-sm" id="jr-skala-arab">Contoh istilah Arab</button></div>
      <h4 class="jr-sub">Isi tambahan pada raport</h4>
      <div class="field"><label>Terbilang otomatis (nilai ditulis dengan kata)</label><select id="jr-terbilang"><option value="tidak" ${d.terbilang === "tidak" ? "selected" : ""}>Tidak ditampilkan</option><option value="ringkasan" ${d.terbilang !== "tidak" && d.terbilang !== "semua" ? "selected" : ""}>Jumlah &amp; rata-rata saja</option><option value="semua" ${d.terbilang === "semua" ? "selected" : ""}>Tiap mata pelajaran + ringkasan</option></select></div>
      <label class="jr-cek"><input type="checkbox" id="jr-bab" ${d.tampil_bab !== "tidak" ? "checked" : ""}> Rincian bab per mapel (nilai tiap bab, jumlah, rata-rata, catatan)</label>
      <label class="jr-cek"><input type="checkbox" id="jr-kehadiran" ${d.tampil_kehadiran !== "tidak" ? "checked" : ""}> Kehadiran (otomatis atau diisi manual oleh wali kelas/admin)</label>
      <label class="jr-cek"><input type="checkbox" id="jr-catatan" ${d.tampil_catatan !== "tidak" ? "checked" : ""}> Catatan wali kelas</label>
      <h4 class="jr-sub">Bagian tambahan (opsional)</h4>
      <div class="text-muted text-sm mb-1">Tambahkan bagian sendiri, mis. <b>Sikap dan Kepribadian</b> &rarr; sub <b>Sopan Santun</b> &rarr; uraian <b>Sikap terhadap guru</b>. Penilaian tiap bagian: <b>kategori</b> (mis. Baik/Cukup/Kurang), <b>centang</b>, atau <b>nilai</b>. Diisi wali kelas/admin di menu <b>Isi Raport</b>.</div>
      <div id="jr-tree"></div>
      <button type="button" class="btn btn-secondary btn-sm" id="jr-tree-tambah">+ Tambah Bagian</button>
      <h4 class="jr-sub">Format tampilan raport</h4>
      <div class="field"><select id="jr-engine"><option value="bawaan" ${d.engine !== "docs" ? "selected" : ""}>Format bawaan aplikasi</option><option value="docs" ${d.engine === "docs" ? "selected" : ""}>Template Google Docs (bisa diedit seperti Word)</option></select></div>
      <div id="jr-docs-wrap">
        <div class="field"><label>Tautan template Google Docs</label><input type="text" id="jr-url" value="${v("template_url")}" placeholder="https://docs.google.com/document/d/…"></div>
        <div class="flex gap-1" style="flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary btn-sm" id="jr-buat" ${baru ? "disabled" : ""}>Buat template dari format bawaan</button>
          <button type="button" class="btn btn-secondary btn-sm" id="jr-buka">Buka di Google Docs</button>
          <button type="button" class="btn btn-secondary btn-sm" id="jr-pindai">Periksa penanda</button>
          <button type="button" class="btn btn-secondary btn-sm" id="jr-katalog">Daftar kode penanda</button>
        </div>
        ${baru ? `<div class="text-muted text-sm mt-1">Simpan dulu jenis raport ini, lalu buka lagi untuk membuat template dari format bawaan.</div>` : ""}
        <div class="text-muted text-sm mt-1">Cara: <b>1)</b> buat template → <b>2)</b> edit tampilan di Google Docs tanpa mengubah tulisan di dalam <code>{{ }}</code> → <b>3)</b> kembali ke sini, pilih "Template Google Docs", <b>Periksa penanda</b>, lalu Simpan. Klik <b>Daftar kode penanda</b> untuk melihat semua kode (tiap butir punya kode sendiri) dan klik sebuah kode untuk menyalinnya. Bila template bermasalah, raport otomatis memakai format bawaan.</div>
        <div id="jr-info" class="mt-1"></div>
      </div>
      <div class="field mt-1"><label>Status</label><select id="jr-status"><option value="aktif" ${d.status !== "nonaktif" ? "selected" : ""}>Aktif (dapat dipakai)</option><option value="nonaktif" ${d.status === "nonaktif" ? "selected" : ""}>Nonaktif (disembunyikan)</option></select></div>
      <div id="jr-pesan"></div>
    </form>`,
    `<button type="button" class="btn btn-secondary" data-tutup="1">Batal</button><button type="button" class="btn btn-primary" id="jr-simpan">Simpan</button>`);
  const el = (id) => m.overlay.querySelector("#" + id);
  const pesan = (ok, t) => { el("jr-pesan").innerHTML = `<div class="alert ${ok ? "alert-success" : "alert-error"}">${esc(t)}</div>`; };
  const info = (html) => { el("jr-info").innerHTML = html; };
  const atur = () => { el("jr-docs-wrap").style.display = el("jr-engine").value === "docs" ? "block" : "none"; };
  el("jr-engine").addEventListener("change", atur); atur();

  // ---- editor skala predikat
  const gambarSkala = () => {
    el("jr-skala").innerHTML = skala.map((s, i) => `
      <div class="komp-baris">
        <input type="number" data-i="${i}" data-f="min" value="${esc(s.min)}" min="0" max="100" style="max-width:76px;" aria-label="Batas nilai">
        <input type="text" data-i="${i}" data-f="label" value="${esc(s.label)}" maxlength="30" dir="auto" class="${/[\u0600-\u06FF]/.test(String(s.label)) ? "arab" : ""}" placeholder="Predikat (A / ممتاز)" style="max-width:150px;">
        <input type="text" data-i="${i}" data-f="ket" value="${esc(s.ket || "")}" maxlength="60" placeholder="Keterangan (opsional)">
        <button type="button" class="btn btn-danger btn-sm" data-aksi="hapus" data-i="${i}">✕</button>
      </div>`).join("");
  };
  gambarSkala();
  el("jr-skala").addEventListener("input", (e) => { const t = e.target; if (t && t.dataset && t.dataset.f !== undefined && skala[Number(t.dataset.i)]) skala[Number(t.dataset.i)][t.dataset.f] = t.value; });
  el("jr-skala").addEventListener("click", (e) => { const t = e.target && e.target.closest ? e.target.closest("[data-aksi]") : null; if (t && t.dataset.aksi === "hapus") { skala.splice(Number(t.dataset.i), 1); gambarSkala(); } });
  el("jr-skala-tambah").addEventListener("click", () => { skala.push({ min: 0, label: "", ket: "" }); gambarSkala(); });
  el("jr-skala-bawaan").addEventListener("click", () => { skala = SKALA_BAWAAN.map(x => Object.assign({}, x)); gambarSkala(); });
  el("jr-skala-arab").addEventListener("click", () => { skala = SKALA_ARAB.map(x => Object.assign({}, x)); gambarSkala(); });

  // ---- editor bagian tambahan (bagian > sub > uraian)
  const gambarPohon = () => {
    const tipeOpsi = (t) => [["kategori", "Kategori (mis. Baik/Cukup/Kurang)"], ["centang", "Centang"], ["nilai", "Nilai 0–100"]].map(([k, l]) => `<option value="${k}" ${t === k ? "selected" : ""}>${l}</option>`).join("");
    el("jr-tree").innerHTML = bagian.length === 0 ? `<div class="text-muted text-sm">Belum ada bagian tambahan.</div>` : bagian.map((b, i) => `
      <div class="tb-bagian">
        <div class="tb-baris"><input type="text" data-p="${i}" data-f="judul" value="${esc(b.judul)}" placeholder="Judul bagian (mis. Sikap dan Kepribadian)" maxlength="80">
          <select data-p="${i}" data-f="tipe" aria-label="Bentuk penilaian">${tipeOpsi(b.tipe)}</select>
          <button type="button" class="btn btn-danger btn-sm" data-aksi="hapus" data-p="${i}">✕</button></div>
        ${b.tipe === "kategori" ? `<input type="text" data-p="${i}" data-f="_pil" value="${esc(b._pil)}" placeholder="Pilihan dipisah koma (mis. Baik, Cukup, Kurang)" class="tb-pil">` : ""}
        ${(b.anak || []).map((sb, j) => `
          <div class="tb-sub"><div class="tb-baris tb-l2"><input type="text" data-p="${i}.${j}" data-f="judul" value="${esc(sb.judul)}" placeholder="Sub bagian / uraian (mis. Sopan Santun)" maxlength="80">
            <button type="button" class="btn btn-secondary btn-sm" data-aksi="tambah" data-p="${i}.${j}">+ Uraian</button>
            <button type="button" class="btn btn-danger btn-sm" data-aksi="hapus" data-p="${i}.${j}">✕</button></div>
            ${(sb.anak || []).map((u, k) => `<div class="tb-baris tb-l3"><input type="text" data-p="${i}.${j}.${k}" data-f="judul" value="${esc(u.judul)}" placeholder="Uraian (mis. Sikap terhadap guru)" maxlength="80"><button type="button" class="btn btn-danger btn-sm" data-aksi="hapus" data-p="${i}.${j}.${k}">✕</button></div>`).join("")}
          </div>`).join("")}
        <button type="button" class="btn btn-secondary btn-sm" data-aksi="tambah" data-p="${i}">+ Sub bagian / uraian</button>
      </div>`).join("");
  };
  gambarPohon();
  el("jr-tree").addEventListener("input", (e) => {
    const t = e.target; if (!t || !t.dataset || t.dataset.f === undefined) return;
    const { n } = simpul(t.dataset.p); if (!n) return;
    n[t.dataset.f] = t.value;
    if (t.dataset.f === "tipe") gambarPohon();
  });
  el("jr-tree").addEventListener("click", (e) => {
    const t = e.target && e.target.closest ? e.target.closest("[data-aksi]") : null; if (!t) return;
    const { p, n } = simpul(t.dataset.p); if (!n) return;
    if (t.dataset.aksi === "tambah") { (n.anak = n.anak || []).push({ judul: "", anak: [] }); }
    else if (t.dataset.aksi === "hapus") { if (p.length === 1) bagian.splice(p[0], 1); else { const induk = simpul(p.slice(0, -1).join(".")).n; induk.anak.splice(p[p.length - 1], 1); } }
    gambarPohon();
  });
  el("jr-tree-tambah").addEventListener("click", () => { bagian.push({ judul: "", tipe: "kategori", _pil: "Baik, Cukup, Kurang", anak: [] }); gambarPohon(); });

  // ---- template Google Docs
  el("jr-buka").addEventListener("click", () => {
    const u = el("jr-url").value.trim();
    if (!u) { info(`<div class="alert alert-error">Belum ada tautan template.</div>`); return; }
    window.open(u, "_blank", "noopener");
  });
  const buat = el("jr-buat");
  if (buat) buat.addEventListener("click", async () => {
    buat.disabled = true; info(`<div class="loading">Membuat template di Google Docs...</div>`);
    try {
      const h = await Api.call("jenisraport.buatTemplate", { id: jr.id });
      el("jr-url").value = h.url; el("jr-engine").value = "docs"; atur();
      info(`<div class="alert alert-success">Template dibuat sesuai pengaturan raport ini (komponen, bab, kehadiran, bagian tambahan). <a href="${esc(h.url)}" target="_blank" rel="noopener"><b>Buka &amp; edit di Google Docs</b></a>. Setelah selesai mengedit, klik Simpan.</div>`);
    } catch (err) { info(`<div class="alert alert-error">${esc(err.message)}</div>`); }
    buat.disabled = false;
  });
  el("jr-pindai").addEventListener("click", async () => {
    info(`<div class="loading">Memeriksa dokumen...</div>`);
    try {
      const h = await Api.call("jenisraport.pindai", { template_url: el("jr-url").value.trim(), sumber: el("jr-sumber").value, id: jr ? jr.id : undefined });
      info(`<div class="alert ${h.tidak_dikenal.length ? "alert-error" : "alert-success"}">
        <b>${esc(h.judul)}</b><br>${h.ditemukan.length} penanda dikenali${h.tidak_dikenal.length ? `, <b>${h.tidak_dikenal.length} tidak dikenal</b> (akan dikosongkan): ${h.tidak_dikenal.map(x => `<code>${esc(x)}</code>`).join(" ")}` : " — semua penanda valid"}.
        ${h.blok_hilang.length ? `<br>Perhatian: tabel data belum memakai blok ${h.blok_hilang.map(x => `<code>{{#${esc(x)}}}</code>`).join(", ")}.` : ""}</div>`);
    } catch (err) { info(`<div class="alert alert-error">${esc(err.message)}</div>`); }
  });
  el("jr-katalog").addEventListener("click", async () => {
    try {
      const k = await Api.call("jenisraport.katalog", { sumber: el("jr-sumber").value, id: jr ? jr.id : undefined });
      const blok = Object.keys(k.blok).map(b => `<div class="kat-grup"><b>Tabel berulang ${b}</b> — letakkan <code data-salin="{{#${b}}}">{{#${b}}}</code> di awal baris templat, kolom:<div>${k.blok[b].map(c => `<code data-salin="{{${b}.${c}}}">{{${b}.${c}}}</code>`).join(" ")}</div></div>`).join("");
      const grup = (k.grup || []).map(g => `<div class="kat-grup"><b>${esc(g.judul)}</b><div>${g.isi.map(x => `<code data-salin="{{${x}}}">{{${x}}}</code>`).join(" ")}</div></div>`).join("");
      info(`<div class="katalog-penanda"><div class="text-muted text-sm">Klik sebuah kode untuk menyalinnya, lalu tempel di Google Docs.</div>${grup}${blok}
        <div class="kat-grup text-muted text-sm">Pengubah: <code>{{NAMA_SANTRI | kapital}}</code> <code>| kecil</code> <code>| judul</code> <code>| bawaan:-</code> <code>| tanggal</code> <code>| ribuan</code> <code>| terbilang</code>. Baris tabel/paragraf yang memuat penanda yang dimatikan (peringkat, kehadiran, catatan) otomatis dihapus. <code>{{?KUNCI}}</code> di awal baris/paragraf menyembunyikannya bila nilainya kosong.</div></div>`);
    } catch (err) { info(`<div class="alert alert-error">${esc(err.message)}</div>`); }
  });
  el("jr-info").addEventListener("click", async (e) => {
    const t = e.target && e.target.closest ? e.target.closest("[data-salin]") : null; if (!t) return;
    try { await navigator.clipboard.writeText(t.dataset.salin); t.classList.add("tersalin"); } catch (x) { window.prompt && window.prompt("Salin kode ini:", t.dataset.salin); }
  });

  el("jr-simpan").addEventListener("click", async (e) => {
    const data = {
      id: jr ? jr.id : undefined, nama: el("jr-nama").value, id_lembaga: el("jr-lembaga").value, sumber: el("jr-sumber").value, judul: el("jr-judul").value,
      tanggal_cetak_mode: el("jr-tgl-mode").value, tanggal_cetak: el("jr-tgl").value,
      jabatan_pengasuh: el("jr-jab-pengasuh").value, jabatan_kepsek: el("jr-jab-kepsek").value, jabatan_wali: el("jr-jab-wali").value,
      nama_pengasuh: el("jr-nama-pengasuh").value, nama_kepsek: el("jr-nama-kepsek").value, nip_kepsek: el("jr-nip-kepsek").value,
      peringkat_kelas: el("jr-p-kelas").checked ? "ya" : "tidak", peringkat_paralel: el("jr-p-paralel").checked ? "ya" : "tidak",
      peringkat_kelas_maks: el("jr-maks-kelas").value, peringkat_paralel_maks: el("jr-maks-paralel").value,
      skala_predikat: skala.filter(s => String(s.label).trim() !== "").map(s => ({ min: Number(s.min), label: s.label, ket: s.ket })),
      terbilang: el("jr-terbilang").value, tampil_bab: el("jr-bab").checked ? "ya" : "tidak", tampil_kehadiran: el("jr-kehadiran").checked ? "ya" : "tidak", tampil_catatan: el("jr-catatan").checked ? "ya" : "tidak",
      bagian_tambahan: bagian.map(b => petaKeServer(b, 1)),
      engine: el("jr-engine").value, template_url: el("jr-url").value.trim(), status: el("jr-status").value
    };
    e.target.disabled = true;
    try { await Api.call("jenisraport.simpan", { data }); RefCache.invalidate("jenis_raport"); m.tutup(); renderJenisRaport(container); }
    catch (err) { pesan(false, err.message); e.target.disabled = false; }
  });
}

// ======================= ISI RAPORT (wali kelas / admin): kehadiran, catatan, bagian tambahan =======================

Router.add("isiraport", async (root) => {
  root.innerHTML = Shell("isiraport", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const profil = Auth.getProfil();
  const guru = profil.peran === "guru_mapel" || profil.peran === "pengajar_tpq";
  const csv = (s) => String(s || "").split(",").map(x => x.trim()).filter(Boolean);
  const el = (id) => document.getElementById(id);
  try {
    const [kelasRes, kelompokRes, lembagaRes, jenisRes, santriRes, peng] = await Promise.all([Ref.kelas(), Ref.kelompok(), Ref.lembaga(), Ref.jenisRaport(), Ref.santriSemua(), Ref.pengaturan()]);
    const lembaga = lembagaRes.items || [];
    const jenisList = (jenisRes.items || []).filter(j => j.status !== "nonaktif").filter(j => !guru || (j.jenis_lembaga === "tpq" ? csv(profil.kelompok_diampu).length > 0 : csv(profil.kelas_diampu).length > 0));
    const santriAktif = (santriRes.items || []).filter(s => s.status === "aktif");
    if (jenisList.length === 0) { main.innerHTML = `<div class="card"><div class="empty-state">Belum ada jenis raport yang dapat Anda isi.</div></div>`; return; }
    main.innerHTML = `
      <div class="card">
        <h3>Isi Raport</h3>
        <div class="text-muted text-sm mb-1">Isi <b>kehadiran</b> (otomatis dari presensi atau manual), <b>catatan wali kelas</b>, dan <b>bagian tambahan</b> (mis. sikap &amp; kepribadian) per santri. Hanya wali kelas santri tersebut (atau pengajar kelompok) dan admin yang dapat menyimpan.</div>
        <div class="field"><label>Jenis Raport</label><select id="ir-jenis">${jenisList.map(j => `<option value="${esc(j.id)}">${esc(j.nama)} (${esc(j.nama_lembaga)})</option>`).join("")}</select></div>
        <div class="grid-2"><div class="field"><label id="ir-label-grup">Kelas</label><select id="ir-kelas"></select></div><div class="field"><label>Santri</label><select id="ir-santri"></select></div></div>
        <div class="grid-2">
          <div class="field"><label>Semester</label><select id="ir-semester"><option ${peng.semester_aktif === "Ganjil" ? "selected" : ""}>Ganjil</option><option ${peng.semester_aktif === "Genap" ? "selected" : ""}>Genap</option></select></div>
          <div class="field"><label>Tahun Ajaran</label><input type="text" id="ir-tahun" value="${esc(peng.tahun_ajaran)}"></div>
        </div>
        <button class="btn btn-primary btn-block" id="ir-muat">Muat Isian</button>
      </div>
      <div id="ir-form"></div>`;
    const jenisTerpilih = () => jenisList.find(j => j.id === el("ir-jenis").value) || jenisList[0];
    function isiSantri() {
      const tpq = jenisTerpilih().jenis_lembaga === "tpq", bidang = tpq ? "id_kelompok" : "id_kelas";
      el("ir-santri").innerHTML = santriAktif.filter(s => String(s[bidang]) === String(el("ir-kelas").value)).sort((a, b) => String(a.nama).localeCompare(String(b.nama))).map(s => `<option value="${esc(s.id)}">${esc(s.nama)}</option>`).join("");
    }
    function isiGrup() {
      const j = jenisTerpilih(), tpq = j.jenis_lembaga === "tpq";
      el("ir-label-grup").textContent = tpq ? "Kelompok" : "Kelas";
      const diampu = csv(tpq ? profil.kelompok_diampu : profil.kelas_diampu);
      const daftar = (tpq ? (kelompokRes.items || []) : (kelasRes.items || [])).filter(g => lembagaGrup(lembaga, g, tpq ? "kelompok" : "kelas") === String(j.id_lembaga) && (!guru || diampu.indexOf(g.id) !== -1));
      el("ir-kelas").innerHTML = daftar.length === 0 ? `<option value="">(belum ada)</option>` : daftar.map(g => `<option value="${esc(g.id)}">${esc(tpq ? g.nama_kelompok : g.nama_kelas)}</option>`).join("");
      isiSantri();
    }
    el("ir-jenis").addEventListener("change", () => { isiGrup(); el("ir-form").innerHTML = ""; });
    el("ir-kelas").addEventListener("change", isiSantri);
    isiGrup();

    let st = null, butir = [];
    const nilaiTampil = (b) => {
      const v = st.tambahan[b.kunci] === undefined ? "" : st.tambahan[b.kunci];
      if (b.tipe === "kategori") return `<select data-k="${esc(b.kunci)}"><option value="">-</option>${b.pilihan.map(p => `<option ${v === p ? "selected" : ""}>${esc(p)}</option>`).join("")}</select>`;
      if (b.tipe === "centang") return `<label class="ir-cek"><input type="checkbox" data-k="${esc(b.kunci)}" ${v === "ya" ? "checked" : ""}> Ya</label>`;
      return `<input type="number" min="0" max="100" step="0.1" data-k="${esc(b.kunci)}" value="${esc(v)}" style="max-width:100px;">`;
    };
    function gambarForm(boleh) {
      const oto = st.otomatis;
      let bagian = "", sub = "", cur = "";
      butir.forEach(b => {
        if (b.bagian_kode !== cur) { cur = b.bagian_kode; sub = ""; bagian += `<h4 class="jr-sub">${esc(b.bagian)}${b.tipe === "kategori" ? ` <span class="text-muted text-sm">(${b.pilihan.map(esc).join(" / ")})</span>` : ""}</h4>`; }
        if (b.sub && b.sub !== sub) { sub = b.sub; bagian += `<div class="ir-sub">${esc(b.sub)}</div>`; }
        bagian += `<div class="ir-butir"><span>${esc(b.uraian)}</span>${nilaiTampil(b)}</div>`;
      });
      el("ir-form").innerHTML = `
        ${boleh ? "" : `<div class="alert alert-error">Anda hanya dapat melihat. Yang boleh mengisi: wali kelas santri ini (atau pengajar kelompok) dan admin.</div>`}
        <div class="card"><h3>Kehadiran</h3>
          <div class="field"><label>Sumber data kehadiran</label><select data-f="mode" ${boleh ? "" : "disabled"}><option value="otomatis" ${st.mode === "otomatis" ? "selected" : ""}>Otomatis dari presensi</option><option value="manual" ${st.mode === "manual" ? "selected" : ""}>Isi manual</option></select></div>
          ${st.mode === "otomatis" ? `<div class="text-sm">Otomatis: Hadir <b>${oto.hadir}</b> · Sakit <b>${oto.sakit}</b> · Izin <b>${oto.izin}</b> · Alpa <b>${oto.alpa}</b> hari (periode semester ini).</div>` : `
          <div class="grid-2" style="grid-template-columns:repeat(2,1fr);">${[["hadir", "Hadir"], ["sakit", "Sakit"], ["izin", "Izin"], ["alpa", "Alpa"]].map(([k, l]) => `<div class="field"><label>${l} (hari)</label><input type="number" min="0" max="366" data-f="${k}" value="${esc(st[k])}" ${boleh ? "" : "disabled"}></div>`).join("")}</div>
          <div class="text-muted text-sm">Angka otomatis sebagai pembanding: Hadir ${oto.hadir}, Sakit ${oto.sakit}, Izin ${oto.izin}, Alpa ${oto.alpa}.</div>`}
        </div>
        <div class="card"><h3>Catatan Wali Kelas</h3><div class="field"><textarea rows="4" maxlength="1000" data-f="catatan" placeholder="Catatan hasil keseluruhan penilaian santri" ${boleh ? "" : "disabled"}>${esc(st.catatan)}</textarea></div></div>
        ${butir.length ? `<div class="card"><h3>Bagian Tambahan</h3>${bagian}</div>` : ""}
        ${boleh ? `<button class="btn btn-primary btn-block" id="ir-simpan">Simpan</button><div id="ir-pesan" class="mt-1"></div>` : ""}`;
      const btn = el("ir-simpan");
      if (btn) btn.addEventListener("click", simpan);
    }
    async function simpan() {
      const btn = el("ir-simpan"), pesan = el("ir-pesan");
      btn.disabled = true; pesan.innerHTML = "";
      try {
        await Api.call("isiraport.simpan", { id_santri: el("ir-santri").value, jenis_raport_id: el("ir-jenis").value, semester: el("ir-semester").value, tahun_ajaran: el("ir-tahun").value.trim(),
          kehadiran_mode: st.mode, hadir: st.hadir, sakit: st.sakit, izin: st.izin, alpa: st.alpa, catatan_walas: st.catatan, tambahan: st.tambahan });
        pesan.innerHTML = `<div class="alert alert-success">Tersimpan. Isian ini langsung tampil di raport.</div>`;
      } catch (err) { pesan.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; }
      btn.disabled = false;
    }
    el("ir-form").addEventListener("input", (e) => {
      const t = e.target; if (!t || !t.dataset) return;
      if (t.dataset.k !== undefined) st.tambahan[t.dataset.k] = (t.type === "checkbox") ? (t.checked ? "ya" : "tidak") : t.value;
      else if (t.dataset.f !== undefined && t.dataset.f !== "mode") st[t.dataset.f] = t.value;
    });
    el("ir-form").addEventListener("change", (e) => {
      const t = e.target; if (!t || !t.dataset) return;
      if (t.dataset.f === "mode") { st.mode = t.value; gambarForm(st.boleh); }
      else if (t.dataset.k !== undefined) st.tambahan[t.dataset.k] = (t.type === "checkbox") ? (t.checked ? "ya" : "tidak") : t.value;
    });
    el("ir-muat").addEventListener("click", async () => {
      const idSantri = el("ir-santri").value;
      if (!idSantri) { el("ir-form").innerHTML = `<div class="alert alert-error">Pilih santri dulu.</div>`; return; }
      el("ir-form").innerHTML = `<div class="loading">Memuat isian...</div>`;
      try {
        const d = await Api.call("isiraport.get", { id_santri: idSantri, jenis_raport_id: el("ir-jenis").value, semester: el("ir-semester").value, tahun_ajaran: el("ir-tahun").value.trim() });
        butir = d.butir || [];
        st = { mode: d.kehadiran.mode, hadir: d.kehadiran.hadir, sakit: d.kehadiran.sakit, izin: d.kehadiran.izin, alpa: d.kehadiran.alpa, otomatis: d.kehadiran.otomatis, catatan: d.catatan_walas || "", tambahan: {}, boleh: d.boleh_edit };
        butir.forEach(b => { st.tambahan[b.kunci] = b.nilai; });
        gambarForm(d.boleh_edit);
      } catch (err) { tampilkanGalat(el("ir-form"), err); }
    });
  } catch (err) { tampilkanGalat(main, err); }
});

