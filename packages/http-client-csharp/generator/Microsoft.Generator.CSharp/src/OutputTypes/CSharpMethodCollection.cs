// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Represents an immutable collection of methods that are associated with an operation <see cref="InputOperation"/>.
    /// </summary>
    public sealed class CSharpMethodCollection : IReadOnlyList<CSharpMethod>
    {
        private readonly IReadOnlyList<CSharpMethod> _cSharpMethods;

        private CSharpMethodCollection(IReadOnlyList<CSharpMethod> methods)
        {
            _cSharpMethods = methods ?? Array.Empty<CSharpMethod>();
        }

        /// <summary>
        /// Builds a default <see cref="CSharpMethodCollection"/> for the given <see cref="InputOperation"/>
        /// with a single method that creates a message.
        /// </summary>
        /// <param name="operation">The <see cref="InputOperation"/> to convert.</param>
        public static CSharpMethodCollection DefaultCSharpMethodCollection(InputOperation operation)
        {
            var createMessageMethod = BuildCreateMessageMethod(operation);
            var cSharpMethods = new List<CSharpMethod>() { createMessageMethod };
            // TO-DO: Add Protocol and Convenience methods https://github.com/Azure/autorest.csharp/issues/4585, https://github.com/Azure/autorest.csharp/issues/4586
            return new CSharpMethodCollection(cSharpMethods);
        }

        public CSharpMethod this[int index]
        {
            get { return _cSharpMethods[index]; }
        }

        public int Count
        {
            get { return _cSharpMethods.Count; }
        }

        private static CSharpMethod BuildCreateMessageMethod(InputOperation operation)
        {
            // TO-DO: properly build method https://github.com/Azure/autorest.csharp/issues/4583
            List<Parameter> methodParameters = new();
            foreach (var inputParam in operation.Parameters)
            {
              methodParameters.Add(CodeModelPlugin.Instance.TypeFactory.CreateCSharpParam(inputParam));
            }

            var methodModifier = MethodSignatureModifiers.Internal;
            var methodSignatureName = $"Create{operation.Name.ToCleanName()}Request";
            var methodSignature = new MethodSignature(methodSignatureName, FormattableStringHelpers.FromString(operation.Summary), FormattableStringHelpers.FromString(operation.Description), methodModifier, null, null, Parameters: methodParameters);
            var methodBody = new EmptyLineStatement();

            return new CSharpMethod(methodSignature, methodBody, CSharpMethodKinds.CreateMessage);
        }

        /// <summary>
        /// Returns all methods in the collection of a specific kind.
        /// </summary>
        internal List<CSharpMethod> GetMethods(CSharpMethodKinds kind)
        {
            var methods = new List<CSharpMethod>();
            foreach (var method in _cSharpMethods)
            {
                if (method.Kind == kind)
                {
                    methods.Add(method);
                }
            }

            return methods;
        }

        public IEnumerator<CSharpMethod> GetEnumerator()
        {
            return _cSharpMethods.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}
