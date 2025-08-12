# Jira Ticket Editor

**Author:** Sten Healey


### **Description**
The goal has been to develop an application where users can access, edit and create tickets from Jira. Furthermore, a feature has been added wherein a Jira Service Account can "proxy" access to the Jira API (note this is in addition to the Jira login feature). This feature has already been implemented (see settings/Service Account Authorization).

> [!Warning]
> To the best of my knowledge this application is currently compliant with Jira's Terms of Service. However, this does not comprise legal advice nor is this respository necessarily up-to-date with Jira's latest Terms of Service. Furthermore, there may be ways in which this application could be utilized that unintentionally violates Jira's Terms of Service. Please ensure that any implementation of this application abides by the the laws applicable in your region and where relevant, Jira's Terms of Service. In utilizing, extending or redistributing this application you acknowledge all this and accept full responsibility.

> [!Note] 
> This Next.js web app is currently under development it is not fully documented. It still retains debug logging, and not all components have been refactored according the design chosen.


### **Pre-requisites**

1. Node.js must be installed on your device.

2. An active Jira account.


### **Dev Setup**

1. After downloading this repository navigate to the path `C:/../../Jira Ticket Editor/Jira Ticket Editor>`

2. Please setup a Jira OAuth 2.0 application via the [Jira Developer Console](https://developer.atlassian.com/console/myapps/)

3. Please add a file named `.env` containing the following information

```txt

ENVIRONMENT=development
CLOUD_ID=<your atlassian cloud ID>
CLIENT_ID=<your jira client id>
CLIENT_SECRET=<your jira client secret>

```

4. Before running please run the command:

```shell
npm install
```

5. To run the Next.js application please run the command:

```shell
npm run dev
```


### **Completed Features**

- Jira API Proxying

- OAuth 2.0 Login

- Logout

- Layouts (Navbar etc)

- Settings & Service Account Authorization (may need to be re-implemented in accordance with Jira's latest update to their security requirements).

- Searchable Project List

- Simplified Project Ticket List

- User's Assigned Ticket List

- Ticket creator

- Ticket Fields/Components:
  - Date Input
  - Date Time Input
  - Issue Type Input
  - Label(s) Input
  - Number Input
  - Single-Option Input
  - Multi-Option Input
  - Parent Issue Input
  - Priority Input
  - Rich Text (ADF) Input
  - Sentiment Input
  - (Un-formatted) Text Input
  - Sprint Input
  - Status Input
  - Team Input
  - Time Input
  - Multi-User Input
  - Single-User Input
  - Ticket worklogs
  - Ticket sub-tasks


### **Remaining Features**

- Ticket comments

- Ticket dependencies

### **Feature Preview(s)**

**Project Board**
![Project Board](Docs/Project%20Boards.PNG)

**User Ticket**
![User Ticket Board](Docs/User%20Tickets.PNG)

**Service Account Authorization**
![Service Account Authorization](Docs/Service%20Account%20Authorization%20v2.PNG)

**Partial Ticket Interface**
![Ticket Interface Part 1](Docs/Incomplete%20Ticket%20Interface%20Part%201.PNG)
![Ticket Interface Part 2](Docs/Incomplete%20Ticket%20Interface%20Part%202.PNG)
![Ticket Interface Part 3](Docs/Incomplete%20Ticket%20Interface%20Part%203.PNG)
![Ticket Interface Part 4](Docs/Incomplete%20Ticket%20Interface%20Part%204.PNG)