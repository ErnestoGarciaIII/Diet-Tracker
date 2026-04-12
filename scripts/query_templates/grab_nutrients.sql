-- CTE with selected_nutrients
WITH selected_nutrients AS (
	SELECT id, name, unit_name
	FROM nutrient
	WHERE id IN (1003, 1005, 1004, 1106, 1162, 1114, 1175, 1109, 1185, 1165, 
				1178, 1166, 1177, 1167, 1180, 1089, 1170, 1087, 1098, 1090, 
				1101, 1091, 1092, 1103, 1093, 1095)
),
-- CTE with selected foods -> fdc_ids
selected_foods AS (
	SELECT DISTINCT fdc_id
	FROM food_nutrient
	WHERE fdc_id IN ({FDC_IDS})
),
-- CTE with only energy (choose best of both categories)
energy AS (
	SELECT fdc_id, 'Energy' AS name,
		COALESCE (
			MAX(CASE WHEN nutrient_id = 1008 AND amount > 0 THEN amount / 100.0 END),
            MAX(CASE WHEN nutrient_id = 2047 AND amount > 0 THEN amount / 100.0 END),
			0.0
		) AS adjusted_nutrient,
		'KCAL' AS unit_name
	FROM food_nutrient
    WHERE nutrient_id IN (1008, 2047)
      AND fdc_id IN (SELECT fdc_id FROM selected_foods)
    GROUP BY fdc_id
)
SELECT
    sf.fdc_id,
    sn.name,
    COALESCE(fn.amount / 100.0, 0.0) AS adjusted_nutrient,
    sn.unit_name
FROM selected_foods sf
CROSS JOIN selected_nutrients sn
LEFT JOIN food_nutrient fn ON fn.fdc_id = sf.fdc_id AND fn.nutrient_id = sn.id

UNION ALL
SELECT * FROM energy

ORDER BY fdc_id, name;