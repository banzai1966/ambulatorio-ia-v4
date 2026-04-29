export interface SpecialtyField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  placeholder?: string;
}

export interface SpecialtyTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  promptContext: string;
  fields: SpecialtyField[];
}

export const SPECIALTIES: SpecialtyTemplate[] = [
  {
    id: 'standard',
    name: '🩺 Clínico',
    icon: 'Stethoscope',
    description: 'Anamnese clínica geral padrão.',
    promptContext: 'Foque em uma anamnese clínica geral, extraindo queixa principal, histórico e conduta básica.',
    fields: []
  },
  {
    id: 'neurological',
    name: '🧠 Neurológico',
    icon: 'Brain',
    description: 'Exame neurológico detalhado e cognitivo.',
    promptContext: 'Foque em um exame neurológico completo, incluindo nervos cranianos, força muscular, reflexos, sensibilidade e cognição.',
    fields: []
  },
  {
    id: 'integrative',
    name: '⚡ Integrativo',
    icon: 'Zap',
    description: 'Checklist de bioressonância e suplementação.',
    promptContext: 'Foque em medicina integrativa. Mapeie suplementos, fitoterápicos, vitaminas, minerais e biomarcadores para as chaves exatas do checklist_integrativo. Ex: "Silimarina" -> vitaminas_minerais.silimarina: true.',
    fields: []
  },
  {
    id: 'pediatrics',
    name: '👶 Pediatria',
    icon: 'Baby',
    description: 'Desenvolvimento infantil e puericultura.',
    promptContext: 'Foque no desenvolvimento infantil, marcos do crescimento, vacinação e queixas pediátricas.',
    fields: [
      { id: 'peso', label: 'Peso (kg)', type: 'number', placeholder: 'Ex: 12.5' },
      { id: 'altura', label: 'Altura (cm)', type: 'number', placeholder: 'Ex: 95' },
      { id: 'perimetro_cefalico', label: 'Perímetro Cefálico (cm)', type: 'number' },
      { id: 'vacinas_em_dia', label: 'Vacinas em dia?', type: 'boolean' }
    ]
  },
  {
    id: 'cardiology',
    name: '❤️ Cardiologia',
    icon: 'Activity',
    description: 'Avaliação cardiovascular e risco.',
    promptContext: 'Foque em saúde cardiovascular, pressão arterial, frequência cardíaca e fatores de risco.',
    fields: [
      { id: 'pa_sistolica', label: 'PA Sistólica', type: 'number', placeholder: '120' },
      { id: 'pa_diastolica', label: 'PA Diastólica', type: 'number', placeholder: '80' },
      { id: 'frequencia_cardiaca', label: 'FC (bpm)', type: 'number' },
      { id: 'tabagista', label: 'Tabagista?', type: 'boolean' }
    ]
  },
  {
    id: 'psychiatry',
    name: '🧠 Psiquiatria',
    icon: 'Brain',
    description: 'Avaliação de saúde mental e humor.',
    promptContext: 'Foque em saúde mental, estado de humor, qualidade do sono, apetite e adesão à medicação atual.',
    fields: [
      { id: 'humor_predominante', label: 'Humor Predominante', type: 'select', options: ['Eutímico', 'Deprimido', 'Ansioso', 'Irritável', 'Elevado'] },
      { id: 'qualidade_sono', label: 'Qualidade do Sono', type: 'select', options: ['Boa', 'Regular', 'Insônia Inicial', 'Insônia de Manutenção', 'Hipersônia'] },
      { id: 'medicacao_atual', label: 'Medicação em Uso', type: 'text', placeholder: 'Ex: Fluoxetina 20mg' },
      { id: 'ideacao_suicida', label: 'Ideação Suicida?', type: 'boolean' }
    ]
  }
];
