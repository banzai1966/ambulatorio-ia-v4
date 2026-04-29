export interface IntegrativeChecklistData {
  suplementos: {
    colina: string;
    hidroxi_triptofano: string;
    fenilalanina: string;
    melatonina: string;
    ac_alfa_lipoico: string;
    semente_uva: string;
    coenzima_q10: string;
    astragalus: string;
    dhea: string;
    epa_dha: string;
    mix_pro: string;
    coriandrum: string;
    propolis: string;
    propco: string;
    mix_d9: string;
    ginger: string;
    acido_caprilico: string;
    bitter_mellon: string;
    arnica: string;
    myosothis: string;
    hip_perfuratum: string;
    neurexan: string;
    floral_bach: string;
    acido_folico: string;
    vit_b3_b6: string;
    pregne: string;
    heteropterys: string;
    arcalion: string;
    vinpocetina: string;
    fosfatidilserina: string;
    fosfatidilcolina: string;
    dmae: string;
  };
  fitoterapicos_especiais: {
    organo_gt: string;
    dna_rna_ch: string;
    organo_gt_2: string;
    dna_rna_ch_2: string;
    organo_gt_3: string;
    dna_rna_ch_3: string;
    artemisia: string;
    phaffia: string;
    chlorella: string;
    acai: string;
    mulateiro: string;
    cmc: string;
    formula_onco_vo: string;
    formula_onco_inalat: string;
    vovo_meca: string;
    euphorbia: string;
    zedoaria: string;
    naltrex: string;
    nootropil: string;
  };
  vitaminas_minerais: {
    silimarina: string;
    quercetina: string;
    saw_palmetto: string;
    pygeum: string;
    tribulus: string;
    litio: string;
    cardiopeptase: string;
    betaina: string;
    taurina: string;
    vit_d3: string;
    ca_mg_zn: string;
    vit_k2: string;
    selenio: string;
    manganes: string;
    cu: string;
    cromo: string;
    lugol: string;
  };
  biomarcadores: {
    telomero: string;
    sirtuina: string;
    integrin: string;
    thromboxane: string;
    crisotila: string;
    hg: string;
    pb: string;
    al: string;
  };
  neurotransmissores_hormonios: {
    acetylcholine: string;
    serotonin: string;
    dopamine: string;
    cortisol: string;
    substance_p: string;
    b_amyloid: string;
    homocystine: string;
    troponin: string;
    c_fos: string;
  };
  patogenos: {
    candida: string;
    c_trachomatis: string;
    b_burgdorferi: string;
    c_pneumoniae: string;
    mycobact_tbc: string;
    mycobact_avium: string;
    hsv_type_1: string;
    hsv_type_2: string;
    zoster_virus: string;
    cmv_5: string;
  };
}

export const initialIntegrativeData: IntegrativeChecklistData = {
  suplementos: {
    colina: '', hidroxi_triptofano: '', fenilalanina: '', melatonina: '',
    ac_alfa_lipoico: '', semente_uva: '', coenzima_q10: '',
    astragalus: '', dhea: '', epa_dha: '', mix_pro: '', coriandrum: '',
    propolis: '', propco: '', mix_d9: '', ginger: '', acido_caprilico: '',
    bitter_mellon: '', arnica: '', myosothis: '', hip_perfuratum: '',
    neurexan: '', floral_bach: '', acido_folico: '', vit_b3_b6: '',
    pregne: '', heteropterys: '', arcalion: '', vinpocetina: '',
    fosfatidilserina: '', fosfatidilcolina: '', dmae: ''
  },
  fitoterapicos_especiais: {
    organo_gt: '', dna_rna_ch: '', 
    organo_gt_2: '', dna_rna_ch_2: '',
    organo_gt_3: '', dna_rna_ch_3: '',
    artemisia: '', phaffia: '', 
    chlorella: '', acai: '', mulateiro: '', cmc: '', 
    formula_onco_vo: '', formula_onco_inalat: '', vovo_meca: '',
    euphorbia: '', zedoaria: '', naltrex: '', nootropil: ''
  },
  vitaminas_minerais: {
    silimarina: '', quercetina: '', saw_palmetto: '', pygeum: '',
    tribulus: '', litio: '', cardiopeptase: '', betaina: '',
    taurina: '', vit_d3: '', ca_mg_zn: '', vit_k2: '',
    selenio: '', manganes: '', cu: '', cromo: '', lugol: ''
  },
  biomarcadores: {
    telomero: '', sirtuina: '', integrin: '', thromboxane: '',
    crisotila: '', hg: '', pb: '', al: ''
  },
  neurotransmissores_hormonios: {
    acetylcholine: '', serotonin: '', dopamine: '', cortisol: '',
    substance_p: '', b_amyloid: '', homocystine: '', troponin: '',
    c_fos: ''
  },
  patogenos: {
    candida: '', c_trachomatis: '', b_burgdorferi: '', c_pneumoniae: '',
    mycobact_tbc: '', mycobact_avium: '', hsv_type_1: '', hsv_type_2: '',
    zoster_virus: '', cmv_5: ''
  }
};
