using System.Diagnostics;
using System.Text;
using HrcTech.Application.Exceptions;

namespace HrcTech.Infrastructure.Processing;

internal sealed record ProcessResult(int ExitCode, string StdOut, string StdErr);

internal static class ProcessRunner
{
    private const int MaxCapturedChars = 1_000_000;

    public static async Task<ProcessResult> RunAsync(
        string fileName, IEnumerable<string> arguments, string? workingDirectory, TimeSpan timeout, CancellationToken ct)
    {
        var startInfo = new ProcessStartInfo(fileName)
        {
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };
        if (workingDirectory is not null) startInfo.WorkingDirectory = workingDirectory;

        // ArgumentList passes each argument as-is. No shell is involved, so nothing can be injected.
        foreach (var argument in arguments) startInfo.ArgumentList.Add(argument);

        using var process = new Process { StartInfo = startInfo };
        var stdout = new StringBuilder();
        var stderr = new StringBuilder();
        process.OutputDataReceived += (_, e) => Append(stdout, e.Data);
        process.ErrorDataReceived += (_, e) => Append(stderr, e.Data);

        try
        {
            process.Start();
        }
        catch (Exception ex) when (ex is System.ComponentModel.Win32Exception or FileNotFoundException)
        {
            throw new ProcessingException("A required media tool could not be started. Make sure FFmpeg is installed and configured on the server.");
        }

        process.StandardInput.Close();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(timeout);

        try
        {
            await process.WaitForExitAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            TryKill(process);
            if (ct.IsCancellationRequested) throw;   // server shutting down
            throw new ProcessingException("Processing took too long and was stopped.");
        }

        return new ProcessResult(process.ExitCode, stdout.ToString(), stderr.ToString());
    }

    private static void Append(StringBuilder sb, string? line)
    {
        if (line is null || sb.Length > MaxCapturedChars) return;
        sb.AppendLine(line);
    }

    private static void TryKill(Process process)
    {
        try
        {
            if (!process.HasExited) process.Kill(entireProcessTree: true);
        }
        catch
        {
            // already gone
        }
    }
}