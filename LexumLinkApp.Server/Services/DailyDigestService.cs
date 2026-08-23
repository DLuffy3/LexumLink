namespace LexumLinkApp.Server.Services
{
    // Runs once a day (~07:00 server time): emails upcoming-deadline / overdue-case digests,
    // overdue task reminders, stale-case alerts, and auto-archives long-closed cases.
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

                using var scope = _scopeFactory.CreateScope();
                var notify = scope.ServiceProvider.GetRequiredService<INotificationService>();

                // Each job runs independently — one failing (e.g. a bad SMTP config) should
                // never stop the others, especially auto-archiving, from running.
                try
                {
                    await notify.SendDailyDigestsAsync(stoppingToken);
                    _logger.LogInformation("Daily case digest run completed.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Daily case digest run failed.");
                }

                try
                {
                    await notify.NotifyOverdueTasksAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Overdue task reminder run failed.");
                }

                try
                {
                    await notify.NotifyStaleCasesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Stale case alert run failed.");
                }

                try
                {
                    await notify.ArchiveClosedCasesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Auto-archive run failed.");
                }
            }
        }
    }
}
