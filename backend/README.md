{
"success": true,
"message": "Appointment created successfully",
"data": {
"appointment": {
"id": "f500dfe1-4a0e-4558-a554-62c746c28fbe",
"patient_id": "bcfdb6e2-aecf-469d-9c0e-dd0079b1c220",
"clinician_id": "5ac1cc27-d90f-43bc-b978-9bc611bdcdab",
"treatment_id": "842b1f17-1544-4e98-8d18-396325270ad4",
"starts_at": "2026-10-07T15:11:56.791+00:00",
"ends_at": "2026-10-07T15:56:56.791+00:00",
"status": "pending",
"comfort_mode": "standard",
"total_amount": 350,
"deposit_amount": 50,
"balance_amount": 300,
"pending_until": "2026-10-06T20:02:18.944+00:00",
"patient_notes": "MoMo sandbox test",
"created_at": "2026-10-06T19:52:19.819394+00:00"
},
"patient": {
"id": "bcfdb6e2-aecf-469d-9c0e-dd0079b1c220",
"first_name": "Kwame",
"last_name": "Mensah",
"phone": "0244000000",
"email": "kwame@example.com"
},
"clinician": {
"id": "5ac1cc27-d90f-43bc-b978-9bc611bdcdab",
"name": "Dr. Ama Owusu",
"active": true
},
"treatment": {
"id": "842b1f17-1544-4e98-8d18-396325270ad4",
"name": "Checkup & Gentle Clean",
"durationMinutes": 45
}
}
}

{
"success": true,
"message": "Payment already initialized",
"data": {
"payment": {
"id": "807802ec-ef3e-40ad-957f-e28895c6572a",
"amount": 50,
"currency": "GHS",
"method": "momo",
"provider": "momo",
"status": "pending",
"provider_reference": null,
"created_at": "2026-10-06T17:11:56.791104+00:00"
},
"alreadyInitialized": true
}
}
