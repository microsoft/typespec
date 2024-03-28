// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Text;

namespace AutoRest.CSharp.AutoRest.Communication.MessageHandling
{
    [SuppressMessage("ReSharper", "IdentifierTypo")]
    internal class PeekableBinaryStream : IDisposable
    {
#pragma warning disable IDE0069 // Disposable fields should be disposed
        private readonly Stream _stream;
#pragma warning restore IDE0069 // Disposable fields should be disposed

        private byte? _currentByte;
        public byte? CurrentByte
        {
            get
            {
                if (_currentByte.HasValue) return _currentByte.Value;

                var newByte = GetByte();
                if (newByte.HasValue)
                {
                    _currentByte = newByte;
                }
                return newByte;
            }
        }

        private const int EndOfStream = -1;

        public PeekableBinaryStream(Stream stream)
        {
            _stream = stream;
        }

        public void Dispose()
        {
            _stream.Dispose();
        }

        private byte? PopCurrentByte()
        {
            if (!_currentByte.HasValue) return null;

            var result = _currentByte.Value;
            _currentByte = null;
            return result;
        }

        // Pops the current byte or reads a new one if there is no current byte
        // Returns null if end-of-stream
        private byte? GetByte()
        {
            if (_currentByte.HasValue) return PopCurrentByte();

            var streamByte = _stream.ReadByte();
            return streamByte != EndOfStream ? (byte?)streamByte : null;
        }

        public byte[] ReadBytes(int count)
        {
            var buffer = new byte[count];
            var index = 0;
            if (count > 0 && _currentByte.HasValue)
            {
                // ReSharper disable once PossibleInvalidOperationException
                // ReSharper disable once PossibleNullReferenceException
                buffer[index++] = PopCurrentByte()!.Value;
            }
            while (index < count)
            {
                index += _stream.Read(buffer, index, count - index);
            }
            return buffer;
        }

        public string? ReadAsciiLine()
        {
            var sb = new StringBuilder();
            byte? character;
            while ((character = GetByte()).HasValue && character != '\r' && character != '\n')
            {
                sb.Append((char)character.Value);
            }

            // CurrentByte will only ever be null or a non-line-ending value when this method returns since we read until line ending characters,
            // and discard the last value if it is a '\n' preceded by a '\r'.
            if (character == '\r' && CurrentByte == '\n')
            {
                GetByte();
            }

            return sb.Length != 0 ? sb.ToString() : null;
        }

        public IEnumerable<string?> ReadAllAsciiLines(Predicate<string?>? condition = null)
        {
            condition ??= s => s == null;
            string? line;
            while (condition(line = ReadAsciiLine()))
            {
                yield return line;
            }
        }
    }
}
