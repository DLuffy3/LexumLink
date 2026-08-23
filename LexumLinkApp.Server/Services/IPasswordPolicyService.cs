namespace LexumLinkApp.Server.Services
{
    public interface IPasswordPolicyService
    {
        // Returns a list of human-readable violations; empty list means the password is valid.
        Task<List<string>> ValidateAsync(string password);
    }
}
