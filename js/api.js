// Lapisan komunikasi ke backend Google Apps Script.
// Catatan: Content-Type sengaja "text/plain" agar browser tidak mengirim
// preflight OPTIONS (Apps Script Web App tidak menangani preflight CORS).

const Api = {
  async _sekaliPanggil(action, payload) {
    const token = Auth.getToken();
    const body = Object.assign({ action, token }, payload || {});
    let res;
    try {
      res = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new Error("JARINGAN::Tidak dapat menghubungi server. Periksa koneksi internet Anda.");
    }
    let json;
    try {
      json = await res.json();
    } catch (err) {
      // Respon bukan JSON valid — biasanya karena GAS baru "bangun" dari idle (cold start)
      // atau sempat timeout. Tandai sebagai transien supaya boleh dicoba ulang otomatis.
      throw new Error("TRANSIEN::Respon server tidak valid.");
    }
    if (!json.success) {
      if (json.error && json.error.code === "SESI_HABIS") {
        Auth.clear();
        Router.go("login");
      }
      throw new Error((json.error && json.error.message) || "Terjadi kesalahan.");
    }
    return json.data;
  },

  // Panggilan yang gagal karena jaringan/respon tidak valid (bukan karena ditolak server)
  // dicoba ulang sekali secara otomatis setelah jeda singkat — menutupi cold start GAS
  // yang membuat percobaan pertama kadang gagal padahal server sebenarnya baik-baik saja.
  async call(action, payload) {
    try {
      return await this._sekaliPanggil(action, payload);
    } catch (err) {
      const bolehUlang = err.message.startsWith("JARINGAN::") || err.message.startsWith("TRANSIEN::");
      if (!bolehUlang) throw err;
      await new Promise(r => setTimeout(r, 1200));
      try {
        return await this._sekaliPanggil(action, payload);
      } catch (err2) {
        throw new Error(err2.message.replace(/^(JARINGAN|TRANSIEN)::/, ""));
      }
    }
  }
};
