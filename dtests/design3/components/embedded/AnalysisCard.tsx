import React, { useContext } from 'react';
import { TrendingDownIcon, AlertTriangleIcon, ScaleIcon, RefreshCwIcon, PlusIcon } from '../icons';
import { AppContext } from '../../App';

const AnalysisCard: React.FC = () => {
    const { sendMessage } = useContext(AppContext);
    
    const applyAllRules = () => {
        sendMessage('ACTION:APPLY_ANALYSIS_RULES');
    };
    
    const addRule = (ruleText: string) => {
        sendMessage(`Applied rule: ${ruleText}`);
    };

    return (
        <div className="bg-surface border border-border rounded-lg overflow-hidden my-2">
            <header className="flex items-center gap-3 p-4 bg-danger/10 border-b border-danger/20">
                <TrendingDownIcon className="w-6 h-6 text-danger" />
                <div>
                    <h3 className="font-semibold text-text-primary">Run #12 Analysis</h3>
                    <p className="text-xs font-mono text-text-secondary">❌ -5.2% • 23 trades • 6.5 hours</p>
                </div>
            </header>

            <div className="p-4 space-y-4">
                <Issue
                    severity="high"
                    icon={<AlertTriangleIcon className="w-5 h-5 text-danger" />}
                    title="No Stop-Loss Protection"
                    badge="Biggest Impact"
                    description="Your biggest loss was -$215 on TSLA (trade #7 at 11:15am). The AI held this position down -8.6% before selling."
                    actionText="Add Stop-Loss at -5%"
                    onActionClick={() => addRule('Add Stop-Loss at -5%')}
                />
                 <Issue
                    severity="medium"
                    icon={<ScaleIcon className="w-5 h-5 text-warning" />}
                    title="Poor Win/Loss Ratio"
                    description="Winners averaged $45 but losers averaged $87. You need winners 2x bigger than losers to profit."
                    actionText="Add Profit Target at +10%"
                    onActionClick={() => addRule('Add Profit Target at +10%')}
                >
                    <div className="flex items-center gap-4 text-sm font-mono mt-2">
                        <div><span className="text-text-secondary">Avg Win: </span><span className="text-success">$45</span></div>
                        <div><span className="text-text-secondary">Avg Loss: </span><span className="text-danger">$87</span></div>
                        <div><span className="text-text-secondary">Ratio: </span><span className="text-danger">1:1.9</span></div>
                    </div>
                </Issue>
                <Issue
                    severity="low"
                    icon={<RefreshCwIcon className="w-5 h-5 text-warning" />}
                    title="Overtrading"
                    description="23 trades in 6.5 hours = 1 trade every 17 minutes. Many were whipsaw entries/exits."
                    actionText="Add Min Hold Time: 30min"
                    onActionClick={() => addRule('Add Min Hold Time: 30min')}
                />
            </div>

            <div className="p-4 bg-info/10 border-t border-info/20">
                 <p className="text-sm text-info/90">💡 With these 3 rules, this run could have changed from -5.2% loss to +2.1% gain.</p>
            </div>
            
            <div className="p-4 flex flex-col sm:flex-row gap-2 border-t border-border">
                <button onClick={applyAllRules} className="w-full px-4 py-2 text-sm font-medium bg-info text-white hover:bg-blue-500 rounded-md transition-colors">Apply All 3 Rules</button>
                <button className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-text-secondary hover:bg-border rounded-md transition-colors">View Trade Log</button>
            </div>
        </div>
    );
};

interface IssueProps {
    severity: 'high' | 'medium' | 'low';
    icon: React.ReactNode;
    title: string;
    badge?: string;
    description: string;
    actionText: string;
    onActionClick: () => void;
    children?: React.ReactNode;
}

const Issue: React.FC<IssueProps> = ({ icon, title, badge, description, actionText, onActionClick, children }) => (
    <div className="bg-surface-elevated p-3 rounded-md border border-border">
        <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {icon}
                <h4 className="font-semibold text-text-primary text-sm">{title}</h4>
            </div>
            {badge && <span className="text-xs bg-danger/20 text-danger px-2 py-0.5 rounded-full">{badge}</span>}
        </header>
        {children}
        <p className="text-sm text-text-secondary mt-2">{description}</p>
        <button onClick={onActionClick} className="flex items-center gap-2 mt-3 px-3 py-1.5 text-xs font-medium bg-info/20 text-info hover:bg-info/30 rounded-md transition-colors">
            <PlusIcon className="w-4 h-4" />
            <span>{actionText}</span>
        </button>
    </div>
);


export default AnalysisCard;