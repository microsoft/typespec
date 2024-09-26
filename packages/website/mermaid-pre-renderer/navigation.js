// @ts-check
/**
 *
 * @param {*} nodes
 * @param {*} structure
 * @param  {...string} path
 * @returns
 */
function findNavigationEntries(nodes, structure, ...path) {
  for (const segment of path) {
    const sub = structure.find((x) => x.id === segment);
    if (sub === undefined) {
      throw new Error(
        `Cannot find ${segment} in [${Object.values(structure)
          .map((x) => x.id)
          .join(",")}].`,
      );
    }
    structure = sub.items;
  }
  const data = structure.map((item) => {
    if (typeof item === "string") {
      const docId = item;
      const navBar = nodes.find((x) => x.data.id === docId);
      if (navBar === undefined) {
        throw new Error(
          `Cannot find doc with id "${docId}". Make sure to set "id: " in doc front-matter.`,
        );
      }
      const title = navBar.data.title;
      if (title === undefined) {
        throw new Error(
          `Doc "${docId}" does not have a title. Make sure to set "title: " in doc front-matter. At ${navBar.inputPath}`,
        );
      }
      return {
        type: "doc",
        id: docId,
        label: title,
        url: navBar.data.page.url,
      };
    } else {
      const { id, label, items, collapsed } = item;

      return {
        type: "group",
        id,
        label,
        collapsed,
        items: findNavigationEntries(nodes, items),
      };
    }
  });
  return data;
}

module.exports = { findNavigationEntries };
