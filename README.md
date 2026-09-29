# Tinshed Crew Manager

A local web prototype for volunteer records, show scheduling and crew rostering for The Tinshed Players. No npm install or database is required.

## Features

| Story | Page | What it does |
|---|---|---|
| SCRUM-5 | `volunteers.html` | Add, search, edit and make volunteers active or inactive |
| SCRUM-6 | `productions.html` | Add, rename and delete productions; add, edit and remove performances (listed in date and time order); add the standard eight-performance season; edit the crew call for each performance and see call times |
| SCRUM-7 | `roster.html` | Assign volunteers to roles for a performance, see open positions, one role per performance |

## Requirements

- A modern browser
- Python 3 to serve the files locally
- Node.js 18 or newer to run the tests

## Run on Windows

In Command Prompt, change into the repository folder and run:

```cmd
py -m http.server 8000
```

Keep Command Prompt open. In the same browser, visit:

- http://localhost:8000/volunteers.html
- http://localhost:8000/productions.html
- http://localhost:8000/roster.html

Add volunteers on the first page and productions with their performances on the second. The roster page lists those performances automatically; assign volunteers and check open roles. The roster page also has a form for a demonstration performance for testing. Browser localStorage saves the demo data on this computer for this browser origin. It is not a shared database, so each user's data is separate.

If port 8000 is busy, use `py -m http.server 8001` and change both URLs to port 8001. Data from port 8000 will not appear on port 8001.

## Run on macOS or Linux

In Terminal, change into the repository folder and run:

```
python3 -m http.server 8000
```

Then visit the same addresses as above.

## Using the productions page

1. Open `productions.html` and add a production, e.g. "The Weather House".
2. The production's performances appear below. Add a performance with a date and start time, or enter the opening Friday and click **Add Standard Season** to add the usual eight performances (Fri 7:30 pm, Sat 2:00 pm, Sat 7:30 pm and Sun 2:00 pm over two weekends).
3. Click **Crew Call** on a performance to change how many people each role needs for that performance only.
4. Open **Crew Roster** to assign volunteers to the performance. Deleting a production or removing a performance asks first and also removes any crew assignments on it.

## Test

Run every test in the repository:

```
npm test
```

or run one file:

```cmd
node --test roster.test.js
node --test tests/productions.test.js
```

`roster.test.js` has six tests covering duplicate roles, moving an assignment into a conflict, capacity, inactive volunteers, matinee calls, and reopening a position after removal.

`tests/productions.test.js` has twenty-seven tests covering creating, renaming and removing productions; adding, editing, removing and ordering performances; refusing duplicate dates and times; evening and matinee crew calls; the two-usher minimum; call times; the standard season; and working with the roster (shared performances, matching role names, the one-role-per-performance rule and removing assignments of deleted performances).

## Record format for integration

`volunteers` is an array with `{ id, name, phone, email, active }`.
`performances` is an array with `{ id, productionTitle, date, time, crewCall }`.
`crewCall` is an array of `{ role, count }` objects stored per performance.
`assignments` is an array with `{ id, performanceId, volunteerId, role, confirmed }`.

The productions page writes its performances into `performances` in this format (with an extra `productionId`), so the roster can use them. Performances added on the roster's demonstration form have no `productionId` and are kept.

### Productions (SCRUM-6)

The productions page saves to `productions`, an array of:

```
{
  id: "prod-...",
  title: "The Weather House",
  performances: [
    {
      id: "perf-...",
      productionId: "prod-...",
      date: "2026-09-04",      // YYYY-MM-DD
      startTime: "19:30",      // 24-hour HH:MM
      crewCall: [ { role: "Stage Manager", count: 1 }, ... ]
    }
  ]
}
```

Role names are the same on both pages: Stage Manager, Lighting Operator, Sound Operator, Front of House, Box Office, Bar and Usher. Roles that need nobody (e.g. the bar at a matinee) are not sent to the roster.

The rules for productions, performances and crew calls are in `productions-logic.js`, which is used by the page and by the tests. `ProductionLogic.findPerformance(productions, performanceId)` finds a performance and its production from an id.

## Assumptions (SCRUM-6)

- A performance starting before 5:00 pm is a matinee; later is an evening performance.
- The standard evening call is 1 stage manager, 1 lighting operator, 1 sound operator, 1 front of house, 1 box office, 2 bar and 2 ushers. A matinee is the same without the bar, which does not open.
- Stage and technical crew are called 60 minutes before curtain. Front of house, box office, bar and ushers are called 45 minutes before.
- Every performance needs at least two ushers (fire order), so a crew call with fewer is refused.
- Changing a performance's date or time keeps its crew call, because the call may have been adjusted for that show.

## Current limitation

There is no login and localStorage is local to one browser. Use fictional test contact details. The demo is not suitable for live volunteer data or multi-user deployment.

Performances are shared with the roster when the productions page saves or is opened. If performances are changed on the productions page while the roster is open in another tab, the roster updates automatically; in the same tab, reopen the roster page.
