// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Providers
{
    internal abstract class EnumProvider : TypeProvider
    {
        private readonly InputEnumType _inputType;

        public static EnumProvider Create(InputEnumType input)
            => input.IsExtensible
            ? new ExtensibleEnumProvider(input)
            : new FixedEnumProvider(input);

        protected EnumProvider(InputEnumType input)
        {
            _inputType = input;
            _deprecated = input.Deprecated;

            IsExtensible = input.IsExtensible;
            MemberValueType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(input.ValueType);
            IsStringValueType = MemberValueType.Equals(typeof(string));
            IsIntValueType = MemberValueType.Equals(typeof(int)) || MemberValueType.Equals(typeof(long));
            IsFloatValueType = MemberValueType.Equals(typeof(float)) || MemberValueType.Equals(typeof(double));
            IsNumericValueType = IsIntValueType || IsFloatValueType;

            Description = input.Description != null ? FormattableStringHelpers.FromString(input.Description) : $"The {Name}.";
        }

        public CSharpType MemberValueType { get; } // Each member in the EnumProvider has to have this type
        public bool IsExtensible { get; }
        internal bool IsIntValueType { get; }
        internal bool IsFloatValueType { get; }
        internal bool IsStringValueType { get; }
        internal bool IsNumericValueType { get; }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override string BuildName() => _inputType.Name.ToCleanName();
        protected override FormattableString Description { get; }

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return CodeModelPlugin.Instance.GetSerializationTypeProviders(_inputType).ToArray();
        }
        protected override string GetNamespace() => CodeModelPlugin.Instance.Configuration.ModelNamespace;

        protected override bool GetIsEnum() => true;
    }
}
