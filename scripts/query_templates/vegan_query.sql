WITH VeganFilter AS (
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
    WHERE fc.id NOT IN (1, 3, 5, 7, 10, 13, 15, 17, 21, 22, 24, 25, 27)
        AND (f.description NOT LIKE '%chicken%' OR (fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%beef%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%clam%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%steak%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%pork%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%bacon%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '% ham%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%pepperoni%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%salami%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%jerky%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%lamb%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%turkey%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%duck%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%goose%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%quail%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%giblet%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%salmon%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%tuna%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%shrimp%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%prawn%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%crab%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%lobster%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%anchovy%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%sardine%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%scallop%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%oyster%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%mussel%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%milk%' OR fc.id IN (11, 16, 34) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%cheese%' OR fc.id IN (11, 16) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%butter%' OR fc.id IN (11, 16, 33) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%cream%' OR fc.id IN (11, 16, 34) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%yogurt%' OR fc.id IN (11, 16) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%whey%' OR fc.id IN (11, 16) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%casein%' OR fc.id IN (11, 16) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%lactose%' OR fc.id IN (11, 16) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%ghee%' OR fc.id IN (11, 16) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%custard%' OR fc.id IN (11, 16) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%kefir%' OR fc.id IN (11, 16) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%egg%' OR fc.id IN (11, 16) OR f.description LIKE '%plant%based')
        AND (f.description NOT LIKE '%honey%' OR fc.id IN (11, 16) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%beeswax%' OR fc.id IN (11, 16))
        AND (f.description NOT LIKE '%gelatin%' OR fc.id IN (11, 16) OR f.description LIKE '%plant%based%')
        AND (f.description NOT LIKE '%collagen%' OR fc.id IN (11, 16))
        AND (f.description NOT LIKE '%lard%' OR fc.id IN (11, 16))
        AND (f.description NOT LIKE '%tallow%' OR fc.id IN (11, 16))
        AND (f.description NOT LIKE '%suet%' OR fc.id IN (11, 16))
        AND (f.description NOT LIKE '%drippings%' OR fc.id IN (11, 16))
        AND (f.description NOT LIKE '%bone%' OR fc.id IN (11, 16))
        AND (f.description NOT LIKE '%fish%' OR fc.id IN (11, 16))
        AND (f.description NOT LIKE '%seafood%' OR fc.id IN (11, 16))
        AND (f.description NOT LIKE '% cod%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%tilapia%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%catfish%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%herring%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%mackerel%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%trout%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%halibut%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%flounder%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%mahi%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%eel%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%octopus%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%squid%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%caviar%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%roe%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%seafood%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '% cod%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%tilapia%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%catfish%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%herring%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%mackerel%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%trout%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%halibut%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%flounder%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%mahi%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%eel%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%octopus%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%squid%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%caviar%' OR fc.id IN (11, 16, 39))
        AND (f.description NOT LIKE '%roe%' OR fc.id IN (11, 16, 39))
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
    FROM VeganFilter
)
SELECT
    MIN(fdc_id) as fdc_id,
    trim_paren,
    category_name
FROM FilterSuffix
GROUP BY trim_paren
ORDER BY fdc_id;
