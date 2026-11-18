import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: "http://localhost:8080",
    realm: "food-delivery",
    clientId: "food-delivery-client",
});

export const initKeycloak = async () => {
    try {
        const authenticated = await keycloak.init({
            onLoad: "check-sso",
            pkceMethod: "S256",
            checkLoginIframe: false,
        });

        console.log(
            "Keycloak initialized. Authenticated:",
            authenticated
        );

        return authenticated;

    } catch (error) {
        console.error("Keycloak initialization failed:", error);
        throw error;
    }
};

export default keycloak;