// Initialize EmailJS
emailjs.init("YOUR_EMAILJS_USER_ID"); // Replace with your EmailJS User ID

const form = document.getElementById("contact-form");
const statusMsg = document.getElementById("status-msg");

form.addEventListener("submit", function(event) {
  event.preventDefault();

  emailjs.sendForm("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", this) // Replace with your Service ID and Template ID
    .then(function() {
      statusMsg.style.color = "green";
      statusMsg.textContent = "Message sent successfully! We'll get back to you soon.";
      form.reset();
    }, function(error) {
      statusMsg.style.color = "red";
      statusMsg.textContent = "Oops! Something went wrong. Please try again.";
      console.error("FAILED...", error);
    });
});
