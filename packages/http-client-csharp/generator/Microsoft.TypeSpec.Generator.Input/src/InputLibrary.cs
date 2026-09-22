// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

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
        public bool HasMultipartFormDataOperation => _hasMultipartFormDataOperation ??= GetHasMultipartFormDataOperation();
        private bool? _hasMultiServiceClient;
        public bool HasMultiServiceClient => _hasMultiServiceClient ??= GetHasMultiServiceClient();

        private bool? _hasXmlModelSerialization;
        public bool HasXmlModelSerialization => _hasXmlModelSerialization ??= GetHasXmlModelSerialization();

        private IReadOnlyList<InputModelType>? _emittedModels;
        /// <summary>
        /// The models that are emitted as generated types. External models are excluded because they
        /// always map to types owned by another library instead of a generated file.
        /// </summary>
        public IReadOnlyList<InputModelType> EmittedModels => _emittedModels ??= [.. GetEmittedModels()];

        private IReadOnlyList<InputEnumType>? _emittedEnums;
        /// <summary>
        /// The enums that are emitted as generated types. API version enums are never emitted, and external
        /// enums always map to types owned by another library instead of a generated file.
        /// </summary>
        public IReadOnlyList<InputEnumType> EmittedEnums => _emittedEnums ??= [.. InputNamespace.Enums
            .Where(e => e.External is null && !e.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum))];

        private IEnumerable<InputModelType> GetEmittedModels()
        {
            foreach (var model in InputNamespace.Models)
            {
                if (model.External is not null)
                {
                    continue;
                }

                yield return model;

                // Unknown discriminator variants are synthesized alongside their base model rather than
                // being listed in the input namespace.
                var unknownVariant = model.DiscriminatedSubtypes.Values.FirstOrDefault(s => s.IsUnknownDiscriminatorModel);
                if (unknownVariant is { External: null })
                {
                    yield return unknownVariant;
                }
            }
        }

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

        private bool GetHasMultiServiceClient()
        {
            foreach (var client in InputNamespace.Clients)
            {
                if (client.IsMultiServiceClient)
                {
                    return true;
                }
            }

            return false;
        }

        private bool GetHasXmlModelSerialization()
        {
            foreach (var model in InputNamespace.Models)
            {
                if (model.Usage.HasFlag(InputModelTypeUsage.Xml)
                    && !model.Usage.HasFlag(InputModelTypeUsage.Exception))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
