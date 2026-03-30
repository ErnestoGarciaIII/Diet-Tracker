import sqlite3
import sys

def connectDB():
    try: 
        connection = sqlite3.connect("../db/PlatePilot.db")
    except sqlite3.OperationalError as e:
        print(f"Unable to connect to the database...")
        print(e)
        sys.exit(1)
    return connection

db_connection = connectDB()
active_filters = set()

def apply_filter(filter_id, connection):
    
    global active_filters

    if filter_id in active_filters:
        active_filters.remove(filter_id)
    else:
        active_filters.add(filter_id)

    filter_map = {
            1: "C:/SoftwareProjects/plate_pilot/scripts/query_templates/vegetarian_query.sql",
            2: "C:/SoftwareProjects/plate_pilot/scripts/query_templates/vegan_query.sql",
            3: "C:/SoftwareProjects/plate_pilot/scripts/query_templates/nut_allergy_query.sql",
            4: "C:/SoftwareProjects/plate_pilot/scripts/query_templates/egg_allergy_query.sql",
            5: "C:/SoftwareProjects/plate_pilot/scripts/query_templates/shellfish_allergy_query.sql",
            6: "C:/SoftwareProjects/plate_pilot/scripts/query_templates/soy_allergy_query.sql",
            7: "C:/SoftwareProjects/plate_pilot/scripts/query_templates/dairy_allergy_query.sql",
            8: "C:/SoftwareProjects/plate_pilot/scripts/query_templates/pescatarian_query.sql",
            9: "C:/SoftwareProjects/plate_pilot/scripts/query_templates/keto_query.sql"
    }
    
    if filter_id in filter_map:
        with open(filter_map[filter_id], 'r') as f:
            filter_logic = f.read()
    else:
        filter_logic = "SELECT fdc_id, description, food_category_id FROM food"

    filter_query = f"""
    WITH Filters AS (
        {filter_logic}
    );
    """
    
    cursor = connection.cursor()
    cursor.execute("DROP TABLE IF EXISTS temp_filter_pool")

    if not active_filters:
        cursor.execute("CREATE TEMP TABLE temp_filter_pool AS SELECT fdc_id FROM food")
    else: 
        queries = []
        for fid in active_filters:
            if fid in filter_map:
                with open(filter_map[fid], 'r') as f:
                    raw_sql = f.read().strip().rstrip(';')
                    
                    # Wrap the original query in a CTE and just grab the ID
                    # This is much safer than string replacement!
                    wrapped_sql = f"""
                    SELECT fdc_id FROM (
                        {raw_sql}
                    )
                    """
                    queries.append(wrapped_sql)
        if queries:
            combined_logic = " INTERSECT ".join(queries)
            cursor.execute(f"CREATE TEMP TABLE temp_filter_pool AS {combined_logic}")
        else:
            cursor.execute("CREATE TEMP TABLE temp_filter_pool AS SELECT fdc_id FROM food")

def search_engine(user_input, connection, filter_id=0):
    
    cursor = connection.cursor()
    cursor.execute("CREATE TEMP TABLE IF NOT EXISTS temp_filter_pool AS SELECT fdc_id FROM food")
    cursor.execute("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='temp_filter_pool'")

    search_engine_query = f"""
    WITH SearchEngine AS (
    SELECT
        f.fdc_id,
        f.description AS product_name,
        fc.description AS category_name,
        TRIM(CASE
            WHEN f.description LIKE '% - %'
            THEN SUBSTR(f.description, 1, INSTR(f.description, ' - ') - 1)
            ELSE f.description
        END) AS trim_hyphen
    FROM food f
    INNER JOIN temp_filter_pool tfp ON f.fdc_id = tfp.fdc_id
    INNER JOIN food_category fc ON f.food_category_id = fc.id
    WHERE fc.id NOT IN (3, 21, 22, 25, 27)
      AND f.description LIKE '%' || :userInput || '%'
      AND (f.description NOT LIKE '%vitamin%' AND f.description NOT LIKE '%Fat,%' AND f.description NOT LIKE '%Cholesterol%' AND f.description NOT LIKE '%Thiamin%' AND f.description NOT LIKE '%Riboflavin%' AND f.description NOT LIKE '%Carotenoids%' AND f.description NOT LIKE '%Selenium%' AND f.description NOT LIKE '%Minerals%' AND f.description NOT LIKE '%Proximates%' AND f.description NOT LIKE '%Niacin%' AND f.description NOT LIKE '%Pantothenic%' AND f.description NOT LIKE '%Choline%' AND f.description NOT LIKE '%Retinol%' AND f.description NOT LIKE '%Amino Acid%' AND f.description NOT LIKE '%FA,%' AND f.description NOT LIKE '%rep %' AND f.description NOT LIKE '%Fatty Acid%' AND f.description NOT LIKE '%Pass %' AND f.description NOT LIKE '%Region %' AND f.description NOT LIKE '%bunch%' AND f.description NOT LIKE '% Ct%' AND f.description NOT LIKE '%Moisture%' AND f.description NOT LIKE '%, NF%' AND f.description NOT LIKE '%, C9%')
),
FilterSuffix AS (
    SELECT
        fdc_id,
        category_name,
        TRIM(CASE
            WHEN trim_hyphen LIKE '% (%'
            THEN SUBSTR(trim_hyphen, 1, INSTR(trim_hyphen, ' (') - 1)
            ELSE trim_hyphen
        END) AS trim_paren
    FROM SearchEngine
) 
SELECT
    MIN(fdc_id) as fdc_id,
    trim_paren,
    category_name
FROM FilterSuffix
GROUP BY trim_paren
ORDER BY fdc_id;
    """

    cursor.execute(search_engine_query, {"userInput": user_input})
    
    return cursor.fetchall()
