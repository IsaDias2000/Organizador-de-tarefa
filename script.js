// Módulo Principal (existente)
class App {
  constructor() {
    this.initTabs();
    this.initTheme();
    this.registerServiceWorker();
    this.initDataManager();
    this.initModals();
    this.initNotifications();
    this.setCurrentYear();
  }
  
  // Métodos existentes mantidos...
  
  // Novos métodos
  initDataManager() {
    this.dataManager = new DataManager();
    this.financeManager = new FinanceManager(this.dataManager);
    this.reportManager = new ReportManager(this.dataManager);
    this.goalManager = new GoalManager(this.dataManager);
    this.reminderManager = new ReminderManager(this.dataManager);
  }
  
  initModals() {
    this.modal = document.getElementById('data-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalBody = document.getElementById('modal-body');
    
    document.getElementById('export-data').addEventListener('click', () => {
      this.showExportModal();
    });
    
    document.getElementById('import-data').addEventListener('click', () => {
      this.showImportModal();
    });
    
    document.querySelector('.close-modal').addEventListener('click', () => {
      this.closeModal();
    });
  }
  
  showExportModal() {
    this.modalTitle.textContent = 'Exportar Dados';
    this.modalBody.querySelector('textarea').value = this.dataManager.exportData();
    this.modalBody.hidden = false;
    this.modalBody.querySelector('#import-actions').hidden = true;
    this.modal.hidden = false;
  }
  
  showImportModal() {
    this.modalTitle.textContent = 'Importar Dados';
    this.modalBody.hidden = true;
    this.modalBody.querySelector('#import-actions').hidden = false;
    this.modal.hidden = false;
  }
  
  closeModal() {
    this.modal.hidden = true;
  }
  
  initNotifications() {
    if ('Notification' in window) {
      document.getElementById('request-permission').addEventListener('click', () => {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            alert('Notificações ativadas com sucesso!');
          }
        });
      });
    }
  }
  
  setCurrentYear() {
    document.getElementById('current-year').textContent = new Date().getFullYear();
  }
}

// Novo: Gerenciador de Dados Centralizado
class DataManager {
  constructor() {
    this.loadData();
  }
  
  loadData() {
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    this.goals = JSON.parse(localStorage.getItem('goals')) || [];
    this.reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    this.settings = JSON.parse(localStorage.getItem('settings')) || {
      notificationsEnabled: false,
      notificationTime: '18:00'
    };
  }
  
  saveData() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
    localStorage.setItem('goals', JSON.stringify(this.goals));
    localStorage.setItem('reminders', JSON.stringify(this.reminders));
    localStorage.setItem('settings', JSON.stringify(this.settings));
  }
  
  exportData() {
    return JSON.stringify({
      transactions: this.transactions,
      goals: this.goals,
      reminders: this.reminders,
      settings: this.settings,
      version: '2.0',
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
  
  importData(data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.transactions) this.transactions = parsed.transactions;
      if (parsed.goals) this.goals = parsed.goals;
      if (parsed.reminders) this.reminders = parsed.reminders;
      if (parsed.settings) this.settings = parsed.settings;
      this.saveData();
      return true;
    } catch (e) {
      console.error('Erro ao importar dados:', e);
      return false;
    }
  }
}

// Módulo de Finanças (atualizado)
class FinanceManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.initForm();
    this.initFilters();
    this.renderTransactions();
    this.initCharts();
  }
  
  // Métodos existentes atualizados para usar dataManager...
  
  // Novos métodos para filtros
  initFilters() {
    this.updateCategoryFilter();
    
    document.getElementById('apply-filters').addEventListener('click', () => {
      this.applyFilters();
    });
    
    document.getElementById('clear-filters').addEventListener('click', () => {
      this.clearFilters();
    });
  }
  
  applyFilters() {
    const type = document.getElementById('filter-type').value;
    const category = document.getElementById('filter-category').value;
    const month = document.getElementById('filter-month').value;
    
    let filtered = this.dataManager.transactions;
    
    if (type !== 'all') {
      filtered = filtered.filter(t => t.type === type);
    }
    
    if (category !== 'all') {
      filtered = filtered.filter(t => t.category === category);
    }
    
    if (month) {
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === parseInt(month.split('-')[0]) && 
               date.getMonth() + 1 === parseInt(month.split('-')[1]);
      });
    }
    
    this.renderTransactions(filtered);
  }
  
  clearFilters() {
    document.getElementById('filter-type').value = 'all';
    document.getElementById('filter-category').value = 'all';
    document.getElementById('filter-month').value = '';
    this.renderTransactions(this.dataManager.transactions);
  }
  
  updateCategoryFilter() {
    const select = document.getElementById('filter-category');
    const categories = [...new Set(this.dataManager.transactions.map(t => t.category))];
    
    // Mantém 'all' e remove outras opções
    while (select.options.length > 1) {
      select.remove(1);
    }
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });
  }
}

// Novo: Módulo de Relatórios
class ReportManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.initCharts();
    this.updateReport();
    
    document.getElementById('report-period').addEventListener('change', () => {
      this.updateReport();
    });
  }
  
  updateReport() {
    const period = document.getElementById('report-period').value;
    let transactions = [];
    
    switch (period) {
      case 'current-month':
        transactions = this.getCurrentMonthTransactions();
        break;
      case 'last-month':
        transactions = this.getLastMonthTransactions();
        break;
      case 'last-3-months':
        transactions = this.getLastThreeMonthsTransactions();
        break;
      default:
        transactions = this.dataManager.transactions;
    }
    
    this.updateSummary(transactions);
    this.updateCharts(transactions);
  }
  
  // Métodos para cálculos de relatórios...
}

// Novo: Módulo de Metas
class GoalManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.initForm();
    this.renderGoals();
  }
  
  // Métodos para gerenciamento de metas...
}

// Módulo de Lembretes (atualizado)
class ReminderManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.initForm();
    this.renderReminders();
    this.initNotificationSettings();
  }
  
  // Métodos atualizados e novos para notificações...
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
