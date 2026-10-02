FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY HrcTech.sln .
COPY src/HrcTech.Domain/*.csproj src/HrcTech.Domain/
COPY src/HrcTech.Application/*.csproj src/HrcTech.Application/
COPY src/HrcTech.Infrastructure/*.csproj src/HrcTech.Infrastructure/
COPY src/HrcTech.Api/*.csproj src/HrcTech.Api/
RUN dotnet restore src/HrcTech.Api/HrcTech.Api.csproj

COPY src/ src/
RUN dotnet publish src/HrcTech.Api/HrcTech.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# FFmpeg + a watermark font (Linux equivalent of the Windows dev setup from Phase 5).
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

# Non-root user: the container never runs the app as root.
RUN useradd --uid 1000 --create-home appuser
COPY --from=build /app .
RUN mkdir -p /storage && chown -R appuser:appuser /app /storage
USER appuser

ENV ASPNETCORE_URLS=http://+:8080
ENV Processing__FfmpegPath=ffmpeg
ENV Processing__FfprobePath=ffprobe
ENV Processing__WatermarkFontPath=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
ENV Storage__RootPath=/storage
ENV Database__MigrateOnStartup=false

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
    CMD wget -q --spider http://localhost:8080/api/health || exit 1

ENTRYPOINT ["dotnet", "HrcTech.Api.dll"]