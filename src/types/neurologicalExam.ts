export interface NeurologicalExamData {
  fascia?: string | null;
  atitude?: string | null;
  dominancia?: string | null;
  marcha?: string | null;
  forca_muscular?: {
    face?: MuscleAssessment;
    lingua?: MuscleAssessment;
    msd?: MuscleAssessment;
    mse?: MuscleAssessment;
    mid?: MuscleAssessment;
    mie?: MuscleAssessment;
    coluna?: MuscleAssessment;
  };
  sensibilidade?: {
    cabeca?: SensitivityAssessment;
    torax?: SensitivityAssessment;
    mmss?: SensitivityAssessment;
    abdome?: SensitivityAssessment;
    mmii?: SensitivityAssessment;
  };
  coordenacao?: {
    status?: string | null;
    lado?: string | null;
    index_nariz?: boolean;
    romberg?: boolean;
    calcanhar_joelho?: boolean;
    diadococinesia?: boolean;
  };
  nervos_cranianos?: {
    ii?: string;
    iii?: string;
    iv?: string;
    vi?: string;
    v?: string;
    vii?: string;
    viii?: string;
    ix?: string;
    x?: string;
    xi?: string;
    xii?: string;
    pupilas_d?: string;
    pupilas_e?: string;
    fundo_olho?: string | null;
    campo?: string;
  };
  cognitivo?: {
    orient_temp?: string;
    orient_esp?: string;
    mem_imed?: string;
    calculo?: string;
    mem_evoc?: string;
    nomeacao?: string;
    repeticao?: string;
    leitura?: string;
    comando?: string;
    total_score?: string;
  };
  fluencia_verbal?: string | null;
  escala_glasgow?: number | null;
  reflexos_wexler?: {
    biceps_d?: string;
    biceps_e?: string;
    triceps_d?: string;
    triceps_e?: string;
    estiloradial_d?: string;
    estiloradial_e?: string;
    patelar_d?: string;
    patelar_e?: string;
    aquileu_d?: string;
    aquileu_e?: string;
    axiais_face?: string;
    grasping?: string;
    groping?: string;
    hoffmann?: string;
    palmo_mentoniano?: string;
    wartenberg?: string;
  };
  dermatomos_marcardos?: Record<string, 'normal' | 'hipoestesia' | 'parestesia' | 'hiperestesia' | 'dor'>;
  campo_visual_quadrantes?: {
    olho_d?: { sup_temp?: boolean; sup_nasal?: boolean; inf_temp?: boolean; inf_nasal?: boolean };
    olho_e?: { sup_temp?: boolean; sup_nasal?: boolean; inf_temp?: boolean; inf_nasal?: boolean };
  };
  desenho_pentagonos?: string | null; // base64 canvas drawing
  anotacao_diagrama_imagem?: string | null; // base64 freehand drawing overlay on anatomical sheet
}

export interface MuscleAssessment {
  tonus?: string;
  trofismo?: string;
  mov_anormais?: string;
  deformidades?: string;
  fatigabilidade?: string;
}

export interface SensitivityAssessment {
  proprio?: string;
  vibrat?: string;
  temp?: string;
  dor?: string;
  toque?: string;
}

