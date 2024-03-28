// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Utilities;
using Microsoft.CodeAnalysis;
using Microsoft.VisualBasic.FileIO;
using static AutoRest.CSharp.Output.Models.FieldModifiers;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal sealed class ModelTypeProviderFields : IReadOnlyCollection<FieldDeclaration>
    {
        private readonly IReadOnlyList<FieldDeclaration> _fields;
        private readonly IReadOnlyDictionary<FieldDeclaration, InputModelProperty> _fieldsToInputs;
        // parameter name should be unique since it's bound to field property
        private readonly IReadOnlyDictionary<string, FieldDeclaration> _parameterNamesToFields;

        public IReadOnlyList<Parameter> PublicConstructorParameters { get; }
        public IReadOnlyList<Parameter> SerializationParameters { get; }
        public int Count => _fields.Count;
        public FieldDeclaration? AdditionalProperties { get; }

        public ModelTypeProviderFields(InputModelType inputModel, CSharpType modelType, TypeFactory typeFactory, ModelTypeMapping? modelTypeMapping, bool isStruct)
        {
            var fields = new List<FieldDeclaration>();
            var fieldsToInputs = new Dictionary<FieldDeclaration, InputModelProperty>();
            var publicParameters = new List<Parameter>();
            var serializationParameters = new List<Parameter>();
            var parametersToFields = new Dictionary<string, FieldDeclaration>();

            var visitedMembers = new HashSet<ISymbol>(SymbolEqualityComparer.Default);

            foreach (var inputModelProperty in inputModel.Properties)
            {
                var originalFieldName = BuilderHelpers.DisambiguateName(modelType, inputModelProperty.Name.ToCleanName(), "Property");
                var propertyType = GetPropertyDefaultType(inputModel.Usage, inputModelProperty, typeFactory);

                // We represent property being optional by making it nullable (when it is a value type)
                // Except in the case of collection where there is a special handling
                var optionalViaNullability = inputModelProperty is { IsRequired: false, Type.IsNullable: false } &&
                                             !TypeFactory.IsCollectionType(propertyType);

                var existingMember = modelTypeMapping?.GetMemberByOriginalName(originalFieldName);

                var field = existingMember is not null
                    ? CreateFieldFromExisting(existingMember, propertyType, inputModelProperty, typeFactory, optionalViaNullability)
                    : CreateField(originalFieldName, propertyType, inputModel, inputModelProperty, isStruct, optionalViaNullability);

                if (existingMember is not null)
                {
                    visitedMembers.Add(existingMember);
                }

                fields.Add(field);
                fieldsToInputs[field] = inputModelProperty;

                var parameterName = field.Name.ToVariableName();
                var parameterValidation = GetParameterValidation(field, inputModelProperty);
                var parameter = new Parameter(
                    Name: parameterName,
                    Description: FormattableStringHelpers.FromString(BuilderHelpers.EscapeXmlDocDescription(inputModelProperty.Description)),
                    Type: field.Type,
                    DefaultValue: null,
                    Validation: parameterValidation,
                    Initializer: null);
                parametersToFields[parameter.Name] = field;
                // all properties should be included in the serialization ctor
                serializationParameters.Add(parameter with { Validation = ValidationType.None });

                // for classes, only required + not readonly + not constant + not discriminator could get into the public ctor
                // for structs, all properties must be set in the public ctor
                if (isStruct || inputModelProperty is { IsRequired: true, IsDiscriminator: false, IsReadOnly: false, Type: not InputLiteralType })
                {
                    publicParameters.Add(parameter with { Type = TypeFactory.GetInputType(parameter.Type) });
                }
            }

            if (inputModel.InheritedDictionaryType is { } additionalPropertiesType)
            {
                // We use a $ prefix here as AdditionalProperties comes from a swagger concept
                // and not a swagger model/operation name to disambiguate from a possible property with
                // the same name.
                var existingMember = modelTypeMapping?.GetMemberByOriginalName("$AdditionalProperties");

                var type = typeFactory.CreateType(additionalPropertiesType);
                if (!inputModel.Usage.HasFlag(InputModelTypeUsage.Input))
                {
                    type = TypeFactory.GetOutputType(type);
                }

                var name = existingMember is null ? "AdditionalProperties" : existingMember.Name;
                var declaration = new CodeWriterDeclaration(name);
                declaration.SetActualName(name);

                var accessModifiers = existingMember is null ? Public : GetAccessModifiers(existingMember);

                var additionalPropertiesField = new FieldDeclaration($"Additional Properties", accessModifiers | ReadOnly, type, type, declaration, null, false, Serialization.SerializationFormat.Default, true);
                var additionalPropertiesParameter = new Parameter(name.ToVariableName(), $"Additional Properties", type, null, ValidationType.None, null);

                // we intentionally do not add this field into the field list to avoid cyclic references
                serializationParameters.Add(additionalPropertiesParameter);
                if (isStruct)
                {
                    publicParameters.Add(additionalPropertiesParameter with { Validation = ValidationType.AssertNotNull });
                }

                parametersToFields[additionalPropertiesParameter.Name] = additionalPropertiesField;

                AdditionalProperties = additionalPropertiesField;
            }

            // adding the leftover members from the source type
            if (modelTypeMapping is not null)
            {
                foreach (var existingMember in modelTypeMapping.GetPropertiesWithSerialization())
                {
                    if (visitedMembers.Contains(existingMember))
                    {
                        continue;
                    }
                    var existingCSharpType = BuilderHelpers.GetTypeFromExisting(existingMember, typeof(object), typeFactory);
                    var isReadOnly = IsReadOnly(existingMember);
                    var inputModelProperty = new InputModelProperty(existingMember.Name, existingMember.Name, "to be removed by post process", GetInputTypeFromExistingMemberType(existingCSharpType), false, isReadOnly, false);
                    // we put the original type typeof(object) here as fallback. We do not really care about what type we get here, just to ensure there is a type generated
                    // therefore the top type here is reasonable
                    // the serialization will be generated for this type and it might has issues if the type is not recognized properly.
                    // but customer could always use the `CodeGenMemberSerializationHooks` attribute to override those incorrect serialization/deserialization code.
                    var field = CreateFieldFromExisting(existingMember, existingCSharpType, inputModelProperty, typeFactory, false);
                    var parameter = new Parameter(field.Name.ToVariableName(), $"to be removed by post process", field.Type, null, ValidationType.None, null);
                    fields.Add(field);
                    fieldsToInputs[field] = inputModelProperty;
                    serializationParameters.Add(parameter);
                }
            }

            _fields = fields;
            _fieldsToInputs = fieldsToInputs;
            _parameterNamesToFields = parametersToFields;

            PublicConstructorParameters = publicParameters;
            SerializationParameters = serializationParameters;
        }

        private static InputType GetInputTypeFromExistingMemberType(CSharpType type)
        {
            if (TypeFactory.IsList(type))
            {
                return new InputListType("Array", GetInputTypeFromExistingMemberType(type.Arguments[0]), false);
            }

            if (TypeFactory.IsDictionary(type))
            {
                return new InputDictionaryType("Dictionary", InputPrimitiveType.String, GetInputTypeFromExistingMemberType(type.Arguments[1]), false);
            }

            return InputPrimitiveType.Object;
        }

        private static ValidationType GetParameterValidation(FieldDeclaration field, InputModelProperty inputModelProperty)
        {
            // we do not validate a parameter when it is a value type (struct or int, etc)
            if (field.Type.IsValueType)
            {
                return ValidationType.None;
            }

            // or it is readonly
            if (inputModelProperty.IsReadOnly)
            {
                return ValidationType.None;
            }

            // or it is optional
            if (!field.IsRequired)
            {
                return ValidationType.None;
            }

            // or it is nullable
            if (field.Type.IsNullable)
            {
                return ValidationType.None;
            }

            return ValidationType.AssertNotNull;
        }

        public FieldDeclaration GetFieldByParameterName(string parameterName) => _parameterNamesToFields[parameterName];
        public bool TryGetFieldByParameter(Parameter parameter, [MaybeNullWhen(false)] out FieldDeclaration fieldDeclaration) => _parameterNamesToFields.TryGetValue(parameter.Name, out fieldDeclaration);
        public InputModelProperty? GetInputByField(FieldDeclaration field) => _fieldsToInputs.TryGetValue(field, out var property) ? property : null;

        public IEnumerator<FieldDeclaration> GetEnumerator() => _fields.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

        private static bool ShouldPropertyOmitSetter(InputModelType inputModel, InputModelProperty property, CSharpType type, bool isStruct)
        {
            if (property.IsDiscriminator)
            {
                // discriminator properties should be writeable because we need to set values to the discriminators in the public ctor of derived classes.
                return false;
            }

            // a property will not have setter when it is readonly
            if (property.IsReadOnly)
            {
                return true;
            }

            // structs must have all their properties set in constructor therefore no setters
            if (isStruct)
            {
                return true;
            }

            // non-input models do not need setters
            var usage = inputModel.Usage;
            if (!usage.HasFlag(InputModelTypeUsage.Input))
            {
                return true;
            }

            // required constant property does not need setter
            if (property.Type is InputLiteralType && property.IsRequired)
            {
                return true;
            }

            if (TypeFactory.IsCollectionType(type))
            {
                // nullable collection should be settable
                // one exception is in the property bag, we never let them to be settable.
                return !property.Type.IsNullable || inputModel.IsPropertyBag;
            }

            // In mixed models required properties are not readonly
            return property.IsRequired && inputModel.Usage.HasFlag(InputModelTypeUsage.Input) && !inputModel.Usage.HasFlag(InputModelTypeUsage.Output);
        }

        private static FieldDeclaration CreateField(string fieldName, CSharpType originalType, InputModelType inputModel, InputModelProperty inputModelProperty, bool isStruct, bool optionalViaNullability)
        {
            var valueType = originalType;
            if (optionalViaNullability)
            {
                originalType = originalType.WithNullable(true);
            }

            FieldModifiers fieldModifiers;
            FieldModifiers? setterModifiers = null;
            if (inputModelProperty.IsDiscriminator)
            {
                fieldModifiers = Configuration.PublicDiscriminatorProperty ? Public : Internal;
                setterModifiers = Configuration.PublicDiscriminatorProperty ? Internal | Protected : null;
            }
            else
            {
                fieldModifiers = Public;
            }

            if (ShouldPropertyOmitSetter(inputModel, inputModelProperty, originalType, isStruct))
            {
                fieldModifiers |= ReadOnly;
            }

            CodeWriterDeclaration declaration = new CodeWriterDeclaration(fieldName);
            declaration.SetActualName(fieldName);
            return new FieldDeclaration(
                FormattableStringHelpers.FromString(BuilderHelpers.EscapeXmlDocDescription(inputModelProperty.Description)),
                fieldModifiers,
                originalType,
                valueType,
                declaration,
                GetPropertyInitializationValue(originalType, inputModelProperty),
                inputModelProperty.IsRequired,
                SerializationBuilder.GetSerializationFormat(inputModelProperty.Type, valueType),
                OptionalViaNullability: optionalViaNullability,
                IsField: false,
                WriteAsProperty: true,
                SetterModifiers: setterModifiers);
        }

        private static FieldDeclaration CreateFieldFromExisting(ISymbol existingMember, CSharpType originalType, InputModelProperty inputModelProperty, TypeFactory typeFactory, bool optionalViaNullability)
        {
            if (optionalViaNullability)
            {
                originalType = originalType.WithNullable(true);
            }
            var fieldType = BuilderHelpers.GetTypeFromExisting(existingMember, originalType, typeFactory);
            var valueType = fieldType;
            if (optionalViaNullability)
            {
                valueType = valueType.WithNullable(false);
            }

            var fieldModifiers = GetAccessModifiers(existingMember);

            var writeAsProperty = existingMember is IPropertySymbol;
            CodeWriterDeclaration declaration = new CodeWriterDeclaration(existingMember.Name);
            declaration.SetActualName(existingMember.Name);

            return new FieldDeclaration(
                Description: $"Must be removed by post-generation processing,",
                Modifiers: fieldModifiers,
                Type: fieldType,
                ValueType: valueType,
                Declaration: declaration,
                InitializationValue: GetPropertyInitializationValue(originalType, inputModelProperty),
                IsRequired: inputModelProperty.IsRequired,
                SerializationBuilder.GetSerializationFormat(inputModelProperty.Type, valueType),
                IsField: existingMember is IFieldSymbol,
                WriteAsProperty: writeAsProperty,
                OptionalViaNullability: optionalViaNullability);
        }

        private static FieldModifiers GetAccessModifiers(ISymbol symbol) => symbol.DeclaredAccessibility switch
        {
            Accessibility.Public => Public,
            Accessibility.Protected => Protected,
            Accessibility.Internal => Internal,
            Accessibility.Private => Private,
            _ => throw new ArgumentOutOfRangeException()
        };

        private static bool IsReadOnly(ISymbol existingMember) => existingMember switch
        {
            IPropertySymbol propertySymbol => propertySymbol.SetMethod == null,
            IFieldSymbol fieldSymbol => fieldSymbol.IsReadOnly,
            _ => throw new NotSupportedException($"'{existingMember.ContainingType.Name}.{existingMember.Name}' must be either field or property.")
        };

        private static CSharpType GetPropertyDefaultType(in InputModelTypeUsage usage, in InputModelProperty property, TypeFactory typeFactory)
        {
            var propertyType = typeFactory.CreateType(property.Type);

            if (!usage.HasFlag(InputModelTypeUsage.Input) ||
                property.IsReadOnly)
            {
                propertyType = TypeFactory.GetOutputType(propertyType);
            }

            return propertyType;
        }

        private static ValueExpression? GetPropertyInitializationValue(CSharpType propertyType, InputModelProperty inputModelProperty)
        {
            // if the default value is set somewhere else, we just return it.
            if (inputModelProperty.DefaultValue != null)
                return new FormattableStringToExpression(inputModelProperty.DefaultValue);

            // if it is not set, we check if this property is a literal type, and use the literal type as its default value.
            if (inputModelProperty.Type is not InputLiteralType literalType || !inputModelProperty.IsRequired)
            {
                return null;
            }

            var constant = literalType.Value != null ?
                        BuilderHelpers.ParseConstant(literalType.Value, propertyType) :
                        Constant.NewInstanceOf(propertyType);

            return new ConstantExpression(constant);
        }
    }
}
