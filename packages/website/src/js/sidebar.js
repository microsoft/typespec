// @ts-check
document.addEventListener("DOMContentLoaded", () => {
  const sideButton = document.getElementById("small-device-button-sidebar");

  if (sideButton) {
    const targetId = sideButton.getAttribute("for");
    sideButton.addEventListener("click", (evt) => {
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) {
          if (target.style.display === "block") {
            target.style.display = "";
          } else {
            target.style.display = "block";
          }
        }
      }
    });
  }
});
