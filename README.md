# free-html-local-ssh-manager (3 minutes install)
Manage local ssh connections with HTML/Nodejs app ~ You can inspect the code and won't find any backdoor! <br>

# Supported Os
Linux | MacOs

# Fonctionnalities & Some ideas :)
Once you click on "command" button, a terminal is launched with ssh command to remote host. Your password is encrypted with a magic salt once you create a new host and you need that magic salt every time you want to copy/paste the host password in your clipboard from the browser. It can be a collaborative free tool to share access to multiple servers. Password Protected page can also be added!

# Requirements

Node server + Web Server (Nginx or Apache or whatever you like...)

# Installation
Clone repository in the publish directory of your web server (by default /var/www/html if not you must edit line 3 in "fwordssh" file before processing to installation)

```bash
 bash install.sh
```

# Instructions

Install npm packages
```bash
 npm install
```

Add a new host
```bash
 npm run start
```

Run app (It should be autocompletable from your terminal)
```bash
 fwordssh
```

# Have a good time hacking!
