The command line usage of the generator is comprised of the following:

> `mgc.exe [DIRECTORY] [additional options]`

## Inputs

The following generator inputs are supported:

| Input       | Description                                                                                                                                       | Required |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `DIRECTORY` | The path to the directory containing the input files to the generator including the code model file and the configuration file for the generator. | Yes      |

## Supported Flags

| Flag                              | Description                                                                                                                                                                                              | Required |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `--model-plugin=<string>`         | The name of the custom client model plugin NuGet package to use to generate the code. If not provided, the default client model plugin package `Microsoft.Generator.CSharp.ClientModel` will be used.    | No       |
| `--model-plugin-version=<string>` | The version of the client model plugin package to use. If no custom client model plugin is provided via the `--model-plugin` flag, then this flag will apply to the default client model plugin package. | Yes      |
| `-o, --output-path=<string>`      | Path to the output directory. If not provided, the output path will default to the specified input `DIRECTORY`.                                                                                          | No       |
| `--help`                          | Display help.                                                                                                                                                                                            | No       |
