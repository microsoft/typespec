// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Mgmt.Models
{
    internal class MgmtRestClientBuilder : CmcRestClientBuilder
    {
        private static HashSet<string> AllowedRequestParameterOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "modelerfour:synthesized/host", "modelerfour:synthesized/api-version" };
        private class ParameterCompareer : IEqualityComparer<RequestParameter>
        {
            public bool Equals([AllowNull] RequestParameter x, [AllowNull] RequestParameter y)
            {
                if (x is null)
                    return y is null;

                if (y is null)
                    return false;

                return x.Language.Default.Name == y.Language.Default.Name && x.Implementation == y.Implementation;
            }

            public int GetHashCode([DisallowNull] RequestParameter obj)
            {
                return obj.Language.Default.Name.GetHashCode() ^ obj.Implementation.GetHashCode();
            }
        }

        public MgmtRestClientBuilder(OperationGroup operationGroup)
            : base(GetMgmtParametersFromOperations(operationGroup.Operations), MgmtContext.Context)
        {
        }

        private static IReadOnlyList<RequestParameter> GetMgmtParametersFromOperations(ICollection<Operation> operations)
        {
            var parameters = new HashSet<RequestParameter>(new ParameterCompareer());
            foreach (var operation in operations)
            {
                var clientParameters = operation.Parameters.Where(p => p.Implementation == ImplementationLocation.Client);
                foreach (var parameter in clientParameters)
                {
                    if (!AllowedRequestParameterOrigins.Contains(parameter.Origin ?? string.Empty))
                    {
                        throw new InvalidOperationException($"'{parameter.Language.Default.Name}' with origin '{parameter.Origin}' should be method parameter for operation '{operation.OperationId}'");
                    }
                    parameters.Add(parameter);
                }
            }
            return parameters.ToList();
        }

        public override Parameter BuildConstructorParameter(RequestParameter requestParameter)
        {
            var parameter = base.BuildConstructorParameter(requestParameter);
            return parameter.IsApiVersionParameter
                ? parameter with { DefaultValue = Constant.Default(parameter.Type.WithNullable(true)), Initializer = parameter.DefaultValue?.GetConstantFormattable() }
                : parameter;
        }

        protected override Parameter[] BuildMethodParameters(IReadOnlyDictionary<RequestParameter, Parameter> allParameters)
        {
            List<Parameter> requiredParameters = new();
            List<Parameter> optionalParameters = new();
            List<Parameter> bodyParameters = new();
            foreach (var (requestParameter, parameter) in allParameters)
            {
                // Grouped and flattened parameters shouldn't be added to methods
                if (IsMethodParameter(requestParameter))
                {
                    // sort the parameters by the following sequence:
                    // 1. required parameters
                    // 2. body parameters (if exists), note that form data can generate multiple body parameters (e.g. "in": "formdata")
                    //    see test project `body-formdata` for more details
                    // 3. optional parameters
                    if (parameter.RequestLocation == RequestLocation.Body)
                    {
                        bodyParameters.Add(parameter);
                    }
                    else if (parameter.IsOptionalInSignature)
                    {
                        optionalParameters.Add(parameter);
                    }
                    else
                    {
                        requiredParameters.Add(parameter);
                    }
                }
            }

            requiredParameters.AddRange(bodyParameters.OrderBy(p => p.IsOptionalInSignature)); // move required body parameters at the beginning
            requiredParameters.AddRange(optionalParameters);

            return requiredParameters.ToArray();
        }
    }
}
