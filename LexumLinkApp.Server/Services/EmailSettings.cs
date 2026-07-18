namespace LexumLinkApp.Server.Services
{
    public class EmailSettings
    {
        // When false (or Host empty), emails are logged instead of sent — safe for dev.
        public bool Enabled { get; set; } = false;
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; } = 587;
        public bool UseStartTls { get; set; } = true;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FromEmail { get; set; } = "no-reply@lexumlink.com";
        public string FromName { get; set; } = "Lexum Link";
    }
}
