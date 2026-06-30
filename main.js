import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // Opsional jika butuh API sistem operasi
    },
    icon: path.join(__dirname, 'public/favicon.ico'), // Sesuaikan ikon aplikasi Anda
  });

  // Mode Pengembangan vs Mode Produksi
  if (process.env.NODE_ENV === 'development') {
    // Memuat server dev lokal Vite
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools(); // Membuka DevTools otomatis saat dev
  } else {
    // Memuat file build statis hasil produksi
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
