// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal sealed class LifecycleVisibilityDefinition : EnumProvider
    {
        internal LifecycleVisibilityDefinition() : base(null)
        {
            CodeModelGenerator.Instance.AddTypeToKeep(this, isRoot: false);
        }

        protected override string BuildName() => "LifecycleVisibility";

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Enum;

        protected override FormattableString BuildDescription() => $"Service lifecycle visibility used to filter model properties when serializing SDK requests.";

        protected override CSharpType BuildEnumUnderlyingType() => typeof(int);

        protected override TypeProvider[] BuildSerializationProviders() => [];

        protected override IReadOnlyList<MethodBodyStatement> BuildAttributes()
            => [new AttributeStatement(typeof(FlagsAttribute))];

        protected override IReadOnlyList<EnumTypeMember> BuildEnumValues()
            => Enum.GetValues<InputVisibility>().Select(visibility =>
            {
                var name = visibility.ToString();
                var field = new FieldProvider(FieldModifiers.Public | FieldModifiers.Static,
                    EnumUnderlyingType, name, this, description: GetDescription(visibility), initializationValue: Int((int)visibility));
                return new EnumTypeMember(name, field, (int)visibility);
            }).ToArray();

        protected override FieldProvider[] BuildFields() => EnumValues.Select(value => value.Field).ToArray();

        private static FormattableString GetDescription(InputVisibility visibility) => visibility switch
        {
            InputVisibility.None => $"Not visible in any service lifecycle.",
            InputVisibility.Read => $"Visible in service responses. Excluded from SDK requests unless the operation explicitly uses the Read lifecycle.",
            InputVisibility.Create => $"Visible in requests that create a resource, such as POST and PUT.",
            InputVisibility.Update => $"Visible in requests that update a resource, such as PUT and PATCH.",
            InputVisibility.Delete => $"Visible in requests that delete a resource, such as DELETE.",
            InputVisibility.Query => $"Visible in requests that query a resource, such as GET and HEAD.",
            InputVisibility.All => $"Visible in every service lifecycle.",
            _ => throw new ArgumentOutOfRangeException(nameof(visibility), visibility, "Unknown lifecycle visibility.")
        };

        internal static ValueExpression GetExpression(InputVisibility visibility)
        {
            if ((visibility & InputVisibility.All) != visibility)
            {
                throw new ArgumentOutOfRangeException(nameof(visibility), visibility, "Unknown lifecycle visibility flags.");
            }
            if (Enum.IsDefined(visibility))
            {
                return Static<LifecycleVisibilityDefinition>().Property(visibility.ToString());
            }
            return Enum.GetValues<InputVisibility>()
                .Where(flag => flag is not (InputVisibility.None or InputVisibility.All) && visibility.HasFlag(flag))
                .Select(flag => (ValueExpression)Static<LifecycleVisibilityDefinition>().Property(flag.ToString()))
                .Aggregate((left, right) => new BinaryOperatorExpression("|", left, right));
        }
    }
}
