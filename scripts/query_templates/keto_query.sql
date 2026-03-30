SELECT fdc_id
FROM food_nutrient
GROUP BY fdc_id
HAVING (
    MAX(CASE WHEN nutrient_id = 1005 THEN amount ELSE 0 END) - 
    MAX(CASE WHEN nutrient_id = 1079 THEN amount ELSE 0 END)
) <= 1.0
