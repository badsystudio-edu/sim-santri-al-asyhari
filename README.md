# SIM Santri — Pesantren Tahfidz Al Asyhari

Frontend statis (HTML/CSS/JS vanilla) untuk aplikasi SIM Santri. Backend berjalan terpisah sebagai REST API di Google Apps Script.

## Sebelum dipakai

1. Deploy backend `Kode.gs` (lihat folder `backend/` di paket yang Anda terima, atau `PANDUAN-INSTALASI.md`) sebagai Web App di Apps Script, salin URL `/exec`.
2. Buka `js/config.js`, ganti nilai `GAS_URL` dengan URL tersebut.
3. Upload folder ini (isinya, bukan folder itu sendiri) ke GitHub, lalu aktifkan GitHub Pages. Lihat `PANDUAN-INSTALASI.md`.

## Struktur

```
index.html          <- halaman utama (SPA)
css/style.css        <- semua styling, mengikuti tema Al Asyhari
js/config.js         <- URL backend (WAJIB diisi)
js/auth.js           <- sesi login (localStorage)
js/api.js            <- pemanggil API ke backend
js/router.js         <- router SPA berbasis hash (#/dashboard, dll)
js/pages.js          <- seluruh halaman aplikasi
assets/logo.png      <- logo Pesantren Tahfidz Al Asyhari
```

## Akun demo (dibuat otomatis oleh setupAppEnvironment di backend)

Lihat Execution Log Apps Script setelah menjalankan `setupAppEnvironment` untuk sandi masing-masing akun:
- `admin` — Admin / Tim Kantor
- `guru1` — Guru Mata Pelajaran (mengampu Kelas 1 Ula)
- `pengajar1` — Pengajar TPQ/Tahfidz (mengampu Halaqah Sore A)
- `pimpinan1` — Pimpinan (read-only)

Segera ganti sandi setelah login pertama (fitur ganti sandi mandiri belum ada di tahap ini — gunakan menu Kelola Akun sebagai admin untuk reset sandi).
