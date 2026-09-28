const productionForm = document.getElementById("productionForm");
const productionList = document.getElementById("productionList");
const message = document.getElementById("message");

const performanceSection = document.getElementById("performanceSection");
const performanceHeading = document.getElementById("performanceHeading");
const performanceForm = document.getElementById("performanceForm");
const seasonForm = document.getElementById("seasonForm");
const performanceList = document.getElementById("performanceList");

// Load saved productions when the page opens
let productions = JSON.parse(localStorage.getItem("productions")) || [];

// The production whose performances are being shown, and the
// performance whose crew call is open for editing (if any)
let selectedProductionId = null;
let editingCrewCallId = null;

// Display saved productions immediately
displayProductions();

productionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = document.getElementById("title").value;

    try {
        const production = ProductionLogic.createProduction(title);

        productions.push(production);

        // Show the new production's performances straight away
        selectedProductionId = production.id;

        saveProductions();
        displayProductions();
        showMessage("Added " + production.title + ".", false);

        productionForm.reset();
    } catch (error) {
        showMessage(error.message, true);
    }
});

performanceForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const production = getSelectedProduction();
    const date = document.getElementById("performanceDate").value;
    const startTime = document.getElementById("performanceTime").value;

    try {
        ProductionLogic.addPerformance(production, date, startTime);

        saveProductions();
        displayProductions();
        showMessage("Added performance on " + formatDate(date) + " at " + formatTime(startTime) + ".", false);

        performanceForm.reset();
    } catch (error) {
        showMessage(error.message, true);
    }
});

// Adds the company's usual eight performances from the opening Friday
seasonForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const production = getSelectedProduction();
    const openingFriday = document.getElementById("openingFriday").value;

    try {
        const added = ProductionLogic.addStandardSeason(production, openingFriday);

        saveProductions();
        displayProductions();

        if (added.length === 0) {
            showMessage("All eight performances for that season already exist.", false);
        } else {
            showMessage("Added " + added.length + " performance(s). Existing performances were kept.", false);
        }

        seasonForm.reset();
    } catch (error) {
        showMessage(error.message, true);
    }
});

function getSelectedProduction() {
    return productions.find(function (production) {
        return production.id === selectedProductionId;
    });
}

function displayProductions() {
    productionList.innerHTML = "";

    if (productions.length === 0) {
        productionList.innerHTML = "<p>No productions added yet.</p>";
        displayPerformances();
        return;
    }

    productions.forEach(function (production) {

        const productionDetails = document.createElement("div");

        if (production.id === selectedProductionId) {
            productionDetails.className = "selected";
        }

        const productionText = document.createElement("span");

        productionText.textContent =
            production.title + " | " +
            production.performances.length + " performance(s)";

        const performancesButton = document.createElement("button");
        performancesButton.textContent = "Performances";

        performancesButton.addEventListener("click", function () {
            selectedProductionId = production.id;
            editingCrewCallId = null;

            displayProductions();
        });

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            editProduction(production);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            deleteProduction(production);
        });

        productionDetails.appendChild(productionText);
        productionDetails.appendChild(performancesButton);
        productionDetails.appendChild(editButton);
        productionDetails.appendChild(deleteButton);

        productionList.appendChild(productionDetails);
    });

    displayPerformances();
}

function displayPerformances() {
    const production = getSelectedProduction();

    if (!production) {
        performanceSection.hidden = true;
        return;
    }

    performanceSection.hidden = false;
    performanceHeading.textContent = "Performances - " + production.title;
    performanceList.innerHTML = "";

    if (production.performances.length === 0) {
        performanceList.innerHTML = "<p>No performances added yet.</p>";
        return;
    }

    // Always list performances in date and time order
    ProductionLogic.sortPerformances(production.performances).forEach(function (performance) {

        const performanceDetails = document.createElement("div");

        const performanceText = document.createElement("span");

        performanceText.textContent =
            formatDate(performance.date) + " | " +
            formatTime(performance.startTime) + " | " +
            ProductionLogic.getPerformanceType(performance.startTime) + " | " +
            ProductionLogic.countPositions(performance.crewCall) + " crew positions | " +
            "Crew call " + formatTime(ProductionLogic.getCallTime(performance.startTime, "Stage Manager")) +
            ", FOH call " + formatTime(ProductionLogic.getCallTime(performance.startTime, "Box Office"));

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            editPerformance(production, performance);
        });

        const crewCallButton = document.createElement("button");
        crewCallButton.textContent = "Crew Call";

        // Opens the editor, or closes it if it is already open
        crewCallButton.addEventListener("click", function () {
            editingCrewCallId = editingCrewCallId === performance.id ? null : performance.id;

            displayPerformances();
        });

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", function () {
            removePerformance(production, performance);
        });

        performanceDetails.appendChild(performanceText);
        performanceDetails.appendChild(editButton);
        performanceDetails.appendChild(crewCallButton);
        performanceDetails.appendChild(removeButton);

        // Short summary of who the performance needs, e.g. "Bar x2, Usher x2"
        const crewCallSummary = document.createElement("p");
        crewCallSummary.className = "hint";

        crewCallSummary.textContent = performance.crewCall
            .filter(function (position) {
                return position.count > 0;
            })
            .map(function (position) {
                return position.role + " x" + position.count;
            })
            .join(", ");

        performanceDetails.appendChild(crewCallSummary);

        if (performance.id === editingCrewCallId) {
            performanceDetails.appendChild(createCrewCallEditor(production, performance));
        }

        performanceList.appendChild(performanceDetails);
    });
}

// Builds the form for changing how many people each role needs
// at one performance. Other performances are not affected.
function createCrewCallEditor(production, performance) {

    const editor = document.createElement("div");
    editor.className = "crew-call-editor";

    const countInputs = {};

    ProductionLogic.ROLES.forEach(function (role) {

        const position = performance.crewCall.find(function (item) {
            return item.role === role;
        });

        const row = document.createElement("label");

        const roleText = document.createElement("span");
        roleText.textContent = role + " (call " +
            formatTime(ProductionLogic.getCallTime(performance.startTime, role)) + ")";

        const countInput = document.createElement("input");
        countInput.type = "number";
        countInput.min = "0";
        countInput.step = "1";
        countInput.value = position ? position.count : 0;

        countInputs[role] = countInput;

        row.appendChild(roleText);
        row.appendChild(countInput);
        editor.appendChild(row);
    });

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Crew Call";

    saveButton.addEventListener("click", function () {

        const crewCall = ProductionLogic.ROLES.map(function (role) {
            return { role: role, count: Number(countInputs[role].value) };
        });

        try {
            ProductionLogic.updateCrewCall(production, performance.id, crewCall);

            editingCrewCallId = null;

            saveProductions();
            displayProductions();
            showMessage("Crew call saved for " + formatDate(performance.date) + " at " + formatTime(performance.startTime) + ".", false);
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    // Fills the boxes with the usual evening or matinee call (not saved until Save)
    const standardButton = document.createElement("button");
    standardButton.textContent = "Use Standard Call";

    standardButton.addEventListener("click", function () {

        ProductionLogic.getDefaultCrewCall(performance.startTime).forEach(function (position) {
            countInputs[position.role].value = position.count;
        });
    });

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";

    cancelButton.addEventListener("click", function () {
        editingCrewCallId = null;

        displayPerformances();
    });

    editor.appendChild(saveButton);
    editor.appendChild(standardButton);
    editor.appendChild(cancelButton);

    return editor;
}

function editProduction(production) {

    const newTitle = prompt("Enter production title:", production.title);

    if (newTitle === null) {
        return;
    }

    try {
        ProductionLogic.updateProductionTitle(production, newTitle);

        saveProductions();
        displayProductions();
        showMessage("Production renamed to " + production.title + ".", false);
    } catch (error) {
        showMessage(error.message, true);
    }
}

function deleteProduction(production) {

    const confirmed = confirm("Delete " + production.title + " and all of its performances?");

    if (!confirmed) {
        return;
    }

    productions = ProductionLogic.removeProduction(productions, production.id);

    if (selectedProductionId === production.id) {
        selectedProductionId = null;
    }

    saveProductions();
    displayProductions();
    showMessage("Deleted " + production.title + ".", false);
}

function editPerformance(production, performance) {

    const newDate = prompt("Enter date (YYYY-MM-DD):", performance.date);

    if (newDate === null) {
        return;
    }

    const newTime = prompt("Enter start time (24-hour HH:MM):", performance.startTime);

    if (newTime === null) {
        return;
    }

    try {
        ProductionLogic.updatePerformance(production, performance.id, newDate.trim(), newTime.trim());

        saveProductions();
        displayProductions();
        showMessage("Performance moved to " + formatDate(performance.date) + " at " + formatTime(performance.startTime) +
            ". Its crew call was kept - use Crew Call to change it.", false);
    } catch (error) {
        showMessage(error.message, true);
    }
}

function removePerformance(production, performance) {

    const confirmed = confirm("Remove the performance on " +
        formatDate(performance.date) + " at " + formatTime(performance.startTime) + "?");

    if (!confirmed) {
        return;
    }

    ProductionLogic.removePerformance(production, performance.id);

    if (editingCrewCallId === performance.id) {
        editingCrewCallId = null;
    }

    saveProductions();
    displayProductions();
    showMessage("Performance removed. The other performances are unchanged.", false);
}

// "2026-09-04" -> "Fri, 4 Sept 2026"
function formatDate(date) {
    return new Date(date + "T00:00").toLocaleDateString("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// "19:30" -> "7:30 pm"
function formatTime(time) {
    const parts = time.split(":").map(Number);
    const suffix = parts[0] < 12 ? "am" : "pm";
    const hours = parts[0] % 12 === 0 ? 12 : parts[0] % 12;

    return hours + ":" + String(parts[1]).padStart(2, "0") + " " + suffix;
}

function showMessage(text, isError) {
    message.textContent = text;
    message.className = isError ? "error" : "success";
}

function saveProductions() {
    localStorage.setItem("productions", JSON.stringify(productions));
}
