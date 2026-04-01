SELECT
	f.fdc_id,
        f.description,
        f.food_category_id
FROM food f
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
        AND (f.description NOT LIKE '%giblet%')
        AND (f.description NOT LIKE '%salmon%')
        AND (f.description NOT LIKE '%tuna%')
        AND (f.description NOT LIKE '%shrimp%')
        AND (f.description NOT LIKE '%prawn%')
        AND (f.description NOT LIKE '%crab%')
        AND (f.description NOT LIKE '%lobster%')
        AND (f.description NOT LIKE '%anchovy%')
        AND (f.description NOT LIKE '%sardine%')
        AND (f.description NOT LIKE '%scallop%')
        AND (f.description NOT LIKE '%oyster%')
        AND (f.description NOT LIKE '%sausage%')
        AND (f.description NOT LIKE '%mussel%'))
	OR f.food_category_id IN (1, 11, 16, 39)
	OR f.description LIKE '%plant%based%'
	OR f.description LIKE '%meatless%'
	OR f.description LIKE '%vegan%'
	)
