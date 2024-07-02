// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Input;

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

            IsExtensible = input.IsExtensible;
            Name = input.Name.ToCleanName();
            Namespace = GetDefaultModelNamespace(CodeModelPlugin.Instance.Configuration.Namespace);
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
        public override string RelativeFilePath => Path.Combine("src", "Generated", "Models", $"{Name}.cs");
        public override string Name { get; }
        public override string Namespace { get; }
        protected override FormattableString Description { get; }

        public IReadOnlyList<EnumTypeMember> Members => _members ??= BuildMembers();

        protected abstract IReadOnlyList<EnumTypeMember> BuildMembers();

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return CodeModelPlugin.Instance.TypeFactory.GetSerializationTypeProviders(this, _inputType).ToArray();
        }
    }
}
