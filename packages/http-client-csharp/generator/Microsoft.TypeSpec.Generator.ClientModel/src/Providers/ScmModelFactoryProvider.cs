// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal class ScmModelFactoryProvider : ModelFactoryProvider
    {
        private readonly IEnumerable<InputModelType> _models;

        internal ScmModelFactoryProvider(IEnumerable<InputModelType> models) : base(models)
        {
            _models = models;
        }

        protected internal override MethodProvider[] BuildMethods()
        {
            var methods = base.BuildMethods();
            if (methods.Length == 0)
            {
                return methods;
            }

            AttributeStatement? experimentalAttribute = null;

            foreach (var method in methods)
            {
                if (!MethodReferencesFileBinaryContent(method))
                {
                    continue;
                }

                experimentalAttribute ??= new AttributeStatement(
                    typeof(ExperimentalAttribute),
                    [Literal(ScmModelProvider.FileBinaryContentDiagnosticId)]);

                method.Signature.Update(attributes: [.. method.Signature.Attributes, experimentalAttribute]);
            }

            return methods;
        }

        private static bool MethodReferencesFileBinaryContent(MethodProvider method)
        {
            foreach (var param in method.Signature.Parameters)
            {
                if (ScmModelProvider.IsFileBinaryContentType(param.Type))
                {
                    return true;
                }
            }
            return false;
        }
    }
}
