Welcome to PlatePilot

PlatePilot is a locally hosted application mimicking web-server interaction using a locally built SQLite database using USDA's publicly available dataset. https://fdc.nal.usda.gov/download-datasets

PlatePilot's star feature is the recommendation algorithm, which calculates 5 rounds of nutritionally optimal food based on the current dietary progress of the day. The algorithm iterates through a pre-constructed table of nutritious foods, and calculates the top 5 items for the users current progress. Subsequent rounds assume the user picks one of the previously recommended foods, and calculates the next best item. This allows users to use the recommendations to plan a well rounded diet by using the algorithm's selection, and offering variety for each round in case the user does not like one of the recommended foods. 

PlatePilot allows users to create an account and save biological information such as Age, Sex, Height, Weight and Activity level. Those settings are used to calculate recommended dietary intake. Users can change specific information that is subject to change over the course of someone's dietary journey, Height, Weight and Activity level. Sex is unchangeable since PlatePilot cannot accurately calculate recommended dietary intake for transgender individuals, and that dietary needs in those cases should be addressed by their primary care physician or dietician. Age is calculated using the user's date of birth, so that changes automatically. 

PlatePilot features a search engine that allows users to interact with the database, and select food items to log. Filters can be applied either in account settings or on the search engine page, allowing users to filter out items that do not fit their dietary restrictions, whether that be vegetarian, vegan, or any allergies such as shellfish and nut allergies. 

User food log history is stored locally in the database, and can be accessed for comparison and analysis in the food history page. Users can select 2 different days to compare the nutritional progress and list of food items. 

Members of PlatePilot:

Berkeley Scott - Project Leader and Visionary for PlatePilot. Managed project work flow and task delegation. Built the back-end that processes user data and handles database requests. Single-handedly created and refined the recommendation algorithm, and the framework for connecting the algorithm to the user interface. Built the user class and the search engine. Responsible for design and implementation of the database schema. Created filter queries and built the framework to integrate them into the search engine. 