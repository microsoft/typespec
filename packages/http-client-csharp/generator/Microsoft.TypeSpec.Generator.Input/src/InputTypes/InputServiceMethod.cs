// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public abstract class InputServiceMethod
    {
        protected InputServiceMethod(
            string name,
            string? accessibility,
            string[] apiVersions,
            string? documentation,
            string? summary,
            InputOperation operation,
            IReadOnlyList<InputParameter> parameters,
            InputServiceMethodResponse response,
            InputServiceMethodResponse? exception,
            bool isOverride,
            bool generateConvenient,
            bool generateProtocol,
            string crossLanguageDefinitionId)
        {
            Name = name;
            Accessibility = accessibility;
            ApiVersions = apiVersions;
            Documentation = documentation;
            Summary = summary;
            Operation = operation;
            Parameters = parameters;
            Response = response;
            Exception = exception;
            IsOverride = isOverride;
            GenerateConvenient = generateConvenient;
            GenerateProtocol = generateProtocol;
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
        }

        public string Name { get; internal set; }
        public string? Accessibility { get; internal set; }
        public string[] ApiVersions { get; internal set; }
        public string? Documentation { get; internal set; }
        public string? Summary { get; internal set; }
        public InputOperation Operation { get; internal set; }
        public IReadOnlyList<InputParameter> Parameters { get; internal set; }
        public InputServiceMethodResponse Response { get; internal set; }
        public InputServiceMethodResponse? Exception { get; internal set; }
        public bool IsOverride { get; internal set; }
        public bool GenerateConvenient { get; internal set; }
        public bool GenerateProtocol { get; internal set; }
        public string CrossLanguageDefinitionId { get; internal set; }
    }
}
