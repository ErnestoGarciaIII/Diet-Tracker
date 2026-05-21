-- Created by: Berkeley Scott
-- Purpose: Return food items based on text input provided by the user

WITH SearchEngine AS (
    SELECT
        f.fdc_id,
        f.description AS original_name,
        fc.description AS category_name,
        TRIM(CASE
            WHEN f.description LIKE '% - %'
            THEN SUBSTR(f.description, 1, INSTR(f.description, ' - ') - 1)
            ELSE f.description
        END) AS trim_hyphen
    FROM food f
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
