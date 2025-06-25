using System;
using System.Collections.Generic;
using System.Linq;

namespace Microsoft.TypeSpec.VisualStudio
{
    /// <summary>
    /// Provide a typed map for Win32 error codes as described here https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-erref/18d8fbe8-a967-4f1c-ae50-99ca8e491d2d
    /// </summary>
    internal static class Win32ErrorCodes
    {
        public const int ERROR_FILE_NOT_FOUND = 2;
    }

    [Serializable]
    internal class TypeSpecUserErrorException : Exception
    {
        public TypeSpecUserErrorException(string message, Exception? innerException = null)
            : base(message, innerException)
        {
        }
    }

    [Serializable]
    internal sealed class TypeSpecServerNotFoundException : TypeSpecUserErrorException
    {
        public TypeSpecServerNotFoundException(string fileName, Exception? innerException = null)
            : base(string.Join("\n", new List<string>
            {
                $"TypeSpec server executable was not found: '{fileName}' is not found. Make sure either:",
                fileName == "node.exe" ?" - Node.js is installed locally and available in PATH.":"",
                " - TypeSpec is installed locally at the root of this workspace or in a parent directory.",
                " - TypeSpec is installed globally with `npm install -g @typespec/compiler'.",
                " - TypeSpec server path is configured with https://typespec.io/docs/introduction/editor/vs/#configure."
            }.Where(m => !string.IsNullOrWhiteSpace(m))), innerException)
        {
        }
    }
}
