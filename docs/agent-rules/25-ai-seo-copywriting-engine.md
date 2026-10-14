# 25 — AI Address Intelligence & Customer CRM Enrichment

LLM operational intelligence for courier logistics and customer notification copywriting.

---

## 1. Customer Intelligence & CRM Auto-Enrichment
- When an order is parsed and booked:
  - Check `Customer` table by normalized phone number (`03XXXXXXXXX`).
  - If existing customer, surface past delivery performance (e.g. "Previous order delivered successfully").
  - If new customer, record `name` and `phone` into `Customer` directory.

---

## 2. WhatsApp / SMS Notification Copywriting
- Generate concise, professional Urdu / English bilingual delivery notifications:
  ```
  "Salam {CustomerName}, aapka order ({OrderRef}) Zaynah's ki taraf se PostEx courier ke zariye rawana kar diya gaya hai. Tracking: {TrackingNumber}. COD: Rs. {CODAmount}. Shukriya!"
  ```
- Keep messages short, crisp, and brand-consistent.
