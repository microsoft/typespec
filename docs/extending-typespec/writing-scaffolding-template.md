---
title: Scaffolding templates
---

TypeSpec offers a scaffolding feature through the `tsp init` command.

```bash
tsp init <templateUrl>
```

## Setting a minimum TypeSpec version

If your template requires a feature that was introduced in a later version of TypeSpec, you can specify this in the template. This will alert the user that the template may not function as expected and ask them to confirm if they wish to proceed.

You can set the `compilerVersion` in each template configuration. The value should be the minimum semver version required.

```json
{
  "compilerVersion": "0.51.0"
}
```

## Basics of a scaffolding template

A scaffolding template is a `json` document that can be hosted either locally or online. The document's root is a dictionary, allowing for multiple templates to be hosted in the same location.

Each template must include:

- key: The template's key
- title: A user-friendly name for the template
- description: A detailed description of the template.

Here's an example:

```json
{
  "templateKey1": {
    "title": "Template #1",
    "description": "Create a project representing #1"
  },
  "templateKey2": {
    "title": "Template #2",
    "description": "Create a project representing #2"
  }
}
```

## Including libraries

You can include a list of TypeSpec libraries. These will be automatically added to the `package.json` and imported in `main.tsp`.

```json
{
  "rest": {
    "title": "REST API",
    "description": "Create a new project representing a REST API",
    "libraries": ["/rest", "@typespec/openapi3"]
  }
}
```

## Adding new files

The initializer can generate additional files (either .typespec or other types). The template includes a list of files to copy and interpolate values. Each file requires the following properties:

- `path`: The absolute or relative path (relative to the template file) to the file
- `destination`: The file's relative path, relative to the project root.

```json
{
  "rest": {
    "title": "REST API",
    "description": "Create a new project representing a REST API",
    "files": [{ "path": "./models.tsp", "destination": "./models.tsp" }]
  }
}
```

In models.tsp

```typespec
model {{parameters.ModelName}} {

}
```

### Interpolating values

The template can interpolate values in the files. The available values are anything in the template configuration, referenced as is. For example:

- To reference a parameter, use `{{parameters.ModelName}}`
- To reference the template title, use `{{title}}`

Additionally, the following values and functions are available:

| Name                                  | Description                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `directory`                           | The full directory path where the project should be initialized.                  |
| `folderName`                          | The name of the folder where the project should be initialized.                   |
| `name`                                | The name of the project.                                                          |
| `libraries`                           | The list of libraries to include.                                                 |
| `templateUri`                         | The path from where this template was loaded.                                     |
| Functions                             |                                                                                   |
| `toLowerCase(value: string)`          | Converts a string to lower case.                                                  |
| `normalizePackageName(value: string)` | Normalizes the package name. It replaces `.` with `-` and converts to lower case. |
| `casing.pascalCase(value: string)`    | Converts a string to PascalCase.                                                  |
| `casing.camelCase(value: string)`     | Converts a string to camelCase.                                                   |
| `casing.kebabCase(value: string)`     | Converts a string to kebab-case.                                                  |

## Requesting additional user input

When generating files, you may need additional input from the user, such as the model name. The template includes a map of inputs that will be prompted to the user during initialization.

```json
{
  "rest": {
    "title": "REST API",
    "description": "Create a new project representing a REST API",
    "inputs": {
      "modelName": {
        "type": "text",
        "description": "Name of the first model"
      }
    }
  }
}
```

Supported input types:

- `text`: Requests a raw text value.
