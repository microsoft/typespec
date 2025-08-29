// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public sealed class ScmModelProvider : ModelProvider
    {
        //private const string ScmEvaluationTypeDiagnosticId = "SCME0001";
        //private const string ScmEvaluationTypeSuppressionJustification = "Type is for evaluation purposes only and is subject to change or removal in future updates.";
        private const string JsonPatchFieldName = "_patch";
#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        private readonly CSharpType _jsonPatchFieldType = typeof(JsonPatch);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        private readonly bool _shouldApplyDynamicModel;

        public ScmModelProvider(InputModelType inputModel) : base(inputModel)
        {
            // TO-DO: Also validate if the namespace is opt-in for dynamic model support.
            // We can also consider having an input model flag to indicate if dynamic model support is needed.
            _shouldApplyDynamicModel = inputModel.IsDynamicModel;
        }
        protected override FieldProvider[] BuildFields()
        {
            var fields = base.BuildFields();
            if (JsonPatchField != null)
            {
                List<FieldProvider> updatedFields = new(fields.Length + 1);
                HashSet<FieldProvider> additionalPropertyFields = [.. AdditionalPropertyFields];

                foreach (var field in fields)
                {
                    if (field.Equals(RawDataField) || additionalPropertyFields.Contains(field))
                    {
                        continue;
                    }

                    updatedFields.Add(field);
                }
                return [.. updatedFields, JsonPatchField];
            }

            return base.BuildFields();
        }

        private FieldProvider? _jsonPatchField;
        private FieldProvider? JsonPatchField => _jsonPatchField ??= BuildJsonPatchField();

        private FieldProvider? BuildJsonPatchField()
        {
            if (!_shouldApplyDynamicModel)
            {
                return null;
            }

            // check if there is a json patch field on any of the base models, if so, we do not have to have one here.
            var baseModelProvider = BaseModelProvider;
            while (baseModelProvider != null)
            {
                if (baseModelProvider is ScmModelProvider scmModelProvider && scmModelProvider.JsonPatchField != null)
                {
                    return null;
                }
                baseModelProvider = baseModelProvider.BaseModelProvider;
            }
            var modifiers = FieldModifiers.Private;
            var experimentalAttribute = new AttributeStatement(typeof(ExperimentalAttribute), [Literal("SCME0001")]);
            var jsonPathField = new FieldProvider(
                modifiers: modifiers,
                type: _jsonPatchFieldType,
                description: null,
                name: JsonPatchFieldName,
                attributes: [experimentalAttribute],
                enclosingType: this);

            return jsonPathField;
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            if (JsonPatchField is null)
            {
                return base.BuildConstructors();
            }

            List<ParameterProvider> updatedParameters = new();
            bool updatedFullConstructorParams = false;
            foreach (var parameter in FullConstructor.Signature.Parameters)
            {
                if (!updatedFullConstructorParams &&
                    parameter.Field != null
                    && parameter.Field.Equals(RawDataField))
                {
                    var jsonPatchParameter = JsonPatchField.AsParameter;
                    jsonPatchParameter.Update(isIn: true);

                    updatedParameters.Add(jsonPatchParameter);
                    updatedFullConstructorParams |= true;
                }
                else
                {
                    updatedParameters.Add(parameter);
                }
            }

            var baseConstructors = base.BuildConstructors();
            var updatedConstructors = new List<ConstructorProvider>(baseConstructors.Length);

            foreach (var constructor in baseConstructors)
            {
                if (updatedFullConstructorParams && ReferenceEquals(constructor, FullConstructor))
                {
                    // Update the full constructor
                    //var suppression = new SuppressionStatement(constructor.Signature, [Literal(ScmEvaluationTypeDiagnosticId)], ScmEvaluationTypeSuppressionJustification);
                    constructor.Signature.Update(parameters: updatedParameters);
                }
                updatedConstructors.Add(constructor);
            }

            return [.. updatedConstructors];
        }
    }
}
