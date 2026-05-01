-- Created by: Ingrid Sanchez
-- Purpose: Filters USDA food database to exclude foods with dairy

SELECT
    f.fdc_id,
    f.description,
    f.food_category_id
FROM {table_name} f
WHERE (f.food_category_id NOT IN (1, 3, 21, 22, 25, 30, 36, 37)
		AND (f.description NOT LIKE '%dairy%'
		AND f.description NOT LIKE '%cheese%'
		AND f.description NOT LIKE '%cheddar%'
		AND f.description NOT LIKE '%mozzarella%' 
		AND f.description NOT LIKE '%parmesan%'
		AND f.description NOT LIKE '% brie %'
		AND f.description NOT LIKE '%alfredo%'
		AND (f.description NOT LIKE '%mac%and%cheese%')
		AND f.description NOT LIKE '%yogurt%'
		AND f.description NOT LIKE '%milk%'
		AND f.description NOT LIKE '%cheese%'
		AND f.description NOT LIKE '%butter%'
		AND (f.description NOT LIKE '%cream%' OR f.description LIKE '%plant%based%') 
		AND f.description NOT LIKE '%casein%'
		AND f.description NOT LIKE '%whey%'
		AND f.description NOT LIKE '%ghee%'
		AND f.description NOT LIKE '%custard%'
		AND f.description NOT LIKE '%pudding%'
		AND f.description NOT LIKE '%gelato%'
		AND f.description NOT LIKE '%eggnog%')
		OR f.description LIKE '%non-dairy%'
		OR f.description LIKE '%non dairy%'
		OR f.description LIKE '%plant based%'
		OR f.description LIKE '%plant-based%'
		OR f.description LIKE '%vegan%'
		OR f.description LIKE '%liver cheese%'
		OR f.description LIKE '%dairy-free%'
		OR f.description LIKE '%yogurt alternative%'
		OR f.description LIKE '%coconut cream%'
		OR f.food_category_id IN (7, 12, 16, 33, 34)
		)
