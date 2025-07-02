enum CreateProjectTriggerType {
  Click = "RightClick",
  Command = "CommandPalette",
}

type CreateConfigType = {
  caseName: string
  triggerType: CreateProjectTriggerType
  templateName: string
  templateNameDesctiption: string
  isEmptyFolder: boolean
  expectedResults: string[]
}

const CreateTypespecProjectFolder = "CreateTypespecProject"

const createCase = "CreateTypespecProject"
let templateName = "Generic Rest API"
let templateNameDesctiption = "Create a project representing a generic REST API service."
let expectedResults = [
  ".gitignore",
  "main.tsp",
  "node_modules",
  "package-lock.json",
  "package.json",
  "tspconfig.yaml",
]

const CreateCasesConfigList: CreateConfigType[] = [
  {
    triggerType: CreateProjectTriggerType.Command,
    caseName: `${createCase}-${templateName.replaceAll(" ", "")}-Trigger_${CreateProjectTriggerType.Command}-EmptyFolder`,
    templateName,
    templateNameDesctiption,
    isEmptyFolder: true,
    expectedResults,
  },
]

export { CreateCasesConfigList, CreateTypespecProjectFolder, CreateProjectTriggerType}
