SELECT fdc_id
FROM food_nutrient
GROUP BY fdc_id
HAVING (
    COALESCE(MAX(CASE WHEN nutrient_id = 1005 THEN amount ELSE 0 END), 2.0) - 
    COALESCE(MAX(CASE WHEN nutrient_id = 1079 THEN amount ELSE 0 END), 0)
) <= 1.0
