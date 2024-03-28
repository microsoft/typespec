# Contribution Guidelines

This is the repository for the [autorest](https://github.com/Azure/autorest) plugin to generate C# client libraries.

## Prerequisites

The following software is required to build and test this repository:

- [.NET 7.0.1 SDK](https://dotnet.microsoft.com/download/dotnet-core/7.0)
- [Node.js 18](https://nodejs.org/download/release/latest-v18.x/) ([installation instructions](https://nodejs.org/en/download/))
- NPM 8.x: `npm install -g npm@8.x` (may need to run under `sudo` on linux)
  > ⚠️ **Warning:** using NPM 9 may prevent proper source generation, preventing a PR from building cleanly.

- [PowerShell 7 or newer](https://learn.microsoft.com/powershell/scripting/install/installing-powershell)
