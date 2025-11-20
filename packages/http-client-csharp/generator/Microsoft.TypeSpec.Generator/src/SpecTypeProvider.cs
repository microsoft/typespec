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

        public override PropertyProvider[] Properties => _underlyingProvider.BuildProperties();
        public override FieldProvider[] Fields => _underlyingProvider.BuildFields();
        public override MethodProvider[] Methods => _underlyingProvider.BuildMethods();
        public override ConstructorProvider[] Constructors => _underlyingProvider.BuildConstructors();

        protected override string BuildRelativeFilePath() => _underlyingProvider.RelativeFilePath;
        protected override string BuildName() => _underlyingProvider.Name;
    }
}
