class FinanceApp {
  constructor() {
    this.transactions = [];
    this.fixedTransactions = [];
    this.categories = [];
    this.reminders = [];
    this.currentBalance = 0;
    this.payday = null;
    
    this.initElements();
    this.loadData();
    this.initEventListeners();
    this.renderAll();
    this.checkDueDates(); // Verifica vencimentos ao iniciar
  }

  // ... (mantenha todas as funções existentes)

  // NOVAS FUNÇÕES ADICIONADAS:

  calculateDailyBudget() {
    const paydayInput = document.getElementById('transaction-payday');
    if (!paydayInput.value) {
      alert("Por favor, informe sua próxima data de pagamento");
      return;
    }
    
    this.payday = new Date(paydayInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calcula dias restantes
    const timeDiff = this.payday - today;
    const daysRemaining = Math.max(Math.ceil(timeDiff / (1000 * 60 * 60 * 24)), 1);
    
    // Calcula orçamento diário seguro
    const dailyBudget = this.currentBalance / daysRemaining;
    
    // Calcula gasto médio diário (últimos 30 dias)
    const lastMonthExpenses = this.transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= new Date(today.setMonth(today.getMonth() - 1)))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const averageDailySpending = lastMonthExpenses / 30;
    
    // Atualiza a interface
    document.getElementById('days-until-payday').textContent = daysRemaining;
    document.getElementById('daily-budget').textContent = `R$ ${dailyBudget.toFixed(2)}`;
    document.getElementById('average-daily-spending').textContent = `R$ ${averageDailySpending.toFixed(2)}`;
    
    // Alerta se gasto médio excede o orçamento
    if (averageDailySpending > dailyBudget) {
      alert('⚠️ Atenção! Seu gasto médio está acima do orçamento diário recomendado.');
    }
  }

  checkDueDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let hasOverdue = false;
    
    this.transactions.forEach(transaction => {
      if (transaction.dueDate) {
        const dueDate = new Date(transaction.dueDate);
        if (dueDate < today && !transaction.paid) {
          transaction.status = 'pendente';
          hasOverdue = true;
        }
      }
    });
    
    if (hasOverdue) {
      this.showNotification('Você tem contas vencidas!', 'Verifique a aba de lançamentos');
    }
    
    this.saveData();
    this.renderAll();
  }

  markAsPaid(transactionId) {
    const transaction = this.transactions.find(t => t.id === transactionId);
    if (transaction) {
      transaction.paid = true;
      transaction.status = 'pago';
      transaction.paidDate = new Date().toISOString().split('T')[0];
      this.saveData();
      this.renderAll();
      
      // Atualiza cálculo diário se for despesa
      if (transaction.type === 'expense') {
        this.calculateDailyBudget();
      }
    }
  }

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

  // Modifique a função addTransaction para incluir vencimento:
  addTransaction() {
    const type = this.elements.transactionType.value;
    const date = this.elements.transactionDate.value;
    const description = this.elements.transactionDescription.value.trim();
    const amount = parseFloat(this.elements.transactionAmount.value);
    const category = this.elements.transactionCategory.value;
    const isParceled = this.elements.transactionParceled.checked;
    const installments = isParceled ? parseInt(this.elements.transactionInstallments.value) : 1;
    const isFixed = this.elements.transactionFixed.checked;
    const dueDate = this.elements.transactionDueDate.value;

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
      dueDate: dueDate || null,
      status: 'pendente',
      paid: false,
      createdAt: new Date().toISOString()
    };

    // Se for parcelado, cria as parcelas futuras
    if (isParceled && installments > 1) {
      const transactionDate = new Date(date);
      const dueDateObj = dueDate ? new Date(dueDate) : transactionDate;
      
      for (let i = 2; i <= installments; i++) {
        const nextMonth = new Date(transactionDate);
        nextMonth.setMonth(transactionDate.getMonth() + (i - 1));
        
        const nextDueDate = new Date(dueDateObj);
        nextDueDate.setMonth(dueDateObj.getMonth() + (i - 1));
        
        const installment = {
          ...newTransaction,
          id: Date.now() + i,
          date: nextMonth.toISOString().split('T')[0],
          dueDate: nextDueDate.toISOString().split('T')[0],
          installmentNumber: i,
          paid: false
        };
        
        this.transactions.push(installment);
      }
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
    
    // Atualiza cálculo se for despesa
    if (type === 'expense') {
      this.calculateDailyBudget();
    }
  }

  // Atualize o renderTransactions para incluir status:
  renderTransactions(transactions) {
    this.elements.transactionsContainer.innerHTML = '';
    
    transactions.forEach(transaction => {
      const li = document.createElement('li');
      li.className = `transaction-item ${transaction.type} ${transaction.status} ${transaction.paid ? 'paid' : ''}`;
      
      // Adicione ícone de alerta para vencimentos próximos
      let dueBadge = '';
      if (transaction.dueDate && !transaction.paid) {
        const dueDate = new Date(transaction.dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
          dueBadge = `<span class="due-badge due-soon" title="Vence em ${daysUntilDue} dias"><i class="fas fa-exclamation-circle"></i></span>`;
        } else if (daysUntilDue < 0) {
          dueBadge = `<span class="due-badge due-late" title="Vencido há ${Math.abs(daysUntilDue)} dias"><i class="fas fa-exclamation-triangle"></i></span>`;
        }
      }
      
      li.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-description">
            ${transaction.description}
            ${dueBadge}
          </div>
          <div class="transaction-meta">
            <span>${new Date(transaction.date).toLocaleDateString()}</span>
            ${transaction.category ? `<span>${transaction.category}</span>` : ''}
            ${transaction.installments > 1 ? `<span>Parcela ${transaction.installmentNumber}/${transaction.installments}</span>` : ''}
            ${transaction.dueDate ? `<span>Vence: ${new Date(transaction.dueDate).toLocaleDateString()}</span>` : ''}
          </div>
        </div>
        <div class="transaction-amount ${transaction.type}">
          ${transaction.type === 'expense' ? '-' : ''}R$ ${Math.abs(transaction.amount).toFixed(2)}
        </div>
        <div class="transaction-status">
          <span class="status-badge ${transaction.status}">
            ${transaction.status}
          </span>
          ${!transaction.paid ? `
            <button class="pay-btn" data-id="${transaction.id}">
              <i class="fas fa-check"></i> Pagar
            </button>
          ` : ''}
        </div>
        <div class="transaction-actions">
          <button class="delete-btn" data-id="${transaction.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      li.querySelector('.pay-btn')?.addEventListener('click', () => {
        this.markAsPaid(transaction.id);
      });
      
      li.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTransaction(transaction.id);
      });
      
      this.elements.transactionsContainer.appendChild(li);
    });
  }

  // Adicione no initEventListeners:
  initEventListeners() {
    // ... (event listeners existentes)
    
    document.getElementById('update-calculation').addEventListener('click', () => {
      this.calculateDailyBudget();
    });
    
    // Verifica vencimentos a cada hora
    setInterval(() => this.checkDueDates(), 60 * 60 * 1000);
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
