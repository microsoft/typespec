// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System;
using System.Threading.Tasks;

namespace Microsoft.Generator.CSharp.Input
{
    public static class InputLibrary
    {
        private const string CodeModelInputFileName = "tspCodeModel.json";

        public static async Task<InputNamespace> Load(string outputDirectory)
        {
            var codeModelFile = Path.Combine(outputDirectory, CodeModelInputFileName);
            if (!File.Exists(codeModelFile))
            {
                throw new InvalidOperationException($"File {codeModelFile} does not exist.");
            }

            // Read and deserialize tspCodeModel.json
            var json = await File.ReadAllTextAsync(codeModelFile);
            return TypeSpecSerialization.Deserialize(json) ?? throw new InvalidOperationException($"Deserializing {codeModelFile} has failed.");
        }
    }
}
