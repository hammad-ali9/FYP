import sqlite3
import os

DB_PATH = os.path.join('instance', 'virtualfit.db')

def upgrade_database():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(products)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'additional_images' not in columns:
            print("Adding additional_images column to products table...")
            cursor.execute("ALTER TABLE products ADD COLUMN additional_images TEXT")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column additional_images already exists.")
            
    except Exception as e:
        print(f"An error occurred: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    upgrade_database()
