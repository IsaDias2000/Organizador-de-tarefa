class FinanceApp {
  constructor() {
    this.transactions = [];
    this.fixedTransactions = [];
    this.categories = [];
    this.reminders = [];
    this.currentBalance = 0;
    
    this.initElements();
    this.loadData();
    this.initEventListeners();
    this.renderAll();
  }

  initElements() {
    // Elementos do DOM
    this.elements = {
      // Formulários
      transactionForm: document.getElementById('transaction-form'),
      reminderForm: document.getElementById('reminder-form'),
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
      reminderDescription: document.getElementById('reminder-description'),
      newCategoryName: document.getElementById('new-category-name'),
      newCategoryColor: document.getElementById('new-category-color'),
      
      // Containers
      transactionsContainer: document.getElementById('transactions-container'),
      fixedContainer: document.getElementById('fixed-container'),
      activeReminders: document.getElementById('active-reminders'),
      completedReminders: document.getElementById('completed-reminders'),
      cashFlowBody: document.getElementById('cash-flow-body'),
      
      // Filtros
      filterType: document.getElementById('filter-type'),
      filterCategory: document.getElementById('filter-category'),
      filterStatus: document.getElementById('filter-status'),
      filterMonth: document.getElementById('filter-month'),
      clearFilters: document.getElementById('clear-filters'),
      filterFixedType: document.getElementById('filter-fixed-type'),
      filterFixedStatus: document.getElementById('filter-fixed-status'),
      filterFixedCategory: document.getElementById('filter-fixed-category'),
      
      // Relatórios
      reportPeriodSelect: document.getElementById('report-period-select'),
      
      // Sumários
      currentBalance: document.getElementById('current-balance'),
      totalIncome: document.getElementById('total-income'),
      totalExpenses: document.getElementById('total-expenses'),
      fixedExpensesSummary: document.getElementById('fixed-expenses-summary'),
      parceledExpensesSummary: document.getElementById('parceled-expenses-summary'),
      fixedIncomeSummary: document.getElementById('fixed-income-summary'),
      fixedExpenseSummary: document.getElementById('fixed-expense-summary'),
      
      // Botões
      themeToggle: document.getElementById('theme-toggle'),
      addCategoryBtn: document.getElementById('add-category-btn'),
      clearTransactions: document.getElementById('clear-transactions'),
      clearCompleted: document.getElementById('clear-completed'),
      confirmClear: document.getElementById('confirm-clear'),
      cancelClear: document.getElementById('cancel-clear'),
      
      // Tabs
      tabButtons: document.querySelectorAll('.tab-button'),
      tabContents: document.querySelectorAll('.tab-content'),
      
      // Gráficos
      balanceChart: document.getElementById('balance-chart'),
      categoriesChart: document.getElementById('categories-chart'),
      
      // Modais
      confirmClearModal: document.getElementById('confirm-clear-modal'),
      categoryModal: document.getElementById('category-modal'),
      closeModal: document.querySelector('.close-modal')
    };

    // Configura data padrão para hoje
    const today = new Date();
    this.elements.transactionDate.value = today.toISOString().split('T')[0];
  }

  loadData() {
    // Carrega dados do localStorage
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    this.fixedTransactions = JSON.parse(localStorage.getItem('fixedTransactions')) || [];
    this.categories = JSON.parse(localStorage.getItem('categories')) || [
      { name: 'Alimentação', color: '#ef4444' },
      { name: 'Moradia', color: '#3b82f6' },
      { name: 'Transporte', color: '#10b981' },
      { name: 'Lazer', color: '#f59e0b' },
      { name: 'Salário', color: '#8b5cf6' }
    ];
    this.reminders = JSON.parse(localStorage.getItem('reminders')) || [];

    // Verifica contas fixas do mês atual
    this.checkFixedTransactions();
  }

  saveData() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
    localStorage.setItem('fixedTransactions', JSON.stringify(this.fixedTransactions));
    localStorage.setItem('categories', JSON.stringify(this.categories));
    localStorage.setItem('reminders', JSON.stringify(this.reminders));
  }

  initEventListeners() {
    // Tabs
    this.elements.tabButtons.forEach(button => {
      button.addEventListener('click', () => this.switchTab(button));
    });

    // Formulário de transação
    this.elements.transactionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addTransaction();
    });

    // Formulário de lembrete
    this.elements.reminderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addReminder();
    });

    // Formulário de categoria
    this.elements.categoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addCategory();
    });

    // Parcelamento
    this.elements.transactionParceled.addEventListener('change', (e) => {
      this.elements.transactionInstallments.disabled = !e.target.checked;
    });

    // Filtros
    this.elements.filterType.addEventListener('change', () => this.filterTransactions());
    this.elements.filterCategory.addEventListener('change', () => this.filterTransactions());
    this.elements.filterStatus.addEventListener('change', () => this.filterTransactions());
    this.elements.filterMonth.addEventListener('change', () => this.filterTransactions());
    this.elements.clearFilters.addEventListener('click', () => this.clearFilters());
    
    this.elements.filterFixedType.addEventListener('change', () => this.filterFixedTransactions());
    this.elements.filterFixedStatus.addEventListener('change', () => this.filterFixedTransactions());
    this.elements.filterFixedCategory.addEventListener('change', () => this.filterFixedTransactions());

    // Relatórios
    this.elements.reportPeriodSelect.addEventListener('change', () => this.updateReports());

    // Tema escuro/claro
    this.elements.themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-mode');
      localStorage.setItem('theme', document.documentElement.classList.contains('light-mode') ? 'light' : 'dark');
    });

    // Botão para adicionar categoria
    this.elements.addCategoryBtn.addEventListener('click', () => {
      this.elements.categoryModal.classList.add('active');
    });

    // Botão para limpar transações
    this.elements.clearTransactions.addEventListener('click', () => {
      this.elements.confirmClearModal.classList.add('active');
    });

    // Confirmação para limpar transações
    this.elements.confirmClear.addEventListener('click', () => {
      this.clearAllTransactions();
      this.elements.confirmClearModal.classList.remove('active');
    });

    // Cancelar limpeza
    this.elements.cancelClear.addEventListener('click', () => {
      this.elements.confirmClearModal.classList.remove('active');
    });

    // Botão para limpar lembretes concluídos
    this.elements.clearCompleted.addEventListener('click', () => {
      this.clearCompletedReminders();
    });

    // Fechar modais
    this.elements.closeModal.addEventListener('click', () => {
      this.elements.categoryModal.classList.remove('active');
    });

    // Fecha modal ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Verifica tema salvo
    if (localStorage.getItem('theme') === 'light') {
      document.documentElement.classList.add('light-mode');
    }
  }

  switchTab(button) {
    // Remove classe active de todas as tabs
    this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
    this.elements.tabContents.forEach(content => content.classList.remove('active'));
    
    // Adiciona classe active na tab selecionada
    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
    
    // Atualiza os dados da tab
    if (tabId === 'fixed') {
      this.filterFixedTransactions();
    } else if (tabId === 'reminders') {
      this.renderReminders();
    } else if (tabId === 'reports') {
      this.updateReports();
    }
  }

  addTransaction() {
    const type = this.elements.transactionType.value;
    const date = this.elements.transactionDate.value;
    const description = this.elements.transactionDescription.value.trim();
    const amount = parseFloat(this.elements.transactionAmount.value);
    const category = this.elements.transactionCategory.value;
    const isParceled = this.elements.transactionParceled.checked;
    const installments = isParceled ? parseInt(this.elements.transactionInstallments.value) : 1;
    const isFixed = this.elements.transactionFixed.checked;

    // Validação básica
    if (!description || isNaN(amount)) {
      alert('Preencha todos os campos corretamente!');
      return;
    }

    const newTransaction = {
      id: Date.now(),
      type,
      date,
      description,
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      category,
      installments,
      installmentNumber: 1,
      fixed: isFixed,
      paid: false,
      createdAt: new Date().toISOString()
    };

    // Adiciona transação principal
    this.transactions.push(newTransaction);

    // Se for parcelado, cria as parcelas futuras
    if (isParceled && installments > 1) {
      const transactionDate = new Date(date);
      
      for (let i = 2; i <= installments; i++) {
        const nextMonth = new Date(transactionDate);
        nextMonth.setMonth(transactionDate.getMonth() + (i - 1));
        
        const installment = {
          ...newTransaction,
          id: Date.now() + i,
          date: nextMonth.toISOString().split('T')[0],
          installmentNumber: i,
          paid: false
        };
        
        this.transactions.push(installment);
      }
    }

    // Se for fixa, adiciona à lista de contas fixas
    if (isFixed) {
      this.fixedTransactions.push({
        ...newTransaction,
        originalId: newTransaction.id
      });
    }

    // Salva e atualiza a interface
    this.saveData();
    this.renderAll();
    this.elements.transactionForm.reset();
    
    // Reseta para data atual
    this.elements.transactionDate.value = new Date().toISOString().split('T')[0];
  }

  deleteTransaction(id) {
    if (confirm('Deseja realmente excluir este lançamento?')) {
      this.transactions = this.transactions.filter(t => t.id !== id);
      this.fixedTransactions = this.fixedTransactions.filter(t => t.id !== id);
      this.saveData();
      this.renderAll();
    }
  }

  clearAllTransactions() {
    this.transactions = [];
    this.fixedTransactions = [];
    this.saveData();
    this.renderAll();
  }

  checkFixedTransactions() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
