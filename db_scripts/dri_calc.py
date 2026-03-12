import sys

#DRI Calculation per user
#BMR is calculated using Mifflin-St Jeor Equation, P = (10 x weight in kg) + (6.25 x height in cm) - (5 x age in years) + s [constant s: males +5 females -161
#Activity factor multiplier: Sedentary - 1.2 | Lightly Active - 1.375 | Moderately Active: 1.55 | Very Active: 1.725 

def printUsage(): 
    print(f"""
    -----------------------------------------------------------------------------------------------
    -----                                          USAGE                                      -----
    -----------------------------------------------------------------------------------------------
    -----  <python> .\dri_calc.py <weight kg> <height cm> <age> <sex> <activity level> <goal> -----
    -----                                                                                     -----
    -----   Activity Levels are passed as an integer:                                         -----
    -----   1 - Sedentary                                                                     -----
    -----   2 - Lightly Active                                                                -----
    -----   3 - Moderately Active                                                             -----
    -----   4 - Very Active                                                                   -----
    -----                                                                                     -----
    -----   Goal is passed as an integer:                                                     -----
    -----   1 - Maintain                                                                      -----
    -----   2 - Fat Loss                                                                      -----
    -----   3 - Muscle Gain                                                                   -----
    -----                                                                                     -----
    -----   Output is written to a file representing the daily progress bar that will         -----
    -----   be used for the user. PROGRESS BAR ONLY NEEDS TO BE RECALCULATED IF USER          -----
    -----   CHANGES ANY ACCOUNT SETTINGS USED IN THESE CALCULATIONS                           -----
    -----                                                                                     -----
    -----------------------------------------------------------------------------------------------

    Press Enter to continue...
    """)
    input()

def checkArgs():
    errorNum = 0
    if len(sys.argv) != 7: #checks for 7 because the script itself being called counts as 1 [Looking for 5, the calculation criteria]
        print(f"Expected 5 arguments, received {len(sys.argv)-1}...\n\nWeight, Height, Age, Sex, Activity level, goal\n\nSee usage section\n")
        sys.exit(1)
    try:
        weight = int(sys.argv[1])

        if weight < 32 or weight > 180:
            print("Error: Weight argument falls outside of expected range, did you give LB instead of KG?...\n")
            errorNum += 1
            if weight > 180: 
                weight * 0.453592
                print(f"    If you put in {weight}lb, that is equivalent to {int(weight * 0.453592)}kg...\n")

    except ValueError: 
            print("Error: Weight argument must be an integer [Representing weight in kg]...\n")
            errorNum += 1
    try: 
    
        height = int(sys.argv[2])
        
        if height < 24 or height > 108:
            print("Error: Height argument falls outside of expected range, did you give CM or M instead of Inches?...\n")
            errorNum += 1

    except ValueError:
    
        print("Error: Height argument must be an integer [Representing height in inches]...\n")
        errorNum += 1
    
    try:
        
        age = int(sys.argv[3])
        
        if age < 1 or age > 116:
            print("Error: Age argument falls outside of expected range...\n")
            errorNum += 1

    except ValueError:
        
        print("Error: Age argument must be an integer [Representing height in inches]...\n")
       
    sex = sys.argv[4].upper()
    if sex != "MALE" and sex != "FEMALE":
        print(f"Error: Sex argument '{sex}' not recognized, ensure 'male' or 'female' is passed, case insensitive...\n")
        errorNum += 1
    el if sex == "MALE":
        sex = 5
    else:
        sex = -161

    try: 
        
        activity_level = int(sys.argv[5])
        
        if activity_level < 1 or activity_level > 4:
            print("Error: Activity level argument falls outside of expected range 1 - 4...\n")
            errorNum += 1

    except ValueError:
        print("Error: Activity level argument must be an integer [1 - 4]...\n")
        errorNum += 1u
    
    try:

        goal = int(sys.argv[6])

        if goal < 1 or goal > 3:
            print("Error: Goal argument falls outside of expected range 1 - 3...\n")
            errorNum += 1

    except ValueError: 
        print("Error: Goal argument must be an integer [1 - 3]...\n")
        errorNum += 1

    if errorNum > 0:
        sys.exit(errorNum)
    else: 
        return weight, height, age, sex, activity_level, goal

class UserDRI():
    
    activity_factor = [1.2, 1.375, 1.55, 1.725]
    
    def __init__(self, w, h, a, s, al, g):
        self.weight = w
        self.height = h
        self.age = a
        self.sex = s
        self.activity_level = al
        self.goal = g
        self.macros = {"Protein": 0, "Carbs": 0, "Fats": 0}
        self.micros = {
                "Calcium":0,
                "Magnesium":0,
                "Phosphorus":0,
                "Potassium":0,
                "Sodium":0,
                "Zinc":0,
                "Copper":0,
                "Manganese":0,
                "Selenium":0,
                "Vitamin E":0,
                "Vitamin D":0,
                "Vitamin C":0,
                "Thiamin":0,
                "Riboflavin":0,
                "Niacin":0,
                "Pantothenic acid":0,
                "Vitamin B-6":0,
                "Vitamin B-12":0,
                "Folate":0,
                "Choline":0,
                "Vitamin K":0
                }
        self.BMR = 0
        self.TDEE = 0
    
    def calcMacros(self):
        match self.goal:
            case 1:
                self.macros["Protein"] = (self.TDEE * 0.25)/4
                self.macros["Carbs"] = (self.TDEE * 0.55)/4
                self.macros["Fats"] = (self.TDEE * 0.20)/9
            case 2:
                self.macros["Protein"] = (self.TDEE * 0.25*0.95)/4
                self.macros["Carbs"] = (self.TDEE * 0.55*0.85)/4
                self.macros["Fats"] = (self.TDEE * 0.20*0.95)/9
            case 3:
                self.macros["Protein"] = (self.TDEE * 0.28)/4
                self.macros["Carbs"] = (self.TDEE * 0.60)/4
                self.macros["Fats"] = (self.TDEE * 0.22)/9
                        
        
    
    def calcDRI(self):
        self.BMR = ((10*self.weight) + (6.25 * self.height * 2.54) - (5 * self.age) + self.sex)
        self.TDEE = self.BMR*self.activity_factor[self.activity_level - 1]
        calcMacros()



def main(): 
    printUsage()

    userCriteria = checkArgs()
    
    user_DRI = UserDRI(*userCriteria)
    
    

if __name__ == ("__main__"):
    main()
