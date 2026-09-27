// Production and performance rules for the Tinshed Crew Manager.
// This file has no page code in it so it can be used by productions.js
// in the browser and by the automated tests in Node.

(function (root) {

    // Roles in the order they appear on the company's crew call sheet
    const ROLES = [
        "Stage Manager",
        "Lighting Operator",
        "Sound Operator",
        "Front of House Manager",
        "Box Office",
        "Bar",
        "Usher"
    ];

    // Front of house and box office are called 45 minutes before curtain,
    // everyone else 60 minutes before (Crew Call Sheet, The Weather House)
    const FRONT_OF_HOUSE_ROLES = ["Front of House Manager", "Box Office", "Bar", "Usher"];

    // Fire order: two ushers minimum at every performance
    const MINIMUM_USHERS = 2;

    // Performances starting at or after 5pm are evening shows
    const EVENING_START = "17:00";

    // Standard pattern from the Season Plan: Fri 7:30pm, Sat 2pm, Sat 7:30pm,
    // Sun 2pm, over two consecutive weekends (offsets are days from the Friday)
    const STANDARD_PATTERN = [
        { dayOffset: 0, startTime: "19:30" },
        { dayOffset: 1, startTime: "14:00" },
        { dayOffset: 1, startTime: "19:30" },
        { dayOffset: 2, startTime: "14:00" },
        { dayOffset: 7, startTime: "19:30" },
        { dayOffset: 8, startTime: "14:00" },
        { dayOffset: 8, startTime: "19:30" },
        { dayOffset: 9, startTime: "14:00" }
    ];

    function generateId(prefix) {
        return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    }

    function isValidDate(date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return false;
        }

        const parts = date.split("-").map(Number);
        const check = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));

        return check.getUTCFullYear() === parts[0] &&
            check.getUTCMonth() === parts[1] - 1 &&
            check.getUTCDate() === parts[2];
    }

    function isValidTime(time) {
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
    }

    function isMatinee(startTime) {
        return startTime < EVENING_START;
    }

    function getPerformanceType(startTime) {
        return isMatinee(startTime) ? "Matinee" : "Evening";
    }

    // Evening: SM, lighting, sound, FOH manager, box office, 2 bar, 2 ushers.
    // Matinee: the same call without the bar, which does not open.
    function getDefaultCrewCall(startTime) {
        return ROLES.map(function (role) {
            let count = 1;

            if (role === "Bar") {
                count = isMatinee(startTime) ? 0 : 2;
            }

            if (role === "Usher") {
                count = MINIMUM_USHERS;
            }

            return { role: role, count: count };
        });
    }

    function validateCrewCall(crewCall) {
        const errors = [];

        if (!Array.isArray(crewCall)) {
            return ["Crew call must be a list of roles."];
        }

        crewCall.forEach(function (position) {
            if (!ROLES.includes(position.role)) {
                errors.push("Unknown role: " + position.role + ".");
            }

            if (!Number.isInteger(position.count) || position.count < 0) {
                errors.push(position.role + " must need a whole number of people (0 or more).");
            }
        });

        const ushers = crewCall.find(function (position) {
            return position.role === "Usher";
        });

        if (!ushers || ushers.count < MINIMUM_USHERS) {
            errors.push("At least " + MINIMUM_USHERS + " ushers are required at every performance (fire order).");
        }

        return errors;
    }

    function countPositions(crewCall) {
        return crewCall.reduce(function (total, position) {
            return total + position.count;
        }, 0);
    }

    // Returns the time a role must arrive, e.g. "18:30" for crew at a 7:30pm show
    function getCallTime(startTime, role) {
        const minutesBefore = FRONT_OF_HOUSE_ROLES.includes(role) ? 45 : 60;
        const parts = startTime.split(":").map(Number);
        const total = parts[0] * 60 + parts[1] - minutesBefore;
        const hours = Math.floor(total / 60);
        const minutes = total % 60;

        return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
    }

    function sortPerformances(performances) {
        return performances.slice().sort(function (a, b) {
            if (a.date !== b.date) {
                return a.date < b.date ? -1 : 1;
            }

            if (a.startTime !== b.startTime) {
                return a.startTime < b.startTime ? -1 : 1;
            }

            return 0;
        });
    }

    function cleanTitle(title) {
        const cleaned = (title || "").trim();

        if (cleaned === "") {
            throw new Error("A production needs a title.");
        }

        return cleaned;
    }

    function createProduction(title) {
        return {
            id: generateId("prod"),
            title: cleanTitle(title),
            performances: []
        };
    }

    function updateProductionTitle(production, title) {
        production.title = cleanTitle(title);
        return production;
    }

    function removeProduction(productions, productionId) {
        return productions.filter(function (production) {
            return production.id !== productionId;
        });
    }

    function checkPerformanceDetails(production, date, startTime, ignoreId) {
        if (!isValidDate(date)) {
            throw new Error("Enter a valid date.");
        }

        if (!isValidTime(startTime)) {
            throw new Error("Enter a valid start time.");
        }

        const clash = production.performances.some(function (performance) {
            return performance.id !== ignoreId &&
                performance.date === date &&
                performance.startTime === startTime;
        });

        if (clash) {
            throw new Error("This production already has a performance on " + date + " at " + startTime + ".");
        }
    }

    function addPerformance(production, date, startTime, crewCall) {
        checkPerformanceDetails(production, date, startTime, null);

        const call = crewCall || getDefaultCrewCall(startTime);
        const errors = validateCrewCall(call);

        if (errors.length > 0) {
            throw new Error(errors.join(" "));
        }

        const performance = {
            id: generateId("perf"),
            productionId: production.id,
            date: date,
            startTime: startTime,
            crewCall: call
        };

        production.performances.push(performance);

        return performance;
    }

    function findPerformanceIn(production, performanceId) {
        const performance = production.performances.find(function (item) {
            return item.id === performanceId;
        });

        if (!performance) {
            throw new Error("Performance not found.");
        }

        return performance;
    }

    // Changing the date or time keeps the performance's crew call as it is,
    // because the call may have been adjusted for that show.
    function updatePerformance(production, performanceId, date, startTime) {
        const performance = findPerformanceIn(production, performanceId);

        checkPerformanceDetails(production, date, startTime, performanceId);

        performance.date = date;
        performance.startTime = startTime;

        return performance;
    }

    function updateCrewCall(production, performanceId, crewCall) {
        const performance = findPerformanceIn(production, performanceId);
        const errors = validateCrewCall(crewCall);

        if (errors.length > 0) {
            throw new Error(errors.join(" "));
        }

        performance.crewCall = crewCall;

        return performance;
    }

    function removePerformance(production, performanceId) {
        findPerformanceIn(production, performanceId);

        production.performances = production.performances.filter(function (performance) {
            return performance.id !== performanceId;
        });

        return production;
    }

    function addDays(date, days) {
        const parts = date.split("-").map(Number);
        const result = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));

        return result.toISOString().slice(0, 10);
    }

    function getDayOfWeek(date) {
        const parts = date.split("-").map(Number);
        return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).getUTCDay();
    }

    // Adds the eight standard performances starting from the opening Friday.
    // Any performance that already exists at the same date and time is skipped.
    function addStandardSeason(production, openingFriday) {
        if (!isValidDate(openingFriday)) {
            throw new Error("Enter a valid opening date.");
        }

        if (getDayOfWeek(openingFriday) !== 5) {
            throw new Error("The standard season opens on a Friday.");
        }

        const added = [];

        STANDARD_PATTERN.forEach(function (slot) {
            const date = addDays(openingFriday, slot.dayOffset);

            const exists = production.performances.some(function (performance) {
                return performance.date === date && performance.startTime === slot.startTime;
            });

            if (!exists) {
                added.push(addPerformance(production, date, slot.startTime));
            }
        });

        return added;
    }

    // Lets other parts of the system (e.g. crew assignments) look up a
    // performance by id without knowing which production it belongs to
    function findPerformance(productions, performanceId) {
        for (const production of productions) {
            const performance = production.performances.find(function (item) {
                return item.id === performanceId;
            });

            if (performance) {
                return { production: production, performance: performance };
            }
        }

        return null;
    }

    const ProductionLogic = {
        ROLES: ROLES,
        MINIMUM_USHERS: MINIMUM_USHERS,
        isValidDate: isValidDate,
        isValidTime: isValidTime,
        isMatinee: isMatinee,
        getPerformanceType: getPerformanceType,
        getDefaultCrewCall: getDefaultCrewCall,
        validateCrewCall: validateCrewCall,
        countPositions: countPositions,
        getCallTime: getCallTime,
        sortPerformances: sortPerformances,
        createProduction: createProduction,
        updateProductionTitle: updateProductionTitle,
        removeProduction: removeProduction,
        addPerformance: addPerformance,
        updatePerformance: updatePerformance,
        updateCrewCall: updateCrewCall,
        removePerformance: removePerformance,
        addStandardSeason: addStandardSeason,
        findPerformance: findPerformance
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = ProductionLogic;
    } else {
        root.ProductionLogic = ProductionLogic;
    }

})(this);
