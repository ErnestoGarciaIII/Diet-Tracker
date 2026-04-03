SELECT
    f.fdc_id,
    f.description,
    f.food_category_id
FROM food f
WHERE (f.food_category_id NOT IN (3, 21, 22, 25)
		AND (f.description NOT LIKE '%soy%'
		AND f.description NOT LIKE '%tofu%'
		AND f.description NOT LIKE '%tempeh%'
		AND f.description NOT LIKE '%edamame%'
		AND f.description NOT LIKE '%miso'
		AND f.description NOT LIKE '%lecithin%'
		AND f.description NOT LIKE 'natto'
		AND f.description NOT LIKE '%okara%')
		)
