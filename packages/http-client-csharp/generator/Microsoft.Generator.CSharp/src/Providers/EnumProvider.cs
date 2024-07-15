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
    public abstract class EnumProvider : TypeProvider
    {
        private IReadOnlyList<EnumTypeMember>? _members;
        private readonly InputEnumType _inputType;

        public static EnumProvider Create(InputEnumType input)
            => input.IsExtensible
            ? new ExtensibleEnumProvider(input)
            : new FixedEnumProvider(input);

        protected EnumProvider(InputEnumType input)
        {
            _inputType = input;
            _deprecated = input.Deprecated;
            _input = input;

            IsExtensible = input.IsExtensible;
            ValueType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(input.ValueType);
            IsStringValueType = ValueType.Equals(typeof(string));
            IsIntValueType = ValueType.Equals(typeof(int)) || ValueType.Equals(typeof(long));
            IsFloatValueType = ValueType.Equals(typeof(float)) || ValueType.Equals(typeof(double));
            IsNumericValueType = IsIntValueType || IsFloatValueType;

            Description = input.Description != null ? FormattableStringHelpers.FromString(input.Description) : $"The {Name}.";
        }

        public CSharpType ValueType { get; }
        public bool IsExtensible { get; }
        internal bool IsIntValueType { get; }
        internal bool IsFloatValueType { get; }
        internal bool IsStringValueType { get; }
        internal bool IsNumericValueType { get; }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override string BuildName() => _input.Name.ToCleanName();
        protected override FormattableString Description { get; }

        public IReadOnlyList<EnumTypeMember> Members => _members ??= BuildMembers();

        protected abstract IReadOnlyList<EnumTypeMember> BuildMembers();

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return CodeModelPlugin.Instance.GetSerializationTypeProviders(this, _inputType).ToArray();
        }
        protected override string GetNamespace() => CodeModelPlugin.Instance.Configuration.ModelNamespace;

        protected override bool GetIsEnum() => true;
    }
}
