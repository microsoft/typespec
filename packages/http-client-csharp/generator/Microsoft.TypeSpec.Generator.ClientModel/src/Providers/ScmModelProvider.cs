// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public sealed class ScmModelProvider : ModelProvider
    {
        private const string DynamicModelDecorator = "dynamicModel";
        private const string JsonPatchFieldName = "_patch";
#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        private readonly CSharpType _jsonPatchFieldType = typeof(JsonPatch);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        private readonly bool _shouldApplyDynamicModel;

        public ScmModelProvider(InputModelType inputModel) : base(inputModel)
        {
            _shouldApplyDynamicModel = inputModel.Decorators
                .Any(d => d.Name.Equals(DynamicModelDecorator, StringComparison.OrdinalIgnoreCase));
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
            var jsonPathField = new FieldProvider(
                modifiers: modifiers,
                type: _jsonPatchFieldType,
                description: null,
                name: JsonPatchFieldName,
                enclosingType: this);

            return jsonPathField;
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
    }
}
