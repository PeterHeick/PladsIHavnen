#!/bin/bash
set -e

#!/bin/bash
set -e

# Aktivér PostGIS
echo "Activating PostGIS..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS postgis_topology;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL

# Opret tabeller
echo "Creating tables..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE TABLE IF NOT EXISTS harbors (
        uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        position GEOGRAPHY(POINT, 4326) NOT NULL,
        facilities JSONB
    );

    CREATE INDEX IF NOT EXISTS idx_harbors_position ON harbors USING GIST(position);

    CREATE TABLE IF NOT EXISTS markers (
        uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        position GEOGRAPHY(POINT, 4326) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_markers_position ON markers USING GIST(position);

    -- Opret tabel til tekstinformation om havne
    CREATE TABLE IF NOT EXISTS harbor_info (
        harbor_uuid UUID REFERENCES harbors(uuid) ON DELETE CASCADE,
        date DATE NOT NULL,
        content TEXT NOT NULL,
        link VARCHAR(2048)
    );

EOSQL

# # # Indsæt eksempeldata (dette kan fjernes i produktionsmiljøer)
# # echo "Inserting sample data..."
# # psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
# #     INSERT INTO harbors (name, position, facilities, capacity, available_spots)
# #     VALUES 
# #     ('Københavns Havn', ST_SetSRID(ST_MakePoint(12.599278, 55.694760), 4326), 
# #      '{"toilet": true, "shower": true, "fuel": true}', 100, 25),
# #     ('Helsingør Nordhavn', ST_SetSRID(ST_MakePoint(12.610512, 56.042439), 4326),
# #      '{"toilet": true, "shower": true, "fuel": false}', 50, 10)
# #     ON CONFLICT DO NOTHING;

# #     INSERT INTO markers (position, type, name)
# #     VALUES 
# #     (ST_SetSRID(ST_MakePoint(12.5, 55.7), 4326), 'Båd', 'Eksempel Båd'),
# #     (ST_SetSRID(ST_MakePoint(12.6, 55.8), 4326), 'Ankerplads', 'Eksempel Ankerplads')
# #     ON CONFLICT DO NOTHING;
# EOSQL

echo "Database initialization completed."
