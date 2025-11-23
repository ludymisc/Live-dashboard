import psycopg2
import random
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

# Koneksi ke PostgreSQL
db_url = os.getenv("DB_URL")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# Item yang tersedia di tabel items
ITEMS = {
    1: "Apel",
    2: "Pisang",
    3: "Jeruk"
}

def generate_and_apply_restock():
    # ambil semua item_id valid dari DB
    cursor.execute("SELECT item_id FROM stock")
    valid_items = [row[0] for row in cursor.fetchall()]

    # if stock table is empty, seed it with default ITEMS so scripted restock can run
    if not valid_items:
        return []


    restock_id = random.randint(1, 999)
    jumlah_item = random.randint(1, 3)

    restock_data = []

    for _ in range(jumlah_item):
        item_id = random.choice(valid_items)
        quantity = random.randint(1, 50)

        # insert log
        cursor.execute("""
            INSERT INTO restock_detail (restock_id, item_id, quantity, added_at)
            VALUES (%s, %s, %s, NOW())
        """, (restock_id, item_id, quantity))

        # update stock langsung
        cursor.execute("""
            UPDATE stock
            SET item_qty = COALESCE(item_qty, 0) + %s,
                updated_at = NOW()
            WHERE item_id = %s
        """, (quantity, item_id))

        restock_data.append((restock_id, item_id, quantity))

    # satu commit buat semua
    conn.commit()

    return restock_data



if __name__ == "__main__":
    data = generate_and_apply_restock()
    print("Inserted:")
    for d in data:
        print(d)

    cursor.close()
    conn.close()
