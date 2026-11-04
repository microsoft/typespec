// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed partial class CodeWriter
    {
        private PreparedFieldTypes? _sourcePreparation;
        private PreparedSourceFile? _sourceFile;
        private PreparedSourceFile.Cursor? _sourceCursor;
        internal PreparedSourceOccurrence? CurrentSourceOccurrence => _sourceCursor?.Current;
        internal PreparedSourceObservations.PreparedOccurrenceObservations? CurrentSourceObservations => _sourceCursor?.Current is { } occurrence
            ? _sourceFile?.Observations?.GetCurrent(occurrence) : null;

        internal void AttachSourceFile(PreparedFieldTypes preparation, TypeProvider owner)
        {
            _sourcePreparation = preparation;
            _sourceFile = preparation.GetSourceFile(owner);
            _sourceCursor = _sourceFile?.Start();
        }

        internal IDisposable BeginSourceRoot(TypeProvider owner, string role, int index)
        {
            _sourcePreparation?.ObserveSourceSnapshot();
            return _sourceCursor?.BeginRoot(owner, role, index) ?? PreparedSourceFile.EmptyScope.Instance;
        }

        internal IDisposable EnterSourceNode(object producer)
        {
            _sourcePreparation?.ObserveSourceSnapshot();
            return _sourceCursor?.Enter(producer) ?? PreparedSourceFile.EmptyScope.Instance;
        }

        internal SourceConsumptionReceipt? CompleteSourceFile()
        {
            _sourcePreparation?.ObserveSourceSnapshot();
            if (_sourceFile is null || _sourceCursor is null) { return null; }
            return new(_sourceFile.Generation, _sourceFile.FilePath, _sourceFile.Roots.Length,
                _sourceCursor.Consumed, _sourceCursor.Complete());
        }
    }
}
