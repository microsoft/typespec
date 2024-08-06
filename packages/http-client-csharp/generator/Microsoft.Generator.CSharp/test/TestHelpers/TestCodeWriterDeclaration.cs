// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Tests
{
    /// <summary>
    /// Can be used to create a CodeWriterDeclaration with a requested name and an optional actual name.
    /// This allows you to unit test parts of the writer that assume the declaration was done
    /// without actually doing the declaration
    /// </summary>
    internal class TestCodeWriterDeclaration
    {
        public string RequestedName { get; }
        private string? ActualName { get; }

        public TestCodeWriterDeclaration(string requestedName, string? actualName = null)
        {
            RequestedName = requestedName;
            ActualName = actualName;
        }

        public static implicit operator CodeWriterDeclaration(TestCodeWriterDeclaration testCodeWriterDeclaration)
        {
            var result = new CodeWriterDeclaration(testCodeWriterDeclaration.RequestedName);
            result.SetActualName(testCodeWriterDeclaration.ActualName ?? testCodeWriterDeclaration.RequestedName);
            return result;
        }
    }
}
