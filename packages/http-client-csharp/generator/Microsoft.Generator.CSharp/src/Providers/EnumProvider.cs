// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Providers
{
    public abstract class EnumProvider : TypeProvider
    {
        public static EnumProvider Create(InputEnumType input)
            => input.IsExtensible
            ? new ExtensibleEnumProvider(input)
            : new FixedEnumProvider(input);

        protected EnumProvider(InputEnumType input)
        {
            _deprecated = input.Deprecated;

            IsExtensible = input.IsExtensible;
            Name = input.Name.ToCleanName();
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
        protected override FormattableString Description { get; }

        private IReadOnlyList<EnumTypeMember>? _members;
        public IReadOnlyList<EnumTypeMember> Members => _members ??= BuildMembers();

        protected abstract IReadOnlyList<EnumTypeMember> BuildMembers();

        public abstract ValueExpression ToSerial(ValueExpression enumExpression);

        public abstract ValueExpression ToEnum(ValueExpression valueExpression);

        protected override string GetNamespace() => CodeModelPlugin.Instance.Configuration.ModelNamespace;
    }
}
