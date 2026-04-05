using DoctorLicenseManagement.Application.Common;
using DoctorLicenseManagement.Application.DTOs.Auth;

namespace DoctorLicenseManagement.Application.Interfaces;

public interface IAuthService
{
    /// <summary>
    /// Creates tenant + admin user + subscription in one atomic operation.
    /// </summary>
    Task<ServiceResult<TokenResponseDto>> RegisterAsync(RegisterDto dto, CancellationToken ct = default);

    Task<ServiceResult<TokenResponseDto>> LoginAsync(LoginDto dto, CancellationToken ct = default);
}
