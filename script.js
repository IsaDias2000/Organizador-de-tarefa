class FinanceApp {
  constructor() {
    this.transactions = [];
    this.fixedTransactions = [];
    this.categories = [];
    this.reminders = [];
    this.goals = [];
    this.currentBalance = 0;
    this.payday = null;
    this.balanceChart = null;
    this.categoriesChart = null;
    this.monthlyTrendChart = null;

    this.initElements();
    this.loadData();
    this.initEventListeners();
    this.renderAll();
    this.checkDueDates();
  }

  initElements() {
    this.elements = {
      // Formulários
      transactionForm: document.getElementById('transaction-form'),
      reminderForm: document.getElementById('reminder-form'),
      categoryForm: document.getElementById('category-form'),
      goalForm: document.getElementById('goal-form'),
      
      // Inputs
      transactionType: document.getElementById('transaction-type'),
      transactionDate: document.getElementById('transaction-date'),
      transactionDescription: document.getElementById('transaction-description'),
      transactionAmount: document.getElementById('transaction-amount'),
      transactionCategory: document.getElementById('transaction-category'),
      transactionDueDate: document.getElementById('transaction-due-date'),
      transactionPayday: document.getElementById('transaction-payday'),
      transactionParceled: document.getElementById('transaction-parceled'),
      transactionInstallments: document.getElementById('transaction-installments'),
      transactionFixed: document.getElementById('transaction-fixed'),
      reminderDescription: document.getElementById('reminder-description'),
      newCategoryName: document.getElementById('new-category-name'),
      newCategoryColor: document.getElementById('new-category-color'),
      goalName: document.getElementById('goal-name'),
      goalTarget: document.getElementById('goal-target'),
      goalDeadline: document.getElementById('goal-deadline'),
      goalInitial: document.getElementById('goal-initial'),
      
      // Containers
      transactionsContainer: document.getElementById('transactions-container'),
      fixedContainer: document.getElementById('fixed-container'),
      activeReminders: document.getElementById('active-reminders'),
      completedReminders: document.getElementById('completed-reminders'),
      goalsContainer: document.getElementById('goals-container'),
      cashFlowBody: document.getElementById('cash-flow-body'),
      netWorthReport: document.getElementById('net-worth-report'),
      
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
      pendingPaymentsSummary: document.getElementById('pending-payments-summary'),
      fixedIncomeSummary: document.getElementById('fixed-income-summary'),
      fixedExpenseSummary: document.getElementById('fixed-expense-summary'),
      totalGoals: document.getElementById('total-goals'),
      completedGoals: document.getElementById('completed-goals'),
      inProgressGoals: document.getElementById('in-progress-goals'),
      
      // Botões
      addCategoryBtn: document.getElementById('add-category-btn'),
      clearTransactions: document.getElementById('clear-transactions'),
      clearCompleted: document.getElementById('clear-completed'),
      confirmClear: document.getElementById('confirm-clear'),
      cancelClear: document.getElementById('cancel-clear'),
      updateCalculation: document.getElementById('update-calculation'),
      
      // Tabs
      tabButtons: document.querySelectorAll('.tab-button'),
      tabContents: document.querySelectorAll('.tab-content'),
      
      // Gráficos
      balanceChart: document.getElementById('balance-chart'),
      categoriesChart: document.getElementById('categories-chart'),
      monthlyTrendChart: document.getElementById('monthly-trend-chart'),
      
      // Modais
      confirmClearModal: document.getElementById('confirm-clear-modal'),
      categoryModal: document.getElementById('category-modal'),
      closeModal: document.querySelector('.close-modal')
    };

    // Configura data padrão
    const today = new Date();
    this.elements.transactionDate.value = today.toISOString().split('T')[0];
    this.elements.goalDeadline.value = today.toISOString().split('T')[0];
  }

  loadData() {
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
    this.goals = JSON.parse(localStorage.getItem('goals')) || [];

    this.checkFixedTransactions();
  }

  saveData() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
    localStorage.setItem('fixedTransactions', JSON.stringify(this.fixedTransactions));
    localStorage.setItem('categories', JSON.stringify(this.categories));
    localStorage.setItem('reminders', JSON.stringify(this.reminders));
    localStorage.setItem('goals', JSON.stringify(this.goals));
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

    // Formulário de meta
    this.elements.goalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addGoal();
    });

    // Parcelamento
    this.elements.transactionParceled.addEventListener('change', (e) => {
      this.elements.transactionInstallments.disabled = !e.target.checked;
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

    // Atualizar cálculo diário
    this.elements.updateCalculation.addEventListener('click', () => {
      this.calculateDailyBudget();
    });

    // Verifica vencimentos a cada hora
    setInterval(() => this.checkDueDates(), 60 * 60 * 1000);
  }

  // ... (Todas as outras funções implementadas anteriormente) ...

  // FUNÇÃO PARA ADICIONAR TRANSAÇÃO (COMPLETA)
  addTransaction() {
    const type = this.elements.transactionType.value;
    const date = this.elements.transactionDate.value;
    const description = this.elements.transactionDescription.value.trim();
    const amount = parseFloat(this.elements.transactionAmount.value);
    const category = this.elements.transactionCategory.value;
    const dueDate = this.elements.transactionDueDate.value;
    const isParceled = this.elements.transactionParceled.checked;
    const installments = isParceled ? parseInt(this.elements.transactionInstallments.value) : 1;
    const isFixed = this.elements.transactionFixed.checked;

    // Validação
    if (!description || isNaN(amount)) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    const newTransaction = {
      id: Date.now(),
      type,
      date,
      description,
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      category,
      dueDate: dueDate || null,
      status: 'pendente',
      paid: false,
      fixed: isFixed,
      installments,
      installmentNumber: 1,
      createdAt: new Date().toISOString()
    };

    // Adiciona parcelas se necessário
    if (isParceled && installments > 1) {
      this.addInstallments(newTransaction, installments);
    }

    this.transactions.push(newTransaction);
    
    if (isFixed) {
      this.fixedTransactions.push({
        ...newTransaction,
        originalId: newTransaction.id
      });
    }

    this.saveData();
    this.renderAll();
    this.elements.transactionForm.reset();
    
    // Atualiza cálculo diário se for despesa
    if (type === 'expense') {
      this.calculateDailyBudget();
    }
  }

  addInstallments(baseTransaction, installments) {
    const baseDate = new Date(baseTransaction.date);
    const baseDueDate = baseTransaction.dueDate ? new Date(baseTransaction.dueDate) : baseDate;

    for (let i = 2; i <= installments; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(baseDate.getMonth() + (i - 1));
      
      const installmentDueDate = new Date(baseDueDate);
      installmentDueDate.setMonth(baseDueDate.getMonth() + (i - 1));

      const installment = {
        ...baseTransaction,
        id: Date.now() + i,
        date: installmentDate.toISOString().split('T')[0],
        dueDate: installmentDueDate.toISOString().split('T')[0],
        installmentNumber: i,
        paid: false
      };

      this.transactions.push(installment);
    }
  }

  // FUNÇÃO PARA CALCULAR GASTOS DIÁRIOS (COMPLETA)
  calculateDailyBudget() {
    const paydayInput = this.elements.transactionPayday;
    if (!paydayInput.value) {
      alert("Informe sua próxima data de pagamento");
      return;
    }

    const payday = new Date(paydayInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular dias restantes
    const timeDiff = payday - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      alert("A data de pagamento deve ser futura!");
      return;
    }

    // Calcular orçamento diário
    const dailyBudget = this.currentBalance / daysRemaining;

    // Calcular gasto médio diário (últimos 30 dias)
    const lastMonthExpenses = this.transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= new Date(today.setMonth(today.getMonth() - 1)))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const averageDailySpending = lastMonthExpenses / 30;

    // Atualizar UI
    document.getElementById('days-until-payday').textContent = daysRemaining;
    document.getElementById('daily-budget').textContent = `R$ ${dailyBudget.toFixed(2)}`;
    document.getElementById('average-daily-spending').textContent = `R$ ${averageDailySpending.toFixed(2)}`;

    // Alerta se gasto médio excede o orçamento
    if (averageDailySpending > dailyBudget) {
      this.showNotification('Atenção!', 'Seu gasto médio está acima do orçamento diário recomendado.');
    }
  }

  // ... (Todas as outras funções necessárias) ...

  // FUNÇÃO PARA VERIFICAR VENCIMENTOS (COMPLETA)
  checkDueDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let hasOverdue = false;

    this.transactions.forEach(transaction => {
      if (transaction.dueDate && !transaction.paid) {
        const dueDate = new Date(transaction.dueDate);
        if (dueDate < today) {
          transaction.status = 'pendente';
          hasOverdue = true;
        }
      }
    });

    if (hasOverdue) {
      this.showNotification('Contas vencidas!', 'Você tem transações pendentes de pagamento.');
    }

    this.saveData();
    this.renderAll();
  }

  // FUNÇÃO PARA MOSTRAR NOTIFICAÇÕES
  showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body: message });
        }
      });
    }
  }

  // ... (Implemente todas as outras funções necessárias) ...

  // FUNÇÃO PARA RENDERIZAR TODOS OS COMPONENTES
  renderAll() {
    this.updateCategoriesDropdowns();
    this.filterTransactions();
    this.filterFixedTransactions();
    this.updateBalance();
    this.updateCashFlow();
    this.updateReports();
    this.renderReminders();
    this.renderGoals();
    this.updateGoalsSummary();
  }
}

// Inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => {
  const app = new FinanceApp();
  
  // Solicita permissão para notificações
  if ('Notification' in window) {
    Notification.requestPermission();
  }
});
