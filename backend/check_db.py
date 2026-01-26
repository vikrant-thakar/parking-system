import sys
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

def test_connection(url, name):
    print(f"Testing connection to '{name}' database...")
    print(f"URL: {url}")
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            print(f"✅ SUCCESS! Connected to '{name}'.")
            return True
    except OperationalError as e:
        print(f"❌ FAILED to connect to '{name}'.")
        err_msg = str(e.orig)
        if 'password verification failed' in err_msg:
            print("   -> Reason: WRONG PASSWORD.")
        elif 'does not exist' in err_msg:
            print(f"   -> Reason: Database '{name}' DOES NOT EXIST.")
        elif 'Connection refused' in err_msg:
            print("   -> Reason: PostgreSQL server is NOT RUNNING or not on port 5432.")
        else:
            print(f"   -> Reason: {err_msg}")
        return False
    except Exception as e:
        print(f"❌ FAILED with unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("--- SPARK DATABASE DIAGNOSTIC TOOL ---")
    
    # Check 1: The 'spark' database (Target)
    success_spark = test_connection("postgresql://postgres:password@localhost/spark", "spark")
    
    print("-" * 30)
    
    # Check 2: The 'postgres' database (Default)
    success_postgres = test_connection("postgresql://postgres:password@localhost/postgres", "postgres")
    
    print("-" * 30)
    
    if success_spark:
        print("Diagnosis: usage of 'spark' DB is Ready! Run the app.")
    elif success_postgres:
        print("Diagnosis: connection works, but database 'spark' is missing.")
        print("Action: Create database 'spark' in pgAdmin OR update .env to use 'postgres'.")
    else:
        print("Diagnosis: Cannot connect to ANY database.")
        print("Action: Check your PASSWORD in .env and ensure Postgres is RUNNING.")
