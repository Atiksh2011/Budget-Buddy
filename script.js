// Format amount to display with rupee symbol
function formatAmount(amount) {
    return '₹' + parseFloat(amount).toFixed(2);
}

// DOM elements
const expenseForm = document.getElementById('expense-form');
const expenseNameInput = document.getElementById('expense-name');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseDateInput = document.getElementById('expense-date');
const expenseNotesInput = document.getElementById('expense-notes');
const expenseCategoryInput = document.getElementById('expense-category');
const categoryItems = document.querySelectorAll('.category-item');
const navTabs = document.querySelectorAll('.nav-tabs a');
const tabContents = document.querySelectorAll('.tab-content');
const expenseTableBody = document.getElementById('expense-table-body');
const noExpensesMessage = document.getElementById('no-expenses-message');
const totalSpentElement = document.getElementById('total-spent');
const avgDailyElement = document.getElementById('avg-daily');
const biggestCategoryElement = document.getElementById('biggest-category');
const timeFilters = document.querySelectorAll('.time-filter');

// Set today's date as default
expenseDateInput.valueAsDate = new Date();

// Category selection
categoryItems.forEach(item => {
    item.addEventListener('click', () => {
        categoryItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        expenseCategoryInput.value = item.dataset.category;
    });
});

// Tab navigation
navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = tab.dataset.tab;
        
        // Update active tab
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show target tab content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === targetTab) {
                content.classList.add('active');
            }
        });
        
        // If viewing expenses, update the display
        if (targetTab === 'view-expenses') {
            updateExpenseDisplay();
        }
    });
});

// Time filter selection
timeFilters.forEach(filter => {
    filter.addEventListener('click', () => {
        timeFilters.forEach(f => f.classList.remove('active'));
        filter.classList.add('active');
        updateExpenseDisplay();
    });
});

// Load expenses from localStorage
function loadExpenses() {
    const expenses = localStorage.getItem('budgetBuddyExpenses');
    return expenses ? JSON.parse(expenses) : [];
}

// Save expenses to localStorage
function saveExpenses(expenses) {
    localStorage.setItem('budgetBuddyExpenses', JSON.stringify(expenses));
}

// Add new expense
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!expenseCategoryInput.value) {
        alert('Please select a category');
        return;
    }
    
    const newExpense = {
        id: Date.now(),
        name: expenseNameInput.value,
        category: expenseCategoryInput.value,
        amount: parseFloat(expenseAmountInput.value),
        date: expenseDateInput.value,
        notes: expenseNotesInput.value
    };
    
    const expenses = loadExpenses();
    expenses.push(newExpense);
    saveExpenses(expenses);
    
    // Reset form
    expenseForm.reset();
    expenseDateInput.valueAsDate = new Date();
    categoryItems.forEach(item => item.classList.remove('selected'));
    expenseCategoryInput.value = '';
    
    alert('Expense added successfully!');
    
    // If on view expenses tab, update display
    if (document.getElementById('view-expenses').classList.contains('active')) {
        updateExpenseDisplay();
    }
});

// Delete expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        const expenses = loadExpenses();
        const updatedExpenses = expenses.filter(expense => expense.id !== id);
        saveExpenses(updatedExpenses);
        updateExpenseDisplay();
    }
}

// Update expense display
function updateExpenseDisplay() {
    const expenses = loadExpenses();
    
    // Update table
    if (expenses.length === 0) {
        expenseTableBody.innerHTML = '';
        noExpensesMessage.style.display = 'block';
    } else {
        noExpensesMessage.style.display = 'none';
        
        // Sort expenses by date (newest first)
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let tableHTML = '';
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            const formattedDate = date.toLocaleDateString('en-IN');
            
            tableHTML += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${expense.name}</td>
                    <td>${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</td>
                    <td class="rupee-symbol">${formatAmount(expense.amount)}</td>
                    <td><span class="delete-btn" onclick="deleteExpense(${expense.id})">Delete</span></td>
                </tr>
            `;
        });
        
        expenseTableBody.innerHTML = tableHTML;
    }
    
    // Update stats
    updateStats(expenses);
    
    // Update chart
    updateChart(expenses);
}

// Update statistics
function updateStats(expenses) {
    if (expenses.length === 0) {
        totalSpentElement.textContent = formatAmount(0);
        avgDailyElement.textContent = formatAmount(0);
        biggestCategoryElement.textContent = 'None';
        return;
    }
    
    // Current month expenses
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear;
    });
    
    // Total spent this month
    const totalSpent = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    totalSpentElement.textContent = formatAmount(totalSpent);
    
    // Average daily spending
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const avgDaily = totalSpent / daysInMonth;
    avgDailyElement.textContent = formatAmount(avgDaily);
    
    // Biggest expense category
    const categoryTotals = {};
    monthExpenses.forEach(expense => {
        if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.amount;
        } else {
            categoryTotals[expense.category] = expense.amount;
        }
    });
    
    let biggestCategory = 'None';
    let maxAmount = 0;
    
    for (const category in categoryTotals) {
        if (categoryTotals[category] > maxAmount) {
            maxAmount = categoryTotals[category];
            biggestCategory = category.charAt(0).toUpperCase() + category.slice(1);
        }
    }
    
    biggestCategoryElement.textContent = biggestCategory;
}

// Update chart
function updateChart(expenses) {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    // Get active time filter
    const activeFilter = document.querySelector('.time-filter.active');
    const period = activeFilter ? activeFilter.dataset.period : 'monthly';
    
    // Prepare data based on selected period
    let labels = [];
    let data = [];
    
    // For demo purposes, we'll create some sample data
    // In a real app, you would process the actual expenses
    if (period === 'daily') {
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        data = [120, 190, 300, 500, 200, 300, 450];
    } else if (period === 'weekly') {
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        data = [1200, 1900, 1500, 2100];
    } else if (period === 'monthly') {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        data = [5000, 7000, 6500, 8000, 7500, 9000];
    } else if (period === 'yearly') {
        labels = ['2019', '2020', '2021', '2022', '2023'];
        data = [45000, 52000, 58000, 62000, 70000];
    }
    
    // Format data with rupee symbol for tooltips
    const formattedData = data.map(value => formatAmount(value));
    
    // Create or update chart
    if (window.expenseChart) {
        window.expenseChart.destroy();
    }
    
    window.expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses',
                data: data,
                backgroundColor: '#4CAF50',
                borderColor: '#2E7D32',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatAmount(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatAmount(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    updateExpenseDisplay();
});
