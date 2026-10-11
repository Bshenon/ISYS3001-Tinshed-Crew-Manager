const test = require("node:test");
const assert = require("node:assert");

const ProductionLogic = require("../productions-logic.js");

// Returns how many people a crew call needs for one role
function countFor(crewCall, role) {
    return crewCall.find(function (position) {
        return position.role === role;
    }).count;
}

function listDatesAndTimes(performances) {
    return performances.map(function (performance) {
        return performance.date + " " + performance.startTime;
    });
}

// Productions

test("creates a production with a trimmed title and no performances", function () {
    const production = ProductionLogic.createProduction("  The Weather House  ");

    assert.strictEqual(production.title, "The Weather House");
    assert.deepStrictEqual(production.performances, []);
    assert.ok(production.id);
});

test("refuses a production with an empty title", function () {
    assert.throws(function () {
        ProductionLogic.createProduction("   ");
    }, /needs a title/);
});

test("renames a production", function () {
    const production = ProductionLogic.createProduction("Panto");

    ProductionLogic.updateProductionTitle(production, "Jack and the Beanstalk");

    assert.strictEqual(production.title, "Jack and the Beanstalk");
});

test("removing a production keeps the other productions", function () {
    const crackedPot = ProductionLogic.createProduction("The Cracked Pot");
    const saltOnTheWind = ProductionLogic.createProduction("Salt on the Wind");

    const remaining = ProductionLogic.removeProduction([crackedPot, saltOnTheWind], crackedPot.id);

    assert.deepStrictEqual(remaining, [saltOnTheWind]);
});

// Performances

test("adds a performance with a date and start time", function () {
    const production = ProductionLogic.createProduction("The Weather House");

    const performance = ProductionLogic.addPerformance(production, "2026-09-04", "19:30");

    assert.strictEqual(performance.date, "2026-09-04");
    assert.strictEqual(performance.startTime, "19:30");
    assert.strictEqual(performance.productionId, production.id);
    assert.strictEqual(production.performances.length, 1);
});

test("refuses an invalid date or start time", function () {
    const production = ProductionLogic.createProduction("The Weather House");

    assert.throws(function () {
        ProductionLogic.addPerformance(production, "2026-02-30", "19:30");
    }, /valid date/);

    assert.throws(function () {
        ProductionLogic.addPerformance(production, "2026-09-04", "24:15");
    }, /valid start time/);

    assert.strictEqual(production.performances.length, 0);
});

test("refuses two performances of one production at the same date and time", function () {
    const production = ProductionLogic.createProduction("The Weather House");

    ProductionLogic.addPerformance(production, "2026-09-04", "19:30");

    assert.throws(function () {
        ProductionLogic.addPerformance(production, "2026-09-04", "19:30");
    }, /already has a performance/);
});

test("lists performances in date and time order", function () {
    const production = ProductionLogic.createProduction("The Weather House");

    ProductionLogic.addPerformance(production, "2026-09-05", "19:30");
    ProductionLogic.addPerformance(production, "2026-09-04", "19:30");
    ProductionLogic.addPerformance(production, "2026-09-05", "14:00");

    const sorted = ProductionLogic.sortPerformances(production.performances);

    assert.deepStrictEqual(listDatesAndTimes(sorted), [
        "2026-09-04 19:30",
        "2026-09-05 14:00",
        "2026-09-05 19:30"
    ]);
});

test("changing one performance leaves the others unchanged", function () {
    const production = ProductionLogic.createProduction("The Weather House");
    const friday = ProductionLogic.addPerformance(production, "2026-09-04", "19:30");
    const saturday = ProductionLogic.addPerformance(production, "2026-09-05", "14:00");

    ProductionLogic.updatePerformance(production, friday.id, "2026-09-04", "20:00");

    assert.strictEqual(friday.startTime, "20:00");
    assert.strictEqual(saturday.date, "2026-09-05");
    assert.strictEqual(saturday.startTime, "14:00");
});

test("removing one performance leaves the others unchanged", function () {
    const production = ProductionLogic.createProduction("The Weather House");
    const friday = ProductionLogic.addPerformance(production, "2026-09-04", "19:30");
    const saturday = ProductionLogic.addPerformance(production, "2026-09-05", "14:00");

    ProductionLogic.removePerformance(production, friday.id);

    assert.deepStrictEqual(production.performances, [saturday]);
});

// Crew calls

test("an evening performance needs the full nine-person call", function () {
    const crewCall = ProductionLogic.getDefaultCrewCall("19:30");

    assert.strictEqual(countFor(crewCall, "Stage Manager"), 1);
    assert.strictEqual(countFor(crewCall, "Lighting Operator"), 1);
    assert.strictEqual(countFor(crewCall, "Sound Operator"), 1);
    assert.strictEqual(countFor(crewCall, "Front of House"), 1);
    assert.strictEqual(countFor(crewCall, "Box Office"), 1);
    assert.strictEqual(countFor(crewCall, "Bar"), 2);
    assert.strictEqual(countFor(crewCall, "Usher"), 2);
    assert.strictEqual(ProductionLogic.countPositions(crewCall), 9);
});

test("a matinee has no bar", function () {
    const crewCall = ProductionLogic.getDefaultCrewCall("14:00");

    assert.strictEqual(countFor(crewCall, "Bar"), 0);
    assert.strictEqual(ProductionLogic.countPositions(crewCall), 7);
});

test("each performance keeps its own crew call", function () {
    const production = ProductionLogic.createProduction("The Weather House");
    const friday = ProductionLogic.addPerformance(production, "2026-09-04", "19:30");
    const saturday = ProductionLogic.addPerformance(production, "2026-09-05", "19:30");

    const extraUsher = ProductionLogic.getDefaultCrewCall("19:30");
    extraUsher.find(function (position) {
        return position.role === "Usher";
    }).count = 3;

    ProductionLogic.updateCrewCall(production, friday.id, extraUsher);

    assert.strictEqual(countFor(friday.crewCall, "Usher"), 3);
    assert.strictEqual(countFor(saturday.crewCall, "Usher"), 2);
});

test("refuses a crew call with fewer than two ushers (fire order)", function () {
    const production = ProductionLogic.createProduction("The Weather House");
    const friday = ProductionLogic.addPerformance(production, "2026-09-04", "19:30");

    const oneUsher = ProductionLogic.getDefaultCrewCall("19:30");
    oneUsher.find(function (position) {
        return position.role === "Usher";
    }).count = 1;

    assert.throws(function () {
        ProductionLogic.updateCrewCall(production, friday.id, oneUsher);
    }, /ushers/);

    assert.strictEqual(countFor(friday.crewCall, "Usher"), 2);
});

test("refuses negative or part-person counts in a crew call", function () {
    const crewCall = ProductionLogic.getDefaultCrewCall("19:30");
    crewCall[0].count = -1;
    crewCall[1].count = 1.5;

    assert.strictEqual(ProductionLogic.validateCrewCall(crewCall).length, 2);
});

test("crew are called 60 minutes before curtain, front of house 45 minutes", function () {
    assert.strictEqual(ProductionLogic.getCallTime("19:30", "Stage Manager"), "18:30");
    assert.strictEqual(ProductionLogic.getCallTime("19:30", "Box Office"), "18:45");
    assert.strictEqual(ProductionLogic.getCallTime("14:00", "Sound Operator"), "13:00");
    assert.strictEqual(ProductionLogic.getCallTime("14:00", "Usher"), "13:15");
});

// Standard season

test("the standard season is eight performances over two weekends", function () {
    const production = ProductionLogic.createProduction("The Weather House");

    ProductionLogic.addStandardSeason(production, "2026-09-04");

    assert.deepStrictEqual(listDatesAndTimes(ProductionLogic.sortPerformances(production.performances)), [
        "2026-09-04 19:30",
        "2026-09-05 14:00",
        "2026-09-05 19:30",
        "2026-09-06 14:00",
        "2026-09-11 19:30",
        "2026-09-12 14:00",
        "2026-09-12 19:30",
        "2026-09-13 14:00"
    ]);
});

test("the standard season must open on a Friday", function () {
    const production = ProductionLogic.createProduction("The Weather House");

    assert.throws(function () {
        ProductionLogic.addStandardSeason(production, "2026-09-05");
    }, /Friday/);
});

test("the standard season skips performances that already exist", function () {
    const production = ProductionLogic.createProduction("The Weather House");
    ProductionLogic.addPerformance(production, "2026-09-04", "19:30");

    const added = ProductionLogic.addStandardSeason(production, "2026-09-04");

    assert.strictEqual(added.length, 7);
    assert.strictEqual(production.performances.length, 8);
});

// Lookup used by crew assignments

test("finds a performance by id across all productions", function () {
    const crackedPot = ProductionLogic.createProduction("The Cracked Pot");
    const saltOnTheWind = ProductionLogic.createProduction("Salt on the Wind");
    const performance = ProductionLogic.addPerformance(saltOnTheWind, "2026-05-15", "19:30");

    const found = ProductionLogic.findPerformance([crackedPot, saltOnTheWind], performance.id);

    assert.strictEqual(found.production, saltOnTheWind);
    assert.strictEqual(found.performance, performance);
    assert.strictEqual(ProductionLogic.findPerformance([crackedPot, saltOnTheWind], "missing"), null);
});

// Working with the crew roster (SCRUM-7)

test("uses the same role names as the crew roster", function () {
    const RosterRules = require("../roster.js");

    const rosterRoles = RosterRules.crewCall("evening").map(function (position) {
        return position.role;
    });

    ProductionLogic.ROLES.forEach(function (role) {
        assert.ok(rosterRoles.includes(role), role + " is not a roster role");
    });
});

test("renames the old 'Front of House Manager' role in saved data", function () {
    const production = ProductionLogic.createProduction("The Weather House");
    const friday = ProductionLogic.addPerformance(production, "2026-09-04", "19:30");
    friday.crewCall.find(function (position) {
        return position.role === "Front of House";
    }).role = "Front of House Manager";

    assert.strictEqual(ProductionLogic.renameOldRoles([production]), true);
    assert.strictEqual(countFor(friday.crewCall, "Front of House"), 1);
    assert.strictEqual(ProductionLogic.renameOldRoles([production]), false);
});

test("shares performances with the roster in the roster's format", function () {
    const production = ProductionLogic.createProduction("The Weather House");
    const friday = ProductionLogic.addPerformance(production, "2026-09-04", "19:30");

    const shared = ProductionLogic.toRosterPerformances([production], []);

    assert.strictEqual(shared.length, 1);
    assert.strictEqual(shared[0].id, friday.id);
    assert.strictEqual(shared[0].productionId, production.id);
    assert.strictEqual(shared[0].productionTitle, "The Weather House");
    assert.strictEqual(shared[0].date, "2026-09-04");
    assert.strictEqual(shared[0].time, "19:30");
    assert.strictEqual(ProductionLogic.countPositions(shared[0].crewCall), 9);
});

test("leaves out roles that need nobody, e.g. the bar at a matinee", function () {
    const production = ProductionLogic.createProduction("The Weather House");
    ProductionLogic.addPerformance(production, "2026-09-05", "14:00");

    const shared = ProductionLogic.toRosterPerformances([production], []);

    assert.strictEqual(shared[0].crewCall.some(function (position) {
        return position.role === "Bar";
    }), false);
});

test("keeps roster test performances and drops removed performances", function () {
    const production = ProductionLogic.createProduction("The Weather House");
    const friday = ProductionLogic.addPerformance(production, "2026-09-04", "19:30");
    const saturday = ProductionLogic.addPerformance(production, "2026-09-05", "19:30");
    const rosterTest = { id: "demo-1", productionTitle: "Demo", date: "2026-10-01", time: "19:30", crewCall: [] };

    let shared = ProductionLogic.toRosterPerformances([production], [rosterTest]);
    assert.strictEqual(shared.length, 3);

    ProductionLogic.removePerformance(production, friday.id);
    shared = ProductionLogic.toRosterPerformances([production], shared);

    assert.deepStrictEqual(shared.map(function (performance) {
        return performance.id;
    }), ["demo-1", saturday.id]);
});

test("the roster refuses a second role in a performance from the productions page", function () {
    const RosterRules = require("../roster.js");
    const production = ProductionLogic.createProduction("The Weather House");
    ProductionLogic.addPerformance(production, "2026-09-04", "19:30");
    const performance = ProductionLogic.toRosterPerformances([production], [])[0];

    const volunteers = [{ id: "v1", name: "Vera Sokolova", active: true }];
    const boxOffice = { id: "a1", performanceId: performance.id, volunteerId: "v1", role: "Box Office" };

    assert.strictEqual(RosterRules.check(boxOffice, [], performance, volunteers), null);
    assert.match(RosterRules.check({ performanceId: performance.id, volunteerId: "v1", role: "Bar" },
        [boxOffice], performance, volunteers), /already has a role/);
});

test("finds and removes the crew assignments of removed performances only", function () {
    const assignments = [
        { id: "a1", performanceId: "perf-1", volunteerId: "v1", role: "Box Office" },
        { id: "a2", performanceId: "perf-1", volunteerId: "v2", role: "Usher" },
        { id: "a3", performanceId: "perf-2", volunteerId: "v1", role: "Bar" }
    ];

    assert.strictEqual(ProductionLogic.findAssignmentsFor(assignments, ["perf-1"]).length, 2);

    const remaining = ProductionLogic.removeAssignmentsFor(assignments, ["perf-1"]);

    assert.deepStrictEqual(remaining.map(function (assignment) {
        return assignment.id;
    }), ["a3"]);
    assert.deepStrictEqual(ProductionLogic.removeAssignmentsFor(null, ["perf-1"]), []);
});
