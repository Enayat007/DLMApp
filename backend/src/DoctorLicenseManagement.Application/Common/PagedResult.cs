namespace DoctorLicenseManagement.Application.Common;

/// <summary>
/// Generic paged result wrapper returned from listing endpoints.
/// </summary>
public class PagedResult<T>
{
    public IEnumerable<T> Items      { get; init; } = [];
    public int            TotalCount { get; init; }
    public int            PageNumber { get; init; }
    public int            PageSize   { get; init; }
    public int            TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public bool           HasNextPage     => PageNumber < TotalPages;
    public bool           HasPreviousPage => PageNumber > 1;

    public static PagedResult<T> Create(IEnumerable<T> items, int totalCount, int pageNumber, int pageSize) =>
        new() { Items = items, TotalCount = totalCount, PageNumber = pageNumber, PageSize = pageSize };
}
