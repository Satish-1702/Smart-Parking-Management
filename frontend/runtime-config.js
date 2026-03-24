(function initRuntimeConfig() {
  const localHosts = new Set(["localhost", "127.0.0.1"]);
  const { protocol, hostname, host, port } = window.location;
  const isLocalHost = localHosts.has(hostname);

  // Local default keeps current dev flow (frontend on 4173/5500, API on 8000).
  const defaultApiOrigin =
    isLocalHost && port && port !== "8000"
      ? `${protocol}//${hostname}:8000`
      : `${protocol}//${host}`;

  const userOverride =
    window.__SP_API_ORIGIN__ || window.localStorage.getItem("SP_API_ORIGIN");
  const apiOrigin = String(userOverride || defaultApiOrigin).replace(/\/+$/, "");
  const wsOrigin = apiOrigin.replace(/^http/i, protocol === "https:" ? "wss" : "ws");

  window.__SPARK_CONFIG__ = Object.freeze({
    API_ORIGIN: apiOrigin,
    API_BASE: apiOrigin,
    API_V1: `${apiOrigin}/api`,
    WS_BASE: wsOrigin,
  });
})();
