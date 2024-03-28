// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Types;
using Microsoft.CodeAnalysis;

namespace AutoRest.CSharp.Generation.Writers
{
    internal class ModelWriter
    {
        public void WriteModel(CodeWriter writer, TypeProvider model)
        {
            switch (model)
            {
                case ObjectType objectSchema:
                    WriteObjectSchema(writer, objectSchema);
                    break;
                case EnumType { IsExtensible: true } e:
                    WriteExtensibleEnum(writer, e);
                    break;
                case EnumType { IsExtensible: false } e:
                    WriteEnum(writer, e);
                    break;
                default:
                    throw new NotImplementedException();
            }
        }

        private void WriteObjectSchema(CodeWriter writer, ObjectType schema)
        {
            using (writer.Namespace(schema.Declaration.Namespace))
            {
                List<CSharpType> implementsTypes = new List<CSharpType>();
                if (schema.Inherits != null)
                {
                    implementsTypes.Add(schema.Inherits);
                }

                writer.WriteXmlDocumentationSummary($"{schema.Description}");
                AddClassAttributes(writer, schema);

                if (schema.IsStruct)
                {
                    writer.Append($"{schema.Declaration.Accessibility} readonly partial struct {schema.Declaration.Name}");
                }
                else
                {
                    writer.Append($"{schema.Declaration.Accessibility} {GetAbstract(schema)}partial class {schema.Declaration.Name}");
                }

                if (implementsTypes.Any())
                {
                    writer.AppendRaw(" : ");
                    foreach (var type in implementsTypes)
                    {
                        writer.Append($"{type} ,");
                    }
                    writer.RemoveTrailingComma();
                }

                writer.Line();
                using (writer.Scope())
                {
                    WritePrivateRawDataField(writer, schema);

                    WriteConstructor(writer, schema);

                    WriteProperties(writer, schema);
                }
            }
        }

        protected virtual void WriteProperties(CodeWriter writer, ObjectType schema)
        {
            var rawDataField = (schema as SerializableObjectType)?.RawDataField;
            foreach (var property in schema.Properties)
            {
                if (property == rawDataField)
                    continue;

                WriteProperty(writer, property, schema);

                if (property.FlattenedProperty != null)
                    WriteProperty(writer, property.FlattenedProperty, schema);
            }
        }

        // TODO -- this is workaround because we are declaring fields and properties in different way, and this raw data field and AdditionalProperties property could be converted from each other.
        private void WritePrivateRawDataField(CodeWriter writer, ObjectType schema)
        {
            if ((schema as SerializableObjectType)?.RawDataField is not { } rawDataField)
                return;

            writer.WriteXmlDocumentationSummary($"{rawDataField.Description}");
            writer.Append($"{rawDataField.Declaration.Accessibility} ")
                .AppendRawIf("readonly ", schema.IsStruct)
                .Line($"{rawDataField.Declaration.Type} {rawDataField.Declaration.Name};");

            writer.Line();
        }

        private void WriteFieldModifiers(CodeWriter writer, FieldModifiers modifiers)
        {
            writer.AppendRawIf("public ", modifiers.HasFlag(FieldModifiers.Public))
                .AppendRawIf("internal ", modifiers.HasFlag(FieldModifiers.Internal))
                .AppendRawIf("protected ", modifiers.HasFlag(FieldModifiers.Protected))
                .AppendRawIf("private ", modifiers.HasFlag(FieldModifiers.Private))
                .AppendRawIf("static ", modifiers.HasFlag(FieldModifiers.Static))
                .AppendRawIf("readonly ", modifiers.HasFlag(FieldModifiers.ReadOnly))
                .AppendRawIf("const ", modifiers.HasFlag(FieldModifiers.Const));
        }

        private void WriteProperty(CodeWriter writer, ObjectTypeProperty property, ObjectType objectType)
        {
            writer.WriteXmlDocumentationSummary(CreatePropertyDescription(property));
            if (Configuration.EnableBicepSerialization && objectType.Declaration.Accessibility == "public" && property.Declaration.Accessibility == "public")
            {
                string? wrapper = property.SchemaProperty?.FlattenedNames?.FirstOrDefault();
                wrapper = wrapper is null ? string.Empty : $"{wrapper}.";
                writer.Line($"[WirePath(\"{wrapper}{property.SerializedName}\")]");
            }
            writer.Append($"{property.Declaration.Accessibility} {property.Declaration.Type} {property.Declaration.Name:D}");

            // write getter
            writer.AppendRaw("{");
            if (property.GetterModifiers is { } getterModifiers)
                WriteFieldModifiers(writer, getterModifiers);
            writer.AppendRaw("get;");
            // writer setter
            if (!property.IsReadOnly)
            {
                if (property.SetterModifiers is { } setterModifiers)
                    WriteFieldModifiers(writer, setterModifiers);
                writer.AppendRaw("set;");
            }
            writer.AppendRaw("}");
            if (property.InitializationValue != null)
            {
                writer.AppendRaw(" = ");
                writer.WriteValueExpression(property.InitializationValue);
                writer.Line($";");
            }

            writer.Line();
        }

        private void WriteProperty(CodeWriter writer, FlattenedObjectTypeProperty property, ObjectType objectType)
        {
            writer.WriteXmlDocumentationSummary(CreatePropertyDescription(property));
            if (Configuration.EnableBicepSerialization && objectType.Declaration.Accessibility == "public" && property.Declaration.Accessibility == "public")
            {
                string? wrapper = property.UnderlyingProperty.SchemaProperty?.FlattenedNames?.FirstOrDefault();
                wrapper = wrapper is null ? string.Empty : $"{wrapper}.";
                writer.Line($"[WirePath(\"{wrapper}{property.SerializedName}\")]");
            }
            using (writer.Scope($"{property.Declaration.Accessibility} {property.Declaration.Type} {property.Declaration.Name:D}"))
            {
                // write getter
                switch (property.IncludeGetterNullCheck)
                {
                    case true:
                        WriteGetWithNullCheck(writer, property);
                        break;
                    case false:
                        WriteGetWithDefault(writer, property);
                        break;
                    default:
                        WriteGetWithEscape(writer, property);
                        break;
                }

                // only write the setter when it is not readonly
                if (!property.IsReadOnly)
                {
                    if (property.IncludeSetterNullCheck)
                    {
                        WriteSetWithNullCheck(writer, property);
                    }
                    else
                    {
                        WriteSetWithSingleParamCtor(writer, property);
                    }
                }
            }

            writer.Line();
        }

        private static void WriteSetWithNullCheck(CodeWriter writer, FlattenedObjectTypeProperty property)
        {
            var underlyingName = property.UnderlyingProperty.Declaration.Name;
            var underlyingType = property.UnderlyingProperty.Declaration.Type;
            using (writer.Scope($"set"))
            {
                if (property.IsOverriddenValueType)
                {
                    using (writer.Scope($"if (value.HasValue)"))
                    {
                        writer.Line($"if ({underlyingName} is null)");
                        writer.Line($"{underlyingName} = new {underlyingType}();");
                        writer.Line($"{underlyingName}.{property.ChildPropertyName} = value.Value;");
                    }
                    using (writer.Scope($"else"))
                    {
                        writer.Line($"{underlyingName} = null;");
                    }
                }
                else
                {
                    writer.Line($"if ({underlyingName} is null)");
                    writer.Line($"{underlyingName} = new {underlyingType}();");
                    writer.Line($"{underlyingName}.{property.ChildPropertyName} = value;");
                }
            }
        }

        private static void WriteSetWithSingleParamCtor(CodeWriter writer, FlattenedObjectTypeProperty property)
        {
            var underlyingName = property.UnderlyingProperty.Declaration.Name;
            var underlyingType = property.UnderlyingProperty.Declaration.Type;
            if (property.IsOverriddenValueType)
            {
                using (writer.Scope($"set"))
                {
                    writer.Line($"{underlyingName} = value.HasValue ? new {underlyingType}(value.Value) : null;");
                }
            }
            else
            {
                writer.Line($"set => {underlyingName} = new {underlyingType}(value);");
            }
        }

        private static void WriteGetWithNullCheck(CodeWriter writer, FlattenedObjectTypeProperty property)
        {
            var underlyingName = property.UnderlyingProperty.Declaration.Name;
            var underlyingType = property.UnderlyingProperty.Declaration.Type;
            using (writer.Scope($"get"))
            {
                writer.Line($"if ({underlyingName} is null)");
                writer.Line($"{underlyingName} = new {underlyingType}();");
                writer.Line($"return {underlyingName:D}.{property.ChildPropertyName};");
            }
        }

        private static void WriteGetWithDefault(CodeWriter writer, FlattenedObjectTypeProperty property)
        {
            writer.Line($"get => {property.UnderlyingProperty.Declaration.Name:I} is null ? default({property.Declaration.Type}) : {property.UnderlyingProperty.Declaration.Name}.{property.ChildPropertyName};");
        }

        private static void WriteGetWithEscape(CodeWriter writer, FlattenedObjectTypeProperty property)
        {
            writer.Append($"get => {property.UnderlyingProperty.Declaration.Name}")
                .AppendRawIf("?", property.IsUnderlyingPropertyNullable)
                .Line($".{property.ChildPropertyName};");
        }

        private FormattableString CreatePropertyDescription(ObjectTypeProperty property, string? overrideName = null)
        {
            if (!string.IsNullOrWhiteSpace(property.PropertyDescription.ToString()))
            {
                return $"{property.PropertyDescription}";
            }
            return $"{ObjectTypeProperty.CreateDefaultPropertyDescription(overrideName ?? property.Declaration.Name, property.IsReadOnly)}";
        }

        private string GetAbstract(ObjectType schema)
        {
            // Limit this change to management plane to avoid data plane affected
            return schema.Declaration.IsAbstract ? "abstract " : string.Empty;
        }

        protected virtual void AddClassAttributes(CodeWriter writer, ObjectType schema)
        {
            if (schema.Deprecated != null)
            {
                writer.Line($"[{typeof(ObsoleteAttribute)}(\"{schema.Deprecated}\")]");
            }
        }

        private void AddClassAttributes(CodeWriter writer, EnumType enumType)
        {
            if (enumType.Deprecated != null)
            {
                writer.Line($"[{typeof(ObsoleteAttribute)}(\"{enumType.Deprecated}\")]");
            }
        }

        protected virtual void AddCtorAttribute(CodeWriter writer, ObjectType schema, ObjectTypeConstructor constructor)
        {
        }

        private void WriteConstructor(CodeWriter writer, ObjectType schema)
        {
            foreach (var constructor in schema.Constructors)
            {
                writer.WriteMethodDocumentation(constructor.Signature);
                AddCtorAttribute(writer, schema, constructor);
                using (writer.WriteMethodDeclaration(constructor.Signature))
                {
                    writer.WriteParametersValidation(constructor.Signature.Parameters);

                    foreach (var initializer in constructor.Initializers)
                    {
                        writer.Append($"{initializer.Property.Declaration.Name} = ")
                            .WriteReferenceOrConstant(initializer.Value)
                            .WriteConversion(initializer.Value.Type, initializer.Property.Declaration.Type);

                        if (initializer.DefaultValue != null && (!initializer.Value.Type.IsValueType || initializer.Value.Type.IsNullable))
                        {
                            writer.Append($"?? ").WriteReferenceOrConstant(initializer.DefaultValue.Value);
                        }

                        writer.Line($";");
                    }
                }
                writer.Line();
            }
        }

        public void WriteEnum(CodeWriter writer, EnumType enumType)
        {
            if (enumType.Declaration.IsUserDefined)
            {
                return;
            }

            using (writer.Namespace(enumType.Declaration.Namespace))
            {
                writer.WriteXmlDocumentationSummary($"{enumType.Description}");
                AddClassAttributes(writer, enumType);

                writer.Append($"{enumType.Declaration.Accessibility} enum {enumType.Declaration.Name}")
                    .AppendIf($" : {enumType.ValueType}", enumType.IsIntValueType && !enumType.ValueType.Equals(typeof(int)));
                using (writer.Scope())
                {
                    foreach (EnumTypeValue value in enumType.Values)
                    {
                        writer.WriteXmlDocumentationSummary($"{value.Description}");
                        if (enumType.IsIntValueType)
                        {
                            writer.Line($"{value.Declaration.Name} = {value.Value.Value:L},");
                        }
                        else
                        {
                            writer.Line($"{value.Declaration.Name},");
                        }
                    }
                    writer.RemoveTrailingComma();
                }
            }
        }

        public void WriteExtensibleEnum(CodeWriter writer, EnumType enumType)
        {
            var cs = enumType.Type;
            string name = enumType.Declaration.Name;
            var isString = enumType.ValueType.FrameworkType == typeof(string);

            using (writer.Namespace(enumType.Declaration.Namespace))
            {
                writer.WriteXmlDocumentationSummary($"{enumType.Description}");
                AddClassAttributes(writer, enumType);

                var implementType = new CSharpType(typeof(IEquatable<>), cs);
                using (writer.Scope($"{enumType.Declaration.Accessibility} readonly partial struct {name}: {implementType}"))
                {
                    writer.Line($"private readonly {enumType.ValueType} _value;");
                    writer.Line();

                    writer.WriteXmlDocumentationSummary($"Initializes a new instance of {name:C}.");

                    if (isString)
                    {
                        writer.WriteXmlDocumentationException(typeof(ArgumentNullException), $"<paramref name=\"value\"/> is null.");
                    }

                    using (writer.Scope($"public {name}({enumType.ValueType} value)"))
                    {
                        writer.Append($"_value = value");
                        if (isString)
                        {
                            writer.Append($"?? throw new {typeof(ArgumentNullException)}(nameof(value))");
                        }
                        writer.Line($";");
                    }
                    writer.Line();

                    foreach (var choice in enumType.Values)
                    {
                        var fieldName = GetValueFieldName(name, choice.Declaration.Name, enumType.Values);
                        writer.Line($"private const {enumType.ValueType} {fieldName} = {choice.Value.Value:L};");
                    }
                    writer.Line();

                    foreach (var choice in enumType.Values)
                    {
                        writer.WriteXmlDocumentationSummary($"{choice.Description}");
                        var fieldName = GetValueFieldName(name, choice.Declaration.Name, enumType.Values);
                        writer.Append($"public static {cs} {choice.Declaration.Name}").AppendRaw("{ get; }").Append($" = new {cs}({fieldName});").Line();
                    }

                    // write ToSerial method, only write when the underlying type is not a string
                    if (!enumType.IsStringValueType)
                    {
                        writer.Line();
                        writer.Line($"internal {enumType.ValueType} {enumType.SerializationMethodName}() => _value;");
                        writer.Line();
                    }

                    writer.WriteXmlDocumentationSummary($"Determines if two {name:C} values are the same.");
                    writer.Line($"public static bool operator ==({cs} left, {cs} right) => left.Equals(right);");

                    writer.WriteXmlDocumentationSummary($"Determines if two {name:C} values are not the same.");
                    writer.Line($"public static bool operator !=({cs} left, {cs} right) => !left.Equals(right);");

                    writer.WriteXmlDocumentationSummary($"Converts a string to a {name:C}.");
                    writer.Line($"public static implicit operator {cs}({enumType.ValueType} value) => new {cs}(value);");
                    writer.Line();

                    writer.WriteXmlDocumentationInheritDoc();
                    WriteEditorBrowsableFalse(writer);
                    writer.Line($"public override bool Equals({typeof(object)} obj) => obj is {cs} other && Equals(other);");

                    writer.WriteXmlDocumentationInheritDoc();
                    writer.Append($"public bool Equals({cs} other) => ");
                    if (isString)
                    {
                        writer.Line($"{enumType.ValueType}.Equals(_value, other._value, {typeof(StringComparison)}.InvariantCultureIgnoreCase);");
                    }
                    else
                    {
                        writer.Line($"{enumType.ValueType}.Equals(_value, other._value);");
                    }
                    writer.Line();

                    writer.WriteXmlDocumentationInheritDoc();
                    WriteEditorBrowsableFalse(writer);
                    writer.Append($"public override int GetHashCode() => ");
                    if (isString)
                    {
                        writer.Line($"_value?.GetHashCode() ?? 0;");
                    }
                    else
                    {
                        writer.Line($"_value.GetHashCode();");
                    }

                    writer.WriteXmlDocumentationInheritDoc();
                    writer.Append($"public override {typeof(string)} ToString() => ");

                    if (isString)
                    {
                        writer.Line($"_value;");
                    }
                    else
                    {
                        writer.Line($"_value.ToString({typeof(CultureInfo)}.InvariantCulture);");
                    }
                }
            }
        }

        private static string GetValueFieldName(string enumName, string enumValue, IList<EnumTypeValue> enumValues)
        {
            if (enumName != $"{enumValue}Value")
            {
                return $"{enumValue}Value";
            }

            int index = 1;
            foreach (var value in enumValues)
            {
                if (value.Declaration.Name == $"{enumValue}Value{index}")
                {
                    index++;
                }
            }
            return $"{enumValue}Value{index}";
        }

        private static void WriteEditorBrowsableFalse(CodeWriter writer)
        {
            writer.Line($"[{typeof(EditorBrowsableAttribute)}({typeof(EditorBrowsableState)}.{nameof(EditorBrowsableState.Never)})]");
        }
    }
}
