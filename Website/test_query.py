import sys
import os 
import time
import random

current_dir = os.path.dirname(os.path.abspath(__file__))

parent_dir = os.path.dirname(current_dir)

scripts_path = os.path.join(parent_dir, 'scripts')

sys.path.append(scripts_path)

from food_search import search_engine, connectDB, apply_filter, active_filters

search_engine_strings = ["salmon", "cheese", "chili", "biscuit", "egg", "steak", "beef", "carrot", "chestnut", "milk", "potato", "turkey", "cream"]

filter_map_test = {
        0: "Standard",
        1: "Vegetarian",
        2: "Vegan",
        3: "Nut Allergy",
        4: "Egg Allergy",
        5: "Shellfish Allergy",
        6: "Soy Allergy",
        7: "Dairy Allergy",
        8: "Pescatarian",
        9: "Keto"
}

def test_filter(conn, cursor, filter_num):
    print(f"\nApplying filter {filter_map_test[filter_num]}...")
    apply_filter(filter_num, conn)
    cursor.execute("SELECT COUNT(*) FROM temp_filter_pool")
    row_count = cursor.fetchone()[0]
    print(f"Temp table has {row_count} items ({filter_map_test[filter_num]} filter)")

def test_search_engine(conn):
    active_names = [filter_map_test[fid] for fid in active_filters]
    print(f"\nActive filters: {', '.join(active_names)}")
    search_string = search_engine_strings[random.randint(0, len(search_engine_strings)-1)]
    print(f"\nTesting search engine with '{search_string}'...")
    results = search_engine(search_string, conn)
    print(f"Search resulted in {len(results)} items\n")
    total = len(results)
    if total > 0:
        total_catch = min(15, total)
        random_sample = random.sample(results, total_catch)
        for r in random_sample:
            print(r)

def remove_test_filter(conn, cursor, filter_num):
    apply_filter(filter_num, conn)
    cursor.execute("SELECT COUNT(*) FROM temp_filter_pool")
    row_count = cursor.fetchone()[0]
    print(f"\nTemp table has {row_count} items (removed {filter_map_test[filter_num]} filter)")

def run_tests():
    if len(sys.argv) < 2:
        print(f"You need at least 2 arguments (test.py 'filter_number')\nPut as many filter numbers 1 - 9, without duplicates")
        sys.exit()

    conn = connectDB()
    cursor = conn.cursor()
    
    print("Checking database tables...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print(cursor.fetchall())

    print("\nCreating temp table (no filters)...")
    active_filters.clear()
    apply_filter(0, conn)  # No filter
    cursor.execute("SELECT COUNT(*) FROM temp_filter_pool")
    row_count = cursor.fetchone()[0]
    print(f"Temp table has {row_count} items (no filter)")

    for x in range(1, len(sys.argv)):
        filter_num = int(sys.argv[x])
        test_filter(conn, cursor, filter_num)
    
    test_search_engine(conn)

    for x in range(1, len(sys.argv)):
        filter_num = int(sys.argv[len(sys.argv)-x])
        remove_test_filter(conn, cursor, filter_num)
        test_search_engine(conn)

    conn.close()

if __name__ == "__main__":
    run_tests()
