// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// cspell:ignore mpfd

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text.Json.Serialization;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public sealed class ScmModelProvider : ModelProvider
    {
        private readonly InputModelType _inputModel;
        private const string JsonPatchFieldName = "_patch";
#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        private readonly CSharpType _jsonPatchFieldType = typeof(JsonPatch);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
#pragma warning disable SCME0004 // FileBinaryContent is evaluation-only.
        private static readonly CSharpType _fileBinaryContentType = typeof(FileBinaryContent);
#pragma warning restore SCME0004
        private static SuppressionStatement _fileBinaryContentSuppression = new(
            null,
            Literal(FileBinaryContentDiagnosticId), ScmEvaluationTypeSuppressionJustification);
        private static AttributeStatement _fileBinaryContentExpAttribute = new(
            typeof(ExperimentalAttribute),
            [Literal(FileBinaryContentDiagnosticId)]);

        internal const string ScmEvaluationTypeDiagnosticId = "SCME0001";
        internal const string FileBinaryContentDiagnosticId = "SCME0004";

        internal const string ScmEvaluationTypeSuppressionJustification =
            "Type is for evaluation purposes only and is subject to change or removal in future updates.";

        internal const string JsonPatchPropertyName = "Patch";
        internal bool IsDynamicModel { get; }
        internal Lazy<PropertyProvider?> BaseJsonPatchProperty { get; }

        internal bool HasDynamicProperties => _hasDynamicProperties ??= BuildHasDynamicProperties();
        private bool? _hasDynamicProperties;

        // When true, the model needs to generate both JsonPatch and AdditionalProperties for
        // backward compatibility (the model was previously shipped with AdditionalProperties).
        private bool NeedsBackCompatAdditionalProperties => _needsBackCompatAdditionalProperties ??= BuildNeedsBackCompatAdditionalProperties();
        private bool? _needsBackCompatAdditionalProperties;

        internal static SuppressionStatement JsonPatchSuppression = new SuppressionStatement(null,
            Literal(ScmEvaluationTypeDiagnosticId),
            ScmEvaluationTypeSuppressionJustification);

        public ScmModelProvider(InputModelType inputModel) : base(inputModel)
        {
            _inputModel = inputModel;
            IsDynamicModel = inputModel.IsDynamicModel;
            BaseJsonPatchProperty = new(GetBaseJsonPatchProperty());
        }

        protected internal override FieldProvider[] BuildFields()
        {
            if (JsonPatchField is null)
            {
                return base.BuildFields();
            }

            var fields = base.BuildFields();
            var updatedFields = new List<FieldProvider>(fields.Length + 1);

            foreach (var field in fields)
            {
                // Keep the RawDataField when backcompat requires AdditionalProperties to be generated alongside JsonPatch
                if (field.Equals(RawDataField) && !NeedsBackCompatAdditionalProperties)
                {
                    continue;
                }
                updatedFields.Add(field);
            }

            return [JsonPatchField, .. updatedFields];
        }

        protected internal override PropertyProvider[] BuildProperties()
        {
            PropertyProvider[] properties;
            if (JsonPatchProperty is null)
            {
                properties = base.BuildProperties();
            }
            // For dynamic models with BinaryData additional properties (Record<unknown>),
            // skip generating AdditionalProperties since JsonPatch handles dynamic properties.
            // Exception: when backcompat requires preserving AdditionalProperties from the last contract.
            else if (SupportsBinaryDataAdditionalProperties && !NeedsBackCompatAdditionalProperties)
            {
                properties = [JsonPatchProperty, .. base.BuildProperties().Where(p => !p.IsAdditionalProperties)];
            }
            else
            {
                properties = [JsonPatchProperty, .. base.BuildProperties()];
            }

            foreach (var prop in properties)
            {
                if (IsFileBinaryContentType(prop.Type))
                {
                    prop.Update(attributes: [.. prop.Attributes, new AttributeStatement(typeof(ExperimentalAttribute), [Literal(FileBinaryContentDiagnosticId)])]);
                }
            }

            return properties;
        }

        protected internal override ConstructorProvider[] BuildConstructors()
        {
            List<ConstructorProvider> constructors = [.. base.BuildConstructors()];

            if (ShouldUpdateFullConstructor())
            {
                // Update the full constructor to include the json patch parameter
                UpdateFullConstructorParameters();

                bool hasJsonPatchParameter = FullConstructor.Signature.Parameters.Any(
                    p => p.IsIn && p.Property?.Name.Equals(JsonPatchPropertyName, StringComparison.Ordinal) == true);
                if (hasJsonPatchParameter)
                {
                    UpdateConstructorsForJsonPatch(constructors);
                }
            }

            if (_inputModel.Usage.HasFlag(InputModelTypeUsage.MultipartFormData))
            {
                var newConstructors = BuildMultipartFileConstructors(constructors);
                if (newConstructors is not null)
                {
                    constructors = newConstructors;
                }
            }

            ApplyFileBinaryContentExperimentalHandling(constructors);

            return [.. constructors];
        }

        private static void ApplyFileBinaryContentExperimentalHandling(IEnumerable<ConstructorProvider> constructors)
        {
            foreach (var c in constructors)
            {
                if (!c.Signature.Parameters.Any(p => IsFileBinaryContentType(p.Type)))
                {
                    continue;
                }

                if (c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal))
                {
                    if (!c.Suppressions.Contains(_fileBinaryContentSuppression))
                    {
                        c.Update(suppressions: [.. c.Suppressions, _fileBinaryContentSuppression]);
                    }
                }
                else if (!c.Signature.Attributes.Contains(_fileBinaryContentExpAttribute))
                {
                    c.Signature.Update(attributes: [.. c.Signature.Attributes, _fileBinaryContentExpAttribute]);
                }
            }
        }

        private void UpdateConstructorsForJsonPatch(List<ConstructorProvider> constructors)
        {
            // Update the full constructor to include the suppression and remove the SARD field assignment if it exists
            foreach (var constructor in constructors)
            {
                if (ReferenceEquals(constructor, FullConstructor))
                {
                    var suppression = new SuppressionStatement(null, Literal(ScmEvaluationTypeDiagnosticId), ScmEvaluationTypeSuppressionJustification);
                    constructor.Update(signature: constructor.Signature);
                    constructor.Update(suppressions: [suppression, .. constructor.Suppressions]);

                    if (constructor.BodyStatements != null)
                    {
                        List<MethodBodyStatement> updatedBody = [];
                        if (RawDataField is null)
                        {
                            updatedBody.AddRange(constructor.BodyStatements);
                        }
                        else
                        {
                            foreach (var statement in constructor.BodyStatements)
                            {
                                if (statement is ExpressionStatement { Expression: AssignmentExpression assignmentExpression }
                                    && (assignmentExpression.Value.Equals(RawDataField.AsParameter) ||
                                        (!NeedsBackCompatAdditionalProperties &&
                                         assignmentExpression.Variable is MemberExpression { MemberName: AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName })))
                                {
                                    continue;
                                }
                                updatedBody.Add(statement);
                            }
                        }

                        if (JsonPatchField != null)
                        {
                            updatedBody.Add(JsonPatchField.Assign(JsonPatchProperty!.AsParameter).Terminate());
                            if (HasDynamicProperties)
                            {
#pragma warning disable SCME0001
                                updatedBody.Add(JsonPatchField.As<JsonPatch>().SetPropagators(new MemberExpression(null, "PropagateSet"), new MemberExpression(null, "PropagateGet")));
#pragma warning restore SCME0001
                            }
                        }
                        else if (HasDynamicProperties && BaseJsonPatchProperty.Value is not null)
                        {
                            // Derived model has dynamic properties but inherits the JsonPatch field from base
                            // We need to call SetPropagators on the inherited patch field
#pragma warning disable SCME0001
                            updatedBody.Add(BaseJsonPatchProperty.Value.As<JsonPatch>().SetPropagators(new MemberExpression(null, "PropagateSet"), new MemberExpression(null, "PropagateGet")));
#pragma warning restore SCME0001
                        }

                        constructor.Update(bodyStatements: updatedBody);
                    }
                }
                else if (JsonPatchField != null && SupportsBinaryDataAdditionalProperties && !NeedsBackCompatAdditionalProperties && constructor.BodyStatements != null)
                {
                    // Remove the additional binary data properties initialization from the init constructor
                    var updatedBody = constructor.BodyStatements
                        .Where(s => s is not ExpressionStatement
                        {
                            Expression: AssignmentExpression
                            {
                                Variable: MemberExpression { MemberName: AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName }
                            }
                        })
                        .ToList();
                    constructor.Update(bodyStatements: updatedBody);
                }
            }
        }

        private List<ConstructorProvider>? BuildMultipartFileConstructors(List<ConstructorProvider> existingConstructors)
        {
            Dictionary<string, MultipartSerialization>? fileProperties = null;
            bool needsPrimaryAugmentation = false;

            foreach (var prop in CanonicalView.Properties)
            {
                var mpfd = (prop.WireInfo?.SerializationOptions as ScmSerializationOptions)?.Multipart;
                if (mpfd?.IsFilePart != true || mpfd.IsMulti || prop.WireInfo?.IsRequired != true)
                {
                    continue;
                }

                if (!IsFileBinaryContentType(prop.Type))
                {
                    return null;
                }

                var name = prop.WireInfo?.SerializedName ?? prop.Name;
                if ((fileProperties ??= []).TryAdd(name, mpfd) && !needsPrimaryAugmentation)
                {
                    needsPrimaryAugmentation =
                        mpfd.Filename is { IsRequired: true } || mpfd.Filename?.Type is InputLiteralType
                        || mpfd.ContentType is { IsRequired: true } || mpfd.ContentType?.Type is InputLiteralType;
                }
            }

            if (fileProperties is null)
            {
                return null;
            }

            // Find the public init ctor to use as the template for augmented overloads.
            ConstructorProvider? templateCtor = null;
            foreach (var c in existingConstructors)
            {
                if (ReferenceEquals(c, FullConstructor))
                {
                    continue;
                }

                if (!c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal) && c.Signature.Parameters.Count == 0)
                {
                    return null;
                }

                templateCtor = c;
                break;
            }

            if (templateCtor is null)
            {
                return null;
            }

            List<ConstructorProvider> result = new(existingConstructors.Count + 3)
            {
                BuildMultipartFileOverload(templateCtor, fileProperties, typeof(string)),
                BuildMultipartFileOverload(templateCtor, fileProperties, typeof(Stream)),
                BuildMultipartFileOverload(templateCtor, fileProperties, typeof(BinaryData))
            };

            bool fullConstructorPreserved = false;
            foreach (var c in existingConstructors)
            {
                if (needsPrimaryAugmentation && ReferenceEquals(c, templateCtor))
                {
                    continue;
                }
                result.Add(c);

                if (ReferenceEquals(c, FullConstructor))
                {
                    fullConstructorPreserved = true;
                }
            }

            if (needsPrimaryAugmentation && !fullConstructorPreserved)
            {
                result.Add(FullConstructor);
            }

            return result;
        }

        private ConstructorProvider BuildMultipartFileOverload(
            ConstructorProvider initCtor,
            Dictionary<string, MultipartSerialization> fileProperties,
            CSharpType sourceType)
        {
            bool isPath = sourceType.Equals(typeof(string));
            var newParams = new List<ParameterProvider>(initCtor.Signature.Parameters.Count + 2);
            var assignments = new List<MethodBodyStatement>();
            const string filenameParamName = "Filename";
            const string contentTypeParamName = "ContentType";
            const string pathParamName = "Path";
            const string filenameParamDescriptionFormat = "The filename for the {0} file.";
            const string contentTypeParamDescriptionFormat = "The content-type for the {0} file.";
            const string pathParamDescriptionFormat = "The file path for the {0} file.";
            const string contentParamDescriptionFormat = "The content for the {0} file.";

            foreach (var p in initCtor.Signature.Parameters)
            {
                if (p.Property is { } prop && fileProperties.TryGetValue(prop.WireInfo?.SerializedName ?? prop.Name, out var serializationOptions))
                {
                    var baseName = p.Name;
                    ParameterProvider? filenameParam = null;
                    ParameterProvider? contentTypeParam = null;

                    // filename param — only add when the value is not bound to a literal
                    if (serializationOptions.Filename is { IsRequired: true }
                        && serializationOptions.Filename.Type is not InputLiteralType)
                    {
                        filenameParam = new ParameterProvider(
                            $"{baseName}{filenameParamName}".ToVariableName(),
                            FormattableStringFactory.Create(filenameParamDescriptionFormat, serializationOptions.Name),
                            typeof(string),
                            validation: ParameterValidationType.AssertNotNullOrEmpty);
                        newParams.Add(filenameParam);
                    }

                    // content-type param — only add when the value is not bound to a literal
                    if (serializationOptions.ContentType is { IsRequired: true }
                        && serializationOptions.ContentType.Type is not InputLiteralType)
                    {
                        contentTypeParam = new ParameterProvider(
                            $"{baseName}{contentTypeParamName}".ToVariableName(),
                            FormattableStringFactory.Create(contentTypeParamDescriptionFormat, serializationOptions.Name),
                            typeof(string),
                            validation: ParameterValidationType.AssertNotNullOrEmpty);
                        newParams.Add(contentTypeParam);
                    }

                    // path / stream / data source param
                    string sourceParamName;
                    string sourceParamDescriptionFormat;
                    ParameterValidationType sourceParamValidation;
                    if (isPath)
                    {
                        sourceParamName = $"{baseName}{pathParamName}".ToVariableName();
                        sourceParamDescriptionFormat = pathParamDescriptionFormat;
                        sourceParamValidation = ParameterValidationType.AssertNotNullOrEmpty;
                    }
                    else
                    {
                        sourceParamName = baseName;
                        sourceParamDescriptionFormat = contentParamDescriptionFormat;
                        sourceParamValidation = ParameterValidationType.AssertNotNull;
                    }

                    var sourceParam = new ParameterProvider(
                        sourceParamName,
                        FormattableStringFactory.Create(sourceParamDescriptionFormat, serializationOptions.Name),
                        sourceType,
                        validation: sourceParamValidation);
                    newParams.Add(sourceParam);

                    // When content-type / filename is a literal, pass the literal value as the constructor's argument
                    // so the metadata is always set to the single allowed value.
                    ScopedApi<string>? contentTypeExpr = contentTypeParam?.As<string>();
                    if (contentTypeExpr is null
                        && serializationOptions.ContentType?.Type is InputLiteralType { Value: string ctLiteral })
                    {
                        contentTypeExpr = Literal(ctLiteral);
                    }

                    ScopedApi<string>? filenameExpr = filenameParam?.As<string>();
                    if (filenameExpr is null
                        && serializationOptions.Filename?.Type is InputLiteralType { Value: string fnLiteral })
                    {
                        filenameExpr = Literal(fnLiteral);
                    }

                    ValueExpression newExpr = filenameExpr != null
                        ? FileBinaryContentSnippets.New(sourceParam, contentTypeExpr, filenameExpr)
                        : contentTypeExpr != null
                            ? FileBinaryContentSnippets.New(sourceParam, contentTypeExpr)
                            : FileBinaryContentSnippets.New(sourceParam);

                    assignments.Add(prop.Assign(newExpr).Terminate());
                }
                else
                {
                    newParams.Add(p);
                    if (p.Property is not null)
                    {
                        ValueExpression assignmentValue = CSharpType.RequiresToList(p.Type, p.Property.Type)
                            ? p.ToList()
                            : p;
                        assignments.Add(p.Property.Assign(assignmentValue).Terminate());
                    }
                }
            }

            return new ConstructorProvider(
                new ConstructorSignature(
                    Type,
                    initCtor.Signature.Description,
                    initCtor.Signature.Modifiers,
                    newParams,
                    attributes: [_fileBinaryContentExpAttribute]),
                assignments,
                this);
        }

        private FieldProvider? _jsonPatchField;
        private FieldProvider? JsonPatchField => _jsonPatchField ??= BuildJsonPatchField();

        private PropertyProvider? _jsonPatchProperty;
        internal PropertyProvider? JsonPatchProperty => _jsonPatchProperty ??= BuildJsonPatchProperty();

        private FieldProvider? BuildJsonPatchField()
        {
            if (!IsDynamicModel)
            {
                return null;
            }

            // check if there is a json patch field on any of the base models, if so, we do not have to have one here.
            var baseModelProvider = BaseModelProvider;
            while (baseModelProvider != null)
            {
                if (baseModelProvider is ScmModelProvider { JsonPatchField: not null })
                {
                    return null;
                }
                baseModelProvider = baseModelProvider.BaseModelProvider;
            }

            var experimentalAttribute = new AttributeStatement(typeof(ExperimentalAttribute), [Literal(ScmEvaluationTypeDiagnosticId)]);
            FieldModifiers modifiers = DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct)
                ? FieldModifiers.Private | FieldModifiers.ReadOnly
                : FieldModifiers.Private;
            return new FieldProvider(
                modifiers: modifiers,
                type: _jsonPatchFieldType,
                description: null,
                name: JsonPatchFieldName,
                attributes: [experimentalAttribute],
                enclosingType: this);
        }

        private PropertyProvider? BuildJsonPatchProperty()
        {
            if (JsonPatchField is null)
            {
                return null;
            }

            bool isRef = !DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct);
            return new PropertyProvider(
                description: null,
                modifiers: MethodSignatureModifiers.Public,
                type: _jsonPatchFieldType,
                name: JsonPatchPropertyName,
                isRef: isRef,
                body: new ExpressionPropertyBody(new VariableExpression(JsonPatchField.Type, JsonPatchField.Declaration, IsRef: isRef)),
                attributes:
                [
                    new AttributeStatement(typeof(JsonIgnoreAttribute)),
                    new AttributeStatement(typeof(EditorBrowsableAttribute), FrameworkEnumValue(EditorBrowsableState.Never)),
                    new AttributeStatement(typeof(ExperimentalAttribute), [Literal(ScmEvaluationTypeDiagnosticId)])
                ],
                enclosingType: this)
            {
                BackingField = JsonPatchField
            };
        }

        private bool ShouldUpdateFullConstructor()
        {
            var hasJsonPatchParameter = FullConstructor.Signature.Parameters.Any(
                p => p.IsIn && p.Property?.Name.Equals(JsonPatchPropertyName, StringComparison.Ordinal) == true);

            if (hasJsonPatchParameter)
            {
                return true;
            }

            return FullConstructor.Signature.Parameters.Any(IsAdditionalBinaryDataParameter);
        }

        private static bool IsAdditionalBinaryDataParameter(ParameterProvider p) =>
            p.Field?.Name.Equals(AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName) == true ||
            p.Property?.BackingField?.Name.Equals(AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName) == true;

        private void UpdateFullConstructorParameters()
        {
            if (BaseJsonPatchProperty.Value is null)
            {
                return;
            }

            var updatedParameters = new List<ParameterProvider>(FullConstructor.Signature.Parameters.Count + 1);
            var jsonPatchParameter = BaseJsonPatchProperty.Value.AsParameter;
            jsonPatchParameter.Update(isIn: true);

            foreach (var parameter in FullConstructor.Signature.Parameters)
            {
                if (IsAdditionalBinaryDataParameter(parameter))
                {
                    if (NeedsBackCompatAdditionalProperties)
                    {
                        // Backcompat: keep the additionalBinaryData parameter
                        updatedParameters.Add(parameter);
                    }
                    updatedParameters.Add(jsonPatchParameter);
                }
                else
                {
                    updatedParameters.Add(parameter);
                }
            }

            // Update the initializer to include the json patch parameter as an argument
            if (FullConstructor.Signature.Initializer != null)
            {
                var baseRawDataField = RawDataField;
                var currentProvider = BaseModelProvider;
                while (baseRawDataField == null && currentProvider != null)
                {
                    if (currentProvider is ScmModelProvider baseScmModelProvider && baseScmModelProvider.RawDataField != null)
                    {
                        baseRawDataField = baseScmModelProvider.RawDataField;
                        break;
                    }
                    currentProvider = currentProvider.BaseModelProvider;
                }

                bool isDiscriminatedType = currentProvider is ScmModelProvider { DiscriminatorValue: not null }
                    || currentProvider is ScmModelProvider { _inputModel.DiscriminatorProperty: not null };
                bool hasDynamicModelSupport = currentProvider is ScmModelProvider { IsDynamicModel: true };

                if (baseRawDataField != null)
                {
                    var updatedArguments = new List<ValueExpression>(FullConstructor.Signature.Initializer.Arguments.Count);
                    foreach (var argument in FullConstructor.Signature.Initializer.Arguments)
                    {
                        VariableExpression rawDataFieldAsVar = baseRawDataField.AsParameter;
                        if (rawDataFieldAsVar.Equals(argument))
                        {
                            var replacement = !isDiscriminatedType && !hasDynamicModelSupport
                               ? Default
                               : jsonPatchParameter;
                            updatedArguments.Add(replacement);
                        }
                        else
                        {
                            updatedArguments.Add(argument);
                        }
                    }
                    var updatedInitializer = new ConstructorInitializer(FullConstructor.Signature.Initializer.IsBase, updatedArguments);
                    FullConstructor.Signature.Update(initializer: updatedInitializer);
                }
            }

            FullConstructor.Signature.Update(parameters: updatedParameters);
        }

        private bool BuildHasDynamicProperties()
        {
            var propertiesWithWireInfo = CanonicalView.Properties;
            if (propertiesWithWireInfo.Any(p =>
                    p.WireInfo != null &&
                    ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(p.Type, out var provider) &&
                    provider is ScmModelProvider { IsDynamicModel: true }))
            {
                return true;
            }

            return propertiesWithWireInfo
                .Where(p => p.Type.IsCollection && p.WireInfo != null)
                .Any(p => ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(
                              p.Type.GetNestedElementType(),
                              out var provider) &&
                          provider is ScmModelProvider { IsDynamicModel: true });
        }

        private PropertyProvider? GetBaseJsonPatchProperty()
        {
            if (JsonPatchProperty != null)
            {
                return JsonPatchProperty;
            }

            var baseModelProvider = BaseModelProvider;
            while (baseModelProvider != null)
            {
                if (baseModelProvider is ScmModelProvider baseScmModelProvider && baseScmModelProvider.JsonPatchProperty != null)
                {
                    return baseScmModelProvider.JsonPatchProperty;
                }
                baseModelProvider = baseModelProvider.BaseModelProvider;
            }

            return null;
        }

        private bool BuildNeedsBackCompatAdditionalProperties()
        {
            if (!IsDynamicModel || !SupportsBinaryDataAdditionalProperties || LastContractView == null)
            {
                return false;
            }

            bool needsBackCompat = LastContractView.Properties.Any(p =>
                p.Name == AdditionalPropertiesHelper.DefaultAdditionalPropertiesPropertyName);

            if (needsBackCompat)
            {
                CodeModelGenerator.Instance.Emitter.Debug(
                    $"Preserved 'AdditionalProperties' property shape on model '{Name}' to match last contract.",
                    BackCompatibilityChangeCategory.AdditionalPropertiesShapePreserved);
            }

            return needsBackCompat;
        }

        internal static bool IsFileBinaryContentType(CSharpType type)
            => CSharpType.IgnoreNullableComparer.Equals(type, _fileBinaryContentType)
               || (type.IsCollection && CSharpType.IgnoreNullableComparer.Equals(type.ElementType, _fileBinaryContentType));
    }
}
