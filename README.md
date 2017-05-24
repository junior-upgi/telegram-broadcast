# telegram-broadcast-upgi
message broadcasting web service to interface with Telegram bot API

# description of functionality
1. use sqlite to store registration information
2. registers and remove users info by interaction
3. registers and remove chatroom info when invited or removed
4. register other systems to use this api to send messages through telegram to the registered user or chatrooms
5. api registration is through console interaction with system admin
6. after api registration, the system is allowed to apply for web tokens
7. after receiving the token, an outside system will be allowed to access the api
8. errors are sent to the master account
9. standard operations are operated through a default bot registered by the master accont

# steps to deploy the application
(make sure that node.js(v6.9+) is properly installed)
1. copy the repository url from github
2. navigate to proper folder where the project folder will reside
3. commandline: git clone [repository url], this creates a "telegram-broadcast-upgi" folder with the source code inside
4. navigate into the project folder
5. rename the "example.db" to "telegramBroadcast.db"
6. from the commandline or code editor, add a ".env" file to the project root
7. copy the content from 'example.env' and edit the information accordingly (remove all the comments and watch out for white-spaces!)
8. commandline: "npm install"

# starting the app server
1. navigate to the project root folder
2. from the commandline, execute the command depending on the mode of execution:
"npm run start:dev:server" (development mode)
"npm start" (production mode)
* remember to set 'production' and 'development' correctly in the .env files

# difference between production and development mode
1. THE DATABASE IS WIPE CLEAN COMPLETELY EVERY TIME THE SERVER RESTART on 'development' mode!!!  if you want to preserve the registration info, set to 'production' mode and backup the "telegramBroadcast.db" file manually
2. the frequency of updates parsing and broadcast jobs
3. the amount of verbosity in message output on console

# API
GET protocol://hostname:port/SYS_REF/serviceStatus - web page to check operational status
POST protocol://hostname:port/SYS_REF/serviceStatus - not implemented
PUT protocol://hostname:port/SYS_REF/serviceStatus - not implemented
PATCH protocol://hostname:port/SYS_REF/serviceStatus - not implemented
DELETE protocol://hostname:port/SYS_REF/serviceStatus - not implemented

GET protocol://hostname:port/SYS_REF/api/token - not implemented
POST protocol://hostname:port/SYS_REF/api/token - verify the registered account and issue jwt
PUT protocol://hostname:port/SYS_REF/api/token - not implemented
PATCH protocol://hostname:port/SYS_REF/api/token - not implemented
DELETE protocol://hostname:port/SYS_REF/api/token - not implemented

GET protocol://hostname:port/SYS_REF/api/subscription - api subscription registration form
POST protocol://hostname:port/SYS_REF/api/subscription - process registration request
PUT protocol://hostname:port/SYS_REF/api/subscription - not implemented
PATCH protocol://hostname:port/SYS_REF/api/subscription - not implemented
DELETE protocol://hostname:port/SYS_REF/api/subscription - not implemented

GET protocol://hostname:port/SYS_REF/api/messages - not implemented
POST protocol://hostname:port/SYS_REF/api/messages - submit message to the broadcast queue, also takes username or first_name/last_name as query params
PUT protocol://hostname:port/SYS_REF/api/messages - not implemented
PATCH protocol://hostname:port/SYS_REF/api/messages - not implemented
DELETE protocol://hostname:port/SYS_REF/api/messages - not implemented
