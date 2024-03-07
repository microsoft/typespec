// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Output.Models.Serialization;
using Azure.ResourceManager.Models;

namespace AutoRest.CSharp.Output.Models.Types
{
    [DebuggerDisplay("Name: {Declaration.Name}, Type: {Declaration.Type}")]
    internal class ObjectTypeProperty
    {
        public ObjectTypeProperty(FieldDeclaration field, InputModelProperty? inputModelProperty)
            : this(declaration: new MemberDeclarationOptions(field.Accessibility, field.Name, field.Type),
                  parameterDescription: field.Description?.ToString() ?? string.Empty,
                  isReadOnly: field.Modifiers.HasFlag(FieldModifiers.ReadOnly),
                  schemaProperty: null,
                  isRequired: field.IsRequired,
                  valueType: field.ValueType,
                  inputModelProperty: inputModelProperty,
                  optionalViaNullability: field.OptionalViaNullability,
                  getterModifiers: field.GetterModifiers,
                  setterModifiers: field.SetterModifiers,
                  serializationFormat: field.SerializationFormat)
        {
            InitializationValue = field.InitializationValue;
        }

        public ObjectTypeProperty(MemberDeclarationOptions declaration, string parameterDescription, bool isReadOnly, Property? schemaProperty, CSharpType? valueType = null, bool optionalViaNullability = false)
            : this(declaration, parameterDescription, isReadOnly, schemaProperty, schemaProperty?.IsRequired ?? false, valueType: valueType, optionalViaNullability: optionalViaNullability)
        {
        }

        private ObjectTypeProperty(MemberDeclarationOptions declaration, string parameterDescription, bool isReadOnly, Property? schemaProperty, bool isRequired, CSharpType? valueType = null, bool optionalViaNullability = false, InputModelProperty? inputModelProperty = null, bool isFlattenedProperty = false, FieldModifiers? getterModifiers = null, FieldModifiers? setterModifiers = null, SerializationFormat serializationFormat = SerializationFormat.Default)
        {
            IsReadOnly = isReadOnly;
            SchemaProperty = schemaProperty;
            OptionalViaNullability = optionalViaNullability;
            ValueType = valueType ?? declaration.Type;
            Declaration = declaration;
            IsRequired = isRequired;
            InputModelProperty = inputModelProperty;
            _baseParameterDescription = parameterDescription;
            SerializationFormat = serializationFormat;
            FormattedDescription = CreatePropertyDescription(parameterDescription, isReadOnly);
            Description = FormattedDescription.ToString();
            IsFlattenedProperty = isFlattenedProperty;
            GetterModifiers = getterModifiers;
            SetterModifiers = setterModifiers;
        }

        public ObjectTypeProperty MarkFlatten()
        {
            var newDeclaration = new MemberDeclarationOptions("internal", Declaration.Name, Declaration.Type);

            return new ObjectTypeProperty(
                newDeclaration,
                _baseParameterDescription,
                IsReadOnly,
                SchemaProperty,
                IsRequired,
                valueType: ValueType,
                optionalViaNullability: OptionalViaNullability,
                inputModelProperty: InputModelProperty,
                isFlattenedProperty: true);
        }

        public SerializationFormat SerializationFormat { get; }

        public ValueExpression? InitializationValue { get; }

        public virtual string SerializedName => SchemaProperty?.SerializedName ?? InputModelProperty?.SerializedName ?? Declaration.Name;

        private bool IsFlattenedProperty { get; }

        private FlattenedObjectTypeProperty? _flattenedProperty;
        public FlattenedObjectTypeProperty? FlattenedProperty => EnsureFlattenedProperty();

        private FlattenedObjectTypeProperty? EnsureFlattenedProperty()
        {
            if (IsFlattenedProperty && _flattenedProperty == null)
            {
                var hierarchyStack = FlattenedObjectTypeProperty.GetHierarchyStack(this);
                // we can only get in this method when the property has a single property type, therefore the hierarchy stack here is guaranteed to have at least two values
                var innerProperty = hierarchyStack.Pop();
                var immediateParentProperty = hierarchyStack.Pop();

                var myPropertyName = FlattenedObjectTypeProperty.GetCombinedPropertyName(innerProperty, immediateParentProperty);
                var childPropertyName = this.Equals(immediateParentProperty) ? innerProperty.Declaration.Name : myPropertyName;

                var propertyType = innerProperty.Declaration.Type;

                var isOverriddenValueType = innerProperty.Declaration.Type.IsValueType && !innerProperty.Declaration.Type.IsNullable;
                if (isOverriddenValueType)
                    propertyType = propertyType.WithNullable(isOverriddenValueType);

                var declaration = new MemberDeclarationOptions(innerProperty.Declaration.Accessibility, myPropertyName, propertyType);

                // determines whether this property should has a setter
                var (isReadOnly, includeGetterNullCheck, includeSetterNullCheck) = FlattenedObjectTypeProperty.GetFlags(this, innerProperty);

                _flattenedProperty = new FlattenedObjectTypeProperty(declaration, innerProperty._baseParameterDescription, this, isReadOnly, includeGetterNullCheck, includeSetterNullCheck, childPropertyName, isOverriddenValueType);
            }

            return _flattenedProperty;
        }

        public virtual Stack<ObjectTypeProperty> BuildHierarchyStack()
        {
            if (FlattenedProperty != null)
                return FlattenedProperty.BuildHierarchyStack();

            var stack = new Stack<ObjectTypeProperty>();
            stack.Push(this);

            return stack;
        }

        public static FormattableString CreateDefaultPropertyDescription(string nameToUse, bool isReadOnly)
        {
            String splitDeclarationName = string.Join(" ", Utilities.StringExtensions.SplitByCamelCase(nameToUse)).ToLower();
            if (isReadOnly)
            {
                return $"Gets the {splitDeclarationName}";
            }
            else
            {
                return $"Gets or sets the {splitDeclarationName}";
            }
        }

        public bool IsRequired { get; }
        public MemberDeclarationOptions Declaration { get; }
        public string Description { get; }
        public FormattableString FormattedDescription { get; }
        private FormattableString? _propertyDescription;
        public FormattableString PropertyDescription => _propertyDescription ??= $"{FormattedDescription}{CreateExtraPropertyDiscriminatorSummary(ValueType)}";
        public Property? SchemaProperty { get; }
        public InputModelProperty? InputModelProperty { get; }
        private FormattableString? _parameterDescription;
        private string _baseParameterDescription; // inherited type "FlattenedObjectTypeProperty" need to pass this value into the base constructor so that some appended information will not be appended again in the flattened property
        public FormattableString ParameterDescription => _parameterDescription ??= $"{_baseParameterDescription}{CreateExtraPropertyDiscriminatorSummary(ValueType)}";

        /// <summary>
        /// Gets or sets the value indicating whether nullable type of this property represents optionality of the value.
        /// </summary>
        public bool OptionalViaNullability { get; }

        /// <summary>
        /// When property is not required we transform the type to be able to express "omitted" value.
        /// For example we turn int type into int?.
        /// ValueType property contains the original type the property had before the transformation was applied to it.
        /// </summary>
        public CSharpType ValueType { get; }
        public bool IsReadOnly { get; }

        public FieldModifiers? GetterModifiers { get; }
        public FieldModifiers? SetterModifiers { get; }

        /// <summary>
        /// This method attempts to retrieve the description for each of the union type items. For items that are lists,
        /// the description will include details about the element type.
        /// For items that are literals, the description will include the literal value.
        /// </summary>
        /// <param name="unionItems">the list of union type items.</param>
        /// <returns>A list of FormattableString representing the description of each union item.
        /// </returns>
        public static IReadOnlyList<FormattableString> GetUnionTypesDescriptions(IReadOnlyList<CSharpType> unionItems)
        {
            var values = new List<FormattableString>();

            foreach (CSharpType item in unionItems)
            {
                FormattableString description;

                if (item.IsLiteral && item.Literal?.Value != null)
                {
                    var literalValue = item.Literal.Value.Value;
                    if (item.FrameworkType == typeof(string))
                    {
                        description = $"<description>{literalValue:L}</description>";
                    }
                    else
                    {
                        description = $"<description>{literalValue}</description>";
                    }
                }
                else
                {
                    description = $"<description>{item:C}</description>";
                }

                values.Add(description);
            }

            return values.Distinct().ToList();
        }

        /// <summary>
        /// This method constructs the description for a list type. If the list type contains an element type,
        /// then the description will include details about the element type.
        /// </summary>
        /// <param name="input">The input list type to construct the description for.</param>
        /// <param name="isBaseElement">A value indicating whether the list type is the base element of the original list.</param>
        /// <returns>A constructed FormattedString representing the description of the list type.</returns>
        public static FormattableString ConstructDetailsForListType(CSharpType? input, bool isBaseElement)
        {
            if (input == null)
            {
                return $"";
            }

            string itemName = input.TryGetCSharpFriendlyName(out var keywordName) ? keywordName : input.Name;
            CSharpType? elementType = null;
            FormattableString typeDescription = $"{itemName}";

            if (isBaseElement)
            {
                typeDescription = $"<see cref=\"{input}\"/>";
            }

            if (TypeFactory.IsList(input) || TypeFactory.IsArray(input))
            {
                elementType = TypeFactory.GetElementType(input);
                typeDescription = $"{itemName}";
            }
            else if (TypeFactory.IsDictionary(input))
            {
                typeDescription = $"{itemName}{{TKey, TValue}}";
            }

            // validate if the item contains an element type
            if (elementType != null)
            {
                typeDescription = $"{typeDescription}{{{ConstructDetailsForListType(elementType, false)}}}";

                if (isBaseElement)
                {
                    typeDescription = $"<c>{typeDescription}</c>";
                }
            }

            return typeDescription;
        }

        internal string CreateExtraDescriptionWithManagedServiceIdentity()
        {
            var extraDescription = string.Empty;
            var originalObjSchema = SchemaProperty?.Schema as ObjectSchema;
            var identityTypeSchema = originalObjSchema?.GetAllProperties()!.FirstOrDefault(p => p.SerializedName == "type")!.Schema;
            if (identityTypeSchema != null)
            {
                var supportedTypesToShow = new List<string>();
                var commonMsiSupportedTypeCount = typeof(ManagedServiceIdentityType).GetProperties().Length;
                // unwrap constant schema if it is
                if (identityTypeSchema is ConstantSchema constantIdentitySchema && constantIdentitySchema.ValueType is ChoiceSchema identityTypeChoiceSchema)
                    identityTypeSchema = identityTypeChoiceSchema;

                if (identityTypeSchema is ChoiceSchema choiceSchema && choiceSchema.Choices.Count < commonMsiSupportedTypeCount)
                {
                    supportedTypesToShow = choiceSchema.Choices.Select(c => c.Value).ToList();
                }
                else if (identityTypeSchema is SealedChoiceSchema sealedChoiceSchema && sealedChoiceSchema.Choices.Count < commonMsiSupportedTypeCount)
                {
                    supportedTypesToShow = sealedChoiceSchema.Choices.Select(c => c.Value).ToList();
                }
                if (supportedTypesToShow.Count > 0)
                {
                    extraDescription = $"Current supported identity types: {string.Join(", ", supportedTypesToShow)}";
                }
            }
            return extraDescription;
        }

        /// <summary>
        /// This method is used to create the description for the property. It will append the extra description for the property if it is a binary data property.
        /// </summary>
        /// <param name="parameterDescription">The parameter description.</param>
        /// <param name="isPropReadOnly">Flag to determine if a property is read only.</param>
        /// <returns>The formatted property description string.</returns>
        internal FormattableString CreatePropertyDescription(string parameterDescription, bool isPropReadOnly)
        {
            FormattableString description;
            if (string.IsNullOrEmpty(parameterDescription))
            {
                description = CreateDefaultPropertyDescription(Declaration.Name, isPropReadOnly);
            }
            else
            {
                description = $"{parameterDescription}";
            }

            FormattableString binaryDataExtraDescription = CreateBinaryDataExtraDescription(Declaration.Type, SerializationFormat);
            description = $"{description}{binaryDataExtraDescription}";

            return description;
        }

        /// <summary>
        /// This method will construct an additional description for properties that are binary data. For properties whose values are union types,
        /// the description will include the types of values that are allowed.
        /// </summary>
        /// <param name="type">The CSharpType of the property.</param>
        /// <param name="serializationFormat">The serialization format of the property.</param>
        /// <returns>The formatted description string for the property.</returns>
        private FormattableString CreateBinaryDataExtraDescription(CSharpType type, SerializationFormat serializationFormat)
        {
            if (type.IsFrameworkType)
            {
                string typeSpecificDesc;
                IReadOnlyList<FormattableString> unionTypeDescriptions = Array.Empty<FormattableString>();
                if (type.IsUnion || ValueType is { IsUnion: true })
                {
                    // get the union types, if any
                    var items = type.IsUnion ? type.UnionItemTypes : ValueType.UnionItemTypes;

                    if (items is { Count: > 0 })
                    {
                        unionTypeDescriptions = GetUnionTypesDescriptions(items);
                    }
                }

                if (type.FrameworkType == typeof(BinaryData))
                {
                    typeSpecificDesc = "this property";
                    return ConstructBinaryDataDescription(typeSpecificDesc, serializationFormat, unionTypeDescriptions);
                }
                if (TypeFactory.IsList(type) &&
                    type.Arguments[0].IsFrameworkType &&
                    type.Arguments[0].FrameworkType == typeof(BinaryData))
                {
                    typeSpecificDesc = "the element of this property";
                    return ConstructBinaryDataDescription(typeSpecificDesc, serializationFormat, unionTypeDescriptions);
                }
                if (TypeFactory.IsDictionary(type) &&
                    type.Arguments[1].IsFrameworkType &&
                    type.Arguments[1].FrameworkType == typeof(BinaryData))
                {
                    typeSpecificDesc = "the value of this property";
                    return ConstructBinaryDataDescription(typeSpecificDesc, serializationFormat, unionTypeDescriptions);
                }
            }
            return $"";
        }

        private FormattableString ConstructBinaryDataDescription(string typeSpecificDesc, SerializationFormat serializationFormat, IReadOnlyList<FormattableString> unionTypeDescriptions)
        {
            FormattableString unionTypesAdditionalDescription = $"";

            if (unionTypeDescriptions.Count > 0)
            {
                unionTypesAdditionalDescription = $"\n<remarks>\nSupported types:\n<list type=\"bullet\">\n";
                foreach (FormattableString unionTypeDescription in unionTypeDescriptions)
                {
                    unionTypesAdditionalDescription = $"{unionTypesAdditionalDescription}<item>\n{unionTypeDescription}\n</item>\n";
                }
                unionTypesAdditionalDescription = $"{unionTypesAdditionalDescription}</list>\n</remarks>";
            }
            switch (serializationFormat)
            {
                case SerializationFormat.Bytes_Base64Url: //intentional fall through
                case SerializationFormat.Bytes_Base64:
                    return $@"
<para>
To assign a byte[] to {typeSpecificDesc} use <see cref=""{typeof(BinaryData)}.FromBytes(byte[])""/>.
The byte[] will be serialized to a Base64 encoded string.
</para>
<para>{unionTypesAdditionalDescription}
Examples:
<list type=""bullet"">
<item>
<term>BinaryData.FromBytes(new byte[] {{ 1, 2, 3 }})</term>
<description>Creates a payload of ""AQID"".</description>
</item>
</list>
</para>";

                default:
                    return $@"
<para>
To assign an object to {typeSpecificDesc} use <see cref=""{typeof(BinaryData)}.FromObjectAsJson{{T}}(T, System.Text.Json.JsonSerializerOptions?)""/>.
</para>
<para>
To assign an already formatted json string to this property use <see cref=""{typeof(BinaryData)}.FromString(string)""/>.
</para>
<para>{unionTypesAdditionalDescription}
Examples:
<list type=""bullet"">
<item>
<term>BinaryData.FromObjectAsJson(""foo"")</term>
<description>Creates a payload of ""foo"".</description>
</item>
<item>
<term>BinaryData.FromString(""\""foo\"""")</term>
<description>Creates a payload of ""foo"".</description>
</item>
<item>
<term>BinaryData.FromObjectAsJson(new {{ key = ""value"" }})</term>
<description>Creates a payload of {{ ""key"": ""value"" }}.</description>
</item>
<item>
<term>BinaryData.FromString(""{{\""key\"": \""value\""}}"")</term>
<description>Creates a payload of {{ ""key"": ""value"" }}.</description>
</item>
</list>
</para>";
            }
        }

        private static FormattableString CreateExtraPropertyDiscriminatorSummary(CSharpType valueType)
        {
            FormattableString? updatedDescription = null;
            if (valueType.IsFrameworkType)
            {
                if (TypeFactory.IsList(valueType))
                {
                    if (!valueType.Arguments.First().IsFrameworkType && valueType.Arguments.First().Implementation is ObjectType objectType)
                    {
                        updatedDescription = objectType.CreateExtraDescriptionWithDiscriminator();
                    }
                }
                else if (TypeFactory.IsDictionary(valueType))
                {
                    var objectTypes = valueType.Arguments.Where(arg => arg is { IsFrameworkType: false, Implementation: ObjectType }).ToList();
                    if (objectTypes.Any())
                    {
                        var subDescription = objectTypes.Select(o => ((ObjectType)o.Implementation).CreateExtraDescriptionWithDiscriminator()).ToArray();
                        updatedDescription = subDescription.Join("");
                    }
                }
            }
            else if (valueType.Implementation is ObjectType objectType)
            {
                updatedDescription = objectType.CreateExtraDescriptionWithDiscriminator();
            }
            return updatedDescription ?? $"";
        }
    }
}
