const volunteerForm = document.getElementById("volunteerForm");
const volunteerList = document.getElementById("volunteerList");

let volunteers = [];

volunteerForm.addEventListener("submit", function(event) {
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

    displayVolunteers();

    volunteerForm.reset();
});

function displayVolunteers() {
    volunteerList.innerHTML = "";

    volunteers.forEach(function(volunteer) {
        const volunteerDetails = document.createElement("p");

        volunteerDetails.textContent =
            volunteer.name + " | " +
            volunteer.phone + " | " +
            volunteer.email + " | Active";

        volunteerList.appendChild(volunteerDetails);
    });
}