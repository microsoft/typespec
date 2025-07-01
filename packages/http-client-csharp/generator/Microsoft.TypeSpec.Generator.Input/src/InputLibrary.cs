// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents the input library for the TypeSpec generator containing the code model and metadata.
    /// </summary>
    public class InputLibrary
    {
        private const string CodeModelInputFileName = "tspCodeModel.json";

        private readonly string _codeModelPath;

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        /// <summary>
        /// Initializes a new instance of the <see cref="InputLibrary"/> class for mocking purposes.
        /// </summary>
        protected InputLibrary()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="InputLibrary"/> class with the specified code model path.
        /// </summary>
        /// <param name="codeModelPath">The path to the code model directory.</param>
        public InputLibrary(string codeModelPath)
        {
            _codeModelPath = codeModelPath;
        }

        private InputNamespace? _inputNamespace;
        /// <summary>
        /// Gets the input namespace containing the types and operations defined in the TypeSpec.
        /// </summary>
        public virtual InputNamespace InputNamespace => _inputNamespace ??= Load();

        internal InputNamespace Load()
        {
            var codeModelFile = Path.Combine(_codeModelPath, CodeModelInputFileName);
            if (!File.Exists(codeModelFile))
            {
                throw new InvalidOperationException($"File {codeModelFile} does not exist.");
            }

            // Read and deserialize tspCodeModel.json
            var json = File.ReadAllText(codeModelFile);
            return TypeSpecSerialization.Deserialize(json) ?? throw new InvalidOperationException($"Deserializing {codeModelFile} has failed.");
        }

        private bool? _hasMultipartFormDataOperation;
        /// <summary>
        /// Gets a value indicating whether the library contains any operations that use multipart form data.
        /// </summary>
        public bool HasMultipartFormDataOperation => _hasMultipartFormDataOperation ??= GetHasMultipartFormDataOperation();

        private bool GetHasMultipartFormDataOperation()
        {
            foreach (var client in InputNamespace.Clients)
            {
                foreach (var inputServiceMethod in client.Methods)
                {
                    if (inputServiceMethod.Operation.IsMultipartFormData)
                    {
                        return true;
                    }
                }
            }

            return false;
        }
    }
}
