const volunteerForm = document.getElementById("volunteerForm");
const volunteerList = document.getElementById("volunteerList");

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const showAllButton = document.getElementById("showAllButton");

let volunteers = [];

volunteerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;

    const volunteer = {
        name: name,
        phone: phone,
        email: email,
        active: true
    };

    volunteers.push(volunteer);

    displayVolunteers(volunteers);

    volunteerForm.reset();
});

function displayVolunteers(volunteersToDisplay) {
    volunteerList.innerHTML = "";

    if (volunteersToDisplay.length === 0) {
        volunteerList.innerHTML = "<p>No volunteers found.</p>";
        return;
    }

    volunteersToDisplay.forEach(function (volunteer) {

        const volunteerDetails = document.createElement("div");

        const volunteerText = document.createElement("span");

        volunteerText.textContent =
            volunteer.name + " | " +
            volunteer.phone + " | " +
            volunteer.email + " | " +
            (volunteer.active ? "Active" : "Inactive");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            editVolunteer(volunteer);
        });

        const statusButton = document.createElement("button");

        if (volunteer.active) {
            statusButton.textContent = "Make Inactive";
        } else {
            statusButton.textContent = "Make Active";
        }

        statusButton.addEventListener("click", function () {
            volunteer.active = !volunteer.active;
            displayVolunteers(volunteers);
        });

        volunteerDetails.appendChild(volunteerText);
        volunteerDetails.appendChild(editButton);
        volunteerDetails.appendChild(statusButton);

        volunteerList.appendChild(volunteerDetails);
    });
}

function editVolunteer(volunteer) {

    const newName = prompt("Enter volunteer name:", volunteer.name);

    if (newName === null) {
        return;
    }

    const newPhone = prompt("Enter phone number:", volunteer.phone);

    if (newPhone === null) {
        return;
    }

    const newEmail = prompt("Enter email:", volunteer.email);

    if (newEmail === null) {
        return;
    }

    volunteer.name = newName;
    volunteer.phone = newPhone;
    volunteer.email = newEmail;

    displayVolunteers(volunteers);
}

searchButton.addEventListener("click", function () {

    const searchText = searchInput.value.toLowerCase();

    const searchResults = volunteers.filter(function (volunteer) {
        return volunteer.name.toLowerCase().includes(searchText);
    });

    displayVolunteers(searchResults);
});

showAllButton.addEventListener("click", function () {
    searchInput.value = "";
    displayVolunteers(volunteers);
});