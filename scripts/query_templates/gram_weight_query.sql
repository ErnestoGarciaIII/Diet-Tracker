SELECT 
	COALESCE(gram_weight, 1.0) AS gram_weight, 
	COALESCE(modifier, "g") AS modifier
FROM (SELECT 1) AS default_row -- creates a row if no modifiers exist for food item
	LEFT JOIN food_portion fp
	ON fdc_id = ?
