import os
import sys
import requests
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from db_connection import connect_db

# Load environment variables
load_dotenv()

# Google Maps API Key
API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

def get_harbor_coordinates(harbor_name):
    """Get coordinates for a harbor using Google Geocoding API."""
    base_url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": f"{harbor_name}",
        "key": API_KEY
    }
    
    response = requests.get(base_url, params=params)
    data = response.json()
    
    if data['status'] == 'OK':
        location = data['results'][0]['geometry']['location']
        return location['lat'], location['lng']
    else:
        print(f"Kunne ikke finde koordinater for {harbor_name}")
        return None

def insert_harbor(conn, harbor_name, lat, lng, facilities):
    """Insert a new harbor if it doesn't exist. Do nothing if it already exists."""
    with conn.cursor() as cur:
        # Check if the harbor already exists
        cur.execute("SELECT name FROM harbors WHERE LOWER(name) = LOWER(%s)", (harbor_name,))
        if cur.fetchone() is None:
            # Harbor doesn't exist, so insert it
            cur.execute("""
                INSERT INTO harbors (name, position, facilities)
                VALUES (%s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s)
                RETURNING uuid, name, ST_X(position::geometry) as lng, ST_Y(position::geometry) as lat
            """, (harbor_name, lng, lat, facilities))
            new_harbor = cur.fetchone()
            conn.commit()
            return {
                'name': new_harbor[1],
                'lat': new_harbor[3],
                'lng': new_harbor[2]
            }, "inserted"
        else:
            # Harbor already exists, do nothing
            return None, "exists"

def process_harbor_file(input_file):
    """Process harbor names and detect 'fh' as a facility."""
    keywords = ["havn", "marina", "lystbådehavn", "bådelaug", "bro"]
    harbor_list = []

    with open(input_file, 'r', encoding='utf-8') as infile:
        for line in infile:
            line = line.strip().lower()
            words = line.split()

            # Tjek om 'fh' er det sidste ord
            has_fh = words[-1] == "fh" if words else False
            if has_fh:
                words = words[:-1]  # Fjern 'fh' midlertidigt

            # Hvis ingen af ordene på linjen er i keywords-listen, tilføj "Havn"
            if not any(keyword in words for keyword in keywords):
                words.append("havn")

            # Gør hvert ord i linjen til stort bogstav
            formatted_name = " ".join(word.capitalize() for word in words)

            # Tilføj 'fh' som facility hvis relevant
            facilities = '{"fh": true}' if has_fh else '{}'

            harbor_list.append((formatted_name, facilities))

    return harbor_list

def main(input_file):
    """Main function to process harbor names and update database."""
    try:
        conn = connect_db()
        print("Forbundet til databasen.")

        harbor_list = process_harbor_file(input_file)

        for harbor_name, facilities in harbor_list:
            coordinates = get_harbor_coordinates(harbor_name)
            if coordinates:
                lat, lng = coordinates
                result, status = insert_harbor(conn, harbor_name, lat, lng, facilities)
                if status == "inserted" and result:
                    print(f"Indsat ny havn: {result['name']}: Lat {result['lat']}, Lng {result['lng']}")
                elif status == "exists":
                    print(f"Havnen {harbor_name} eksisterer allerede i databasen. Ingen ændringer foretaget.")
            else:
                print(f"Springer over {harbor_name} da koordinater ikke kunne findes.")

    except psycopg2.Error as e:
        print(f"Database fejl: {e}")
    except Exception as e:
        print(f"En fejl opstod: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if conn:
            conn.close()
            print("Database forbindelse lukket.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Brug: python script_name.py <input_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    main(input_file)
