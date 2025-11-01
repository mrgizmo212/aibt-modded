import React, { useContext } from 'react';
import { Model } from '../../types';
import { AppContext } from '../../App';
import { PencilIcon } from '../icons';

const LeaderboardRow: React.FC<{ model: Model; rank: number }> = ({ model, rank }) => {
  const { sendMessage } = useContext(AppContext);
  const isPositive = model.return >= 0;
  const returnColor = isPositive ? 'text-success' : 'text-danger';

  const handleToggle = () => {
    sendMessage(`ACTION:TOGGLE_MODEL:${model.id}`);
  }

  const handleEdit = () => {
    sendMessage(`ACTION:SHOW_EDIT_FORM:${model.id}`);
  };

  return (
    <div className="flex items-center p-3 text-sm hover:bg-surface-elevated/50">
      <div className="w-8 text-center font-mono text-text-tertiary">#{rank}</div>
      <div className="w-4">
        <div className={`w-2 h-2 rounded-full ${model.status === 'running' ? 'bg-success animate-pulse' : 'bg-text-disabled'}`}></div>
      </div>
      <div className="flex-1 font-medium text-text-primary truncate px-2">{model.name}</div>
      <div className="w-28 text-right font-mono text-text-primary">${model.portfolio.toLocaleString()}</div>
      <div className={`w-20 text-right font-mono font-semibold ${returnColor}`}>{isPositive ? '+' : ''}{model.return.toFixed(1)}%</div>
      <div className="w-28 text-right flex items-center justify-end gap-2">
         <button onClick={handleEdit} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-border rounded-md transition-colors" aria-label={`Edit ${model.name}`}>
          <PencilIcon className="w-4 h-4" />
        </button>
        <button onClick={handleToggle} className={`w-20 py-1 text-xs font-medium rounded-md transition-colors ${
          model.status === 'running' 
            ? 'bg-danger/90 text-white hover:bg-danger' 
            : 'bg-success/90 text-white hover:bg-success'
        }`}>
          {model.status === 'running' ? 'Stop' : 'Start'}
        </button>
      </div>
    </div>
  );
};

interface ModelCardsProps {
    modelCount: number;
}

const ModelCards: React.FC<ModelCardsProps> = ({ modelCount }) => {
  const { models } = useContext(AppContext);
  const modelsToShow = models.slice(0, modelCount);

  const groupedModels = modelsToShow.reduce((acc, model) => {
    const key = model.strategy || 'Uncategorized';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  // Sort groups by key and sort models within groups by return
  const sortedGroupedModels = Object.keys(groupedModels)
    .sort()
    .map(strategy => {
      const sortedModels = groupedModels[strategy].sort((a, b) => b.return - a.return);
      return { strategy, models: sortedModels };
    });

  return (
    <div className="space-y-6 my-2">
      {sortedGroupedModels.map(({ strategy, models }) => (
        <div key={strategy}>
          <h3 className="text-sm font-semibold text-text-secondary mb-2 px-2 uppercase tracking-wide">{strategy}</h3>
          <div className="bg-surface border border-border rounded-lg divide-y divide-border">
            {models.map((model, index) => (
              <LeaderboardRow key={model.id} model={model} rank={index + 1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ModelCards;