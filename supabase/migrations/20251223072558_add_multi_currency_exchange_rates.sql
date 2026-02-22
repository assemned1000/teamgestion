/*
  # Add Multi-Currency Exchange Rates

  1. Purpose
    - Support multiple currency exchange rates (EUR, USD, AED, DZD)
    - Allow setting custom exchange rate for each currency
    - Provide a centralized currency management system

  2. Changes
    - Add new exchange rate settings for USD and AED
    - Keep existing EUR/DZD rate for backward compatibility
    - All rates are relative to DZD (Algerian Dinar)

  3. Currency Rates Structure
    - EUR to DZD: exchange_rate_eur_dzd
    - USD to DZD: exchange_rate_usd_dzd
    - AED to DZD: exchange_rate_aed_dzd
    - DZD to DZD: Always 1 (base currency)

  4. Security
    - Uses existing RLS policies on settings table
    - Only admins can modify exchange rates
    - All authenticated users can view rates

  5. Notes
    - Default values based on approximate market rates
    - Rates can be updated via the dashboard interface
    - All rates express how many DZD = 1 unit of foreign currency
*/

-- Add USD to DZD exchange rate
INSERT INTO settings (key, value, description)
VALUES ('exchange_rate_usd_dzd', '133', 'Taux de change USD vers DZD')
ON CONFLICT (key) DO NOTHING;

-- Add AED to DZD exchange rate
INSERT INTO settings (key, value, description)
VALUES ('exchange_rate_aed_dzd', '36', 'Taux de change AED vers DZD')
ON CONFLICT (key) DO NOTHING;

-- Update description for EUR rate to be more consistent
UPDATE settings
SET description = 'Taux de change EUR vers DZD'
WHERE key = 'exchange_rate_eur_dzd';
