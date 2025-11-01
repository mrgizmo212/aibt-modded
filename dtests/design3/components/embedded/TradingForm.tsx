import React, { useState, useContext } from 'react';
import { InfoIcon } from '../icons';
import { AppContext } from '../../App';

const FormSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-text-secondary">{label}</label>
    {children}
  </div>
);

const TradingForm: React.FC = () => {
    const { sendMessage } = useContext(AppContext);
    const [tradingMode, setTradingMode] = useState('intraday');
    const [session, setSession] = useState('regular');
    
    const handleSubmit = () => {
        sendMessage('ACTION:START_CLAUDE_TRADE');
    };

    return (
        <div className="bg-surface border border-border rounded-lg p-6 my-2 space-y-6">
            <h3 className="font-semibold text-lg text-text-primary">Start Trading - Claude Day Trader</h3>
            
            <FormSection label="Trading Mode">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <RadioOption id="intraday" name="tradingMode" label="Intraday" description="Today's market - live trading" checked={tradingMode === 'intraday'} onChange={setTradingMode} />
                    <RadioOption id="daily" name="tradingMode" label="Daily" description="Historical backtest" checked={tradingMode === 'daily'} onChange={setTradingMode} />
                </div>
            </FormSection>

            <FormSection label="Symbol">
                <select className="w-full bg-background border border-border rounded-md p-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-info">
                    <option>AAPL</option>
                    <option>MSFT</option>
                    <option>NVDA</option>
                    <option>TSLA</option>
                </select>
            </FormSection>

            <FormSection label="Session">
                <div className="flex bg-background border border-border rounded-md p-1">
                    <ButtonOption label="Regular" active={session === 'regular'} onClick={() => setSession('regular')} />
                    <ButtonOption label="Pre-Market" active={session === 'pre-market'} onClick={() => setSession('pre-market')} />
                    <ButtonOption label="After-Hours" active={session === 'after-hours'} onClick={() => setSession('after-hours')} />
                </div>
            </FormSection>

            <div className="flex items-start gap-3 p-3 text-sm rounded-md bg-info/10 border border-info/20 text-info">
                <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                <p>This will create Run #13 using Claude 4.5 Sonnet</p>
            </div>

            <div className="flex justify-end gap-2">
                <button className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-border rounded-md transition-colors">Cancel</button>
                <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium bg-info text-white hover:bg-blue-500 rounded-md transition-colors">Start Trading →</button>
            </div>
        </div>
    );
};

const RadioOption: React.FC<{ id: string, name: string, label: string, description: string, checked: boolean, onChange: (id: string) => void }> = ({ id, name, label, description, checked, onChange }) => (
    <label htmlFor={id} className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${checked ? 'bg-info/10 border-info/50' : 'border-border hover:bg-border/50'}`}>
        <input type="radio" id={id} name={name} checked={checked} onChange={() => onChange(id)} className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-info" />
        <div>
            <p className="font-medium text-text-primary">{label}</p>
            <p className="text-xs text-text-secondary">{description}</p>
        </div>
    </label>
);

const ButtonOption: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
    <button onClick={onClick} className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${active ? 'bg-surface-elevated text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
        {label}
    </button>
);

export default TradingForm;