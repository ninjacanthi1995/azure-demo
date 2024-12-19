export function isStudioDomain(urlName: string) {
    try {
        const url = new URL(urlName);
        return (
            url.hostname === 'studio-dev.d-id.com' ||
            url.hostname === 'studio-staging.d-id.com' ||
            url.hostname === 'studio.d-id.com'
        );
    } catch (error) {
        return false;
    }
}
