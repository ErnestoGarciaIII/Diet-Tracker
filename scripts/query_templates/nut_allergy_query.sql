-- Created by: Ingrid Sanchez
-- Purpose: Filter USDA food database to exclude nuts

SELECT
	f.fdc_id,
    	f.description,
	f.food_category_id
FROM {table_name} f
WHERE (f.food_category_id NOT IN (3, 12, 21, 22, 25)
		AND (f.description NOT LIKE 'nut%'
		AND f.description NOT LIKE '%almond%' 
		AND f.description NOT LIKE '%peanut%'
		AND f.description NOT LIKE '%cashew%'
		AND f.description NOT LIKE '%pecan%'
		AND f.description NOT LIKE '%walnut%'
		AND f.description NOT LIKE '%hazelnut%'
		AND f.description NOT LIKE '%brazil nut%'
		AND f.description NOT LIKE '%chestnut%'
		AND f.description NOT LIKE '%filbert%'
		AND f.description NOT LIKE '%pistachio%'
		AND f.description NOT LIKE '%macadamia%'
		AND f.description NOT LIKE '%pignoli%'
		AND f.description NOT LIKE '%pinyon%'
		AND f.description NOT LIKE '%pesto%'
		AND f.description NOT LIKE '%praline%'
		AND f.description NOT LIKE '%mixed nut%')
		OR f.description LIKE '%nutritional%'
		OR f.description LIKE '%waterchestnut%'
		)
