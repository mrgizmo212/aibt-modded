import React, { useState, useContext } from 'react';
import { CpuIcon, ZapIcon, DollarSignIcon, BrainIcon, FileTextIcon, TrashIcon } from '../icons';
import { AppContext } from '../../App';
import { Model } from '../../types';

interface EditModelFormProps {
    model: Model;
    messageId: string;
}

const FormSection: React.FC<{ icon: React.ReactNode, label: string, children: React.ReactNode }> = ({ icon, label, children }) => (
    <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            {icon}
            <span>{label}</span>
        </label>
        {children}
    </div>
);

const EditModelForm: React.FC<EditModelFormProps> = ({ model, messageId }) => {
    const { sendMessage } = useContext(AppContext);
    const [formData, setFormData] = useState<Model>(model);

    const canSubmit = formData.name.trim() && !isNaN(formData.portfolio) && formData.portfolio > 0;

    const handleChange = (field: keyof Model, value: string | number) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleUpdate = () => {
        if (!canSubmit) return;
        const payload = JSON.stringify({ model: formData, messageId });
        sendMessage(`ACTION:UPDATE_MODEL:${payload}`);
    };
    
    const handleDelete = () => {
        if(window.confirm(`Are you sure you want to permanently delete the model "${model.name}"? This action cannot be undone.`)) {
            const payload = JSON.stringify({ modelId: model.id, messageId });
            sendMessage(`ACTION:DELETE_MODEL:${payload}`);
        }
    };

    const handleCancel = () => {
        sendMessage(`ACTION:CANCEL_EDIT:${messageId}`);
    };

    return (
        <div className="bg-surface border border-border rounded-lg p-6 my-2 space-y-6">
            <h3 className="font-semibold text-lg text-text-primary">Edit Model</h3>
            
            <FormSection icon={<BrainIcon className="w-4 h-4" />} label="Model Name">
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full bg-background border border-border rounded-md p-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-info"
                />
            </FormSection>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormSection icon={<ZapIcon className="w-4 h-4" />} label="Trading Strategy">
                    <select value={formData.strategy} onChange={(e) => handleChange('strategy', e.target.value)} className="w-full bg-background border border-border rounded-md p-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-info">
                        <option>Momentum</option>
                        <option>Scalping</option>
                        <option>Long Term</option>
                        <option>Swing Trading</option>
                        <option>Conservative</option>
                        <option>Day Trading</option>
                        <option>Options</option>
                    </select>
                </FormSection>
                 <FormSection icon={<DollarSignIcon className="w-4 h-4" />} label="Portfolio (USD)">
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
                        <input
                            type="number"
                            value={formData.portfolio}
                            onChange={(e) => handleChange('portfolio', parseInt(e.target.value, 10) || 0)}
                            min="1"
                            className="w-full bg-background border border-border rounded-md p-2.5 pl-7 text-text-primary focus:outline-none focus:ring-2 focus:ring-info"
                        />
                     </div>
                </FormSection>
            </div>
            
            <FormSection icon={<FileTextIcon className="w-4 h-4" />} label="Model Instructions (System Prompt)">
                <textarea
                    value={formData.instructions || ''}
                    onChange={(e) => handleChange('instructions', e.target.value)}
                    rows={4}
                    className="w-full bg-background border border-border rounded-md p-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-info"
                />
            </FormSection>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
                 <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 rounded-md transition-colors">
                    <TrashIcon className="w-4 h-4" />
                    Delete Model
                 </button>
                <div className="flex gap-2">
                    <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-border rounded-md transition-colors">Cancel</button>
                    <button onClick={handleUpdate} disabled={!canSubmit} className="px-4 py-2 text-sm font-medium bg-info text-white hover:bg-blue-500 rounded-md transition-colors disabled:bg-surface-elevated disabled:text-text-disabled disabled:cursor-not-allowed">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default EditModelForm;