namespace LexumLinkApp.Server.Services
{
    // Runs once a day (~07:00 server time) and emails upcoming-deadline / overdue-case digests.
    public class DailyDigestService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DailyDigestService> _logger;
        private const int RunHour = 7;

        public DailyDigestService(IServiceScopeFactory scopeFactory, ILogger<DailyDigestService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.Now;
                var next = now.Date.AddHours(RunHour);
                if (next <= now) next = next.AddDays(1);

                try
                {
                    await Task.Delay(next - now, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }

                if (stoppingToken.IsCancellationRequested) break;

                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var notify = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    await notify.SendDailyDigestsAsync(stoppingToken);
                    _logger.LogInformation("Daily case digest run completed.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Daily case digest run failed.");
                }
            }
        }
    }
}
