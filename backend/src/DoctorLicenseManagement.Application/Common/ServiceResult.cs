namespace DoctorLicenseManagement.Application.Common;

/// <summary>
/// Discriminated union for service operation results.
/// Avoids throwing exceptions for expected business-rule violations.
/// </summary>
public class ServiceResult<T>
{
    public bool     IsSuccess    { get; private init; }
    public T?       Data         { get; private init; }
    public string?  ErrorMessage { get; private init; }
    public string?  ErrorCode    { get; private init; }

    public static ServiceResult<T> Success(T data) =>
        new() { IsSuccess = true, Data = data };

    public static ServiceResult<T> Failure(string message, string? code = null) =>
        new() { IsSuccess = false, ErrorMessage = message, ErrorCode = code };
}

public class ServiceResult
{
    public bool    IsSuccess    { get; private init; }
    public string? ErrorMessage { get; private init; }
    public string? ErrorCode    { get; private init; }

    public static ServiceResult Success() =>
        new() { IsSuccess = true };

    public static ServiceResult Failure(string message, string? code = null) =>
        new() { IsSuccess = false, ErrorMessage = message, ErrorCode = code };
}
