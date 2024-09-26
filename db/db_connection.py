# db_connection.py
import psycopg2

# Database connection details
db_params = {
    'dbname': 'database navn',
    'user': 'user navn',
    'password': 'password',
    'host': 'hostname',
    'port': '5432'
}

def connect_db():
    """Connect to the PostgreSQL database and return the connection object."""
    return psycopg2.connect(**db_params)
