/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add index on `client_costs.client_id` for foreign key lookups
    - Add index on `expenses.created_by` for foreign key lookups
  
  2. Security
    - These indexes improve query performance for foreign key constraints
    - Essential for maintaining good performance as data grows
*/

-- Add index for client_costs.client_id foreign key
CREATE INDEX IF NOT EXISTS idx_client_costs_client_id ON client_costs(client_id);

-- Add index for expenses.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
