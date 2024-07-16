// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Text;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.ModelReaderWriterValidation
{
    internal static class TestData
    {
        public static string GetLocation(string filePath)
        {
            string testsLocation = Directory.GetParent(typeof(TestData).Assembly.Location)!.FullName;
            StringBuilder builder = new StringBuilder();
            int indexAfter = testsLocation.IndexOf(".Tests") + 6;
            builder.Append(testsLocation.Substring(0, indexAfter));
            if (testsLocation[indexAfter] == Path.DirectorySeparatorChar)
            {
                builder.Append(testsLocation.Substring(indexAfter));
            }
            else
            {
                int dirSeparatorIndex = testsLocation.IndexOf(Path.DirectorySeparatorChar, indexAfter);
                builder.Append(testsLocation.Substring(dirSeparatorIndex));
            }
            return Path.Combine(builder.ToString(), "ModelReaderWriterValidation", "TestProjects", filePath);
        }
    }
}
