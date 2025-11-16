// Format amount to display with rupee symbol
function formatAmount(amount) {
    return '₹' + parseFloat(amount).toFixed(2);
}

// Subcategories data
const subcategories = {
    food: ['Groceries', 'Dining Out', 'Coffee/Tea', 'Snacks'],
    transport: ['Fuel', 'Public Transport', 'Vehicle Maintenance', 'Parking/Tolls', 'Taxi', 'Vehicle Insurance'],
    entertainment: ['Movies', 'Concerts', 'Games', 'Events'],
    shopping: ['Clothing', 'Personal Care', 'Electronics', 'Home Goods', 'Gifts', 'Hobbies/Leisure'],
    bills: ['Rent/Mortgage', 'Utilities', 'Internet/Cable', 'Subscriptions', 'Streaming Services', 'Taxes'],
    health: ['Medication', 'Doctor Appointment', 'Fitness'],
    other: ['Education', 'Travel', 'Charity/Donations', 'Savings/Investments']
};

// DOM elements
const expenseForm = document.getElementById('expense-form');
const expenseNameInput = document.getElementById('expense-name');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseDateInput = document.getElementById('expense-date');
const expenseNotesInput = document.getElementById('expense-notes');
const expenseCategoryInput = document.getElementById('expense-category');
const expenseSubcategoryInput = document.getElementById('expense-subcategory');
const mainCategories = document.getElementById('main-categories');
const subCategories = document.getElementById('sub-categories');
const backToMainBtn = document.getElementById('back-to-main-categories');
const categoryItems = document.querySelectorAll('.category-item');
const navTabs = document.querySelectorAll('.nav-tabs a');
const tabContents = document.querySelectorAll('.tab-content');
const expenseTableBody = document.getElementById('expense-table-body');
const noExpensesMessage = document.getElementById('no-expenses-message');
const totalSpentElement = document.getElementById('total-spent');
const avgDailyElement = document.getElementById('avg-daily');
const biggestCategoryElement = document.getElementById('biggest-category');
const timeFilters = document.querySelectorAll('.time-filter');
const chartTypeBtns = document.querySelectorAll('.chart-type-btn');
const periodSelects = document.querySelectorAll('.period-select');

// Chart configuration
let currentChartType = 'pie';
let currentPeriod = 'daily';

// Set today's date as default
expenseDateInput.valueAsDate = new Date();

// Main category selection
categoryItems.forEach(item => {
    item.addEventListener('click', () => {
        const category = item.dataset.category;
        showSubcategories(category);
    });
});

// Show subcategories for selected main category
function showSubcategories(category) {
    mainCategories.style.display = 'none';
    subCategories.style.display = 'block';
    
    // Clear previous subcategories
    subCategories.innerHTML = '';
    
    // Add back button
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'back-btn';
    backBtn.innerHTML = '<i>←</i> Back to Categories';
    backBtn.addEventListener('click', showMainCategories);
    subCategories.appendChild(backBtn);
    
    // Add subcategories
    if (subcategories[category]) {
        subcategories[category].forEach(subcat => {
            const subcatItem = document.createElement('div');
            subcatItem.className = 'subcategory-item';
            subcatItem.innerHTML = `
                <div>${subcat}</div>
            `;
            subcatItem.addEventListener('click', () => {
                document.querySelectorAll('.subcategory-item').forEach(item => {
                    item.classList.remove('selected');
                });
                subcatItem.classList.add('selected');
                expenseCategoryInput.value = category;
                expenseSubcategoryInput.value = subcat;
            });
            subCategories.appendChild(subcatItem);
        });
    }
}

// Show main categories
function showMainCategories() {
    mainCategories.style.display = 'grid';
    subCategories.style.display = 'none';
    expenseCategoryInput.value = '';
    expenseSubcategoryInput.value = '';
    categoryItems.forEach(item => item.classList.remove('selected'));
}

// Back button event
backToMainBtn.addEventListener('click', showMainCategories);

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

// Period selection for stats
periodSelects.forEach(select => {
    select.addEventListener('change', updateExpenseDisplay);
});

// Chart type selection
chartTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        chartTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentChartType = btn.dataset.chartType;
        updateExpenseDisplay();
    });
});

// Time filter selection
timeFilters.forEach(filter => {
    filter.addEventListener('click', () => {
        timeFilters.forEach(f => f.classList.remove('active'));
        filter.classList.add('active');
        currentPeriod = filter.dataset.period;
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
    
    if (!expenseCategoryInput.value || !expenseSubcategoryInput.value) {
        alert('Please select both category and subcategory');
        return;
    }
    
    const newExpense = {
        id: Date.now(),
        name: expenseNameInput.value,
        category: expenseCategoryInput.value,
        subcategory: expenseSubcategoryInput.value,
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
    showMainCategories();
    
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
                    <td>${expense.subcategory}</td>
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

// Get expenses for specific period
function getExpensesForPeriod(expenses, period) {
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'daily':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'weekly':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay());
            break;
        case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= now;
    });
}

// Update statistics
function updateStats(expenses) {
    if (expenses.length === 0) {
        totalSpentElement.textContent = formatAmount(0);
        avgDailyElement.textContent = formatAmount(0);
        biggestCategoryElement.textContent = 'None';
        return;
    }
    
    // Get selected periods for each stat
    const totalPeriod = document.getElementById('total-period').value;
    const avgPeriod = document.getElementById('avg-period').value;
    const biggestPeriod = document.getElementById('biggest-period').value;
    
    // Calculate total spent for selected period
    const totalExpenses = getExpensesForPeriod(expenses, totalPeriod);
    const totalSpent = totalExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    totalSpentElement.textContent = formatAmount(totalSpent);
    
    // Calculate average daily spending for selected period
    const avgExpenses = getExpensesForPeriod(expenses, avgPeriod);
    const avgTotal = avgExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    let avgDaily = 0;
    const now = new Date();
    
    switch(avgPeriod) {
        case 'daily':
            avgDaily = avgTotal;
            break;
        case 'weekly':
            avgDaily = avgTotal / 7;
            break;
        case 'monthly':
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            avgDaily = avgTotal / daysInMonth;
            break;
        case 'yearly':
            const isLeapYear = (now.getFullYear() % 4 === 0 && (now.getFullYear() % 100 !== 0 || now.getFullYear() % 400 === 0));
            avgDaily = avgTotal / (isLeapYear ? 366 : 365);
            break;
    }
    
    avgDailyElement.textContent = formatAmount(avgDaily);
    
    // Find biggest expense category for selected period
    const biggestExpenses = getExpensesForPeriod(expenses, biggestPeriod);
    
    if (biggestExpenses.length === 0) {
        biggestCategoryElement.textContent = 'None';
        return;
    }
    
    const categoryTotals = {};
    biggestExpenses.forEach(expense => {
        const key = `${expense.category}-${expense.subcategory}`;
        if (categoryTotals[key]) {
            categoryTotals[key].amount += expense.amount;
        } else {
            categoryTotals[key] = {
                category: expense.category,
                subcategory: expense.subcategory,
                amount: expense.amount
            };
        }
    });
    
    let biggestExpense = null;
    let maxAmount = 0;
    
    for (const key in categoryTotals) {
        if (categoryTotals[key].amount > maxAmount) {
            maxAmount = categoryTotals[key].amount;
            biggestExpense = categoryTotals[key];
        }
    }
    
    if (biggestExpense) {
        const categoryName = biggestExpense.category.charAt(0).toUpperCase() + biggestExpense.category.slice(1);
        biggestCategoryElement.textContent = `${categoryName} (${biggestExpense.subcategory})`;
    } else {
        biggestCategoryElement.textContent = 'None';
    }
}

// Update chart
function updateChart(expenses) {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    // Filter expenses based on current period
    const periodExpenses = getExpensesForPeriod(expenses, currentPeriod);
    
    // Prepare data based on expenses
    const categoryTotals = {};
    periodExpenses.forEach(expense => {
        const key = `${expense.category}-${expense.subcategory}`;
        if (categoryTotals[key]) {
            categoryTotals[key].amount += expense.amount;
        } else {
            categoryTotals[key] = {
                category: expense.category,
                subcategory: expense.subcategory,
                amount: expense.amount
            };
        }
    });
    
    const labels = Object.keys(categoryTotals).map(key => {
        const item = categoryTotals[key];
        return `${item.category.charAt(0).toUpperCase() + item.category.slice(1)} (${item.subcategory})`;
    });
    const amounts = Object.keys(categoryTotals).map(key => categoryTotals[key].amount);
    
    // Color palette for categories
    const colorPalette = [
        '#2196F3', '#FF9800', '#4CAF50', '#F44336', 
        '#9C27B0', '#FFEB3B', '#00BCD4', '#795548'
    ];
    
    // Create or update chart
    if (window.expenseChart) {
        window.expenseChart.destroy();
    }
    
    if (currentChartType === 'pie') {
        // Pie Chart Configuration
        window.expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: amounts,
                    backgroundColor: colorPalette.slice(0, labels.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${formatAmount(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        // Bar Chart Configuration
        window.expenseChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Expenses by Category',
                    data: amounts,
                    backgroundColor: '#2196F3',
                    borderColor: '#1976D2',
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
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    updateExpenseDisplay();
});

