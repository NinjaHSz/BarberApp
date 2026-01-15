-- 1. Create Observation Columns
-- Run these commands in the Supabase SQL Editor

-- Add column for Client Observations (Notes available in Client Profile)
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS observacoes_cliente TEXT;

-- Add column for Plan Observations (Notes available in Plans Page)
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS observacoes_plano TEXT;


-- 2. Create Trigger for Automatic Name Updates
-- This ensures that when you rename a client, all their appointments are updated automatically.

-- First, create the function that handles the logic
CREATE OR REPLACE FUNCTION update_appointments_client_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the name actually changed
    IF OLD.nome <> NEW.nome THEN
        -- Update the 'cliente' column in 'agendamentos' table
        UPDATE agendamentos
        SET cliente = NEW.nome
        WHERE cliente = OLD.nome;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Then, create the trigger that calls the function
DROP TRIGGER IF EXISTS on_client_name_change ON clientes;

CREATE TRIGGER on_client_name_change
AFTER UPDATE OF nome ON clientes
FOR EACH ROW
EXECUTE FUNCTION update_appointments_client_name();
