import React, { useState, useContext } from 'react';
import { CpuIcon, ZapIcon, DollarSignIcon, BrainIcon, FileTextIcon } from '../icons';
import { AppContext } from '../../App';

const FormSection: React.FC<{ icon: React.ReactNode, label: string, children: React.ReactNode }> = ({ icon, label, children }) => (
    <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            {icon}
            <span>{label}</span>
        </label>
        {children}
    </div>
);

const CreateModelForm: React.FC = () => {
    const { sendMessage } = useContext(AppContext);
    const [name, setName] = useState('');
    const [baseAi, setBaseAi] = useState('GPT-5 Turbo');
    const [strategy, setStrategy] = useState('Momentum');
    const [portfolio, setPortfolio] = useState('10000');
    const [instructions, setInstructions] = useState('');

    const canSubmit = name.trim() && !isNaN(parseInt(portfolio, 10)) && parseInt(portfolio, 10) > 0;

    const handleSubmit = () => {
        if (!canSubmit) return;
        const payload = JSON.stringify({ 
            name: name.trim(), 
            baseAi, 
            strategy, 
            portfolio, 
            instructions: instructions.trim() 
        });
        sendMessage(`ACTION:CREATE_MODEL:${payload}`);
    };

    return (
        <div className="bg-surface border border-border rounded-lg p-6 my-2 space-y-6">
            <h3 className="font-semibold text-lg text-text-primary">Create New Trading Model</h3>
            
            <FormSection icon={<BrainIcon className="w-4 h-4" />} label="Model Name">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., My Awesome Bot"
                    className="w-full bg-background border border-border rounded-md p-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-info"
                />
            </FormSection>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormSection icon={<CpuIcon className="w-4 h-4" />} label="Base AI">
                    <select value={baseAi} onChange={(e) => setBaseAi(e.target.value)} className="w-full bg-background border border-border rounded-md p-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-info">
                        <option>GPT-5 Turbo</option>
                        <option>Claude 3.5 Sonnet</option>
                        <option>Gemini 2.5 Pro</option>
                        <option>DeepSeek Coder V2</option>
                    </select>
                </FormSection>

                <FormSection icon={<ZapIcon className="w-4 h-4" />} label="Trading Strategy">
                    <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="w-full bg-background border border-border rounded-md p-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-info">
                        <option>Momentum</option>
                        <option>Long Term</option>
                        <option>Conservative</option>
                        <option>Day Trading</option>
                        <option>Scalping</option>
                        <option>Swing Trading</option>
                        <option>Options</option>
                    </select>
                </FormSection>
            </div>
            
            <FormSection icon={<FileTextIcon className="w-4 h-4" />} label="Model Instructions (System Prompt)">
                <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="You are a cautious trading bot that prioritizes capital preservation..."
                    rows={4}
                    className="w-full bg-background border border-border rounded-md p-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-info"
                />
            </FormSection>

            <FormSection icon={<DollarSignIcon className="w-4 h-4" />} label="Initial Portfolio (USD)">
                 <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
                    <input
                        type="number"
                        value={portfolio}
                        onChange={(e) => setPortfolio(e.target.value)}
                        placeholder="10000"
                        min="1"
                        className="w-full bg-background border border-border rounded-md p-2.5 pl-7 text-text-primary focus:outline-none focus:ring-2 focus:ring-info"
                    />
                 </div>
            </FormSection>

            <div className="flex justify-end gap-2 pt-2">
                <button className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-border rounded-md transition-colors">Cancel</button>
                <button onClick={handleSubmit} disabled={!canSubmit} className="px-4 py-2 text-sm font-medium bg-info text-white hover:bg-blue-500 rounded-md transition-colors disabled:bg-surface-elevated disabled:text-text-disabled disabled:cursor-not-allowed">Create Model →</button>
            </div>
        </div>
    );
};

export default CreateModelForm;