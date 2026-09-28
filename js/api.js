// Lapisan komunikasi ke backend Google Apps Script.
// Catatan: Content-Type sengaja "text/plain" agar browser tidak mengirim
// preflight OPTIONS (Apps Script Web App tidak menangani preflight CORS).

const Api = {
  async call(action, payload) {
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
      throw new Error("Tidak dapat menghubungi server. Periksa koneksi internet Anda.");
    }
    let json;
    try {
      json = await res.json();
    } catch (err) {
      throw new Error("Respon server tidak valid.");
    }
    if (!json.success) {
      if (json.error && json.error.code === "SESI_HABIS") {
        Auth.clear();
        Router.go("login");
      }
      throw new Error((json.error && json.error.message) || "Terjadi kesalahan.");
    }
    return json.data;
  }
};
