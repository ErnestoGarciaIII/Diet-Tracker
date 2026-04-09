#This script will set the enviroment variables to enable password reset
#Setting these credentials in a script ONLY for development and debugging use and WILL NOT be included in production code
#USER_PASS is NOT the real password instead an app password that google has given use
#The email additionally has 2FA for added security


setx EMAIL_USER "platepilot.noreply@gmail.com"
setx EMAIL_PASS "cpowaugypjbgtigg" 
exit