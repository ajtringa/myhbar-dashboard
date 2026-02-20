
MyHbar.io | Hedera Staking Monitor
RETAIL PAYS THE BILLS • ENTERPRISE CREATES STABILITY • INSTITUTIONAL GRADE

A high-precision, zero-server audit tool for the Hedera Mainnet. Monitor Native Staking, Liquid Staking (HBARX), and USDC balances with surgical accuracy.

🛠 Technical Methodology
1. Data Architecture

This is a Strict Mirror Node application. It performs real-time REST queries directly to the Hedera Mainnet API. No third-party servers or databases are used, ensuring your data is sourced directly from the ledger with 2-5 second consensus latency.

2. Consolidated Audit Logic

To maintain financial integrity, the system utilizes Inter-Account Elimination. All added wallets are treated as a single "Entity." Transfers between your own accounts are flagged as "Internal" and eliminated from Total In/Out headers. This ensures the dashboard reflects only true external wealth growth.

3. Staking & Reward Engines

Native Staking: Captures a 00:00 UTC baseline of pending rewards to calculate live "Today's Accrued" earnings.

Liquid Staking: Queries the Stader Smart Contract (0.0.1412503) via the 0xe6aa216c function to calculate the HBAR/HBARX exchange rate delta every 24 hours.

4. Accounting Standards

The Earnings Statement utilizes 28-Day Fiscal Periods. This provides four perfect 7-day weeks, allowing for accurate trend analysis and Year-over-Year (YoY) comparisons without the variability of traditional calendar months.

🔐 Privacy & Security

Zero-Knowledge Display: No data is sent to a server. All wallet IDs and nicknames are stored strictly in your browser's localStorage.

Knowledge-Based Access: Privacy Mode does not use traditional passwords. To unlock the dashboard, you must verify the Nickname or ID of an added wallet—if you know the data, you own the data.

🚀 How to Run

Clone the repository.

Open index.html in any modern web browser.

Add your Hedera Account ID (0.0.xxxxxx) to begin the audit.

