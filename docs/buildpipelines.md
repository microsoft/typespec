# Using Build Pipelines with CADL
## TOC
1. [Introduction](#introduction)
1. [Azure DevOps Pipelines](#azure-devops-pipelines)
1. [Github Pipelines](#github-pipelines)

# Introduction

## Dependencies
In order to build Cadl in your build pipeline, you will need to ensure that the following are available or are automatically installed by your project:
1. NodeJS 16.14.2 LTS (Recommended)
2. Cadl compilation tools (via npm package)

# Azure DevOps Pipelines
Depending on your project, you may need to add NodeJS and install NPM packages for Cadl.
The following Azure Devops Pipeline tasks can be modified and added to your pipeline yaml file if you do not already utilize NodeJS in your project.

```yaml
          - task: NodeTool@0
            inputs:
              versionSpec: '16.14.2' # Node 16.14.2 LTS is recommended.
              checkLatest: false

          - task: Npm@1 # Install the NPM packages required by Cadl.
            inputs:
              command: 'install'
              workingDir: '$(SRCROOT)\path\to\cadl\folder' # This is where package.json lives for your CADL project
```

This is sufficient if you are building via a csproj file which triggers the cadl compile and finds the cadl compiler.

You may also need to add additional steps to compile your cadl files separately.

# Github Pipelines
<TBD>
