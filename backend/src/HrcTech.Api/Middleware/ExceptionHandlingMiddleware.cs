using HrcTech.Application.Exceptions;

namespace HrcTech.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client disconnected. Nothing to return.
        }
        catch (AppException ex) when (!context.Response.HasStarted)
        {
            // Expected business errors (400, 401, 403, 404, 409, 413, 429). Headers such as Set-Cookie are kept.
            await WriteAsync(context, ex.StatusCode, ex.Message);
        }
        catch (BadHttpRequestException ex) when (!context.Response.HasStarted)
        {
            var tooLarge = ex.StatusCode == StatusCodes.Status413PayloadTooLarge;
            await WriteAsync(context, tooLarge ? 413 : 400, tooLarge ? "The upload is too large." : "The request is invalid.");
        }
        catch (InvalidDataException) when (!context.Response.HasStarted)
        {
            // Thrown by the multipart reader for malformed uploads or when a form limit is exceeded.
            await WriteAsync(context, 400, "The upload is invalid or exceeds the size limit.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);

            if (context.Response.HasStarted) throw;

            context.Response.Clear();
            await WriteAsync(context, StatusCodes.Status500InternalServerError, "An unexpected error occurred. Please try again later.");
        }
    }

    private static async Task WriteAsync(HttpContext context, int status, string message)
    {
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new { message });
    }
}