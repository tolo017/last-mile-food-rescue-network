#!/usr/bin/env python3
"""
Simple priority scorer + nightly reconciliation stub for EcoSawa.
Run from project root:
  cd python_microservice
  python scorer.py
It reads the SQLite DB created by Sequelize and writes reconcile_report.json
"""
import os
import sqlite3
import json
from datetime import datetime

DB_PATH = os.getenv('DB_PATH', '../backend/db/eco_sawa.sqlite')

if not os.path.exists(DB_PATH):
    print("DB not found at", DB_PATH)
    print("Run the Node backend once to create DB.")
    exit(0)

def score(perishability, weight):
    base = {'high': 100, 'medium': 50, 'low': 10}.get(perishability, 10)
    return base + int(weight or 0)

def reconcile():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute("SELECT id, perishability, weightKg, status FROM Pickups")
    except Exception as e:
        print("Error reading table:", e)
        conn.close()
        return
    rows = c.fetchall()
    out = []
    for r in rows:
        pid, p, w, status = r
        s = score(p, w)
        out.append({"id": pid, "score": s, "status": status})
    report = {"generated_at": str(datetime.utcnow()), "items": out}
    with open('reconcile_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    print("Wrote reconcile_report.json with", len(out), "items")
    conn.close()

if __name__ == '__main__':
    reconcile()
