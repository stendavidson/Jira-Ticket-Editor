# Jira Ticket Editor

**Author:** Sten Healey


### **Description**
This Next.js web app is currently under development. The goal has been to develop an application where users can access, edit and create tickets from Jira. However, un-paid Jira accounts are severely limited in their capacity. Therefore, a feature has been added wherein a single paid service account can "elevate" the application's access to the Jira API (note this is in addition to the Jira login feature). This "elevated access" feature has already been implemented (see settings/Service Account Authorization).

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

- Settings & Service Account Authorization

- Searchable Project List

- Simplified Project Ticket List

- User's Assigned Ticket List

### **Remaining Features**

- A ticket creation interface

- A ticket editing interface

### **Feature Preview(s)**

**Project Boards**
![Project Board](docs/Project%20Boards.png)

**User Tickets**
![User Ticket Board](docs/User%20Tickets.png)

**Service Account Authorization**
![Service Account Authorization](docs/Service%20Account%20Authorization.png)

**Partial Ticket Interface**
![Ticket Interface Part 1](docs/Incomplete%20Ticket%20Interface%20Part%201.png)
![Ticket Interface Part 2](docs/Incomplete%20Ticket%20Interface%20Part%202.png)
![Ticket Interface Part 3](docs/Incomplete%20Ticket%20Interface%20Part%203.png)
![Ticket Interface Part 4](docs/Incomplete%20Ticket%20Interface%20Part%204.png)