# Changelog

All notable changes to the Tinshed Crew Manager are recorded here.

## [Unreleased]

### Added
- SCRUM-6: production management page - add, rename and delete productions.
- SCRUM-6: add, edit and remove performances with a date and start time,
  listed in date and time order. A second performance at the same date and
  time is refused.
- SCRUM-6: standard eight-performance season from the opening Friday.
- SCRUM-6: crew call recorded per performance (evening and matinee defaults),
  with a crew call editor, a two-usher minimum and crew / front of house call
  times.
- SCRUM-6: automated tests for productions and performances; `npm test` runs
  every test in the repository.
- Navigation between the Volunteers and Productions pages.
- README: productions page, macOS/Linux run steps, tests and data format.
- SCRUM-6: productions are shared with the crew roster - performances made on
  the productions page can be rostered.
- Deleting a production or performance also removes its crew assignments,
  after warning how many there are.
- Crew Roster link on every page.

### Changed
- The front of house role is now called "Front of House" on every page
  (was "Front of House Manager" on the productions page). Saved data is
  updated automatically.

## SCRUM-7 - crew roster (PR #5)

### Added
- Crew roster page: assign volunteers to roles for a performance, see open
  positions, and refuse a second role in the same performance.
- Roster tests (`roster.test.js`).

## SCRUM-5 - volunteer management (PRs #1 to #3)

### Added
- Volunteer management: add, search, edit and make volunteers active or
  inactive, saved between sessions.
- Permanent volunteer IDs.
