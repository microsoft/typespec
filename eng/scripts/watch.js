var cp = require('child_process');

require('./for-each').forEachProject((packageName, projectFolder, project) => {
  if (project.scripts && project.scripts.watch) {
    // NOTE: We deliberately use `tsc --watch --project ${projectFolder}` here
    // with cwd at the repo root instead of `npm run watch` with cwd at project
    // folder. This ensures that error messages put source file paths relative
    // to the repo root, which then allows VS Code to navigate to error
    // locations correctly.
    const tsc = `${projectFolder}/node_modules/.bin/tsc`;
    const args = ['--watch', '--project', projectFolder];
    console.log(`${tsc} ${args.join(' ')}`);

    const proc = cp.spawn(tsc, args, { cwd: `${__dirname}/../`, shell: true, stdio: "inherit" });
    proc.on("error", (c, s) => {
      console.log(packageName);
      console.error(c);
      console.error(s);
    });
    proc.on('exit', (c, s) => {
      console.log(packageName);
      console.error(c);
      console.error(s);
    });
    proc.on('message', (c, s) => {
      console.log(packageName);
      console.error(c);
      console.error(s);
    })
  }
});


