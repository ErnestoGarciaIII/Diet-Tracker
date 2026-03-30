SELECT
    fn.fdc_id,
    n.name,
    fn.amount * (COALESCE(fp.gram_weight, 28.3495) / 100.0) AS adjusted_nutrient,
    n.unit_name,
    COALESCE(fp.amount, 1) AS portion_qty,
    COALESCE(fp.modifier, 'oz') AS portion_name
FROM food_nutrient fn
INNER JOIN nutrient n ON fn.nutrient_id = n.id
LEFT JOIN food_portion fp ON fp.fdc_id = fn.fdc_id
WHERE n.id IN (1003, 1053, 1005, 1050, 1072, 2039, 1004, 1049, 1085, 1257, 1258, 1292, 1293, 1106, 1162, 1114, 1175, 1158, 1079, 1109, 1185, 1165, 1178, 1166, 1177, 1167, 1180, 1089, 1170, 1176, 1087,  1096, 1098, 1099, 1100, 1238, 1090, 1101, 1102, 1091, 1092, 1103, 1093, 1095)
AND fn.fdc_id = :userInput
ORDER BY n.name;
