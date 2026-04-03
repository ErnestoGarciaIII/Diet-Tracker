SELECT
    f.fdc_id,
    f.description,
    f.food_category_id
FROM food f
WHERE (f.food_category_id NOT IN (3, 21, 22, 25)
		AND (f.description NOT LIKE '%crustacean%'
		AND f.description NOT LIKE '%crab%'
		AND f.description NOT LIKE '%shrimp%'
		AND f.description NOT LIKE '%lobster%'
		AND f.description NOT LIKE '%crayfish%'
		AND f.description NOT LIKE '%mollusk%'
		AND f.description NOT LIKE '%squid%'
		AND f.description NOT LIKE '%octopus%'
		AND f.description NOT LIKE '%clam%'
		AND f.description NOT LIKE '%oyster%'
		AND f.description NOT LIKE '%mussel%'
		AND f.description NOT LIKE '%snail%'
		AND f.description NOT LIKE '%abalone%'
		AND f.description NOT LIKE '%cuttlefish%'
		AND f.description NOT LIKE '%scallop%')
		OR f.food_category_id IN (2, 9, 11, 13)
		)
