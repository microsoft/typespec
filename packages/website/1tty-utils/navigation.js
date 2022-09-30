// @ts-check

function findNavigationEntries(nodes, structure) {
  const data = structure.map((item) => {
    if (typeof item === "string") {
      const docId = item;
      const navBar = nodes.find((x) => x.data.id === docId);
      if (navBar === undefined) {
        throw new Error(
          `Cannot find doc with id "${docId}". Make sure to set "id: " in doc front-matter.`
        );
      }
      const title = navBar.data.title;
      if (title === undefined) {
        throw new Error(
          `Doc "${docId}" does not have a title. Make sure to set "title: " in doc front-matter. At ${navBar.inputPath}`
        );
      }
      return {
        type: "doc",
        id: docId,
        label: title,
        url: navBar.data.page.url,
      };
    } else {
      const { label, items, collapsed } = item;

      return {
        type: "group",
        label,
        collapsed,
        items: findNavigationEntries(nodes, items),
      };
    }
  });
  return data;
}

module.exports = { findNavigationEntries };
