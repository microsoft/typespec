// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

namespace AutoRest.CSharp.AutoRest.Communication.Serialization.Models
{
    // The Channel that a message is registered with.
    internal enum Channel
    {
        // Information is considered the mildest of responses; not necessarily actionable.
        Information,
        // Warnings are considered important for best practices, but not catastrophic in nature.
        Warning,
        // Errors are considered blocking issues that block a successful operation.
        Error,
        // Debug messages are designed for the developer to communicate internal AutoRest implementation details.
        Debug,
        // Verbose messages give the user additional clarity on the process.
        Verbose,
        // Catastrophic failure, likely aborting the process.
        Fatal,
        // Hint messages offer guidance or support without forcing action.
        Hint,
        // File represents a file output from an extension. Details are a Artifact and are required.
        File,
        // Content represents an update/creation of a configuration file. The final URI will be in the same folder as the primary config file.
        Configuration,
        // Protect is a path to not remove during a clear-output-folder.
        Protect
    }
}
