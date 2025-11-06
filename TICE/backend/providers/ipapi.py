import httpx

class IpapiClient:
    name = "ipapi"

    async def fetch(self, ip: str):
        url = f"http://ip-api.com/json/{ip}"
        async with httpx.AsyncClient() as client:
            r = await client.get(url, timeout=10)
            r.raise_for_status()
            return r.json()

    def normalize(self, raw):
        return {
            "provider": self.name,
            "geo": {
                "country": raw.get("country"),
                "city": raw.get("city"),
                "region": raw.get("regionName")
            },
            "asn": raw.get("as", ""),
            "confidence": 1.0
        }
