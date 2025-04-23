# 1. System Requirements and Prerequisites

Before installing TypeSpec, it's important to understand the system requirements and prerequisites needed for a successful setup. This section outlines everything you need to prepare your environment for TypeSpec development.

## System Requirements

TypeSpec is designed to work across major operating systems with minimal hardware requirements. Here's what you need to get started:

### Operating Systems

TypeSpec is compatible with the following operating systems:

- **Windows**: Windows 10 or later
- **macOS**: macOS 10.15 (Catalina) or later
- **Linux**: Most modern distributions including Ubuntu 18.04+, Debian 10+, Fedora 32+

### Hardware Requirements

TypeSpec has modest hardware requirements:

- **Processor**: Any modern multi-core CPU (2+ cores recommended)
- **RAM**: Minimum 4GB (8GB or more recommended for larger projects)
- **Disk Space**: ~200MB for TypeSpec and its dependencies

## Software Prerequisites

### Node.js and npm

TypeSpec is built on Node.js and requires the following minimum versions:

- **Node.js**: Version 18.0.0 or later
- **npm**: Version 7.0.0 or later (included with Node.js)

To check if you have Node.js installed and verify its version:

```bash
node --version
npm --version
```

If Node.js is not installed or you need to update, download it from the [official Node.js website](https://nodejs.org/). We recommend using the LTS (Long-Term Support) version for production environments.

### Optional: Development Environment

While TypeSpec can be used with any text editor, specialized IDE extensions provide enhanced functionality:

- **Visual Studio Code**: For the best development experience, we recommend using VS Code with the TypeSpec extension.
- **Visual Studio**: If you're developing on Windows, Visual Studio 2022 with the TypeSpec extension offers excellent integration.

## Development Tools

These tools are not strictly required but can enhance your TypeSpec development workflow:

### Git

Version control is essential for most development projects. If you plan to share your TypeSpec definitions or collaborate with others, install Git from [git-scm.com](https://git-scm.com/).

### Docker (Optional)

For containerized development or deployment, Docker provides a consistent environment:

- Install from [docker.com](https://www.docker.com/get-started)
- TypeSpec offers official Docker images for containerized usage

## Network Requirements

If you're working in an environment with restricted network access, ensure you have access to:

- **npm Registry**: access to registry.npmjs.org for package installation
- **GitHub**: access to github.com for optional template downloads
- **TypeSpec Documentation**: access to typespec.io

For corporate environments with proxies or firewalls, you may need to configure npm to use your organization's proxy:

```bash
npm config set proxy http://your-proxy-address:port
npm config set https-proxy http://your-proxy-address:port
```

## TypeSpec CLI Tool Prerequisites

The TypeSpec CLI tool, which you'll install in the next section, requires:

- Ability to execute shell commands
- Write access to your global npm packages directory or a local project directory
- For global installation: administrative privileges may be required on some systems

## IDE Extension Prerequisites

For optimal development experience with TypeSpec IDE extensions:

### VS Code Extension Requirements

- Visual Studio Code version 1.60.0 or later
- Permission to install extensions from the VS Code marketplace

### Visual Studio Extension Requirements

- Visual Studio 2022 or later
- .NET development workload installed
- Permission to install extensions from the Visual Studio marketplace

## Preparing for Installation

Before proceeding to installation, ensure you have:

1. Verified you meet the system requirements
2. Installed Node.js and npm at the required versions
3. Set up your development environment with VS Code or Visual Studio
4. Configured network access if needed (especially in corporate environments)

With these prerequisites in place, you're ready to proceed to the TypeSpec installation process. In the next section, we'll guide you through installing the TypeSpec compiler and development tools.

## Pre-installation Checklist

Use this checklist to ensure you're ready to install TypeSpec:

- [ ] Node.js (v18+) installed and accessible from command line
- [ ] npm (v7+) installed and accessible from command line
- [ ] Suitable code editor or IDE installed (VS Code recommended)
- [ ] Network access to npm registry (for package installation)
- [ ] Permission to install global npm packages (or a strategy for local installation)

Now that you understand the prerequisites, you're ready to proceed with installing TypeSpec and setting up your development environment.
