// Sample expense data
let expenses = JSON.parse(localStorage.getItem('expenses')) || [
    { id: 1, name: "Grocery Shopping", category: "food", amount: 85.40, date: "2023-10-15" },
    { id: 2, name: "Gas Station", category: "transport", amount: 45.00, date: "2023-10-14" },
    { id: 3, name: "Movie Tickets", category: "entertainment", amount: 32.50, date: "2023-10-13" },
    { id: 4, name: "Electricity Bill", category: "bills", amount: 120.75, date: "2023-10-12" },
    { id: 5, name: "New Shoes", category: "shopping", amount: 89.99, date: "2023-10-11" }
];

// Chart instance
let expenseChart;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    setDefaultDate();
    initChart();
    updateExpenseDisplay();
});

function initializeEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.nav-tabs a').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all tabs and content
            document.querySelectorAll('.nav-tabs a').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // If switching to view expenses, update the display
            if (tabId === 'view-expenses') {
                updateExpenseDisplay();
            }
        });
    });

    // Category Selection
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('expense-category').value = this.getAttribute('data-category');
        });
    });

    // Time Filter Selection
    document.querySelectorAll('.time-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            document.querySelectorAll('.time-filter').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            updateChart(this.getAttribute('data-period'));
        });
    });

    // Form Submission
    document.getElementById('expense-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmission();
    });
}

function setDefaultDate() {
    document.getElementById('expense-date').valueAsDate = new Date();
}

function handleFormSubmission() {
    // Get form values
    const name = document.getElementById('expense-name').value;
    const category = document.getElementById('expense-category').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;
    const notes = document.getElementById('expense-notes').value;
    
    // Validate category selection
    if (!category) {
        alert('Please select a category for your expense');
        return;
    }
    
    // Create new expense object
    const newExpense = {
        id: expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1,
        name,
        category,
        amount,
        date,
        notes
    };
    
    // Add to expenses array
    expenses.push(newExpense);
    
    // Save to localStorage
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    // Show success message
    alert(`Expense Added Successfully!\n\nName: ${name}\nCategory: ${category}\nAmount: $${amount.toFixed(2)}\nDate: ${date}`);
    
    // Reset form
    document.getElementById('expense-form').reset();
    document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
    document.getElementById('expense-category').value = '';
    
    // Update the view if we're on the expenses tab
    if (document.getElementById('view-expenses').classList.contains('active')) {
        updateExpenseDisplay();
    }
}

function initChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: getChartData('monthly'),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Expense Distribution (Monthly)'
                }
            }
        }
    });
}

function getChartData(period) {
    // Filter expenses based on period
    const filteredExpenses = filterExpensesByPeriod(period);
    
    // Calculate totals by category
    const categories = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'health', 'other'];
    const data = categories.map(category => {
        return filteredExpenses
            .filter(expense => expense.category === category)
            .reduce((sum, expense) => sum + expense.amount, 0);
    });
    
    return {
        labels: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'],
        datasets: [{
            data: data,
            backgroundColor: [
                '#ff9f1c', '#2ec4b6', '#e71d36', 
                '#9b5de5', '#00bbf9', '#06d6a0', '#6c757d'
            ],
            borderWidth: 1
        }]
    };
}

function filterExpensesByPeriod(period) {
    const now = new Date();
    let filteredExpenses = [...expenses];
    
    if (period === 'daily') {
        const today = now.toISOString().split('T')[0];
        filteredExpenses = expenses.filter(expense => expense.date === today);
    } else if (period === 'weekly') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredExpenses = expenses.filter(expense => new Date(expense.date) >= oneWeekAgo);
    } else if (period === 'monthly') {
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filteredExpenses = expenses.filter(expense => new Date(expense.date) >= oneMonthAgo);
    } else if (period === 'yearly') {
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filteredExpenses = expenses.filter(expense => new Date(expense.date) >= oneYearAgo);
    }
    
    return filteredExpenses;
}

function updateChart(period) {
    // Update chart data based on period
    expenseChart.data = getChartData(period);
    
    // Update chart title
    const titles = {
        daily: "Today's Expenses",
        weekly: "This Week's Expenses",
        monthly: "This Month's Expenses",
        yearly: "This Year's Expenses"
    };
    
    expenseChart.options.plugins.title.text = titles[period];
    expenseChart.update();
    
    // Update statistics
    updateStatistics(period);
}

function updateStatistics(period) {
    const filteredExpenses = filterExpensesByPeriod(period);
    
    // Calculate statistics
    const totalSpent = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate average daily spending
    let days = 1;
    if (period === 'weekly') days = 7;
    else if (period === 'monthly') days = 30;
    else if (period === 'yearly') days = 365;
    
    const avgDailySpending = totalSpent / days;
    
    // Find biggest category
    const categoryTotals = {};
    filteredExpenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    let biggestCategory = 'None';
    let maxAmount = 0;
    
    for (const category in categoryTotals) {
        if (categoryTotals[category] > maxAmount) {
            maxAmount = categoryTotals[category];
            biggestCategory = category;
        }
    }
    
    // Update DOM elements
    document.getElementById('total-spent').textContent = `$${totalSpent.toFixed(2)}`;
    document.getElementById('avg-daily').textContent = `$${avgDailySpending.toFixed(2)}`;
    document.getElementById('biggest-category').textContent = 
        biggestCategory.charAt(0).toUpperCase() + biggestCategory.slice(1);
}

function updateExpenseTable() {
    const tableBody = document.getElementById('expense-table-body');
    const noExpensesMessage = document.getElementById('no-expenses-message');
    tableBody.innerHTML = '';
    
    // Show message if no expenses
    if (expenses.length === 0) {
        noExpensesMessage.style.display = 'block';
        return;
    } else {
        noExpensesMessage.style.display = 'none';
    }
    
    // Sort expenses by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add expenses to table
    sortedExpenses.forEach(expense => {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = expense.date;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = expense.name;
        
        const categoryCell = document.createElement('td');
        const categoryBadge = document.createElement('span');
        categoryBadge.className = `category-badge ${expense.category}`;
        categoryBadge.textContent = expense.category.charAt(0).toUpperCase() + expense.category.slice(1);
        categoryCell.appendChild(categoryBadge);
        
        const amountCell = document.createElement('td');
        amountCell.textContent = `$${expense.amount.toFixed(2)}`;
        
        const actionCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '🗑️';
        deleteButton.title = 'Delete this expense';
        deleteButton.addEventListener('click', function() {
            deleteExpense(expense.id);
        });
        actionCell.appendChild(deleteButton);
        
        row.appendChild(dateCell);
        row.appendChild(nameCell);
        row.appendChild(categoryCell);
        row.appendChild(amountCell);
        row.appendChild(actionCell);
        
        tableBody.appendChild(row);
    });
}

function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        // Remove expense from array
        expenses = expenses.filter(expense => expense.id !== id);
        
        // Save to localStorage
        localStorage.setItem('expenses', JSON.stringify(expenses));
        
        // Update display
        updateExpenseDisplay();
        
        // Show confirmation message
        alert('Expense deleted successfully!');
    }
}

function updateExpenseDisplay() {
    updateExpenseTable();
    updateStatistics('monthly');
    updateChart('monthly');
}