// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Utilities;
using Microsoft.CodeAnalysis;

namespace AutoRest.CSharp.Output.Models.Shared
{
    internal record Parameter(string Name, FormattableString? Description, CSharpType Type, Constant? DefaultValue, ValidationType Validation, FormattableString? Initializer, bool IsApiVersionParameter = false, bool IsEndpoint = false, bool IsResourceIdentifier = false, bool SkipUrlEncoding = false, RequestLocation RequestLocation = RequestLocation.None, SerializationFormat SerializationFormat = SerializationFormat.Default, bool IsPropertyBag = false, bool IsRef = false)
    {
        public bool IsRawData { get; init; }

        public static IEqualityComparer<Parameter> TypeAndNameEqualityComparer = new ParameterTypeAndNameEqualityComparer();
        public CSharpAttribute[] Attributes { get; init; } = Array.Empty<CSharpAttribute>();
        public bool IsOptionalInSignature => DefaultValue != null;

        public Parameter ToRequired()
        {
            return this with { DefaultValue = null };
        }

        public static Parameter FromInputParameter(in InputParameter operationParameter, CSharpType type, TypeFactory typeFactory, bool shouldKeepClientDefaultValue = false)
        {
            var name = ConstructParameterVariableName(operationParameter, type);
            var skipUrlEncoding = operationParameter.SkipUrlEncoding;
            var requestLocation = operationParameter.Location;

            bool keepClientDefaultValue = shouldKeepClientDefaultValue || operationParameter.Kind == InputOperationParameterKind.Constant || operationParameter.IsApiVersion || operationParameter.IsContentType || operationParameter.IsEndpoint;
            Constant? clientDefaultValue = GetDefaultValue(operationParameter, typeFactory);

            var defaultValue = keepClientDefaultValue
                ? clientDefaultValue
                : (Constant?)null;

            var initializer = (FormattableString?)null;

            if (defaultValue != null && operationParameter.Kind != InputOperationParameterKind.Constant && !TypeFactory.CanBeInitializedInline(type, defaultValue))
            {
                initializer = type.GetParameterInitializer(defaultValue.Value);
                type = type.WithNullable(true);
                defaultValue = Constant.Default(type);
            }

            if (!operationParameter.IsRequired && defaultValue == null)
            {
                type = type.WithNullable(true);
                defaultValue = Constant.Default(type);
            }

            var validation = operationParameter.IsRequired && initializer == null
                ? GetValidation(type, requestLocation, skipUrlEncoding)
                : ValidationType.None;

            var inputType = TypeFactory.GetInputType(type);
            return new Parameter(
                name,
                CreateDescription(operationParameter, inputType, (operationParameter.Type as InputEnumType)?.AllowedValues.Select(c => c.GetValueString()), keepClientDefaultValue ? null : clientDefaultValue),
                inputType,
                defaultValue,
                validation,
                initializer,
                IsApiVersionParameter: operationParameter.IsApiVersion,
                IsEndpoint: operationParameter.IsEndpoint,
                IsResourceIdentifier: operationParameter.IsResourceParameter,
                SkipUrlEncoding: skipUrlEncoding,
                RequestLocation: requestLocation,
                SerializationFormat: operationParameter.SerializationFormat);
        }

        private static Constant? GetDefaultValue(InputParameter operationParameter, TypeFactory typeFactory) => operationParameter switch
        {
            { NameInRequest: var nameInRequest } when RequestHeader.ClientRequestIdHeaders.Contains(nameInRequest) => Constant.FromExpression($"message.{Configuration.ApiTypes.HttpMessageRequestName}.ClientRequestId", new CSharpType(typeof(string))),
            { NameInRequest: var nameInRequest } when RequestHeader.ReturnClientRequestIdResponseHeaders.Contains(nameInRequest) => new Constant("true", new CSharpType(typeof(string))),
            { DefaultValue: not null } => BuilderHelpers.ParseConstant(operationParameter.DefaultValue.Value, typeFactory.CreateType(operationParameter.DefaultValue.Type)),
            { NameInRequest: var nameInRequest } when nameInRequest.Equals(RequestHeader.RepeatabilityRequestId, StringComparison.OrdinalIgnoreCase) =>
                // Guid.NewGuid()
                Constant.FromExpression($"{nameof(Guid)}.{nameof(Guid.NewGuid)}()", new CSharpType(typeof(string))),
            { NameInRequest: var nameInRequest } when nameInRequest.Equals(RequestHeader.RepeatabilityFirstSent, StringComparison.OrdinalIgnoreCase) =>
                // DateTimeOffset.Now
                Constant.FromExpression($"{nameof(DateTimeOffset)}.{nameof(DateTimeOffset.Now)}", new CSharpType(typeof(DateTimeOffset))),
            _ => (Constant?)null,
        };

        public static FormattableString CreateDescription(InputParameter operationParameter, CSharpType type, IEnumerable<string>? values, Constant? defaultValue = null)
        {
            FormattableString description = string.IsNullOrWhiteSpace(operationParameter.Description)
                ? (FormattableString)$"The {type:C} to use."
                : $"{BuilderHelpers.EscapeXmlDocDescription(operationParameter.Description)}";
            if (defaultValue != null)
            {
                var defaultValueString = defaultValue?.Value is string s ? $"\"{s}\"" : $"{defaultValue?.Value}";
                description = $"{description}{(description.ToString().EndsWith(".") ? "" : ".")} The default value is {defaultValueString}";
            }

            if (!type.IsFrameworkType || values == null)
            {
                return description;
            }

            var allowedValues = string.Join(" | ", values.Select(v => $"\"{v}\""));
            return $"{description}{(description.ToString().EndsWith(".") ? "" : ".")} Allowed values: {BuilderHelpers.EscapeXmlDocDescription(allowedValues)}";
        }

        /// <summary>
        /// This method constructs the variable name for an input parameter. If the input parameter type is an input model type,
        /// and the input parameter name is the same as the input parameter type name, the variable name is constructed using the supplied CSharpType name. Otherwise,
        /// it will use the input parameter name by default.
        /// </summary>
        /// <param name="param">The input parameter.</param>
        /// <param name="type">The constructed CSharpType for the input parameter.</param>
        /// <returns>A string representing the variable name for the input parameter.</returns>
        private static string ConstructParameterVariableName(InputParameter param, CSharpType type)
        {
            string paramName = param.Name;
            string variableName = paramName.ToVariableName();

            if (param.Type is InputModelType paramInputType)
            {
                var paramInputTypeName = paramInputType.Name;

                if (paramName.Equals(paramInputTypeName))
                {
                    variableName = !string.IsNullOrEmpty(type.Name) ? type.Name.ToVariableName() : variableName;
                }

            }

            return variableName;
        }

        public static ValidationType GetValidation(CSharpType type, RequestLocation requestLocation, bool skipUrlEncoding)
        {
            if (requestLocation is RequestLocation.Uri or RequestLocation.Path or RequestLocation.Body && type.EqualsIgnoreNullable(typeof(string)) && !skipUrlEncoding)
            {
                return ValidationType.AssertNotNullOrEmpty;
            }

            if (!type.IsValueType)
            {
                return ValidationType.AssertNotNull;
            }

            return ValidationType.None;
        }

        public static Parameter FromRequestParameter(in RequestParameter requestParameter, CSharpType type, TypeFactory typeFactory, bool shouldKeepClientDefaultValue = false)
        {
            var name = requestParameter.CSharpName();
            var skipUrlEncoding = requestParameter.Extensions?.SkipEncoding ?? false;
            var requestLocation = GetRequestLocation(requestParameter);

            var clientDefaultValue = GetClientDefaultValue(requestParameter, typeFactory);
            bool keepClientDefaultValue = shouldKeepClientDefaultValue || IsApiVersionParameter(requestParameter) || IsContentTypeParameter(requestParameter) || IsEndpointParameter(requestParameter);
            var defaultValue = keepClientDefaultValue
                ? clientDefaultValue ?? ParseConstant(requestParameter, typeFactory)
                : ParseConstant(requestParameter, typeFactory);
            var initializer = (FormattableString?)null;

            if (defaultValue != null && !TypeFactory.CanBeInitializedInline(type, defaultValue))
            {
                initializer = type.GetParameterInitializer(defaultValue.Value);
                type = type.WithNullable(true);
                defaultValue = Constant.Default(type);
            }

            if (!requestParameter.IsRequired && defaultValue == null)
            {
                defaultValue = Constant.Default(type);
            }

            var validation = requestParameter.IsRequired && initializer == null
                ? GetValidation(type, requestLocation, skipUrlEncoding)
                : ValidationType.None;

            var inputType = TypeFactory.GetInputType(type);
            return new Parameter(
                name,
                CreateDescription(requestParameter, inputType, keepClientDefaultValue ? null : clientDefaultValue),
                inputType,
                defaultValue,
                validation,
                initializer,
                IsApiVersionParameter: requestParameter.Origin == "modelerfour:synthesized/api-version",
                IsEndpoint: IsEndpointParameter(requestParameter),
                IsResourceIdentifier: requestParameter.IsResourceParameter,
                SkipUrlEncoding: skipUrlEncoding,
                RequestLocation: requestLocation);
            static bool IsApiVersionParameter(RequestParameter requestParameter)
                => requestParameter.Origin == "modelerfour:synthesized/api-version";
            static bool IsEndpointParameter(RequestParameter requestParameter)
                => requestParameter.Origin == "modelerfour:synthesized/host";
            static bool IsContentTypeParameter(RequestParameter requestParameter)
                => requestParameter.Origin == "modelerfour:synthesized/content-type";
        }

        private static RequestLocation GetRequestLocation(RequestParameter requestParameter)
            => requestParameter.In switch
            {
                HttpParameterIn.Uri => RequestLocation.Uri,
                HttpParameterIn.Path => RequestLocation.Path,
                HttpParameterIn.Query => RequestLocation.Query,
                HttpParameterIn.Header => RequestLocation.Header,
                HttpParameterIn.Body => RequestLocation.Body,
                _ => RequestLocation.None
            };

        private static FormattableString CreateDescription(RequestParameter requestParameter, CSharpType type, Constant? defaultValue = null)
        {
            FormattableString description = string.IsNullOrWhiteSpace(requestParameter.Language.Default.Description) ?
                (FormattableString)$"The {type:C} to use." :
                $"{BuilderHelpers.EscapeXmlDocDescription(requestParameter.Language.Default.Description)}";
            if (defaultValue != null)
            {
                var defaultValueString = defaultValue?.Value is string s ? $"\"{s}\"" : $"{defaultValue?.Value}";
                description = $"{description}{(description.ToString().EndsWith(".") ? "" : ".")} The default value is {defaultValueString}";
            }

            return requestParameter.Schema switch
            {
                ChoiceSchema choiceSchema when type.IsFrameworkType => AddAllowedValues(description, choiceSchema.Choices),
                SealedChoiceSchema sealedChoiceSchema when type.IsFrameworkType => AddAllowedValues(description, sealedChoiceSchema.Choices),
                _ => description
            };

            static FormattableString AddAllowedValues(FormattableString description, ICollection<ChoiceValue> choices)
            {
                var allowedValues = string.Join(" | ", choices.Select(c => c.Value).Select(v => $"\"{v}\""));

                return string.IsNullOrEmpty(allowedValues)
                    ? description
                    : $"{description}{(description.ToString().EndsWith(".") ? "" : ".")} Allowed values: {BuilderHelpers.EscapeXmlDocDescription(allowedValues)}";
            }
        }

        private static Constant? GetClientDefaultValue(RequestParameter parameter, TypeFactory typeFactory)
        {
            if (parameter.ClientDefaultValue != null)
            {
                CSharpType constantTypeReference = typeFactory.CreateType(parameter.Schema, parameter.IsNullable);
                return BuilderHelpers.ParseConstant(parameter.ClientDefaultValue, constantTypeReference);
            }

            return null;
        }

        private static Constant? ParseConstant(RequestParameter parameter, TypeFactory typeFactory)
        {
            if (parameter.In == HttpParameterIn.Header && RequestHeader.ClientRequestIdHeaders.Contains(parameter.Language.Default.SerializedName ?? parameter.Language.Default.Name))
            {
                return Constant.FromExpression($"message.{Configuration.ApiTypes.HttpMessageRequestName}.ClientRequestId", new CSharpType(typeof(string)));
            }
            if (parameter.In == HttpParameterIn.Header && RequestHeader.ReturnClientRequestIdResponseHeaders.Contains(parameter.Language.Default.SerializedName ?? parameter.Language.Default.Name))
            {
                return new Constant("true", new CSharpType(typeof(string)));
            }
            if (parameter.Schema is ConstantSchema constantSchema && parameter.IsRequired)
            {
                return BuilderHelpers.ParseConstant(constantSchema.Value.Value, typeFactory.CreateType(constantSchema.ValueType, constantSchema.Value.Value == null));
            }

            return null;
        }

        public static readonly IEqualityComparer<Parameter> EqualityComparerByType = new ParameterByTypeEqualityComparer();
        private struct ParameterByTypeEqualityComparer : IEqualityComparer<Parameter>
        {
            public bool Equals(Parameter? x, Parameter? y)
            {
                return Object.Equals(x?.Type, y?.Type);
            }

            public int GetHashCode([DisallowNull] Parameter obj) => obj.Type.GetHashCode();
        }

        private class ParameterTypeAndNameEqualityComparer : IEqualityComparer<Parameter>
        {
            public bool Equals(Parameter? x, Parameter? y)
            {
                if (Object.ReferenceEquals(x, y))
                {
                    return true;
                }

                if (x is null || y is null)
                {
                    return false;
                }

                // We can't use CsharpType.Equals here because they can have different implementations from different versions
                var result = x.Type.EqualsByName(y.Type) && x.Name == y.Name;
                return result;
            }

            public int GetHashCode([DisallowNull] Parameter obj)
            {
                // remove type as part of the hash code generation as the type might have changes between versions
                return HashCode.Combine(obj.Name);
            }
        }
    }

    internal enum ValidationType
    {
        None,
        AssertNotNull,
        AssertNotNullOrEmpty
    }
}
