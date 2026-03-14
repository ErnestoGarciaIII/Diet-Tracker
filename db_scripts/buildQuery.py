import pandas 
import numpy
import sqlite3
import sys

def printUsage():
    print("""
        *************************************************************
        ***************            USAGE           ******************
        *************************************************************
        *****                                                   *****
        ***** python buildQuery.py int_arg query_arg(s)         *****
        *****                                                   *****
        ***** int_arg selects the query template                *****
        *****                                                   *****
        ***** query_arg(s) is a dynamic query argument that     *****
        ***** is used to build the different query templates    *****
        *****                                                   *****
        ***** Use python buildQuery.py -h, --h, -help, --help   *****
        ***** to list different templates available, and what   *****
        ***** the possible valid arguments are for each         *****
        *****                                                   *****
        *************************************************************
        *****                                                   *****
        *****  Under development, planned features include      *****
        *****  1. Select Query templates based on arguments     *****
        *****  2. Grab dynamic query criteria from arguments    *****
        *****  3. Help argument feature -h, -help, --h, --help  *****
        *****                                                   *****
        *************************************************************
        *****                                                   *****
        ***** This usage message appears every time you call    *****
        ***** the script, and will sleep, giving you time       *****
        *****                    to read this                   *****
        *****                                                   *****
        *************************************************************
        
Press Enter to continue...

          """)
    input()

def printHelp():
    print("""
        ------------------------------------------------------------------------
        -----                   This is the help section                   -----
        ------------------------------------------------------------------------
        -----         For general Usage, see above Usage details           -----
        -----             ------------------------------------             -----
        -----     --------             TEMPLATES              --------     -----
        -----             ------------------------------------             -----
        -----   Pass argument[2] as the template selector, 1 - N           -----
        -----                                                              -----
        -----   1. General Micronutrient query. Pass argument[3] as the    -----
        -----      search parameter.                                       -----
	    -----                                                              -----
	    -----      Example: python3 buildQuery.py 1 %orange%               -----
	    -----                             				   -----
	    -----      For developer use, use wildcards unless the exact       -----
	    -----      f.description name is known                             -----
        -----      Back-end Algorithm will interact with the script with   -----
        -----      the exact f.description, needing no wildcards %.        -----
        -----                                                              -----
        -----         -------------   Query Results  ------------          -----
        -----                                                              -----
        -----      food_id | food_name | nutrient_name | amount | unit     -----
        -----                                                              -----
        -----         -------------------------------------------          -----
        -----                                                              -----
        -----      Results can be very extensive, do not interrupt the     -----
        -----      script unless query building takes more than 2 minutes  -----
        -----                                                              -----
        ------------------------------------------------------------------------
          """)

def checkArgs():
	if len(sys.argv) < 2:
		print("Error: missing arguments, call buildQuery.py -h, --h, -help, --help to view help details")
		printHelp()
		print("\nExiting...")
		sys.exit(1)
	elif (sys.argv[1] == "-h" or sys.argv[1] == "-help" or sys.argv[1] == "--h" or sys.argv[1] == "--help"):
		printHelp()
		print("Exiting...")
		sys.exit(0)
	elif (sys.argv[1] == '1'):
		if len(sys.argv) < 3:
			print("Incorrect number of arguments for query template 1, see usage or call -h")
		file_name = f"{sys.argv[2]}_micronutrients.txt"
	else: 
		print("Error, invalid arguments. See help section 'buildQuery.py -h'...")
		sys.exit(3)

def build_sql_query(a, searchArg):

	nutrient_table = [1106, 1162, 1114, 1175, 1158, 1109, 1185, 1165, 1178, 1166, 1177, 1167, 1180, 1089, 1170, 1176, 1087,  1096, 1098, 1099, 1100, 1238, 1090, 1101, 1102, 1091, 1092, 1103, 1093, 1095]
                     
	appendedList = ', '.join(['?'] * len(nutrient_table))
	if a == '1':
		global file_name
		file_name = f"Micronutrient_Query_{sys.argv[2]}.txt"
		sql_query = f"""
		SELECT f.fdc_id, fc.description, f.description, n.name, fn.amount, n.unit_name
		FROM food f
		LEFT JOIN food_nutrient fn ON f.fdc_id = fn.fdc_id
		LEFT JOIN nutrient n ON fn.nutrient_id = n.id
		JOIN food_category fc ON fc.id = f.food_category_id
		WHERE f.description LIKE ?
			AND n.id IN ({appendedList})
			AND fc.description NOT IN ('Restaurant Foods', 'Fast Foods', 'Meals, Entrees, and Side Dishes', 'Baby Foods');
        """
	parameters = [searchArg] + nutrient_table
    
	return sql_query, parameters

def connectDB():
	try: 
		connection = sqlite3.connect("../db/master_food.db")
	except sqlite3.OperationalError as e:
		print(f"Unable to connect to the database...")
		print(e)
		sys.exit(1)
	return connection

def writeResults(rows):
	with open(file_name, 'w') as f:
		f.writelines(f"{str(row)}\n" for row in rows)

def runQuery(cursor, sql_command, sql_params):
	try:
		cursor.execute(sql_command, sql_params)
	
	except sqlite3.OperationalError as e: 
	
		print(f"Unable to execute cursor command...")
		print(e)
		sys.exit(2)
	
	rows = cursor.fetchall()
	writeResults(rows)	

def main():

	printUsage()

	checkArgs()
    	
	connection = connectDB()
	cursor = connection.cursor()

	sql_command, sql_params = build_sql_query(sys.argv[1], sys.argv[2])
	
	runQuery(cursor, sql_command, sql_params)


if __name__ == "__main__":
    	main()
