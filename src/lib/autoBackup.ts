import { AutoBackup, UserProfile, Product, Transaction, Debt, ShopSettings, CashierAccount, RiwayatPPOB } from '../types';
import { getLocalData, DEFAULT_SETTINGS, DEFAULT_PRODUCTS, DEFAULT_DEBTS, DEFAULT_CASHIERS, DEFAULT_CATEGORIES } from './firebase';

const BACKUPS_KEY = 'pos_auto_backups';
const MAX_BACKUPS = 8;

export const performAutoBackup = (activeUser: UserProfile | null): void => {
  try {
    // 1. Gather all data directly from LocalStorage to ensure we get the latest persistent state
    const settings = getLocalData<ShopSettings>('pos_settings', DEFAULT_SETTINGS);
    const products = getLocalData<Product[]>('pos_products', DEFAULT_PRODUCTS);
    const transactions = getLocalData<Transaction[]>('pos_transactions', []);
    const debts = getLocalData<Debt[]>('pos_debts', DEFAULT_DEBTS);
    const cashiers = getLocalData<CashierAccount[]>('pos_cashiers', DEFAULT_CASHIERS);
    const categories = getLocalData<string[]>('toko_categories', DEFAULT_CATEGORIES);
    const ppobTransactions = getLocalData<RiwayatPPOB[]>('pos_ppob_transactions', []);

    // If there is no transaction or stock data, skip backing up empty state
    if (products.length === 0 && transactions.length === 0 && ppobTransactions.length === 0) {
      return;
    }

    // Optimize backup size: Omit heavy base64 logo data from the backup payload to prevent QuotaExceededError
    const backupSettings = { ...settings };
    if (backupSettings.logoUrl && backupSettings.logoUrl.startsWith('data:')) {
      backupSettings.logoUrl = '';
    }

    const timestamp = new Date().toISOString();
    const userLabel = activeUser ? `${activeUser.fullName} (${activeUser.role})` : 'Sistem (Keluar Tab)';
    const userFileName = activeUser ? activeUser.username : 'sistem';

    // Format date for filename: YYYY-MM-DD_HH-mm-ss
    const dateObj = new Date();
    const formattedDate = dateObj.getFullYear() + '-' +
      String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
      String(dateObj.getDate()).padStart(2, '0') + '_' +
      String(dateObj.getHours()).padStart(2, '0') + '-' +
      String(dateObj.getMinutes()).padStart(2, '0') + '-' +
      String(dateObj.getSeconds()).padStart(2, '0');

    const fileName = `AUTO_BACKUP_${userFileName.toUpperCase()}_${formattedDate}.json`;

    const newBackup: AutoBackup = {
      id: `ab_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp,
      user: userLabel,
      fileName,
      data: {
        settings: backupSettings,
        products,
        transactions,
        debts,
        cashiers,
        categories,
        ppobTransactions,
        exportedAt: timestamp
      }
    };

    // 2. Fetch current auto-backups list
    const existingBackups = getLocalData<AutoBackup[]>(BACKUPS_KEY, []);

    // 3. Add to beginning of array
    const updatedBackups = [newBackup, ...existingBackups];

    // 4. Cap at max capacity
    if (updatedBackups.length > MAX_BACKUPS) {
      updatedBackups.splice(MAX_BACKUPS);
    }

    // 5. Save back to local storage with self-healing retry loop if quota exceeded
    let success = false;
    let backupsToSave = [...updatedBackups];

    while (!success && backupsToSave.length > 0) {
      try {
        localStorage.setItem(BACKUPS_KEY, JSON.stringify(backupsToSave));
        success = true;
      } catch (e: any) {
        const isQuotaError = 
          e.name === 'QuotaExceededError' || 
          e.code === 22 || 
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          e.message?.toLowerCase().includes('quota') ||
          e.message?.toLowerCase().includes('exceeded');

        if (isQuotaError && backupsToSave.length > 1) {
          console.warn(`LocalStorage quota exceeded. Pruning oldest backup (remaining count: ${backupsToSave.length - 1})`);
          backupsToSave.pop(); // Remove the oldest backup item and retry
        } else {
          // If it still fails with 1 item, or if it's not a quota error, stop to prevent infinite loop
          throw e;
        }
      }
    }

    if (success) {
      console.log(`Auto-Backup successfully created: ${fileName}`);
    }
  } catch (error) {
    console.error('Failed to create Auto-Backup:', error);
  }
};

export const getAutoBackups = (): AutoBackup[] => {
  return getLocalData<AutoBackup[]>(BACKUPS_KEY, []);
};

export const deleteAutoBackup = (id: string): void => {
  try {
    const existingBackups = getAutoBackups();
    const filtered = existingBackups.filter(b => b.id !== id);
    localStorage.setItem(BACKUPS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete Auto-Backup:', error);
  }
};

export const clearAllAutoBackups = (): void => {
  try {
    localStorage.removeItem(BACKUPS_KEY);
  } catch (error) {
    console.error('Failed to clear Auto-Backups:', error);
  }
};
