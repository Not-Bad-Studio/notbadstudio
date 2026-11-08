// Sends any Netlify form on the page without leaving it, then shows the form's own
// "Thank you" or "Oops" message. If this script doesn't load, the form still posts
// to "/" and Netlify shows its standard thank-you page instead.
// Netlify strips data-netlify when it deploys, so a form is recognised by the hidden
// form-name field that every Netlify form carries.
document.addEventListener("submit", function (event) {
  var form = event.target;
  if (!form.querySelector || !form.querySelector('input[name="form-name"]')) return;
  event.preventDefault();

  var wrapper = form.closest(".w-form");
  var done = wrapper && wrapper.querySelector(".w-form-done");
  var fail = wrapper && wrapper.querySelector(".w-form-fail");
  var button = form.querySelector('[type="submit"]');
  var label = button && button.value;

  if (button) {
    button.disabled = true;
    if (button.getAttribute("data-wait")) button.value = button.getAttribute("data-wait");
  }
  if (fail) fail.style.display = "none";

  fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(new FormData(form)).toString(),
  })
    .then(function (response) {
      if (!response.ok) throw new Error("Form post failed with status " + response.status);
      form.style.display = "none";
      if (done) done.style.display = "block";
    })
    .catch(function (error) {
      console.error(error);
      if (fail) fail.style.display = "block";
    })
    .finally(function () {
      if (button) {
        button.disabled = false;
        button.value = label;
      }
    });
});
