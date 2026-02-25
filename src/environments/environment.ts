// frontend_dsi6/src/environments/environment.ts
export const environment = {
  production: false,
    apiUrl: 'http://localhost:4000/api',  // ✅ VERIFICAR SI YA TIENE /api  // URL de tu backend Node.js
  // Nivel de logs (debug = muchos logs)
    logLevel: 'debug',
    apiUrlPHP: 'http://localhost:8000' // URL de tu backend PHP (si lo usas)
};