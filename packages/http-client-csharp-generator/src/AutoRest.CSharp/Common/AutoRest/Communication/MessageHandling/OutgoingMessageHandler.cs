// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoRest.CSharp.AutoRest.Communication.Serialization;

namespace AutoRest.CSharp.AutoRest.Communication.MessageHandling
{
#pragma warning disable IDE0069 // Disposable fields should be disposed
    internal class OutgoingMessageHandler : IDisposable
    {
        private readonly Stream _stream;
        private readonly CancellationToken _cancellationToken;
        private readonly Semaphore _streamSemaphore = new Semaphore(1, 1);

        public OutgoingMessageHandler(Stream stream, CancellationToken cancellationToken)
        {
            _stream = stream;
            _cancellationToken = cancellationToken;
        }

        public async Task Send(string json)
        {
            _streamSemaphore.WaitOne();

            var buffer = Encoding.UTF8.GetBytes(json);
            var header = Encoding.ASCII.GetBytes(OutgoingMessageSerializer.Header(buffer.Length));
            await _stream.WriteAsync(header, 0, header.Length, _cancellationToken);
            await _stream.WriteAsync(buffer, 0, buffer.Length, _cancellationToken);

            _streamSemaphore.Release();
        }

        public async Task Respond(string id, string json)
        {
            await Send(OutgoingMessageSerializer.Response(id, json)).ConfigureAwait(false);
        }

        public void Dispose()
        {
            _streamSemaphore?.Dispose();
        }
    }
#pragma warning restore IDE0069 // Disposable fields should be disposed
}
