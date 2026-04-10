SELECT
	f.fdc_id,
        f.description,
        f.food_category_id
FROM {table_name} f
WHERE (f.food_category_id NOT IN (3, 5, 7, 10, 13, 15, 17, 21, 22, 24, 25, 27)
	AND ((f.description NOT LIKE '%chicken%')
        AND (f.description NOT LIKE '%beef%')
        AND (f.description NOT LIKE '%clam%')
        AND (f.description NOT LIKE '%steak%')
        AND (f.description NOT LIKE '%pork%')
        AND (f.description NOT LIKE '%bacon%')
        AND (f.description NOT LIKE '% ham%')
        AND (f.description NOT LIKE '%pepperoni%')
        AND (f.description NOT LIKE '%salami%')
        AND (f.description NOT LIKE '%jerky%')
        AND (f.description NOT LIKE '%lamb%')
        AND (f.description NOT LIKE '%turkey%')
        AND (f.description NOT LIKE '%duck%')
        AND (f.description NOT LIKE '%goose%')
        AND (f.description NOT LIKE '%quail%')
        AND (f.description NOT LIKE '%giblet%'))
	OR f.food_category_id IN (1, 11, 16, 39, 15)
	)
