// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator
{
    internal class SpecTypeProvider : TypeProvider
    {
        private readonly TypeProvider _underlyingProvider;

        public SpecTypeProvider(TypeProvider underlyingProvider)
        {
            _underlyingProvider = underlyingProvider;
        }

        protected internal override PropertyProvider[] BuildProperties() => _underlyingProvider.BuildProperties();
        protected internal override FieldProvider[] BuildFields() => _underlyingProvider.BuildFields();
        protected internal override MethodProvider[] BuildMethods() => _underlyingProvider.BuildMethods();
        protected internal override ConstructorProvider[] BuildConstructors() => _underlyingProvider.BuildConstructors();

        protected override string BuildRelativeFilePath() => _underlyingProvider.RelativeFilePath;
        protected override string BuildName() => _underlyingProvider.Name;
        private protected override bool FilterCustomizedMembers => false;
    }
}
