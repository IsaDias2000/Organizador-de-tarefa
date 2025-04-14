class FinanceApp {
  constructor() {
    this.transactions = [];
    this.fixedTransactions = [];
    this.categories = [];
    this.reminders = [];
    this.goals = [];
    this.accounts = [
      { id: 1, name: 'Conta Corrente', balance: 0, type: 'checking' },
      { id: 2, name: 'Cartão de Crédito', balance: 0, type: 'credit' }
    ];
    this.currentBalance = 0;
    this.selectedAccount = 1;
    this.payday = null;
    
    this.initElements();
    this.loadData();
    this.initEventListeners();
    this.renderAll();
    this.checkDueDates();
  }

  // ... (Todas as funções anteriores mantidas, incluindo as novas implementações)
  // Certifique-se de incluir TODAS as funções mostradas anteriormente
}

// Inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => {
  const app = new FinanceApp();
  
  // Verifica contas fixas diariamente
  setInterval(() => app.checkFixedTransactions(), 24 * 60 * 60 * 1000);
  
  // Verifica vencimentos a cada hora
  setInterval(() => app.checkDueDates(), 60 * 60 * 1000);
  
  // Solicita permissão para notificações
  if ('Notification' in window) {
    Notification.requestPermission();
  }
});

// Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registrado com sucesso:', registration.scope);
      })
      .catch(error => {
        console.log('Falha ao registrar ServiceWorker:', error);
      });
  });
}
