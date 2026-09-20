namespace HrcTech.Domain.Enums;

public enum ProcessingStatus
{
    NoContent = 0,   // lesson created, no file yet
    Queued = 1,      // uploaded, waiting for the worker
    Processing = 2,  // see ProcessingStage
    Ready = 3,       // watermarked, verified, streamable
    Failed = 4       // raw file kept privately so the admin can retry
}