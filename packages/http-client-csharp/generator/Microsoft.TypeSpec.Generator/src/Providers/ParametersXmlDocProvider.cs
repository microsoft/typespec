// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public class ParametersXmlDocProvider
    {
        public ParametersXmlDocProvider(IReadOnlyList<ParameterProvider> parameters)
        {
            Parameters = parameters;
        }

        public IReadOnlyList<ParameterProvider> Parameters { get; }

        internal void Write(CodeWriter writer)
        {
            if (Parameters.Count == 0)
            {
                return;
            }
            foreach (var parameter in Parameters)
            {
                var statement = new XmlDocParamStatement(parameter);
                statement.Write(writer);
            }
        }
    }
}
