import React, { useState, useEffect } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './ui/OpexOverview.module.css';

interface MonthlyData {
  month: string;
  'Direct Labor': number | null;
  'Indirect Labor': number | null;
  Materials: number | null;
  Equipment: number | null;
  Services: number | null;
  Utilities: number | null;
  Overheads: number | null;
  Total: number | null;
}

interface KPIData {
  label: string;
  value: number;
  trend: string;
}

const categoryMap = {
  'Direct Labor': 2,
  'Indirect Labor': 3,
  'Subtotal Labor': 4,
  'Materials & Consumables': 5,
  'Equipment & Tools': 6,
  'Subcontracted Services': 7,
  'Utilities': 8,
  'Overheads & Indirect Costs': 9,
  'Other Variable Costs': 10,
  'TOTAL OPEX (Actual)': 11
};

const OpexOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    monthlyData: MonthlyData[];
    kpis: KPIData[];
    insights: any;
    distributionData: any[];
  }>({
    monthlyData: [],
    kpis: [],
    insights: { trends: [], alerts: [], actions: [] },
    distributionData: []
  });

  const COLORS = {
    directLabor: '#4ECDC4',
    indirectLabor: '#2AB7CA',
    materials: '#FF9F1C',
    equipment: '#FFB7B2',
    services: '#408AB4',
    utilities: '#FFD93D',
    overheads: '#FF6B6B'
  };

  const processOPEXData = (rawData: Array<Array<any>>) => {
    const months = [
      'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
      'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25'
    ];

    const monthlyData = months.map((month, idx) => ({
        month,
        'Direct Labor': Number(rawData[categoryMap['Direct Labor']]?.[idx + 2]) || null,     // Changed from idx + 1 to idx + 2
        'Indirect Labor': Number(rawData[categoryMap['Indirect Labor']]?.[idx + 2]) || null, // Changed from idx + 1 to idx + 2
        'Materials': Number(rawData[categoryMap['Materials & Consumables']]?.[idx + 2]) || null,
        'Equipment': Number(rawData[categoryMap['Equipment & Tools']]?.[idx + 2]) || null,
        'Services': Number(rawData[categoryMap['Subcontracted Services']]?.[idx + 2]) || null,
        'Utilities': Number(rawData[categoryMap['Utilities']]?.[idx + 2]) || null,
        'Overheads': Number(rawData[categoryMap['Overheads & Indirect Costs']]?.[idx + 2]) || null,
        'Total': Number(rawData[categoryMap['TOTAL OPEX (Actual)']]?.[idx + 2]) || null
      }));

      const yearTotalData = Object.entries(categoryMap)
      .filter(([key]) => !['Subtotal Labor', 'TOTAL OPEX (Actual)', 'Other Variable Costs'].includes(key))
      .map(([name, rowIndex]) => ({
        name,
        value: Number(rawData[rowIndex]?.[14]) || 0  // Changed from 14 to 15
      }))
      .filter(item => item.value > 0);

    const getLastMonthWithData = () => {
    for (let i = 0; i < months.length; i++) {
        if (!rawData[categoryMap['TOTAL OPEX (Actual)']][i + 2]) return i - 1;
    }
    return months.length - 1;
    };

    const lastDataMonth = getLastMonthWithData();
    const latestMonth = monthlyData[lastDataMonth];
    const previousMonth = monthlyData[lastDataMonth - 1];

    const calculateTrend = (current: number | null, previous: number | null) => {
      if (!current || !previous || previous === 0) return '0.0';
      return ((current - previous) / previous * 100).toFixed(1);
    };

    const kpis = [
      {
        label: 'Total OPEX',
        value: Number(rawData[categoryMap['TOTAL OPEX (Actual)']]?.[14]) || 0,
        trend: calculateTrend(latestMonth.Total, previousMonth.Total)
      },
      {
        label: 'Labor Cost',
        value: Number(rawData[categoryMap['Subtotal Labor']]?.[14]) || 0,
        trend: calculateTrend(
          (latestMonth['Direct Labor'] || 0) + (latestMonth['Indirect Labor'] || 0),
          (previousMonth['Direct Labor'] || 0) + (previousMonth['Indirect Labor'] || 0)
        )
      },
      {
        label: 'Services',
        value: Number(rawData[categoryMap['Subcontracted Services']]?.[14]) || 0,
        trend: calculateTrend(latestMonth.Services, previousMonth.Services)
      },
      {
        label: 'Materials & Equipment',
        value: Number(rawData[categoryMap['Materials & Consumables']]?.[14]) || 0,
        trend: calculateTrend(
          (latestMonth.Materials || 0) + (latestMonth.Equipment || 0),
          (previousMonth.Materials || 0) + (previousMonth.Equipment || 0)
        )
      }
    ];

    return {
      monthlyData,
      distributionData: yearTotalData,
      kpis,
      lastDataMonth
    };
  };

  useEffect(() => {
    const loadOpexData = async () => {
      try {
        const response = await fetch('Project Performance Template.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, {
          cellStyles: true,
          cellDates: true,
          cellNF: true,
        });

        const sheet = workbook.Sheets['OPEX'];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as Array<Array<any>>;

        const { monthlyData, distributionData, kpis, lastDataMonth } = processOPEXData(rawData);

        // Generate insights using the processed data
        const insights = generateInsights(monthlyData.slice(0, lastDataMonth + 1));

        setData({
          monthlyData,
          distributionData,
          kpis,
          insights
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading OPEX data:', error);
        setLoading(false);
      }
    };

    loadOpexData();
  }, []);

  const generateInsights = (monthlyData: MonthlyData[]) => {
    const trends: string[] = [];
    const alerts: string[] = [];
    const actions: string[] = [];
  
    const latestMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
  
    const calculatePercentageChange = (current: number | null, previous: number | null) => {
      if (current === null || previous === null || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };
  
    if (latestMonth && previousMonth) {
      // 1. Labor Strategy
      const laborSum = (latestMonth['Direct Labor'] || 0) + (latestMonth['Indirect Labor'] || 0);
      const totalValue = latestMonth.Total || 0;
      const laborRatio = totalValue > 0 ? (laborSum / totalValue) * 100 : 0;
      const laborChange = calculatePercentageChange(laborSum, 
        (previousMonth['Direct Labor'] || 0) + (previousMonth['Indirect Labor'] || 0));
  
      if (laborRatio > 35 || laborChange > 10) {
        trends.push(`Labor costs represent ${laborRatio.toFixed(1)}% of total OPEX`);
        actions.push('Review labor sourcing strategy and consider automation opportunities');
      }
  
      // 2. Subcontracting Strategy
      const servicesValue = latestMonth.Services || 0;
      const servicesRatio = totalValue > 0 ? (servicesValue / totalValue) * 100 : 0;
  
      if (servicesRatio > 50) {
        alerts.push(`Critical dependency on subcontracted services (${servicesRatio.toFixed(1)}%)`);
        actions.push('Develop strategic insourcing plan for critical services');
      }
  
      // 3. Overall Cost Trend
      const totalChange = calculatePercentageChange(
        latestMonth.Total || 0,
        previousMonth.Total || 0
      );
  
      if (Math.abs(totalChange) > 10) {
        trends.push(`OPEX ${totalChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(totalChange).toFixed(1)}%`);
        if (totalChange > 0) {
          alerts.push('Significant cost escalation requires executive attention');
          actions.push('Initiate comprehensive cost optimization program');
        }
      }
  
      // 4. Resource Allocation
      const materialsAndEquipment = (latestMonth.Materials || 0) + (latestMonth.Equipment || 0);
      const assetRatio = totalValue > 0 ? (materialsAndEquipment / totalValue) * 100 : 0;
  
      if (assetRatio > 25) {
        trends.push(`High materials and equipment spend (${assetRatio.toFixed(1)}% of OPEX)`);
        actions.push('Review asset utilization and procurement strategy');
      }
    }
  
    return { 
      trends: trends.filter(Boolean).slice(0, 3), // Limit to top 3 trends
      alerts: alerts.filter(Boolean).slice(0, 2), // Limit to top 2 alerts
      actions: actions.filter(Boolean).slice(0, 2)  // Limit to top 2 actions
    };
  };


  if (loading) {
    return <div className={styles.loading}>Loading OPEX data...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>OPEX Performance Dashboard</h1>
          <p className={styles.subtitle}>Q1 2025 Analysis</p>
        </div>

        {/* KPI Section */}
        <div className={styles.kpiGrid}>
          {data.kpis.map((kpi, index) => (
            <div key={index} className={styles.kpiCard}>
              <div className={styles.kpiLabel}>{kpi.label}</div>
              <div className={styles.kpiValue}>
                QAR {(kpi.value / 1000).toFixed(1)}K
              </div>
              <div className={`${styles.kpiTrend} ${Number(kpi.trend) >= 0 ? styles.trendUp : styles.trendDown}`}>
                {Math.abs(Number(kpi.trend))}%
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className={styles.mainContent}>
          <div className={styles.chartSection}>
            <h3 className={styles.chartTitle}>Monthly OPEX Breakdown</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="month"
                    interval={0}
                />
                <YAxis />
                <Tooltip 
                    formatter={(value: any) => 
                    typeof value === 'number' ? `QAR ${(value/1000).toFixed(1)}K` : 'No data'
                    }
                />
                <Area 
                    type="monotone" 
                    dataKey="Direct Labor" 
                    stackId="1" 
                    stroke={COLORS.directLabor} 
                    fill={COLORS.directLabor}
                    name="Direct Labor"
                    connectNulls={false}
                />
                <Area 
                    type="monotone" 
                    dataKey="Indirect Labor" 
                    stackId="1" 
                    stroke={COLORS.indirectLabor} 
                    fill={COLORS.indirectLabor}
                    name="Indirect Labor"
                    connectNulls={false}
                />
                <Area 
                    type="monotone" 
                    dataKey="Materials" 
                    stackId="1" 
                    stroke={COLORS.materials} 
                    fill={COLORS.materials}
                    name="Materials & Consumables"
                    connectNulls={false}
                />
                <Area 
                    type="monotone" 
                    dataKey="Equipment" 
                    stackId="1" 
                    stroke={COLORS.equipment} 
                    fill={COLORS.equipment}
                    name="Equipment & Tools"
                    connectNulls={false}
                />
                <Area 
                    type="monotone" 
                    dataKey="Services" 
                    stackId="1" 
                    stroke={COLORS.services} 
                    fill={COLORS.services}
                    name="Subcontracted Services"
                    connectNulls={false}
                />
                {/* <Area 
                    type="monotone" 
                    dataKey="Utilities" 
                    stackId="1" 
                    stroke={COLORS.utilities} 
                    fill={COLORS.utilities}
                    name="Utilities"
                    connectNulls={false}
                /> */}
                <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartSection}>
            <h3 className={styles.chartTitle}>Cost Distribution</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                  >
                    {Object.values(COLORS).map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `QAR ${(value/1000).toFixed(1)}K`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className={styles.analysisGrid}>
          <div className={`${styles.analysisCard} ${styles.trendCard}`}>
            <h3 className={styles.cardTitle}>
              <TrendingUp className={styles.cardIcon} />
              Key Trends
            </h3>
            <ul className={styles.cardList}>
              {data.insights.trends.map((trend: string, index: number) => (
                <li key={index} className={styles.cardListItem}>{trend}</li>
              ))}
            </ul>
          </div>

          <div className={`${styles.analysisCard} ${styles.alertCard}`}>
            <h3 className={styles.cardTitle}>
              <AlertTriangle className={styles.cardIcon} />
              Alerts
            </h3>
            <ul className={styles.cardList}>
              {data.insights.alerts.map((alert: string, index: number) => (
                <li key={index} className={styles.cardListItem}>{alert}</li>
              ))}
            </ul>
          </div>

          <div className={`${styles.analysisCard} ${styles.actionCard}`}>
            <h3 className={styles.cardTitle}>
              <FileText className={styles.cardIcon} />
              Recommended Actions
            </h3>
            <ul className={styles.cardList}>
              {data.insights.actions.map((action: string, index: number) => (
                <li key={index} className={styles.cardListItem}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpexOverview;