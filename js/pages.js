// ======================= LAYOUT =======================

const NAV_ITEMS = [
  { key: "dashboard", label: "Beranda", icon: "🏠", roles: ["admin", "guru_mapel", "pengajar_tpq", "pimpinan"] },
  { key: "anaksaya", label: "Anak Saya", icon: "🧒", roles: ["wali_santri"] },
  { key: "presensi", label: "Presensi", icon: "✅", roles: ["admin", "guru_mapel", "pengajar_tpq", "pimpinan"] },
  { key: "hafalan", label: "Hafalan", icon: "📖", roles: ["admin", "pengajar_tpq", "pimpinan"] },
  { key: "santri", label: "Santri", icon: "👤", roles: ["admin", "guru_mapel", "pengajar_tpq", "pimpinan"] },
  { key: "master", label: "Data Master", icon: "🗂️", roles: ["admin", "pimpinan"] },
  { key: "prestasi", label: "Prestasi", icon: "🏅", roles: ["admin", "pimpinan"] },
  { key: "laporan", label: "Laporan", icon: "🖨️", roles: ["admin", "pimpinan"] },
  { key: "akun", label: "Akun", icon: "⚙️", roles: ["admin"] }
];

function navBolehTampil(item) {
  if (!item.roles) return true;
  return Auth.boleh(...item.roles);
}

function avatarKecil(profil, ukuran) {
  // Foto dimuat belakangan oleh foto.js (hidrasiFoto) memakai atribut data-foto-*;
  // sebelum foto tiba (atau jika tidak punya foto) yang tampil adalah huruf inisial.
  const inisial = profil && profil.nama ? profil.nama.trim().charAt(0).toUpperCase() : "?";
  const punyaFoto = profil && profil.id && profil.url_foto && String(profil.url_foto).indexOf("db:") === 0;
  const atribut = punyaFoto ? ` data-foto-id="${profil.id}" data-foto-v="${profil.url_foto}"` : "";
  return `<div${atribut} style="width:${ukuran}px;height:${ukuran}px;border-radius:50%;background:var(--emerald-deep);color:#fff;display:flex;align-items:center;justify-content:center;font-size:${Math.round(ukuran * 0.4)}px;font-weight:700;flex-shrink:0;overflow:hidden;">${inisial}</div>`;
}

function Shell(activeKey, innerHtml) {
  const profil = Auth.getProfil();
  const navList = NAV_ITEMS.filter(navBolehTampil);
  const bottomItems = navList.slice(0, 5); // ruang terbatas di HP

  return `
    <div class="layout-desktop">
      <nav class="side-nav">
        <div style="display:flex;align-items:center;gap:8px;padding:8px 12px 18px;">
          ${avatarKecil(profil, 34)}
          <div>
            <div style="font-weight:700;font-size:13px;">SIM Santri</div>
            <div style="font-size:10px;color:var(--text-muted);">Al Asyhari</div>
          </div>
        </div>
        ${navList.map(n => `<a href="#/${n.key}" class="${n.key === activeKey ? "active" : ""}">${n.icon} ${n.label}</a>`).join("")}
        <div style="margin-top:auto;padding:12px;font-size:12px;color:var(--text-muted);border-top:1px solid var(--border-subtle);">
          <div class="flex gap-1" style="align-items:center;margin-bottom:6px;">
            ${avatarKecil(profil, 28)}
            <div>
              <div style="font-weight:700;color:var(--text-main);">${profil ? profil.nama : ""}</div>
              <div style="font-size:11px;">${labelPeran(profil ? profil.peran : "")}${profil && profil.mapel ? " &middot; " + profil.mapel : ""}</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm mt-1" style="width:100%;" onclick="logoutSekarang()">Keluar</button>
        </div>
      </nav>
      <div style="flex:1;">
        <header class="app-header">
          ${avatarKecil(profil, 30)}
          <div class="title">${judulHalaman(activeKey)}</div>
          <div class="spacer"></div>
          <button class="btn-icon" onclick="logoutSekarang()" title="Keluar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></button>
        </header>
        <main class="content">${innerHtml}</main>
      </div>
    </div>
    <nav class="bottom-nav">
      ${bottomItems.map(n => `<a href="#/${n.key}" class="${n.key === activeKey ? "active" : ""}"><span class="icon">${n.icon}</span>${n.label}</a>`).join("")}
    </nav>
  `;
}


function judulHalaman(key) {
  const map = {
    dashboard: "Beranda", presensi: "Presensi", hafalan: "Hafalan Al-Qur'an",
    santri: "Data Santri", master: "Data Master", prestasi: "Prestasi Santri",
    laporan: "Laporan", akun: "Kelola Akun"
  };
  return map[key] || "SIM Santri";
}

function labelPeran(p) {
  const map = { admin: "Admin / Tim Kantor", guru_mapel: "Guru Mata Pelajaran", pengajar_tpq: "Pengajar PTQ / Tahfidz", pimpinan: "Pimpinan", wali_santri: "Wali Santri" };
  return map[p] || p;
}

function chipStatus(status) {
  const cls = { Hadir: "chip-hadir", Sakit: "chip-sakit", Izin: "chip-izin", Alpa: "chip-alpa" }[status] || "chip-hadir";
  return `<span class="chip ${cls}">${status}</span>`;
}

function chipTipe(tipe) {
  return tipe === "Mukim" ? `<span class="chip chip-mukim">Mukim</span>` : `<span class="chip chip-nonmukim">Non-Mukim</span>`;
}

async function logoutSekarang() {
  try { await Api.call("logout", {}); } catch (e) { /* abaikan */ }
  Auth.clear();
  RefCache.invalidateAll();
  FotoStore.hapusSemua();
  Router.go("login");
}

function tampilkanGalat(container, err) {
  container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
}

// ======================= LOGIN =======================

Router.add("login", async (root) => {
  root.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <img class="logo" src="assets/logo.png" alt="Logo" onerror="this.style.display='none'">
        <h1>SIM Santri</h1>
        <p class="sub">Pesantren Tahfidz Al Asyhari &mdash; Rogojampi</p>
        <div id="login-alert"></div>
        <form id="form-login">
          <div class="field" style="text-align:left;">
            <label>Username</label>
            <input type="text" id="login-username" required autocomplete="username">
          </div>
          <div class="field" style="text-align:left;">
            <label>Sandi</label>
            <input type="password" id="login-password" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn btn-primary btn-block" id="btn-login">Masuk</button>
        </form>
      </div>
    </div>
  `;

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
      prefetchSemua(); // langsung panaskan cache begitu login berhasil
      Router.go(Router.berandaUntukPeran());
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      btn.disabled = false; btn.textContent = "Masuk";
    }
  });
});

// ======================= DASHBOARD =======================

Router.add("dashboard", async (root) => {
  const cacheLama = RefCache.peek("dashboard"); // tampil instan dulu jika ada, tanpa menunggu server
  root.innerHTML = Shell("dashboard", cacheLama ? renderDashboard(cacheLama) : `<div class="loading">Memuat ringkasan...</div>`);
  const main = document.querySelector("main.content");
  try {
    const d = await Ref.dashboard();
    main.innerHTML = renderDashboard(d);
  } catch (err) {
    if (!cacheLama) tampilkanGalat(main, err); // sudah ada tampilan dari cache, jangan timpa dengan galat
  }
  const wadahMatrix = document.getElementById("dash-matrix");
  if (wadahMatrix) renderDashboardMatrix(wadahMatrix).catch(err => tampilkanGalat(wadahMatrix, err));
});

function renderDashboard(d) {
  return `
      <div class="stat-grid mb-1">
        <div class="stat-card"><div class="num">${d.total_santri}</div><div class="label">Total Santri Aktif</div></div>
        <div class="stat-card"><div class="num">${d.total_mukim}</div><div class="label">Santri Mukim</div></div>
        <div class="stat-card"><div class="num">${d.total_non_mukim}</div><div class="label">Santri Non-Mukim</div></div>
        <div class="stat-card"><div class="num">${d.hadir_hari_ini}</div><div class="label">Hadir Hari Ini</div></div>
      </div>
      <div class="card">
        <h3>Kehadiran Sekolah Hari Ini (${d.tanggal})</h3>
        <div class="grid-2">
          <div>${chipStatus("Hadir")} <b>${d.rekap_kehadiran_hari_ini.Hadir}</b></div>
          <div>${chipStatus("Sakit")} <b>${d.rekap_kehadiran_hari_ini.Sakit}</b></div>
          <div>${chipStatus("Izin")} <b>${d.rekap_kehadiran_hari_ini.Izin}</b></div>
          <div>${chipStatus("Alpa")} <b>${d.rekap_kehadiran_hari_ini.Alpa}</b></div>
        </div>
      </div>
      <div class="card">
        <h3>Rekap Bulan Ini ${d.bulan ? `(${namaBulanIndo(d.bulan)})` : ""}</h3>
        <div class="text-muted text-sm mb-1">Kehadiran sekolah pagi sepanjang bulan berjalan. Lihat detail per kelas/kelompok di menu Presensi.</div>
        <div class="grid-2">
          <div>${chipStatus("Hadir")} <b>${d.rekap_kehadiran_bulan_ini ? d.rekap_kehadiran_bulan_ini.Hadir : 0}</b></div>
          <div>${chipStatus("Sakit")} <b>${d.rekap_kehadiran_bulan_ini ? d.rekap_kehadiran_bulan_ini.Sakit : 0}</b></div>
          <div>${chipStatus("Izin")} <b>${d.rekap_kehadiran_bulan_ini ? d.rekap_kehadiran_bulan_ini.Izin : 0}</b></div>
          <div>${chipStatus("Alpa")} <b>${d.rekap_kehadiran_bulan_ini ? d.rekap_kehadiran_bulan_ini.Alpa : 0}</b></div>
        </div>
        <div class="mt-1 text-sm"><b>${d.setoran_bulan_ini || 0}</b> setoran hafalan tercatat bulan ini.</div>
      </div>
      <div class="card">
        <h3>Rata-rata Progres Hafalan</h3>
        <div style="font-size:28px;font-weight:700;color:var(--gold);">Juz ${d.rata_rata_progres_juz}</div>
        <div class="text-muted text-sm">Rata-rata capaian juz tertinggi santri yang sudah tercatat</div>
      </div>
      <div id="dash-matrix"></div>
  `;
}

// ======================= PRESENSI =======================

Router.add("presensi", async (root) => {
  root.innerHTML = Shell("presensi", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const profil = Auth.getProfil();
  const isPimpinan = profil.peran === "pimpinan";
  const isSekolah = profil.peran === "guru_mapel" || profil.peran === "admin";
  const isTpq = profil.peran === "pengajar_tpq" || profil.peran === "admin";

  try {
    const [kelasData, kelompokData] = await Promise.all([Ref.kelas(), Ref.kelompok()]);

    let daftarKelas = kelasData.items;
    let daftarKelompok = kelompokData.items;
    if (profil.peran === "guru_mapel") {
      const diampu = (profil.kelas_diampu || "").split(",");
      daftarKelas = daftarKelas.filter(k => diampu.indexOf(k.id) !== -1);
    }
    if (profil.peran === "pengajar_tpq") {
      const diampu = (profil.kelompok_diampu || "").split(",");
      daftarKelompok = daftarKelompok.filter(k => diampu.indexOf(k.id) !== -1);
    }

    if (isPimpinan) {
      // Pimpinan bersifat read-only: tidak ada form input harian, langsung ke rekap bulanan.
      main.innerHTML = `<div id="rekap-bulanan-wrap"></div>`;
      renderRekapBulananCard(document.getElementById("rekap-bulanan-wrap"), "presensi", {
        daftarKelas: daftarKelas, daftarKelompok: daftarKelompok, tampilkanPilihanJenisRef: true
      });
      return;
    }

    main.innerHTML = `
      <div class="card">
        <h3>Pilih Presensi</h3>
        <div class="field">
          <label>Jenis</label>
          <select id="p-jenis">
            ${isSekolah ? `<option value="sekolah">Sekolah Pagi</option>` : ""}
            ${isTpq ? `<option value="tpq">PTQ (Pendidikan Tahfidzul Qur'an)</option>` : ""}
          </select>
        </div>
        <div class="field" id="p-ref-wrap"></div>
        <div class="grid-2">
          <div class="field">
            <label>Tanggal</label>
            <input type="date" id="p-tanggal" value="${new Date().toISOString().slice(0, 10)}">
          </div>
          <div class="field">
            <label>Mata Pelajaran / Materi</label>
            <input type="text" id="p-mapel" value="${profil.mapel || ""}" placeholder="mis. Matematika, Tahsin">
          </div>
        </div>
        <button class="btn btn-primary btn-block" id="btn-muat-presensi">Muat Daftar Santri</button>
      </div>
      <div id="presensi-list"></div>
      <div id="rekap-bulanan-wrap" class="mt-2"></div>
    `;

    renderRekapBulananCard(document.getElementById("rekap-bulanan-wrap"), "presensi", {
      daftarKelas: daftarKelas, daftarKelompok: daftarKelompok,
      tampilkanPilihanJenisRef: isSekolah && isTpq,
      refTypeTunggal: isSekolah ? "kelas" : "kelompok"
    });

    function renderRefOptions() {
      const jenis = document.getElementById("p-jenis").value;
      const wrap = document.getElementById("p-ref-wrap");
      if (jenis === "sekolah") {
        wrap.innerHTML = `<label>Kelas</label><select id="p-ref">${daftarKelas.map(k => `<option value="${k.id}">${k.nama_kelas}</option>`).join("")}</select>`;
      } else {
        wrap.innerHTML = `<label>Kelompok PTQ</label><select id="p-ref">${daftarKelompok.map(k => `<option value="${k.id}">${k.nama_kelompok}</option>`).join("")}</select>`;
      }
    }
    document.getElementById("p-jenis").addEventListener("change", renderRefOptions);
    renderRefOptions();

    document.getElementById("btn-muat-presensi").addEventListener("click", () => muatDaftarPresensi());

    async function muatDaftarPresensi() {
      const jenis = document.getElementById("p-jenis").value;
      const refId = document.getElementById("p-ref").value;
      const tanggal = document.getElementById("p-tanggal").value;
      if (!refId) return;
      const listEl = document.getElementById("presensi-list");
      listEl.innerHTML = `<div class="loading">Memuat daftar santri...</div>`;
      try {
        const data = await Api.call("presensi.get", { jenis, ref_id: refId, tanggal });
        if (data.mapel_tersimpan) document.getElementById("p-mapel").value = data.mapel_tersimpan;
        if (data.daftar.length === 0) {
          listEl.innerHTML = `<div class="empty-state">Belum ada santri pada kelas/kelompok ini.</div>`;
          return;
        }
        listEl.innerHTML = `
          <div class="card">
            ${data.sudah_disimpan ? `<div class="alert alert-success">Presensi tanggal ini sudah pernah disimpan. Menyimpan ulang akan memperbarui data.</div>` : ""}
            ${data.daftar.map(s => `
              <div class="flex-between" style="padding:10px 0;border-bottom:1px solid var(--border-subtle);" data-santri="${s.id_santri}">
                <div>
                  <div style="font-weight:600;">${s.nama}</div>
                  <div class="text-muted text-sm">NIS ${s.nis}</div>
                </div>
                <div class="segmented" style="width:200px;">
                  <button type="button" data-status="Hadir" class="${s.status === "Hadir" ? "active-hadir" : ""}">Hadir</button>
                  <button type="button" data-status="Sakit" class="${s.status === "Sakit" ? "active-sakit" : ""}">Sakit</button>
                  <button type="button" data-status="Izin" class="${s.status === "Izin" ? "active-izin" : ""}">Izin</button>
                  <button type="button" data-status="Alpa" class="${s.status === "Alpa" ? "active-alpa" : ""}">Alpa</button>
                </div>
              </div>
            `).join("")}
            <button class="btn btn-primary btn-block mt-2" id="btn-simpan-presensi">Simpan Presensi</button>
          </div>
        `;

        listEl.querySelectorAll("[data-santri]").forEach(row => {
          row.querySelectorAll(".segmented button").forEach(btn => {
            btn.addEventListener("click", () => {
              row.querySelectorAll(".segmented button").forEach(b => b.className = "");
              btn.className = "active-" + btn.dataset.status.toLowerCase();
            });
          });
        });

        document.getElementById("btn-simpan-presensi").addEventListener("click", async (e) => {
          const btn = e.target;
          btn.disabled = true; btn.textContent = "Menyimpan...";
          const items = Array.from(listEl.querySelectorAll("[data-santri]")).map(row => {
            const active = row.querySelector(".segmented button[class^='active']");
            return { id_santri: row.dataset.santri, status: active ? active.dataset.status : "Hadir", keterangan: "" };
          });
          try {
            const mapel = document.getElementById("p-mapel").value;
            await Api.call("presensi.save", { jenis, ref_id: refId, tanggal, items, mapel });
            RefCache.invalidate("dashboard");
            btn.textContent = "Tersimpan ✓";
            setTimeout(() => { btn.disabled = false; btn.textContent = "Simpan Presensi"; }, 1500);
          } catch (err) {
            alert(err.message);
            btn.disabled = false; btn.textContent = "Simpan Presensi";
          }
        });
      } catch (err) {
        tampilkanGalat(listEl, err);
      }
    }
  } catch (err) {
    tampilkanGalat(main, err);
  }
});

// ======================= HAFALAN =======================

Router.add("hafalan", async (root) => {
  root.innerHTML = Shell("hafalan", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const profil = Auth.getProfil();
  const bisaInput = profil.peran === "admin" || profil.peran === "pengajar_tpq";

  try {
    const [res, kelompokRes] = await Promise.all([Ref.santriSemua(), Ref.kelompok()]);
    const santriMukim = res.items.filter(s => s.status === "aktif" && s.tipe === "Mukim");
    let daftarKelompok = kelompokRes.items || [];
    if (profil.peran === "pengajar_tpq") {
      const diampu = (profil.kelompok_diampu || "").split(",");
      daftarKelompok = daftarKelompok.filter(k => diampu.indexOf(k.id) !== -1);
    }

    main.innerHTML = `
      <div class="card">
        <h3>Pilih Santri (Mukim)</h3>
        <select id="h-santri">
          <option value="">-- Pilih Santri --</option>
          ${santriMukim.map(s => `<option value="${s.id}">${s.nama} (${s.nis})</option>`).join("")}
        </select>
      </div>
      <div id="hafalan-body"></div>
      <div id="rekap-bulanan-wrap" class="mt-2"></div>
    `;

    renderRekapBulananCard(document.getElementById("rekap-bulanan-wrap"), "hafalan", {
      daftarKelas: [], daftarKelompok: daftarKelompok, tampilkanPilihanJenisRef: false, refTypeTunggal: "kelompok"
    });

    document.getElementById("h-santri").addEventListener("change", muatHafalan);

    async function muatHafalan() {
      const idSantri = document.getElementById("h-santri").value;
      const body = document.getElementById("hafalan-body");
      if (!idSantri) { body.innerHTML = ""; return; }
      body.innerHTML = `<div class="loading">Memuat riwayat...</div>`;
      try {
        const data = await Api.call("hafalan.list", { id_santri: idSantri });
        body.innerHTML = `
          ${bisaInput ? `
          <div class="card">
            <h3>Catat Setoran Baru</h3>
            <form id="form-hafalan">
              <div class="grid-2">
                <div class="field"><label>Juz</label>
                  <select id="hf-juz" required>${Array.from({ length: 30 }, (_, i) => i + 1).map(j => `<option value="${j}">Juz ${j}</option>`).join("")}</select>
                </div>
                <div class="field"><label>Surah</label>
                  <select id="hf-surah" required>
                    <option value="">-- Pilih Surah --</option>
                    ${QURAN_SURAH.map(s => `<option value="${s.no}. ${s.latin} (${s.arab})">${s.no}. ${s.latin} — ${s.arab}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="grid-2">
                <div class="field"><label>Ayat Awal</label><input type="number" id="hf-awal" min="1" required></div>
                <div class="field"><label>Ayat Akhir</label><input type="number" id="hf-akhir" min="1" required></div>
              </div>
              <div class="field">
                <label>Jenis Setoran</label>
                <select id="hf-jenis"><option value="Baru">Setoran Baru</option><option value="Murajaah">Murajaah</option></select>
              </div>
              <div class="field"><label>Catatan (opsional)</label><textarea id="hf-catatan" rows="2"></textarea></div>
              <button class="btn btn-primary btn-block" type="submit">Simpan Setoran</button>
            </form>
          </div>` : ""}
          <div class="card">
            <h3>Riwayat Hafalan</h3>
            ${(data.items || []).length === 0 ? `<div class="empty-state">Belum ada riwayat setoran.</div>` : `
            <div class="table-wrap"><table class="data-table">
              <tr><th>Tanggal</th><th>Juz</th><th>Surah &amp; Ayat</th><th>Jenis</th><th>Catatan</th></tr>
              ${(data.items || []).map(h => `<tr><td>${h.tanggal}</td><td><span class="chip chip-juz">Juz ${h.juz}</span></td><td>${h.surah} : ${h.ayat_awal}-${h.ayat_akhir}</td><td>${h.jenis_setoran}</td><td>${h.catatan || "-"}</td></tr>`).join("")}
            </table></div>`}
          </div>
        `;

        const form = document.getElementById("form-hafalan");
        if (form) {
          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = form.querySelector("button");
            btn.disabled = true; btn.textContent = "Menyimpan...";
            try {
              await Api.call("hafalan.save", {
                id_santri: idSantri,
                juz: document.getElementById("hf-juz").value,
                surah: document.getElementById("hf-surah").value,
                ayat_awal: document.getElementById("hf-awal").value,
                ayat_akhir: document.getElementById("hf-akhir").value,
                jenis_setoran: document.getElementById("hf-jenis").value,
                catatan: document.getElementById("hf-catatan").value
              });
              RefCache.invalidate("dashboard");
              muatHafalan();
            } catch (err) {
              alert(err.message);
              btn.disabled = false; btn.textContent = "Simpan Setoran";
            }
          });
        }
      } catch (err) {
        tampilkanGalat(body, err);
      }
    }
  } catch (err) {
    tampilkanGalat(main, err);
  }
});

// ======================= SANTRI =======================

Router.add("santri", async (root, params) => {
  if (params.id) return renderSantriDetail(root, params.id);
  if (params.form) return renderSantriForm(root, params.editId || null);

  root.innerHTML = Shell("santri", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const profil = Auth.getProfil();
  const isAdmin = profil.peran === "admin";

  try {
    const [kelasData, kelompokData, kamarData] = await Promise.all([Ref.kelas(), Ref.kelompok(), Ref.kamar()]);

    main.innerHTML = `
      <div class="card">
        <div class="flex-between mb-1">
          <h3 style="margin:0;">Cari Santri</h3>
          ${isAdmin ? `<button class="btn btn-primary btn-sm" onclick="Router.go('santri', {form:1})">+ Tambah Santri</button>` : ""}
        </div>
        <div class="field"><input type="text" id="s-cari" placeholder="Cari nama atau NIS..."></div>
        <div class="grid-2">
          <select id="s-kelas"><option value="">Semua Kelas</option>${kelasData.items.map(k => `<option value="${k.id}">${k.nama_kelas}</option>`).join("")}</select>
          <select id="s-kelompok"><option value="">Semua Kelompok PTQ</option>${kelompokData.items.map(k => `<option value="${k.id}">${k.nama_kelompok}</option>`).join("")}</select>
          <select id="s-kamar"><option value="">Semua Kamar</option>${kamarData.items.map(k => `<option value="${k.id}">${k.nama_kamar}</option>`).join("")}</select>
          <select id="s-tipe"><option value="">Semua Tipe</option><option value="Mukim">Mukim</option><option value="Non-Mukim">Non-Mukim</option></select>
        </div>
      </div>
      ${isAdmin ? `
      <div class="card">
        <h3>Impor Massal Data Santri</h3>
        <div class="text-muted text-sm mb-1">Untuk mendata banyak santri sekaligus: unduh template, isi di Excel, lalu unggah kembali di sini.</div>
        <a href="assets/Template_Impor_Santri.xlsx" download class="btn btn-secondary btn-block mb-1">Unduh Template Excel</a>
        <input type="file" id="impor-file" accept=".xlsx,.xls">
        <button class="btn btn-primary btn-block mt-1" id="btn-impor">Unggah &amp; Impor</button>
        <div id="impor-hasil" class="mt-1"></div>
      </div>` : ""}
      <div id="santri-hasil"></div>
    `;

    if (isAdmin) {
      document.getElementById("btn-impor").addEventListener("click", async () => {
        const fileInput = document.getElementById("impor-file");
        const hasilEl = document.getElementById("impor-hasil");
        const file = fileInput.files[0];
        if (!file) { hasilEl.innerHTML = `<div class="alert alert-error">Pilih file Excel dulu.</div>`; return; }

        hasilEl.innerHTML = `<div class="loading">Membaca file...</div>`;
        try {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer, { type: "array" });
          const sheet = wb.Sheets["Data Santri"] || wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { range: 1 }); // lewati baris header (baris 1)

          const items = rows.map(r => ({
            nis: String(r["NIS"] || "").trim(),
            nama: String(r["Nama Lengkap"] || "").trim(),
            jenis_kelamin: String(r["Jenis Kelamin (L/P)"] || "L").trim(),
            tempat_lahir: String(r["Tempat Lahir"] || "").trim(),
            tgl_lahir: r["Tanggal Lahir (YYYY-MM-DD)"] ? String(r["Tanggal Lahir (YYYY-MM-DD)"]).trim() : "",
            alamat: String(r["Alamat"] || "").trim(),
            tipe: String(r["Tipe (Mukim/Non-Mukim)"] || "Mukim").trim(),
            nama_kelas: String(r["Nama Kelas"] || "").trim(),
            nama_kelompok: String(r["Nama Kelompok PTQ"] || "").trim(),
            nama_kamar: String(r["Nama Kamar"] || "").trim()
          })).filter(it => it.nis || it.nama);

          if (items.length === 0) {
            hasilEl.innerHTML = `<div class="alert alert-error">Tidak ada baris data yang terbaca. Pastikan mengisi mulai baris ke-3 di sheet "Data Santri".</div>`;
            return;
          }

          hasilEl.innerHTML = `<div class="loading">Mengimpor ${items.length} baris...</div>`;
          const hasil = await Api.call("santri.importBatch", { items });
          RefCache.invalidate("santri_semua");
          RefCache.invalidate("dashboard");

          const gagal = hasil.detail.filter(d => d.status === "gagal");
          hasilEl.innerHTML = `
            <div class="alert ${gagal.length > 0 ? "alert-error" : "alert-success"}">
              Berhasil: <b>${hasil.jumlah_berhasil}</b> &nbsp; Gagal: <b>${hasil.jumlah_gagal}</b>
            </div>
            ${gagal.length > 0 ? `<div class="table-wrap mt-1"><table class="data-table">
              <tr><th>Baris Excel</th><th>Keterangan</th></tr>
              ${gagal.map(g => `<tr><td>${g.baris}</td><td>${g.pesan}</td></tr>`).join("")}
            </table></div>` : ""}
          `;
          fileInput.value = "";
          cariSantri();
        } catch (err) {
          hasilEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
        }
      });
    }

    const cariEl = document.getElementById("s-cari");
    let timer;
    cariEl.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(cariSantri, 350); });
    ["s-kelas", "s-kelompok", "s-kamar", "s-tipe"].forEach(id => document.getElementById(id).addEventListener("change", cariSantri));

    async function cariSantri() {
      const hasil = document.getElementById("santri-hasil");
      hasil.innerHTML = `<div class="loading">Mencari...</div>`;
      try {
        const data = await Api.call("santri.search", {
          q: cariEl.value, id_kelas: document.getElementById("s-kelas").value,
          id_kelompok: document.getElementById("s-kelompok").value,
          id_kamar: document.getElementById("s-kamar").value,
          tipe: document.getElementById("s-tipe").value
        });
        const items = (data.items || []).filter(s => s.status === "aktif");
        if (items.length === 0) { hasil.innerHTML = `<div class="empty-state">Tidak ada santri ditemukan.</div>`; return; }
        hasil.innerHTML = items.map(s => `
          <div class="card" style="cursor:pointer;" onclick="Router.go('santri', {id:'${s.id}'})">
            <div class="flex-between">
              <div class="flex gap-1" style="align-items:center;">
                ${avatarKecil({ id: s.id, nama: s.nama, url_foto: s.url_foto }, 44)}
                <div>
                  <div style="font-weight:700;">${s.nama}</div>
                  <div class="text-muted text-sm">NIS ${s.nis}</div>
                </div>
              </div>
              <div>${chipTipe(s.tipe)}</div>
            </div>
          </div>
        `).join("");
      } catch (err) {
        tampilkanGalat(hasil, err);
      }
    }
    cariSantri();
  } catch (err) {
    tampilkanGalat(main, err);
  }
});

async function renderSantriDetail(root, id) {
  root.innerHTML = Shell("santri", `<div class="loading">Memuat detail...</div>`);
  const main = document.querySelector("main.content");
  const isAdmin = Auth.boleh("admin");
  const isAdminPimpinan = Auth.boleh("admin", "pimpinan");
  try {
    const data = await Api.call("santri.detail", { id });
    const s = data.santri;
    main.innerHTML = `
      <button class="btn btn-secondary btn-sm mb-1" onclick="Router.go('santri')">&larr; Kembali</button>
      <div class="card">
        <div class="flex-between">
          <div class="flex gap-1" style="align-items:center;">
            ${avatarKecil({ id: s.id, nama: s.nama, url_foto: s.url_foto }, 56)}
            <div>
              <h3 style="margin:0;">${s.nama}</h3>
              <div class="text-muted text-sm">NIS ${s.nis} &bull; ${s.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</div>
            </div>
          </div>
          <div>${chipTipe(s.tipe)}</div>
        </div>
        <div class="mt-2 text-sm">
          <div><b>Tempat/Tgl Lahir:</b> ${s.tempat_lahir || "-"}, ${s.tgl_lahir || "-"}</div>
          <div><b>Alamat:</b> ${s.alamat || "-"}</div>
        </div>
        ${isAdmin ? `<button class="btn btn-secondary btn-sm mt-2" onclick="Router.go('santri',{form:1, editId:'${s.id}'})">Edit Data Santri</button>` : ""}
        ${isAdminPimpinan ? `<button class="btn btn-accent btn-sm mt-2" onclick="Router.go('laporan',{id:'${s.id}'})">Cetak Laporan</button>` : ""}
      </div>

      <div class="card">
        <h3>Riwayat Hafalan (${data.riwayat_hafalan.length})</h3>
        ${data.riwayat_hafalan.length === 0 ? `<div class="empty-state">Belum ada data.</div>` :
          data.riwayat_hafalan.slice(0, 5).map(h => `<div class="text-sm mb-1">${h.tanggal} &mdash; Juz ${h.juz}, ${h.surah}:${h.ayat_awal}-${h.ayat_akhir}</div>`).join("")}
      </div>

      <div class="card">
        <h3>Riwayat Presensi Sekolah (${data.riwayat_presensi_sekolah.length})</h3>
        ${data.riwayat_presensi_sekolah.length === 0 ? `<div class="empty-state">Belum ada data.</div>` :
          data.riwayat_presensi_sekolah.slice(0, 5).map(p => `<div class="text-sm mb-1">${p.tanggal} ${chipStatus(p.status)}</div>`).join("")}
      </div>

      <div class="card">
        <h3>Riwayat Prestasi (${data.riwayat_prestasi.length})</h3>
        ${data.riwayat_prestasi.length === 0 ? `<div class="empty-state">Belum ada data.</div>` :
          data.riwayat_prestasi.map(p => `<div class="text-sm mb-1"><b>${p.nama_prestasi}</b> &mdash; ${p.tingkat} (${p.tanggal})</div>`).join("")}
      </div>

      <div id="pesan-wrap"></div>
    `;
    await pasangPesanWidget(document.getElementById("pesan-wrap"), s.id);
  } catch (err) {
    tampilkanGalat(main, err);
  }
}

async function renderSantriForm(root, editId) {
  root.innerHTML = Shell("santri", `<div class="loading">Memuat form...</div>`);
  const main = document.querySelector("main.content");
  try {
    const [kelasData, kelompokData, kamarData] = await Promise.all([Ref.kelas(), Ref.kelompok(), Ref.kamar()]);
    let existing = null;
    if (editId) existing = (await Api.call("santri.detail", { id: editId })).santri;

    const v = (f, d) => existing ? (existing[f] || d || "") : (d || "");

    main.innerHTML = `
      <button class="btn btn-secondary btn-sm mb-1" onclick="Router.go('santri')">&larr; Batal</button>
      <div class="card">
        <h3>${existing ? "Edit Santri" : "Tambah Santri"}</h3>
        <form id="form-santri">
          <div class="grid-2">
            <div class="field"><label>NIS</label><input type="text" id="f-nis" value="${v("nis")}" required></div>
            <div class="field"><label>Nama Lengkap</label><input type="text" id="f-nama" value="${v("nama")}" required></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Jenis Kelamin</label>
              <select id="f-jk"><option value="L" ${v("jenis_kelamin") === "L" ? "selected" : ""}>Laki-laki</option><option value="P" ${v("jenis_kelamin") === "P" ? "selected" : ""}>Perempuan</option></select>
            </div>
            <div class="field"><label>Tipe Santri</label>
              <select id="f-tipe"><option value="Mukim" ${v("tipe") === "Mukim" ? "selected" : ""}>Mukim</option><option value="Non-Mukim" ${v("tipe") === "Non-Mukim" ? "selected" : ""}>Non-Mukim</option></select>
            </div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Tempat Lahir</label><input type="text" id="f-tempat" value="${v("tempat_lahir")}"></div>
            <div class="field"><label>Tanggal Lahir</label><input type="date" id="f-tgl" value="${v("tgl_lahir")}"></div>
          </div>
          <div class="field"><label>Alamat</label><textarea id="f-alamat" rows="2">${v("alamat")}</textarea></div>
          <div class="grid-2">
            <div class="field"><label>Kelas</label><select id="f-kelas"><option value="">-</option>${kelasData.items.map(k => `<option value="${k.id}" ${v("id_kelas") === k.id ? "selected" : ""}>${k.nama_kelas}</option>`).join("")}</select></div>
            <div class="field"><label>Kelompok PTQ</label><select id="f-kelompok"><option value="">-</option>${kelompokData.items.map(k => `<option value="${k.id}" ${v("id_kelompok") === k.id ? "selected" : ""}>${k.nama_kelompok}</option>`).join("")}</select></div>
          </div>
          <div class="field"><label>Kamar</label><select id="f-kamar"><option value="">-</option>${kamarData.items.map(k => `<option value="${k.id}" ${v("id_kamar") === k.id ? "selected" : ""}>${k.nama_kamar}</option>`).join("")}</select></div>
          <div class="field"><label>Foto (opsional, otomatis dikecilkan)</label><div id="f-foto-preview" style="margin-bottom:6px;"></div><input type="file" id="f-foto" accept="image/*"></div>
          <button class="btn btn-primary btn-block" type="submit">Simpan</button>
        </form>
      </div>
    `;

    document.getElementById("f-foto").addEventListener("change", async (e) => {
      const f = e.target.files[0];
      const prev = document.getElementById("f-foto-preview");
      if (!f) { prev.innerHTML = ""; return; }
      try {
        const hasil = await kompresFoto(f);
        prev.innerHTML = `<img src="${hasil}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;"> <span class="text-muted text-sm">${Math.round(hasil.length / 1024)} KB setelah dikecilkan</span>`;
      } catch (err) { prev.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
    });

    document.getElementById("form-santri").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector("button");
      btn.disabled = true; btn.textContent = "Menyimpan...";
      try {
        const data = {
          id: existing ? existing.id : undefined,
          nis: document.getElementById("f-nis").value,
          nama: document.getElementById("f-nama").value,
          jenis_kelamin: document.getElementById("f-jk").value,
          tipe: document.getElementById("f-tipe").value,
          tempat_lahir: document.getElementById("f-tempat").value,
          tgl_lahir: document.getElementById("f-tgl").value,
          alamat: document.getElementById("f-alamat").value,
          id_kelas: document.getElementById("f-kelas").value,
          id_kelompok: document.getElementById("f-kelompok").value,
          id_kamar: document.getElementById("f-kamar").value
        };
        const fotoFile = document.getElementById("f-foto").files[0];
        const payload = { data };
        if (fotoFile) {
          payload.foto_base64 = await kompresFoto(fotoFile);
          payload.foto_nama = fotoFile.name;
        }
        const res = await Api.call("santri.save", payload);
        RefCache.invalidate("santri_semua"); // data santri berubah, jangan pakai cache lama
        RefCache.invalidate("dashboard");
        if (res.peringatan) alert(res.peringatan); // foto gagal tersimpan, tapi data lain aman
        Router.go("santri", { id: res.item.id });
      } catch (err) {
        alert(err.message);
        btn.disabled = false; btn.textContent = "Simpan";
      }
    });
  } catch (err) {
    tampilkanGalat(main, err);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ======================= DATA MASTER =======================

const MASTER_TABS = [
  { key: "kelas", label: "Kelas", fields: [{ id: "nama_kelas", label: "Nama Kelas" }, { id: "wali_kelas", label: "Wali Kelas" }] },
  { key: "kelompok", label: "Kelompok PTQ", fields: [{ id: "nama_kelompok", label: "Nama Kelompok" }, { id: "pengajar", label: "Pengajar" }] },
  { key: "kamar", label: "Kamar", fields: [{ id: "nama_kamar", label: "Nama Kamar" }, { id: "kapasitas", label: "Kapasitas" }] },
  { key: "wali", label: "Wali Santri", fields: [{ id: "nama_wali", label: "Nama Wali" }, { id: "hubungan", label: "Hubungan" }, { id: "kontak", label: "No. WhatsApp" }] }
];

Router.add("master", async (root, params) => {
  const isAdmin = Auth.boleh("admin");
  const activeTab = params.tab || "kelas";
  root.innerHTML = Shell("master", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const tab = MASTER_TABS.find(t => t.key === activeTab) || MASTER_TABS[0];

  main.innerHTML = `
    <div class="flex gap-1 mb-1" style="overflow-x:auto;">
      ${MASTER_TABS.map(t => `<button class="btn ${t.key === activeTab ? "btn-primary" : "btn-secondary"} btn-sm" onclick="Router.go('master',{tab:'${t.key}'})">${t.label}</button>`).join("")}
    </div>
    <div id="master-list"></div>
  `;

  async function muat() {
    const listEl = document.getElementById("master-list");
    listEl.innerHTML = `<div class="loading">Memuat data...</div>`;
    try {
      const data = await Api.call("master.list", { entity: tab.key });
      data.items = data.items || [];
      listEl.innerHTML = `
        ${isAdmin ? `<div class="card"><h3>Tambah ${tab.label}</h3>
          <form id="form-master">
            ${tab.fields.map(f => `<div class="field"><label>${f.label}</label><input type="text" id="fm-${f.id}" required></div>`).join("")}
            <button class="btn btn-primary btn-block" type="submit">Tambah</button>
          </form>
        </div>` : ""}
        <div class="card">
          <h3>Daftar ${tab.label}</h3>
          ${(data.items || []).length === 0 ? `<div class="empty-state">Belum ada data.</div>` : `
          <div class="table-wrap"><table class="data-table">
            <tr>${tab.fields.map(f => `<th>${f.label}</th>`).join("")}${isAdmin ? "<th>Aksi</th>" : ""}</tr>
            ${(data.items || []).map(item => `<tr>${tab.fields.map(f => `<td>${item[f.id] || "-"}</td>`).join("")}${isAdmin ? `<td><button class="btn btn-secondary btn-sm" onclick='editMaster("${tab.key}","${item.id}")'>Edit</button></td>` : ""}</tr>`).join("")}
          </table></div>`}
        </div>
      `;

      const form = document.getElementById("form-master");
      if (form) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const btn = form.querySelector("button");
          btn.disabled = true;
          const payload = {};
          tab.fields.forEach(f => payload[f.id] = document.getElementById("fm-" + f.id).value);
          try {
            await Api.call("master.save", { entity: tab.key, data: payload });
            RefCache.invalidate(tab.key); // data master berubah, refresh cache lintas halaman
            muat();
          } catch (err) { alert(err.message); btn.disabled = false; }
        });
      }
    } catch (err) {
      tampilkanGalat(listEl, err);
    }
  }
  muat();
});

window.editMaster = async function (entity, id) {
  const tab = MASTER_TABS.find(t => t.key === entity);
  const data = await Api.call("master.list", { entity });
  const item = (data.items || []).find(i => i.id === id);
  if (!item) return;
  const nilaiBaru = {};
  for (const f of tab.fields) {
    const v = prompt(f.label + ":", item[f.id] || "");
    if (v === null) return; // dibatalkan
    nilaiBaru[f.id] = v;
  }
  nilaiBaru.id = id;
  try {
    await Api.call("master.save", { entity, data: nilaiBaru });
    RefCache.invalidate(entity); // data master berubah, refresh cache lintas halaman
    Router.render();
  } catch (err) { alert(err.message); }
};

// ======================= PRESTASI =======================

Router.add("prestasi", async (root) => {
  root.innerHTML = Shell("prestasi", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const isAdmin = Auth.boleh("admin");
  try {
    const res = await Ref.santriSemua();
    const santri = res.items.filter(s => s.status === "aktif");

    main.innerHTML = `
      <div class="card">
        <h3>Pilih Santri</h3>
        <select id="pr-santri"><option value="">-- Pilih Santri --</option>${santri.map(s => `<option value="${s.id}">${s.nama} (${s.nis})</option>`).join("")}</select>
      </div>
      <div id="prestasi-body"></div>
    `;
    document.getElementById("pr-santri").addEventListener("change", muat);

    async function muat() {
      const idSantri = document.getElementById("pr-santri").value;
      const body = document.getElementById("prestasi-body");
      if (!idSantri) { body.innerHTML = ""; return; }
      body.innerHTML = `<div class="loading">Memuat...</div>`;
      try {
        const data = await Api.call("prestasi.list", { id_santri: idSantri });
        body.innerHTML = `
          ${isAdmin ? `
          <div class="card">
            <h3>Tambah Prestasi</h3>
            <form id="form-prestasi">
              <div class="field"><label>Nama Prestasi</label><input type="text" id="pr-nama" required></div>
              <div class="grid-2">
                <div class="field"><label>Tingkat</label><input type="text" id="pr-tingkat" placeholder="Kabupaten / Provinsi / Nasional" required></div>
                <div class="field"><label>Tanggal</label><input type="date" id="pr-tanggal" value="${new Date().toISOString().slice(0, 10)}"></div>
              </div>
              <div class="field"><label>Keterangan</label><textarea id="pr-ket" rows="2"></textarea></div>
              <div class="field"><label>Bukti / Sertifikat (opsional)</label><input type="file" id="pr-file" accept="image/*,application/pdf"></div>
              <button class="btn btn-primary btn-block" type="submit">Simpan Prestasi</button>
            </form>
          </div>` : ""}
          <div class="card">
            <h3>Riwayat Prestasi</h3>
            ${(data.items || []).length === 0 ? `<div class="empty-state">Belum ada prestasi tercatat.</div>` :
              (data.items || []).map(p => `<div class="mb-1" style="border-bottom:1px solid var(--border-subtle);padding-bottom:8px;">
                <b>${p.nama_prestasi}</b> &mdash; ${p.tingkat}<br>
                <span class="text-muted text-sm">${p.tanggal} &bull; ${p.keterangan || "-"}</span>
                ${p.url_berkas ? `<br><a href="${p.url_berkas}" target="_blank" class="text-sm">Lihat berkas &rarr;</a>` : ""}
              </div>`).join("")}
          </div>
        `;
        const form = document.getElementById("form-prestasi");
        if (form) {
          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = form.querySelector("button");
            btn.disabled = true; btn.textContent = "Menyimpan...";
            try {
              const payload = {
                data: {
                  id_santri: idSantri,
                  nama_prestasi: document.getElementById("pr-nama").value,
                  tingkat: document.getElementById("pr-tingkat").value,
                  tanggal: document.getElementById("pr-tanggal").value,
                  keterangan: document.getElementById("pr-ket").value
                }
              };
              const file = document.getElementById("pr-file").files[0];
              if (file) { payload.file_base64 = await fileToBase64(file); payload.file_nama = file.name; }
              const hasil = await Api.call("prestasi.save", payload);
              if (hasil.peringatan) alert(hasil.peringatan); // berkas gagal tersimpan, tapi data lain aman
              muat();
            } catch (err) { alert(err.message); btn.disabled = false; btn.textContent = "Simpan Prestasi"; }
          });
        }
      } catch (err) { tampilkanGalat(body, err); }
    }
  } catch (err) { tampilkanGalat(main, err); }
});

// ======================= LAPORAN =======================

Router.add("laporan", async (root, params) => {
  root.innerHTML = Shell("laporan", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  try {
    const res = await Ref.santriSemua();
    const santri = res.items.filter(s => s.status === "aktif");

    main.innerHTML = `
      <div class="card">
        <h3>Pilih Santri &amp; Periode</h3>
        <div class="field"><label>Santri</label>
          <select id="lp-santri">${santri.map(s => `<option value="${s.id}" ${params.id === s.id ? "selected" : ""}>${s.nama} (${s.nis})</option>`).join("")}</select>
        </div>
        <div class="grid-2">
          <div class="field"><label>Dari Tanggal</label><input type="date" id="lp-dari"></div>
          <div class="field"><label>Sampai Tanggal</label><input type="date" id="lp-sampai" value="${new Date().toISOString().slice(0, 10)}"></div>
        </div>
        <div class="flex gap-1">
          <button class="btn btn-primary btn-block" id="btn-lp-hafalan">Cetak Capaian Hafalan</button>
          <button class="btn btn-accent btn-block" id="btn-lp-kehadiran">Cetak Rekap Kehadiran</button>
        </div>
        <div id="lp-status" class="mt-1"></div>
      </div>
    `;

    function unduhPdf(base64, namaFile) {
      const link = document.createElement("a");
      link.href = "data:application/pdf;base64," + base64;
      link.download = namaFile;
      link.click();
    }

    document.getElementById("btn-lp-hafalan").addEventListener("click", async (e) => {
      await cetak("laporan.hafalan", e.target);
    });
    document.getElementById("btn-lp-kehadiran").addEventListener("click", async (e) => {
      await cetak("laporan.kehadiran", e.target);
    });

    async function cetak(action, btn) {
      const statusEl = document.getElementById("lp-status");
      const idSantri = document.getElementById("lp-santri").value;
      if (!idSantri) { statusEl.innerHTML = `<div class="alert alert-error">Pilih santri terlebih dahulu.</div>`; return; }
      btn.disabled = true;
      statusEl.innerHTML = `<div class="loading">Menyusun PDF...</div>`;
      try {
        const data = await Api.call(action, {
          id_santri: idSantri,
          dari: document.getElementById("lp-dari").value,
          sampai: document.getElementById("lp-sampai").value
        });
        unduhPdf(data.base64, data.nama_file);
        statusEl.innerHTML = `<div class="alert alert-success">Laporan berhasil diunduh: ${data.nama_file}</div>`;
      } catch (err) {
        statusEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      } finally {
        btn.disabled = false;
      }
    }
  } catch (err) { tampilkanGalat(main, err); }
});

// ======================= AKUN (khusus admin) =======================

function checkboxGroup(namaId, daftar, labelField, selectedCsv) {
  const selected = (selectedCsv || "").split(",").map(s => s.trim()).filter(Boolean);
  if (daftar.length === 0) return `<div class="text-muted text-sm">Belum ada data. Tambahkan dulu di menu Data Master.</div>`;
  return `<div style="max-height:160px;overflow-y:auto;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:8px;">
    ${daftar.map(item => `
      <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-weight:400;font-size:13px;cursor:pointer;">
        <input type="checkbox" class="${namaId}-item" value="${item.id}" ${selected.indexOf(item.id) !== -1 ? "checked" : ""}>
        ${item[labelField]}
      </label>
    `).join("")}
  </div>`;
}

function ambilChecklist(namaId) {
  return Array.from(document.querySelectorAll(`.${namaId}-item:checked`)).map(el => el.value).join(",");
}

Router.add("akun", async (root, params) => {
  root.innerHTML = Shell("akun", `<div class="loading">Memuat...</div>`);
  const main = document.querySelector("main.content");
  const editingId = params.edit || null;

  async function muat() {
    try {
      const [akunRes, kelasRes, kelompokRes, santriRes] = await Promise.all([
        Api.call("akun.list", {}), // daftar akun tidak di-cache (sensitif & sering berubah)
        Ref.kelas(),
        Ref.kelompok(),
        Ref.santriSemua()
      ]);
      const akunList = akunRes.items || [];
      const daftarKelas = kelasRes.items || [];
      const daftarKelompok = kelompokRes.items || [];
      const daftarSantri = (santriRes.items || []).filter(s => s.status === "aktif");
      const existing = editingId ? akunList.find(a => a.id === editingId) : null;
      if (editingId && !existing) { Router.go("akun"); return; }

      const v = (f, d) => existing ? (existing[f] || d || "") : (d || "");

      main.innerHTML = `
        <div class="card">
          <h3>${existing ? "Edit Akun: " + existing.nama : "Buat Akun Baru"}</h3>
          <form id="form-akun">
            <div class="field" style="text-align:center;">
              <div id="ak-foto-preview" style="margin-bottom:8px;">${existing && existing.url_foto ? avatarKecil({ id: existing.id, nama: existing.nama, url_foto: existing.url_foto }, 72) : ""}</div>
              <label>Foto (opsional)</label>
              <input type="file" id="ak-foto" accept="image/*">
            </div>
            <div class="grid-2">
              <div class="field"><label>Nama Lengkap</label><input type="text" id="ak-nama" value="${v("nama")}" required></div>
              <div class="field"><label>Username</label><input type="text" id="ak-username" value="${v("username")}" required></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Peran</label>
                <select id="ak-peran">
                  <option value="admin" ${v("peran") === "admin" ? "selected" : ""}>Admin / Tim Kantor</option>
                  <option value="guru_mapel" ${v("peran") === "guru_mapel" ? "selected" : ""}>Guru Mata Pelajaran</option>
                  <option value="pengajar_tpq" ${v("peran") === "pengajar_tpq" ? "selected" : ""}>Pengajar PTQ / Tahfidz</option>
                  <option value="pimpinan" ${v("peran") === "pimpinan" ? "selected" : ""}>Pimpinan</option>
                  <option value="wali_santri" ${v("peran") === "wali_santri" ? "selected" : ""}>Wali Santri (Orang Tua)</option>
                </select>
              </div>
              <div class="field" id="ak-mapel-wrap"><label>Mata Pelajaran / Bidang (opsional)</label><input type="text" id="ak-mapel" value="${v("mapel") || v("bidang")}" placeholder="mis. Matematika, Tahfidz"></div>
            </div>
            <div class="field" id="ak-kelas-wrap" style="display:none;">
              <label>Kelas yang Diampu (bisa pilih lebih dari satu)</label>
              ${checkboxGroup("ak-kelas", daftarKelas, "nama_kelas", v("kelas_diampu"))}
            </div>
            <div class="field" id="ak-kelompok-wrap" style="display:none;">
              <label>Kelompok PTQ yang Diampu (bisa pilih lebih dari satu)</label>
              ${checkboxGroup("ak-kelompok", daftarKelompok, "nama_kelompok", v("kelompok_diampu"))}
            </div>
            <div class="field" id="ak-wali-wrap" style="display:none;">
              <label>Wali Kelas dari (opsional)</label>
              <select id="ak-wali-kelas">
                <option value="">-- Bukan wali kelas --</option>
                ${daftarKelas.map(k => `<option value="${k.id}" ${v("wali_kelas_id") === k.id ? "selected" : ""}>${k.nama_kelas}</option>`).join("")}
              </select>
            </div>
            <div class="field" id="ak-santri-anak-wrap" style="display:none;">
              <label>Santri (Anak)</label>
              <select id="ak-santri-anak">
                <option value="">-- Pilih Santri --</option>
                ${daftarSantri.map(s => `<option value="${s.id}" ${v("id_santri_anak") === s.id ? "selected" : ""}>${s.nama} (NIS ${s.nis})</option>`).join("")}
              </select>
              <div class="text-muted text-sm mt-1">Akun ini hanya akan bisa melihat data santri yang dipilih di sini.</div>
            </div>
            <button class="btn btn-primary btn-block" type="submit">${existing ? "Simpan Perubahan" : "Buat Akun"}</button>
            ${existing ? `<button type="button" class="btn btn-secondary btn-block mt-1" onclick="Router.go('akun')">Batal Edit</button>` : ""}
          </form>
          <div id="akun-hasil" class="mt-1"></div>
        </div>

        ${existing ? `
        <div class="card">
          <h3>Ubah Sandi: ${existing.nama}</h3>
          <div class="field"><label>Sandi Baru (kosongkan untuk sandi acak otomatis)</label><input type="text" id="ak-sandi-baru" placeholder="Minimal 6 karakter, atau kosongkan"></div>
          <button class="btn btn-accent btn-block" id="btn-ubah-sandi">Terapkan Sandi Baru</button>
          <div id="sandi-hasil" class="mt-1"></div>
        </div>` : ""}

        <div class="card">
          <h3>Daftar Akun</h3>
          <div class="table-wrap"><table class="data-table">
            <tr><th></th><th>Nama</th><th>Username</th><th>Peran</th><th>Status</th><th>Aksi</th></tr>
            ${akunList.map(a => `<tr>
              <td>${avatarKecil({ id: a.id, nama: a.nama, url_foto: a.url_foto }, 30)}</td>
              <td>${a.nama}${a.mapel ? `<div class="text-muted text-sm">${a.mapel}</div>` : ""}</td>
              <td>${a.username}</td><td>${labelPeran(a.peran)}</td>
              <td>${a.status === "aktif" ? `<span class="chip chip-hadir">Aktif</span>` : `<span class="chip chip-nonaktif">Nonaktif</span>`}</td>
              <td style="white-space:nowrap;">
                <button class="btn btn-secondary btn-sm" onclick="Router.go('akun',{edit:'${a.id}'})">Edit</button>
                <button class="btn btn-secondary btn-sm" onclick='toggleAkun("${a.id}")'>${a.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}</button>
              </td>
            </tr>`).join("")}
          </table></div>
        </div>
      `;

      const peranSelect = document.getElementById("ak-peran");
      function toggleRefFields() {
        const p = peranSelect.value;
        document.getElementById("ak-kelas-wrap").style.display = p === "guru_mapel" ? "block" : "none";
        document.getElementById("ak-kelompok-wrap").style.display = p === "pengajar_tpq" ? "block" : "none";
        document.getElementById("ak-wali-wrap").style.display = p === "guru_mapel" ? "block" : "none";
        document.getElementById("ak-santri-anak-wrap").style.display = p === "wali_santri" ? "block" : "none";
        document.getElementById("ak-mapel-wrap").style.display = p === "wali_santri" ? "none" : "block";
      }
      peranSelect.addEventListener("change", toggleRefFields);
      toggleRefFields();

      document.getElementById("ak-foto").addEventListener("change", async (e) => {
        const f = e.target.files[0];
        const prev = document.getElementById("ak-foto-preview");
        if (!f) return;
        try {
          const hasil = await kompresFoto(f);
          prev.innerHTML = `<img src="${hasil}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;"><div class="text-muted text-sm">${Math.round(hasil.length / 1024)} KB setelah dikecilkan</div>`;
        } catch (err) { prev.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
      });

      document.getElementById("form-akun").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector("button[type=submit]");
        btn.disabled = true; btn.textContent = "Menyimpan...";
        try {
          const dataAkun = {
            nama: document.getElementById("ak-nama").value,
            username: document.getElementById("ak-username").value,
            peran: peranSelect.value,
            mapel: document.getElementById("ak-mapel").value,
            bidang: document.getElementById("ak-mapel").value,
            kelas_diampu: peranSelect.value === "guru_mapel" ? ambilChecklist("ak-kelas") : "",
            kelompok_diampu: peranSelect.value === "pengajar_tpq" ? ambilChecklist("ak-kelompok") : "",
            wali_kelas_id: peranSelect.value === "guru_mapel" ? document.getElementById("ak-wali-kelas").value : "",
            id_santri_anak: peranSelect.value === "wali_santri" ? document.getElementById("ak-santri-anak").value : ""
          };
          if (peranSelect.value === "wali_santri" && !dataAkun.id_santri_anak) {
            throw new Error("Pilih santri (anak) untuk akun wali santri ini.");
          }
          const payload = { data: dataAkun };
          const fotoFile = document.getElementById("ak-foto").files[0];
          if (fotoFile) { payload.foto_base64 = await kompresFoto(fotoFile); payload.foto_nama = fotoFile.name; }

          if (existing) {
            dataAkun.id = existing.id;
            const hasilUpdate = await Api.call("akun.update", payload);
            document.getElementById("akun-hasil").innerHTML = hasilUpdate.peringatan
              ? `<div class="alert alert-error">${hasilUpdate.peringatan}</div>`
              : `<div class="alert alert-success">Perubahan disimpan.</div>`;
            muat();
          } else {
            const data = await Api.call("akun.create", payload);
            document.getElementById("akun-hasil").innerHTML = `
              <div class="alert alert-success">Akun dibuat. Username: <b>${data.username}</b>, Sandi awal: <b>${data.sandi_awal}</b>. Catat sandi ini sekarang.</div>
              ${data.peringatan ? `<div class="alert alert-error mt-1">${data.peringatan}</div>` : ""}
            `;
            muat();
          }
        } catch (err) {
          alert(err.message);
          btn.disabled = false; btn.textContent = existing ? "Simpan Perubahan" : "Buat Akun";
        }
      });

      const btnUbahSandi = document.getElementById("btn-ubah-sandi");
      if (btnUbahSandi) {
        btnUbahSandi.addEventListener("click", async () => {
          const sandiInput = document.getElementById("ak-sandi-baru").value.trim();
          if (sandiInput && sandiInput.length < 6) {
            document.getElementById("sandi-hasil").innerHTML = `<div class="alert alert-error">Sandi minimal 6 karakter, atau kosongkan untuk sandi acak.</div>`;
            return;
          }
          btnUbahSandi.disabled = true; btnUbahSandi.textContent = "Memproses...";
          try {
            const data = await Api.call("akun.resetPassword", { id: existing.id, sandi_baru: sandiInput || undefined });
            document.getElementById("sandi-hasil").innerHTML = `<div class="alert alert-success">Sandi baru: <b>${data.sandi_baru}</b>. Catat sekarang, sampaikan ke yang bersangkutan.</div>`;
          } catch (err) {
            document.getElementById("sandi-hasil").innerHTML = `<div class="alert alert-error">${err.message}</div>`;
          } finally {
            btnUbahSandi.disabled = false; btnUbahSandi.textContent = "Terapkan Sandi Baru";
          }
        });
      }
    } catch (err) { tampilkanGalat(main, err); }
  }
  muat();
  window.__muatAkun = muat;
});

window.toggleAkun = async function (id) {
  if (!confirm("Ubah status akun ini?")) return;
  try { await Api.call("akun.toggle", { id }); window.__muatAkun(); } catch (err) { alert(err.message); }
};

// ======================= WIDGET PESAN (dipakai di Anak Saya & Detail Santri) =======================

function bubbleWaktu(waktu) {
  try {
    var d = new Date(waktu.replace(' ', 'T'));
    return d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) { return waktu; }
}

async function pasangPesanWidget(container, idSantri) {
  const profil = Auth.getProfil();
  container.innerHTML = `
    <div class="card">
      <h3>Pesan</h3>
      <div id="pesan-list" class="loading">Memuat pesan...</div>
      <form id="form-pesan" class="mt-2" style="display:flex;gap:8px;">
        <input type="text" id="pesan-isi" placeholder="Tulis pesan..." style="flex:1;" required>
        <button class="btn btn-primary" type="submit" style="width:auto;padding:0 16px;">Kirim</button>
      </form>
    </div>
  `;

  async function muatPesan() {
    const listEl = document.getElementById("pesan-list");
    try {
      const data = await Api.call("pesan.list", { id_santri: idSantri });
      const items = data.items || [];
      if (items.length === 0) {
        listEl.innerHTML = `<div class="empty-state">Belum ada pesan. Mulai percakapan di bawah.</div>`;
      } else {
        listEl.innerHTML = `<div style="max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
          ${items.map(p => {
            const milikSaya = p.dari_peran === profil.peran && p.dari_nama === profil.nama;
            return `<div style="align-self:${milikSaya ? "flex-end" : "flex-start"};max-width:80%;">
              <div style="background:${milikSaya ? "var(--emerald-surface)" : "#F1F5F9"};border-radius:12px;padding:8px 12px;font-size:13px;">
                ${p.isi}
              </div>
              <div class="text-muted" style="font-size:10px;margin-top:2px;${milikSaya ? "text-align:right;" : ""}">${p.dari_nama} (${labelPeran(p.dari_peran)}) &middot; ${bubbleWaktu(p.waktu)}</div>
            </div>`;
          }).join("")}
        </div>`;
      }
    } catch (err) {
      listEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  }

  document.getElementById("form-pesan").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("pesan-isi");
    const isi = input.value.trim();
    if (!isi) return;
    const btn = e.target.querySelector("button");
    btn.disabled = true;
    try {
      await Api.call("pesan.kirim", { id_santri: idSantri, isi });
      input.value = "";
      await muatPesan();
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
    }
  });

  await muatPesan();
}

// ======================= ANAK SAYA (portal wali santri) =======================

Router.add("anaksaya", async (root) => {
  root.innerHTML = Shell("anaksaya", `<div class="loading">Memuat data anak Anda...</div>`);
  const main = document.querySelector("main.content");
  try {
    const data = await Api.call("wali.anakSaya", {});
    const s = data.santri;
    main.innerHTML = `
      <div class="card" style="text-align:center;">
        <div style="margin:0 auto 10px;">${avatarKecil({ id: s.id, nama: s.nama, url_foto: s.url_foto }, 96)}</div>
        <h3 style="margin:0;font-size:20px;">${s.nama}</h3>
        <div class="text-muted text-sm">NIS ${s.nis} &bull; ${chipTipe(s.tipe)}</div>
      </div>

      <div class="card">
        <h3>Tabel Pemantauan Bulan Ini (${namaBulanIndo(bulanIniStr())})</h3>
        ${matrixAnakBulanIni(data, bulanIniStr())}
      </div>

      <div class="card">
        <h3>Progres Hafalan Terbaru</h3>
        ${data.riwayat_hafalan.length === 0 ? `<div class="empty-state">Belum ada data hafalan.</div>` :
          data.riwayat_hafalan.slice(0, 5).map(h => `<div class="text-sm mb-1">${h.tanggal} &mdash; Juz ${h.juz}, ${h.surah}:${h.ayat_awal}-${h.ayat_akhir} <span class="text-muted">(${h.jenis_setoran})</span></div>`).join("")}
      </div>

      <div class="card">
        <h3>Kehadiran Terbaru (Sekolah Pagi)</h3>
        ${data.riwayat_presensi_sekolah.length === 0 ? `<div class="empty-state">Belum ada data.</div>` :
          data.riwayat_presensi_sekolah.slice(-5).reverse().map(p => `<div class="text-sm mb-1">${p.tanggal} ${chipStatus(p.status)} ${p.mapel ? `<span class="text-muted">&middot; ${p.mapel}</span>` : ""}</div>`).join("")}
      </div>

      <div class="card">
        <h3>Prestasi</h3>
        ${data.riwayat_prestasi.length === 0 ? `<div class="empty-state">Belum ada prestasi tercatat.</div>` :
          data.riwayat_prestasi.map(p => `<div class="text-sm mb-1"><b>${p.nama_prestasi}</b> &mdash; ${p.tingkat} (${p.tanggal})</div>`).join("")}
      </div>

      <div id="pesan-wrap"></div>
    `;
    await pasangPesanWidget(document.getElementById("pesan-wrap"), s.id);
  } catch (err) {
    tampilkanGalat(main, err);
  }
});

// ======================= REKAP BULANAN (dipakai di Presensi & Hafalan) =======================

function bulanIniStr() {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

function namaBulanIndo(bulanStr) {
  const [tahun, bulan] = bulanStr.split("-");
  const nama = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${nama[parseInt(bulan, 10) - 1]} ${tahun}`;
}

// jenisRekap: 'presensi' | 'hafalan'. opsi: { daftarKelas, daftarKelompok, tampilkanPilihanJenisRef }
function renderRekapBulananCard(container, jenisRekap, opsi) {
  const bulanDefault = bulanIniStr();
  const adaDuaRef = jenisRekap === "presensi" && opsi.tampilkanPilihanJenisRef;

  container.innerHTML = `
    <div class="card">
      <h3>Rekap Bulanan ${jenisRekap === "presensi" ? "Kehadiran" : "Hafalan"}</h3>
      <div class="text-muted text-sm mb-1">Bulan berjalan selalu bisa dilihat di sini; begitu berganti bulan, bulan sebelumnya tetap tersimpan rapi dan bisa dibuka kapan saja lewat pemilih bulan.</div>
      ${adaDuaRef ? `
      <div class="field">
        <label>Jenis</label>
        <select id="rb-jenis-ref">
          <option value="kelas">Sekolah Pagi (per Kelas)</option>
          <option value="kelompok">PTQ (per Kelompok)</option>
        </select>
      </div>` : ""}
      <div class="field" id="rb-ref-wrap"></div>
      <div class="field">
        <label>Bulan</label>
        <input type="month" id="rb-bulan" value="${bulanDefault}">
      </div>
      <div class="flex gap-1">
        <button class="btn btn-primary btn-block" id="rb-tampilkan">Tampilkan Rekap</button>
        <button class="btn btn-accent btn-block" id="rb-cetak">Cetak PDF</button>
      </div>
      <div id="rb-hasil" class="mt-2"></div>
    </div>
  `;

  function refTypeAktif() {
    if (!adaDuaRef) return opsi.refTypeTunggal || (jenisRekap === "hafalan" ? "kelompok" : "kelas");
    return document.getElementById("rb-jenis-ref").value;
  }

  function renderRefSelect() {
    const refType = refTypeAktif();
    const wrap = document.getElementById("rb-ref-wrap");
    const daftar = refType === "kelas" ? opsi.daftarKelas : opsi.daftarKelompok;
    const labelField = refType === "kelas" ? "nama_kelas" : "nama_kelompok";
    const labelTampil = refType === "kelas" ? "Kelas" : "Kelompok PTQ";
    if (daftar.length === 0) {
      wrap.innerHTML = `<div class="empty-state">Tidak ada ${labelTampil.toLowerCase()} yang bisa dipilih.</div>`;
      return;
    }
    wrap.innerHTML = `<label>${labelTampil}</label><select id="rb-ref">${daftar.map(d => `<option value="${d.id}">${d[labelField]}</option>`).join("")}</select>`;
  }

  if (adaDuaRef) document.getElementById("rb-jenis-ref").addEventListener("change", renderRefSelect);
  renderRefSelect();

  async function tampilkanRekap() {
    const hasilEl = document.getElementById("rb-hasil");
    const refEl = document.getElementById("rb-ref");
    if (!refEl || !refEl.value) { hasilEl.innerHTML = `<div class="empty-state">Pilih kelas/kelompok dulu.</div>`; return; }
    const refType = refTypeAktif();
    const refId = refEl.value;
    const bulan = document.getElementById("rb-bulan").value;
    hasilEl.innerHTML = `<div class="loading">Memuat rekap...</div>`;
    try {
      const [data, grid] = await Promise.all([
        Api.call("rekap.bulanan", { jenis: jenisRekap, ref_type: refType, ref_id: refId, bulan }),
        Api.call("rekap.grid", { jenis: jenisRekap, ref_type: refType, ref_id: refId, bulan })
      ]);
      if (data.items.length === 0) {
        hasilEl.innerHTML = `<div class="empty-state">Belum ada santri pada kelas/kelompok ini.</div>`;
        return;
      }
      if (jenisRekap === "presensi") {
        hasilEl.innerHTML = `<div class="table-wrap"><table class="data-table">
          <tr><th>Nama</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alpa</th></tr>
          ${data.items.map(it => `<tr><td>${it.nama}</td><td>${it.tally.Hadir}</td><td>${it.tally.Sakit}</td><td>${it.tally.Izin}</td><td>${it.tally.Alpa}</td></tr>`).join("")}
        </table></div>`;
      } else {
        hasilEl.innerHTML = `<div class="table-wrap"><table class="data-table">
          <tr><th>Nama</th><th>Jumlah Setoran</th><th>Juz Tertinggi Bulan Ini</th></tr>
          ${data.items.map(it => `<tr><td>${it.nama}</td><td>${it.jumlah_setoran}</td><td>Juz ${it.juz_tertinggi_bulan_ini}</td></tr>`).join("")}
        </table></div>`;
      }
      hasilEl.innerHTML += `<h4 style="margin:16px 0 4px;color:var(--emerald-deep);">Tabel Harian (tanggal 1&ndash;${grid.jumlah_hari})</h4>` +
        renderMatrixTable(grid.items, grid.jumlah_hari, jenisRekap);
    } catch (err) {
      tampilkanGalat(hasilEl, err);
    }
  }

  document.getElementById("rb-tampilkan").addEventListener("click", tampilkanRekap);
  tampilkanRekap(); // tampil otomatis untuk bulan & ref default begitu halaman dibuka

  document.getElementById("rb-cetak").addEventListener("click", async (e) => {
    const refEl = document.getElementById("rb-ref");
    if (!refEl || !refEl.value) { alert("Pilih kelas/kelompok dulu."); return; }
    const btn = e.target;
    btn.disabled = true; btn.textContent = "Menyusun PDF...";
    try {
      const data = await Api.call("laporan.rekapBulanan", {
        jenis: jenisRekap, ref_type: refTypeAktif(), ref_id: refEl.value,
        bulan: document.getElementById("rb-bulan").value
      });
      const link = document.createElement("a");
      link.href = "data:application/pdf;base64," + data.base64;
      link.download = data.nama_file;
      link.click();
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false; btn.textContent = "Cetak PDF";
    }
  });
}

// ======================= TABEL PEMANTAUAN HARIAN (nama x tanggal 1..akhir bulan) =======================

// items: [{ nama, harian: {1:'Hadir', 5:'Sakit'} | {3: 12}, jenis?: 'presensi'|'hafalan' }]
function renderMatrixTable(items, jumlahHari, jenisDefault) {
  const hari = Array.from({ length: jumlahHari }, (_, i) => i + 1);
  const huruf = { Hadir: "H", Sakit: "S", Izin: "I", Alpa: "A" };
  function sel(jenis, nilai) {
    if (!nilai) return "";
    if (jenis === "hafalan") return `<span class="sel-hari sel-juz" title="Juz ${nilai}">${nilai}</span>`;
    const h = huruf[nilai] || "?";
    return `<span class="sel-hari sel-${h}" title="${nilai}">${h}</span>`;
  }
  if (!items || items.length === 0) return `<div class="empty-state">Belum ada santri pada pilihan ini.</div>`;
  return `
    <div class="legenda-matrix">
      ${jenisDefault === "hafalan" || items.some(i => i.jenis === "hafalan") ? `<span><span class="sel-hari sel-juz">12</span> = juz tertinggi disetor hari itu</span>` : ""}
      ${jenisDefault !== "hafalan" || items.some(i => i.jenis === "presensi") ? `<span><span class="sel-hari sel-H">H</span> Hadir</span><span><span class="sel-hari sel-S">S</span> Sakit</span><span><span class="sel-hari sel-I">I</span> Izin</span><span><span class="sel-hari sel-A">A</span> Alpa</span>` : ""}
      <span>(kosong = belum ada catatan)</span>
    </div>
    <div class="table-wrap"><table class="matrix">
      <tr><th>Nama</th>${hari.map(h => `<th>${h}</th>`).join("")}</tr>
      ${items.map(it => {
        const jenis = it.jenis || jenisDefault;
        return `<tr><td title="${it.nama}">${it.nama}</td>${hari.map(h => `<td>${sel(jenis, it.harian[h])}</td>`).join("")}</tr>`;
      }).join("")}
    </table></div>`;
}

// Kartu tabel pemantauan di Beranda untuk peran staf (admin, guru, pengajar, pimpinan).
async function renderDashboardMatrix(container) {
  const profil = Auth.getProfil();
  const [kelasRes, kelompokRes] = await Promise.all([Ref.kelas(), Ref.kelompok()]);
  let kelas = kelasRes.items || [];
  let kelompok = kelompokRes.items || [];
  if (profil.peran === "guru_mapel") {
    const d = (profil.kelas_diampu || "").split(",");
    kelas = kelas.filter(k => d.indexOf(k.id) !== -1);
  }
  if (profil.peran === "pengajar_tpq") {
    const d = (profil.kelompok_diampu || "").split(",");
    kelompok = kelompok.filter(k => d.indexOf(k.id) !== -1);
  }
  const sekolahOk = ["admin", "guru_mapel", "pimpinan"].indexOf(profil.peran) !== -1 && kelas.length > 0;
  const ptqOk = ["admin", "pengajar_tpq", "pimpinan"].indexOf(profil.peran) !== -1 && kelompok.length > 0;

  const opsi = [];
  if (sekolahOk) opsi.push({ v: "presensi|kelas", t: "Presensi Sekolah Pagi" });
  if (ptqOk) { opsi.push({ v: "presensi|kelompok", t: "Presensi PTQ" }); opsi.push({ v: "hafalan|kelompok", t: "Hafalan" }); }
  if (opsi.length === 0) { container.innerHTML = ""; return; }

  container.innerHTML = `
    <div class="card">
      <h3>Tabel Pemantauan Bulanan</h3>
      <div class="grid-2">
        <div class="field"><label>Tampilan</label><select id="dm-jenis">${opsi.map(o => `<option value="${o.v}">${o.t}</option>`).join("")}</select></div>
        <div class="field"><label id="dm-ref-label">Kelas</label><select id="dm-ref"></select></div>
      </div>
      <div class="field"><label>Bulan</label><input type="month" id="dm-bulan" value="${bulanIniStr()}"></div>
      <div id="dm-hasil"><div class="loading">Memuat tabel...</div></div>
    </div>`;

  function isiRef() {
    const [, refType] = document.getElementById("dm-jenis").value.split("|");
    const daftar = refType === "kelas" ? kelas : kelompok;
    document.getElementById("dm-ref-label").textContent = refType === "kelas" ? "Kelas" : "Kelompok PTQ";
    document.getElementById("dm-ref").innerHTML = daftar.map(d => `<option value="${d.id}">${refType === "kelas" ? d.nama_kelas : d.nama_kelompok}</option>`).join("");
  }

  async function muat() {
    const hasilEl = document.getElementById("dm-hasil");
    const [jenis, refType] = document.getElementById("dm-jenis").value.split("|");
    const refId = document.getElementById("dm-ref").value;
    if (!refId) { hasilEl.innerHTML = ""; return; }
    hasilEl.innerHTML = `<div class="loading">Memuat tabel...</div>`;
    try {
      const data = await Api.call("rekap.grid", { jenis, ref_type: refType, ref_id: refId, bulan: document.getElementById("dm-bulan").value });
      hasilEl.innerHTML = renderMatrixTable(data.items, data.jumlah_hari, jenis);
    } catch (err) { tampilkanGalat(hasilEl, err); }
  }

  document.getElementById("dm-jenis").addEventListener("change", () => { isiRef(); muat(); });
  document.getElementById("dm-ref").addEventListener("change", muat);
  document.getElementById("dm-bulan").addEventListener("change", muat);
  isiRef();
  await muat();
}

// Tabel pemantauan satu anak (untuk wali) dihitung langsung dari data yang sudah dimuat, tanpa panggilan baru.
function matrixAnakBulanIni(data, bulan) {
  const [thn, bln] = bulan.split("-").map(Number);
  const jumlahHari = new Date(thn, bln, 0).getDate();
  const harianStatus = (arr) => {
    const h = {};
    (arr || []).filter(p => String(p.tanggal).indexOf(bulan) === 0).forEach(p => { h[parseInt(String(p.tanggal).split("-")[2], 10)] = p.status; });
    return h;
  };
  const hafalanH = {};
  (data.riwayat_hafalan || []).filter(p => String(p.tanggal).indexOf(bulan) === 0).forEach(p => {
    const d = parseInt(String(p.tanggal).split("-")[2], 10), j = Number(p.juz) || 0;
    if (!hafalanH[d] || j > hafalanH[d]) hafalanH[d] = j;
  });
  const items = [
    { nama: "Sekolah Pagi", jenis: "presensi", harian: harianStatus(data.riwayat_presensi_sekolah) },
    { nama: "PTQ", jenis: "presensi", harian: harianStatus(data.riwayat_absensi_tpq) },
    { nama: "Hafalan (juz)", jenis: "hafalan", harian: hafalanH }
  ];
  return renderMatrixTable(items, jumlahHari, "presensi");
}
