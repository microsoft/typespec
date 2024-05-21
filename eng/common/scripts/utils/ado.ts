export function setOutputVariable(name: string, value: string) {
  process.stdout.write("##vso[task.setvariable variable=RunCore;isOutput=true]true");
  process.stdout.write(`##vso[task.setvariable variable=${name};isOutput=true]${value}\n`);
}
