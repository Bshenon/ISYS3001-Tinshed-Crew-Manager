# Tinshed Crew Manager

A local web prototype for volunteer records and crew rostering. No npm install or database is required.

## Requirements

- A modern browser
- Python 3 to serve the files locally
- Node.js 18 or newer to run the roster tests

## Run on Windows

In Command Prompt, change into the repository folder and run:

```cmd
py -m http.server 8000
```

Keep Command Prompt open. In the same browser, visit:

- http://localhost:8000/volunteers.html
- http://localhost:8000/roster.html

Add volunteers on the first page. On the roster page, add a demonstration performance if the production/performance feature has not yet been merged. Assign volunteers and check open roles. Browser localStorage saves the demo data on this computer for this browser origin. It is not a shared database, so each user's data is separate.

If port 8000 is busy, use `py -m http.server 8001` and change both URLs to port 8001. Data from port 8000 will not appear on port 8001.

## Test

```cmd
node --test roster.test.js
```

Six tests cover duplicate roles, moving an assignment into a conflict, capacity, inactive volunteers, matinee calls, and reopening a position after removal.

## Record format for integration

`volunteers` is an array with `{ id, name, phone, email, active }`.
`performances` is an array with `{ id, productionTitle, date, time, crewCall }`.
`crewCall` is an array of `{ role, count }` objects stored per performance.
`assignments` is an array with `{ id, performanceId, volunteerId, role, confirmed }`.

The roster page provides a temporary performance-entry form to test assignments before SCRUM-6 is merged. The performance developer should use the format above, or the team should adapt `roster.js` together when integrating.

## Current limitation

There is no login and localStorage is local to one browser. Use fictional test contact details. The demo is not suitable for live volunteer data or multi-user deployment.
