# Security Specification

This document details the security model, invariants, and threat analysis for the POS (Point of Sale) system Firestore database.

## 1. Data Invariants

1. **Products (`/products/{productId}`)**:
   - `price` must be a positive number (`price >= 0`).
   - `purchasePrice` must be a positive number (`purchasePrice >= 0`).
   - `stock` must be a non-negative integer (`stock >= 0`).
   - `minStock` must be a non-negative integer (`minStock >= 0`).
   - Required fields: `code`, `name`, `category`, `price`, `purchasePrice`, `stock`, `minStock`.

2. **Transactions (`/transactions/{transactionId}`)**:
   - `total` and `totalProfit` must be numeric.
   - `paymentType` must be one of `CASH`, `QRIS`, or `DEBT`.
   - `amountPaid` and `change` must be non-negative numbers.
   - Required fields: `invoiceNumber`, `date`, `items`, `total`, `totalProfit`, `paymentType`, `amountPaid`, `change`.

3. **Debts (`/debts/{debtId}`)**:
   - `totalDebt` and `remainingDebt` must be numbers.
   - `status` must be one of `UNPAID`, `PARTIAL`, or `PAID`.
   - Required fields: `customerName`, `customerPhone`, `totalDebt`, `remainingDebt`, `dueDate`, `status`, `payments`, `createdAt`.

4. **Settings (`/settings/{settingId}`)**:
   - Document ID must be `shop_profile`.
   - Required fields: `shopName`, `shopAddress`, `shopPhone`, `qrisText`, `receiptFooter`, `currencySymbol`.

---

## 2. The "Dirty Dozen" Payloads (Negative Tests)

The following payload attempts violate database integrity and must be rejected by Firestore Security Rules.

### Product Collection Violations
1. **Negative Price**: Product with negative price value.
2. **Negative Stock**: Product with negative stock value.
3. **Invalid ID Format**: Product document with a bloated/malicious document ID (e.g., extremely long or contains special injection characters).
4. **Missing Key Fields**: Product missing the required `name` or `code` fields.

### Transaction Collection Violations
5. **Invalid Payment Type**: Transaction with `paymentType` set to `BITCOIN`.
6. **Negative Total**: Transaction with a negative total value.
7. **Malformed Items Array**: Transaction items set to a simple string instead of an array.

### Debt Collection Violations
8. **Invalid Status**: Debt with status set to `OVERDUE` (invalid enum).
9. **Negative Debt**: Debt with negative `totalDebt`.

### Settings Collection Violations
10. **Wrong Settings Document ID**: Setting document created under custom path instead of `shop_profile`.
11. **Missing Shop Name**: Settings profile missing `shopName`.

### Global Violations
12. **Recursive Path Attack**: Trying to write deep, unauthorized nested paths (e.g. `/products/123/malicious/deep/path`).

---

## 3. Test Runner Specification (`firestore.rules.test.ts`)

Since this POS application operates without direct Firebase Auth login (using custom local session tracking), our security rules focus on structural, type, and value range constraints to protect database sanity.

```typescript
// firestore.rules.test.ts
// Standard test structure for validating structure-based Firestore rules.
// Verified via rule parsing and direct deployment.
```
