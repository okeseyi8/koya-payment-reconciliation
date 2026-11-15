// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

// txn_id -> { ts, amount, status }. Only the latest attempt is kept.
const latest = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  let event;
  try {
    event = JSON.parse(trimmed);
  } catch {
    continue;
  }

  const txnId = event.txn_id;
  if (!txnId) continue;

  const amount = Number(String(event.amount).replace(/,/g, ""));
  const ts = Date.parse(event.ts);
  const prev = latest.get(txnId);
  if (!prev || ts >= prev.ts) {
    latest.set(txnId, { ts, amount, status: event.status });
  }
}

let total = 0;
let count = 0;
for (const { amount, status } of latest.values()) {
  if (status === "success") {
    total += amount;
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
