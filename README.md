# Postman Testing Guide — HAS-Pharmacy

## Setup

### 1. Base URL
```
http://localhost:3000/api/pharmacy
```

### 2. Environment Variables (create in Postman)

| Variable | Initial Value | Description |
|----------|--------------|-------------|
| `base_url` | `http://localhost:3000/api/pharmacy` | Pharmacy service |
| `auth_url` | `https://has-auth.onrender.com/api` | Auth system |
| `adapter_url` | `https://has-adapter-layer.onrender.com/api/adapter` | Adapter layer |
| `token` | *(leave empty)* | Filled after login |
| `patient_id` | `69b6947d833e04011f7406bd` | Existing test patient |
| `appointment_id` | *(get from adapter)* | From patient's appointments |

---

## Step 1: Get Auth Token

**Sample URL:** `https://has-auth.onrender.com/api/auth/login`

**Request:**

```
POST {{auth_url}}/auth/login
Content-Type: application/json

{
  "email": "admin@gmail.com",
  "password": "Admin123@"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Postman:** Go to **Tests** tab and add:
```js
const json = pm.response.json();
pm.environment.set("token", json.token);
```

---

## Step 2: Get a Real Patient ID from Adapter

**Sample URL:** `https://has-adapter-layer.onrender.com/api/adapter/patients`

**Request:**

```
GET {{adapter_url}}/patients
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "69b6947d833e04011f7406bd",
      "firstName": "Moscov",
      "lastName": "Dela Cruz",
      ...
    }
  ]
}
```

Copy a `_id` value and set it as `patient_id` in environment.

---

## Step 3: Get Patient Appointments

**Sample URL:** `https://has-adapter-layer.onrender.com/api/adapter/appointments/patient/69b6947d833e04011f7406bd`

**Request:**

```
GET {{adapter_url}}/appointments/patient/{{patient_id}}
Authorization: Bearer {{token}}
```

Pick an `_id` from the response and set it as `appointment_id`.

---

## Step 4: Test Pharmacy Endpoints

### 4a. Patient Prescription History

**Sample URL:** `http://localhost:3000/api/pharmacy/prescriptions/patient/69b6947d833e04011f7406bd`

```
GET {{base_url}}/prescriptions/patient/{{patient_id}}
Authorization: Bearer {{token}}
```

**Expected:** Returns all consultations for this patient with parsed `rx` (prescription) data.

---

### 4b. Consultation Prescription (by appointment)

**Sample URL:** `http://localhost:3000/api/pharmacy/prescriptions/consultation/609a2b3c4f5a6b7c8d9e0f01?patientId=69b6947d833e04011f7406bd`

```
GET {{base_url}}/prescriptions/consultation/{{appointment_id}}?patientId={{patient_id}}
Authorization: Bearer {{token}}
```

**Expected:** Returns the single consultation matching that appointment.

---

### 4c. Search Medicines

**Sample URL:** `http://localhost:3000/api/pharmacy/medicines/search?query=aspirin`

```
GET {{base_url}}/medicines/search?query=aspirin
Authorization: Bearer {{token}}
```

**Try these queries:**

| Query | Expected |
|-------|----------|
| `aspirin` | 1 result (Aspirin) |
| `paracetamol` | 1 result |
| `antibiotic` | 2 results (Amoxicillin, Ciprofloxacin) |
| `met` | 2 results (Metoprolol, Metformin) |
| `zzzz` | empty array |

---

### 4d. Create Order

**Sample URL:** `http://localhost:3000/api/pharmacy/orders/create`

```
POST {{base_url}}/orders/create
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "patientId": "{{patient_id}}",
  "appointmentId": "{{appointment_id}}",
  "medicines": [
    {
      "medicineId": "MED001",
      "name": "Aspirin",
      "quantity": 2,
      "dosage": "500mg twice daily"
    },
    {
      "medicineId": "MED003",
      "name": "Metoprolol",
      "quantity": 1,
      "dosage": "25mg once daily"
    }
  ],
  "status": "Pending"
}
```

**Expected (201):**
```json
{
  "success": true,
  "message": "Pharmacy order created successfully",
  "data": {
    "id": "uuid-here",
    "patient_id": "...",
    "appointment_id": "...",
    "medicines": [...],
    "status": "Pending",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

Copy the returned `id` as `order_id`.

---

### 4e. Update Order Status

**Sample URL:** `http://localhost:3000/api/pharmacy/orders/1/status`

```
PUT {{base_url}}/orders/{{order_id}}/status
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "Dispensed"
}
```

**Try these statuses:** `Pending`, `Processing`, `Dispensed`, `Completed`, `Cancelled`

---

## Auth Error Tests

### No Token

**Sample URL:** `http://localhost:3000/api/pharmacy/medicines/search?query=aspirin`

```
GET {{base_url}}/medicines/search?query=aspirin
```
**Expected (401):** `{ "message": "No token" }`

### Invalid Token

**Sample URL:** `http://localhost:3000/api/pharmacy/medicines/search?query=aspirin`

```
GET {{base_url}}/medicines/search?query=aspirin
Authorization: Bearer invalidtoken123
```
**Expected (401):** `{ "message": "Invalid token" }`

### Wrong Role (e.g. `patient` trying to create order)

**Sample URL:** `https://has-auth.onrender.com/api/auth/register` (register), then `http://localhost:3000/api/pharmacy/orders/create` (forbidden)

Create a patient token (register a new user with default `patient` role):

```
POST {{auth_url}}/auth/register
Content-Type: application/json

{
  "firstName": "Test",
  "lastName": "User",
  "email": "testpatient@mail.com",
  "password": "123456"
}
```

Then login and use that token for:

```
POST {{base_url}}/orders/create
Authorization: Bearer <patient_token>
Content-Type: application/json

{ "patientId": "x", "appointmentId": "y", "medicines": [] }
```

**Expected (403):** `{ "message": "Forbidden" }`

---

## Error Tests

### Missing patientId on consultation route

**Sample URL:** `http://localhost:3000/api/pharmacy/prescriptions/consultation/123`

```
GET {{base_url}}/prescriptions/consultation/123
Authorization: Bearer {{token}}
```
**Expected (400):** `{ "success": false, "error": "patientId query parameter is required" }`

### Missing search query

**Sample URL:** `http://localhost:3000/api/pharmacy/medicines/search`

```
GET {{base_url}}/medicines/search
Authorization: Bearer {{token}}
```
**Expected (400):** `{ "success": false, "error": "Search query parameter is required" }`

### Invalid order ID

**Sample URL:** `http://localhost:3000/api/pharmacy/orders/99999/status`

```
PUT {{base_url}}/orders/99999/status
Authorization: Bearer {{token}}
Content-Type: application/json

{ "status": "Dispensed" }
```
**Expected (404):** `{ "success": false, "error": "Order not found or update failed" }`

### Adapter offline / wrong patient

**Sample URL:** `http://localhost:3000/api/pharmacy/prescriptions/patient/nonexistent123`

```
GET {{base_url}}/prescriptions/patient/nonexistent123
Authorization: Bearer {{token}}
```
**Expected (503 or 404):** Adapter connectivity error or no data found.

---

## Postman Collection Import

Create a new collection, click **Import → Raw text**, paste:

```json
{
  "info": {
    "name": "HAS-Pharmacy",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Login (get token)",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "var json = pm.response.json();",
              "pm.environment.set(\"token\", json.token);"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "url": "{{auth_url}}/auth/login",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": { "mode": "raw", "raw": "{ \"email\": \"admin@gmail.com\", \"password\": \"Admin123@\" }" }
      }
    },
    {
      "name": "2. Get Patients (from adapter)",
      "request": {
        "method": "GET",
        "url": "{{adapter_url}}/patients",
        "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }]
      }
    },
    {
      "name": "3. Patient Prescriptions",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/prescriptions/patient/{{patient_id}}",
        "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }]
      }
    },
    {
      "name": "4. Consultation Prescriptions",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/prescriptions/consultation/{{appointment_id}}?patientId={{patient_id}}",
        "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }]
      }
    },
    {
      "name": "5. Search Medicines",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/medicines/search?query=aspirin",
        "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }]
      }
    },
    {
      "name": "6. Create Order",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/orders/create",
        "header": [
          { "key": "Authorization", "value": "Bearer {{token}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": { "mode": "raw", "raw": "{ \"patientId\": \"{{patient_id}}\", \"appointmentId\": \"{{appointment_id}}\", \"medicines\": [{ \"medicineId\": \"MED001\", \"name\": \"Aspirin\", \"quantity\": 2, \"dosage\": \"500mg twice daily\" }], \"status\": \"Pending\" }" }
      }
    },
    {
      "name": "7. Update Order Status",
      "request": {
        "method": "PUT",
        "url": "{{base_url}}/orders/{{order_id}}/status",
        "header": [
          { "key": "Authorization", "value": "Bearer {{token}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": { "mode": "raw", "raw": "{ \"status\": \"Dispensed\" }" }
      }
    },
    {
      "name": "8. No Token (expect 401)",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/medicines/search?query=test"
      }
    },
    {
      "name": "9. Wrong Role (expect 403)",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/orders/create",
        "header": [
          { "key": "Authorization", "value": "Bearer {{token}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": { "mode": "raw", "raw": "{ \"patientId\": \"x\", \"appointmentId\": \"y\", \"medicines\": [] }" }
      }
    }
  ],
  "variable": [
    { "key": "base_url", "value": "http://localhost:3000/api/pharmacy" },
    { "key": "auth_url", "value": "https://has-auth.onrender.com/api" },
    { "key": "adapter_url", "value": "https://has-adapter-layer.onrender.com/api/adapter" },
    { "key": "token", "value": "" },
    { "key": "patient_id", "value": "69b6947d833e04011f7406bd" },
    { "key": "appointment_id", "value": "" },
    { "key": "order_id", "value": "" }
  ]
}
```
