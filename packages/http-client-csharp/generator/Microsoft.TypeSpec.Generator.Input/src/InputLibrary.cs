// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputLibrary
    {
        private const string CodeModelInputFileName = "tspCodeModel.json";

        private readonly string _codeModelPath;

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected InputLibrary()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        public InputLibrary(string codeModelPath)
        {
            _codeModelPath = codeModelPath;
        }

        private InputNamespace? _inputNamespace;
        public virtual InputNamespace InputNamespace => _inputNamespace ??= Load(_codeModelPath);

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

        private bool? _hasMultipartFormDataOperation;
        public bool HasMultipartFormDataOperation => _hasMultipartFormDataOperation ??= GetHasMultipartFormDataOperation();

        private bool GetHasMultipartFormDataOperation()
        {
            foreach (var client in InputNamespace.Clients)
            {
                foreach (var operation in client.Operations)
                {
                    if (operation.IsMultipartFormData)
                    {
                        return true;
                    }
                }
            }

            return false;
        }
    }
}
