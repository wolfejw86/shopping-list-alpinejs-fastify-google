INSERT INTO users (provider_type, provider_id) VALUES ($1, $2)
ON CONFLICT (provider_type, provider_id) DO NOTHING
RETURNING id;