using System.Threading.Channels;
using HrcTech.Application.Interfaces;

namespace HrcTech.Infrastructure.Processing;

public sealed class ProcessingQueue : IProcessingQueue
{
    private readonly Channel<Guid> _channel = Channel.CreateUnbounded<Guid>(new UnboundedChannelOptions { SingleReader = true });

    public ValueTask EnqueueAsync(Guid lessonId, CancellationToken ct = default) =>
        _channel.Writer.WriteAsync(lessonId, ct);

    public IAsyncEnumerable<Guid> ReadAllAsync(CancellationToken ct) => _channel.Reader.ReadAllAsync(ct);
}