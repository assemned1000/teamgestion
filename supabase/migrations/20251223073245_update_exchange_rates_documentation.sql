/*
  # Update Exchange Rates Documentation

  1. Purpose
    - Document the exchange rate system with EUR as base currency
    - Clarify how rates are stored internally vs displayed to users

  2. Exchange Rate System
    - **Base Currency**: EUR (Euro) is the base currency
    - **Display Format**: Shows how much of each currency equals 1 EUR
    - **Storage Format**: All rates stored as X_to_DZD for internal calculations

  3. Rate Conversion Logic
    - Stored in database: How many DZD = 1 unit of foreign currency
      * EUR to DZD: exchange_rate_eur_dzd (e.g., 140 means 1 EUR = 140 DZD)
      * USD to DZD: exchange_rate_usd_dzd (e.g., 133 means 1 USD = 133 DZD)
      * AED to DZD: exchange_rate_aed_dzd (e.g., 36 means 1 AED = 36 DZD)

    - Displayed to users: How many units = 1 EUR
      * EUR: Always 1.00 (base currency)
      * USD: EUR_DZD / USD_DZD (e.g., 140/133 = 1.05 means 1 EUR = 1.05 USD)
      * AED: EUR_DZD / AED_DZD (e.g., 140/36 = 3.89 means 1 EUR = 3.89 AED)
      * DZD: EUR_DZD (e.g., 140 means 1 EUR = 140 DZD)

  4. Editing Rates
    - Users see and edit EUR-based rates (e.g., "1 EUR = X USD")
    - System converts back to DZD-based rates for storage
    - DZD rate is edited directly (1 EUR = X DZD)

  5. Notes
    - This system allows for consistent EUR-based pricing for clients
    - Internal DZD storage maintains compatibility with employee salaries in DZD
    - Conversion calculations happen in the application layer
*/

-- Update descriptions to clarify EUR is base currency
UPDATE settings
SET description = 'Taux de change EUR vers DZD (Base: 1 EUR = X DZD)'
WHERE key = 'exchange_rate_eur_dzd';

UPDATE settings
SET description = 'Taux de change USD vers DZD (pour calcul: 1 USD = X DZD)'
WHERE key = 'exchange_rate_usd_dzd';

UPDATE settings
SET description = 'Taux de change AED vers DZD (pour calcul: 1 AED = X DZD)'
WHERE key = 'exchange_rate_aed_dzd';
