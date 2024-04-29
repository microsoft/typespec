// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    // TODO -- we should merge "DefaultValue" and "Initializer" into a single property and make it a ValueExpression
    // we have them both because, not all things could be default value like: void Foo(string name = <default>)
    // the default value of a parameter must be a compile time constant - something is just not.
    // for example sometimes we have default values for `Uri endpoint` parameter, whose default value `new Uri("https://localhost")` is not a compile time constant, and we have to do this:
    // public Client(Uri endpoint = null) { endpoint ??= new Uri("https://localhost"); } to make it work.
    public sealed record Parameter(string Name, FormattableString? Description, CSharpType Type, ValueExpression? DefaultValue, ValidationType Validation, FormattableString? Initializer, bool IsApiVersionParameter = false, bool IsEndpoint = false, bool IsResourceIdentifier = false, bool SkipUrlEncoding = false, RequestLocation RequestLocation = RequestLocation.None, SerializationFormat SerializationFormat = SerializationFormat.Default, bool IsPropertyBag = false, bool IsRef = false, bool IsOut = false)
    {
        internal bool IsRawData { get; init; }
        internal static IEqualityComparer<Parameter> TypeAndNameEqualityComparer = new ParameterTypeAndNameEqualityComparer();
        internal CSharpAttribute[] Attributes { get; init; } = Array.Empty<CSharpAttribute>();
        internal bool IsOptionalInSignature => DefaultValue != null;

        internal Parameter WithRef(bool isRef = true) => IsRef == isRef ? this : this with { IsRef = isRef };
        internal Parameter ToRequired()
        {
            return this with { DefaultValue = null };
        }

        internal static ValidationType GetValidation(CSharpType type, RequestLocation requestLocation, bool skipUrlEncoding)
        {
            if (requestLocation is RequestLocation.Uri or RequestLocation.Path or RequestLocation.Body && type.Equals(typeof(string), ignoreNullable: true) && !skipUrlEncoding)
            {
                return ValidationType.AssertNotNullOrEmpty;
            }

            if (!type.IsValueType)
            {
                return ValidationType.AssertNotNull;
            }

            return ValidationType.None;
        }

        internal static readonly IEqualityComparer<Parameter> EqualityComparerByType = new ParameterByTypeEqualityComparer();

        private struct ParameterByTypeEqualityComparer : IEqualityComparer<Parameter>
        {
            public bool Equals(Parameter? x, Parameter? y)
            {
                return Equals(x?.Type, y?.Type);
            }

            public int GetHashCode([DisallowNull] Parameter obj) => obj.Type.GetHashCode();
        }

        private class ParameterTypeAndNameEqualityComparer : IEqualityComparer<Parameter>
        {
            public bool Equals(Parameter? x, Parameter? y)
            {
                if (ReferenceEquals(x, y))
                {
                    return true;
                }

                if (x is null || y is null)
                {
                    return false;
                }

                var result = x.Type.AreNamesEqual(y.Type) && x.Name == y.Name;
                return result;
            }

            public int GetHashCode([DisallowNull] Parameter obj)
            {
                // remove type as part of the hash code generation as the type might have changes between versions
                return HashCode.Combine(obj.Name);
            }
        }

        // TO-DO: Migrate code from autorest as part of output classes migration : https://github.com/Azure/autorest.csharp/issues/4198
    }
}
