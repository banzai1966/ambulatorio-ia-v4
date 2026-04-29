import React from 'react';
import { SPECIALTIES } from '../constants/specialties';
import { cn } from '../lib/utils';

interface Props {
  specialtyId: string;
  data: any;
  onChange: (data: any) => void;
}

export default function SpecialtyFields({ specialtyId, data, onChange }: Props) {
  const specialty = SPECIALTIES.find(s => s.id === specialtyId);
  
  if (!specialty || specialty.fields.length === 0) return null;

  const updateField = (id: string, value: any) => {
    onChange({ ...data, [id]: value });
  };

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-4 bg-clinical-blue rounded-full"></div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Dados de {specialty.name}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {specialty.fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-1">
              {field.label}
            </label>
            
            {field.type === 'boolean' ? (
              <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => updateField(field.id, true)}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    data[field.id] === true ? "bg-clinical-blue text-white shadow-md" : "text-slate-400 hover:bg-slate-50"
                  )}
                >
                  Sim
                </button>
                <button
                  onClick={() => updateField(field.id, false)}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    data[field.id] === false ? "bg-red-500 text-white shadow-md" : "text-slate-400 hover:bg-slate-50"
                  )}
                >
                  Não
                </button>
              </div>
            ) : (
              <input
                type="text"
                inputMode={field.type === 'number' ? 'decimal' : 'text'}
                value={data[field.id] !== undefined && data[field.id] !== null && data[field.id] !== 'null' ? (
                  field.id === 'altura' && typeof data[field.id] === 'number' && data[field.id] < 3 
                    ? data[field.id].toFixed(2).replace('.', ',') 
                    : String(data[field.id]).replace('.', ',')
                ) : ''}
                onChange={(e) => {
                  const val = e.target.value.replace(',', '.');
                  if (field.type === 'number') {
                    const num = parseFloat(val);
                    updateField(field.id, isNaN(num) ? val : num);
                  } else {
                    updateField(field.id, e.target.value);
                  }
                }}
                placeholder={field.placeholder}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-clinical-blue focus:border-transparent transition-all text-sm shadow-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
