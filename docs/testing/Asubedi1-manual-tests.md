# SCRUM-7 Manual Integration Test Results

Tester: Aagaman Subedi (Asubedi1)
Application: Tinshed Crew Manager
Environment: Windows, local Python server, http://localhost:8000
Code revision: See Asubedi1-tested-commit.txt
Test data: Fictional volunteer and production records

| ID | Date | Test | Expected result | Actual result | Status |
|---|---|---|---|---|---|
| MT-01 | 2026-10-09 | Save a crew call with one usher | Refuse the change and retain two ushers | Change refused; two ushers retained | Pass |
| MT-02 | 2026-10-09 | Assign the same volunteer a second role in one performance | Refuse the second assignment | Second role refused | Pass |
| MT-03 | 2026-10-10 | Find a performance created on Productions in Crew Roster | Performance appears in the dropdown | Performance appeared | Pass |
| MT-04 | 2026-10-10 | Assign the volunteer to a different performance | Allow the assignment | Assignment succeeded | Pass |
| MT-05 | 2026-10-10 | Refresh the roster after saving assignments | Saved assignments remain | Assignments remained | Pass |

## Automated testing

All 33 automated tests passed on 10 October 2026.
Full output is recorded in Asubedi1-automated-tests.txt.

## Limitations

These checks cover the local prototype. Browser localStorage does not provide shared multi-user storage. Authentication and hosted deployment were not tested.