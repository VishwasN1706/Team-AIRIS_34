import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

interface ThreatGaugeProps {
  score: number;
}

export function ThreatGauge({ score }: ThreatGaugeProps) {
  const data = [{ 
    name: "Threat", 
    value: score, 
    fill: score > 70 ? "#ef4444" : score > 40 ? "#facc15" : "#22c55e" 
  }];

  return (
    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl">
      <h2 className="text-xl font-semibold text-cyan-400 mb-4">🧠 Threat Level Indicator</h2>
      <div className="flex justify-center items-center">
        <RadialBarChart
          width={300}
          height={300}
          cx={150}
          cy={150}
          innerRadius={90}
          outerRadius={130}
          barSize={20}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          {/* FIX: Removed the clockwise prop entirely - not needed in v3 */}
          <RadialBar 
            background 
            dataKey="value" 
            cornerRadius={10} 
          />
          <text x={150} y={150} textAnchor="middle" fill="white" fontSize={24}>
            {score}%
          </text>
        </RadialBarChart>
      </div>
    </div>
  );
}