from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json, os, uuid, base64
from datetime import datetime

app = FastAPI(title="SplitSmart API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "database.json"

# ---------- Database helpers ----------
def load_db():
    if not os.path.exists(DB_FILE):
        return {"groups": [], "expenses": []}
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

# ---------- Request models ----------
class Group(BaseModel):
    name: str
    members: List[str]

class Expense(BaseModel):
    group_id: str
    title: str
    amount: float
    paid_by: str
    split_between: List[str]

class ReceiptScan(BaseModel):
    image_base64: str

# ---------- Routes ----------
@app.get("/")
def root():
    return {"message": "SplitSmart API is running!"}


# -- Groups --
@app.post("/groups")
def create_group(group: Group):
    db = load_db()
    new_group = {
        "id": str(uuid.uuid4()),
        "name": group.name,
        "members": group.members,
        "created_at": datetime.now().isoformat()
    }
    db["groups"].append(new_group)
    save_db(db)
    return new_group

@app.get("/groups")
def get_groups():
    return load_db()["groups"]

@app.get("/groups/{group_id}")
def get_group(group_id: str):
    db = load_db()
    group = next((g for g in db["groups"] if g["id"] == group_id), None)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@app.delete("/groups/{group_id}")
def delete_group(group_id: str):
    db = load_db()
    db["groups"] = [g for g in db["groups"] if g["id"] != group_id]
    db["expenses"] = [e for e in db["expenses"] if e["group_id"] != group_id]
    save_db(db)
    return {"message": "Deleted"}


# -- Expenses --
@app.post("/expenses")
def add_expense(expense: Expense):
    db = load_db()
    new_expense = {
        "id": str(uuid.uuid4()),
        "group_id": expense.group_id,
        "title": expense.title,
        "amount": expense.amount,
        "paid_by": expense.paid_by,
        "split_between": expense.split_between,
        "date": datetime.now().isoformat()
    }
    db["expenses"].append(new_expense)
    save_db(db)
    return new_expense

@app.get("/expenses/{group_id}")
def get_expenses(group_id: str):
    db = load_db()
    return [e for e in db["expenses"] if e["group_id"] == group_id]

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: str):
    db = load_db()
    db["expenses"] = [e for e in db["expenses"] if e["id"] != expense_id]
    save_db(db)
    return {"message": "Deleted"}


# -- Balances & Settlements --
@app.get("/balances/{group_id}")
def get_balances(group_id: str):
    db = load_db()
    expenses = [e for e in db["expenses"] if e["group_id"] == group_id]

    balances: dict = {}

    for expense in expenses:
        paid_by = expense["paid_by"]
        amount = expense["amount"]
        split_between = expense["split_between"]
        share = amount / len(split_between)

        balances[paid_by] = balances.get(paid_by, 0) + amount
        for person in split_between:
            balances[person] = balances.get(person, 0) - share

    # Simplify debts into direct settlements
    debtors = sorted([(k, v) for k, v in balances.items() if v < -0.01], key=lambda x: x[1])
    creditors = sorted([(k, v) for k, v in balances.items() if v > 0.01], key=lambda x: -x[1])

    settlements = []
    i, j = 0, 0
    debtors = list(debtors)
    creditors = list(creditors)

    while i < len(debtors) and j < len(creditors):
        debtor, debt = debtors[i]
        creditor, credit = creditors[j]
        settle = min(-debt, credit)
        settlements.append({"from": debtor, "to": creditor, "amount": round(settle, 2)})
        debtors[i] = (debtor, debt + settle)
        creditors[j] = (creditor, credit - settle)
        if abs(debtors[i][1]) < 0.01:
            i += 1
        if abs(creditors[j][1]) < 0.01:
            j += 1

    return {
        "balances": {k: round(v, 2) for k, v in balances.items()},
        "settlements": settlements
    }


# -- AI Receipt Scanner --
import asyncio

@app.post("/scan-receipt")
async def scan_receipt(data: ReceiptScan):
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        raise HTTPException(status_code=500, detail="google-genai not installed.")

    try:
        image_b64 = data.image_base64
        if "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]

        image_bytes = base64.b64decode(image_b64)

        client = genai.Client(api_key="AIzaSyAXzDDn_ZhGkdvRsRKmTZ3uNiMxTHaFO20")
        def call_gemini():
            return client.models.generate_content(
                model="models/gemini-2.5-flash",
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part(inline_data=types.Blob(data=image_bytes, mime_type="image/jpeg")),
                            types.Part(text=
                                "Analyze this receipt and extract all items with prices. "
                                "Return ONLY valid JSON in this exact format, no extra text:\n"
                                '{"items": [{"name": "Item name", "price": 0.00}], "total": 0.00, "currency": "MYR"}\n'
                                'If you cannot read it, return: {"error": "Could not read receipt"}'
                            ),
                        ]
                    )
                ]
            )

        response = await asyncio.to_thread(call_gemini)

        text = response.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Gemini returned non-JSON response")
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())