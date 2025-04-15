class FinanceApp {
    constructor() {
        this.transactions = [];
        this.goals = [];
        this.reminders = [];
        this.categories = [
            { name: "Salário", type: "income", color: "#10b981" },
            { name: "Investimentos", type: "income", color: "#06b6d4" },
            { name: "Alimentação", type: "expense", color: "#ef4444" },
            { name: "Moradia", type: "expense", color: "#f97316" },
            { name: "Transporte", type: "expense", color: "#8b5cf6" },
            { name: "Lazer", type: "expense", color: "#ec4899" },
            { name: "Saúde", type: "expense", color: "#3b82f6" }
        ];
        
        this.currentBalance = 0;
        this.totalIncome = 0;
        this.totalExpenses = 0;
        this.totalFixedExpenses = 0;
        
        this.balanceChart = null;
        this.expenseChart = null;
        
        this.initElements();
        this.loadData();
        this.initEventListeners();
        this.renderAll();

        setInterval(() => {
            this.updateTransactionStatuses();
            this.renderTransactions();
        }, 24 * 60 * 60 * 1000);
        
        this.updateTransactionStatuses();
    }

    initElements() {
        this.transactionForm = document.getElementById('transaction-form');
        this.goalForm = document.getElementById('goal-form');
        this.reminderForm = document.getElementById('reminder-form');
        this.categoryForm = document.getElementById('category-form');
        
        this.transactionType = document.getElementById('transaction-type');
        this.transactionDate = document.getElementById('transaction-date');
        this.transactionDescription = document.getElementById('transaction-description');
        this.transactionAmount = document.getElementById('transaction-amount');
        this.transactionCategory = document.getElementById('transaction-category');
        this.transactionTags = document.getElementById('transaction-tags');
        this.transactionDueDate = document.getElementById('transaction-due-date');
        this.transactionParceled = document.getElementById('transaction-parceled');
        this.transactionInstallments = document.getElementById('transaction-installments');
        this.transactionFixed = document.getElementById('transaction-fixed');
        
        this.goalDescription = document.getElementById('goal-description');
        this.goalTargetDate = document.getElementById('goal-target-date');
        this.goalTargetAmount = document.getElementById('goal-target-amount');
        this.goalInitialAmount = document.getElementById('goal-initial-amount');
        
        this.reminderDescription = document.getElementById('reminder-description');
        this.reminderDate = document.getElementById('reminder-date');
        this.reminderFrequency = document.getElementById('reminder-frequency');
        this.reminderPriority = document.getElementById('reminder-priority');
        
        this.transactionsContainer = document.getElementById('transactions-container');
        this.goalsContainer = document.getElementById('goals-container');
        this.activeRemindersContainer = document.getElementById('active-reminders-container');
        this.completedRemindersContainer = document.getElementById('completed-reminders-container');
        this.tagsContainer = document.getElementById('tags-container');
        
        this.currentBalanceElement = document.getElementById('current-balance');
        this.totalIncomeElement = document.getElementById('total-income');
        this.totalExpensesElement = document.getElementById('total-expenses');
        this.totalFixedElement = document.getElementById('total-fixed');
        this.dailyBudgetElement = document.getElementById('daily-budget');
        this.monthlyBalanceElement = document.getElementById('monthly-balance');
        
        this.highestIncomeElement = document.getElementById('highest-income');
        this.highestExpenseElement = document.getElementById('highest-expense');
        this.monthlyAverageElement = document.getElementById('monthly-average');
        this.averageBalanceElement = document.getElementById('average-balance');
        
        this.searchTransactions = document.getElementById('search-transactions');
        this.filterType = document.getElementById('filter-type');
        this.filterCategory = document.getElementById('filter-category');
        this.filterMonth = document.getElementById('filter-month');
        this.clearFilters = document.getElementById('clear-filters');
        
        this.filterReminderStatus = document.getElementById('filter-reminder-status');
        this.filterReminderPriority = document.getElementById('filter-reminder-priority');
        
        this.reportPeriod = document.getElementById('report-period');
        this.generateReport = document.getElementById('generate-report');
        
        this.categoryModal = document.getElementById('category-modal');
        this.confirmModal = document.getElementById('confirm-modal');
        this.closeModal = document.querySelector('.close-modal');
        
        this.addCategoryBtn = document.getElementById('add-category-btn');
        this.clearForm = document.getElementById('clear-form');
        this.clearCompleted = document.getElementById('clear-completed');
        this.confirmYes = document.getElementById('confirm-yes');
        this.confirmNo = document.getElementById('confirm-no');
        this.exportData = document.getElementById('export-data');
        this.importData = document.getElementById('import-data');
        this.fileInput = document.getElementById('file-input');
        
        this.balanceChartCtx = document.getElementById('balance-chart');
        this.expenseChartCtx = document.getElementById('expense-chart');
        
        const today = new Date();
        this.transactionDate.value = today.toISOString().split('T')[0];
        this.goalTargetDate.value = today.toISOString().split('T')[0];
        this.reminderDate.value = today.toISOString().split('T')[0];
    }

    loadData() {
        const savedData = localStorage.getItem('financeAppData');
    if (savedData) {
        const data = JSON.parse(savedData);

            this.transactions = data.transactions.map(t => ({
            ...t,
            date: new Date(t.date),
            dueDate: t.dueDate ? new Date(t.dueDate) : null
        }));

            this.goals = data.goals || [];
            this.reminders = data.reminders || [];
            this.categories = data.categories || this.categories;
            
            this.updateCategoriesDropdown();
            this.calculateTotals();
            this.renderTransactions();
            this.renderGoals();
            this.renderReminders();
            this.updateReports();
        }
    }

    saveData() {
        const data = {
            transactions: this.transactions,
            goals: this.goals,
            reminders: this.reminders,
            categories: this.categories
        };
        localStorage.setItem('financeAppData', JSON.stringify(data));
    }

    initEventListeners() {
        this.transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });
        
        this.goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGoal();
        });
        
        this.reminderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addReminder();
        });
        
        this.categoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCategory();
        });
        
        this.transactionParceled.addEventListener('change', () => {
            this.transactionInstallments.disabled = !this.transactionParceled.checked;
        });
        
        this.addCategoryBtn.addEventListener('click', () => {
            this.categoryModal.classList.add('active');
        });
        
        this.clearForm.addEventListener('click', () => {
            this.transactionForm.reset();
            this.transactionDate.value = new Date().toISOString().split('T')[0];
        });
        
        this.clearCompleted.addEventListener('click', () => {
            this.showConfirmModal(
                'Limpar lembretes concluídos',
                'Tem certeza que deseja remover todos os lembretes concluídos?',
                () => {
                    this.reminders = this.reminders.filter(r => !r.completed);
                    this.saveData();
                    this.renderReminders();
                }
            );
        });
        
        this.closeModal.addEventListener('click', () => {
            this.categoryModal.classList.remove('active');
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        this.confirmYes.addEventListener('click', () => {
            if (this.confirmCallback) {
                this.confirmCallback();
            }
            this.confirmModal.classList.remove('active');
        });
        
        this.confirmNo.addEventListener('click', () => {
            this.confirmModal.classList.remove('active');
        });
        
        this.filterType.addEventListener('change', () => this.renderTransactions());
        this.filterCategory.addEventListener('change', () => this.renderTransactions());
        this.filterMonth.addEventListener('change', () => this.renderTransactions());
        this.clearFilters.addEventListener('click', () => {
            this.filterType.value = 'all';
            this.filterCategory.value = 'all';
            this.filterMonth.value = '';
            this.searchTransactions.value = '';
            this.renderTransactions();
        });
        
        this.searchTransactions.addEventListener('input', () => this.renderTransactions());
        
        this.filterReminderStatus.addEventListener('change', () => this.renderReminders());
        this.filterReminderPriority.addEventListener('change', () => this.renderReminders());
        
        this.generateReport.addEventListener('click', () => this.updateReports());
        
        this.exportData.addEventListener('click', () => this.exportAppData());
        this.importData.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.importAppData(e));
        
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                button.classList.add('active');
                document.getElementById(button.dataset.tab).classList.add('active');
                
                if (button.dataset.tab === 'reports') {
                    this.updateReports();
                }
            });
        });
    }

    showConfirmModal(title, message, callback) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        this.confirmCallback = callback;
        this.confirmModal.classList.add('active');
    }

    updateCategoriesDropdown() {
        this.transactionCategory.innerHTML = '<option value="">Selecione...</option>';
        this.filterCategory.innerHTML = '<option value="all">Todas categorias</option>';
        
        this.categories.forEach(category => {
            if (category.type === this.transactionType.value || category.type === 'both') {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                option.style.color = category.color;
                this.transactionCategory.appendChild(option);
            }
            
            const filterOption = document.createElement('option');
            filterOption.value = category.name;
            filterOption.textContent = category.name;
            filterOption.style.color = category.color;
            this.filterCategory.appendChild(filterOption);
        });
    }

    addTransaction() {
        const type = this.transactionType.value;
        const date = this.transactionDate.value;
        const description = this.transactionDescription.value.trim();
        const amount = parseFloat(this.transactionAmount.value);
        const category = this.transactionCategory.value;
        const tags = this.transactionTags.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const dueDate = this.transactionDueDate.value;
        const isParceled = this.transactionParceled.checked;
        const installments = isParceled ? parseInt(this.transactionInstallments.value) : 1;
        const isFixed = this.transactionFixed.checked;
        
        if (!description || isNaN(amount)) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        const transaction = {
            id: Date.now(),
            type,
            date,
            description,
            amount: type === 'income' ? amount : -amount,
            category,
            tags,
            dueDate: dueDate || null,
            isParceled,
            installments: isParceled ? installments : 1,
            isFixed,
            status: dueDate ? 'pending' : 'paid',
            paymentDate: !dueDate ? new Date().toISOString().split('T')[0] : null,
            createdAt: new Date().toISOString()
        };
        
        this.transactions.push(transaction);
        
        if (isParceled && installments > 1) {
            const transactionDate = new Date(date);
            const dueDateObj = dueDate ? new Date(dueDate) : transactionDate;
            
            for (let i = 2; i <= installments; i++) {
                const nextDate = new Date(transactionDate);
                nextDate.setMonth(transactionDate.getMonth() + (i - 1));
                
                const nextDueDate = new Date(dueDateObj);
                nextDueDate.setMonth(dueDateObj.getMonth() + (i - 1));
                
                const installment = {
                    ...transaction,
                    id: Date.now() + i,
                    date: nextDate.toISOString().split('T')[0],
                    dueDate: nextDueDate.toISOString().split('T')[0],
                    installmentNumber: i,
                    isFirst: false
                };
                
                this.transactions.push(installment);
            }
        }
        
        this.saveData();
        this.calculateTotals();
        this.renderTransactions();
        this.transactionForm.reset();
        this.transactionDate.value = new Date().toISOString().split('T')[0];
    }

    updateTransactionStatuses() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        this.transactions.forEach(transaction => {
            if (transaction.dueDate && transaction.status !== 'paid') {
                const dueDate = new Date(transaction.dueDate);
                transaction.status = dueDate < today ? 'overdue' : 'pending';
            }
        });
        
        this.saveData();
    }

    markAsPaid(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (transaction) {
            transaction.status = 'paid';
            transaction.paymentDate = new Date().toISOString().split('T')[0];
            this.saveData();
            this.calculateTotals();
            this.renderTransactions();
        }
    }

    calculateDailyBudget() {
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysRemaining = daysInMonth - today.getDate() + 1;
        
        const monthlyIncome = this.transactions
            .filter(t => t.type === 'income' && 
                   new Date(t.date).getMonth() === today.getMonth() &&
                   new Date(t.date).getFullYear() === today.getFullYear())
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const monthlyExpenses = this.transactions
            .filter(t => t.type === 'expense' && 
                   new Date(t.date).getMonth() === today.getMonth() &&
                   new Date(t.date).getFullYear() === today.getFullYear() &&
                   t.status === 'paid')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const balance = monthlyIncome - monthlyExpenses;
        const dailyBudget = balance / daysRemaining;
        
        return {
            daily: dailyBudget,
            monthly: balance
        };
    }

    calculateTotals() {
        this.totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        this.totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        this.totalFixedExpenses = this.transactions
            .filter(t => t.type === 'expense' && t.isFixed)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        this.currentBalance = this.totalIncome - this.totalExpenses;
        
            const budget = this.calculateDailyBudget();
    this.dailyBudgetElement.textContent = this.formatCurrency(budget.daily);
    this.monthlyBalanceElement.textContent = `Saldo mensal: ${this.formatCurrency(budget.monthly)}`;
        
        this.currentBalanceElement.textContent = this.formatCurrency(this.currentBalance);
        this.totalIncomeElement.textContent = this.formatCurrency(this.totalIncome);
        this.totalExpensesElement.textContent = this.formatCurrency(this.totalExpenses);
        this.totalFixedElement.textContent = this.formatCurrency(this.totalFixedExpenses);
        this.dailyBudgetElement.textContent = this.formatCurrency(budget.daily);
        this.monthlyBalanceElement.textContent = `Saldo mensal: ${this.formatCurrency(budget.monthly)}`;
        
this.currentBalanceElement.style.color = this.currentBalance >= 0 ? 'var(--success)' : 'var(--danger)';
}
    }

    renderTransactions() {
        const typeFilter = this.filterType.value;
        const categoryFilter = this.filterCategory.value;
        const monthFilter = this.filterMonth.value;
        const searchTerm = this.searchTransactions.value.toLowerCase();
        
        let filteredTransactions = [...this.transactions];
        
        if (typeFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
        }
        
        if (categoryFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
        }
        
        if (monthFilter) {
    const [year, month] = monthFilter.split('-');
    filteredTransactions = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === parseInt(year) && 
               transactionDate.getMonth() + 1 === parseInt(month);
    });
}

        
        if (searchTerm) {
            filteredTransactions = filteredTransactions.filter(t => 
                t.description.toLowerCase().includes(searchTerm) ||
                (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }
        
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.transactionsContainer.innerHTML = '';
        
        if (filteredTransactions.length === 0) {
            this.transactionsContainer.innerHTML = '<div class="no-results">Nenhum lançamento encontrado</div>';
            return;
        }
        
        filteredTransactions.forEach(transaction => {
            const transactionElement = document.createElement('div');
            transactionElement.className = `transaction-item ${transaction.type} ${transaction.isFixed ? 'fixed' : ''} ${transaction.status || ''}`;
            
            const formattedDate = new Date(transaction.date).toLocaleDateString('pt-BR');
            const formattedAmount = this.formatCurrency(Math.abs(transaction.amount));
            const amountClass = transaction.type === 'income' ? 'income' : 'expense';
            
            let dueDateInfo = '';
            if (transaction.dueDate) {
                const dueDate = new Date(transaction.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                let dueStatus = '';
                if (transaction.isFixed && dueDate < today) {
                    dueStatus = '<span class="due-status overdue">(Atrasado)</span>';
                } else if (transaction.dueDate) {
                    dueStatus = `<span class="due-status">(Vence ${dueDate.toLocaleDateString('pt-BR')})</span>`;
                }
                
                dueDateInfo = `<div class="due-date">${dueStatus}</div>`;
            }
            
            let installmentInfo = '';
            if (transaction.isParceled && transaction.installments > 1) {
                installmentInfo = `<div class="installment">${transaction.installmentNumber || 1}/${transaction.installments}</div>`;
            }
            
            let statusBadge = '';
            if (transaction.dueDate) {
                const statusText = transaction.status === 'pending' ? 'Pendente' : 
                                 transaction.status === 'overdue' ? 'Atrasado' : 'Pago';
                
                statusBadge = `<span class="transaction-status ${transaction.status}">
                    ${statusText}
                </span>`;
                
                if (transaction.status !== 'paid') {
                    statusBadge += `<button class="mark-paid-btn" data-id="${transaction.id}">
                        Marcar como pago
                    </button>`;
                }
            }
            
            transactionElement.innerHTML = `
                <div class="transaction-description">
                    ${transaction.description}
                    ${dueDateInfo}
                    ${statusBadge}
                </div>
                <div class="transaction-date">${formattedDate}</div>
                <div class="transaction-amount ${amountClass}">
                    ${transaction.type === 'income' ? '+' : '-'} ${formattedAmount}
                </div>
                <div class="transaction-actions">
                    ${installmentInfo}
                    <button class="delete-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            transactionElement.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTransaction(transaction.id);
            });
            
            if (transaction.dueDate && transaction.status !== 'paid') {
                transactionElement.querySelector('.mark-paid-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.markAsPaid(transaction.id);
                });
            }
            
            this.transactionsContainer.appendChild(transactionElement);
        });
    }

    deleteTransaction(id) {
        this.showConfirmModal(
            'Excluir lançamento',
            'Tem certeza que deseja excluir este lançamento?',
            () => {
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.saveData();
                this.calculateTotals();
                this.renderTransactions();
            }
        );
    }

    addGoal() {
        const description = this.goalDescription.value.trim();
        const targetDate = this.goalTargetDate.value;
        const targetAmount = parseFloat(this.goalTargetAmount.value);
        const initialAmount = parseFloat(this.goalInitialAmount.value) || 0;
        
        if (!description || isNaN(targetAmount) || !targetDate) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        const goal = {
            id: Date.now(),
            description,
            targetDate,
            targetAmount,
            currentAmount: initialAmount,
            createdAt: new Date().toISOString()
        };
        
        this.goals.push(goal);
        this.saveData();
        this.renderGoals();
        this.goalForm.reset();
        this.goalTargetDate.value = new Date().toISOString().split('T')[0];
    }

    renderGoals() {
        this.goalsContainer.innerHTML = '';
        
        if (this.goals.length === 0) {
            this.goalsContainer.innerHTML = '<div class="no-results">Nenhuma meta definida</div>';
            return;
        }
        
        this.goals.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = 'goal-card';
            
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
const daysRemaining = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
            
            goalElement.innerHTML = `
                <h3>${goal.description}</h3>
                <div class="progress-bar">
                    <div class="progress" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <div class="goal-info">
                    <span>${this.formatCurrency(goal.currentAmount)} de ${this.formatCurrency(goal.targetAmount)}</span>
                    <span>${daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Prazo expirado'}</span>
                </div>
                <div class="goal-actions">
                    <button class="delete-btn" data-id="${goal.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            goalElement.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteGoal(goal.id);
            });
            
            this.goalsContainer.appendChild(goalElement);
        });
    }

    deleteGoal(id) {
        this.showConfirmModal(
            'Excluir meta',
            'Tem certeza que deseja excluir esta meta?',
            () => {
                this.goals = this.goals.filter(g => g.id !== id);
                this.saveData();
                this.renderGoals();
            }
        );
    }

    addReminder() {
        const description = this.reminderDescription.value.trim();
        const date = this.reminderDate.value;
        const frequency = this.reminderFrequency.value;
        const priority = this.reminderPriority.value;
        
        if (!description) {
            alert('Por favor, insira uma descrição para o lembrete.');
            return;
        }
        
        const reminder = {
            id: Date.now(),
            description,
            date,
            frequency,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.reminders.push(reminder);
        this.saveData();
        this.renderReminders();
        this.reminderForm.reset();
        this.reminderDate.value = new Date().toISOString().split('T')[0];
    }

    renderReminders() {
        const statusFilter = this.filterReminderStatus.value;
        const priorityFilter = this.filterReminderPriority.value;
        
        let filteredReminders = [...this.reminders];
        
        if (statusFilter !== 'all') {
            filteredReminders = filteredReminders.filter(r => 
                statusFilter === 'active' ? !r.completed : r.completed
            );
        }
        
        if (priorityFilter !== 'all') {
            filteredReminders = filteredReminders.filter(r => r.priority === priorityFilter);
        }
        
        filteredReminders.sort((a, b) => {
            if (a.completed && b.completed) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else if (!a.completed && !b.completed) {
                return new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt);
            }
            return a.completed ? 1 : -1;
        });
        
        this.activeRemindersContainer.innerHTML = '';
        this.completedRemindersContainer.innerHTML = '';
        
        const activeReminders = filteredReminders.filter(r => !r.completed);
        const completedReminders = filteredReminders.filter(r => r.completed);
        
        if (activeReminders.length === 0) {
            this.activeRemindersContainer.innerHTML = '<div class="no-results">Nenhum lembrete ativo</div>';
        } else {
            activeReminders.forEach(reminder => {
                const reminderElement = this.createReminderElement(reminder);
                this.activeRemindersContainer.appendChild(reminderElement);
            });
        }
        
        if (completedReminders.length === 0) {
            this.completedRemindersContainer.innerHTML = '<div class="no-results">Nenhum lembrete concluído</div>';
        } else {
            completedReminders.forEach(reminder => {
                const reminderElement = this.createReminderElement(reminder);
                this.completedRemindersContainer.appendChild(reminderElement);
            });
        }
    }

    createReminderElement(reminder) {
        const reminderElement = document.createElement('div');
        reminderElement.className = `reminder-item ${reminder.completed ? 'completed' : ''} priority-${reminder.priority}`;
        
        const formattedDate = reminder.date ? new Date(reminder.date).toLocaleDateString('pt-BR') : 'Sem data';
        const frequencyText = {
            once: 'Uma vez',
            daily: 'Diário',
            weekly: 'Semanal',
            monthly: 'Mensal'
        }[reminder.frequency];
        
        reminderElement.innerHTML = `
            <label>
                <input type="checkbox" ${reminder.completed ? 'checked' : ''}>
                <span class="reminder-text">${reminder.description}</span>
            </label>
            <div class="reminder-details">
                <span class="reminder-date">${formattedDate}</span>
                <span class="reminder-frequency">${frequencyText}</span>
                <span class="reminder-priority ${reminder.priority}">
                    ${reminder.priority === 'high' ? 'Alta' : 
                      reminder.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
            </div>
            <div class="reminder-actions">
                <button class="delete-btn" data-id="${reminder.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        const checkbox = reminderElement.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            this.toggleReminderStatus(reminder.id);
        });
        
        reminderElement.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteReminder(reminder.id);
        });
        
        return reminderElement;
    }

    toggleReminderStatus(id) {
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            reminder.completed = !reminder.completed;
            this.saveData();
            this.renderReminders();
        }
    }

    deleteReminder(id) {
        this.showConfirmModal(
            'Excluir lembrete',
            'Tem certeza que deseja excluir este lembrete?',
            () => {
                this.reminders = this.reminders.filter(r => r.id !== id);
                this.saveData();
                this.renderReminders();
            }
        );
    }

    addCategory() {
        const name = document.getElementById('category-name').value.trim();
        const type = document.getElementById('category-type').value;
        const color = document.getElementById('category-color').value;
        
        if (!name) {
            alert('Por favor, insira um nome para a categoria.');
            return;
        }
        
        if (this.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            alert('Já existe uma categoria com este nome.');
            return;
        }
        
        const category = {
            name,
            type,
            color
        };
        
        this.categories.push(category);
        this.saveData();
        this.updateCategoriesDropdown();
        this.categoryModal.classList.remove('active');
        this.categoryForm.reset();
    }

    updateReports()
    {
         if (this.balanceChart) {
        this.balanceChart.destroy();
    }
    if (this.expenseChart) {
        this.expenseChart.destroy();
    }
{
        const period = this.reportPeriod.value;
        let filteredTransactions = [];
        const today = new Date();
        
        switch (period) {
            case 'current-month':
                filteredTransactions = this.transactions.filter(t => {
                    const date = new Date(t.date);
                    return date.getMonth() === today.getMonth() && 
                           date.getFullYear() === today.getFullYear();
                });
                break;
                
            case 'last-month':
                const lastMonth = new Date(today);
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                
                filteredTransactions = this.transactions.filter(t => {
                    const date = new Date(t.date);
                    return date.getMonth() === lastMonth.getMonth() && 
                           date.getFullYear() === lastMonth.getFullYear();
                });
                break;
                
            case 'last-3-months':
                const threeMonthsAgo = new Date(today);
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                
                filteredTransactions = this.transactions.filter(t => {
                    const date = new Date(t.date);
                    return date >= threeMonthsAgo && date <= today;
                });
                break;
                
            case 'current-year':
                filteredTransactions = this.transactions.filter(t => {
                    const date = new Date(t.date);
                    return date.getFullYear() === today.getFullYear();
                });
                break;
                
            default:
                filteredTransactions = [...this.transactions];
        }
        
        this.updateBalanceChart(filteredTransactions);
        this.updateExpenseChart(filteredTransactions);
        this.updateTagsCloud(filteredTransactions);
        this.updateFinancialSummary(filteredTransactions);
    }

    updateBalanceChart(transactions) {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        if (this.balanceChart) {
            this.balanceChart.destroy();
        }
        
        this.balanceChart = new Chart(this.balanceChartCtx, {
            type: 'doughnut',
            data: {
                labels: ['Receitas', 'Despesas'],
                datasets: [{
                    data: [income, expenses],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateExpenseChart(transactions) {
        const expensesByCategory = {};
        
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                if (!expensesByCategory[t.category || 'Outros']) {
                    expensesByCategory[t.category || 'Outros'] = 0;
                }
                expensesByCategory[t.category || 'Outros'] += Math.abs(t.amount);
            });
        
        const categories = Object.keys(expensesByCategory);
        const amounts = Object.values(expensesByCategory);
        
        const backgroundColors = categories.map(category => {
            const cat = this.categories.find(c => c.name === category);
            return cat ? cat.color : '#94a3b8';
        });
        
        if (this.expenseChart) {
            this.expenseChart.destroy();
        }
        
        this.expenseChart = new Chart(this.expenseChartCtx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Despesas por Categoria',
                    data: amounts,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateTagsCloud(transactions) {
        const tagsCount = {};
        
        transactions.forEach(t => {
            if (t.tags && t.tags.length > 0) {
                t.tags.forEach(tag => {
                    if (!tagsCount[tag]) {
                        tagsCount[tag] = 0;
                    }
                    tagsCount[tag]++;
                });
            }
        });
        
        const sortedTags = Object.entries(tagsCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
        
        this.tagsContainer.innerHTML = '';
        
        if (sortedTags.length === 0) {
            this.tagsContainer.innerHTML = '<div class="no-results">Nenhuma tag utilizada</div>';
            return;
        }
        
        const maxCount = Math.max(...sortedTags.map(t => t[1]));
        
        sortedTags.forEach(([tag, count]) => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            
            const fontSize = 0.8 + (0.8 * (count / maxCount));
            tagElement.style.fontSize = `${fontSize}rem`;
            
            tagElement.textContent = tag;
            this.tagsContainer.appendChild(tagElement);
        });
    }

    updateFinancialSummary(transactions) {
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        
        const highestIncome = incomeTransactions.length > 0 ? 
            Math.max(...incomeTransactions.map(t => Math.abs(t.amount))) : 0;
        
        const highestExpense = expenseTransactions.length > 0 ? 
            Math.max(...expenseTransactions.map(t => Math.abs(t.amount))) : 0;
        
        let monthlyAverage = 0;
        if (transactions.length > 0) {
            const months = this.getMonthsInPeriod();
            const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
            monthlyAverage = total / months;
        }
        
        let averageBalance = 0;
        if (transactions.length > 0) {
            const balances = this.calculateMonthlyBalances();
            averageBalance = balances.reduce((sum, b) => sum + b.balance, 0) / balances.length;
        }
        
        this.highestIncomeElement.textContent = this.formatCurrency(highestIncome);
        this.highestExpenseElement.textContent = this.formatCurrency(highestExpense);
        this.monthlyAverageElement.textContent = this.formatCurrency(monthlyAverage);
        this.averageBalanceElement.textContent = this.formatCurrency(averageBalance);
    }

    getMonthsInPeriod() {
        const period = this.reportPeriod.value;
        const today = new Date();
        
        switch (period) {
            case 'current-month':
            case 'last-month':
                return 1;
            case 'last-3-months':
                return 3;
            case 'current-year':
                return today.getMonth() + 1;
            default:
                return 1;
        }
    }

    calculateMonthlyBalances() {
        const balances = [];
        const allMonths = this.getMonthsWithTransactions();
        
        let runningBalance = 0;
        
        allMonths.forEach(month => {
            const monthlyTransactions = this.transactions.filter(t => {
                const date = new Date(t.date);
                return date.getFullYear() === month.year && 
                       date.getMonth() === month.month;
            });
            
            const monthlyIncome = monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                
            const monthlyExpenses = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            runningBalance += (monthlyIncome - monthlyExpenses);
            
            balances.push({
                year: month.year,
                month: month.month,
                balance: runningBalance
            });
        });
        
        return balances;
    }

    getMonthsWithTransactions() {
        const monthsSet = new Set();
        
        this.transactions.forEach(t => {
            const date = new Date(t.date);
            monthsSet.add(`${date.getFullYear()}-${date.getMonth()}`);
        });
        
        return Array.from(monthsSet)
            .map(m => {
                const [year, month] = m.split('-');
                return { year: parseInt(year), month: parseInt(month) };
            })
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });
    }

    exportAppData() {
        const data = {
            transactions: this.transactions,
            goals: this.goals,
            reminders: this.reminders,
            categories: this.categories,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-finance-app-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importAppData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                this.showConfirmModal(
                    'Importar dados',
                    'Isso substituirá todos os dados atuais. Continuar?',
                    () => {
                        this.transactions = data.transactions || [];
                        this.goals = data.goals || [];
                        this.reminders = data.reminders || [];
                        this.categories = data.categories || this.categories;
                        
                        this.saveData();
                        this.renderAll();
                        
                        alert('Dados importados com sucesso!');
                    }
                );
            } catch (error) {
                alert('Erro ao importar arquivo. Certifique-se de que é um backup válido.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }

    renderAll() {
        this.updateCategoriesDropdown();
        this.calculateTotals();
        this.renderTransactions();
        this.renderGoals();
        this.renderReminders();
        this.updateReports();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new FinanceApp();
});
// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registrado');
            })
            .catch(err => {
                console.log('Falha ao registrar ServiceWorker', err);
            });
    });
}
