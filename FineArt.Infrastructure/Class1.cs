using FineArt.Application;
using FineArt.Domain;

namespace FineArt.Infrastructure;

public class InfrastructureMarker
{
    private readonly ApplicationMarker _applicationMarker = new();
    private readonly DomainMarker _domainMarker = new();
}
