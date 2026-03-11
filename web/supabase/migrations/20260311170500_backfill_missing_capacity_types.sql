-- Backfill starter capacity types for organizations that currently have none.
-- This is idempotent: only organizations with zero capacity_types are targeted.

INSERT INTO capacity_types (organization_id, name, load_cost, color_code)
SELECT
  o.id,
  defaults.name,
  defaults.load_cost,
  defaults.color_code
FROM organizations o
CROSS JOIN (
  VALUES
    ('Mariage', 50, '#10b981'),
    ('Cocktail Dînatoire', 10, '#f59e0b')
) AS defaults(name, load_cost, color_code)
WHERE NOT EXISTS (
  SELECT 1
  FROM capacity_types ct
  WHERE ct.organization_id = o.id
);
