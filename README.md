# Ledger AI

Next.js + TypeScript + MySQL + Ollama starter for import/sales ledgers, profit calculation, and AI-Powered Inventory, Sales & Profit Management.


Ledger AI is a modern web application built with Next.js that helps businesses manage inventory, track purchases and sales, calculate profitability, and gain actionable insights through AI-powered analysis.
Designed to simplify business operations, Ledger AI brings inventory management, financial tracking, and intelligent sales insights together in one platform.

## Screenshots
	[Overview] https://github.com/danny0307721/ai-workspace/blob/main/screenshot/Overview.png
  [Ledger] https://github.com/danny0307721/ai-workspace/blob/main/screenshot/Ledger.png
  [Settings] https://github.com/danny0307721/ai-workspace/blob/main/screenshot/Settings.png
  
## Features
### Unified Import and Sales Ledger

The application combines imports and sales into a single ledger view.

- Record supplier purchases and customer sales
- View imports and sales together
- Filter entries by day, week, month, year, or all time
- Search by supplier, customer, product, or notes
- Sort and filter entries through the expandable tree navigation
- Browse suppliers under the Imports branch
- Browse customers under the Sales branch
- View only suppliers or customers active during the selected period
- Add imports and sales through dedicated entry forms

### Resizable Layout

The interface includes adjustable splitters that allow users to customize the workspace.

- Resize the tree navigation panel
- Resize the right-hand dashboard
- Adjust panel widths with the mouse
- Adjust panel widths with the keyboard
- Automatically switch to a stacked layout on smaller screens

### Date-Based Dashboard

The dashboard recalculates its figures according to the selected date range.

It displays:

- Total import expenditure
- Total sales revenue
- Imported quantity
- Sold quantity
- Estimated inventory cost of goods sold
- Other sales costs
- Estimated profit
- Estimated profit margin
- The number of imports and sales included in the selected period


### Inventory Overview

The Overview page shows the products with the lowest stock levels.

For each product, it displays:

- Product name
- Current stock quantity

The list is ordered from the lowest stock level to the highest. Products with negative stock are considered out of stock.


### Product Performance Insights

The Overview page highlights key product performance metrics:

- Best-selling product
- Highest-profit product
- Slowest-selling product
- Lowest-profit product

These insights are calculated from recorded sales and estimated product costs.

### AI Import Recommendations

Ledger AI automatically analyzes inventory and sales data when the Overview page loads.

The AI identifies products that may need to be imported and provides:

- Product name
- Urgency level
- Reason for the recommendation
- Suggested import quantity

The recommendation system prioritizes products with zero or low stock. If the local AI model is unavailable, the application uses inventory-based fallback logic to provide recommendations immediately.

### Profit Calculation

Profit is estimated using a weighted-average landed cost for each product.

The calculation includes:

- Unit purchase cost
- Shipping costs
- Tax costs
- Sales revenue
- Discounts
- Other sales costs

The application also identifies products where sales exceed recorded purchases.

### Settings

Users can customize the application through the Settings page.

Available settings include:

- Date format
- Font size
- Table density

### Responsive Design

The interface is designed for desktop and mobile use.

- Desktop layouts use resizable sidebars and panels
- Mobile layouts stack content vertically
- Tables and controls remain usable on smaller screens
- Navigation and forms adapt to the available screen width

## Technology Stack

- Next.js
- React
- TypeScript
- Prisma
- MySQL
- Ollama
- Zod

The AI recommendations are advisory and should be reviewed before making purchasing decisions.
