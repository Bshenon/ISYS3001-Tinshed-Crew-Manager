const productionForm = document.getElementById("productionForm");
const productionList = document.getElementById("productionList");
const message = document.getElementById("message");

const performanceSection = document.getElementById("performanceSection");
const performanceHeading = document.getElementById("performanceHeading");
const performanceForm = document.getElementById("performanceForm");
const performanceList = document.getElementById("performanceList");

// Load saved productions when the page opens
let productions = JSON.parse(localStorage.getItem("productions")) || [];

// The production whose performances are being shown
let selectedProductionId = null;

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
            ProductionLogic.getPerformanceType(performance.startTime);

        performanceDetails.appendChild(performanceText);

        performanceList.appendChild(performanceDetails);
    });
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
