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

  const collapsibleMenuItems = document.getElementsByClassName("menu-item-collapsible");
  for (const item of collapsibleMenuItems) {
    item.addEventListener("click", (evt) => {
      /** @type any */
      const target = evt.target;
      const container = target.parentElement;
      if (container) {
        const collapsed = container.classList.toggle("collapsed");
        target.ariaExpanded = !collapsed;
      }
    });
  }
});
