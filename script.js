// Configurações iniciais
class FinanceApp {
  constructor() {
    this.initElements();
    this.loadData();
    this.initEventListeners();
    this.renderAll();
  }

  initElements() {
    // Elementos da interface
    this.elements = {
      // Formulários
      transactionForm: document.getElementById('transaction-form'),
      categoryForm: document.getElementById('category-form'),
      
      // Inputs
      transactionType: document.getElementById('transaction-type'),
      transactionDate: document.getElementById('transaction-date'),
      transactionDescription: document.getElementById('transaction-description'),
      transactionAmount: document.getElementById('transaction-amount'),
      transactionCategory: document.getElementById('transaction-category'),
      transactionParceled: document.getElementById('transaction-parceled'),
      transactionInstallments: document.getElementById('transaction-installments'),
      transactionFixed: document.getElementById('transaction-fixed'),
      newCategoryName: document.getElementById('new-category-name'),
      newCategoryColor: document.getElementById('new-category-color'),
      
      // Containers
      transactionsContainer: document.getElementById('transactions-container'),
      fixedContainer: document.getElementById('fixed-container'),
      cashFlowBody: document.getElementById('cash-flow-body'),
      
      // Filtros
      filterType: document.getElementById('filter-type'),
      filterCategory: document.getElementById('filter-category'),
      filterMonth: document.getElementById('filter-month'),
      clearFilters: document.getElementById('clear-filters'),
      filterFixedType: document.getElementById('filter-fixed-type'),
      filterFixedCategory: document.getElementById('filter-fixed-category'),
      
      // Relatórios
      reportPeriodSelect: document.getElementById('report-period-select'),
      
      // Modais
      categoryModal: document.getElementById('category-modal'),
      closeModal: document.querySelector('.close-modal'),
      addCategoryBtn: document.getElementById('add-category'),
      
      // Gráficos
      balanceChart: document.getElementById('balance-chart'),
      categoriesChart: document.getElementById('categories-chart'),
      
      // Balanço
      currentBalance: document.getElementById('current-balance'),
      totalIncome: document.getElementById('total-income'),
      totalExpenses: document.getElementById('total-expenses')
    };
    
    // Configura data padrão para hoje
    this.elements.transactionDate.value = new Date().toISOString().split('T')[0];
  }

  loadData() {
    // Carrega dados do localStorage ou inicia vazio
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    this.fixedTransactions = JSON.parse(localStorage.getItem('fixedTransactions')) || [];
    this.categories = JSON.parse(localStorage.getItem('categories')) || [
      { name: 'Alimentação', color: '#ef4444' },
      { name: 'Moradia', color: '#3b82f6' },
      { name: 'Transporte', color: '#10b981' },
      { name: 'Lazer', color: '#f59e0b' },
      { name: 'Salário', color: '#8b5cf6' }
    ];
    
    // Inicializa gráficos
    this.initCharts();
  }

  saveData() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
    localStorage.setItem('fixedTransactions', JSON.stringify(this.fixedTransactions));
    localStorage.setItem('categories', JSON.stringify(this.categories));
  }

  initEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => this.switchTab(button));
    });
    
    // Formulário de transação
    this.elements.transactionForm.addEventListener('submit', (e) => this.addTransaction(e));
    
    // Parcelamento
    this.elements.transactionParceled.addEventListener('change', (e) => {
      this.elements.transactionInstallments.disabled = !e.target.checked;
    });
    
    // Filtros
    this.elements.filterType.addEventListener('change', () => this.filterTransactions());
    this.elements.filterCategory.addEventListener('change', () => this.filterTransactions());
    this.elements.filterMonth.addEventListener('change', () => this.filterTransactions());
    this.elements.clearFilters.addEventListener('click', () => this.clearFilters());
    
    this.elements.filterFixedType.addEventListener('change', () => this.filterFixedTransactions());
    this.elements.filterFixedCategory.addEventListener('change', () => this.filterFixedTransactions());
    
    // Relatórios
    this.elements.reportPeriodSelect.addEventListener('change', () => this.updateReports());
    
    // Categorias
    this.elements.addCategoryBtn.addEventListener('click', () => this.showCategoryModal());
    this.elements.closeModal.addEventListener('click', () => this.hideCategoryModal());
    this.elements.categoryForm.addEventListener('submit', (e) => this.addCategory(e));
    
    // Fecha modal ao clicar fora
    this.elements.categoryModal.addEventListener('click', (e) => {
      if (e.target === this.elements.categoryModal) {
        this.hideCategoryModal();
      }
    });
  }

  // ... (continua com todos os outros métodos necessários)

  // Métodos para renderização
  renderAll() {
    this.updateCategoriesDropdowns();
    this.renderTransactions();
    this.renderFixedTransactions();
    this.updateBalance();
    this.updateReports();
  }

  renderTransactions() {
    this.elements.transactionsContainer.innerHTML = '';
    
    const filtered = this.filterTransactions();
    
    filtered.forEach(transaction => {
      const li = document.createElement('li');
      li.className = `transaction-item ${transaction.type} ${transaction.fixed ? 'fixed' : ''} ${transaction.installments > 1 ? 'parceled' : ''}`;
      
      li.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-description">${transaction.description}</div>
          <div class="transaction-meta">
            <span>${new Date(transaction.date).toLocaleDateString()}</span>
            ${transaction.category ? `<span>${transaction.category}</span>` : ''}
            ${transaction.installments > 1 ? `<span>${transaction.installmentNumber}/${transaction.installments}</span>` : ''}
          </div>
        </div>
        <div class="transaction-amount">
          ${transaction.type === 'expense' ? '-' : ''}R$ ${transaction.amount.toFixed(2)}
        </div>
        <div class="transaction-actions">
          <button class="delete-btn" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      
      this.elements.transactionsContainer.appendChild(li);
    });
    
    // Adiciona eventos aos botões de deletar
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTransaction(btn.dataset.id);
      });
    });
  }

  // ... (continua com os demais métodos)

  // Métodos para cálculos
  calculateBalance() {
    const income = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expenses,
      balance: income - expenses
    };
  }

  updateBalance() {
    const { income, expenses, balance } = this.calculateBalance();
    
    this.elements.totalIncome.textContent = `R$ ${income.toFixed(2)}`;
    this.elements.totalExpenses.textContent = `R$ ${expenses.toFixed(2)}`;
    this.elements.currentBalance.textContent = `R$ ${balance.toFixed(2)}`;
    
    // Cor do saldo (verde se positivo, vermelho se negativo)
    this.elements.currentBalance.style.color = balance >= 0 ? 'var(--success)' : 'var(--danger)';
  }

  // ... (continua com os métodos para gráficos, relatórios, etc.)
}

// Inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  const app = new FinanceApp();
  
  // Verifica se há transações fixas para marcar como pagas
  setInterval(() => app.checkFixedTransactions(), 86400000); // Verifica diariamente
});
