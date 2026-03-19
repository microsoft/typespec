// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class ModelProviderSnippets
    {
        public static ValueExpression GetPropertyExpression(this ModelProvider model, ValueExpression modelVariable, IReadOnlyList<string> propertySegments)
        {
            return model.BuildPropertyAccessExpression(modelVariable, propertySegments);
        }

        public static AssignmentExpression SetPropertyExpression(this ModelProvider model, ValueExpression modelVariable, ValueExpression value, IReadOnlyList<string> propertySegments)
        {
            return model.BuildPropertyAccessExpression(modelVariable, propertySegments).Assign(value);
        }

        private static ValueExpression BuildPropertyAccessExpression(this ModelProvider model, ValueExpression modelVariable, IReadOnlyList<string> propertySegments)
        {
            TypeProvider currentModel = model;
            ValueExpression propertyAccessExpression = modelVariable;

            for (int i = 0; i < propertySegments.Count; i++)
            {
                var property = FindPropertyInModelHierarchy(currentModel, propertySegments[i]);

                propertyAccessExpression = propertyAccessExpression.Property(property.Name);

                if (i < propertySegments.Count - 1)
                {
                    if (NeedsNullableConditional(property))
                    {
                        propertyAccessExpression = propertyAccessExpression.NullConditional();
                    }
                    currentModel = CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[property.Type]!;
                }
            }

            return propertyAccessExpression;
        }

        /// <summary>
        /// Searches for a property with the specified serialized name in the model and its base models.
        /// </summary>
        private static PropertyProvider FindPropertyInModelHierarchy(TypeProvider model, string serializedName)
        {
            // First, try to find the property in the current model
            var property = model.Properties.FirstOrDefault(p => p.WireInfo?.SerializedName == serializedName);
            if (property != null)
            {
                return property;
            }

            // If not found, search in the base model hierarchy
            if (model is ModelProvider modelProvider && modelProvider.BaseModelProvider != null)
            {
                return FindPropertyInModelHierarchy(modelProvider.BaseModelProvider, serializedName);
            }

            // If not found anywhere, throw an exception with a helpful message
            throw new System.InvalidOperationException(
                $"Property with serialized name '{serializedName}' not found in model '{model.Name}' or its base models.");
        }

        private static bool NeedsNullableConditional(PropertyProvider property)
        {
            return !property.Type.IsValueType || property.InputProperty?.Type is InputNullableType;
        }
    }
}
