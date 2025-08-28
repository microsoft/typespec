// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputBasicServiceMethod : InputServiceMethod
    {
        public InputBasicServiceMethod(
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
            string crossLanguageDefinitionId) : base(
                name,
                accessibility,
                apiVersions,
                documentation,
                summary,
                operation,
                parameters,
                response,
                exception,
                isOverride,
                generateConvenient,
                generateProtocol,
                crossLanguageDefinitionId) { }

        internal InputBasicServiceMethod(): this(
            string.Empty,
            string.Empty,
            [],
            string.Empty,
            string.Empty,
            new InputOperation(),
            [],
            new InputServiceMethodResponse(),
            null,
            false,
            false,
            false,
            string.Empty) { }
    }
}
