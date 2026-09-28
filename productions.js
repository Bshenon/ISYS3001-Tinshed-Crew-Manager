const productionForm = document.getElementById("productionForm");
const productionList = document.getElementById("productionList");
const message = document.getElementById("message");

// Load saved productions when the page opens
let productions = JSON.parse(localStorage.getItem("productions")) || [];

// Display saved productions immediately
displayProductions();

productionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = document.getElementById("title").value;

    try {
        const production = ProductionLogic.createProduction(title);

        productions.push(production);

        saveProductions();
        displayProductions();
        showMessage("Added " + production.title + ".", false);

        productionForm.reset();
    } catch (error) {
        showMessage(error.message, true);
    }
});

function displayProductions() {
    productionList.innerHTML = "";

    if (productions.length === 0) {
        productionList.innerHTML = "<p>No productions added yet.</p>";
        return;
    }

    productions.forEach(function (production) {

        const productionDetails = document.createElement("div");

        const productionText = document.createElement("span");

        productionText.textContent =
            production.title + " | " +
            production.performances.length + " performance(s)";

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
        productionDetails.appendChild(editButton);
        productionDetails.appendChild(deleteButton);

        productionList.appendChild(productionDetails);
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

    saveProductions();
    displayProductions();
    showMessage("Deleted " + production.title + ".", false);
}

function showMessage(text, isError) {
    message.textContent = text;
    message.className = isError ? "error" : "success";
}

function saveProductions() {
    localStorage.setItem("productions", JSON.stringify(productions));
}
