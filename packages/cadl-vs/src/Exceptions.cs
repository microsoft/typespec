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
    public class CadlUserErrorException : Exception
    {
        public CadlUserErrorException() { }

        public CadlUserErrorException(string message)
            : base(message)
        {

        }
    }


    [Serializable]
    public class CadlServerNotFoundException : CadlUserErrorException
    {
        public CadlServerNotFoundException() { }

        public CadlServerNotFoundException(string name)
            : base(string.Join("\n", new string[]
            {
            $"Cadl server exectuable was not found: '{name}' is not found. Make sure either:",
            " - cadl is installed globally with `npm install -g @cadl-lang/compiler'.",
            " - cadl server path is configured with https://github.com/microsoft/cadl/blob/main/packages/cadl-vs/README.md#configure-cadl-visual-studio-extension."
            }))
        {

        }
    }
}
