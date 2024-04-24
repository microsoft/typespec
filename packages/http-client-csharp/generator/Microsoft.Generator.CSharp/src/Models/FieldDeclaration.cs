// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp
{
    public sealed record FieldDeclaration(FormattableString? Description, FieldModifiers Modifiers, CSharpType Type, CSharpType ValueType, string Name, ValueExpression? InitializationValue, bool IsRequired, bool OptionalViaNullability = false, SourcePropertySerializationMapping? SerializationMapping = null)
    {
        public string Accessibility => (Modifiers & FieldModifiers.Public) > 0 ? "public" : "internal";

        public FieldDeclaration(FieldModifiers modifiers, CSharpType type, string name)
            : this(description: null,
                  modifiers: modifiers,
                  type: type,
                  name: name)
        { }

        public FieldDeclaration(FormattableString? description, FieldModifiers modifiers, CSharpType type, string name)
            : this(Description: description,
                  Modifiers: modifiers,
                  Type: type,
                  ValueType: type,
                  Name: name,
                  InitializationValue: null,
                  IsRequired: false)
        { }
    }
}
