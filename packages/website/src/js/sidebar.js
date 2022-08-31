// @ts-check
document.addEventListener("DOMContentLoaded", () => {
  const sideButton = document.getElementById("small-device-button-sidebar");

  console.log("Side", sideButton);
  if (sideButton) {
    const targetId = sideButton.getAttribute("for");
    sideButton.addEventListener("click", (evt) => {
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) {
          console.log("Click2", target);
          if (target.style.display === "block") {
            target.style.display = "none";
          } else {
            target.style.display = "block";
          }
        }
      }
    });
  }
});
