// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System;
using System.Threading.Tasks;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputLibrary
    {
        private const string CodeModelInputFileName = "tspCodeModel.json";

        public InputLibrary(string codeModelPath)
        {
            InputNamespace = Load(codeModelPath);
        }

        public InputNamespace InputNamespace { get; }

        public InputNamespace Load(string outputDirectory)
        {
            var codeModelFile = Path.Combine(outputDirectory, CodeModelInputFileName);
            if (!File.Exists(codeModelFile))
            {
                throw new InvalidOperationException($"File {codeModelFile} does not exist.");
            }

            // Read and deserialize tspCodeModel.json
            var json = File.ReadAllText(codeModelFile);
            return TypeSpecSerialization.Deserialize(json) ?? throw new InvalidOperationException($"Deserializing {codeModelFile} has failed.");
        }
    }
}
