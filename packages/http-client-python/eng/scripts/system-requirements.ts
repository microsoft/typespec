const semver = require("semver");
import { SpawnOptions, ChildProcess, spawn } from "child_process";

/*
 * Copied from @autorest/system-requirements
 */

const PythonRequirement = "python";
const PRINT_PYTHON_VERSION_SCRIPT = "import sys; print('.'.join(map(str, sys.version_info[:3])))";

interface MoreOptions extends SpawnOptions {
  onCreate?(cp: ChildProcess): void;
  onStdOutData?(chunk: any): void;
  onStdErrData?(chunk: any): void;
}

interface SystemRequirement {
  version?: string;
  /**
   * Name of an environment variable where the user could provide the path to the exe.
   * @example "AUTOREST_PYTHON_PATH"
   */
  environmentVariable?: string;
}

interface SystemRequirementResolution {
  /**
   * Name of the requirement.
   * @example python, java, etc.
   */
  name: string;

  /**
   * Name of the command
   * @example python3, /home/myuser/python39/python, java, etc.
   */
  command: string;

  /**
   * List of additional arguments to pass to this command.
   * @example '-3' for 'py' to specify to use python 3
   */
  additionalArgs?: string[];
}


interface ExecResult {
  stdout: string;
  stderr: string;

  /**
   * Union of stdout and stderr.
   */
  log: string;
  error: Error | null;
  code: number | null;
}

const execute = (
  command: string,
  cmdlineargs: Array<string>,
  options: MoreOptions = {},
): Promise<ExecResult> => {
  return new Promise((resolve, reject) => {
    const cp = spawn(command, cmdlineargs, { ...options, stdio: "pipe", shell: true });
    if (options.onCreate) {
      options.onCreate(cp);
    }

    options.onStdOutData ? cp.stdout.on("data", options.onStdOutData) : cp;
    options.onStdErrData ? cp.stderr.on("data", options.onStdErrData) : cp;

    let err = "";
    let out = "";
    let all = "";
    cp.stderr.on("data", (chunk) => {
      err += chunk;
      all += chunk;
    });
    cp.stdout.on("data", (chunk) => {
      out += chunk;
      all += chunk;
    });

    cp.on("error", (err) => {
      reject(err);
    });
    cp.on("close", (code, signal) =>
      resolve({
        stdout: out,
        stderr: err,
        log: all,
        error: code ? new Error("Process Failed.") : null,
        code,
      }),
    );
  });
};

function versionIsSatisfied(version, requirement) {
  const cleanedVersion = semver.coerce(version);
  if (!cleanedVersion) {
    throw new Error(`Invalid version ${version}.`);
  }
  return semver.satisfies(cleanedVersion, requirement, true);
}

/**
 * Validate the provided system requirement resolution is satisfying the version requirement if applicable.
 * @param resolution Command resolution.
 * @param actualVersion Version for that resolution.
 * @param requirement Requirement.
 * @returns the resolution if it is valid or an @see SystemRequirementError if not.
 */
const validateVersionRequirement = (
  resolution: SystemRequirementResolution,
  actualVersion: string,
  requirement: SystemRequirement,
): SystemRequirementResolution | SystemRequirementError => {
  if (!requirement.version) {
    return resolution; // No version requirement.
  }

  try {
    if (versionIsSatisfied(actualVersion, requirement.version)) {
      return resolution;
    }
    return {
      ...resolution,
      error: true,
      message: `'${resolution.command}' version is '${actualVersion}' but doesn't satisfy requirement '${requirement.version}'. Please update.`,
      actualVersion: actualVersion,
      neededVersion: requirement.version,
    };
  } catch {
    return {
      ...resolution,
      error: true,
      message: `Couldn't parse the version ${actualVersion}. This is not a valid semver version.`,
      actualVersion: actualVersion,
      neededVersion: requirement.version,
    };
  }
};

async function tryPython(requirement, command, additionalArgs = []) {
  const resolution = {
    name: PythonRequirement,
    command,
    additionalArgs: additionalArgs.length > 0 ? additionalArgs : undefined,
  };

  try {
    const result = await execute(command, [
      ...additionalArgs,
      "-c",
      `"${PRINT_PYTHON_VERSION_SCRIPT}"`,
    ]);
    return validateVersionRequirement(resolution, result.stdout.trim(), requirement);
  } catch (e) {
    return {
      error: true,
      ...resolution,
      message: `'${command}' command line is not found in the path. Make sure to have it installed.`,
    };
  }
}

/**
 * Returns the path to the executable as asked in the requirement.
 * @param requirement System requirement definition.
 * @returns If the requirement provide an environment variable for the path returns the value of that environment variable. undefined otherwise.
 */
function getExecutablePath(requirement) {
  return requirement.environmentVariable && process.env[requirement.environmentVariable];
}

function createPythonErrorMessage(requirement, errors) {
  const versionReq = requirement.version ?? "*";
  const lines = [
    `Couldn't find a valid python interpreter satisfying the requirement (version: ${versionReq}). Tried:`,
    ...errors.map((x) => ` - ${x.command} (${x.message})`),
  ];

  return {
    error: true,
    name: "python",
    command: "python",
    message: lines.join("\n"),
  };
}

async function resolvePythonRequirement(requirement) {
  const path = getExecutablePath(requirement) ?? process.env["AUTOREST_PYTHON_EXE"];
  if (path) {
    return await tryPython(requirement, path);
  }

  const errors = [];
  // On windows try `py` executable with `-3` flag.
  if (process.platform === "win32") {
    const pyResult = await tryPython(requirement, "py", ["-3"]);
    if ("error" in pyResult) {
      errors.push(pyResult);
    } else {
      return pyResult;
    }
  }

  const python3Result = await tryPython(requirement, "python3");
  if ("error" in python3Result) {
    errors.push(python3Result);
  } else {
    return python3Result;
  }

  const pythonResult = await tryPython(requirement, "python");
  if ("error" in pythonResult) {
    errors.push(pythonResult);
  } else {
    return pythonResult;
  }

  return createPythonErrorMessage(requirement, errors);
}

/**
 * @param command list of the command and arguments. First item in array must be a python exe @see KnownPythonExe. (e.g. ["python", "mypythonfile.py"]
 * @param requirement
 */
async function patchPythonPath(command, requirement) {
  const [_, ...args] = command;
  const resolution = await resolvePythonRequirement(requirement);
  if ("error" in resolution) {
    throw new Error(`Failed to find compatible python version. ${resolution.message}`);
  }
  return [resolution.command, ...(resolution.additionalArgs ?? []), ...args];
}
module.exports.patchPythonPath = patchPythonPath;
