// Fitur lanjutan: info publik di halaman login, pengumuman, kalender, notifikasi wali,
// nilai, raport, pelanggaran, Jumat Amal, dan pengaturan akademik.

const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function fmtTanggal(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ""));
  return m ? `${parseInt(m[3], 10)} ${BULAN_SINGKAT[parseInt(m[2], 10) - 1]} ${m[1]}` : esc(s);
}
function rupiah(n) { return "Rp " + Number(n || 0).toLocaleString("id-ID"); }
function ringkas(teks, n) { const t = String(teks || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n) + "…" : t; }
function warnaKategori(k) { return ({ Libur: "#EF4444", Ujian: "#F59E0B", Kegiatan: "#059669", Rapat: "#3B82F6", Lainnya: "#64748B" })[k] || "#64748B"; }
const KATEGORI_AGENDA = ["Kegiatan", "Libur", "Ujian", "Rapat", "Lainnya"];

function tampilToast(judul, isi) {
  let w = document.getElementById("toast-wrap");
  if (!w) { w = document.createElement("div"); w.id = "toast-wrap"; document.body.appendChild(w); }
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<b>${esc(judul)}</b><div>${esc(isi)}</div>`;
  t.onclick = () => { Router.go("notifikasi"); t.remove(); };
  w.appendChild(t);
  setTimeout(() => t.remove(), 7000);
}

// ======================= PENGUMUMAN (kartu interaktif: ketuk untuk membuka) =======================

function renderPengumumanList(items) {
  if (!items || items.length === 0) return `<div class="empty-state">Belum ada pengumuman.</div>`;
  return items.map(p => `
    <div class="pgm" data-id="${esc(p.id)}" data-gambar="${p.ada_gambar ? 1 : 0}">
      <div class="pgm-head">
        <div><span class="chip chip-juz">${esc(p.kategori || "Kegiatan")}</span> <span class="text-muted text-sm">${fmtTanggal(p.tanggal)}</span></div>
        <div class="pgm-judul">${esc(p.judul)}</div>
        <div class="pgm-ringkas">${esc(ringkas(p.isi, 110))} <span style="color:var(--azure);">Selengkapnya</span></div>
      </div>
      <div class="pgm-detail" hidden><div class="pgm-gambar"></div><div>${esc(p.isi).replace(/\n/g, "<br>")}</div></div>
    </div>`).join("");
}

function pasangInteraksiPengumuman(root) {
  root.querySelectorAll(".pgm-head").forEach(h => {
    h.addEventListener("click", async () => {
      const kotak = h.parentElement, det = kotak.querySelector(".pgm-detail");
      const buka = det.hidden;
      det.hidden = !buka;
      kotak.classList.toggle("open", buka);
      h.querySelector(".pgm-ringkas").style.display = buka ? "none" : "";
      if (buka && kotak.dataset.gambar === "1" && !kotak.dataset.muat) {
        kotak.dataset.muat = "1";
        try {
          const r = await Api.call("publik.gambar", { id: kotak.dataset.id });
          if (r.data_url) kotak.querySelector(".pgm-gambar").innerHTML = `<img class="pgm-img" alt="Gambar pengumuman" src="${r.data_url}">`;
        } catch (e) { /* gambar opsional */ }
      }
    });
  });
}

// ======================= KALENDER (bisa dilihat semua; admin bisa mengelola agenda) =======================

async function renderKalender(container, opsi) {
  opsi = opsi || {};
  const st = { bulan: bulanIniStr(), hari: null, items: [], edit: null };
  container.innerHTML = `
    <div class="card">
      <div class="kal-nav"><button type="button" data-nav="-1" aria-label="Bulan sebelumnya">‹</button><b id="kal-judul"></b><button type="button" data-nav="1" aria-label="Bulan berikutnya">›</button></div>
      <div class="kal-grid" id="kal-grid"></div>
      <div class="kal-legend">${KATEGORI_AGENDA.map(k => `<span><i style="background:${warnaKategori(k)}"></i>${k}</span>`).join("")}</div>
      <div id="kal-daftar"></div>
    </div>
    <div id="kal-admin"></div>`;

  function agendaPadaHari(tgl) { return st.items.filter(a => a.tanggal_mulai <= tgl && a.tanggal_selesai >= tgl); }

  function gambarGrid() {
    const [thn, bln] = st.bulan.split("-").map(Number);
    const jml = new Date(thn, bln, 0).getDate();
    const offset = (new Date(thn, bln - 1, 1).getDay() + 6) % 7; // Senin = 0
    const hariIni = new Date().toISOString().slice(0, 10);
    const nama = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    let html = nama.map((n, i) => `<div class="kal-nama ${i === 4 ? "jumat" : ""}">${n}</div>`).join("");
    for (let i = 0; i < offset; i++) html += `<div class="kal-hari kosong"></div>`;
    for (let d = 1; d <= jml; d++) {
      const tgl = `${st.bulan}-${String(d).padStart(2, "0")}`;
      const ag = agendaPadaHari(tgl);
      const warna = Array.from(new Set(ag.map(a => warnaKategori(a.kategori)))).slice(0, 4);
      html += `<div class="kal-hari ${tgl === hariIni ? "hari-ini" : ""} ${st.hari === tgl ? "dipilih" : ""}" data-tgl="${tgl}">${d}<div class="kal-titik">${warna.map(w => `<i style="background:${w}"></i>`).join("")}</div></div>`;
    }
    document.getElementById("kal-grid").innerHTML = html;
    document.getElementById("kal-judul").textContent = namaBulanIndo(st.bulan);
    document.querySelectorAll("#kal-grid .kal-hari[data-tgl]").forEach(el => {
      el.addEventListener("click", () => { st.hari = st.hari === el.dataset.tgl ? null : el.dataset.tgl; gambarGrid(); gambarDaftar(); });
    });
  }

  function gambarDaftar() {
    const daftar = st.hari ? agendaPadaHari(st.hari) : st.items;
    const judul = st.hari ? `Agenda ${fmtTanggal(st.hari)}` : `Agenda ${namaBulanIndo(st.bulan)}`;
    document.getElementById("kal-daftar").innerHTML = `<h3 style="margin-top:10px;">${judul}</h3>` + (daftar.length === 0
      ? `<div class="empty-state">Tidak ada agenda.</div>`
      : daftar.map(a => `
        <div class="kal-agenda">
          <div class="bar" style="background:${warnaKategori(a.kategori)}"></div>
          <div style="flex:1;">
            <b>${esc(a.judul)}</b> <span class="chip chip-nonaktif">${esc(a.kategori)}</span>
            <div class="text-muted text-sm">${fmtTanggal(a.tanggal_mulai)}${a.tanggal_selesai !== a.tanggal_mulai ? " – " + fmtTanggal(a.tanggal_selesai) : ""}</div>
            ${a.keterangan ? `<div class="text-sm">${esc(a.keterangan)}</div>` : ""}
            ${opsi.admin ? `<div class="mt-1"><button class="btn btn-secondary btn-sm" data-edit="${esc(a.id)}">Edit</button> <button class="btn btn-danger btn-sm" data-hapus="${esc(a.id)}">Hapus</button></div>` : ""}
          </div>
        </div>`).join(""));
    if (opsi.admin) {
      document.querySelectorAll("#kal-daftar [data-edit]").forEach(b => b.addEventListener("click", () => { st.edit = st.items.find(a => a.id === b.dataset.edit); gambarFormAdmin(); document.getElementById("kal-admin").scrollIntoView({ behavior: "smooth" }); }));
      document.querySelectorAll("#kal-daftar [data-hapus]").forEach(b => b.addEventListener("click", async () => {
        if (!confirm("Hapus agenda ini?")) return;
        try { await Api.call("agenda.hapus", { id: b.dataset.hapus }); await muat(); } catch (err) { alert(err.message); }
      }));
    }
  }

  function gambarFormAdmin() {
    const e = st.edit, v = (f) => e ? esc(e[f] || "") : "";
    document.getElementById("kal-admin").innerHTML = `
      <div class="card">
        <h3>${e ? "Edit Agenda" : "Tambah Agenda"}</h3>
        <form id="form-agenda">
          <div class="field"><label>Judul Agenda</label><input type="text" id="ag-judul" value="${v("judul")}" required></div>
          <div class="grid-2">
            <div class="field"><label>Kategori</label><select id="ag-kategori">${KATEGORI_AGENDA.map(k => `<option ${e && e.kategori === k ? "selected" : ""}>${k}</option>`).join("")}</select></div>
            <div class="field"><label>Tanggal Mulai</label><input type="date" id="ag-mulai" value="${v("tanggal_mulai") || st.hari || ""}" required></div>
          </div>
          <div class="field"><label>Tanggal Selesai (kosongkan jika 1 hari)</label><input type="date" id="ag-selesai" value="${e && e.tanggal_selesai !== e.tanggal_mulai ? v("tanggal_selesai") : ""}"></div>
          <div class="field"><label>Keterangan (opsional)</label><textarea id="ag-ket" rows="2">${v("keterangan")}</textarea></div>
          <button class="btn btn-primary btn-block" type="submit">${e ? "Simpan Perubahan" : "Tambah Agenda"}</button>
          ${e ? `<button type="button" class="btn btn-secondary btn-block mt-1" id="ag-batal">Batal Edit</button>` : ""}
          <div id="ag-pesan" class="mt-1"></div>
        </form>
      </div>`;
    const batal = document.getElementById("ag-batal");
    if (batal) batal.addEventListener("click", () => { st.edit = null; gambarFormAdmin(); });
    document.getElementById("form-agenda").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const btn = ev.target.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        await Api.call("agenda.save", { data: {
          id: e ? e.id : undefined, judul: document.getElementById("ag-judul").value,
          kategori: document.getElementById("ag-kategori").value, tanggal_mulai: document.getElementById("ag-mulai").value,
          tanggal_selesai: document.getElementById("ag-selesai").value, keterangan: document.getElementById("ag-ket").value
        } });
        st.edit = null;
        gambarFormAdmin();
        await muat();
      } catch (err) {
        document.getElementById("ag-pesan").innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
        btn.disabled = false;
      }
    });
  }

  async function muat() {
    document.getElementById("kal-daftar").innerHTML = `<div class="loading">Memuat agenda...</div>`;
    try {
      const d = await Api.call("publik.agenda", { bulan: st.bulan });
      st.items = d.items || [];
      gambarGrid();
      gambarDaftar();
    } catch (err) { document.getElementById("kal-daftar").innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; }
  }

  container.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => {
    let [y, m] = st.bulan.split("-").map(Number);
    m += Number(b.dataset.nav);
    if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
    st.bulan = `${y}-${String(m).padStart(2, "0")}`;
    st.hari = null;
    muat();
  }));

  if (opsi.admin) gambarFormAdmin();
  await muat();
}

Router.add("kalender", async (root) => {
  root.innerHTML = Shell("kalender", `<div id="kal-wrap"></div>`);
  await renderKalender(document.getElementById("kal-wrap"), { admin: Auth.boleh("admin") });
});

// ======================= HALAMAN PENGUMUMAN =======================

Router.add("pengumuman", async (root) => {
  root.innerHTML = Shell("pengumuman", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const isAdmin = Auth.boleh("admin");
  const st = { edit: null };

  async function gambar() {
    try {
      let daftarHtml;
      let items = [];
      if (isAdmin) {
        items = (await Api.call("pengumuman.list", {})).items || [];
        daftarHtml = items.length === 0 ? `<div class="empty-state">Belum ada pengumuman.</div>` : items.map(p => `
          <div class="pgm"><div class="pgm-head" style="cursor:default;">
            <span class="chip chip-juz">${esc(p.kategori)}</span> <span class="text-muted text-sm">${fmtTanggal(p.tanggal)}</span>
            ${p.status === "sembunyi" ? `<span class="chip chip-nonaktif">Disembunyikan</span>` : ""}${p.ada_gambar === "ya" ? ` <span class="chip chip-hadir">Ada gambar</span>` : ""}
            <div class="pgm-judul">${esc(p.judul)}</div><div class="pgm-ringkas">${esc(ringkas(p.isi, 140))}</div>
            <div class="mt-1"><button class="btn btn-secondary btn-sm" data-edit="${esc(p.id)}">Edit</button> <button class="btn btn-danger btn-sm" data-hapus="${esc(p.id)}">Hapus</button></div>
          </div></div>`).join("");
      } else {
        const d = await Api.call("publik.info", {});
        daftarHtml = renderPengumumanList(d.pengumuman);
      }
      const e = st.edit, v = (f) => e ? esc(e[f] || "") : "";
      main.innerHTML = `
        ${isAdmin ? `
        <div class="card">
          <h3>${e ? "Edit Pengumuman" : "Buat Pengumuman / Postingan Kegiatan"}</h3>
          <div class="text-muted text-sm mb-1">Pengumuman tampil di halaman login (bisa dilihat siapa saja) dan di Beranda semua akun.</div>
          <form id="form-pgm">
            <div class="grid-2">
              <div class="field"><label>Tanggal</label><input type="date" id="pg-tanggal" value="${v("tanggal") || new Date().toISOString().slice(0, 10)}" required></div>
              <div class="field"><label>Kategori</label><select id="pg-kategori">${["Kegiatan", "Penting", "Libur", "Prestasi", "Lainnya"].map(k => `<option ${e && e.kategori === k ? "selected" : ""}>${k}</option>`).join("")}</select></div>
            </div>
            <div class="field"><label>Judul</label><input type="text" id="pg-judul" value="${v("judul")}" required></div>
            <div class="field"><label>Isi</label><textarea id="pg-isi" rows="5" required>${v("isi")}</textarea></div>
            <div class="field"><label>Gambar / poster (opsional, otomatis dikecilkan)</label><input type="file" id="pg-gambar" accept="image/*"><div id="pg-prev" class="mt-1"></div></div>
            <div class="field"><label>Status</label><select id="pg-status"><option value="tampil" ${e && e.status !== "sembunyi" ? "selected" : ""}>Tampil</option><option value="sembunyi" ${e && e.status === "sembunyi" ? "selected" : ""}>Sembunyikan</option></select></div>
            <button class="btn btn-primary btn-block" type="submit">${e ? "Simpan Perubahan" : "Terbitkan"}</button>
            ${e ? `<button type="button" class="btn btn-secondary btn-block mt-1" id="pg-batal">Batal Edit</button>` : ""}
            <div id="pg-pesan" class="mt-1"></div>
          </form>
        </div>` : ""}
        <div class="card"><h3>${isAdmin ? "Semua Pengumuman" : "Pengumuman Terbaru"}</h3><div id="pgm-daftar">${daftarHtml}</div></div>`;

      if (!isAdmin) pasangInteraksiPengumuman(main);
      if (isAdmin) {
        main.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => { st.edit = items.find(p => p.id === b.dataset.edit); gambar(); window.scrollTo(0, 0); }));
        main.querySelectorAll("[data-hapus]").forEach(b => b.addEventListener("click", async () => {
          if (!confirm("Hapus pengumuman ini?")) return;
          try { await Api.call("pengumuman.hapus", { id: b.dataset.hapus }); gambar(); } catch (err) { alert(err.message); }
        }));
        const batal = document.getElementById("pg-batal");
        if (batal) batal.addEventListener("click", () => { st.edit = null; gambar(); });
        document.getElementById("pg-gambar").addEventListener("change", async (ev) => {
          const f = ev.target.files[0], prev = document.getElementById("pg-prev");
          if (!f) { prev.innerHTML = ""; return; }
          try { const h = await kompresFoto(f, 480, 0.7, 46000, false); prev.innerHTML = `<img src="${h}" style="max-width:100%;max-height:160px;border-radius:8px;"><div class="text-muted text-sm">${Math.round(h.length / 1024)} KB setelah dikecilkan</div>`; }
          catch (err) { prev.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; }
        });
        document.getElementById("form-pgm").addEventListener("submit", async (ev) => {
          ev.preventDefault();
          const btn = ev.target.querySelector("button[type=submit]");
          const pesan = document.getElementById("pg-pesan");
          btn.disabled = true; btn.textContent = "Menyimpan...";
          try {
            const payload = { data: {
              id: e ? e.id : undefined, tanggal: document.getElementById("pg-tanggal").value, kategori: document.getElementById("pg-kategori").value,
              judul: document.getElementById("pg-judul").value, isi: document.getElementById("pg-isi").value, status: document.getElementById("pg-status").value
            } };
            const f = document.getElementById("pg-gambar").files[0];
            if (f) payload.gambar_base64 = await kompresFoto(f, 480, 0.7, 46000, false);
            const hasil = await Api.call("pengumuman.save", payload);
            if (hasil.peringatan) alert(hasil.peringatan);
            st.edit = null;
            gambar();
          } catch (err) {
            pesan.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
            btn.disabled = false; btn.textContent = e ? "Simpan Perubahan" : "Terbitkan";
          }
        });
      }
    } catch (err) { tampilkanGalat(main, err); }
  }
  await gambar();
});

// ======================= INFO DI BERANDA (pengumuman, agenda, Jumat Amal) =======================

async function renderInfoBeranda(container) {
  const d = await Api.call("info.beranda", {});
  const ja = d.jumat_amal || {};
  container.innerHTML = `
    <div class="card">
      <div class="flex-between"><h3 style="margin:0;">📢 Pengumuman</h3><a href="#/pengumuman" class="text-sm" style="color:var(--azure);">Lihat semua</a></div>
      <div class="mt-1">${renderPengumumanList(d.pengumuman)}</div>
    </div>
    <div class="card">
      <div class="flex-between"><h3 style="margin:0;">📅 Agenda Terdekat</h3><a href="#/kalender" class="text-sm" style="color:var(--azure);">Buka kalender</a></div>
      <div class="mt-1">${(d.agenda || []).length === 0 ? `<div class="empty-state">Belum ada agenda mendatang.</div>` : d.agenda.map(a => `
        <div class="kal-agenda"><div class="bar" style="background:${warnaKategori(a.kategori)}"></div><div><b>${esc(a.judul)}</b>
        <div class="text-muted text-sm">${fmtTanggal(a.tanggal_mulai)}${a.tanggal_selesai !== a.tanggal_mulai ? " – " + fmtTanggal(a.tanggal_selesai) : ""} · ${esc(a.kategori)}</div></div></div>`).join("")}</div>
    </div>
    <div class="card">
      <h3>🤲 Jumat Amal</h3>
      ${ja.terakhir ? `
        <div class="text-muted text-sm">Pekan terakhir (${fmtTanggal(ja.terakhir.tanggal)})</div>
        <div style="font-size:24px;font-weight:700;color:var(--emerald-deep);">${rupiah(ja.terakhir.total)}</div>
        <div class="text-sm">${ja.terakhir.jumlah_peserta ? ja.terakhir.jumlah_peserta + " santri berpartisipasi. " : ""}${esc(ja.terakhir.keterangan || "")}</div>
        <div class="text-muted text-sm mt-1">Total bulan ini: <b>${rupiah(ja.total_bulan_ini)}</b> (${ja.jumlah_pekan} pekan)</div>`
        : `<div class="empty-state">Belum ada laporan Jumat Amal.</div>`}
    </div>`;
  pasangInteraksiPengumuman(container);
}

// ======================= NOTIFIKASI WALI (cek berkala, bukan push) =======================

const NotifState = {
  belum: 0, ts: 0, timer: null, berjalan: false,
  mulai() {
    if (this.berjalan) return;
    this.berjalan = true; this.ts = 0; this.belum = 0;
    this.cek();
    this.timer = setInterval(() => this.cek(), 45000);
    document.addEventListener("visibilitychange", NotifState._vis);
  },
  berhenti() {
    clearInterval(this.timer);
    this.berjalan = false; this.ts = 0; this.belum = 0;
    document.removeEventListener("visibilitychange", NotifState._vis);
  },
  _vis() { if (!document.hidden && NotifState.berjalan) NotifState.cek(); },
  async cek() {
    if (document.hidden || !Auth.isLoggedIn() || Auth.peran() !== "wali_santri") return;
    try {
      const d = await Api.call("notif.cek", { sejak: this.ts });
      if (d.belum_dibaca !== null && d.belum_dibaca !== undefined) this.belum = d.belum_dibaca;
      (d.baru || []).slice(0, 3).reverse().forEach(n => tampilToast(n.judul, n.isi));
      if (d.ts) this.ts = Math.max(this.ts, d.ts);
      this.perbaruiBadge();
      if (d.baru && d.baru.length) {
        const k = document.getElementById("notif-kartu");
        if (k) renderKartuNotif(k);
      }
    } catch (e) { /* diam: dicoba lagi pada siklus berikutnya */ }
  },
  perbaruiBadge() {
    const b = document.getElementById("notif-badge");
    if (b) { b.textContent = this.belum > 9 ? "9+" : this.belum; b.style.display = this.belum > 0 ? "flex" : "none"; }
  }
};

const IKON_NOTIF = { hafalan: "📖", nilai: "🧮", presensi: "✅", pelanggaran: "⚠️", prestasi: "🏅", pesan: "💬" };

function itemNotifHtml(n) {
  return `<div class="notif-item ${n.dibaca === "ya" ? "" : "baru"}"><div style="font-size:20px;">${IKON_NOTIF[n.jenis] || "🔔"}</div>
    <div><b>${esc(n.judul)}</b><div>${esc(n.isi)}</div><div class="text-muted" style="font-size:11px;">${esc(String(n.waktu).slice(0, 16))}</div></div></div>`;
}

async function renderKartuNotif(container) {
  try {
    const d = await Api.call("notif.list", {});
    const items = (d.items || []).slice(0, 5);
    container.innerHTML = `<div class="card"><div class="flex-between"><h3 style="margin:0;">🔔 Perkembangan Terbaru</h3><a href="#/notifikasi" class="text-sm" style="color:var(--azure);">Semua</a></div>
      <div class="mt-1">${items.length === 0 ? `<div class="empty-state">Belum ada perkembangan baru. Pemberitahuan akan muncul otomatis di sini.</div>` : items.map(itemNotifHtml).join("")}</div></div>`;
  } catch (e) { container.innerHTML = ""; }
}

Router.add("notifikasi", async (root) => {
  root.innerHTML = Shell("notifikasi", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  try {
    const d = await Api.call("notif.list", {});
    const items = d.items || [];
    main.innerHTML = `<div class="card"><h3>Perkembangan Anak</h3>${items.length === 0 ? `<div class="empty-state">Belum ada notifikasi.</div>` : items.map(itemNotifHtml).join("")}</div>`;
    if (items.some(n => n.dibaca !== "ya")) {
      Api.call("notif.tandai", {}).then(() => { NotifState.belum = 0; NotifState.perbaruiBadge(); }).catch(() => {});
    }
  } catch (err) { tampilkanGalat(main, err); }
});

// ======================= HALAMAN LOGIN (dengan informasi publik interaktif) =======================

Router.add("login", async (root) => {
  root.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <img class="logo" src="assets/logo.png" alt="Logo" onerror="this.style.display='none'">
        <h1>SIM Santri</h1>
        <p class="sub">Pesantren Tahfidz Al Asyhari &mdash; Rogojampi</p>
        <div id="login-alert"></div>
        <form id="form-login">
          <div class="field" style="text-align:left;">
            <label>Username <span class="text-muted" style="font-weight:400;">(wali santri: gunakan NIS)</span></label>
            <input type="text" id="login-username" required autocomplete="username" autocapitalize="off">
          </div>
          <div class="field" style="text-align:left;">
            <label>Sandi</label>
            <input type="password" id="login-password" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn btn-primary btn-block" id="btn-login">Masuk</button>
        </form>
      </div>
      <div class="login-info" id="login-info"><div class="card"><div class="loading">Memuat informasi pesantren...</div></div></div>
    </div>`;

  document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-login");
    const alertBox = document.getElementById("login-alert");
    alertBox.innerHTML = "";
    btn.disabled = true; btn.textContent = "Memproses...";
    try {
      const data = await Api.call("login", {
        username: document.getElementById("login-username").value.trim(),
        password: document.getElementById("login-password").value
      });
      Auth.setSesi(data.token, data.profil);
      if (data.profil.peran === "wali_santri") NotifState.mulai(); else prefetchSemua();
      Router.go(Router.berandaUntukPeran());
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
      btn.disabled = false; btn.textContent = "Masuk";
    }
  });

  // Informasi publik (tanpa login): pengumuman + kalender
  try {
    const d = await Api.call("publik.info", {});
    const info = document.getElementById("login-info");
    if (!info) return;
    info.innerHTML = `
      <div class="card"><h3>📢 Pengumuman &amp; Kegiatan</h3>${renderPengumumanList(d.pengumuman)}</div>
      <div id="login-kalender"></div>`;
    pasangInteraksiPengumuman(info);
    await renderKalender(document.getElementById("login-kalender"), { admin: false });
  } catch (err) {
    const info = document.getElementById("login-info");
    if (info) info.innerHTML = "";
  }
});

// ======================= UTIL TANGGAL LOKAL (hindari selisih hari akibat UTC) =======================

function tglLokal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function tglHariIni() { return tglLokal(new Date()); }
function jumatTerakhir() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 2) % 7)); // mundur ke hari Jumat terdekat (termasuk hari ini bila Jumat)
  return tglLokal(d);
}

// ======================= PENGATURAN AKADEMIK (tahun ajaran, semester aktif, bobot) =======================

async function renderPengaturanAkademik(container) {
  const isAdmin = Auth.boleh("admin");
  try {
    const p = await Api.call("pengaturan.get", {});
    container.innerHTML = `
      <div class="card">
        <h3>Tahun Ajaran, Semester &amp; Bobot Nilai</h3>
        <div class="text-muted text-sm mb-1">Dipakai untuk input nilai dan raport. Nilai akhir = rata-rata tertimbang dari komponen yang sudah ada (PTS memakai harian + PTS; Semester memakai harian + PTS + PAS).</div>
        <form id="form-akademik">
          <div class="grid-2">
            <div class="field"><label>Tahun Ajaran</label><input type="text" id="pa-tahun" value="${esc(p.tahun_ajaran)}" placeholder="2026/2027" ${isAdmin ? "" : "disabled"}></div>
            <div class="field"><label>Semester Aktif</label><select id="pa-semester" ${isAdmin ? "" : "disabled"}><option ${p.semester_aktif === "Ganjil" ? "selected" : ""}>Ganjil</option><option ${p.semester_aktif === "Genap" ? "selected" : ""}>Genap</option></select></div>
          </div>
          <div class="grid-2" style="grid-template-columns:repeat(3,1fr);">
            <div class="field"><label>Bobot Harian %</label><input type="number" id="pa-h" min="0" max="100" value="${p.bobot_harian}" ${isAdmin ? "" : "disabled"}></div>
            <div class="field"><label>Bobot PTS %</label><input type="number" id="pa-p" min="0" max="100" value="${p.bobot_pts}" ${isAdmin ? "" : "disabled"}></div>
            <div class="field"><label>Bobot PAS %</label><input type="number" id="pa-a" min="0" max="100" value="${p.bobot_pas}" ${isAdmin ? "" : "disabled"}></div>
          </div>
          ${isAdmin ? `<button class="btn btn-primary btn-block" type="submit">Simpan Pengaturan</button>` : ""}
          <div id="pa-pesan" class="mt-1"></div>
        </form>
      </div>`;
    if (isAdmin) {
      document.getElementById("form-akademik").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector("button[type=submit]");
        const pesan = document.getElementById("pa-pesan");
        btn.disabled = true;
        try {
          await Api.call("pengaturan.save", { data: {
            tahun_ajaran: document.getElementById("pa-tahun").value.trim(), semester_aktif: document.getElementById("pa-semester").value,
            bobot_harian: document.getElementById("pa-h").value, bobot_pts: document.getElementById("pa-p").value, bobot_pas: document.getElementById("pa-a").value
          } });
          RefCache.invalidate("pengaturan");
          pesan.innerHTML = `<div class="alert alert-success">Pengaturan disimpan.</div>`;
        } catch (err) { pesan.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; }
        btn.disabled = false;
      });
    }
  } catch (err) { tampilkanGalat(container, err); }
}

// ======================= NILAI (harian & ujian) =======================

Router.add("nilai", async (root) => {
  root.innerHTML = Shell("nilai", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const profil = Auth.getProfil();
  const bisaInput = profil.peran === "admin" || profil.peran === "guru_mapel";
  try {
    const [kelasRes, mapelRes, ujianRes, santriRes, peng] = await Promise.all([Ref.kelas(), Ref.mapel(), Ref.jenisUjian(), Ref.santriSemua(), Ref.pengaturan()]);
    let daftarKelas = kelasRes.items || [];
    if (profil.peran === "guru_mapel") {
      const d = (profil.kelas_diampu || "").split(",");
      daftarKelas = daftarKelas.filter(k => d.indexOf(k.id) !== -1);
    }
    const mapelSaya = (profil.mapel || "").split(",").map(s => s.trim()).filter(Boolean);
    const daftarMapel = (profil.peran === "guru_mapel" && mapelSaya.length) ? mapelSaya : (mapelRes.items || []).map(m => m.nama_mapel);
    const jenisUjian = (ujianRes.items || []).filter(u => u.status !== "nonaktif");
    const santriAktif = (santriRes.items || []).filter(s => s.status === "aktif");

    main.innerHTML = `
      <div class="card">
        <h3>${bisaInput ? "Input Nilai" : "Pantauan Nilai"}</h3>
        <div class="text-muted text-sm mb-1">Tahun ajaran <b>${esc(peng.tahun_ajaran)}</b> · Semester aktif <b>${esc(peng.semester_aktif)}</b>. Jenis ujian &amp; bobot diatur admin di menu Pengaturan Akademik / Data Master.</div>
        <div class="grid-2">
          <div class="field"><label>Kelas</label><select id="nl-kelas">${daftarKelas.length === 0 ? `<option value="">(belum ada kelas)</option>` : daftarKelas.map(k => `<option value="${esc(k.id)}">${esc(k.nama_kelas)}</option>`).join("")}</select></div>
          <div class="field"><label>Mata Pelajaran</label>
            ${daftarMapel.length === 0 ? `<input type="text" id="nl-mapel" placeholder="Ketik mata pelajaran">`
              : `<select id="nl-mapel">${bisaInput ? "" : `<option value="">(semua mapel)</option>`}${daftarMapel.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join("")}</select>`}
          </div>
        </div>
        ${bisaInput ? `
        <div class="grid-2">
          <div class="field"><label>Jenis Penilaian</label>
            <select id="nl-jenis"><option value="harian">Nilai Harian</option>${jenisUjian.map(u => `<option value="ujian|${esc(u.id)}">${esc(u.nama)}</option>`).join("")}</select></div>
          <div class="field"><label>Tanggal</label><input type="date" id="nl-tanggal" value="${tglHariIni()}"></div>
        </div>
        <div class="field" id="nl-nama-wrap"><label>Nama Penilaian (nilai harian bisa ditambah sendiri)</label><input type="text" id="nl-nama" value="Ulangan Harian" placeholder="mis. Ulangan Bab 2, Tugas 1, Kuis"></div>
        <div id="nl-daftar" class="mt-1"></div>` : ""}
      </div>
      <div class="card"><h3>Riwayat Nilai</h3><div id="nl-riwayat"><div class="loading">Memuat...</div></div></div>`;

    let barisNilai = [];
    const el = (id) => document.getElementById(id);
    const pilihan = () => {
      const jenisVal = bisaInput ? el("nl-jenis").value : "harian";
      const [jenis, idUjian] = jenisVal.split("|");
      return { kelasId: el("nl-kelas").value, mapel: el("nl-mapel").value.trim(), jenis, idUjian,
        namaPenilaian: bisaInput ? el("nl-nama").value.trim() : "", tanggal: bisaInput ? el("nl-tanggal").value : "" };
    };
    const semesterTerpilih = () => {
      const p = pilihan();
      if (p.jenis === "ujian") { const u = jenisUjian.find(x => x.id === p.idUjian); if (u) return u.semester; }
      return peng.semester_aktif;
    };

    async function muatData() {
      const p = pilihan();
      if (!p.kelasId) { barisNilai = []; gambarRiwayat(); return; }
      try {
        const d = await Api.call("nilai.list", { kelas_id: p.kelasId, mapel: p.mapel || undefined, semester: semesterTerpilih() });
        barisNilai = d.items || [];
      } catch (err) { el("nl-riwayat").innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; return; }
      gambarRiwayat();
      if (bisaInput && el("nl-daftar").dataset.aktif === "1") gambarDaftar();
    }

    function gambarRiwayat() {
      const grup = {};
      barisNilai.forEach(r => {
        const k = [r.jenis, r.nama_penilaian, r.jenis === "harian" ? r.tanggal : "", r.mapel].join("|");
        const g = grup[k] || (grup[k] = { mapel: r.mapel, nama: r.nama_penilaian, tanggal: r.tanggal, jenis: r.jenis, ids: [], nilai: [] });
        g.ids.push(r.id); g.nilai.push(Number(r.nilai));
      });
      const daftar = Object.keys(grup).map(k => grup[k]);
      el("nl-riwayat").innerHTML = daftar.length === 0 ? `<div class="empty-state">Belum ada nilai untuk pilihan ini (semester ${esc(semesterTerpilih())}).</div>` : `
        <div class="table-wrap"><table class="data-table">
          <tr><th>Mapel</th><th>Penilaian</th><th>Tanggal</th><th>Santri</th><th>Rata-rata</th>${bisaInput ? "<th></th>" : ""}</tr>
          ${daftar.map((g, i) => `<tr><td>${esc(g.mapel)}</td><td>${esc(g.nama)}${g.jenis === "ujian" ? ` <span class="chip chip-juz">Ujian</span>` : ""}</td><td>${g.jenis === "harian" ? fmtTanggal(g.tanggal) : "-"}</td>
            <td>${g.ids.length}</td><td>${(g.nilai.reduce((a, b) => a + b, 0) / g.nilai.length).toFixed(1)}</td>
            ${bisaInput ? `<td><button class="btn btn-danger btn-sm" data-hapus="${i}">Hapus</button></td>` : ""}</tr>`).join("")}
        </table></div>`;
      el("nl-riwayat").querySelectorAll("[data-hapus]").forEach(b => b.addEventListener("click", async () => {
        if (!confirm("Hapus kelompok nilai ini untuk semua santri?")) return;
        try { await Api.call("nilai.hapus", { ids: daftar[Number(b.dataset.hapus)].ids }); await muatData(); } catch (err) { alert(err.message); }
      }));
    }

    function gambarDaftar() {
      const p = pilihan();
      const wadah = el("nl-daftar");
      wadah.dataset.aktif = "1";
      if (!p.kelasId || !p.mapel) { wadah.innerHTML = `<div class="alert alert-error">Pilih kelas dan mata pelajaran dulu.</div>`; return; }
      if (p.jenis === "harian" && !p.namaPenilaian) { wadah.innerHTML = `<div class="alert alert-error">Isi nama penilaian (mis. Ulangan Bab 2).</div>`; return; }
      const nama = p.jenis === "ujian" ? (jenisUjian.find(u => u.id === p.idUjian) || {}).nama : p.namaPenilaian;
      const ada = {};
      barisNilai.forEach(r => {
        if (r.mapel === p.mapel && r.jenis === p.jenis && r.nama_penilaian === nama && (p.jenis === "ujian" || r.tanggal === p.tanggal)) ada[String(r.id_santri)] = r.nilai;
      });
      const roster = santriAktif.filter(s => String(s.id_kelas) === String(p.kelasId)).sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
      wadah.innerHTML = roster.length === 0 ? `<div class="empty-state">Belum ada santri pada kelas ini.</div>` : `
        <div class="text-muted text-sm mb-1">${esc(p.mapel)} · ${esc(nama)} · Kosongkan nilai santri yang belum dinilai. Nilai yang sudah ada otomatis terisi dan akan diperbarui.</div>
        <div class="table-wrap"><table class="data-table"><tr><th>Nama</th><th style="width:110px;">Nilai (0-100)</th></tr>
          ${roster.map(s => `<tr><td>${esc(s.nama)}</td><td><input type="number" step="0.1" min="0" max="100" inputmode="decimal" data-santri="${esc(s.id)}" value="${ada[String(s.id)] !== undefined ? esc(ada[String(s.id)]) : ""}" style="height:36px;"></td></tr>`).join("")}
        </table></div>
        <button class="btn btn-primary btn-block mt-2" id="nl-simpan">Simpan Nilai</button><div id="nl-pesan" class="mt-1"></div>`;
      const simpan = el("nl-simpan");
      if (!simpan) return;
      simpan.addEventListener("click", async () => {
        simpan.disabled = true; simpan.textContent = "Menyimpan...";
        const items = Array.from(wadah.querySelectorAll("input[data-santri]")).filter(i => i.value !== "").map(i => ({ id_santri: i.dataset.santri, nilai: i.value }));
        try {
          const hasil = await Api.call("nilai.saveBatch", { kelas_id: p.kelasId, mapel: p.mapel, jenis: p.jenis, id_ujian: p.idUjian, nama_penilaian: p.namaPenilaian, tanggal: p.tanggal, items });
          const pesanOk = `<div class="alert alert-success">${hasil.tersimpan} nilai tersimpan (semester ${esc(hasil.semester)}, ${esc(hasil.tahun_ajaran)}). Wali santri diberi tahu otomatis.</div>`;
          await muatData(); // memuat ulang daftar (nilai terisi otomatis), lalu tampilkan pesan lagi
          if (el("nl-pesan")) el("nl-pesan").innerHTML = pesanOk;
        } catch (err) { el("nl-pesan").innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; }
        simpan.disabled = false; simpan.textContent = "Simpan Nilai";
      });
    }

    const perbarui = () => { if (bisaInput) el("nl-nama-wrap").style.display = pilihan().jenis === "harian" ? "block" : "none"; muatData(); };
    ["nl-kelas", "nl-mapel"].forEach(id => el(id).addEventListener("change", () => { if (bisaInput) el("nl-daftar").dataset.aktif = "0"; if (bisaInput) el("nl-daftar").innerHTML = ""; perbarui(); }));
    if (bisaInput) {
      el("nl-jenis").addEventListener("change", () => { el("nl-daftar").innerHTML = ""; el("nl-daftar").dataset.aktif = "0"; perbarui(); });
      ["nl-nama", "nl-tanggal"].forEach(id => el(id).addEventListener("input", () => { el("nl-daftar").dataset.aktif = "0"; el("nl-daftar").innerHTML = `<button class="btn btn-secondary btn-block" id="nl-muat">Tampilkan Daftar Santri</button>`; el("nl-muat").addEventListener("click", gambarDaftar); }));
      el("nl-daftar").innerHTML = `<button class="btn btn-secondary btn-block" id="nl-muat">Tampilkan Daftar Santri</button>`;
      el("nl-muat").addEventListener("click", gambarDaftar);
      el("nl-jenis").addEventListener("change", () => { el("nl-daftar").innerHTML = `<button class="btn btn-secondary btn-block" id="nl-muat">Tampilkan Daftar Santri</button>`; el("nl-muat").addEventListener("click", gambarDaftar); });
    }
    await muatData();
  } catch (err) { tampilkanGalat(main, err); }
});

// ======================= RAPORT (PTS & Semester) =======================

Router.add("raport", async (root) => {
  root.innerHTML = Shell("raport", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const profil = Auth.getProfil();
  const isWali = profil.peran === "wali_santri";
  try {
    const [kelasRes, santriRes, peng] = await Promise.all([Ref.kelas(), Ref.santriSemua(), Ref.pengaturan()]);
    let daftarKelas = kelasRes.items || [];
    if (profil.peran === "guru_mapel") {
      const d = (profil.kelas_diampu || "").split(",");
      daftarKelas = daftarKelas.filter(k => d.indexOf(k.id) !== -1);
    }
    const santriAktif = (santriRes.items || []).filter(s => s.status === "aktif");

    main.innerHTML = `
      <div class="card">
        <h3>Raport</h3>
        ${isWali ? "" : `<div class="grid-2">
          <div class="field"><label>Kelas</label><select id="rp-kelas">${daftarKelas.map(k => `<option value="${esc(k.id)}">${esc(k.nama_kelas)}</option>`).join("")}</select></div>
          <div class="field"><label>Santri</label><select id="rp-santri"></select></div></div>`}
        <div class="grid-2" style="grid-template-columns:repeat(3,1fr);">
          <div class="field"><label>Jenis Raport</label><select id="rp-jenis"><option value="pts">Raport PTS</option><option value="semester">Raport Semester</option></select></div>
          <div class="field"><label>Semester</label><select id="rp-semester"><option ${peng.semester_aktif === "Ganjil" ? "selected" : ""}>Ganjil</option><option ${peng.semester_aktif === "Genap" ? "selected" : ""}>Genap</option></select></div>
          <div class="field"><label>Tahun Ajaran</label><input type="text" id="rp-tahun" value="${esc(peng.tahun_ajaran)}"></div>
        </div>
        <div class="flex gap-1"><button class="btn btn-primary btn-block" id="rp-tampil">Tampilkan</button><button class="btn btn-accent btn-block" id="rp-pdf">Cetak PDF</button></div>
      </div>
      <div id="rp-hasil"></div>`;

    const el = (id) => document.getElementById(id);
    function isiSantri() {
      if (isWali) return;
      const kelasId = el("rp-kelas").value;
      el("rp-santri").innerHTML = santriAktif.filter(s => String(s.id_kelas) === String(kelasId)).sort((a, b) => String(a.nama).localeCompare(String(b.nama)))
        .map(s => `<option value="${esc(s.id)}">${esc(s.nama)}</option>`).join("");
    }
    if (!isWali) { el("rp-kelas").addEventListener("change", isiSantri); isiSantri(); }
    const param = () => ({
      id_santri: isWali ? profil.id_santri_anak : el("rp-santri").value, jenis: el("rp-jenis").value,
      semester: el("rp-semester").value, tahun_ajaran: el("rp-tahun").value.trim()
    });

    el("rp-tampil").addEventListener("click", async () => {
      const hasilEl = el("rp-hasil");
      const prm = param();
      if (!prm.id_santri) { hasilEl.innerHTML = `<div class="alert alert-error">Pilih santri dulu.</div>`; return; }
      hasilEl.innerHTML = `<div class="loading">Menghitung raport...</div>`;
      try {
        const r = await Api.call("raport.get", prm);
        const f = (n) => n === null || n === undefined ? "-" : n;
        const sem = r.jenis === "semester";
        hasilEl.innerHTML = `<div class="card">
          <h3>${sem ? "Raport Semester" : "Raport PTS"} — ${esc(r.semester)} ${esc(r.tahun_ajaran)}</h3>
          <div class="text-sm mb-1"><b>${esc(r.santri.nama)}</b> · NIS ${esc(r.santri.nis)} · ${esc(r.santri.kelas)}</div>
          ${r.rows.length === 0 ? `<div class="empty-state">Belum ada nilai pada semester &amp; tahun ajaran ini.</div>` : `
          <div class="table-wrap"><table class="data-table">
            <tr><th>Mata Pelajaran</th><th>Harian</th><th>PTS</th>${sem ? "<th>PAS</th>" : ""}<th>Nilai Akhir</th><th>Predikat</th></tr>
            ${r.rows.map(b => `<tr><td>${esc(b.mapel)}</td><td>${f(b.harian)}</td><td>${f(b.pts)}</td>${sem ? `<td>${f(b.pas)}</td>` : ""}<td><b>${f(b.akhir)}</b></td><td>${esc(b.predikat)}</td></tr>`).join("")}
          </table></div>
          <div class="mt-1"><b>Rata-rata nilai akhir: ${f(r.rata_rata)}</b></div>
          <div class="text-muted text-sm mt-1">Bobot: Harian ${r.bobot.harian}%, PTS ${r.bobot.pts}%${sem ? `, PAS ${r.bobot.pas}%` : ""}. Komponen yang belum ada tidak dihitung (bobot menyesuaikan). Predikat A ≥ 90, B ≥ 80, C ≥ 70, D &lt; 70.</div>`}
        </div>`;
      } catch (err) { tampilkanGalat(hasilEl, err); }
    });

    el("rp-pdf").addEventListener("click", async (e) => {
      const btn = e.target, prm = param();
      if (!prm.id_santri) { alert("Pilih santri dulu."); return; }
      btn.disabled = true; btn.textContent = "Menyusun PDF...";
      try {
        const d = await Api.call("raport.pdf", prm);
        const a = document.createElement("a");
        a.href = "data:application/pdf;base64," + d.base64; a.download = d.nama_file; a.click();
      } catch (err) { alert(err.message); }
      btn.disabled = false; btn.textContent = "Cetak PDF";
    });
  } catch (err) { tampilkanGalat(main, err); }
});

// ======================= PELANGGARAN =======================

Router.add("pelanggaran", async (root) => {
  root.innerHTML = Shell("pelanggaran", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const profil = Auth.getProfil();
  const bisaInput = ["admin", "guru_mapel", "pengajar_tpq"].indexOf(profil.peran) !== -1;
  try {
    const [santriRes, kelasRes, jenisRes] = await Promise.all([Ref.santriSemua(), Ref.kelas(), Ref.jenisPelanggaran()]);
    const kelasMap = {};
    (kelasRes.items || []).forEach(k => { kelasMap[k.id] = k.nama_kelas; });
    const santriAktif = (santriRes.items || []).filter(s => s.status === "aktif").sort((a, b) => String(a.nama).localeCompare(String(b.nama)));

    main.innerHTML = `
      ${bisaInput ? `
      <div class="card">
        <h3>Catat Pelanggaran</h3>
        <form id="form-plg">
          <div class="field"><label>Cari Santri</label><input type="text" id="pl-cari" placeholder="Ketik nama atau NIS"></div>
          <div class="field"><label>Nama Santri (kelas ditampilkan otomatis)</label><select id="pl-santri" required></select></div>
          <div class="grid-2">
            <div class="field"><label>Tanggal</label><input type="date" id="pl-tanggal" value="${tglHariIni()}" required></div>
            <div class="field"><label>Jenis Pelanggaran</label><input type="text" id="pl-jenis" list="pl-jenis-list" required placeholder="Pilih atau ketik">
              <datalist id="pl-jenis-list">${(jenisRes.items || []).map(j => `<option value="${esc(j.nama)}"></option>`).join("")}</datalist></div>
          </div>
          <div class="field"><label>Penanganan</label><textarea id="pl-penanganan" rows="3" required placeholder="Tindakan yang dilakukan, mis. teguran lisan, panggilan orang tua"></textarea></div>
          <div class="field"><label>Yang Menangani (guru/asatidz)</label><input type="text" id="pl-penangan" value="${esc(profil.nama)}" required></div>
          <button class="btn btn-primary btn-block" type="submit">Simpan Catatan</button>
          <div class="text-muted text-sm mt-1">Wali santri akan mendapat pemberitahuan otomatis.</div>
          <div id="pl-pesan" class="mt-1"></div>
        </form>
      </div>` : ""}
      <div class="card">
        <h3>Daftar Pelanggaran</h3>
        <div class="field"><label>Bulan</label><input type="month" id="pl-bulan" value="${bulanIniStr()}"></div>
        <div id="pl-list"><div class="loading">Memuat...</div></div>
      </div>`;

    const el = (id) => document.getElementById(id);
    if (bisaInput) {
      const isiPilihan = (kata) => {
        const f = String(kata || "").toLowerCase();
        el("pl-santri").innerHTML = `<option value="">-- Pilih santri --</option>` + santriAktif
          .filter(s => !f || (s.nama + " " + s.nis).toLowerCase().indexOf(f) !== -1).slice(0, 100)
          .map(s => `<option value="${esc(s.id)}">${esc(s.nama)} (${esc(s.nis)}) - ${esc(kelasMap[s.id_kelas] || "tanpa kelas")}</option>`).join("");
      };
      isiPilihan("");
      el("pl-cari").addEventListener("input", (e) => isiPilihan(e.target.value));
      el("form-plg").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector("button[type=submit]");
        const pesan = el("pl-pesan");
        btn.disabled = true; btn.textContent = "Menyimpan...";
        try {
          await Api.call("pelanggaran.save", { data: {
            id_santri: el("pl-santri").value, tanggal: el("pl-tanggal").value, jenis_pelanggaran: el("pl-jenis").value,
            penanganan: el("pl-penanganan").value, penangan: el("pl-penangan").value
          } });
          el("pl-penanganan").value = ""; el("pl-jenis").value = "";
          pesan.innerHTML = `<div class="alert alert-success">Catatan tersimpan.</div>`;
          muat();
        } catch (err) { pesan.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; }
        btn.disabled = false; btn.textContent = "Simpan Catatan";
      });
    }

    async function muat() {
      const listEl = el("pl-list");
      listEl.innerHTML = `<div class="loading">Memuat...</div>`;
      try {
        const d = await Api.call("pelanggaran.list", { bulan: el("pl-bulan").value });
        const items = d.items || [];
        listEl.innerHTML = items.length === 0 ? `<div class="empty-state">Tidak ada catatan pelanggaran pada bulan ini.</div>` : `
          <div class="table-wrap"><table class="data-table">
            <tr><th>Tanggal</th><th>Nama</th><th>Kelas</th><th>Jenis</th><th>Penanganan</th><th>Yang Menangani</th>${bisaInput ? "<th></th>" : ""}</tr>
            ${items.map(p => `<tr><td style="white-space:nowrap;">${fmtTanggal(p.tanggal)}</td><td>${esc(p.nama_santri)}</td><td>${esc(p.nama_kelas)}</td><td>${esc(p.jenis_pelanggaran)}</td>
              <td style="min-width:160px;">${esc(p.penanganan)}</td><td>${esc(p.penangan)}</td>
              ${bisaInput ? `<td><button class="btn btn-danger btn-sm" data-hapus="${esc(p.id)}">Hapus</button></td>` : ""}</tr>`).join("")}
          </table></div>`;
        listEl.querySelectorAll("[data-hapus]").forEach(b => b.addEventListener("click", async () => {
          if (!confirm("Hapus catatan ini?")) return;
          try { await Api.call("pelanggaran.hapus", { id: b.dataset.hapus }); muat(); } catch (err) { alert(err.message); }
        }));
      } catch (err) { tampilkanGalat(listEl, err); }
    }
    el("pl-bulan").addEventListener("change", muat);
    await muat();
  } catch (err) { tampilkanGalat(main, err); }
});

// ======================= LAPORAN JUMAT AMAL (mingguan) =======================

Router.add("jumatamal", async (root) => {
  root.innerHTML = Shell("jumatamal", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const profil = Auth.getProfil();
  const bisaInput = ["admin", "guru_mapel", "pengajar_tpq"].indexOf(profil.peran) !== -1;
  const st = { edit: null, items: [] };
  const el = (id) => document.getElementById(id);

  function gambarForm() {
    const e = st.edit, v = (f, d) => e ? esc(e[f] === undefined ? d : e[f]) : (d === undefined ? "" : d);
    return `
      <div class="card">
        <h3>${e ? "Edit Laporan Jumat Amal" : "Laporan Jumat Amal Pekan Ini"}</h3>
        <form id="form-amal">
          <div class="grid-2">
            <div class="field"><label>Tanggal (hari Jumat)</label><input type="date" id="am-tanggal" value="${e ? esc(e.tanggal) : jumatTerakhir()}" required></div>
            <div class="field"><label>Jumlah Terkumpul (Rp)</label><input type="number" id="am-total" min="0" inputmode="numeric" value="${v("total")}" required></div>
          </div>
          <div class="field"><label>Jumlah Santri Berpartisipasi (opsional)</label><input type="number" id="am-peserta" min="0" value="${v("jumlah_peserta")}"></div>
          <div class="field"><label>Keterangan / Penyaluran</label><textarea id="am-ket" rows="2" placeholder="mis. disalurkan untuk santri yatim, renovasi mushola">${v("keterangan")}</textarea></div>
          <button class="btn btn-primary btn-block" type="submit">${e ? "Simpan Perubahan" : "Simpan Laporan"}</button>
          ${e ? `<button type="button" class="btn btn-secondary btn-block mt-1" id="am-batal">Batal Edit</button>` : ""}
          <div id="am-pesan" class="mt-1"></div>
        </form>
      </div>`;
  }

  function pasangForm() {
    if (!bisaInput) return;
    el("form-wrap").innerHTML = gambarForm();
    const batal = el("am-batal");
    if (batal) batal.addEventListener("click", () => { st.edit = null; pasangForm(); });
    el("form-amal").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const btn = ev.target.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        await Api.call("amal.save", { data: { id: st.edit ? st.edit.id : undefined, tanggal: el("am-tanggal").value, total: el("am-total").value, jumlah_peserta: el("am-peserta").value, keterangan: el("am-ket").value } });
        st.edit = null; pasangForm(); muat();
      } catch (err) { el("am-pesan").innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; btn.disabled = false; }
    });
  }

  async function muat() {
    const listEl = el("am-list");
    listEl.innerHTML = `<div class="loading">Memuat...</div>`;
    try {
      const d = await Api.call("amal.list", { bulan: el("am-bulan").value });
      st.items = d.items || [];
      listEl.innerHTML = `<div class="stat-card mb-1"><div class="num">${rupiah(d.total_bulan)}</div><div class="label">Total ${namaBulanIndo(d.bulan)} (${st.items.length} pekan)</div></div>` + (st.items.length === 0
        ? `<div class="empty-state">Belum ada laporan pada bulan ini.</div>` : `
        <div class="table-wrap"><table class="data-table">
          <tr><th>Tanggal</th><th>Terkumpul</th><th>Peserta</th><th>Keterangan</th><th>Dicatat</th>${bisaInput ? "<th></th>" : ""}</tr>
          ${st.items.map(a => `<tr><td style="white-space:nowrap;">${fmtTanggal(a.tanggal)}</td><td><b>${rupiah(a.total)}</b></td><td>${a.jumlah_peserta || "-"}</td><td style="min-width:140px;">${esc(a.keterangan) || "-"}</td><td>${esc(a.dicatat_oleh)}</td>
            ${bisaInput ? `<td style="white-space:nowrap;"><button class="btn btn-secondary btn-sm" data-edit="${esc(a.id)}">Edit</button> <button class="btn btn-danger btn-sm" data-hapus="${esc(a.id)}">Hapus</button></td>` : ""}</tr>`).join("")}
        </table></div>`);
      listEl.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => { st.edit = st.items.find(a => a.id === b.dataset.edit); pasangForm(); window.scrollTo(0, 0); }));
      listEl.querySelectorAll("[data-hapus]").forEach(b => b.addEventListener("click", async () => {
        if (!confirm("Hapus laporan ini?")) return;
        try { await Api.call("amal.hapus", { id: b.dataset.hapus }); muat(); } catch (err) { alert(err.message); }
      }));
    } catch (err) { tampilkanGalat(listEl, err); }
  }

  main.innerHTML = `<div id="form-wrap"></div>
    <div class="card"><h3>Rekap Jumat Amal</h3><div class="field"><label>Bulan</label><input type="month" id="am-bulan" value="${bulanIniStr()}"></div><div id="am-list"></div></div>`;
  pasangForm();
  el("am-bulan").addEventListener("change", muat);
  await muat();
});

// ======================= AKUN WALI MASSAL (username = NIS) =======================

function pasangWaliMassal(container) {
  container.innerHTML = `
    <div class="card">
      <h3>Akun Wali Santri Massal (login memakai NIS)</h3>
      <div class="text-muted text-sm mb-1">Membuat akun untuk semua santri aktif yang belum punya akun wali: <b>username = NIS</b>, sandi acak. Sandi hanya ditampilkan sekali di sini &mdash; segera unduh daftarnya dan bagikan ke wali.</div>
      <button class="btn btn-accent btn-block" id="btn-wali-massal">Buat Akun Wali untuk Semua Santri</button>
      <div id="wali-massal-hasil" class="mt-1"></div>
    </div>`;
  document.getElementById("btn-wali-massal").addEventListener("click", async (e) => {
    if (!confirm("Buat akun wali untuk semua santri aktif yang belum punya akun?")) return;
    const btn = e.target, hasilEl = document.getElementById("wali-massal-hasil");
    btn.disabled = true; btn.textContent = "Membuat akun...";
    try {
      const d = await Api.call("akun.buatWaliMassal", {});
      const dibuat = d.dibuat || [], lewat = d.dilewati || [];
      hasilEl.innerHTML = `
        <div class="alert ${dibuat.length ? "alert-success" : "alert-error"}">${dibuat.length} akun dibuat${lewat.length ? `, ${lewat.length} dilewati (NIS kosong atau sudah dipakai akun lain)` : ""}.</div>
        ${dibuat.length ? `<button class="btn btn-primary btn-block mb-1" id="btn-unduh-wali">Unduh Daftar (CSV)</button>
        <div class="table-wrap"><table class="data-table"><tr><th>NIS (username)</th><th>Nama Santri</th><th>Sandi</th></tr>
        ${dibuat.map(x => `<tr><td>${esc(x.nis)}</td><td>${esc(x.nama)}</td><td><code>${esc(x.sandi)}</code></td></tr>`).join("")}</table></div>` : ""}`;
      const unduh = document.getElementById("btn-unduh-wali");
      if (unduh) unduh.addEventListener("click", () => {
        const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
        const csv = "\ufeffNIS,Nama Santri,Sandi\n" + dibuat.map(x => [q(x.nis), q(x.nama), q(x.sandi)].join(",")).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        a.download = "akun_wali_santri.csv"; a.click();
      });
    } catch (err) { hasilEl.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`; }
    btn.disabled = false; btn.textContent = "Buat Akun Wali untuk Semua Santri";
  });
}
