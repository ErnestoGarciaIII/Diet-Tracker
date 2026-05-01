-- Created by: Ingrid Sanchez
-- Purpose: Filters USDA food database to exclude foods that contain egg
SELECT
        f.fdc_id,
        f.description,
        f.food_category_id
    FROM {table_name} f
    WHERE (f.food_category_id NOT IN (3, 7, 18, 21, 22, 25, 31, 38)
		AND (f.description NOT LIKE '%egg%' OR f.description LIKE '%veggie%' OR f.description LIKE '%substitute%' OR f.food_category_id IN (11, 36))
		AND f.description NOT LIKE '%mayonnaise%'
		AND f.description NOT LIKE '%meringue%'
		AND f.description NOT LIKE '%custard%' 
		AND f.description NOT LIKE '%pudding%'
		AND f.description NOT LIKE '%pasta%'
		AND f.description NOT LIKE '%macaroni%'
		AND f.description NOT LIKE '%noodle%'
		AND f.description NOT LIKE '%meatloaf%'
		AND f.description NOT LIKE '%meatball%'
		AND f.description NOT LIKE '%nougat%'
		AND f.description NOT LIKE '%lecithin%'
		AND f.description NOT LIKE '%frosting%'
		AND f.description NOT LIKE '%marshmallow%'
		AND f.description NOT LIKE '%souffle%'
		AND f.description NOT LIKE '%tiramisu%'
		AND f.description NOT LIKE '%salad dressing%'
	)
