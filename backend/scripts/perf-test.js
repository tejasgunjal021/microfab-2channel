const fs = require('fs-extra');
const path = require('path');
const { getStartupGovContract, getInvestorInvestContract } = require('../gateway');

async function runPerfTest(count = 20) {
  console.log(`🚀 Starting Performance Test: ${count} transactions...`);
  const results = {
    timestamp: new Date().toISOString(),
    count,
    govLatencies: [],
    investLatencies: [],
    summary: {}
  };

  try {
    const govContract = await getStartupGovContract();
    const investContract = await getInvestorInvestContract();

    // 1. Measure Gov Channel (Registering Demo Startups)
    console.log('--- Benchmarking Gov Channel ---');
    for (let i = 1; i <= count; i++) {
      const start = Date.now();
      const id = `perf_s_${Date.now()}_${i}`;
      await govContract.submitTransaction('RegisterStartup', 
        id, `Perf Startup ${i}`, `p${i}@test.com`, `PAN${i}X`, `GST${i}Y`, 
        '2022-01-01', 'Tech', 'Pvt', 'India', 'KA', 'BLR', 'web.com', 'desc', '2022', 'Founder'
      );
      const latency = Date.now() - start;
      results.govLatencies.push(latency);
      console.log(`  Tx ${i}/${count}: ${latency}ms`);
    }

    // 2. Measure Invest Channel (Registering Demo Investors)
    console.log('--- Benchmarking Invest Channel ---');
    for (let i = 1; i <= count; i++) {
      const start = Date.now();
      const id = `perf_i_${Date.now()}_${i}`;
      await investContract.submitTransaction('RegisterInvestor',
        id, `Perf Inv ${i}`, `i${i}@test.com`, `IPAN${i}`, '123456789012', 
        'angel', 'India', 'KA', 'BLR', 'Tech', 'small', '1000000', 'Org'
      );
      const latency = Date.now() - start;
      results.investLatencies.push(latency);
      console.log(`  Tx ${i}/${count}: ${latency}ms`);
    }

    // Summarize
    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    results.summary = {
      avgGov: avg(results.govLatencies).toFixed(2),
      avgInvest: avg(results.investLatencies).toFixed(2),
      totalTime: results.govLatencies.concat(results.investLatencies).reduce((a, b) => a + b, 0)
    };

    const filePath = path.join(__dirname, '../perf-results.json');
    await fs.writeJSON(filePath, results, { spaces: 2 });
    console.log(`✅ Done! Results saved to ${filePath}`);
    return results;
  } catch (error) {
    console.error('❌ Perf Test Failed:', error);
    throw error;
  }
}

module.exports = { runPerfTest };

if (require.main === module) {
  runPerfTest().then(() => process.exit(0)).catch(() => process.exit(1));
}
