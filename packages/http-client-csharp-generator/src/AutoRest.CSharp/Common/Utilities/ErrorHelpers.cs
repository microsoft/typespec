// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
using System;

namespace AutoRest.CSharp.Utilities
{
    internal static class ErrorHelpers
    {
        internal static string FileIssueText = "\n   Please file an issue at https://github.com/Azure/autorest.csharp/issues/new. \n   Attach the written 'Configuration.json' and 'CodeModel.yaml' or the original swagger so we can reproduce your error.\n";
        internal static string UpdateSwaggerOrFile = "\n\nPlease review your swagger and make necessary corrections.\n\nIf the definition is correct file an issue at https://github.com/Azure/autorest.csharp/issues/new with details to reproduce.\n";

        // We wrap all 'reported' errors in a custom exception type so CSharpGen can recognize them as not internal errors and not show 'Internal error in AutoRest.CSharp'
        internal static void ThrowError (string errorText)
        {
            throw new ErrorException (errorText);
        }

        internal class ErrorException : Exception
        {
            internal string ErrorText;

            internal ErrorException(string errorText) : base(errorText)
            {
                ErrorText = errorText;
            }
        }
    }
}
