import sys

#DRI Calculation per user
#BMR is calculated using Mifflin-St Jeor Equation, P = (10 x weight in kg) + (6.25 x height in cm) - (5 x age in years) + s [constant s: males +5 females -161
#Activity factor multiplier: Sedentary - 1.2 | Lightly Active - 1.375 | Moderately Active: 1.55 | Very Active: 1.725 

def README(): 
    print(f"""
    -----------------------------------------------------------------------------------------------
    -----                                          USAGE                                      -----
    -----------------------------------------------------------------------------------------------
    -----                                                                                     -----
    -----   Build Structure                                                                   -----
    -----   ppuser(weight kg, height cm, age, sex, activity level [1-4], goal [1 - 5])_       -----
    -----                                                                                     -----
    -----   Activity Levels are passed as an integer:                                         -----
    -----   1 - Sedentary                                                                     -----
    -----   2 - Lightly Active                                                                -----
    -----   3 - Moderately Active                                                             -----
    -----   4 - Very Active                                                                   -----
    -----                                                                                     -----
    -----   Goal is passed as an integer:                                                     -----
    -----   1 - Maintain                                                                      -----
    -----   2 - Weight Loss                                                                   -----
    -----   3 - Muscle Gain                                                                   -----
    -----   4 - Maintain (Weight Lifter)                                                      -----
    -----   5 - Weight Loss (Weight Lifter)                                                   -----
    -----                                                                                     -----
    -----------------------------------------------------------------------------------------------
    """)


class ppuser():
    
    activity_factor = [1.2, 1.375, 1.55, 1.725]
    
    def __init__(self, w, h, a, s, al, g):
        self.weight = w
        self.height = h
        self.age = a
        self.sex = s.upper()
        self.activity_level = al
        self.goal = g
        self.macros = {"Protein": 0, "Carbs": 0, "Fats": 0, "Fiber": 0}
        self.micros = {
                "Calcium":0,
                "Iron":0,
                "Magnesium":0,
                "Phosphorus":0,
                "Potassium":0,
                "Sodium":0,
                "Zinc":0,
                "Copper":0,
                "Manganese":0,
                "Selenium":0,
                "Vitamin A":0,
                "Vitamin E":0,
                "Vitamin D":0,
                "Vitamin C":0,
                "Thiamin":0,
                "Riboflavin":0,
                "Niacin":0,
                "Pantothenic acid":0,
                "Vitamin B-6":0,
                "Folate":0,
                "Vitamin B-12":0,
                "Choline":0,
                "Vitamin K":0
                }
        self.upper_limits = {
            "Energy":           (None,   0.0),
            "Protein":          (None,   0.0),
            "Carbs":            (None,   0.0),
            "Fats":             (None,   0.0),
            "Fiber":            (None,   0.0),
            "Calcium":          (2500,   0.3),  # lower severity — food calcium rarely toxic
            "Iron":             (45,     0.5),  # keep some — iron overload is real
            "Magnesium":        (350,    0.2),  # lower — dietary Mg rarely hits UL dangerously
            "Phosphorus":       (4000,   0.1),
            "Potassium":        (None,   0.0),
            "Sodium":           (2300,   1.5),  # keep high — sodium overconsumption matters
            "Zinc":             (40,     0.5),
            "Copper":           (10,     0.5),
            "Manganese":        (11,     0.3),  # lower — dietary manganese toxicity rare
            "Selenium":         (400,    2.0),  # keep high — selenium toxicity is real
            "Vitamin A":        (3000,   2.0),  # keep — preformed Vitamin A can be toxic
            "Vitamin D":        (100,    1.0),
            "Vitamin E":        (1000,   0.5),
            "Vitamin K":        (None,   0.0),
            "Vitamin C":        (2000,   0.3),  # lower — dietary C overconsumption minor
            "Thiamin":          (None,   0.0),
            "Riboflavin":       (None,   0.0),
            "Niacin":           (35,     1.5),  # keep — niacin flush/toxicity real
            "Pantothenic acid": (None,   0.0),
            "Vitamin B-6":      (100,    1.0),
            "Folate":           (1000,   0.5),
            "Vitamin B-12":     (None,   0.0),
            "Choline":          (3500,   0.3),
        }
        self.BMR = 0
        self.TDEE = 0
        self.ERR = 0
    
    def calcMacros(self):
        self.upper_limits["Protein"] = ((self.TDEE * 0.35) / 4, 1.0)
        self.upper_limits["Fats"] = ((self.TDEE * 0.35) / 9, 1.5)
        if (self.sex == "MALE"):
            match self.goal:
                case 1: #Standard maintain
                    self.macros["Protein"] = (self.TDEE * 0.21)/4
                    self.macros["Carbs"] = (self.TDEE * 0.56)/4
                    self.macros["Fats"] = (self.TDEE * 0.23)/9
                    self.upper_limits["Energy"] = (self.TDEE, 1.0)
                case 2: #Weight loss
                    self.macros["Protein"] = (self.TDEE * 0.23*0.95)/4
                    self.macros["Carbs"] = (self.TDEE * 0.56*0.85)/4
                    self.macros["Fats"] = (self.TDEE * 0.21*0.95)/9
                    self.upper_limits["Energy"] = (self.TDEE*0.90, 1.5)
                case 3: #Muscle building
                    self.macros["Protein"] = (self.TDEE * 0.25)/4
                    self.macros["Carbs"] = (self.TDEE * 0.60)/4
                    self.macros["Fats"] = (self.TDEE * 0.25)/9
                    self.upper_limits["Energy"] = (self.TDEE*1.1, 0.7)
                case 4: #Weight lifter, maintain
                    self.macros["Protein"] = (self.TDEE * 0.23)/4
                    self.macros["Carbs"] = (self.TDEE * 0.55)/4
                    self.macros["Fats"] = (self.TDEE * 0.22)/9
                    self.upper_limits["Energy"] = (self.TDEE*1.05, 1.0)
                case 5: #Weight lifter, weight loss
                    self.macros["Protein"] = (self.TDEE * 0.25 * 0.95)/4
                    self.macros["Carbs"] = (self.TDEE * 0.53 * 0.85)/4
                    self.macros["Fats"] = (self.TDEE * 0.22 * 0.95)/9
                    self.upper_limits["Energy"] = (self.TDEE*0.95, 1.5)
        else:
            match self.goal:
                case 1: #Standard maintain
                    self.macros["Protein"] = (self.TDEE * 0.19)/4
                    self.macros["Carbs"] = (self.TDEE * 0.56)/4
                    self.macros["Fats"] = (self.TDEE * 0.25)/9
                    self.upper_limits["Energy"] = (self.TDEE, 1.0)
                case 2: #Weight loss
                    self.macros["Protein"] = (self.TDEE * 0.23*0.95)/4
                    self.macros["Carbs"] = (self.TDEE * 0.52*0.85)/4
                    self.macros["Fats"] = (self.TDEE * 0.25*0.95)/9
                    self.upper_limits["Energy"] = (self.TDEE*0.90, 1.5)
                case 3: #Muscle building
                    self.macros["Protein"] = (self.TDEE * 0.22)/4
                    self.macros["Carbs"] = (self.TDEE * 0.62)/4
                    self.macros["Fats"] = (self.TDEE * 0.27)/9
                    self.upper_limits["Energy"] = (self.TDEE*1.1, 0.7)
                case 4: #Weight lifter, maintain
                    self.macros["Protein"] = (self.TDEE * 0.20)/4
                    self.macros["Carbs"] = (self.TDEE * 0.55)/4
                    self.macros["Fats"] = (self.TDEE * 0.25)/9
                    self.upper_limits["Energy"] = (self.TDEE*1.05, 1.0)
                case 5: #Weight lifter, weight loss
                    self.macros["Protein"] = (self.TDEE * 0.25 * 0.95)/4
                    self.macros["Carbs"] = (self.TDEE * 0.51 * 0.85)/4
                    self.macros["Fats"] = (self.TDEE * 0.24 * 0.95)/9
                    self.upper_limits["Energy"] = (self.TDEE*0.95, 1.5)
        if self.sex == "MALE":
            if 19 <= self.age <= 50:
                self.macros["Fiber"] = 38
            elif self.age > 50:
                self.macros["Fiber"] = 31
        else:
            if 19 <= self.age <= 50:
                self.macros["Fiber"] = 25
            elif self.age > 50:
                self.macros["Fiber"] = 21


    def getNutrientInfo(self, index):
        if index in self.micros:
            return self.micros[index]
        elif index in self.macros:
            return self.macros[index]
        elif index == "Energy":
            return self.TDEE


    def setDRI(self):
        if self.sex == "MALE":
            self.BMR = (88.362 + (13.397*self.weight) + (4.799 * self.height/2.54) - (5.677 * self.age))
        else:
            self.BMR = (447.593 + (9.247*self.weight) + (3.098 * self.height/2.54) - (4.33 * self.age))

        self.TDEE = self.BMR*self.activity_factor[self.activity_level - 1]
        self.calcMacros()
        self.upper_limits["Fiber"] = (self.macros["Fiber"] * 2, 1.0)
        if self.sex == "MALE":
            if 19 <= self.age <= 30:
                self.ERR = 662 - (9.53 * self.age) + self.activity_level * ((9.36 * self.weight) + (539.6 * self.height * 2.5 / 100))
                self.micros["Calcium"] = 1000
                self.micros["Iron"] = 8
                self.micros["Magnesium"] = 400
                self.micros["Phosphorus"] = 700
                self.micros["Potassium"] = 3400
                self.micros["Sodium"] = 1500
                self.micros["Zinc"] = 11
                self.micros["Copper"] = 0.9
                self.micros["Manganese"] = 2.3
                self.micros["Selenium"] = 55
                self.micros["Vitamin A"] = 900
                self.micros["Vitamin E"] = 15
                self.micros["Vitamin D"] = 15
                self.micros["Vitamin C"] = 90
                self.micros["Thiamin"] = 1.2
                self.micros["Riboflavin"] = 1.3
                self.micros["Niacin"] = 16
                self.micros["Pantothenic acid"] = 5
                self.micros["Vitamin B-6"] = 1.3
                self.micros["Folate"] = 400
                self.micros["Vitamin B-12"] = 2.4
                self.micros["Choline"] = 550
                self.micros["Vitamin K"] = 120
            elif 31 <= self.age <= 50:
                self.ERR = 662 - (9.53 * self.age) + self.activity_level * ((9.36 * self.weight) + (539.6 * self.height * 2.5 / 100))
                self.micros["Calcium"] = 1000
                self.micros["Iron"] = 8
                self.micros["Magnesium"] = 420
                self.micros["Phosphorus"] = 700
                self.micros["Potassium"] = 3400
                self.micros["Sodium"] = 1500
                self.micros["Zinc"] = 11
                self.micros["Copper"] = 0.9
                self.micros["Selenium"] = 55
                self.micros["Vitamin A"] = 900
                self.micros["Vitamin E"] = 15
                self.micros["Vitamin D"] = 15
                self.micros["Vitamin C"] = 90
                self.micros["Thiamin"] = 1.2
                self.micros["Riboflavin"] = 1.3
                self.micros["Niacin"] = 16
                self.micros["Pantothenic acid"] = 5
                self.micros["Vitamin B-6"] = 1.3
                self.micros["Folate"] = 400
                self.micros["Vitamin B-12"] = 2.4
                self.micros["Choline"] = 550
                self.micros["Vitamin K"] = 120
            elif self.age > 50:
                self.ERR = 662 - (9.53 * self.age) + self.activity_level * ((9.36 * self.weight) + (539.6 * self.height * 2.5 / 100))	
                self.micros["Calcium"] = 1000
                self.micros["Iron"] = 8
                self.micros["Magnesium"] = 420
                self.micros["Phosphorus"] = 700
                self.micros["Potassium"] = 3400
                self.micros["Sodium"] = 1300
                self.micros["Zinc"] = 11
                self.micros["Copper"] = 0.9
                self.micros["Manganese"] = 2.3
                self.micros["Selenium"] = 55
                self.micros["Vitamin A"] = 900
                self.micros["Vitamin E"] = 15
                self.micros["Vitamin D"] = 15 #mcg
                self.micros["Vitamin C"] = 90
                self.micros["Thiamin"] = 1.2
                self.micros["Riboflavin"] = 1.3
                self.micros["Niacin"] = 16
                self.micros["Pantothenic acid"] = 5
                self.micros["Vitamin B-6"] = 1.7
                self.micros["Folate"] = 400
                self.micros["Vitamin B-12"] = 2.4
                self.micros["Choline"] = 550
                self.micros["Vitamin K"] = 120
    	
        elif self.sex == "FEMALE":
            if 19 <= self.age <= 30:
                self.ERR = 354 - (6.91 * self.age) + self.activity_level * ((9.36 * self.weight) + (726 * self.height * 2.5 / 100))	
                self.micros["Calcium"] = 1000
                self.micros["Magnesium"] = 310
                self.micros["Phosphorus"] = 700
                self.micros["Potassium"] = 2600
                self.micros["Sodium"] = 1500
                self.micros["Zinc"] = 8
                self.micros["Copper"] = 0.9
                self.micros["Iron"] = 18
                self.micros["Manganese"] = 1.8
                self.micros["Selenium"] = 55
                self.micros["Vitamin A"] = 700
                self.micros["Vitamin E"] = 15
                self.micros["Vitamin D"] = 15 #mcg
                self.micros["Vitamin C"] = 75
                self.micros["Thiamin"] = 1.1
                self.micros["Riboflavin"] = 1.1
                self.micros["Niacin"] = 14
                self.micros["Pantothenic acid"] = 5
                self.micros["Vitamin B-6"] = 1.3
                self.micros["Folate"] = 400
                self.micros["Vitamin B-12"] = 2.4
                self.micros["Choline"] = 425
                self.micros["Vitamin K"] = 90

            elif 31 <= self.age <= 50:
                self.ERR = 354 - (6.91 * self.age) + self.activity_level * ((9.36 * self.weight) + (726 * self.height * 2.5 / 100))	
                self.micros["Calcium"] = 1000
                self.micros["Magnesium"] = 320
                self.micros["Phosphorus"] = 700
                self.micros["Potassium"] = 2600
                self.micros["Sodium"] = 1500
                self.micros["Zinc"] = 8
                self.micros["Copper"] = 0.9
                self.micros["Iron"] = 18
                self.micros["Manganese"] = 1.8
                self.micros["Selenium"] = 55
                self.micros["Vitamin A"] = 700
                self.micros["Vitamin E"] = 15
                self.micros["Vitamin D"] = 15
                self.micros["Vitamin C"] = 75
                self.micros["Thiamin"] = 1.1
                self.micros["Riboflavin"] = 1.1
                self.micros["Niacin"] = 14
                self.micros["Pantothenic acid"] = 5
                self.micros["Vitamin B-6"] = 1.3
                self.micros["Folate"] = 400
                self.micros["Vitamin B-12"] = 2.4
                self.micros["Choline"] = 425
                self.micros["Vitamin K"] = 90
            elif self.age > 50:

                self.ERR = 354 - (6.91 * self.age) + self.activity_level * ((9.36 * self.weight) + (726 * self.height * 2.5 / 100))		
                self.micros["Calcium"] = 1200
                self.micros["Magnesium"] = 320
                self.micros["Phosphorus"] = 700
                self.micros["Potassium"] = 2600
                self.micros["Sodium"] = 1300
                self.micros["Zinc"] = 8
                self.micros["Copper"] = 0.9
                self.micros["Iron"] = 18
                self.micros["Manganese"] = 1.8
                self.micros["Selenium"] = 55
                self.micros["Vitamin A"] = 700
                self.micros["Vitamin E"] = 15
                self.micros["Vitamin D"] = 15
                self.micros["Vitamin C"] = 75
                self.micros["Thiamin"] = 1.1
                self.micros["Riboflavin"] = 1.1
                self.micros["Niacin"] = 14
                self.micros["Pantothenic acid"] = 5
                self.micros["Vitamin B-6"] = 1.5
                self.micros["Folate"] = 400
                self.micros["Vitamin B-12"] = 2.4
                self.micros["Choline"] = 425
                self.micros["Vitamin K"] = 90
    	
    def getAll(self):
        print(f"""
        ----- MICROS -----""")
        for key, value in self.micros.items():
            print(f"""
        {key}: {value}""")
        print(f"""
        ----- ------ -----

        ----- MACROS -----""")
        for key, value in self.macros.items():
            print(f"""
        {key}: {value}""")
        print(f"""
        ----- ------ -----
                          
        ----- -INFO- -----
        Height:     {self.height} cm | {(int)(self.height/2.54)} inches

        Weight:     {self.weight} kilograms
        
        Age:        {self.age} years old
        
        Sex:        {self.sex}
        
        Activity:   {self.activity_level}
            1 - Sedentary
            2 - Lightly Active
            3 - Moderately Active
            4 - Very active
        
        Goal:       {self.goal} 
            1 - Maintain (standard)
            2 - Weight Loss (standard)
            3 - Muscle building
            4 - Maintain (Weight trainer)
            5 - Weight Loss (Weight trainer)

        BMR:        {self.BMR}

        TDEE:       {self.TDEE}
        """)
        



def main(): 
    README()
    
    

if __name__ == ("__main__"):
    main()
