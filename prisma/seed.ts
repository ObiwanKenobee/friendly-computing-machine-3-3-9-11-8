/**
 * Database Seeding Script
 * Populates the database with initial data for development and testing
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create sample users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "demo@quantumvest.com" },
      update: {},
      create: {
        email: "demo@quantumvest.com",
        username: "demo_user",
        passwordHash: "hashed_demo_password",
        firstName: "Demo",
        lastName: "User",
        country: "US",
        language: "en",
        currency: "USD",
        riskTolerance: "MODERATE",
        investmentExperience: "INTERMEDIATE",
        subscriptionTier: "PROFESSIONAL",
        subscriptionStatus: "ACTIVE",
        kycStatus: "APPROVED",
        verificationLevel: "ENHANCED",
      },
    }),
    prisma.user.upsert({
      where: { email: "investor@quantumvest.com" },
      update: {},
      create: {
        email: "investor@quantumvest.com",
        username: "quantum_investor",
        passwordHash: "hashed_investor_password",
        firstName: "Alex",
        lastName: "Chen",
        country: "SG",
        language: "en",
        currency: "USD",
        riskTolerance: "AGGRESSIVE",
        investmentExperience: "EXPERT",
        subscriptionTier: "ENTERPRISE",
        subscriptionStatus: "ACTIVE",
        kycStatus: "APPROVED",
        verificationLevel: "PREMIUM",
        annualIncome: 250000,
        netWorth: 1500000,
      },
    }),
    prisma.user.upsert({
      where: { email: "cultural@quantumvest.com" },
      update: {},
      create: {
        email: "cultural@quantumvest.com",
        username: "cultural_investor",
        passwordHash: "hashed_cultural_password",
        firstName: "Amara",
        lastName: "Okafor",
        country: "NG",
        language: "en",
        currency: "USD",
        riskTolerance: "MODERATE",
        investmentExperience: "INTERMEDIATE",
        subscriptionTier: "PROFESSIONAL",
        subscriptionStatus: "ACTIVE",
        kycStatus: "APPROVED",
        verificationLevel: "ENHANCED",
        culturalFramework: "African Ubuntu",
        ethicalPreferences: ["ESG_FOCUSED", "COMMUNITY_DEVELOPMENT"],
        impactPriorities: ["EDUCATION", "HEALTHCARE", "SUSTAINABILITY"],
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create sample vaults
  const vaults = await Promise.all([
    prisma.vault.create({
      data: {
        userId: users[0].id,
        name: "Growth Portfolio",
        description: "Diversified growth-focused investment portfolio",
        vaultType: "PERSONAL_PORTFOLIO",
        strategy: "ACTIVE_GROWTH",
        minimumInvestment: 1000,
        totalValue: 25000,
        availableCash: 2500,
        investedAmount: 22500,
        riskScore: 7.5,
        isQuantumEnabled: true,
      },
    }),
    prisma.vault.create({
      data: {
        userId: users[1].id,
        name: "Quantum Optimization Fund",
        description: "AI-powered quantum-optimized investment strategy",
        vaultType: "QUANTUM_FUND",
        strategy: "QUANTUM_OPTIMIZED",
        minimumInvestment: 10000,
        totalValue: 150000,
        availableCash: 15000,
        investedAmount: 135000,
        riskScore: 8.2,
        isQuantumEnabled: true,
      },
    }),
    prisma.vault.create({
      data: {
        userId: users[2].id,
        name: "Ubuntu Impact Fund",
        description:
          "Community-focused impact investments aligned with Ubuntu values",
        vaultType: "IMPACT_FUND",
        strategy: "IMPACT_FIRST",
        minimumInvestment: 500,
        totalValue: 45000,
        availableCash: 5000,
        investedAmount: 40000,
        riskScore: 6.0,
        culturalAlignment: 9.2,
        impactScore: 8.8,
        esgRating: "A+",
      },
    }),
  ]);

  console.log(`✅ Created ${vaults.length} vaults`);

  // Create AI agents for quantum-enabled vaults
  const agents = await Promise.all([
    prisma.vaultAgentAI.create({
      data: {
        vaultId: vaults[0].id,
        name: "Growth Optimizer AI",
        agentType: "BALANCED_AI",
        modelVersion: "v2.1.0",
        confidenceThreshold: 0.8,
        quantumOptimized: true,
        isActive: true,
        autoTradingEnabled: false,
        maxDailyTrades: 5,
        maxRiskExposure: 0.03,
        riskParameters: {
          maxVolatility: 0.25,
          maxDrawdown: 0.15,
          riskBudget: 0.05,
        },
        tradingRules: {
          minConfidence: 0.75,
          maxPositionSize: 0.1,
          stopLossThreshold: 0.08,
        },
      },
    }),
    prisma.vaultAgentAI.create({
      data: {
        vaultId: vaults[1].id,
        name: "Quantum Alpha AI",
        agentType: "QUANTUM_AI",
        modelVersion: "v3.0.0",
        confidenceThreshold: 0.85,
        quantumOptimized: true,
        isActive: true,
        autoTradingEnabled: true,
        maxDailyTrades: 20,
        maxRiskExposure: 0.05,
        quantumCircuits: [
          "portfolio_optimization",
          "risk_assessment",
          "market_prediction",
        ],
        coherenceTime: 50.0,
        fidelityScore: 0.995,
        riskParameters: {
          maxVolatility: 0.35,
          maxDrawdown: 0.2,
          riskBudget: 0.08,
          quantumRiskFactors: {
            entanglementDecay: 0.02,
            decoherenceRate: 0.001,
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${agents.length} AI agents`);

  // Create sample holdings
  const holdings = await Promise.all([
    // Holdings for Growth Portfolio
    prisma.holding.create({
      data: {
        vaultId: vaults[0].id,
        assetId: "AAPL",
        assetType: "STOCK",
        symbol: "AAPL",
        name: "Apple Inc.",
        quantity: 50,
        averageCost: 180.5,
        currentPrice: 195.25,
        marketValue: 9762.5,
        unrealizedPnL: 737.5,
        weight: 38.8,
        acquisitionDate: new Date("2024-01-15"),
        initialCost: 9025.0,
      },
    }),
    prisma.holding.create({
      data: {
        vaultId: vaults[0].id,
        assetId: "TSLA",
        assetType: "STOCK",
        symbol: "TSLA",
        name: "Tesla Inc.",
        quantity: 25,
        averageCost: 220.0,
        currentPrice: 235.8,
        marketValue: 5895.0,
        unrealizedPnL: 395.0,
        weight: 23.4,
        acquisitionDate: new Date("2024-02-01"),
        initialCost: 5500.0,
      },
    }),
    // Holdings for Quantum Fund
    prisma.holding.create({
      data: {
        vaultId: vaults[1].id,
        assetId: "QQQ",
        assetType: "ETF",
        symbol: "QQQ",
        name: "Invesco QQQ Trust",
        quantity: 200,
        averageCost: 380.0,
        currentPrice: 395.5,
        marketValue: 79100.0,
        unrealizedPnL: 3100.0,
        weight: 52.7,
        acquisitionDate: new Date("2024-01-10"),
        initialCost: 76000.0,
      },
    }),
    // Holdings for Impact Fund
    prisma.holding.create({
      data: {
        vaultId: vaults[2].id,
        assetId: "ESGU",
        assetType: "ETF",
        symbol: "ESGU",
        name: "iShares MSCI USA ESG Select ETF",
        quantity: 300,
        averageCost: 120.0,
        currentPrice: 125.6,
        marketValue: 37680.0,
        unrealizedPnL: 1680.0,
        weight: 83.7,
        acquisitionDate: new Date("2024-01-20"),
        initialCost: 36000.0,
        impactScore: 8.5,
        culturalAlignment: 9.0,
        esgRating: "A",
      },
    }),
  ]);

  console.log(`✅ Created ${holdings.length} holdings`);

  // Create sample transactions
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        userId: users[0].id,
        vaultId: vaults[0].id,
        type: "DEPOSIT",
        totalAmount: 25000,
        fee: 0,
        status: "COMPLETED",
        settlementDate: new Date("2024-01-10"),
        confirmedAt: new Date("2024-01-10"),
        description: "Initial portfolio funding",
        currency: "USD",
      },
    }),
    prisma.transaction.create({
      data: {
        userId: users[1].id,
        vaultId: vaults[1].id,
        type: "DEPOSIT",
        totalAmount: 150000,
        fee: 0,
        status: "COMPLETED",
        settlementDate: new Date("2024-01-05"),
        confirmedAt: new Date("2024-01-05"),
        description: "Quantum fund initial investment",
        currency: "USD",
      },
    }),
    prisma.transaction.create({
      data: {
        userId: users[0].id,
        vaultId: vaults[0].id,
        type: "BUY",
        assetId: "AAPL",
        assetSymbol: "AAPL",
        quantity: 50,
        price: 180.5,
        totalAmount: 9025,
        fee: 7.5,
        status: "COMPLETED",
        settlementDate: new Date("2024-01-15"),
        confirmedAt: new Date("2024-01-15"),
        description: "Purchase Apple shares",
      },
    }),
  ]);

  console.log(`✅ Created ${transactions.length} transactions`);

  // Create sample rituals
  const rituals = await Promise.all([
    prisma.ritual.create({
      data: {
        userId: users[0].id,
        vaultId: vaults[0].id,
        name: "Monthly Growth Investment",
        description: "Automated monthly investment in growth portfolio",
        ritualType: "DOLLAR_COST_AVERAGING",
        frequency: "MONTHLY",
        amountPerExecution: 1000,
        maxMonthlyAmount: 1000,
        targetAssets: ["AAPL", "GOOGL", "MSFT"],
        triggerConditions: {
          dayOfMonth: 1,
          timeOfDay: "09:30",
        },
        actions: {
          type: "invest",
          allocation: { AAPL: 0.4, GOOGL: 0.3, MSFT: 0.3 },
        },
        isActive: true,
        executionCount: 3,
        totalInvested: 3000,
        nextExecution: new Date("2024-03-01T09:30:00Z"),
      },
    }),
    prisma.ritual.create({
      data: {
        userId: users[2].id,
        vaultId: vaults[2].id,
        name: "ESG Rebalancing",
        description: "Quarterly rebalancing with ESG screening",
        ritualType: "REBALANCING",
        frequency: "QUARTERLY",
        triggerConditions: {
          rebalanceThreshold: 0.05,
          esgMinimumRating: "B+",
        },
        actions: {
          type: "rebalance",
          targetAllocation: {
            ESG_STOCKS: 0.6,
            GREEN_BONDS: 0.3,
            IMPACT_FUNDS: 0.1,
          },
          esgFilters: ["exclude_fossil_fuels", "minimum_diversity_score"],
        },
        culturalCriteria: {
          alignmentScore: 8.0,
          communityImpact: true,
          traditionalValues: ["ubuntu", "community_first"],
        },
        isActive: true,
        executionCount: 1,
        nextExecution: new Date("2024-04-01T10:00:00Z"),
      },
    }),
  ]);

  console.log(`✅ Created ${rituals.length} rituals`);

  // Create sample impact indices
  const impactIndices = await Promise.all([
    prisma.impactIndex.create({
      data: {
        userId: users[2].id,
        period: "2024-Q1",
        totalImpactScore: 8.7,
        environmentalScore: 8.5,
        socialScore: 9.2,
        governanceScore: 8.4,
        carbonSaved: 2.5, // tons CO2
        jobsCreated: 12,
        communitiesServed: 3,
        waterConserved: 50000, // liters
        renewableEnergy: 15000, // kWh
        totalInvestment: 40000,
        impactPerDollar: 0.0002175,
        portfolioSize: 45000,
        culturalAlignment: 9.2,
        localImpact: 8.8,
        traditionRespect: 9.5,
        communityBenefit: 9.0,
        verified: true,
        verificationSource: "Impact Verification Agency",
        dataSources: [
          "company_reports",
          "third_party_audits",
          "community_feedback",
        ],
        confidence: 0.92,
      },
    }),
  ]);

  console.log(`✅ Created ${impactIndices.length} impact indices`);

  // Create sample agent decisions
  const agentDecisions = await Promise.all([
    prisma.agentDecision.create({
      data: {
        agentId: agents[0].id,
        decisionType: "BUY_ORDER",
        assetSymbol: "MSFT",
        action: "BUY",
        quantity: 30,
        targetPrice: 420.0,
        reasoning: "Strong quarterly earnings and cloud growth prospects",
        confidence: 0.82,
        executed: true,
        executedAt: new Date("2024-02-15T10:30:00Z"),
        executionPrice: 418.5,
        executionFee: 5.25,
        successful: true,
        actualReturn: 0.035,
        expectedReturn: 0.028,
      },
    }),
    prisma.agentDecision.create({
      data: {
        agentId: agents[1].id,
        decisionType: "REBALANCE",
        assetSymbol: "PORTFOLIO",
        action: "REBALANCE",
        quantity: 1,
        reasoning:
          "Quantum optimization suggests rebalancing to reduce portfolio risk while maintaining expected returns",
        confidence: 0.91,
        quantumProbability: 0.89,
        entanglementFactors: {
          correlationMatrix: [
            [1.0, 0.65, 0.42],
            [0.65, 1.0, 0.38],
            [0.42, 0.38, 1.0],
          ],
          quantumAdvantage: 0.15,
          coherenceScore: 0.94,
        },
        executed: false,
      },
    }),
  ]);

  console.log(`✅ Created ${agentDecisions.length} agent decisions`);

  // Create sample notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[0].id,
        type: "TRANSACTION_UPDATE",
        title: "Investment Completed",
        message:
          "Your purchase of 50 AAPL shares has been completed at $180.50 per share.",
        priority: "MEDIUM",
        actionUrl: "/vault/" + vaults[0].id,
        actionLabel: "View Portfolio",
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[1].id,
        type: "AGENT_DECISION",
        title: "AI Recommendation",
        message:
          "Quantum Alpha AI suggests rebalancing your portfolio for optimal risk-adjusted returns.",
        priority: "HIGH",
        actionUrl: "/vault/" + vaults[1].id + "/ai",
        actionLabel: "Review Recommendation",
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[2].id,
        type: "IMPACT_MILESTONE",
        title: "Impact Milestone Reached",
        message:
          "Your investments have helped create 12 new jobs in local communities this quarter!",
        priority: "MEDIUM",
        actionUrl: "/impact-report",
        actionLabel: "View Impact Report",
      },
    }),
  ]);

  console.log(`✅ Created ${notifications.length} notifications`);

  console.log("🎉 Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`  • ${users.length} Users created`);
  console.log(`  • ${vaults.length} Vaults created`);
  console.log(`  • ${agents.length} AI Agents created`);
  console.log(`  • ${holdings.length} Holdings created`);
  console.log(`  • ${transactions.length} Transactions created`);
  console.log(`  • ${rituals.length} Rituals created`);
  console.log(`  • ${impactIndices.length} Impact Indices created`);
  console.log(`  • ${agentDecisions.length} Agent Decisions created`);
  console.log(`  • ${notifications.length} Notifications created`);
  console.log("\n🚀 Ready to start developing!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
