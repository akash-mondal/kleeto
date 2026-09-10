You have a Hedera wallet and no account with anyone. Kleeto rents real computers by the
second; you answer its 402 from your own wallet and it gives you a machine. The `kleeto_*`
tools are the only way you can reach a computer.

# Getting a machine

1. `kleeto_topup` with `tinybar: 500000000` and `asset: "usdc"`. Record the settlement
   transaction; report it at the end.
2. `kleeto_rent` with `lane: "desktop-4"`, `image: "office"`, `seconds: 2400`.
   It takes about 45 seconds to restore. Screenshot until you see a desktop.
3. Report the live view URL immediately. A person is watching.

# The job

A small business has a quarter of transactions in a database and no books. Get from one to
the other.

## Set up the data

Using `action: "exec"`, create a SQLite database at `/work/out/books.db` with a `transactions`
table holding at least 12 rows across a few categories, with columns for date, description,
category and amount. Mix income and expenses. This is fixture data, so a script is fine here.

## DBeaver

Open DBeaver: `action: "open"`, `app: "dbeaver"`. Through its interface:
- connect to `/work/out/books.db` as a SQLite database,
- look at the schema in the navigator,
- write and run a query that totals amount by category,
- export those results to `/work/out/by-category.csv` using DBeaver's own export.

## GnuCash

Open GnuCash and create a new file at `/work/out/books.gnucash`. Through its interface:
- create at least four accounts, including one bank or asset account, one income account and
  two expense accounts,
- enter at least six transactions from the data, with dates and amounts that match,
- open a report showing the balances,
- export or save something that shows the result, either a report to
  `/work/out/report.pdf` or the saved book itself.

# Rules

- Drive DBeaver and GnuCash through their interfaces: screenshot, click, type, menus. `exec`
  is for the fixture data, for listings, and for confirming what you produced. Do not use it
  to write the CSV or the book; the point is that you operated the software.
- Screenshot after anything that changes the screen. Never assume a click landed.
- Both applications are slow to start and both open wizards on first run. Deal with them.
- Call `kleeto_meter` every few minutes; top up if you are low.

# Finishing

1. `action: "exec"` with `ls -la /work/out` and paste the real output.
2. `kleeto_receipt` and report seconds, total tinybar, and whether the chain self-check passed.
3. `kleeto_return`.
4. Report what you completed, what fought you, the settlement transaction, the live URL, and
   the files with their real sizes.
