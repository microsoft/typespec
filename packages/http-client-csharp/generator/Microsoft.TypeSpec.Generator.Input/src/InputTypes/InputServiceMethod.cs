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
            IReadOnlyList<InputMethodParameter> parameters,
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
        public IReadOnlyList<InputMethodParameter> Parameters { get; internal set; }
        public InputServiceMethodResponse Response { get; internal set; }
        public InputServiceMethodResponse? Exception { get; internal set; }
        public bool IsOverride { get; internal set; }
        public bool GenerateConvenient { get; internal set; }
        public bool GenerateProtocol { get; internal set; }
        public string CrossLanguageDefinitionId { get; internal set; }

        public void Update(
            string? name = null,
            string? accessibility = null,
            string[]? apiVersions = null,
            string? documentation = null,
            string? summary = null,
            InputOperation? operation = null,
            IEnumerable<InputMethodParameter>? parameters = null,
            InputServiceMethodResponse? response = null,
            InputServiceMethodResponse? exception = null,
            bool? isOverride = null,
            bool? generateConvenient = null,
            bool? generateProtocol = null,
            string? crossLanguageDefinitionId = null)
        {
            if (name != null)
            {
                Name = name;
            }

            if (accessibility != null)
            {
                Accessibility = accessibility;
            }

            if (apiVersions != null)
            {
                ApiVersions = apiVersions;
            }

            if (documentation != null)
            {
                Documentation = documentation;
            }

            if (summary != null)
            {
                Summary = summary;
            }

            if (operation != null)
            {
                Operation = operation;
            }

            if (parameters != null)
            {
                Parameters = [.. parameters];
            }

            if (response != null)
            {
                Response = response;
            }

            if (exception != null)
            {
                Exception = exception;
            }

            if (isOverride.HasValue)
            {
                IsOverride = isOverride.Value;
            }

            if (generateConvenient.HasValue)
            {
                GenerateConvenient = generateConvenient.Value;
            }

            if (generateProtocol.HasValue)
            {
                GenerateProtocol = generateProtocol.Value;
            }

            if (crossLanguageDefinitionId != null)
            {
                CrossLanguageDefinitionId = crossLanguageDefinitionId;
            }
        }
    }
}
