// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class ModelProviderSnippets
    {
        public static ValueExpression GetPropertyExpression(this ModelProvider model, ValueExpression modelVariable, IReadOnlyList<string> propertySegments)
        {
            TypeProvider currentModel = model;
            ValueExpression getPropertyExpression = modelVariable;

            for (int i = 0; i < propertySegments.Count; i++)
            {
                var property = currentModel.Properties.First(p => p.WireInfo?.SerializedName == propertySegments[i]);

                getPropertyExpression = getPropertyExpression.Property(property.Name);

                if (i < propertySegments.Count - 1)
                {
                    if (property.Type.IsNullable)
                    {
                        getPropertyExpression = getPropertyExpression.NullConditional();
                    }
                    currentModel = CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[property.Type]!;
                }
            }

            return getPropertyExpression;
        }

        public static ValueExpression SetPropertyExpression(this ModelProvider model, ValueExpression modelVariable, ValueExpression value, IReadOnlyList<string> propertySegments)
        {
            TypeProvider currentModel = model;
            ValueExpression setPropertyExpression = modelVariable;

            for (int i = 0; i < propertySegments.Count; i++)
            {
                var property = currentModel.Properties.First(p => p.WireInfo?.SerializedName == propertySegments[i]);

                setPropertyExpression = setPropertyExpression.Property(property.Name);

                if (i < propertySegments.Count - 1)
                {
                    if (property.Type.IsNullable)
                    {
                        setPropertyExpression = setPropertyExpression.NullConditional();
                    }
                    currentModel = CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[property.Type]!;
                }
            }

            return setPropertyExpression.Assign(value);
        }
    }
}
