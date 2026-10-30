// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal sealed class LifecycleModelReaderWriterOptionsDefinition : InternalHelperProvider
    {
        internal static bool HasLifecycleVisibility(InputType type, HashSet<InputType> visited)
        {
            if (!visited.Add(type))
            {
                return false;
            }
            return type switch
            {
                InputNullableType nullable => HasLifecycleVisibility(nullable.Type, visited),
                InputArrayType array => HasLifecycleVisibility(array.ValueType, visited),
                InputDictionaryType dictionary => HasLifecycleVisibility(dictionary.ValueType, visited),
                InputStreamingType streaming => HasLifecycleVisibility(streaming.ValueType, visited),
                InputUnionType union => union.VariantTypes.Any(variant => HasLifecycleVisibility(variant, visited)),
                InputModelType model => model.Properties.Any(property =>
                        property.IsReadOnly || property.Visibility != InputVisibility.All || HasLifecycleVisibility(property.Type, visited)) ||
                    model.BaseModel != null && HasLifecycleVisibility(model.BaseModel, visited) ||
                    model.DerivedModels.Any(derived => HasLifecycleVisibility(derived, visited)) ||
                    model.AdditionalProperties != null && HasLifecycleVisibility(model.AdditionalProperties, visited),
                _ => false
            };
        }

        protected override string BuildName() => "LifecycleModelReaderWriterOptions";

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Sealed | TypeSignatureModifiers.Class;

        protected override CSharpType BuildBaseType() => typeof(ModelReaderWriterOptions);

        protected override PropertyProvider[] BuildProperties()
            => [new PropertyProvider(null, MethodSignatureModifiers.Internal, new LifecycleVisibilityDefinition().Type, "Visibility", new AutoPropertyBody(false), this)];

        protected override ConstructorProvider[] BuildConstructors()
        {
            var visibility = new ParameterProvider("visibility", FormattableStringHelpers.Empty, new LifecycleVisibilityDefinition().Type);
            var format = new ParameterProvider("format", FormattableStringHelpers.Empty, typeof(string), defaultValue: Literal("W"));
            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(Type, null, MethodSignatureModifiers.Internal, [visibility, format],
                        initializer: new ConstructorInitializer(true, [format])),
                    This.Property("Visibility").Assign(visibility).Terminate(),
                    this)
            ];
        }

        protected override MethodProvider[] BuildMethods()
        {
            var options = new ParameterProvider("options", FormattableStringHelpers.Empty, typeof(ModelReaderWriterOptions));
            var visibility = new ParameterProvider("visibility", FormattableStringHelpers.Empty, new LifecycleVisibilityDefinition().Type);
            var isLifecycleOptions = options.Is(new DeclarationExpression(Type, "lifecycleOptions", out var lifecycleOptions));
            return
            [
                new MethodProvider(
                    new MethodSignature("IsVisible", null, MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static,
                        typeof(bool), null, [options, visibility]),
                    Return(Not(isLifecycleOptions).Or(new BinaryOperatorExpression("&", lifecycleOptions.Property("Visibility"), visibility)
                        .NotEqual(LifecycleVisibilityDefinition.GetExpression(InputVisibility.None)))),
                    this)
            ];
        }
    }
}
