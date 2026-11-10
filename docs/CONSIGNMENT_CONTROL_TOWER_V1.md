# NITERUN Consignment Control Tower — Operational Runbook v1
**November 10, 2026 · NITE Run Delivery LLC · Pilot stage**

## The core separation

NITERUN is the consignment distribution intermediary. The independent seller owns and operates their Amazon seller account, but does **not** purchase the consigned merchandise upfront when the supplier-funded agreement allows this. Amazon pays the seller. NITERUN then collects the seller's **contractual remittance** using a separately authorized payment method; NITERUN retains its distribution fee and pays the original manufacturer.

**Never count an Amazon sale as money in NITERUN's bank.** Distinguish:
1. Reported sale
2. Verified sale
3. Amazon account settlement/disbursement
4. Statement issued / debt due
5. Processor-confirmed payment to NITERUN
6. Manufacturer remittance completed
7. Final net contribution after expenses and reversals

## ID chain and evidence

| Record | Example | Proves |
|---|---|---|
| Supplier | SUP-000001 | Legal owner and upstream agreement |
| Product | PRD-000001 | Authorized catalog item, supplier SKU, ASIN |
| Lot | LOT-000001 | Authorized consignment batch, quantity and funding |
| Seller | NITE Academy account UUID / Amazon merchant ID | Identity and marketplace status; different IDs |
| Seller agreement | AGR-000001 | Signed downstream terms and fee/payment rights |
| Allocation | ALC-000001 | Seller, lot, reserved quantity, seller SKU, FNSKU, FBA shipment |
| Movement | MOV-000001 | Shipped/received/sold/returned/lost, source and verification |
| Amazon order line | ORD-000001 | Specific approved allocation, Amazon order/item, fees/refunds |
| Amazon report | RPT-000001 | Payout period and protected source file, verification status |
| Seller statement | STM-000001 | The economic waterfall and contractual amount due |
| Collection event | PAY-000001 | Processor-confirmed receipt or compensating reversal |
| Supplier remittance | REM-000001 | NITERUN-to-manufacturer payment evidence |

All records have a separate database UUID; readable codes are reference labels, not authorization secrets.

## Money waterfall: sample only

For one $40 sale, assume $12 in Amazon fees/allocated costs and $28 distributable:
- Seller retains: $7
- Manufacturer contractual share: $18
- NITERUN fee: $3
- **Seller owes NITERUN $21.**
- Once the seller pays $21 and processor evidence clears, NITERUN remits $18 to the manufacturer and retains $3 before company overhead, taxes, and additional payment charges.

The real statement must reconcile **only NITERUN-consigned SKUs**, not all merchandise sold in the member's Amazon account. Account-level Amazon payout can contain other sales, account reserves, adjustments and negative balances.

## How the seller pays

1. The operator verifies an Amazon report, its order lines, FBA shipment, source chain and refund adjustments. An uploaded report is not independent proof of everything a seller did.
2. NIKO computes the statement and checks that the detailed order lines total the requested amounts; a reviewer approves issuance.
3. After the relevant Amazon disbursement condition is met, NITERUN issues a **Stripe invoice** (reference STM-... in invoice metadata / description), payable through a Stripe-hosted invoice page by an enabled ACH bank-payment method.
4. The member completes the payment. Stripe handles bank credentials; NITERUN never receives a Seller Central login or raw account/routing credentials.
5. A verified Stripe webhook/reconciled bank record creates one **PAY-... received** event, identified by the provider event ID to prevent duplication.
6. Only cleared, verified collections count as NITERUN cash. Reversals create new negative events, never erase prior records.
7. The manufacturer receives a **REM-...** transfer only up to its contracted share and within the cash actually collected. The system stores the remittance confirmation.
8. An overdue/unpaid account gets no new consignment allocations pending manual review. Legal remedies follow the agreement.

**Not yet live:** Stripe invoice creation, ACH mandates/debits, payment webhooks, manufacturer payouts. No live money is being moved in this release. ACH requires the seller's specific authorization, and processor/payment fees may apply.

## Individual vs Professional Amazon reporting

**Individual selling plan ($0/month, +$0.99 per sale and all applicable other fees):** Amazon does not grant SP-API access. Seller downloads the official Seller Central settlement Flat File V2/Flat File or other available payment export, then uploads it privately in Academy *after their consignment has shipped*. The site generates a SHA-256 content digest, stores the evidence in a private account-scoped 5 MB bucket and records it as **unverified**. NITERUN must manually reconcile matched SKUs, quantities, Amazon account settlements, supplier shipments and warehouse receipts. This is never perfect independent surveillance of the seller.

**Professional ($39.99/month plus additional fees):** A public SP-API application with Amazon approval and seller OAuth authorization could replace most manual uploads. NITERUN must still verify all seller rights and data, record returns, and use an authorized separate collection mechanism. It cannot commandeer the seller's Amazon proceeds.

Do not try to bypass Individual-plan API restrictions with browser automation or collect seller credentials.

## Inventory movement reconciliation

- Manufacturer-signed supply agreement and SKU/lot authorization: SUP / PRD / LOT
- Confirm funded shipment: AlC with Amazon inbound shipment ID, seller SKU/FNSKU
- Compare supplier pack list and carrier tracking with Amazon receiving report
- Record accepted/received quantities separately from claimed/shipped quantities
- Match verified order lines and refund/return rows to allocated SKU
- Account for unsold and stranded units, inventory removals, missing/damaged items
- Reconcile each lot: starting allocation + accepted returns − sold − lost − removed = expected remaining physical units, adjusted for transfers and discrepancies
- Flag missing reports, unsupported quantities, account termination, storage fee risk and unpaid statements

All inventory event rows are append-only. Incorrect entries require correcting events, not silent edits.

## Accounting controls implemented

- RLS protected member-specific statements, reports, agreements and order lines; private supplier records visible only to the trusted backend.
- No member can mark themselves approved, create verified order records, create statements, post collections or remit manufacturer money.
- Allocation trigger blocks exceeding the authorized lot size or proceeding without valid upstream rights, funded inbound logistics, seller verification and signed seller terms.
- Order verification requires an approved report, matching allocation and consistent supplier.
- A payable statement requires order totals that match verified Amazon report lines.
- Finalized financial amounts are locked. Payment facts are append-only and deduplicated by provider event ID.
- Payment reversal is separately recorded and cannot exceed prior receipts.
- Manufacturer paid remittance cannot exceed the supplier share or collections.
- A security-invoker member view shows seller-specific outstanding balances. A service-role-only admin view summarizes member receivables.
- Members can download itemized statements as CSV for their own records. The official Stripe invoice PDF is only available after future integration.

## First genuine pilot checklist

1. One upstream supplier agreement authorizing subconsignment and title/proceeds treatment, reviewed by counsel.
2. One authenticated, approved, lawful Amazon seller, with signed member terms and required platform approvals.
3. One authorized, fully funded lot, ideally small enough that loss from an unpaid seller is tolerable.
4. Supplier-shipping + Amazon receiving + actual order lines + payout settlement evidence.
5. Signed statement, confirmed authorized seller payment, and real manufacturer remittance.
6. Compare quoted net margins to realized cash; assess refunds, insolvency and collection cost. Expand only after real results.

## Release status

The database and GitHub Pages member interface have been modified; no contracts or transaction data have been populated. No ACH charge or Stripe invoice was created. Production signup redirect / email confirmation, live Amazon SP-API, supplier contracts, accounting review process, and domain cutover remain external launch gates. The registered niteacademy.com domain must be moved off Namecheap parking DNS before that URL can serve this site.

**Tech stack:** Existing GitHub repository `chaybuilds/niteacademy-site` and existing Supabase project. Security inspections verify private storage and no member write permissions for financial verification tables.
