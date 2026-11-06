# Tax Expenses

`tax-expenses/index.html` sends each expense, and each paid-out deal, to a Google Apps Script
(`apps-script/Code.gs`). The script writes it into that year's tax workbook (the
TAXES_BLANK real-estate template, as a Google Sheet): right tab, right column,
under its month, in date order, with the template's GST and Total formulas.

The repo is public, so nothing personal lives here. The web app URL and
passcode are entered on the page and saved to `users/{uid}/settings/taxTracker`
(or to the browser if Firestore rules refuse that path). Sheet IDs, the
passcode, learned vendors and the optional Anthropic key live in the script's
Script properties, inside your Google account.

## Setup

### Part A — The Google Sheet

1. Upload `TAXES_BLANK__REAL_ESTATE_2.xlsx` to Google Drive and open it.
2. Choose **File → Save as Google Sheets**. A new tab opens with the Google
   Sheets copy. Rename it `2026 Taxes`.
   - You should see the same six tabs: Basic Books, Home Office Expenses,
     Vehicle Gas, Other Vehicle Expenses, Sales & Split, Capital Purchases.
     Keep those names exactly.
3. Copy the sheet's ID from the address bar: the long string between `/d/` and
   `/edit`. Keep it handy for step 7.

### Part B — The Apps Script

4. In the `2026 Taxes` sheet, choose **Extensions → Apps Script**. An editor
   opens with a file called `Code.gs`.
5. Select everything in `Code.gs`, delete it, and paste in the contents of
   `tax-expenses/apps-script/Code.gs` from this repo.
6. Click the **Save** icon. The red dot beside `Code.gs` disappears.
7. Click the **gear (Project Settings)**, scroll to **Script properties**, and
   add:
   - `PASSCODE`: a long phrase only you know.
   - `SHEET_2026`: the ID from step 3.

   Click **Save script properties**.

**Optional: teach it your 2025 vendors**

8. Upload your completed `2025 Taxes` workbook, open it, and use **File → Save
   as Google Sheets**. Copy its ID the same way as step 3.
9. Back in Script properties, add `SEED_SHEET_ID` with that ID.
10. In the editor, pick `importRulesFromSheet` from the function menu in the
    toolbar and click **Run**. Approve the permissions prompt.
    - The log at the bottom should say `Learned 50-something vendors from ...`.

**Deploy**

11. Click **Deploy → New deployment**. Click the gear next to "Select type"
    and choose **Web app**.
12. Set **Execute as: Me** and **Who has access: Anyone**. Click **Deploy**
    and approve the permissions prompt.
13. Copy the **Web app URL**. It ends in `/exec`.

**Stop here.** Before the page, check that the script is live: paste the URL
into a browser tab. You should see `"Tax expense tracker is running"`.

### Part C — Connect the page

14. Open `http://localhost:8000/tax-expenses/` (or the live page after you
    push) and sign in.
15. Paste the Web app URL and your passcode, then click **Test and save**.
    - The pill at the top right should read **2026 SHEET**, and the Tax year
      picker appears.
16. Add a test expense, then open the Google Sheet.
    - It should appear on the right tab under its month, with GST and Total
      filled in by the formulas. Delete it from the page afterwards.

## Later

- **Receipt photos:** add an `ANTHROPIC_API_KEY` script property (and
  optionally `CLAUDE_MODEL`). No redeploy is needed. The Take photo / Upload
  buttons appear the next time the page loads. Each receipt costs a few cents
  on your Anthropic API billing.
- **A new tax year:** make a fresh Google Sheets copy of the blank template,
  add `SHEET_2027` with its ID, and reload the page.
- **Changing `Code.gs`:** paste the new version over the old one, then after saving, use **Deploy → Manage deployments →
  edit (pencil) → Version: New version → Deploy**. That keeps the same URL.
  "New deployment" would give you a new URL to re-enter on the page.

## Deals paid

The **Deal paid** tab of the form writes one row to **Sales & Split** per payout,
in date order. Three types:

- **Regular deal** — brokerage fee, royalty (% of gross) and donation are filled
  from the deal defaults (set under "Deal defaults" on the page: $500, 1%, $50).
- **Paperwork fee** — the fee charged to another agent (default $350): royalty
  only, no brokerage fee or donation.
- **Leads profit share** — GST included, no fee, royalty or donation. Written
  as "Leads Profit Share - <month>".

The script writes Gross (C), Brokerage Fees (E), Royalty (G), Donation (I) and
Net Pay (M); the GST columns, Net Commission (J), Personal Taxes Held (K) and
Net GST (L) are formulas. Saving a deal number that is already in the sheet
asks for a second click, since a double-ended deal is legitimate but a
duplicate entry is not.

## How the script places rows

- Month headings (January, February, …) on Basic Books, Vehicle Gas and Other
  Vehicle Expenses, created as needed in month order; entries in date order
  under them.
- Empty template rows are used first. When a tab runs out, rows are inserted
  and every SUM in the Totals row is rewritten to cover row 2 through the row
  above Totals. This also fixes the blank template's Vehicle Gas and Other
  Vehicle Totals, which stopped one row short.
- Each row the page adds carries hidden developer metadata (`taxTrackerId`),
  so it can be edited or deleted from the page. Rows typed directly into the
  sheet show in the list as read-only.
- Amount mode "Before GST" writes the receipt total minus GST on tabs whose
  formula adds 5% on top; when the receipt's GST differs from 5% of that, the
  real GST is typed over the formula on that row. Vehicle Gas always takes the
  receipt total.
