namespace HrcTech.Application.Interfaces;

public interface IProcessingQueue
{
    ValueTask EnqueueAsync(Guid lessonId, CancellationToken ct = default);
}