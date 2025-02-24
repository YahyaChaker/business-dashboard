// src/App.tsx
//import React from 'react';
import CompactProjectHeader from './components/CompactProjectHeader';
import ExcelFileCard from './components/ExcelFileCard';
import FinancialOverview from './components/FinancialOverview';
import KpiFinanceDashboard from './components/KPIandBilling';
import ManpowerAnalysis from './components/ManpowerAnalysis';
import OpexOverview from './components/OPEXOverviewCard';
import ExecutiveDashboard from './components/PPMandWOs';
import SystemsOverview from './components/SystemsOverview';


const App = () => {
  return (
    <div className="flemin-h-screen bg-gray-50">
    {/*<div className="min-h-screen bg-gray-50">*/}
      {/* Header Section */}
      <CompactProjectHeader />
      <ExcelFileCard />
      <FinancialOverview />
      <OpexOverview />    
      <KpiFinanceDashboard />
      <ManpowerAnalysis />
      <ExecutiveDashboard />
      <SystemsOverview />
      
      {/* Main Content Section */}
      <main className="container mx-auto p-6">
        {/* Add your other components and content here */}
      </main>
    </div>    
  );
};

export default App;