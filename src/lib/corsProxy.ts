
export default function corsProxy(url: string): string {
    return "https://corsproxy.io/?" + encodeURIComponent(url);
}