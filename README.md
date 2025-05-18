# Jira Ticket Editor

**Author:** Sten Healey


### **Description**
This Next.js web app is currently under development. The goal is to develop an application where users can access, edit and create tickets from Jira. However, un-paid Jira accounts are severely limited in their capacity. Therefore, a feature has been added wherein a single paid account can "elevate" the application's access to the Jira API (note this is in addition to the Jira login feature). This "elevated access" feature has already been implemented (see settings).

> [!Note] 
> There is still error logging, debug logging, this project is not complete.


### **Dev Setup**

1. After downloading this repository navigate to the path `C:/../../Jira Ticket Editor/Jira Ticket Editor>`

2. Please setup a Jira OAuth 2.0 application via the [Jira Developer Console](https://developer.atlassian.com/console/myapps/)

3. Please add a file named `.env` containing the following information

```txt

ENVIRONMENT=development
CLIENT_ID=<your jira client id>
CLIENT_SECRET=<your jira client secret>

```

4. To run the Next.js application please run the command `npm run dev`


### **Completed Features**

- Jira API Proxying

- OAuth 2.0 Login

- Logout

- Layouts (Navbar etc)

- Settings & Elevated Authorization

- Searchable Project List

- Simplified Project Ticket List

- User's Assigned Ticket List

### **Remaining Features**

- A ticket creation interface

- A ticket editing interface

### **UI/UX Designs**

**Project Boards**
![Project Board UI/UX Design](/Design%20Information/Project%20Boards.png)

**User Tickets**
![User Ticket Board UI/UX Design](/Design%20Information/User%20Tickets.png)
