import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());

const PORT = 3000;

// Shared type structures
type ProviderKey = 'multicloud' | 'azure' | 'aws' | 'gcp' | 'm365';

interface CostRecord {
  id: string;
  providerId: ProviderKey;
  date: string;
  service: string;
  resource?: string;
  cost: number;
  currency: string;
  tags?: Record<string, string>;
}

interface Budget {
  id: string;
  providerId: ProviderKey;
  name: string;
  amount: number;
  thresholdPct: number;
  period: 'monthly' | 'quarterly' | 'yearly';
}

interface Alert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'Budget' | 'Anomaly' | 'Waste';
  title: string;
  message: string;
  value: number;
  threshold?: number;
  status: 'active' | 'acknowledged';
  createdAt: string;
}

interface Recommendation {
  id: string;
  providerId: ProviderKey;
  title: string;
  description: string;
  monthlySaving: number;
  pctOfSpend: number;
  category: 'rightsizing' | 'cleanup' | 'commitment';
  status: 'pending' | 'applied';
}

// Global In-Memory State
let providers: { key: ProviderKey; label: string; status: 'active' | 'syncing' | 'error' }[] = [
  { key: 'multicloud', label: 'MultiCloud Hub', status: 'active' },
  { key: 'aws', label: 'Amazon Web Services', status: 'active' },
  { key: 'azure', label: 'Microsoft Azure', status: 'active' },
  { key: 'gcp', label: 'Google Cloud Platform', status: 'active' },
  { key: 'm365', label: 'Microsoft 365 SaaS', status: 'active' }
];

let budgets: Budget[] = [
  { id: 'b1', providerId: 'multicloud', name: 'Global Tech Ops Budget', amount: 150000, thresholdPct: 85, period: 'monthly' },
  { id: 'b2', providerId: 'aws', name: 'AWS Cloud Tier', amount: 65000, thresholdPct: 80, period: 'monthly' },
  { id: 'b3', providerId: 'azure', name: 'Azure Core Infra', amount: 48000, thresholdPct: 80, period: 'monthly' },
  { id: 'b4', providerId: 'gcp', name: 'GCP Data & Analytics', amount: 30000, thresholdPct: 75, period: 'monthly' },
  { id: 'b5', providerId: 'm365', name: 'M365 Corporate Licenses', amount: 12000, thresholdPct: 90, period: 'monthly' }
];

let recommendations: Recommendation[] = [
  {
    id: 'rec1',
    providerId: 'azure',
    title: 'Downsize Idle SQL Databases',
    description: 'Found 3 Standard S3 SQL database instances in Azure with less than 2% average CPU utilization for 14 continuous days. Recommend scaling down to Standard S1.',
    monthlySaving: 1450,
    pctOfSpend: 3.1,
    category: 'rightsizing',
    status: 'pending'
  },
  {
    id: 'rec2',
    providerId: 'aws',
    title: 'Purge Unattached EBS Volumes',
    description: 'Detected 42 EBS block storage volumes that are unattached to any running EC2 instances, accumulating passive cost for 30+ days.',
    monthlySaving: 890,
    pctOfSpend: 1.4,
    category: 'cleanup',
    status: 'pending'
  },
  {
    id: 'rec3',
    providerId: 'gcp',
    title: 'Purchase Committed Use Discounts (CUD)',
    description: 'Analysis of continuous Compute Engine usage patterns suggests purchasing a 1-year CUD for N2 instances. This guarantees a flat 37% rate reduction.',
    monthlySaving: 4120,
    pctOfSpend: 14.2,
    category: 'commitment',
    status: 'pending'
  },
  {
    id: 'rec4',
    providerId: 'aws',
    title: 'Enable S3 Intelligent-Tiering Lifecycles',
    description: '8.2 TB of historical backups in raw standard S3 buckets are older than 90 days with zero retrieval activity. Transitioning to Intelligent-Tiering or Glacier Deep Archive will save up to 60%.',
    monthlySaving: 1250,
    pctOfSpend: 1.9,
    category: 'cleanup',
    status: 'pending'
  },
  {
    id: 'rec5',
    providerId: 'm365',
    title: 'Reclaim Inactive E5 Licenses',
    description: 'Identified 28 enterprise E5 user accounts without any active logins across Teams, Outlook, or SharePoint in the past 45 days. Reclaiming or downgrading to F3 saves substantial licensing fees.',
    monthlySaving: 1060,
    pctOfSpend: 8.8,
    category: 'rightsizing',
    status: 'pending'
  }
];

let alerts: Alert[] = [
  {
    id: 'a1',
    severity: 'CRITICAL',
    category: 'Anomaly',
    title: 'Sudden Compute Spend Spike',
    message: 'AWS EC2 Spot Instance rates spiked or fallback to on-demand occurred in us-east-1. Hourly run-rate increased by 420%.',
    value: 1240,
    threshold: 300,
    status: 'active',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() // 4 hours ago
  },
  {
    id: 'a2',
    severity: 'WARNING',
    category: 'Budget',
    title: 'GCP Budget Alert',
    message: 'GCP Data & Analytics billing has reached 82.5% of the allocated monthly plan ($30,000 threshold of $30k budget). Forecast suggests crossing limit in 4 days.',
    value: 24750,
    threshold: 22500,
    status: 'active',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() // yesterday
  },
  {
    id: 'a3',
    severity: 'INFO',
    category: 'Waste',
    title: 'Idle Server Discovered',
    message: 'Azure VM instance "prod-analytics-dw" has maintained under 1% CPU utilization for the last 72 hours.',
    value: 350,
    status: 'acknowledged',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() // 3 days ago
  }
];

// Helper to generate 30 days of historical records
const generateHistoricalCostRecords = (): CostRecord[] => {
  const records: CostRecord[] = [];
  const days = 30;
  const categories = ['Compute', 'Storage', 'Database', 'Networking', 'SaaS'];
  const servicesByProvider: Record<ProviderKey, Array<{ name: string; category: string; base: number }>> = {
    multicloud: [],
    aws: [
      { name: 'AWS EC2', category: 'Compute', base: 1200 },
      { name: 'AWS S3', category: 'Storage', base: 450 },
      { name: 'AWS RDS Mysql', category: 'Database', base: 600 },
      { name: 'AWS CloudFront & NAT', category: 'Networking', base: 250 }
    ],
    azure: [
      { name: 'Azure Virtual Machines', category: 'Compute', base: 950 },
      { name: 'Azure Blob Storage', category: 'Storage', base: 310 },
      { name: 'Azure SQL Database', category: 'Database', base: 510 },
      { name: 'Azure ExpressRoute & Gateway', category: 'Networking', base: 180 }
    ],
    gcp: [
      { name: 'GCP Compute Engine', category: 'Compute', base: 620 },
      { name: 'GCP Cloud Storage', category: 'Storage', base: 220 },
      { name: 'GCP Cloud Spanner', category: 'Database', base: 410 },
      { name: 'GCP Interconnect', category: 'Networking', base: 110 }
    ],
    m365: [
      { name: 'M365 Enterprise Licenses', category: 'SaaS', base: 350 },
      { name: 'OneDrive Active Storage', category: 'SaaS', base: 80 }
    ]
  };

  const nowMs = Date.now();
  for (let i = days; i >= 0; i--) {
    const dateStr = new Date(nowMs - i * 24 * 3600 * 1000).toISOString().split('T')[0];
    
    // For each provider
    (Object.keys(servicesByProvider) as ProviderKey[]).forEach(provKey => {
      if (provKey === 'multicloud') return;
      
      const services = servicesByProvider[provKey];
      services.forEach(svc => {
        // Add random variation
        const randomFactor = 0.85 + Math.random() * 0.3; // +- 15%
        const dayCost = svc.base * randomFactor;
        
        records.push({
          id: `r-${provKey}-${svc.name.replace(/\s+/g, '-').toLowerCase()}-${dateStr}`,
          providerId: provKey,
          date: dateStr,
          service: svc.category,
          resource: `${provKey}-${svc.name.toLowerCase().replace(/\s+/g, '-')}-01`,
          cost: parseFloat(dayCost.toFixed(2)),
          currency: 'USD',
          tags: {
            environment: dateStr.endsWith('7') || dateStr.endsWith('3') ? 'staging' : 'production',
            owner: provKey === 'aws' ? 'data-platform' : 'core-infra',
            dept: 'cloud-engineering'
          }
        });
      });
    });
  }
  return records;
};

let costRecords: CostRecord[] = generateHistoricalCostRecords();

// Dynamic simulation variable to track applied recommendation reductions
let dynamicCostReductions = {
  aws: 0,
  azure: 0,
  gcp: 0,
  m365: 0
};

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    })
  : null;

// API ROUTES
// Get all states for client
app.get("/api/dashboard/stats", (req, res) => {
  const providerKey = (req.query.provider as ProviderKey) || 'multicloud';
  
  // Filter cost records for active provider
  const filteredRecords = costRecords.filter(r => 
    providerKey === 'multicloud' ? true : r.providerId === providerKey
  );

  // Apply savings adjustments based on applied recommendation status
  const finalRecords = filteredRecords.map(r => {
    let reductionAmt = 0;
    // Calculate fractional reduction per cost record dynamically to match user's action
    if (r.providerId === 'azure' && dynamicCostReductions.azure > 0) reductionAmt = 0.05 * r.cost;
    if (r.providerId === 'aws' && dynamicCostReductions.aws > 0) reductionAmt = 0.03 * r.cost;
    if (r.providerId === 'gcp' && dynamicCostReductions.gcp > 0) reductionAmt = 0.08 * r.cost;
    if (r.providerId === 'm365' && dynamicCostReductions.m365 > 0) reductionAmt = 0.04 * r.cost;
    return {
      ...r,
      cost: parseFloat(Math.max(1, r.cost - reductionAmt).toFixed(2))
    };
  });

  // Calculate actual sum
  const latest30DaysRecords = finalRecords.filter(r => {
    const recDate = new Date(r.date);
    const cutOff = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    return recDate >= cutOff;
  });

  const totalSpend = latest30DaysRecords.reduce((sum, r) => sum + r.cost, 0);

  // Find assigned budget
  const providerBudget = budgets.find(b => b.providerId === providerKey);
  const totalBudget = providerBudget ? providerBudget.amount : 154000;

  // Forecast vs budget
  const forecastPct = parseFloat(((totalSpend / totalBudget) * 100).toFixed(1));

  // Run rate calculation (average daily cost in latest week)
  const latest7DaysRecords = latest30DaysRecords.filter(r => {
    const recDate = new Date(r.date);
    const cutOff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    return recDate >= cutOff;
  });
  const runRate = latest7DaysRecords.reduce((sum, r) => sum + r.cost, 0) / 7;

  // Saving calculations
  const providerRecs = recommendations.filter(rec => 
    providerKey === 'multicloud' ? true : rec.providerId === providerKey
  );
  const totalPotentialSavings = providerRecs.reduce((sum, r) => sum + r.monthlySaving, 0);
  const currentAppliedSavingsByRecs = providerRecs
    .filter(rec => rec.status === 'applied')
    .reduce((sum, r) => sum + r.monthlySaving, 0);

  // Initial standard base efficiency score that increments as cleanups are "Applied" by user.
  let baseEfficiency = 82;
  const appliedCount = providerRecs.filter(r => r.status === 'applied').length;
  const efficiencyScore = Math.min(100, baseEfficiency + (appliedCount * 4));

  // Generate Recharts chart array: latest 10 days for perfect visual flow and granularity
  const chartDays = 12;
  const recentChartData = [];
  const now = Date.now();

  for (let i = chartDays - 1; i >= 0; i--) {
    const dateObj = new Date(now - i * 24 * 3600 * 1000);
    const dateStr = dateObj.toISOString().split('T')[0];
    const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Costs on this particular day
    const dayRecords = finalRecords.filter(r => r.date === dateStr);
    const dailySpend = dayRecords.reduce((s, r) => s + r.cost, 0);
    
    // Compute proportionate local daily budget limit
    const dailyBudget = totalBudget / 30;
    const dailyForecast = dailySpend * (1.02 - Math.random() * 0.04); // subtle trend variance

    recentChartData.push({
      name: dateLabel,
      actual: parseFloat(dailySpend.toFixed(2)),
      budget: parseFloat(dailyBudget.toFixed(2)),
      forecast: parseFloat(dailyForecast.toFixed(2))
    });
  }

  // Aggregate service distribution
  const serviceSums: Record<string, number> = {};
  latest30DaysRecords.forEach(r => {
    serviceSums[r.service] = (serviceSums[r.service] || 0) + r.cost;
  });

  const colors = ['#001D58', '#00F19C', '#3B82F6', '#EF4444', '#F59E0B'];
  const serviceDistribution = Object.entries(serviceSums).map(([svc, val], idx) => ({
    name: svc,
    value: parseFloat(val.toFixed(2)),
    color: colors[idx % colors.length]
  }));

  // Provider breakdown
  const providerSums: Record<string, number> = {};
  latest30DaysRecords.forEach(r => {
    providerSums[r.providerId] = (providerSums[r.providerId] || 0) + r.cost;
  });

  const providerDistribution = Object.entries(providerSums).map(([pId, val], idx) => {
    const provMeta = providers.find(p => p.key === pId);
    return {
      name: provMeta ? provMeta.label : pId.toUpperCase(),
      value: parseFloat(val.toFixed(2)),
      color: pId === 'aws' ? '#F97316' : pId === 'azure' ? '#3B82F6' : pId === 'gcp' ? '#10B981' : '#8B5CF6'
    };
  });

  res.json({
    totalSpend: parseFloat(totalSpend.toFixed(2)),
    totalBudget,
    forecastPct,
    savingsFound: totalPotentialSavings - currentAppliedSavingsByRecs,
    savingsApplied: currentAppliedSavingsByRecs,
    efficiencyScore,
    runRate: parseFloat(runRate.toFixed(2)),
    recentChartData,
    serviceDistribution,
    providerDistribution
  });
});

// GET Alerts
app.get("/api/alerts", (req, res) => {
  res.json(alerts);
});

// Acknowledge Alert inline
app.post("/api/alerts/:id/acknowledge", (req, res) => {
  const { id } = req.params;
  const alert = alerts.find(a => a.id === id);
  if (alert) {
    alert.status = 'acknowledged';
    res.json({ success: true, alert });
  } else {
    res.status(404).json({ error: "Alert not found" });
  }
});

// Apply Recommendation
app.post("/api/recommendations/:id/apply", (req, res) => {
  const { id } = req.params;
  const rec = recommendations.find(r => r.id === id);
  if (rec) {
    rec.status = 'applied';
    
    // Save state reductions internally to update subsequent cost aggregations automatically
    if (rec.providerId === 'azure') dynamicCostReductions.azure += rec.monthlySaving;
    if (rec.providerId === 'aws') dynamicCostReductions.aws += rec.monthlySaving;
    if (rec.providerId === 'gcp') dynamicCostReductions.gcp += rec.monthlySaving;
    if (rec.providerId === 'm365') dynamicCostReductions.m365 += rec.monthlySaving;

    // Create an informative alert system-feedback
    alerts.unshift({
      id: `a-sys-${Date.now()}`,
      severity: 'INFO',
      category: 'Waste',
      title: 'Recommendation Executed',
      message: `Action applied successfully: "${rec.title}". Monthly run-rate successfully optimized by $${rec.monthlySaving}/mo.`,
      value: rec.monthlySaving,
      status: 'active',
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, rec });
  } else {
    res.status(404).json({ error: "Recommendation not found" });
  }
});

// Simulate Spend Anomaly trigger
app.post("/api/alerts/simulate", (req, res) => {
  const providersKeys: ProviderKey[] = ['aws', 'azure', 'gcp'];
  const categoriesSvc = ['Compute Volume Bursting', 'Object Storage Network Egress', 'Cassandra Cluster Spike'];
  const randomProv = providersKeys[Math.floor(Math.random() * providersKeys.length)];
  const randomCat = categoriesSvc[Math.floor(Math.random() * categoriesSvc.length)];
  const costSpike = Math.floor(800 + Math.random() * 1500);

  const newAlert: Alert = {
    id: `anomaly-${Date.now()}`,
    severity: 'CRITICAL',
    category: 'Anomaly',
    title: `Continuous Run-Rate Anomaly in ${randomProv.toUpperCase()}`,
    message: `Detected immediate surge in resource: ${randomCat} at ${new Date().toLocaleTimeString()}. Current cost rate: $${costSpike}/day vs $180 baseline.`,
    value: costSpike,
    threshold: 180,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  alerts.unshift(newAlert);
  res.json({ success: true, alert: newAlert });
});

// Budget management
app.get("/api/budgets", (req, res) => {
  res.json(budgets);
});

app.post("/api/budgets", (req, res) => {
  const { providerId, amount, thresholdPct, name, period } = req.body;
  const existingIndex = budgets.findIndex(b => b.providerId === providerId);
  
  const budgetObj: Budget = {
    id: existingIndex >= 0 ? budgets[existingIndex].id : `b-${Date.now()}`,
    providerId: providerId || 'multicloud',
    name: name || `${providerId.toUpperCase()} Budget`,
    amount: parseFloat(amount) || 10000,
    thresholdPct: parseInt(thresholdPct) || 80,
    period: period || 'monthly'
  };

  if (existingIndex >= 0) {
    budgets[existingIndex] = budgetObj;
  } else {
    budgets.push(budgetObj);
  }

  res.json({ success: true, budget: budgetObj });
});

// GET actionable recommendation list
app.get("/api/recommendations", (req, res) => {
  res.json(recommendations);
});

// AI OPTIMIZATION EXECUTIVE SUMMARY ROUTE via server-side Gemini
app.post("/api/ai/summary", async (req, res) => {
  const { provider } = req.body;
  const providerKey = (provider as ProviderKey) || 'multicloud';

  const relevantCosts = costRecords
    .filter(r => providerKey === 'multicloud' ? true : r.providerId === providerKey)
    .slice(0, 80); // send a healthy concise chunk of recent data to stay fast and precise

  if (!ai) {
    // Elegant descriptive demo response if API key is not yet set up
    const mockSummaries: Record<ProviderKey, string> = {
      multicloud: `*   **Aggregated MultiCloud run-rate** is stable, but **AWS EC2 spot instance rates** caused a 4.3% spike in base computing overhead.
*   Total savings potential remains high: **$12,400** identified across active cloud directories, with idle Azure SQL instances offering the fastest path to immediate reduction.
*   Recommended actions focus on transitioning 8.2 TB of neglected AWS standard S3 blocks to secure long-term cold archives.`,
      aws: `*   **AWS infrastructure costs** are trending slightly higher due to continuous unattached EBS volumes in us-east-1 ($890/mo leak).
*   **S3 Intelligent-Tiering analysis** indicates immediate potential: migration of 90-day archive logs to Glacier Deep Archive saves up to 60%.
*   Egress network fees remain standard, with no major traffic anomalies observed over the latest billing interval.`,
      azure: `*   **Azure Core Platform spend** is driven primarily by VM core counts, currently maintaining an 88% overall health score.
*   **Idle database capacity detected**: 3 SQL databases are registering sub-2% activity bounds, leaving space to safely scale standard tiers.
*   Acknowlease VM reservation boundaries to freeze the standard 1-year flat hosting tier for stable storage nodes.`,
      gcp: `*   **GCP Analytics spending** is near the budget alert limit. High utilization is recorded on BigQuery pipelines.
*   **Committed Use Discounts offer the ideal yield**: continuous compute engine telemetry reports indicate up to $4,120/mo return.
*   Network egress endpoints are running normally, with no anomalous data-sharing behaviors detected.`,
      m365: `*   **M365 SaaS subscriptions** show moderate optimization slack. 28 accounts have had no software logins for 45 days.
*   Reallocating or downgrading these licenses will lock in **$1,060/mo** in direct immediate cash savings.
*   Operational support logs suggest enterprise license creep is stable across peripheral team workspaces.`
    };

    const text = mockSummaries[providerKey] + "\n\n***[Note: Dashboard running in offline demo mode. To pull real-time live synthesis from Gemini 3.5, provide your GEMINI_API_KEY in the Settings > Secrets configuration panel!]***";
    return res.json({ summary: text });
  }

  try {
    const formattedData = relevantCosts.map(r => ({
      provider: r.providerId,
      date: r.date,
      service: r.service,
      cost: r.cost
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a certified professional FinOps and Cloud Optimizer tool. Analyze the following actual cloud costs for the provider context: "${providerKey.toUpperCase()}".
      Data array: ${JSON.stringify(formattedData)}
      Provide a concise 3-bullet executive summary (using Markdown formatting with asterisk lists) summarizing the actual cost trend, identifying the largest expense category, and emphasizing where the organization can immediately trim waste based on your expertise. Be precise, short, and use clean professional terminology.`,
      config: {
        systemInstruction: "You are an expert Cloud FinOps assistant. Your summaries are highly analytical, brief, and objective."
      }
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error("Gemini context summary failed:", error);
    res.json({
      summary: `*   **Aggregated MultiCloud run-rate** is stable, but AWS cloud databases show continuous growth.
*   Unable to reach live Gemini gateway temporarily due to network credentials or keys. Ensure key is configured.
*   Review active Recommendations to optimize computed instances immediately.`
    });
  }
});

// AI CONTEXT-AWARE COGNITIVE CHATBOT ENDPOINT via server-side Gemini
app.post("/api/ai/chat", async (req, res) => {
  const { message, activeProvider, chatHistory } = req.body;

  // Compile prompt context
  const activeStatsContext = costRecords
    .filter(r => activeProvider === 'multicloud' ? true : r.providerId === activeProvider)
    .slice(0, 30); // 30 latest cost tuples to stay lightweight

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const activeRecs = recommendations.filter(r => r.status === 'pending');

  if (!ai) {
    // Intelligent professional feedback offline fallback chatbot
    let reply = "";
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("anomaly") || lowerMessage.includes("alert") || lowerMessage.includes("spike")) {
      reply = `I noticed your continuous alerts feed includes **${activeAlerts.length} active critical anomalies**. Specifically, the sudden rate surge in AWS EC2 in us-east-1 ($1,240 rate) is the core item demanding immediate operational review. Scaling spot configurations or setting automated auto-scaling limits will stop further run-away costs.`;
    } else if (lowerMessage.includes("save") || lowerMessage.includes("recommend") || lowerMessage.includes("optimization")) {
      reply = `Currently, there list **${activeRecs.length} outstanding optimization recommendations**. The highest-yielding item is the GCP Committed Use Discount recommendation, which will save you **$4,120 monthly**. You can also execute 'Downsize Idle SQL Databases' in Azure or clean up EBS instances for instant results!`;
    } else if (lowerMessage.includes("aws") || lowerMessage.includes("amazon")) {
      reply = `AWS contains substantial spending records ($65k allocated budget). Our system detected unattached EBS volumes leaking $890/mo, and raw standard S3 buckets containing historical backups older than 90 days that could easily transition into Glacier Deep Archive. Would you like me to guide you through applying these?`;
    } else if (lowerMessage.includes("azure") || lowerMessage.includes("microsoft")) {
      reply = `Azure represents your second largest hosting center ($48k system budget). Your current efficiency index is solid. However, downsizing Azure SQL instances currently under 2% utilization is the key recommended target for right-sizing.`;
    } else {
      reply = `Hello! I'm your interactive FinOps Assistant. Analyzing your real-time cloud inventory, your actual MultiCloud month-to-date run-rate is fully managed, and we've gathered ${activeRecs.length} pending recommendations to trim waste. How can I help you today? You can ask me query trends or request direct cleanup tips!`;
    }

    reply += "\n\n*(System Note: Currently running in offline demo mode. Please provide your GEMINI_API_KEY to activate actual live generative models!)*";
    return res.json({ response: reply });
  }

  try {
    // Format helper context payload
    const systemContextStr = `
      You are an interactive FinOps assistant that helps engineers and finance directors optimize cloud costs.
      Here is the current state of the application for reference:
      - Active View Selected on UI: "${activeProvider}"
      - Pending Actionable Recommendations to Save Money: ${JSON.stringify(activeRecs.map(r => ({ title: r.title, cost: r.monthlySaving, prov: r.providerId })))}
      - Active Cost Alerts: ${JSON.stringify(activeAlerts.map(a => ({ title: a.title, value: a.value, severity: a.severity })))}
      - Sample Cost records (past week): ${JSON.stringify(activeStatsContext.slice(0, 15).map(c => ({ svc: c.service, cost: c.cost, prov: c.providerId })))}
      
      Engage with the user dynamically, answer their question with high expert precision, reference concrete numbers from the state where relevant, and offer specific FinOps strategies to resolve waste. Keep your response highly readable, elegant, and action-oriented.
    `;

    // Map chatHistory to Gemini API formats safely
    const formattedHistory = (chatHistory || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Generate output utilizing chats stream
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemContextStr
      }
    });

    res.json({ response: response.text });
  } catch (err: any) {
    console.error("Gemini generative chat error:", err);
    res.json({ response: "I encountered a minor network or API key error responding to your request live. Feel free to ask another dashboard question!" });
  }
});


// START SERVER LOGIC
async function startServer() {
  // Vite integration middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting... Listening on port ${PORT}`);
  });
}

startServer();
