export function setOutputVariable(name: string, value: string) {
  console.log(`##vso[task.setvariable variable=${name};isOutput=true]${value}`);
}
