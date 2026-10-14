# 26 — Project Reference Table & Endpoints Directory

Universal quick-reference for system URLs, endpoints, and credentials structure.

---

## 1. PostEx Endpoints Reference
| Feature | Method | URL Path |
|---|---|---|
| Create Order V3 | `POST` | `https://api.postex.pk/services/integration/api/order/v3/create-order` |
| Track Order V1 | `GET` | `https://api.postex.pk/services/integration/api/order/v1/track-order/{trackingNumber}` |
| Shipper Advice V2 | `PUT` | `https://api.postex.pk/services/integration/api/order/v2/save-shipper-advice` |
| Generate Load Sheet | `POST` | `https://api.postex.pk/services/integration/api/order/v2/generate-load-sheet` |
| Merchant Profile | `GET` | `https://api.postex.pk/services/integration/api/order/v1/get-merchant-profile` |

---

## 2. Groq Endpoints Reference
| Feature | Method | URL Path | Model |
|---|---|---|---|
| Chat Completions | `POST` | `https://api.groq.com/openai/v1/chat/completions` | `llama-3.3-70b-versatile` |

---

## 3. Database Tables Reference
| Table Name | PK Type | Description |
|---|---|---|
| `public.User` | UUID (`auth.users.id`) | Scoped user profile & role (`user` or `admin`) |
| `public.UserSettings` | UUID (`userid`) | Merchant settings payload |
| `public.BookedHistory` | UUID (`userid`) | Array of booked parcels |
| `public.Customer` | UUID (`id`) | Phone-indexed customer CRM directory |
| `public.UsageLog` | UUID (`id`) | Audit log of user operations |
