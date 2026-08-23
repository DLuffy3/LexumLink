namespace LexumLinkApp.Server.Services
{
    public class PasswordPolicyService : IPasswordPolicyService
    {
        private readonly IPlatformSettingsService _settingsService;
        public PasswordPolicyService(IPlatformSettingsService settingsService) => _settingsService = settingsService;

        public async Task<List<string>> ValidateAsync(string password)
        {
            var settings = await _settingsService.GetAsync();
            var errors = new List<string>();
            password ??= string.Empty;

            if (password.Length < settings.PasswordMinLength)
                errors.Add($"Password must be at least {settings.PasswordMinLength} characters long.");

            if (settings.PasswordRequireUppercase && !password.Any(char.IsUpper))
                errors.Add("Password must contain at least one uppercase letter.");

            if (settings.PasswordRequireNumber && !password.Any(char.IsDigit))
                errors.Add("Password must contain at least one number.");

            if (settings.PasswordRequireSpecialChar && password.All(char.IsLetterOrDigit))
                errors.Add("Password must contain at least one special character.");

            return errors;
        }
    }
}
