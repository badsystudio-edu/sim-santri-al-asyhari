const Auth = {
  getToken() {
    return localStorage.getItem("simsantri_token") || "";
  },
  getProfil() {
    try {
      return JSON.parse(localStorage.getItem("simsantri_profil") || "null");
    } catch (e) {
      return null;
    }
  },
  setSesi(token, profil) {
    localStorage.setItem("simsantri_token", token);
    localStorage.setItem("simsantri_profil", JSON.stringify(profil));
  },
  clear() {
    localStorage.removeItem("simsantri_token");
    localStorage.removeItem("simsantri_profil");
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  peran() {
    const p = this.getProfil();
    return p ? p.peran : null;
  },
  boleh(...perans) {
    return perans.indexOf(this.peran()) !== -1;
  }
};
