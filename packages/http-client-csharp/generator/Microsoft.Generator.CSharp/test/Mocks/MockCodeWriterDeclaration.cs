// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Tests
{
    /// <summary>
    /// Can be used to create a CodeWriterDeclaration with a requested name and an optional actual name.
    /// This allows you to unit test parts of the writer that assume the declaration was done
    /// without actually doing the declaration
    /// </summary>
    internal class MockCodeWriterDeclaration
    {
        public string RequestedName { get; }
        private string? ActualName { get; }

        public MockCodeWriterDeclaration(string requestedName, string? actualName = null)
        {
            RequestedName = requestedName;
            ActualName = actualName;
        }

        public static implicit operator CodeWriterDeclaration(MockCodeWriterDeclaration mockCodeWriterDeclaration)
        {
            var result = new CodeWriterDeclaration(mockCodeWriterDeclaration.RequestedName);
            result.SetActualName(mockCodeWriterDeclaration.ActualName ?? mockCodeWriterDeclaration.RequestedName);
            return result;
        }
    }
}
