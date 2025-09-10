// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests
{
    public class FilteredMethodsTypeProvider : TypeProvider
    {
        private readonly TypeProvider _provider;
        private readonly Func<string, bool> _include;

        public FilteredMethodsTypeProvider(TypeProvider provider, Func<string, bool> includeMethod)
        {
            _provider = provider;
            _include = includeMethod;
        }

        protected override MethodProvider[] BuildMethods()
        {
            return _provider.Methods.Where(m => _include.Invoke(m.Signature.Name)).ToArray();
        }

        protected override string BuildRelativeFilePath() => _provider.RelativeFilePath;

        protected override string BuildName() => _provider.Name;
    }
}
