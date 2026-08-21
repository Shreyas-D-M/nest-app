# NEST — Database Design
## Database
PostgreSQL.

## Core tables

### users
id, phone, email, name, avatar_url, role, status, created_at, updated_at

### user_addresses
id, user_id, label, address_line, locality, city, state, pincode, latitude, longitude, instructions

### professionals
id, user_id, business_name, bio, years_experience, verification_status, online_status, rating, completed_jobs, created_at, updated_at

### professional_documents
id, professional_id, document_type, storage_url, verification_status, expires_at, reviewed_by, reviewed_at

### professional_services
id, professional_id, service_id, base_price, pricing_type, active

### professional_service_areas
id, professional_id, locality/polygon/geohash, active

### professional_availability
id, professional_id, weekday, start_time, end_time, active

### categories
id, name, slug, icon, sort_order, active

### services
id, category_id, name, slug, description, pricing_type, base_price, active

### service_questions
id, service_id, question, question_type, options, sort_order

### service_requests
id, customer_id, address_id, raw_text, voice_url, media, ai_category, ai_confidence, status, created_at

### bookings
id, customer_id, professional_id, service_id, address_id, request_id, scheduled_start, scheduled_end, status, estimated_amount, final_amount, platform_fee, notes, created_at, updated_at

### booking_status_history
id, booking_id, status, actor_type, actor_id, metadata, created_at

### booking_items
id, booking_id, description, quantity, unit_price, approved, created_at

### extra_work_requests
id, booking_id, professional_id, description, amount, evidence_urls, status, customer_response_at

### payments
id, booking_id, provider, provider_payment_id, amount, currency, status, paid_at

### refunds
id, payment_id, amount, reason, provider_ref, status, created_at

### invoices
id, booking_id, invoice_number, subtotal, fees, tax, total, issued_at, document_url

### reviews
id, booking_id, customer_id, professional_id, rating, comment, created_at

### review_tags
id, review_id, tag

### conversations
id, booking_id, customer_id, professional_id, created_at

### messages
id, conversation_id, sender_id, message_type, body, media_url, created_at, read_at

### favorites
id, customer_id, professional_id, created_at

### homes
id, customer_id, name, address_id

### assets
id, home_id, asset_type, brand, model, serial_number, purchase_date, warranty_end, notes, image_url

### maintenance_records
id, asset_id, booking_id, service_date, summary, next_due_date, cost

### vehicles
id, customer_id, make, model, variant, registration_masked, purchase_date, notes

### support_tickets
id, requester_id, booking_id, type, priority, status, description, assigned_admin_id

### notifications
id, user_id, type, title, body, data, read_at, created_at

### trust_scores
id, professional_id, score, rating_component, reliability_component, completion_component, repeat_component, complaint_component, verification_component, calculated_at

### audit_logs
id, actor_id, action, entity_type, entity_id, before_json, after_json, created_at

## Important constraints
- Monetary values use integer minor units (paise) or numeric with explicit precision; never floats.
- All timestamps stored in UTC; render in local timezone.
- Use UUIDs for public IDs where appropriate.
- Add created_at/updated_at consistently.
- Soft-delete operational records where legal/business requirements demand retention.
- Never store raw payment card data.
- Index booking status + scheduled time.
- Index professional location/service-area lookup.
- Index customer_id + created_at.
- Index professional_id + created_at.

## Relationships
users 1—N addresses
users 1—0/1 professional
professionals N—N services
customers 1—N bookings
professionals 1—N bookings
bookings 1—N status_history
bookings 1—N booking_items
bookings 1—N extra_work_requests
bookings 1—0/1 payment
bookings 1—0/1 review
customers 1—1/N homes
homes 1—N assets
assets 1—N maintenance_records
customers 1—N vehicles
