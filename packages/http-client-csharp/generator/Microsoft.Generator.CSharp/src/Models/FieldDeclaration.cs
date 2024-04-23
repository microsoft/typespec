// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp
{
    public sealed record FieldDeclaration(FormattableString? Description, FieldModifiers Modifiers, CSharpType Type, CSharpType ValueType, CodeWriterDeclaration Declaration, ValueExpression? InitializationValue, bool IsRequired, SerializationFormat SerializationFormat, bool IsField = false, bool WriteAsProperty = false, bool OptionalViaNullability = false, FieldModifiers? GetterModifiers = null, FieldModifiers? SetterModifiers = null, SourcePropertySerializationMapping? SerializationMapping = null)
    {
        public string Name => Declaration.ActualName;
        public string Accessibility => (Modifiers & FieldModifiers.Public) > 0 ? "public" : "internal";

        public FieldDeclaration(FieldModifiers modifiers, CSharpType type, string name, bool writeAsProperty = false)
            : this(description: null,
                  modifiers: modifiers,
                  type: type,
                  name: name,
                  serializationFormat: SerializationFormat.Default,
                  writeAsProperty: writeAsProperty)
        { }

        public FieldDeclaration(FormattableString description, FieldModifiers modifiers, CSharpType type, string name, ValueExpression? initializationValue = null)
            : this(Description: description,
                  Modifiers: modifiers,
                  Type: type,
                  ValueType: type,
                  Declaration: new CodeWriterDeclaration(name),
                  IsRequired: false,
                  InitializationValue: initializationValue,
                  SerializationFormat: SerializationFormat.Default)
        { }

        public FieldDeclaration(FieldModifiers modifiers, CSharpType type, string name, ValueExpression? initializationValue, SerializationFormat serializationFormat, bool writeAsProperty = false)
            : this(Description: null,
                  Modifiers: modifiers,
                  Type: type,
                  ValueType: type,
                  Declaration: new CodeWriterDeclaration(name),
                  InitializationValue: initializationValue,
                  IsRequired: false,
                  SerializationFormat: serializationFormat,
                  IsField: false,
                  WriteAsProperty: writeAsProperty,
                  GetterModifiers: null,
                  SetterModifiers: null)
        { }

        public FieldDeclaration(FormattableString? description, FieldModifiers modifiers, CSharpType type, string name, SerializationFormat serializationFormat, bool writeAsProperty = false)
            : this(Description: description,
                  Modifiers: modifiers,
                  Type: type,
                  ValueType: type,
                  Declaration: new CodeWriterDeclaration(name),
                  InitializationValue: null,
                  IsRequired: false,
                  SerializationFormat: serializationFormat,
                  IsField: false,
                  WriteAsProperty: writeAsProperty)
        { }
    }
}
