// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public sealed class ScmModelProvider : ModelProvider
    {
        private const string JsonPatchFieldName = "_patch";
#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        private readonly CSharpType _jsonPatchFieldType = typeof(JsonPatch);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.

        internal const string ScmEvaluationTypeDiagnosticId = "SCME0001";

        internal const string ScmEvaluationTypeSuppressionJustification =
            "Type is for evaluation purposes only and is subject to change or removal in future updates.";

        internal const string JsonPatchPropertyName = "Patch";
        internal bool IsDynamicModel { get; }
        internal bool HasDynamicModelSupport { get; }

        internal bool HasDynamicProperties { get; }

        internal static SuppressionStatement JsonPatchSuppression = new SuppressionStatement(null,
            Literal(ScmEvaluationTypeDiagnosticId),
            ScmEvaluationTypeSuppressionJustification);

        public ScmModelProvider(InputModelType inputModel) : base(inputModel)
        {
            IsDynamicModel = inputModel.IsDynamicModel;
            HasDynamicModelSupport = ComputeHasDynamicModelSupport();
            HasDynamicProperties = BuildHasDynamicProperties();
        }

        protected override FieldProvider[] BuildFields()
        {
            if (JsonPatchField is null)
            {
                return base.BuildFields();
            }

            var fields = base.BuildFields();
            var updatedFields = new List<FieldProvider>(fields.Length + 1);

            foreach (var field in fields)
            {
                if (!field.Equals(RawDataField))
                {
                    updatedFields.Add(field);
                }
            }

            return [JsonPatchField, .. updatedFields];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            if (JsonPatchProperty is null)
            {
                return base.BuildProperties();
            }

            return [JsonPatchProperty, .. base.BuildProperties()];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            var constructors = base.BuildConstructors();

            if (!ShouldUpdateFullConstructor())
            {
                return constructors;
            }

            // Update the full constructor to include the json patch parameter
            UpdateFullConstructorParameters();

            bool hasJsonPatchParameter = FullConstructor.Signature.Parameters.Any(
                p => p.IsIn && p.Property?.Name.Equals(JsonPatchPropertyName, StringComparison.Ordinal) == true);
            if (!hasJsonPatchParameter)
            {
                return constructors;
            }

            // Update the full constructor to include the suppression and remove the SARD field assignment if it exists
            var updatedConstructors = new List<ConstructorProvider>(constructors.Length);
            foreach (var constructor in constructors)
            {
                if (ReferenceEquals(constructor, FullConstructor))
                {
                    var suppression = new SuppressionStatement(null, Literal(ScmEvaluationTypeDiagnosticId), ScmEvaluationTypeSuppressionJustification);
                    constructor.Update(signature: constructor.Signature);
                    constructor.Update(suppressions: [suppression, .. constructor.Suppressions]);

                    if (RawDataField != null &&
                        JsonPatchField != null &&
                        constructor.BodyStatements != null)
                    {
                        List<MethodBodyStatement> updatedBody = [];
                        foreach (var statement in constructor.BodyStatements)
                        {
                            if (statement is ExpressionStatement expressionStatement
                                && expressionStatement.Expression is AssignmentExpression assignmentExpression
                                && assignmentExpression.Value == RawDataField.AsParameter == true)
                            {
                                continue;
                            }
                            updatedBody.Add(statement);
                        }

                        updatedBody.Add(JsonPatchField.Assign(JsonPatchProperty!.AsParameter).Terminate());
                        if (HasDynamicProperties)
                        {
#pragma warning disable SCME0001
                            updatedBody.Add(JsonPatchField.As<JsonPatch>().SetPropagators(new MemberExpression(null, "PropagateSet"), new MemberExpression(null, "PropagateGet")));
#pragma warning restore SCME0001
                        }

                        constructor.Update(bodyStatements: updatedBody);
                    }
                }
                updatedConstructors.Add(constructor);
            }

            return [.. updatedConstructors];
        }

        private FieldProvider? _jsonPatchField;
        private FieldProvider? JsonPatchField => _jsonPatchField ??= BuildJsonPatchField();

        private PropertyProvider? _jsonPatchProperty;
        private PropertyProvider? JsonPatchProperty => _jsonPatchProperty ??= BuildJsonPatchProperty();

        private FieldProvider? BuildJsonPatchField()
        {
            if (!IsDynamicModel || SupportsBinaryDataAdditionalProperties)
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

            return new FieldProvider(
                modifiers: FieldModifiers.Private,
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

            return new PropertyProvider(
                description: null,
                modifiers: MethodSignatureModifiers.Public,
                type: _jsonPatchFieldType,
                name: JsonPatchPropertyName,
                isRef: true,
                body: new ExpressionPropertyBody(new VariableExpression(JsonPatchField.Type, JsonPatchField.Declaration, IsRef: true)),
                attributes:
                [
                    new AttributeStatement(typeof(EditorBrowsableAttribute), FrameworkEnumValue(EditorBrowsableState.Never)),
                    new AttributeStatement(typeof(ExperimentalAttribute), [Literal(ScmEvaluationTypeDiagnosticId)])
                ],
                enclosingType: this);
        }

        private bool ComputeHasDynamicModelSupport()
        {
            if (IsDynamicModel)
            {
                return true;
            }

            var baseModelProvider = BaseModelProvider;
            while (baseModelProvider != null)
            {
                if (baseModelProvider is ScmModelProvider { IsDynamicModel: true })
                {
                    return true;
                }
                baseModelProvider = baseModelProvider.BaseModelProvider;
            }

            return false;
        }

        private bool ShouldUpdateFullConstructor()
        {
            var hasJsonPatchParameter = FullConstructor.Signature.Parameters.Any(
                p => p.IsIn && p.Property?.Name.Equals(JsonPatchPropertyName, StringComparison.Ordinal) == true);

            if (hasJsonPatchParameter)
            {
                return true;
            }

            return FullConstructor.Signature.Parameters.Any(p => p.Field?.Equals(RawDataField) == true);
        }

        private void UpdateFullConstructorParameters()
        {
            if (JsonPatchProperty is null)
            {
                return;
            }

            var updatedParameters = new List<ParameterProvider>(FullConstructor.Signature.Parameters.Count + 1);
            var jsonPatchParameter = JsonPatchProperty.AsParameter;
            jsonPatchParameter.Update(isIn: true);

            foreach (var parameter in FullConstructor.Signature.Parameters)
            {
                if (parameter.Field?.Equals(RawDataField) == true)
                {
                    updatedParameters.Add(jsonPatchParameter);
                }
                else
                {
                    updatedParameters.Add(parameter);
                }
            }

            FullConstructor.Signature.Update(parameters: updatedParameters);
        }

        private bool BuildHasDynamicProperties()
        {
            if (Properties.Any(p =>
                    ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(p.Type, out var provider) &&
                    provider is ScmModelProvider { IsDynamicModel: true }))
            {
                return true;
            }

            return Properties
                .Where(p => p.Type.IsCollection)
                .Any(p => ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(
                              p.Type.GetNestedElementType(),
                              out var provider) &&
                          provider is ScmModelProvider { IsDynamicModel: true });
        }
    }
}
