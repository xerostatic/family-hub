// Budget Import Script
// Run with: node scripts/import-budget.js

const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, '../Finances (2) - Sheet4.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV (simple parser for this format)
const lines = csvContent.split('\n').filter(line => line.trim());

// Extract headers (dates)
const headerLine = lines[0];
const headers = headerLine.split(',').map(h => h.trim()).filter(h => h);

// Find date columns (skip first 6 columns which are empty/Column 1)
const dateColumns = headers.slice(6); // Starting from index 6

// Parse data rows
const budgetItems = [];
const incomeItems = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const cells = line.split(',').map(c => c.trim());
  
  const itemName = cells[5]; // Column 1 (index 5)
  
  if (!itemName || itemName === 'Column 1' || itemName === 'Bill total' || itemName === 'Total +/-') {
    continue;
  }
  
  // Check if it's income
  if (itemName.toLowerCase().includes('pay') || itemName.toLowerCase().includes('rebecca')) {
    // This is income - Rebecca Pay
    const amounts = [];
    const dates = [];
    
    dateColumns.forEach((dateHeader, idx) => {
      const amount = cells[6 + idx];
      if (amount && amount !== '') {
        amounts.push(parseFloat(amount));
        dates.push(dateHeader);
      }
    });
    
    if (amounts.length > 0) {
      // Determine frequency - looks like bi-weekly
      const firstDate = dates[0];
      incomeItems.push({
        name: itemName,
        amount: amounts[0], // All amounts are the same
        frequency: 'biweekly',
        recurrence: 'biweekly',
        firstDate: firstDate,
        category: 'Salary'
      });
    }
    continue;
  }
  
  // This is an expense
  const amounts = [];
  const dates = [];
  
  dateColumns.forEach((dateHeader, idx) => {
    const amount = cells[6 + idx];
    if (amount && amount !== '') {
      amounts.push(parseFloat(amount));
      dates.push(dateHeader);
    }
  });
  
  if (amounts.length === 0) continue;
  
  // Determine frequency
  let frequency = 'none';
  let recurrence = null;
  
  if (amounts.length > 6) {
    // Appears monthly or bi-weekly
    // Check if amounts are consistent
    const uniqueAmounts = [...new Set(amounts)];
    if (uniqueAmounts.length === 1) {
      // Check spacing - if every other date, it's bi-weekly
      if (dates.length >= 4) {
        frequency = 'biweekly';
        recurrence = 'biweekly';
      } else {
        frequency = 'monthly';
        recurrence = 'monthly';
      }
    } else {
      frequency = 'monthly';
      recurrence = 'monthly';
    }
  } else if (amounts.length > 1) {
    frequency = 'monthly';
    recurrence = 'monthly';
  }
  
  // Determine category
  let category = 'Bills';
  const nameLower = itemName.toLowerCase();
  if (nameLower.includes('food') || nameLower.includes('grocer')) {
    category = 'Groceries';
  } else if (nameLower.includes('gas')) {
    category = 'Gas';
  } else if (nameLower.includes('church') || nameLower.includes('netflix') || nameLower.includes('premium')) {
    category = 'Entertainment';
  } else if (nameLower.includes('student') || nameLower.includes('loan')) {
    category = 'Healthcare'; // Or Other
  } else if (nameLower.includes('homeschool')) {
    category = 'Healthcare'; // Or Other
  }
  
  budgetItems.push({
    name: itemName,
    amount: amounts[0], // Use first amount
    frequency,
    recurrence,
    firstDate: dates[0],
    category
  });
}

// Output for manual import or create SQL
console.log('=== INCOME ITEMS ===');
incomeItems.forEach(item => {
  console.log(JSON.stringify(item, null, 2));
});

console.log('\n=== EXPENSE ITEMS ===');
budgetItems.forEach(item => {
  console.log(JSON.stringify(item, null, 2));
});

// Generate SQL insert statements
console.log('\n=== SQL INSERT STATEMENTS ===');
console.log('-- First, make sure you have a family member with name "Rebecca" or update the family_member_id');
console.log('-- Income Items:');
incomeItems.forEach(item => {
  const date = convertDate(item.firstDate);
  const paydayDate = date;
    const recurrenceValue = item.recurrence || 'NULL';
  console.log(`INSERT INTO budget_items (category, description, amount, due_date, is_income, recurrence, pay_frequency, payday_date, family_member_id, paid) VALUES ('${item.category}', '${item.name}', ${item.amount}, '${date}', true, ${recurrenceValue === 'NULL' ? 'NULL' : `'${recurrenceValue}'`}, '${item.frequency}', '${paydayDate}', (SELECT id FROM family_members WHERE name ILIKE '%rebecca%' LIMIT 1), false);`);
});

console.log('\n-- Expense Items:');
budgetItems.forEach(item => {
  const date = convertDate(item.firstDate);
  const recurrenceValue = item.recurrence || 'NULL';
  console.log(`INSERT INTO budget_items (category, description, amount, due_date, is_income, recurrence, family_member_id, paid) VALUES ('${item.category}', '${item.name}', ${item.amount}, '${date}', false, ${recurrenceValue === 'NULL' ? 'NULL' : `'${recurrenceValue}'`}, (SELECT id FROM family_members LIMIT 1), false);`);
});

function convertDate(dateStr) {
  // Convert "15-Aug" format to "2025-08-15" (assuming 2025)
  if (!dateStr || dateStr === '') return new Date().toISOString().split('T')[0];
  
  const months = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  const parts = dateStr.split('-');
  if (parts.length === 2) {
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]] || '01';
    // Determine year - if it's Aug-Dec, use 2024, otherwise 2025
    const monthNum = parseInt(month);
    const year = (monthNum >= 8) ? '2024' : '2025';
    return `${year}-${month}-${day}`;
  }
  
  return new Date().toISOString().split('T')[0];
}

