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
        public override string RelativeFilePath
        {
            get => _relativeFilePath ??= Path.Combine("src", "Generated", "Models", $"{Name}.cs");
            protected internal set => _relativeFilePath = value;
        }
        private string? _relativeFilePath;
        public override string Name { get; protected internal set; }
        public override string Namespace { get; protected internal set; }
        protected internal override FormattableString Description { get; internal set; }

        private IReadOnlyList<EnumTypeMember>? _members;
        public IReadOnlyList<EnumTypeMember> Members => _members ??= BuildMembers();

        protected abstract IReadOnlyList<EnumTypeMember> BuildMembers();

        public abstract ValueExpression ToSerial(ValueExpression enumExpression);

        public abstract ValueExpression ToEnum(ValueExpression valueExpression);
    }
}
