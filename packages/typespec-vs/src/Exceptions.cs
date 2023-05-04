using System;
using System.Diagnostics;
using System.IO;

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
            : base(string.Join(Environment.NewLine, new[]
            {
                $"TypeSpec server executable was not found: '{fileName}' is not found. Make sure either:",
                " - typespec is installed locally at the root of this workspace or in a parent directory.",
                " - typespec is installed globally with `npm install -g @typespec/compiler'.",
                " - typespec server path is configured with https://github.com/microsoft/typespec/blob/main/packages/typespec-vs/README.md#configure-typespec-visual-studio-extension."
            }), innerException)
        {
        }
        
        public TypeSpecServerNotFoundException(ProcessStartInfo info, Exception? innerException = null)
            : this(Path.Combine(info.WorkingDirectory, info.FileName), innerException)
        {
        }
    }
}
