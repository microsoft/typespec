// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Providers
{
    /// <summary>
    /// Represents an immutable collection of methods that are associated with an operation <see cref="InputOperation"/>.
    /// </summary>
    public sealed class MethodProviderCollection : IReadOnlyList<MethodProvider>
    {
        private readonly IReadOnlyList<MethodProvider> _cSharpMethods;

        private MethodProviderCollection(IEnumerable<MethodProvider>? methods)
        {
            _cSharpMethods = methods?.ToList() ?? [];
        }

        /// <summary>
        /// Builds a default <see cref="MethodProviderCollection"/> for the given <see cref="InputOperation"/>
        /// with a single method that creates a message.
        /// </summary>
        /// <param name="operation">The <see cref="InputOperation"/> to convert.</param>
        /// <param name="enclosingType">The <see cref="TypeProvider"/> that will contain the methods.</param>
        public static MethodProviderCollection DefaultCSharpMethodCollection(InputOperation operation, TypeProvider enclosingType)
        {
            var createMessageMethod = BuildCreateMessageMethod(operation, enclosingType);
            var cSharpMethods = new List<MethodProvider>() { createMessageMethod };
            // TO-DO: Add Protocol and Convenience methods https://github.com/Azure/autorest.csharp/issues/4585, https://github.com/Azure/autorest.csharp/issues/4586
            return new MethodProviderCollection(cSharpMethods);
        }

        public MethodProvider this[int index]
        {
            get { return _cSharpMethods[index]; }
        }

        public int Count
        {
            get { return _cSharpMethods.Count; }
        }

        private static MethodProvider BuildCreateMessageMethod(InputOperation operation, TypeProvider enclosingType)
        {
            // TO-DO: properly build method https://github.com/Azure/autorest.csharp/issues/4583
            List<ParameterProvider> methodParameters = new();
            foreach (var inputParam in operation.Parameters)
            {
              methodParameters.Add(CodeModelPlugin.Instance.TypeFactory.CreateCSharpParam(inputParam));
            }

            var methodModifier = MethodSignatureModifiers.Internal;
            var methodSignatureName = $"Create{operation.Name.ToCleanName()}Request";
            var methodSignature = new MethodSignature(methodSignatureName, FormattableStringHelpers.FromString(operation.Summary), FormattableStringHelpers.FromString(operation.Description), methodModifier, null, null, Parameters: methodParameters);
            var methodBody = Snippet.EmptyStatement;

            return new MethodProvider(methodSignature, methodBody, enclosingType);
        }

        public IEnumerator<MethodProvider> GetEnumerator()
        {
            return _cSharpMethods.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}
