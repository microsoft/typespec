// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputLibrary
    {
        private const string CodeModelInputFileName = "tspCodeModel.json";

        private readonly string _codeModelPath;

        public InputLibrary(string codeModelPath)
        {
            _codeModelPath = codeModelPath;
        }

        private InputNamespace? _inputNamespace;
        public InputNamespace InputNamespace => _inputNamespace ??= Load(_codeModelPath);

        internal InputNamespace Load(string outputDirectory)
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
