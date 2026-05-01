-- Created by: Ernesto Garcia
-- Purpose: Filter USDA food database to only include keto-friendly foods

SELECT fdc_id
FROM food_nutrient
GROUP BY fdc_id
HAVING (
    COALESCE(MAX(CASE WHEN nutrient_id = 1005 THEN amount ELSE 0 END), 2.0) - 
    COALESCE(MAX(CASE WHEN nutrient_id = 1079 THEN amount ELSE 0 END), 0)
) <= 0.1
