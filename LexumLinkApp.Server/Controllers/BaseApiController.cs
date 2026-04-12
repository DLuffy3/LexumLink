using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexumLinkApp.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseApiController : ControllerBase
    {
        protected Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var id) ? id : Guid.Empty;
        }

        protected Guid GetOrganizationId()
        {
            var orgIdClaim = User.FindFirst("orgId")?.Value;
            return Guid.TryParse(orgIdClaim, out var id) ? id : Guid.Empty;
        }

        protected string GetUserRole()
        {
            return User.FindFirst("role")?.Value ?? "viewer";
        }
    }
}