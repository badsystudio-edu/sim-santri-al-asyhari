const Router = {
  routes: {},
  add(name, handler) { this.routes[name] = handler; },
  go(name, params) {
    location.hash = "#/" + name + (params ? "?" + new URLSearchParams(params).toString() : "");
  },
  parse() {
    const hash = location.hash.replace(/^#\//, "");
    const [name, query] = hash.split("?");
    const params = Object.fromEntries(new URLSearchParams(query || ""));
    return { name: name || "login", params };
  },
  async render() {
    const { name, params } = this.parse();
    const root = document.getElementById("app");

    if (name !== "login" && !Auth.isLoggedIn()) {
      this.go("login");
      return;
    }
    if (name === "login" && Auth.isLoggedIn()) {
      this.go("dashboard");
      return;
    }

    const handler = this.routes[name] || this.routes["dashboard"];
    root.innerHTML = "";
    try {
      await handler(root, params);
    } catch (err) {
      root.innerHTML = `<div class="empty-state">Terjadi kesalahan: ${err.message}</div>`;
    }
  },
  init() {
    window.addEventListener("hashchange", () => this.render());
    if (Auth.isLoggedIn()) prefetchSemua(); // panaskan cache sebelum pengguna sempat mengklik menu
    this.render();
  }
};
