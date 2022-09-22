// @ts-check

function findNavigationEntries(nodes, structure) {
  const data = Object.entries(structure).map(([category, docs]) => {
    const pages = docs.map((docId) => {
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
        id: docId,
        title,
        url: navBar.data.page.url,
      };
    });

    return {
      label: category,
      pages,
    };
  });
  return data;
}

module.exports = { findNavigationEntries };
