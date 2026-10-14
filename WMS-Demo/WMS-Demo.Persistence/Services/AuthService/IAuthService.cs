using WMSDemo.Domain.Auth;

namespace WMSDemo.Persistence.Services.AuthService;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
}
