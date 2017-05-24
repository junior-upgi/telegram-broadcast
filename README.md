# telegram-broadcast-upgi
message broadcasting web service to interface with Telegram bot API

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
* due to the low complexity of the app, currently other than the amount of verbose messages, there's not much difference between development or production mode
