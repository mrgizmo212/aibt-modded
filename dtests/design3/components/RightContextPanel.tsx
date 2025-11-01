import React, { useContext } from 'react';
import { Model, Position } from '../types';
import { ActivityIcon, CheckCircleIcon, ServerIcon, TrendingDownIcon, TrendingUpIcon, PencilIcon } from './icons';
import { MOCK_POSITIONS_BY_MODEL } from '../constants';
import { AppContext } from '../App';

interface RightContextPanelProps {
  model: Model | undefined;
}

const DashboardContext: React.FC = () => (
    <>
        <Section title="Recent Activity" icon={<ActivityIcon className="w-5 h-5" />}>
            <div className="space-y-3">
                <ActivityItem icon={<TrendingUpIcon className="text-success" />} text="GPT-5: BUY AAPL 10 @ $180.50" time="14:45:23" />
                <ActivityItem icon={<TrendingDownIcon className="text-danger" />} text="Gemini: SELL TSLA 5 @ $245.00" time="14:30:15" />
                <ActivityItem icon={<CheckCircleIcon className="text-success" />} text="Run #12 completed" time="14:15:00" />
            </div>
        </Section>
    </>
);

const ModelContext: React.FC<{ model: Model }> = ({ model }) => {
    const { sendMessage } = useContext(AppContext);
    const modelData = MOCK_POSITIONS_BY_MODEL[model.id] || { positions: [], cash: model.portfolio };

    const handleEdit = () => {
        sendMessage(`ACTION:SHOW_EDIT_FORM:${model.id}`);
    };

    return (
        <>
            <div className="flex items-start justify-between pb-6 border-b border-border mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-text-primary">{model.name}</h2>
                    <p className="text-sm text-text-secondary">{model.strategy}</p>
                </div>
                <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary bg-surface border border-border rounded-md hover:bg-border hover:text-text-primary transition-colors"
                >
                    <PencilIcon className="w-4 h-4" />
                    <span>Edit</span>
                </button>
            </div>
            <div className="space-y-8">
                <Section title="Live Updates" badge={<span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">Streaming</span>}>
                     <div className="bg-background border border-border rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs space-y-2">
                        <p><span className="text-text-tertiary">14:45:23</span> Analyzing market...</p>
                        <p><span className="text-success">14:45:25 ✓ BUY signal: AAPL</span></p>
                        <p><span className="text-text-primary">14:45:27</span> Executing: BUY 10 AAPL @ $180.50</p>
                    </div>
                </Section>
                <Section title="Current Positions">
                    {modelData.positions.length > 0 ? (
                         <PositionsTable positions={modelData.positions} cash={modelData.cash} />
                    ) : (
                        <div className="text-center text-sm text-text-tertiary py-4">No open positions.</div>
                    )}
                </Section>
            </div>
        </>
    );
}

const RunContext: React.FC<{ model: Model }> = ({ model }) => (
    <>
        <Section title={`Run #${model.run} Stats`}>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <StatCard label="Final Return" value="-1.2%" valueClass="text-danger font-mono" />
                <StatCard label="Total Trades" value="23" />
                <StatCard label="Win Rate" value="35%" trend="↓ Below average" trendClass="text-danger" />
                <StatCard label="Duration" value="6.5 hours" />
            </div>
        </Section>
         <Section title="Trade Timeline">
            <div className="relative h-12 flex items-center">
                <div className="w-full h-0.5 bg-border"></div>
                <div className="absolute flex w-full justify-between px-2">
                    <div className="w-2 h-2 rounded-full bg-success" title="Winning trade"></div>
                    <div className="w-2 h-2 rounded-full bg-success" title="Winning trade"></div>
                    <div className="w-2 h-2 rounded-full bg-danger" title="Losing trade"></div>
                    <div className="w-2 h-2 rounded-full bg-danger" title="Losing trade"></div>
                    <div className="w-2 h-2 rounded-full bg-danger" title="Losing trade"></div>
                </div>
            </div>
            <p className="text-xs text-text-tertiary text-center mt-1">Losses started midway through the run.</p>
        </Section>
    </>
);


const RightContextPanel: React.FC<RightContextPanelProps> = ({ model }) => {
    const { context } = useContext(AppContext);

    const renderContent = () => {
        switch (context) {
            case 'model':
            case 'model_live':
                return model ? <ModelContext model={model} /> : <DashboardContext />;
            case 'run':
                return model ? <RunContext model={model} /> : <DashboardContext />;
            case 'dashboard':
            default:
                return <DashboardContext />;
        }
    };

    return (
        <div className="h-full overflow-y-auto p-6">
            {renderContent()}
        </div>
    );
};


// Helper sub-components
const Section: React.FC<{ title: string; icon?: React.ReactNode; badge?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, badge, children }) => (
    <section>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                {icon && <span className="text-text-tertiary">{icon}</span>}
                <h3 className="font-semibold text-text-primary">{title}</h3>
            </div>
            {badge}
        </div>
        <div>{children}</div>
    </section>
);

const ActivityItem: React.FC<{ icon: React.ReactNode; text: string; time: string }> = ({ icon, text, time }) => (
    <div className="flex items-start gap-3">
        <div className="w-5 h-5 flex-shrink-0 mt-0.5">{icon}</div>
        <div>
            <p className="text-sm text-text-primary">{text}</p>
            <p className="text-xs text-text-tertiary">{time}</p>
        </div>
    </div>
);

const PositionsTable: React.FC<{ positions: Position[], cash: number }> = ({ positions, cash }) => (
    <div className="text-xs border border-border rounded-lg overflow-hidden">
        <table className="w-full">
            <thead className="bg-background text-text-tertiary">
                <tr>
                    <th className="p-2 text-left font-medium">Symbol</th>
                    <th className="p-2 text-right font-medium">Qty</th>
                    <th className="p-2 text-right font-medium">Value</th>
                    <th className="p-2 text-right font-medium">P/L</th>
                </tr>
            </thead>
            <tbody>
                {positions.map(p => (
                    <tr key={p.symbol} className="border-t border-border hover:bg-border/50">
                        <td className="p-2 font-semibold text-text-primary">{p.symbol}</td>
                        <td className="p-2 text-right font-mono text-text-secondary">{p.shares}</td>
                        <td className="p-2 text-right font-mono text-text-primary">${p.value.toFixed(2)}</td>
                        <td className={`p-2 text-right font-mono ${p.pnl && p.pnl >= 0 ? 'text-success' : 'text-danger'}`}>{p.pnl ? (p.pnl > 0 ? `+$${p.pnl.toFixed(2)}` : `-$${Math.abs(p.pnl).toFixed(2)}`) : '-'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
         <div className="flex justify-between items-center p-2 bg-background border-t-2 border-border">
            <span className="font-semibold text-text-primary">Cash</span>
            <span className="font-mono font-bold text-text-primary">${cash.toFixed(2)}</span>
        </div>
    </div>
);

const StatCard: React.FC<{ label: string, value: string, valueClass?: string, trend?: string, trendClass?: string }> = ({ label, value, valueClass, trend, trendClass }) => (
    <div className="bg-surface p-3 rounded-lg border border-border">
        <p className="text-xs text-text-secondary mb-1">{label}</p>
        <p className={`text-lg font-semibold ${valueClass || 'text-text-primary'}`}>{value}</p>
        {trend && <p className={`text-xs ${trendClass || 'text-text-tertiary'}`}>{trend}</p>}
    </div>
);


export default RightContextPanel;