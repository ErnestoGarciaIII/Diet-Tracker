-- Created by: Berkeley Scott
-- Purpose: Table of top nutritious foods that recommendation algorithm can choose from

INSERT INTO TopFoods (fdc_id, description, nutrient_id, amount_per_gram, food_category_id)
SELECT
    MIN(f.fdc_id),
    f.description,
    fn.nutrient_id,
    MAX(fn.amount) / 100.0,
    f.food_category_id
FROM food_nutrient fn
JOIN food f ON f.fdc_id = fn.fdc_id
WHERE f.data_type IN ('foundation_food', 'sr_legacy')
AND f.description NOT LIKE '%dried%'
AND (f.description NOT LIKE '%dry%' OR f.description NOT LIKE '%cheese%')
AND f.description NOT LIKE '%powder%'
AND f.description NOT LIKE '%flour%'
AND f.description NOT LIKE '%sorghum%'
AND f.description NOT LIKE '%cheese%american%'
AND f.description NOT LIKE '%Milk%added%'
AND f.description NOT LIKE '%egg%frozen%paste%'
AND f.description NOT LIKE '%restaurant%'
AND f.description NOT LIKE '%cooked%'
AND f.description NOT LIKE '%fortified%'
AND f.description NOT LIKE '%dehydrated%'
AND f.description NOT LIKE '%fortified%'
AND f.description NOT LIKE '%concentrate%'
AND fn.amount > 0
AND fn.nutrient_id IN (1003,1053,1005,1050,1072,2039,1004,1049,1085,1257,
                       1258,1292,1293,1106,1162,1114,1175,1158,1079,1109,
                       1185,1165,1178,1166,1177,1167,1180,1089,1170,1176,
                       1087,1096,1098,1099,1100,1238,1090,1101,1102,1091,
                       1092,1103,1093,1095,1183)
AND f.fdc_id IN (
    SELECT fdc_id FROM (
        SELECT
            MIN(f2.fdc_id) AS fdc_id,
            fn2.nutrient_id,
            ROW_NUMBER() OVER (
                PARTITION BY fn2.nutrient_id
                ORDER BY MAX(fn2.amount) DESC
            ) AS rank
        FROM food_nutrient fn2
        JOIN food f2 ON f2.fdc_id = fn2.fdc_id
        WHERE f2.data_type IN ('foundation_food', 'sr_legacy')
        AND fn2.amount > 0
        GROUP BY f2.description, fn2.nutrient_id
    )
    WHERE rank <= 250
)
GROUP BY f.description, fn.nutrient_id;
