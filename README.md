# 💸 SplitSmart

> AI-powered mobile expense splitter — split bills, scan receipts, and settle up smarter.

Built as part of the **Shortcut Asia Internship Challenge 2026**

---

## 📱 What is SplitSmart?

SplitSmart is a full-stack mobile app that solves the everyday problem of splitting bills among friends. Whether it's a group trip, a dinner, or shared costs — SplitSmart tracks who paid what, calculates who owes who, and minimises the number of payments needed to settle everyone up.

The standout feature is the **AI Receipt Scanner** — take a photo of any receipt and Google Gemini Vision AI automatically extracts all items and the total, pre-filling the expense form in seconds.

---

## ✨ Key Features

- **Group Management** — Create groups for trips, meals, or any shared expense
- **Expense Tracking** — Record who paid, how much, and who to split with
- **Smart Split Preview** — See each person's share in real time as you type
- **Debt Simplification Algorithm** — Calculates the minimum number of payments to settle the group (e.g. 5 people → 4 transactions instead of 10)
- **Balance Dashboard** — Clear view of who owes who with exact amounts
- **AI Receipt Scanner** — Photo → Gemini Vision AI → auto-filled expense form
- **Delete Support** — Long press any group or expense to delete it

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native + Expo (TypeScript) |
| Navigation | Expo Router (file-based) |
| Backend API | Python + FastAPI |
| Data Storage | JSON flat-file (database.json) |
| AI Vision | Google Gemini 2.0 Flash |
| Image Handling | expo-image-picker + Base64 encoding |
| API Docs | FastAPI auto-generated /docs |

---

## 🏗️ Architecture

```
📱 Phone (Expo Go)          💻 Laptop (FastAPI)          🤖 Google
  React Native App    ←→     Python Backend        ←→    Gemini AI
  TypeScript UI               REST API + Logic            Vision API
                              database.json
```

The phone communicates with the backend over WiFi via REST API calls. All business logic (balance calculation, debt simplification, AI processing) lives in the backend — the frontend is purely UI.

---

## 📂 Project Structure

```
splitsmart/
├── frontend/                    # React Native (Expo)
│   ├── app/
│   │   ├── _layout.tsx          # Root navigation layout
│   │   ├── index.tsx            # Home screen (groups list)
│   │   ├── create-group.tsx     # Create group screen
│   │   ├── add-expense.tsx      # Add expense screen
│   │   ├── scanner.tsx          # AI receipt scanner screen
│   │   └── group/
│   │       └── [id].tsx         # Group detail (expenses + balances)
│   ├── constants/
│   │   └── api.ts               # Backend URL config
│   └── types/
│       └── index.ts             # TypeScript interfaces
│
└── backend/                     # Python FastAPI
    ├── main.py                  # All API routes + logic
    └── database.json            # Auto-generated data store
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- Expo Go app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/splitsmart.git
cd splitsmart
```

---

### 2. Set up the Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn python-multipart pillow requests google-genai
```

Open `backend/main.py` and replace the Gemini API key:
```python
client = genai.Client(api_key="YOUR_GEMINI_API_KEY_HERE")
```

Start the backend:
```bash
# Windows - use full path to avoid venv conflicts
C:\path\to\splitsmart\backend\venv\Scripts\uvicorn main:app --reload --host 0.0.0.0

# Mac/Linux
uvicorn main:app --reload --host 0.0.0.0
```

You should see: `Application startup complete` ✅

Visit `http://localhost:8000/docs` to see the auto-generated API documentation.

---

### 3. Set up the Frontend

```bash
cd frontend
npm install
npx expo install expo-image-picker
```

Find your computer's local IP address:
```bash
# Windows
ipconfig
# Look for IPv4 Address under Wi-Fi (e.g. 192.168.1.105)

# Mac/Linux
ifconfig | grep inet
```

Open `frontend/constants/api.ts` and update your IP:
```ts
export const API_URL = 'http://192.168.1.105:8000';
```

Start the frontend:
```bash
npx expo start --clear
```

Scan the QR code with **Expo Go** on your phone.

> ⚠️ Your phone and laptop must be on the **same WiFi network**

---

### 4. Windows Firewall (if phone can't connect)

```bash
netsh advfirewall firewall add rule name="SplitSmart" dir=in action=allow protocol=TCP localport=8000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/groups` | Get all groups |
| POST | `/groups` | Create a new group |
| GET | `/groups/{id}` | Get a specific group |
| DELETE | `/groups/{id}` | Delete a group + its expenses |
| POST | `/expenses` | Add an expense |
| GET | `/expenses/{group_id}` | Get all expenses in a group |
| DELETE | `/expenses/{id}` | Delete an expense |
| GET | `/balances/{group_id}` | Get balances + settlements |
| POST | `/scan-receipt` | Scan a receipt with Gemini AI |

Full interactive docs available at `http://localhost:8000/docs`

---

## 🧠 How the Debt Algorithm Works

A naive approach just shows totals — but this leads to unnecessary payments. SplitSmart uses a **greedy debt simplification algorithm**:

```
Example: 3 people, 2 expenses
Ahmad paid RM90 dinner (split 3 ways = RM30 each)
Wei paid RM60 taxi (split 3 ways = RM20 each)

Net balances:
  Ahmad: +RM40 (is owed)
  Wei:   +RM10 (is owed)
  Sara:  -RM50 (owes money)

Algorithm:
  Sara → Ahmad: RM40  (Sara still owes RM10)
  Sara → Wei:   RM10  (all settled!)

Result: 2 payments instead of potential 6 ✅
```

---

## 🤖 How the AI Scanner Works

```
1. User takes photo         (expo-image-picker)
2. Convert to Base64        (binary → text for JSON transport)
3. POST to /scan-receipt    (send to FastAPI backend)
4. Decode Base64 → bytes    (backend processing)
5. Send to Gemini Vision    (with structured JSON prompt)
6. Parse JSON response      (items + total extracted)
7. Return to app            (pre-fills Add Expense form)
```

---

## 🔮 Future Improvements

- [ ] User authentication with JWT tokens
- [ ] PostgreSQL database with SQLAlchemy ORM
- [ ] Push notifications for payment reminders  
- [ ] Cloud deployment (Railway / Render) for anywhere access
- [ ] Settle Up button to mark debts as paid
- [ ] Currency selection support

---

## 👨‍💻 Author

**Yusuf** — Built for the Shortcut Asia Internship Challenge 2026

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
