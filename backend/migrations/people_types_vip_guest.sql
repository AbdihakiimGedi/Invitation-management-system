ALTER TABLE people_types DROP CONSTRAINT IF EXISTS people_types_table_name_key;

INSERT INTO people_types (type_name, table_name)
VALUES ('VIP Guests', 'guests')
ON CONFLICT (type_name) DO UPDATE SET table_name = EXCLUDED.table_name;
