import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Shield, Search, Loader2, ExternalLink, Globe, MapPin, Building, Network, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";

interface IPData {
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
}

interface BackendResponse {
  ip: string;
  timestamp: string;
  raw_data?: {
    AbuseIPDB?: any;
    VirusTotal?: any;
    Shodan?: any;
    ipapi?: IPData;
    SecurityTrails?: any;
  };
  threat_report?: {
    ip: string;
    score: number;
    verdict: string;
    categories: string[];
    report_text: string;
  };
}

export function IPDetails() {
  const { ip } = useParams<{ ip: string }>();
  const navigate = useNavigate();

  const [newIp, setNewIp] = useState("");
  const [backendData, setBackendData] = useState<BackendResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch backend data
  useEffect(() => {
    if (!ip) return;
    fetchIPData(ip);
  }, [ip]);

  const fetchIPData = async (ipAddress: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/lookup/${ipAddress}`);
      const data: BackendResponse = await response.json();

      if (!response.ok) throw new Error("Failed to fetch API data");

      setBackendData(data);
    } catch (err) {
      console.error(err);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIp.trim()) navigate(`/details/${newIp.trim()}`);
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'malicious': return 'text-red-500';
      case 'suspicious': return 'text-yellow-500';
      case 'benign': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'malicious': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'suspicious': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'benign': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <CheckCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="text-gray-400">Analyzing IP address...</p>
        </div>
      </div>
    );
  }

  if (!backendData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load IP data</p>
          <Button onClick={() => ip && fetchIPData(ip)}>Retry</Button>
        </div>
      </div>
    );
  }

  const { ipapi, AbuseIPDB, VirusTotal, Shodan } = backendData.raw_data || {};
  const threatReport = backendData.threat_report;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <header className="flex justify-end items-center p-8">
          <motion.button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Shield className="w-10 h-10 text-cyan-400" />
            <span className="text-xl text-cyan-400">CyberGuard</span>
          </motion.button>
        </header>

        <div className="px-8 pb-12 max-w-7xl mx-auto">
          {/* IP Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{backendData.ip}</h1>
                <p className="text-gray-400">Analysis Report - {new Date(backendData.timestamp).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(backendData, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${backendData.ip}-report.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  variant="outline"
                  className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                >
                  Export Data
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Threat Summary Card */}
          {threatReport && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8"
            >
              <Card className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getVerdictIcon(threatReport.verdict)}
                      <span className={`text-xl font-semibold ${getVerdictColor(threatReport.verdict)}`}>
                        {threatReport.verdict}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      Risk Score: {threatReport.score}%
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {threatReport.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm border border-red-500/30"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Geolocation Data */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Geolocation Data
                </h2>
                <div className="space-y-3">
                  {ipapi?.country && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Country:</span>
                      <span className="text-white">{ipapi.country} ({ipapi.countryCode})</span>
                    </div>
                  )}
                  {ipapi?.regionName && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Region:</span>
                      <span className="text-white">{ipapi.regionName}</span>
                    </div>
                  )}
                  {ipapi?.city && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">City:</span>
                      <span className="text-white">{ipapi.city}</span>
                    </div>
                  )}
                  {ipapi?.zip && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">ZIP Code:</span>
                      <span className="text-white">{ipapi.zip}</span>
                    </div>
                  )}
                  {ipapi?.lat && ipapi?.lon && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coordinates:</span>
                      <span className="text-white">{ipapi.lat}, {ipapi.lon}</span>
                    </div>
                  )}
                  {ipapi?.timezone && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Timezone:</span>
                      <span className="text-white">{ipapi.timezone}</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Network Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Network Information
                </h2>
                <div className="space-y-3">
                  {ipapi?.org && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Organization:</span>
                      <span className="text-white">{ipapi.org}</span>
                    </div>
                  )}
                  {ipapi?.isp && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">ISP:</span>
                      <span className="text-white">{ipapi.isp}</span>
                    </div>
                  )}
                  {ipapi?.as && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">ASN:</span>
                      <span className="text-white">{ipapi.as}</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Security Data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Intelligence
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* AbuseIPDB */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      AbuseIPDB
                    </h3>
                    {AbuseIPDB?.data ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Confidence:</span>
                          <span className="text-white">{AbuseIPDB.data.abuseConfidenceScore}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Reports:</span>
                          <span className="text-white">{AbuseIPDB.data.totalReports}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No data available</p>
                    )}
                  </div>

                  {/* VirusTotal */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      VirusTotal
                    </h3>
                    {VirusTotal?.data?.attributes?.last_analysis_stats ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Harmless:</span>
                          <span className="text-green-400">{VirusTotal.data.attributes.last_analysis_stats.harmless}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Malicious:</span>
                          <span className="text-red-400">{VirusTotal.data.attributes.last_analysis_stats.malicious}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Suspicious:</span>
                          <span className="text-yellow-400">{VirusTotal.data.attributes.last_analysis_stats.suspicious}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No data available</p>
                    )}
                  </div>

                  {/* Shodan */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                      <Network className="w-4 h-4" />
                      Shodan
                    </h3>
                    {Shodan ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Open Ports:</span>
                          <span className="text-white">
                            {Shodan.ports?.length ? Shodan.ports.join(', ') : 'None'}
                          </span>
                        </div>
                        {Shodan.org && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Organization:</span>
                            <span className="text-white">{Shodan.org}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No data available</p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Raw Data Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-cyan-400 mb-4">Raw Data</h2>
                <pre className="text-xs text-gray-300 bg-gray-800/50 p-4 rounded overflow-x-auto max-h-60">
                  {JSON.stringify(backendData, null, 2)}
                </pre>
              </Card>
            </motion.div>
          </div>

          {/* Lookup Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8"
          >
            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <h2 className="text-xl mb-4 text-cyan-400">Lookup Another IP</h2>
              <form onSubmit={handleNewSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter IP Address"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  className="bg-gray-950/90 border-gray-700 text-white h-12 px-4 flex-1"
                />
                <Button
                  type="submit"
                  className="h-12 px-6 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white"
                  disabled={!newIp.trim()}
                >
                  <Search className="w-4 h-4 mr-2" /> Search
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}