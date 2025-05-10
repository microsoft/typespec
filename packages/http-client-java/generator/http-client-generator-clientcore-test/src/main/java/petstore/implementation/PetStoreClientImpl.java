package petstore.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the PetStoreClient type.
 */
public final class PetStoreClientImpl {
    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The PetsImpl object to access its operations.
     */
    private final PetsImpl pets;

    /**
     * Gets the PetsImpl object to access its operations.
     * 
     * @return the PetsImpl object.
     */
    public PetsImpl getPets() {
        return this.pets;
    }

    /**
     * The PetCheckupsImpl object to access its operations.
     */
    private final PetCheckupsImpl petCheckups;

    /**
     * Gets the PetCheckupsImpl object to access its operations.
     * 
     * @return the PetCheckupsImpl object.
     */
    public PetCheckupsImpl getPetCheckups() {
        return this.petCheckups;
    }

    /**
     * The PetInsurancesImpl object to access its operations.
     */
    private final PetInsurancesImpl petInsurances;

    /**
     * Gets the PetInsurancesImpl object to access its operations.
     * 
     * @return the PetInsurancesImpl object.
     */
    public PetInsurancesImpl getPetInsurances() {
        return this.petInsurances;
    }

    /**
     * The ToysImpl object to access its operations.
     */
    private final ToysImpl toys;

    /**
     * Gets the ToysImpl object to access its operations.
     * 
     * @return the ToysImpl object.
     */
    public ToysImpl getToys() {
        return this.toys;
    }

    /**
     * The ToyInsurancesImpl object to access its operations.
     */
    private final ToyInsurancesImpl toyInsurances;

    /**
     * Gets the ToyInsurancesImpl object to access its operations.
     * 
     * @return the ToyInsurancesImpl object.
     */
    public ToyInsurancesImpl getToyInsurances() {
        return this.toyInsurances;
    }

    /**
     * The CheckupsImpl object to access its operations.
     */
    private final CheckupsImpl checkups;

    /**
     * Gets the CheckupsImpl object to access its operations.
     * 
     * @return the CheckupsImpl object.
     */
    public CheckupsImpl getCheckups() {
        return this.checkups;
    }

    /**
     * The OwnersImpl object to access its operations.
     */
    private final OwnersImpl owners;

    /**
     * Gets the OwnersImpl object to access its operations.
     * 
     * @return the OwnersImpl object.
     */
    public OwnersImpl getOwners() {
        return this.owners;
    }

    /**
     * The OwnerCheckupsImpl object to access its operations.
     */
    private final OwnerCheckupsImpl ownerCheckups;

    /**
     * Gets the OwnerCheckupsImpl object to access its operations.
     * 
     * @return the OwnerCheckupsImpl object.
     */
    public OwnerCheckupsImpl getOwnerCheckups() {
        return this.ownerCheckups;
    }

    /**
     * The OwnerInsurancesImpl object to access its operations.
     */
    private final OwnerInsurancesImpl ownerInsurances;

    /**
     * Gets the OwnerInsurancesImpl object to access its operations.
     * 
     * @return the OwnerInsurancesImpl object.
     */
    public OwnerInsurancesImpl getOwnerInsurances() {
        return this.ownerInsurances;
    }

    /**
     * Initializes an instance of PetStoreClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public PetStoreClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.pets = new PetsImpl(this);
        this.petCheckups = new PetCheckupsImpl(this);
        this.petInsurances = new PetInsurancesImpl(this);
        this.toys = new ToysImpl(this);
        this.toyInsurances = new ToyInsurancesImpl(this);
        this.checkups = new CheckupsImpl(this);
        this.owners = new OwnersImpl(this);
        this.ownerCheckups = new OwnerCheckupsImpl(this);
        this.ownerInsurances = new OwnerInsurancesImpl(this);
    }
}
