SELECT
    fn.fdc_id,
    n.name,
    COALESCE(fn.amount / 100.0, 0.0) AS adjusted_nutrient,
    n.unit_name
FROM food_nutrient fn
INNER JOIN nutrient n ON fn.nutrient_id = n.id
WHERE n.id IN (1003, 1005, 1004, 1106, 1162, 1114, 1175, 1109, 1185, 1165, 1178, 1166, 1177, 1167, 1180, 1089, 1170, 1087, 1098, 1090, 1101, 1091, 1092, 1103, 1093, 1095)
AND fn.fdc_id IN ({fcd_id})
ORDER BY fn.fdc_id, n.name;