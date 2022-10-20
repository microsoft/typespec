using System;

namespace Microsoft.Cadl.VisualStudio
{
    /// <summary>
    /// Provide a typed map for Win32 error codes as described here https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-erref/18d8fbe8-a967-4f1c-ae50-99ca8e491d2d
    /// </summary>
    internal static class Win32ErrorCodes
    {
        public const int ERROR_FILE_NOT_FOUND = 2;
    }


    [Serializable]
    internal class CadlUserErrorException : Exception
    {
        public CadlUserErrorException(string message, Exception? innerException = null)
            : base(message, innerException)
        {
        }
    }

    [Serializable]
    internal sealed class CadlServerNotFoundException : CadlUserErrorException
    {
        public CadlServerNotFoundException(string fileName, Exception? innerException = null)
            : base(string.Join("\n", new string[]
            {
                $"Cadl server executable was not found: '{fileName}' is not found. Make sure either:",
                " - cadl is installed locally at the root of this workspace or in a parent directory.",
                " - cadl is installed globally with `npm install -g @cadl-lang/compiler'.",
                " - cadl server path is configured with https://github.com/microsoft/cadl/blob/main/packages/cadl-vs/README.md#configure-cadl-visual-studio-extension."
            }), innerException)
        {
        }
    }
}
