(function() {
  const WINDOW_CONTENTS = window.location.href.split("/");
  const PICKER_DIV = document.getElementById("versionPickerDiv");
  const PICKER_ELEMENT = document.getElementById("versionPicker");

  function currentVersion() {
    if (WINDOW_CONTENTS.includes("$web") && WINDOW_CONTENTS.length > 6) {
      return WINDOW_CONTENTS[6];
    } else if (WINDOW_CONTENTS.includes("docGen")) {
      return WINDOW_CONTENTS[WINDOW_CONTENTS.indexOf("docGen") + 2];
    } else {
      return "";
    }
  }

  function currentPackage() {
    if (WINDOW_CONTENTS.includes("$web") && WINDOW_CONTENTS.length > 5) {
      return WINDOW_CONTENTS[5];
    } else if (WINDOW_CONTENTS.includes("docGen")) {
      return WINDOW_CONTENTS[WINDOW_CONTENTS.indexOf("docGen") + 1];
    } else {
      return "";
    }
  }

  async function populateOptions() {
    if (!PICKER_DIV || !PICKER_ELEMENT) {
      console.error("Couldn't find DOM to attach to")
      return;
    }
    
    if (!currentPackage()) {
      // don't bother to load when opened locally
      console.error("Couldn't detect package information from URL");
      PICKER_DIV.hidden = true;
      return;
    }

    const versionRequestUrl =
      `https://azuresdkdocs.blob.core.windows.net/$web/javascript/${currentPackage()}/versioning/versions`;
    const result = await fetch(versionRequestUrl);
    
    if (!result.ok) {
      console.error("Failed to load versions", result.statusText);
      PICKER_DIV.hidden = true;
    }

    const text = await result.text();
    const versions = text.match(/[^\r\n]+/g);
    if (!versions) {
      console.error("Failed to parse version list", result.statusText);
      PICKER_DIV.hidden = true;
    }
    updateSelectElement(versions);
    PICKER_ELEMENT.addEventListener("change", (ev) => {
      const targetVersion = ev.target.value;
      const url = WINDOW_CONTENTS.slice();
      const versionIndex = url.indexOf(currentVersion());
      url[versionIndex] = targetVersion;
      window.location.href = url.join("/");
    });
  }

  function updateSelectElement(versions) {
    PICKER_ELEMENT.innerHTML = "";
    for (const version of versions) {
      const option = document.createElement("option");
      option.value = version;
      option.text = version;
      PICKER_ELEMENT.appendChild(option);
    }
    const versionToSelect = currentVersion();
    if (versionToSelect === "latest") {
      PICKER_ELEMENT.selectedIndex = 0;
    } else {
      PICKER_ELEMENT.value = versionToSelect;
    }

  }

  populateOptions().catch(e => { console.error("Error loading options", e);});
})();
