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
ORDER BY fdc_id
LIMIT 100;
