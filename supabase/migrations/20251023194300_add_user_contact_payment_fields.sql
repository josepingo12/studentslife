ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_payment_amount DECIMAL(10,2);

-- Aggiungi commenti per documentare i campi
COMMENT ON COLUMN profiles.contact_email IS 'Email di contatto dell''utente';
COMMENT ON COLUMN profiles.phone_number IS 'Numero di telefono dell''utente';
COMMENT ON COLUMN profiles.last_payment_date IS 'Data dell''ultimo pagamento effettuato';
COMMENT ON COLUMN profiles.last_payment_amount IS 'Importo dell''ultimo pagamento in euro';